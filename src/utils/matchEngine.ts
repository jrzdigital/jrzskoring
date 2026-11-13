/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure Online In-Memory Scoring & State Reconciliation Engine
 * Mengelola evaluasi konsensus juri, kontrol babak/waktu, penalti dewan,
 * dan rekonsiliasi state sebelum disinkronkan secara real-time ke Firebase RTDB.
 */

import { MatchState, FighterColor, ActionType, MatchStatus } from "../types";
import { createDefaultMatchState } from "./defaultMatchState";

function normalizeCorner(fighter?: string): "MERAH" | "BIRU" {
  const f = String(fighter || "").toUpperCase();
  return f === "BIRU" || f === "BLUE" ? "BIRU" : "MERAH";
}

function normalizeAction(action?: string): "PUKULAN" | "TENDANGAN" | "JATUHAN" | string {
  const a = String(action || "").toUpperCase();
  if (a === "PUNCH" || a === "PUKULAN") return "PUKULAN";
  if (a === "KICK" || a === "TENDANGAN") return "TENDANGAN";
  if (a === "DROP" || a === "JATUHAN") return "JATUHAN";
  return a;
}

function syncCornerMirrors(state: MatchState) {
  const redScore = state.merah?.skor ?? state.scoreRed ?? 0;
  const blueScore = state.biru?.skor ?? state.scoreBlue ?? 0;
  if (state.merah) {
    state.merah.skor = redScore;
    if (state.merah.scoreDetails) state.merah.scoreDetails.total = redScore;
  }
  if (state.biru) {
    state.biru.skor = blueScore;
    if (state.biru.scoreDetails) state.biru.scoreDetails.total = blueScore;
  }
  state.scoreRed = redScore;
  state.scoreBlue = blueScore;
}

class MatchEngine {
  private currentState: MatchState | null = null;
  private subscribers: ((state: MatchState) => void)[] = [];

  public getState(): MatchState | null {
    return this.currentState;
  }

  public setState(state: MatchState): void {
    if (!state) return;
    this.currentState = state;
    this.notifySubscribers(state);
  }

  public subscribe(listener: (state: MatchState) => void): () => void {
    this.subscribers.push(listener);
    if (this.currentState) {
      try {
        listener(this.currentState);
      } catch {}
    }
    return () => {
      this.subscribers = this.subscribers.filter((l) => l !== listener);
    };
  }

