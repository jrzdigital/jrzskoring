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

function normalizeCorner(fighter?: string): "RED" | "BLUE" {
  const f = String(fighter || "").toUpperCase();
  return f === "BIRU" || f === "BLUE" ? "BLUE" : "RED";
}

function normalizeAction(action?: string): "PUNCH" | "KICK" | "DROP" | string {
  const a = String(action || "").toUpperCase();
  if (a === "PUNCH" || a === "PUKULAN") return "PUNCH";
  if (a === "KICK" || a === "TENDANGAN") return "KICK";
  if (a === "DROP" || a === "JATUHAN") return "DROP";
  return a;
}

function ensureContainers(state: MatchState) {
  if (!state.redStats) {
    state.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0, punch: 0, kick: 0, drop: 0, penalties: 0 };
  }
  if (!state.blueStats) {
    state.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0, punch: 0, kick: 0, drop: 0, penalties: 0 };
  }
  if (!state.redPenalties) {
    state.redPenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
  }
  if (!state.bluePenalties) {
    state.bluePenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
  }
  if (!state.merah) {
    state.merah = {
      nama: state.fighterRedName || "Pesilat Merah",
      kontingen: state.fighterRedClub || "Kontingen Merah",
      skor: state.scoreRed || 0,
      scoreDetails: { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: state.scoreRed || 0 }
    };
  }
  if (!state.biru) {
    state.biru = {
      nama: state.fighterBlueName || "Pesilat Biru",
      kontingen: state.fighterBlueClub || "Kontingen Biru",
      skor: state.scoreBlue || 0,
      scoreDetails: { pukulan: 0, tendangan: 0, jatuhan: 0, binaan: 0, teguran: 0, peringatan: 0, total: state.scoreBlue || 0 }
    };
  }
  if (!state.logs) state.logs = [];
}

function recalculateTandingScores(state: MatchState) {
  ensureContainers(state);
  const redStats = state.redStats!;
  const blueStats = state.blueStats!;
  const redPen = state.redPenalties!;
  const bluePen = state.bluePenalties!;

  const redPunches = Number(redStats.punches ?? redStats.punch ?? 0);
  const redKicks = Number(redStats.kicks ?? redStats.kick ?? 0);
  const redDrops = Number(redStats.drops ?? redStats.drop ?? 0);
  const redLocks = Number(redStats.locks ?? 0);
  const redOverrides = Number(redStats.overrides ?? 0);

  redStats.punches = redPunches;
  redStats.punch = redPunches;
  redStats.kicks = redKicks;
  redStats.kick = redKicks;
  redStats.drops = redDrops;
  redStats.drop = redDrops;
  redStats.locks = redLocks;
  redStats.overrides = redOverrides;

  const redPenaltyDeduction =
    Number(redStats.pastPenaltiesDeductions || 0) +
    (redPen.teguran1 ? 1 : 0) +
    (redPen.teguran2 ? 2 : 0) +
    (redPen.peringatan1 ? 5 : 0) +
    (redPen.peringatan2 ? 10 : 0);

  const redPositive = redPunches * 1 + redKicks * 2 + redDrops * 3 + redLocks * 3 + redOverrides;
  const redScore = redPositive - redPenaltyDeduction;

  redStats.warnings = redPenaltyDeduction;
  redStats.penalties = redPenaltyDeduction;
  state.scoreRed = redScore;
  state.merah!.skor = redScore;
  state.merah!.teguranCount = (redPen.teguran1 ? 1 : 0) + (redPen.teguran2 ? 1 : 0);
  state.merah!.peringatanCount = (redPen.peringatan1 ? 1 : 0) + (redPen.peringatan2 ? 1 : 0);
  state.merah!.scoreDetails = {
    pukulan: redPunches,
    tendangan: redKicks,
    jatuhan: redDrops + redLocks,
    binaan: (redPen.binaan1 ? 1 : 0) + (redPen.binaan2 ? 1 : 0),
    teguran: (redPen.teguran1 ? 1 : 0) + (redPen.teguran2 ? 1 : 0),
    peringatan: (redPen.peringatan1 ? 1 : 0) + (redPen.peringatan2 ? 1 : 0),
    total: redScore
  };

  const bluePunches = Number(blueStats.punches ?? blueStats.punch ?? 0);
  const blueKicks = Number(blueStats.kicks ?? blueStats.kick ?? 0);
  const blueDrops = Number(blueStats.drops ?? blueStats.drop ?? 0);
  const blueLocks = Number(blueStats.locks ?? 0);
  const blueOverrides = Number(blueStats.overrides ?? 0);

  blueStats.punches = bluePunches;
  blueStats.punch = bluePunches;
  blueStats.kicks = blueKicks;
  blueStats.kick = blueKicks;
  blueStats.drops = blueDrops;
  blueStats.drop = blueDrops;
  blueStats.locks = blueLocks;
  blueStats.overrides = blueOverrides;

  const bluePenaltyDeduction =
    Number(blueStats.pastPenaltiesDeductions || 0) +
    (bluePen.teguran1 ? 1 : 0) +
    (bluePen.teguran2 ? 2 : 0) +
    (bluePen.peringatan1 ? 5 : 0) +
    (bluePen.peringatan2 ? 10 : 0);

  const bluePositive = bluePunches * 1 + blueKicks * 2 + blueDrops * 3 + blueLocks * 3 + blueOverrides;
  const blueScore = bluePositive - bluePenaltyDeduction;

  blueStats.warnings = bluePenaltyDeduction;
  blueStats.penalties = bluePenaltyDeduction;
  state.scoreBlue = blueScore;
  state.biru!.skor = blueScore;
  state.biru!.teguranCount = (bluePen.teguran1 ? 1 : 0) + (bluePen.teguran2 ? 1 : 0);
  state.biru!.peringatanCount = (bluePen.peringatan1 ? 1 : 0) + (bluePen.peringatan2 ? 1 : 0);
  state.biru!.scoreDetails = {
    pukulan: bluePunches,
    tendangan: blueKicks,
    jatuhan: blueDrops + blueLocks,
    binaan: (bluePen.binaan1 ? 1 : 0) + (bluePen.binaan2 ? 1 : 0),
    teguran: (bluePen.teguran1 ? 1 : 0) + (bluePen.teguran2 ? 1 : 0),
    peringatan: (bluePen.peringatan1 ? 1 : 0) + (bluePen.peringatan2 ? 1 : 0),
    total: blueScore
  };
}