  private notifySubscribers(state: MatchState) {
    this.subscribers.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error("Error in matchEngine subscriber:", e);
      }
    });
  }

  public broadcast(state: MatchState, isSilent: boolean = false): void {
    if (!state) return;
    this.currentState = state;
    if (!isSilent) {
      this.notifySubscribers(state);
    }
  }

  public stampStateMutation(evaluated: MatchState, base?: MatchState): void {
    const baseVersion = base ? Number(base.stateVersion || 0) : Number(evaluated.stateVersion || 0);
    evaluated.stateVersion = baseVersion + 1;
    evaluated.lastUpdatedAt = Date.now();
  }

  public reconcileMatchStates(
    local: MatchState | null,
    remote: MatchState | null,
    isLocalNewerManual?: boolean
  ): { merged: MatchState; localIsNewer: boolean } {
    if (!remote && local) return { merged: local, localIsNewer: true };
    if (!local && remote) return { merged: remote, localIsNewer: false };
    if (!local && !remote) return { merged: createDefaultMatchState(), localIsNewer: false };

    const loc = local!;
    const rem = remote!;

    const isDifferentMatch = Boolean(
      (loc.id && rem.id && loc.id !== rem.id) ||
      (loc.matchNumber && rem.matchNumber && String(loc.matchNumber) !== String(rem.matchNumber))
    );

    if (isDifferentMatch) {
      const locTime = Number(loc.lastUpdatedAt) || 0;
      const remTime = Number(rem.lastUpdatedAt) || 0;
      const chooseLocal = isLocalNewerManual !== undefined ? isLocalNewerManual : locTime >= remTime;
      const chosen = chooseLocal ? loc : rem;
      return { merged: chosen, localIsNewer: chooseLocal };
    }

    const locVersion = Number(loc.stateVersion) || 0;
    const remVersion = Number(rem.stateVersion) || 0;
    const locTime = Number(loc.lastUpdatedAt) || 0;
    const remTime = Number(rem.lastUpdatedAt) || 0;

    const localIsNewer =
      isLocalNewerManual !== undefined
        ? isLocalNewerManual
        : locVersion > remVersion || (locVersion === remVersion && locTime > remTime);

    const base = localIsNewer ? loc : rem;
    const secondary = localIsNewer ? rem : loc;

    const mergedActiveJuryPresses = {
      ...(secondary.activeJuryPresses || {}),
      ...(base.activeJuryPresses || {})
    };

    const redSkor = Math.max(secondary.merah?.skor ?? secondary.scoreRed ?? 0, base.merah?.skor ?? base.scoreRed ?? 0);
    const blueSkor = Math.max(secondary.biru?.skor ?? secondary.scoreBlue ?? 0, base.biru?.skor ?? base.scoreBlue ?? 0);

    const merged: MatchState = {
      ...secondary,
      ...base,
      fighterRedName: base.fighterRedName || secondary.fighterRedName,
      fighterBlueName: base.fighterBlueName || secondary.fighterBlueName,
      fighterRedClub: base.fighterRedClub || secondary.fighterRedClub,
      fighterBlueClub: base.fighterBlueClub || secondary.fighterBlueClub,
      kategori: base.kategori || secondary.kategori,
      category: base.category || secondary.category,
      classCategory: base.classCategory || secondary.classCategory,
      stateVersion: Math.max(locVersion, remVersion),
      scoreRed: redSkor,
      scoreBlue: blueSkor,
      merah: {
        ...secondary.merah,
        ...base.merah,
        skor: redSkor
      },
      biru: {
        ...secondary.biru,
        ...base.biru,
        skor: blueSkor
      },
      activeJuryPresses: mergedActiveJuryPresses,
      logs:
        Array.isArray(base.logs) && base.logs.length >= (secondary.logs?.length || 0)
          ? base.logs
          : secondary.logs || []
    };

    return { merged, localIsNewer };
  }

  public evaluateAndApplyConsensus(current: MatchState, now: number): { state: MatchState; scored: boolean } {
    const updated = JSON.parse(JSON.stringify(current)) as MatchState;
    let scored = false;

    if (!updated.activeJuryPresses) {
      updated.activeJuryPresses = { 1: null, 2: null, 3: null };
    }
    if (!updated.logs) {
      updated.logs = [];
    }

    const presses: { juryId: number; fighter: string; action: string; pressedAt: number }[] = [];
    [1, 2, 3].forEach((jId) => {
      const p = updated.activeJuryPresses?.[jId];
      if (p && !p.consumed && now - (p.pressedAt || 0) <= 2000) {
        presses.push({
          juryId: jId,
          fighter: normalizeCorner(p.fighter),
          action: normalizeAction(p.action),
          pressedAt: p.pressedAt
        });
      }
    });

    const groups: Record<string, typeof presses> = {};
    presses.forEach((p) => {
      const key = `${p.fighter}_${p.action}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    for (const [key, juryList] of Object.entries(groups)) {
      if (juryList.length >= 2) {
        const [fighter, action] = key.split("_");
        const pointVal = action === "PUKULAN" ? 1 : action === "TENDANGAN" ? 2 : action === "JATUHAN" ? 3 : 1;
        const isMerah = fighter === "MERAH";
        const target = isMerah ? updated.merah : updated.biru;

        if (target) {
          target.skor = (target.skor || 0) + pointVal;
          if (!target.scoreDetails) {
            target.scoreDetails = { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: 0 };
          }
          if (action === "PUKULAN") target.scoreDetails.pukulan += 1;
          else if (action === "TENDANGAN") target.scoreDetails.tendangan += 1;
          else if (action === "JATUHAN") target.scoreDetails.jatuhan += 1;
          target.scoreDetails.total = target.skor;
        }
        if (isMerah) updated.scoreRed = target?.skor ?? (updated.scoreRed || 0) + pointVal;
        else updated.scoreBlue = target?.skor ?? (updated.scoreBlue || 0) + pointVal;

        const juryIds = juryList.map((j) => j.juryId);
        juryIds.forEach((id) => {
          if (updated.activeJuryPresses?.[id]) {
            updated.activeJuryPresses[id].consumed = true;
          }
        });

        const activeR = updated.activeRound || updated.currentRound || 1;
        updated.logs.unshift({
          id: `scored_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          round: activeR,
          fighter: fighter as FighterColor,
          action: action as ActionType,
          type: action,
          points: pointVal,
          timestamp: now,
          desc: `POIN SAH KONSENSUS: ${action} ${fighter} (Juri ${juryIds.join(", ")})`,
          description: `POIN SAH KONSENSUS: ${action} ${fighter} (Juri ${juryIds.join(", ")})`,
          uncounted: false,
          juryIds
        });

        scored = true;
        break;
      }
    }

    return { state: updated, scored };
  }

  public processJuryPress(
    baseState: MatchState,
    juryId: number,
    fighter: FighterColor,
    action: ActionType,
    customPressId?: string,
    nowTime?: number
  ): MatchState {
    const now = nowTime || Date.now();
    const current: MatchState = JSON.parse(JSON.stringify(baseState));
    const normAction = normalizeAction(action);

    if (!current.activeJuryPresses) {
      current.activeJuryPresses = { 1: null, 2: null, 3: null };
    }
    if (!current.juryPressHistory) {
      current.juryPressHistory = [];
    }
    if (!current.logs) {
      current.logs = [];
    }

    current.activeJuryPresses[juryId] = {
      fighter,
      action,
      pressedAt: now,
      consumed: false
    };

    current.juryPressHistory.push({
      id: customPressId || `press_${juryId}_${now}`,
      juryId,
      fighter,
      action,
      timestamp: now,
      consumed: false
    });

    const pointVal = normAction === "PUKULAN" ? 1 : normAction === "TENDANGAN" ? 2 : 1;
    const activeR = current.activeRound || current.currentRound || 1;

    current.logs.unshift({
      id: customPressId || `log_${juryId}_${now}`,
      round: activeR,
      fighter,
      action,
      type: String(action),
      points: pointVal,
      timestamp: now,
      source: `Juri ${juryId}`,
      desc: `PERCOBAAN POIN: Juri ${juryId} menekan ${action} ${fighter}`,
      description: `PERCOBAAN POIN: Juri ${juryId} menekan ${action} ${fighter}`,
      uncounted: true
    });

    const { state: evaluated } = this.evaluateAndApplyConsensus(current, now);
    this.stampStateMutation(evaluated, baseState);
    this.setState(evaluated);
    this.broadcast(evaluated);

    return evaluated;
  }

  public processJuryUndo(
    currentState: MatchState,
    juryId: number,
    fighter?: FighterColor
  ): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    if (!updated.logs || updated.logs.length === 0) return updated;

    const normFilter = fighter ? normalizeCorner(fighter) : null;
    const idx = updated.logs.findIndex((l) => {
      const matchJury = l.juryIds?.includes(juryId) || l.source?.includes(String(juryId));
      const matchFighter = !normFilter || normalizeCorner(l.fighter) === normFilter;
      return matchFighter && (matchJury || !l.juryIds);
    });

    if (idx !== -1) {
      const removed = updated.logs.splice(idx, 1)[0];
      if (removed && !removed.uncounted) {
        const isMerah = normalizeCorner(removed.fighter) === "MERAH";
        const target = isMerah ? updated.merah : updated.biru;
        if (target) {
          target.skor = Math.max(0, (target.skor || 0) - (removed.points || 0));
          if (target.scoreDetails) {
            target.scoreDetails.total = target.skor;
          }
        }
        syncCornerMirrors(updated);
      }
    }

    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processTimerTick(currentState: MatchState): MatchState {
    const updated: MatchState = { ...currentState };
    const currentTimer = updated.timeLeft !== undefined ? updated.timeLeft : updated.roundTimer;

    if (currentTimer > 0 && updated.status === MatchStatus.RUNNING) {
      const nextTime = Math.max(0, currentTimer - 1);
      updated.timeLeft = nextTime;
      updated.roundTimer = nextTime;

      if (nextTime === 0) {
        updated.status = MatchStatus.ROUND_BREAK;
      }
    }

    updated.lastUpdatedAt = Date.now();
    this.setState(updated);
    return updated;
  }

  public processTimerCommand(
    currentState: MatchState,
    command: "START" | "PAUSE" | "ADD_10" | "SUB_10" | "RESET"
  ): MatchState {
    const updated: MatchState = { ...currentState };
    const dur = updated.roundDuration || 120;
    let timerVal = updated.timeLeft !== undefined ? updated.timeLeft : updated.roundTimer;

    switch (command) {
      case "START":
        updated.status = MatchStatus.RUNNING;
        break;
      case "PAUSE":
        updated.status = MatchStatus.PAUSED;
        break;
      case "ADD_10":
        timerVal = Math.min(dur, timerVal + 10);
        updated.timeLeft = timerVal;
        updated.roundTimer = timerVal;
        break;
      case "SUB_10":
        timerVal = Math.max(0, timerVal - 10);
        updated.timeLeft = timerVal;
        updated.roundTimer = timerVal;
        break;
      case "RESET":
        updated.timeLeft = dur;
        updated.roundTimer = dur;
        updated.status = MatchStatus.PENDING;
        break;
    }

    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    return updated;
  }

  public processRoundAction(
    currentState: MatchState,
    roundAction: "NEXT" | "SET" | "FINISH",
    targetRound?: number
  ): MatchState {
    const updated: MatchState = { ...currentState };
    const curR = updated.activeRound || updated.currentRound || 1;

    if (roundAction === "NEXT") {
      const nextR = curR + 1;
      updated.activeRound = nextR;
      updated.currentRound = nextR;
      updated.timeLeft = updated.roundDuration || 120;
      updated.roundTimer = updated.roundDuration || 120;
      updated.status = MatchStatus.READY;
    } else if (roundAction === "SET" && targetRound) {
      updated.activeRound = targetRound;
      updated.currentRound = targetRound;
      updated.timeLeft = updated.roundDuration || 120;
      updated.roundTimer = updated.roundDuration || 120;
    } else if (roundAction === "FINISH") {
      updated.status = MatchStatus.FINISHED;
      const redScore = updated.merah?.skor ?? updated.scoreRed ?? 0;
      const blueScore = updated.biru?.skor ?? updated.scoreBlue ?? 0;
      if (redScore > blueScore) {
        updated.winner = "MERAH";
        updated.winnerColor = "MERAH";
        updated.winMethod = "MENANG_ANGKA";
      } else if (blueScore > redScore) {
        updated.winner = "BIRU";
        updated.winnerColor = "BIRU";
        updated.winMethod = "MENANG_ANGKA";
      } else {
        updated.winner = null;
        updated.winnerColor = null;
      }
    }

    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processDewanAction(
    currentState: MatchState,
    actionData: {
      command:
        | "DROP"
        | "LOCK"
        | "PENALTY"
        | "OVERRIDE"
        | "CANCEL_DROP"
        | "RESET_ROUND_PENALTIES"
        | "DECLARE_VICTORY"
        | "PUNCH"
        | "CANCEL_PUNCH"
        | "KICK"
        | "CANCEL_KICK";
      fighter: "RED" | "BLUE";
      penaltyType?: string;
      overridePoints?: number;
      victoryType?: string;
    }
  ): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    const isRed = actionData.fighter === "RED";
    const fighterColor: FighterColor = isRed ? "MERAH" : "BIRU";
    const target = isRed ? updated.merah : updated.biru;
    const now = Date.now();
    const activeR = updated.activeRound || updated.currentRound || 1;

    if (!updated.logs) updated.logs = [];

    switch (actionData.command) {
      case "DROP": {
        target.skor = (target.skor || 0) + 3;
        if (!target.scoreDetails) {
          target.scoreDetails = { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: 0 };
        }
        target.scoreDetails.jatuhan += 1;
        target.scoreDetails.total = target.skor;
        updated.logs.unshift({
          id: `drop_${now}`,
          round: activeR,
          fighter: fighterColor,
          action: "JATUHAN",
          points: 3,
          timestamp: now,
          desc: `Jatuhan Sah Dewan (+3 Poin ${fighterColor})`,
          description: `Jatuhan Sah Dewan (+3 Poin ${fighterColor})`
        });
        break;
      }
      case "CANCEL_DROP": {
        target.skor = Math.max(0, (target.skor || 0) - 3);
        if (target.scoreDetails) {
          target.scoreDetails.jatuhan = Math.max(0, target.scoreDetails.jatuhan - 1);
          target.scoreDetails.total = target.skor;
        }
        break;
      }
      case "PENALTY": {
        const penType = actionData.penaltyType || "TEGURAN_1";
        let deduction = 0;
        let pLabel = "Teguran";
        if (penType.includes("TEGURAN_1")) {
          deduction = -1;
          pLabel = "Teguran 1 (-1)";
        } else if (penType.includes("TEGURAN_2")) {
          deduction = -2;
          pLabel = "Teguran 2 (-2)";
        } else if (penType.includes("PERINGATAN_1")) {
          deduction = -5;
          pLabel = "Peringatan 1 (-5)";
        } else if (penType.includes("PERINGATAN_2")) {
          deduction = -10;
          pLabel = "Peringatan 2 (-10)";
        }

        target.skor = Math.max(0, (target.skor || 0) + deduction);
        if (!target.scoreDetails) {
          target.scoreDetails = { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: 0 };
        }
        if (penType.includes("TEGURAN")) target.scoreDetails.teguran += 1;
        if (penType.includes("PERINGATAN")) target.scoreDetails.peringatan += 1;
        target.scoreDetails.total = target.skor;

        updated.logs.unshift({
          id: `penalty_${now}`,
          round: activeR,
          fighter: fighterColor,
          action: "TEGURAN",
          points: deduction,
          timestamp: now,
          desc: `Hukuman Dewan: ${pLabel} (${fighterColor})`,
          description: `Hukuman Dewan: ${pLabel} (${fighterColor})`
        });
        break;
      }
      case "DECLARE_VICTORY": {
        updated.status = MatchStatus.FINISHED;
        updated.winner = fighterColor;
        updated.winnerColor = fighterColor;
        updated.winMethod = actionData.victoryType || "KEPUTUSAN_DEWAN";
        break;
      }
      case "OVERRIDE": {
        const pts = actionData.overridePoints || 0;
        target.skor = (target.skor || 0) + pts;
        if (target.scoreDetails) target.scoreDetails.total = target.skor;
        break;
      }
      default:
        break;
    }

    syncCornerMirrors(updated);
    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processVerificationStart(
    currentState: MatchState,
    type: "JATUHAN" | "PELANGGARAN",
    corner?: "RED" | "BLUE" | null,
    reason?: string
  ): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    const targetCorner: FighterColor | null = corner === "RED" ? "MERAH" : corner === "BLUE" ? "BIRU" : null;
    updated.verification = {
      active: true,
      type,
      corner: corner || null,
      reason: reason || (type === "JATUHAN" ? "Verifikasi Jatuhan" : "Verifikasi Pelanggaran"),
      action: type === "JATUHAN" ? "JATUHAN" : "TEGURAN",
      targetCorner,
      votes: { 1: null, 2: null, 3: null },
      result: null
    };
    updated.verificationDetails = { type, corner, reason };
    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processVerificationVote(
    currentState: MatchState,
    juryId: number,
    vote: "MERAH" | "BIRU" | "TIDAK SAH"
  ): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    if (!updated.verification) {
      updated.verification = {
        active: true,
        action: null,
        targetCorner: null,
        votes: { 1: null, 2: null, 3: null },
        result: null
      };
    }
    if (!updated.verification.votes) {
      updated.verification.votes = { 1: null, 2: null, 3: null };
    }
    updated.verification.active = true;
    updated.verification.votes[juryId] = vote;
    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processVerificationApply(
    currentState: MatchState,
    manualResult?: "MERAH" | "BIRU" | "TIDAK SAH"
  ): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    if (updated.verification) {
      updated.verification.active = false;
      updated.verification.result = manualResult || null;
    }
    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processVerificationReset(currentState: MatchState): MatchState {
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    updated.verification = {
      active: false,
      type: undefined,
      corner: null,
      reason: "",
      action: null,
      targetCorner: null,
      votes: { 1: null, 2: null, 3: null },
      result: null
    };
    updated.verificationDetails = null;
    this.stampStateMutation(updated, currentState);
    this.setState(updated);
    this.broadcast(updated);
    return updated;
  }

  public processNextMatch(
    currentState: MatchState,
    nextData?: Partial<MatchState>
  ): MatchState {
    const nextMatch: MatchState = {
      ...createDefaultMatchState(currentState.arena || "ARENA A"),
      ...nextData,
      id: nextData?.id || `match-${Date.now()}`,
      status: MatchStatus.READY,
      currentRound: 1,
      activeRound: 1,
      roundTimer: nextData?.roundDuration || currentState.roundDuration || 120,
      timeLeft: nextData?.roundDuration || currentState.roundDuration || 120,
      roundDuration: nextData?.roundDuration || currentState.roundDuration || 120,
      scoreRed: 0,
      scoreBlue: 0,
      merah: nextData?.merah || {
        nama: "Pesilat Merah",
        kontingen: "Kontingen Merah",
        skor: 0,
        scoreDetails: { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: 0 }
      },
      biru: nextData?.biru || {
        nama: "Pesilat Biru",
        kontingen: "Kontingen Biru",
        skor: 0,
        scoreDetails: { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: 0 }
      },
      logs: [],
      winner: null,
      winnerColor: null,
      lastUpdatedAt: Date.now(),
      stateVersion: 1
    };

    this.setState(nextMatch);
    this.broadcast(nextMatch);
    return nextMatch;
  }
}

export const matchEngine = new MatchEngine();