export function isSameMatchStateSnapshot(a: MatchState | null | undefined, b: MatchState | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.id !== b.id ||
    a.stateVersion !== b.stateVersion ||
    a.lastUpdatedAt !== b.lastUpdatedAt ||
    a.status !== b.status ||
    a.activeRound !== b.activeRound ||
    a.timeLeft !== b.timeLeft ||
    a.timerEndAt !== b.timerEndAt ||
    a.scoreRed !== b.scoreRed ||
    a.scoreBlue !== b.scoreBlue ||
    (a.logs?.length || 0) !== (b.logs?.length || 0) ||
    Boolean(a.winnerPublished) !== Boolean(b.winnerPublished) ||
    a.winnerColor !== b.winnerColor ||
    a.winnerMethod !== b.winnerMethod ||
    Boolean(a.juryPanelLocked) !== Boolean(b.juryPanelLocked) ||
    Boolean(a.dewanPanelLocked) !== Boolean(b.dewanPanelLocked) ||
    Boolean(a.showRoundOverPopup) !== Boolean(b.showRoundOverPopup) ||
    Boolean(a.verification?.active) !== Boolean(b.verification?.active) ||
    a.verification?.result !== b.verification?.result ||
    a.verification?.votes?.[1] !== b.verification?.votes?.[1] ||
    a.verification?.votes?.[2] !== b.verification?.votes?.[2] ||
    a.verification?.votes?.[3] !== b.verification?.votes?.[3] ||
    (a.redStats?.drops ?? 0) !== (b.redStats?.drops ?? 0) ||
    (a.blueStats?.drops ?? 0) !== (b.blueStats?.drops ?? 0) ||
    Boolean(a.redPenalties?.binaan1) !== Boolean(b.redPenalties?.binaan1) ||
    Boolean(a.redPenalties?.binaan2) !== Boolean(b.redPenalties?.binaan2) ||
    Boolean(a.redPenalties?.teguran1) !== Boolean(b.redPenalties?.teguran1) ||
    Boolean(a.redPenalties?.teguran2) !== Boolean(b.redPenalties?.teguran2) ||
    Boolean(a.redPenalties?.peringatan1) !== Boolean(b.redPenalties?.peringatan1) ||
    Boolean(a.redPenalties?.peringatan2) !== Boolean(b.redPenalties?.peringatan2) ||
    Boolean(a.redPenalties?.disqualified) !== Boolean(b.redPenalties?.disqualified) ||
    Boolean(a.bluePenalties?.binaan1) !== Boolean(b.bluePenalties?.binaan1) ||
    Boolean(a.bluePenalties?.binaan2) !== Boolean(b.bluePenalties?.binaan2) ||
    Boolean(a.bluePenalties?.teguran1) !== Boolean(b.bluePenalties?.teguran1) ||
    Boolean(a.bluePenalties?.teguran2) !== Boolean(b.bluePenalties?.teguran2) ||
    Boolean(a.bluePenalties?.peringatan1) !== Boolean(b.bluePenalties?.peringatan1) ||
    Boolean(a.bluePenalties?.peringatan2) !== Boolean(b.bluePenalties?.peringatan2) ||
    Boolean(a.bluePenalties?.disqualified) !== Boolean(b.bluePenalties?.disqualified) ||
    a.activeJuryPresses?.[1]?.pressedAt !== b.activeJuryPresses?.[1]?.pressedAt ||
    a.activeJuryPresses?.[2]?.pressedAt !== b.activeJuryPresses?.[2]?.pressedAt ||
    a.activeJuryPresses?.[3]?.pressedAt !== b.activeJuryPresses?.[3]?.pressedAt ||
    a.fighterRedName !== b.fighterRedName ||
    a.fighterBlueName !== b.fighterBlueName ||
    String(a.matchNumber) !== String(b.matchNumber) ||
    a.arena !== b.arena
  ) {
    return false;
  }
  return true;
}

class MatchEngine {
  private currentState: MatchState | null = null;
  private subscribers: ((state: MatchState) => void)[] = [];

  public getState(): MatchState | null {
    return this.currentState;
  }

  public syncStateQuietly(state: MatchState): void {
    if (!state) return;
    this.currentState = state;
  }

  public setState(state: MatchState): void {
    if (!state || this.currentState === state) return;
    const unchanged = isSameMatchStateSnapshot(this.currentState, state);
    this.currentState = state;
    if (!unchanged) {
      this.notifySubscribers(state);
    }
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

    const redSkor = base.scoreRed ?? base.merah?.skor ?? secondary.scoreRed ?? 0;
    const blueSkor = base.scoreBlue ?? base.biru?.skor ?? secondary.scoreBlue ?? 0;

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
      redStats: base.redStats || secondary.redStats,
      blueStats: base.blueStats || secondary.blueStats,
      redPenalties: base.redPenalties || secondary.redPenalties,
      bluePenalties: base.bluePenalties || secondary.bluePenalties,
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

    ensureContainers(updated);
    if (!updated.activeJuryPresses) {
      updated.activeJuryPresses = { 1: null, 2: null, 3: null };
    }
    if (!updated.juryScores) {
      updated.juryScores = {
        1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
      };
    }

    const presses: { juryId: number; fighter: "RED" | "BLUE"; action: string; pressedAt: number }[] = [];
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
        const pointVal = action === "PUNCH" ? 1 : action === "KICK" ? 2 : action === "DROP" ? 3 : 1;
        const isRed = fighter === "RED";
        const stats = isRed ? updated.redStats! : updated.blueStats!;

        if (action === "PUNCH") stats.punches = (stats.punches || 0) + 1;
        else if (action === "KICK") stats.kicks = (stats.kicks || 0) + 1;
        else if (action === "DROP") stats.drops = (stats.drops || 0) + 1;

        const juryIds = juryList.map((j) => j.juryId);
        const activeR = updated.activeRound || updated.currentRound || 1;
        juryIds.forEach((id) => {
          if (updated.activeJuryPresses?.[id]) {
            updated.activeJuryPresses[id].consumed = true;
          }
          if (updated.juryScores?.[id]) {
            if (!updated.juryScores[id][activeR]) {
              updated.juryScores[id][activeR] = { red: 0, blue: 0 };
            }
            if (isRed) updated.juryScores[id][activeR].red = (updated.juryScores[id][activeR].red || 0) + pointVal;
            else updated.juryScores[id][activeR].blue = (updated.juryScores[id][activeR].blue || 0) + pointVal;
          }
        });

        recalculateTandingScores(updated);

        const cornerLabel = isRed ? "Merah" : "Biru";
        const actionLabel = action === "PUNCH" ? "Pukulan" : action === "KICK" ? "Tendangan" : "Jatuhan";
        updated.logs.unshift({
          id: `scored_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          round: activeR,
          fighter: fighter as FighterColor,
          action: (action === "PUNCH" ? "PUKULAN" : action === "KICK" ? "TENDANGAN" : "JATUHAN") as ActionType,
          type: action,
          points: pointVal,
          timestamp: now,
          source: `Juri ${juryIds.join(", ")}`,
          desc: `POIN SAH KONSENSUS: ${actionLabel} ${cornerLabel} (+${pointVal}) (Juri ${juryIds.join(", ")})`,
          description: `POIN SAH KONSENSUS: ${actionLabel} ${cornerLabel} (+${pointVal}) (Juri ${juryIds.join(", ")})`,
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
    const normCorner = normalizeCorner(fighter);
    const normAction = normalizeAction(action);

    ensureContainers(current);
    if (!current.activeJuryPresses) {
      current.activeJuryPresses = { 1: null, 2: null, 3: null };
    }
    if (!current.juryPressHistory) {
      current.juryPressHistory = [];
    }

    current.activeJuryPresses[juryId] = {
      fighter: normCorner,
      action: normAction,
      pressedAt: now,
      consumed: false
    };

    current.juryPressHistory.push({
      id: customPressId || `press_${juryId}_${now}`,
      juryId,
      fighter: normCorner,
      action: normAction,
      timestamp: now,
      consumed: false
    });

    const pointVal = normAction === "PUNCH" ? 1 : normAction === "KICK" ? 2 : 1;
    const activeR = current.activeRound || current.currentRound || 1;
    const cornerLabel = normCorner === "RED" ? "Merah" : "Biru";
    const actionLabel = normAction === "PUNCH" ? "Pukulan" : "Tendangan";

    current.logs.unshift({
      id: customPressId || `log_${juryId}_${now}`,
      round: activeR,
      fighter: normCorner,
      action,
      type: String(normAction),
      points: pointVal,
      timestamp: now,
      source: `Juri ${juryId}`,
      desc: `PERCOBAAN POIN: Juri ${juryId} menekan ${actionLabel} ${cornerLabel}`,
      description: `PERCOBAAN POIN: Juri ${juryId} menekan ${actionLabel} ${cornerLabel}`,
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
    ensureContainers(updated);

    const normFilter = fighter ? normalizeCorner(fighter) : null;
    const idx = updated.logs.findIndex((l) => {
      const matchJury = l.juryIds?.includes(juryId) || l.source?.includes(String(juryId));
      const matchFighter = !normFilter || normalizeCorner(l.fighter) === normFilter;
      return matchFighter && (matchJury || !l.juryIds);
    });

    if (idx !== -1) {
      const removed = updated.logs.splice(idx, 1)[0];
      if (removed && !removed.uncounted) {
        const isRed = normalizeCorner(removed.fighter) === "RED";
        const stats = isRed ? updated.redStats! : updated.blueStats!;
        const act = normalizeAction(removed.type || removed.action);
        if (act === "PUNCH") stats.punches = Math.max(0, (stats.punches || 0) - 1);
        else if (act === "KICK") stats.kicks = Math.max(0, (stats.kicks || 0) - 1);
        else if (act === "DROP") stats.drops = Math.max(0, (stats.drops || 0) - 1);
        recalculateTandingScores(updated);
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
    const updated: MatchState = JSON.parse(JSON.stringify(currentState));
    ensureContainers(updated);
    const curR = updated.activeRound || updated.currentRound || 1;

    const archiveAndResetRoundPenalties = () => {
      const redRoundDed = (updated.redPenalties!.teguran1 ? 1 : 0) + (updated.redPenalties!.teguran2 ? 2 : 0);
      const blueRoundDed = (updated.bluePenalties!.teguran1 ? 1 : 0) + (updated.bluePenalties!.teguran2 ? 2 : 0);
      updated.redStats!.pastPenaltiesDeductions = (updated.redStats!.pastPenaltiesDeductions || 0) + redRoundDed;
      updated.blueStats!.pastPenaltiesDeductions = (updated.blueStats!.pastPenaltiesDeductions || 0) + blueRoundDed;

      updated.redPenalties!.binaan1 = false;
      updated.redPenalties!.binaan2 = false;
      updated.redPenalties!.teguran1 = false;
      updated.redPenalties!.teguran2 = false;

      updated.bluePenalties!.binaan1 = false;
      updated.bluePenalties!.binaan2 = false;
      updated.bluePenalties!.teguran1 = false;
      updated.bluePenalties!.teguran2 = false;
      recalculateTandingScores(updated);
    };

    if (roundAction === "NEXT") {
      archiveAndResetRoundPenalties();
      const nextR = curR + 1;
      updated.activeRound = nextR;
      updated.currentRound = nextR;
      updated.timeLeft = updated.roundDuration || 120;
      updated.roundTimer = updated.roundDuration || 120;
      updated.status = MatchStatus.READY;
      updated.showRoundOverPopup = false;
      updated.secretarySignalNextRound = false;
      updated.dewanPanelLocked = false;
      updated.juryPanelLocked = false;
    } else if (roundAction === "SET" && targetRound) {
      if (targetRound !== curR) {
        archiveAndResetRoundPenalties();
      }
      updated.activeRound = targetRound;
      updated.currentRound = targetRound;
      updated.timeLeft = updated.roundDuration || 120;
      updated.roundTimer = updated.roundDuration || 120;
      updated.showRoundOverPopup = false;
      updated.secretarySignalNextRound = false;
    } else if (roundAction === "FINISH") {
      recalculateTandingScores(updated);
      updated.status = MatchStatus.FINISHED;
      const redScore = updated.scoreRed ?? 0;
      const blueScore = updated.scoreBlue ?? 0;
      if (updated.redPenalties?.disqualified && !updated.bluePenalties?.disqualified) {
        updated.winner = "BLUE";
        updated.winnerColor = "BLUE";
        updated.winMethod = "DISKUALIFIKASI LAWAN";
        updated.winnerMethod = "DISKUALIFIKASI LAWAN";
      } else if (updated.bluePenalties?.disqualified && !updated.redPenalties?.disqualified) {
        updated.winner = "RED";
        updated.winnerColor = "RED";
        updated.winMethod = "DISKUALIFIKASI LAWAN";
        updated.winnerMethod = "DISKUALIFIKASI LAWAN";
      } else if (redScore > blueScore) {
        updated.winner = "RED";
        updated.winnerColor = "RED";
        updated.winMethod = "MENANG ANGKA / MUTLAK";
        updated.winnerMethod = "MENANG ANGKA / MUTLAK";
      } else if (blueScore > redScore) {
        updated.winner = "BLUE";
        updated.winnerColor = "BLUE";
        updated.winMethod = "MENANG ANGKA / MUTLAK";
        updated.winnerMethod = "MENANG ANGKA / MUTLAK";
      } else {
        updated.winner = null;
        updated.winnerColor = null;
      }
      updated.winnerPublished = Boolean(updated.winnerColor);
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
    ensureContainers(updated);

    const fighterKey: "RED" | "BLUE" = actionData.fighter === "BLUE" ? "BLUE" : "RED";
    const isRed = fighterKey === "RED";
    const fLabel = isRed ? "Merah" : "Biru";
    const stats = isRed ? updated.redStats! : updated.blueStats!;
    const pTarget = isRed ? updated.redPenalties! : updated.bluePenalties!;
    const now = Date.now();
    const activeR = updated.activeRound || updated.currentRound || 1;

    switch (actionData.command) {
      case "PUNCH": {
        stats.punches = (stats.punches || 0) + 1;
        updated.logs.unshift({
          id: `punch_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "PUKULAN",
          type: "PUNCH",
          points: 1,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `KOREKSI DEWAN (+1): Poin Pukulan untuk Pesilat Sudut ${fLabel}!`,
          description: `KOREKSI DEWAN (+1): Poin Pukulan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "CANCEL_PUNCH": {
        if ((stats.punches || 0) > 0) {
          stats.punches = stats.punches - 1;
        }
        updated.logs.unshift({
          id: `cancel_punch_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "PUKULAN",
          type: "PUNCH",
          points: -1,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `KOREKSI DEWAN (-1): Poin Pukulan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
          description: `KOREKSI DEWAN (-1): Poin Pukulan dibatalkan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "KICK": {
        stats.kicks = (stats.kicks || 0) + 1;
        updated.logs.unshift({
          id: `kick_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "TENDANGAN",
          type: "KICK",
          points: 2,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `KOREKSI DEWAN (+2): Poin Tendangan untuk Pesilat Sudut ${fLabel}!`,
          description: `KOREKSI DEWAN (+2): Poin Tendangan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "CANCEL_KICK": {
        if ((stats.kicks || 0) > 0) {
          stats.kicks = stats.kicks - 1;
        }
        updated.logs.unshift({
          id: `cancel_kick_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "TENDANGAN",
          type: "KICK",
          points: -2,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `KOREKSI DEWAN (-2): Poin Tendangan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
          description: `KOREKSI DEWAN (-2): Poin Tendangan dibatalkan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "DROP": {
        stats.drops = (stats.drops || 0) + 1;
        stats.drop = stats.drops;
        updated.logs.unshift({
          id: `drop_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "JATUHAN",
          type: "DROP",
          points: 3,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `SKOR JATUHAN: +3 Poin Jatuhan untuk Pesilat Sudut ${fLabel}!`,
          description: `SKOR JATUHAN: +3 Poin Jatuhan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "CANCEL_DROP": {
        if ((stats.drops || 0) > 0) {
          stats.drops = stats.drops - 1;
        }
        stats.drop = stats.drops || 0;
        updated.logs.unshift({
          id: `cancel_drop_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "JATUHAN",
          type: "DROP",
          points: -3,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `BATAL JATUHAN: -3 Poin Jatuhan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
          description: `BATAL JATUHAN: -3 Poin Jatuhan dibatalkan untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "LOCK": {
        stats.locks = (stats.locks || 0) + 1;
        updated.logs.unshift({
          id: `lock_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "JATUHAN",
          type: "LOCK",
          points: 3,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `SKOR KUNCIAN: +3 Poin Kuncian untuk Pesilat Sudut ${fLabel}!`,
          description: `SKOR KUNCIAN: +3 Poin Kuncian untuk Pesilat Sudut ${fLabel}!`
        });
        break;
      }
      case "PENALTY": {
        const cleanPenalty = (actionData.penaltyType || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const logTogglePenalty = (label: string, flagActive: boolean, pointsVal: number, actionLabel: ActionType) => {
          updated.logs.unshift({
            id: `penalty_${cleanPenalty}_${now}_${Math.random().toString(36).substring(2, 6)}`,
            round: activeR,
            fighter: fighterKey,
            action: actionLabel,
            type: "PENALTY",
            points: flagActive ? pointsVal : 0,
            timestamp: now,
            source: "Dewan Pertandingan",
            desc: `${label} ${flagActive ? (pointsVal !== 0 ? `AKTIF (${pointsVal})` : "AKTIF") : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
            description: `${label} ${flagActive ? (pointsVal !== 0 ? `AKTIF (${pointsVal})` : "AKTIF") : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`
          });

          if (!flagActive) {
            const origLog = updated.logs.find(
              (l) =>
                l.fighter === fighterKey &&
                l.round === activeR &&
                l.type === "PENALTY" &&
                (l.description?.includes(label) || l.desc?.includes(label)) &&
                (l.description?.includes("AKTIF") || l.desc?.includes("AKTIF")) &&
                !l.uncounted
            );
            if (origLog) origLog.uncounted = true;
          }
        };

        if (cleanPenalty === "binaan1") {
          pTarget.binaan1 = !pTarget.binaan1;
          logTogglePenalty("BINAAN 1", Boolean(pTarget.binaan1), 0, "BINAAN");
        } else if (cleanPenalty === "binaan2") {
          pTarget.binaan2 = !pTarget.binaan2;
          logTogglePenalty("BINAAN 2", Boolean(pTarget.binaan2), 0, "BINAAN");
        } else if (cleanPenalty === "teguran1") {
          pTarget.teguran1 = !pTarget.teguran1;
          logTogglePenalty("TEGURAN 1", Boolean(pTarget.teguran1), -1, "TEGURAN");
        } else if (cleanPenalty === "teguran2") {
          pTarget.teguran2 = !pTarget.teguran2;
          logTogglePenalty("TEGURAN 2", Boolean(pTarget.teguran2), -2, "TEGURAN");
        } else if (cleanPenalty === "peringatan1") {
          pTarget.peringatan1 = !pTarget.peringatan1;
          logTogglePenalty("PERINGATAN 1", Boolean(pTarget.peringatan1), -5, "PERINGATAN");
        } else if (cleanPenalty === "peringatan2") {
          pTarget.peringatan2 = !pTarget.peringatan2;
          logTogglePenalty("PERINGATAN 2", Boolean(pTarget.peringatan2), -10, "PERINGATAN");
        } else if (cleanPenalty === "disqualified" || cleanPenalty === "diskualifikasi") {
          pTarget.disqualified = !pTarget.disqualified;
          if (pTarget.disqualified) {
            const opponent: "RED" | "BLUE" = isRed ? "BLUE" : "RED";
            updated.status = MatchStatus.FINISHED;
            updated.winner = opponent;
            updated.winnerColor = opponent;
            updated.winnerPublished = true;
            updated.winnerMethod = "DISKUALIFIKASI LAWAN";
            updated.winMethod = "DISKUALIFIKASI LAWAN";
            updated.logs.unshift({
              id: `penalty_dq_${now}_${Math.random().toString(36).substring(2, 6)}`,
              round: activeR,
              fighter: fighterKey,
              action: "DISKUALIFIKASI",
              type: "PENALTY",
              points: 0,
              timestamp: now,
              source: "Dewan Pertandingan",
              desc: `DISKUALIFIKASI AKTIF untuk Pesilat Sudut ${fLabel}!`,
              description: `DISKUALIFIKASI AKTIF untuk Pesilat Sudut ${fLabel}!`
            });
          } else {
            updated.status = MatchStatus.PAUSED;
            updated.winner = null;
            updated.winnerColor = null;
            updated.winnerPublished = false;
            updated.winnerMethod = undefined;
            updated.winMethod = undefined;
            updated.logs.unshift({
              id: `penalty_dq_cancel_${now}_${Math.random().toString(36).substring(2, 6)}`,
              round: activeR,
              fighter: fighterKey,
              action: "DISKUALIFIKASI",
              type: "PENALTY",
              points: 0,
              timestamp: now,
              source: "Dewan Pertandingan",
              desc: `DISKUALIFIKASI DIBATALKAN untuk Pesilat Sudut ${fLabel}!`,
              description: `DISKUALIFIKASI DIBATALKAN untuk Pesilat Sudut ${fLabel}!`
            });
          }
        }
        break;
      }
      case "RESET_ROUND_PENALTIES": {
        updated.redPenalties!.binaan1 = false;
        updated.redPenalties!.binaan2 = false;
        updated.redPenalties!.teguran1 = false;
        updated.redPenalties!.teguran2 = false;
        updated.bluePenalties!.binaan1 = false;
        updated.bluePenalties!.binaan2 = false;
        updated.bluePenalties!.teguran1 = false;
        updated.bluePenalties!.teguran2 = false;
        break;
      }
      case "DECLARE_VICTORY": {
        const method = actionData.victoryType || actionData.penaltyType || "KEPUTUSAN DEWAN";
        updated.status = MatchStatus.FINISHED;
        updated.winner = fighterKey;
        updated.winnerColor = fighterKey;
        updated.winnerPublished = true;
        updated.winnerMethod = method;
        updated.winMethod = method;
        updated.timerEndAt = null;
        updated.timerStartedAt = null;
        updated.logs.unshift({
          id: `victory_${now}`,
          round: activeR,
          fighter: fighterKey,
          action: "SYSTEM",
          type: "SYSTEM",
          points: 0,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `DEKLARASI KEMENANGAN: Sudut ${fLabel} (${method})`,
          description: `DEKLARASI KEMENANGAN: Sudut ${fLabel} (${method})`
        });
        break;
      }
      case "OVERRIDE": {
        const pts = Number(actionData.overridePoints || 0);
        stats.overrides = (stats.overrides || 0) + pts;
        updated.logs.unshift({
          id: `override_${now}_${Math.random().toString(36).substring(2, 6)}`,
          round: activeR,
          fighter: fighterKey,
          action: "KOREKSI",
          type: "OVERRIDE",
          points: pts,
          timestamp: now,
          source: "Dewan Pertandingan",
          desc: `KOREKSI SKOR DEWAN (${pts > 0 ? `+${pts}` : pts}) untuk Pesilat Sudut ${fLabel}`,
          description: `KOREKSI SKOR DEWAN (${pts > 0 ? `+${pts}` : pts}) untuk Pesilat Sudut ${fLabel}`
        });
        break;
      }
      default:
        break;
    }

    recalculateTandingScores(updated);
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
    const targetCorner: FighterColor | null = corner === "RED" ? "RED" : corner === "BLUE" ? "BLUE" : null;
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
      winnerPublished: false,
      lastUpdatedAt: Date.now(),
      stateVersion: 1
    };

    this.setState(nextMatch);
    this.broadcast(nextMatch);
    return nextMatch;
  }
}

export const matchEngine = new MatchEngine();
