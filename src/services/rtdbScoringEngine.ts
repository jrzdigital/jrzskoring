/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchState, FighterColor, ActionType, MatchStatus } from "../types";
import { matchEngine } from "../utils/matchEngine";
import { getSyncedNow } from "../utils/defaultMatchState";
import {
  saveMatchStateToFirebase,
  subscribeToActiveMatch,
  subscribeToConnectionStatus,
  registerDevicePresence,
  subscribeToDevicePresence,
  getActiveArena,
  setActiveArena,
  hasPendingCloudSync,
  flushPendingCloudSync,
  pushJuryPressToFirebase,
  subscribeToJuryPresses
} from "./firebase";

export interface FirebaseSyncStatus {
  connected: boolean;
  arena: string;
  lastSyncTime: number;
  devicesCount: number;
  syncCount: number;
  pendingSync?: boolean;
}

class RtdbScoringEngine {
  private arena: string = getActiveArena();
  private isConnected: boolean = false;
  private lastSyncTime: number = 0;
  private syncCount: number = 0;
  private statusListeners: ((status: FirebaseSyncStatus) => void)[] = [];
  private unsubscribeMatch: (() => void) | null = null;
  private unsubscribePresence: (() => void) | null = null;
  private unsubscribeConn: (() => void) | null = null;
  private unsubscribeJuryPresses: (() => void) | null = null;
  private currentDeviceUnsub: (() => void) | null = null;
  private activeDevices: { [key: string]: { active: boolean; ip?: string; lastSeen: number } } = {};
  private currentMatchState: MatchState | null = null;
  private onMatchStateUpdatedListeners: ((state: MatchState) => void)[] = [];
  private seenRemotePressMap: Record<string, number> = {};

  constructor() {
    this.initConnectionListener();
    this.initJuryPressListener();
  }

  public setCurrentMatchState(state: MatchState) {
    if (state) {
      this.currentMatchState = state;
      matchEngine.setState(state);
    }
  }

  public subscribeMatchStateUpdates(listener: (state: MatchState) => void): () => void {
    this.onMatchStateUpdatedListeners.push(listener);
    return () => {
      this.onMatchStateUpdatedListeners = this.onMatchStateUpdatedListeners.filter((l) => l !== listener);
    };
  }

  private notifyMatchStateUpdated(state: MatchState) {
    this.currentMatchState = state;
    matchEngine.setState(state);
    this.onMatchStateUpdatedListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error("Error in onMatchStateUpdated listener:", e);
      }
    });
  }

  private initJuryPressListener() {
    if (this.unsubscribeJuryPresses) {
      this.unsubscribeJuryPresses();
    }
    this.unsubscribeJuryPresses = subscribeToJuryPresses((presses) => {
      if (!presses) return;
      const base = matchEngine.getState() || this.currentMatchState;
      if (!base) return;

      const current: MatchState = JSON.parse(JSON.stringify(base));
      const now = Date.now();
      const syncedNow = getSyncedNow();
      let hasNewPressOrIndicator = false;

      if (!current.activeJuryPresses) {
        current.activeJuryPresses = { 1: null, 2: null, 3: null };
      }
      if (!current.juryPressHistory) {
        current.juryPressHistory = [];
      }
      if (!current.logs) {
        current.logs = [];
      }

      Object.entries(presses).forEach(([jStr, pData]: [string, any]) => {
        const jId = Number(jStr);
        if (!pData || !pData.pressedAt || (jId !== 1 && jId !== 2 && jId !== 3)) return;

        const pressKey = `${jId}_${pData.pressedAt}`;
        if (this.seenRemotePressMap[pressKey] === undefined) {
          if (Math.abs(syncedNow - pData.pressedAt) > 10000 && Math.abs(now - pData.pressedAt) > 10000) {
            return;
          }
          this.seenRemotePressMap[pressKey] = Math.abs(now - pData.pressedAt) <= 1000 ? pData.pressedAt : now;
        }

        const effectivePressedAt = this.seenRemotePressMap[pressKey];
        if (!effectivePressedAt || now - effectivePressedAt > 2000) return;

        const existing = current.activeJuryPresses?.[jId] as any;
        if (!existing || existing.pressedAt !== effectivePressedAt) {
          current.activeJuryPresses[jId] = {
            fighter: pData.fighter,
            action: pData.action,
            pressedAt: effectivePressedAt,
            consumed: false
          };
          hasNewPressOrIndicator = true;
        }

        if (current.status === MatchStatus.RUNNING) {
          const alreadyInHistory = current.juryPressHistory!.some(
            (h) =>
              h.juryId === jId &&
              h.fighter === pData.fighter &&
              h.action === pData.action &&
              Math.abs(h.timestamp - effectivePressedAt) <= 800
          );
          const activeR = current.activeRound || current.currentRound || 1;
          const alreadyInCountedLog = current.logs.some(
            (l) =>
              !l.uncounted &&
              l.round === activeR &&
              l.fighter === pData.fighter &&
              l.type === pData.action &&
              Math.abs(l.timestamp - effectivePressedAt) <= 2000 &&
              l.juryIds?.includes(jId)
          );

          const pressId = `press_${jId}_${effectivePressedAt}`;
          if (!alreadyInHistory && !alreadyInCountedLog) {
            current.juryPressHistory!.push({
              id: pressId,
              juryId: jId,
              fighter: pData.fighter,
              action: pData.action,
              timestamp: effectivePressedAt,
              consumed: false
            });
            hasNewPressOrIndicator = true;
          }

          const alreadyLoggedForJury = current.logs.some(
            (l) =>
              l.round === activeR &&
              l.fighter === pData.fighter &&
              l.type === pData.action &&
              Math.abs(l.timestamp - effectivePressedAt) <= 1500 &&
              (l.source === `Juri ${jId}` || (!l.uncounted && l.juryIds?.includes(jId)))
          );
          if (!alreadyLoggedForJury) {
            const pointValue = pData.action === "PUNCH" || pData.action === "PUKULAN" ? 1 : 2;
            current.logs.unshift({
              id: Math.random().toString(36).substring(7),
              timestamp: effectivePressedAt,
              round: activeR,
              fighter: pData.fighter,
              description: `PERCOBAAN POIN: Juri ${jId} menekan ${
                pData.action === "PUNCH" || pData.action === "PUKULAN" ? "Pukulan" : "Tendangan"
              } ${pData.fighter === "RED" || pData.fighter === "MERAH" ? "Merah" : "Biru"} (Menunggu Konsensus <= 2 Detik)`,
              points: pointValue,
              source: `Juri ${jId}`,
              type: pData.action,
              uncounted: true,
              pressId
            });
            hasNewPressOrIndicator = true;
          }
        }
      });

      if (hasNewPressOrIndicator) {
        if (current.status === MatchStatus.RUNNING) {
          const { state: evaluated, scored } = matchEngine.evaluateAndApplyConsensus(current, now);
          matchEngine.stampStateMutation(evaluated, base);
          matchEngine.broadcast(evaluated, !scored);
          this.notifyMatchStateUpdated(evaluated);
          if (scored) {
            this.syncInBackground(evaluated);
          }
        } else {
          matchEngine.broadcast(current, true);
          this.notifyMatchStateUpdated(current);
        }
      }
    }, this.arena);
  }

  private initConnectionListener() {
    this.unsubscribeConn = subscribeToConnectionStatus((connected, pingTime) => {
      const wasConnected = this.isConnected;
      this.isConnected = connected;
      if (connected) {
        this.lastSyncTime = pingTime || Date.now();
        if (!wasConnected) {
          flushPendingCloudSync().then(() => this.notifyStatus());
        }
      }
      this.notifyStatus();
    });
  }

  public getStatus(): FirebaseSyncStatus {
    return {
      connected: this.isConnected,
      arena: this.arena,
      lastSyncTime: this.lastSyncTime,
      devicesCount: Object.values(this.activeDevices).filter((d) => d.active).length,
      syncCount: this.syncCount,
      pendingSync: hasPendingCloudSync(this.arena)
    };
  }

  public subscribeStatus(listener: (status: FirebaseSyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    const currentStatus = this.getStatus();
    Promise.resolve().then(() => {
      if (this.statusListeners.includes(listener)) {
        listener(currentStatus);
      }
    });
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    const status = this.getStatus();
    Promise.resolve().then(() => {
      this.statusListeners.forEach((l) => l(status));
    });
  }

  private syncInBackground(state: MatchState) {
    saveMatchStateToFirebase(state, this.arena)
      .then(() => {
        if (this.isConnected) {
          this.lastSyncTime = Date.now();
          this.syncCount++;
        }
        this.notifyStatus();
      })
      .catch(() => {
        this.notifyStatus();
      });
  }

  public switchArena(newArena: string) {
    this.arena = newArena.toUpperCase();
    setActiveArena(this.arena);
    this.initJuryPressListener();
    this.notifyStatus();
  }

  public initDevice(deviceId: string, roleName: string) {
    if (this.currentDeviceUnsub) {
      this.currentDeviceUnsub();
    }
    this.currentDeviceUnsub = registerDevicePresence(deviceId, roleName, this.arena);

    if (this.unsubscribePresence) {
      this.unsubscribePresence();
    }
    this.unsubscribePresence = subscribeToDevicePresence((devices) => {
      this.activeDevices = devices || {};
      this.notifyStatus();
    }, this.arena);
  }

  public listenToActiveMatch(onRemoteUpdate: (state: MatchState) => void): () => void {
    if (this.unsubscribeMatch) {
      this.unsubscribeMatch();
    }

    this.unsubscribeMatch = subscribeToActiveMatch((remoteState) => {
      if (remoteState) {
        this.currentMatchState = remoteState;
        matchEngine.setState(remoteState);
        this.lastSyncTime = Date.now();
        this.syncCount++;
        this.notifyStatus();
        onRemoteUpdate(remoteState);
      }
    }, this.arena);

    return () => {
      if (this.unsubscribeMatch) {
        this.unsubscribeMatch();
        this.unsubscribeMatch = null;
      }
    };
  }

  public async handleJuryPress(
    currentState: MatchState,
    juryId: number,
    fighter: FighterColor,
    action: ActionType,
    customPressId?: string,
    customTimestamp?: number
  ): Promise<MatchState> {
    const now = customTimestamp || Date.now();
    const syncedNow = getSyncedNow();

    const latestInMem = matchEngine.getState() || this.currentMatchState;
    const { merged: baseState } = latestInMem
      ? matchEngine.reconcileMatchStates(latestInMem, currentState, true)
      : { merged: currentState };

    const updated = matchEngine.processJuryPress(baseState, juryId, fighter, action, customPressId, now);
    const localPressedAt = updated.activeJuryPresses?.[juryId]?.pressedAt || now;
    this.seenRemotePressMap[`${juryId}_${syncedNow}`] = localPressedAt;
    this.seenRemotePressMap[`${juryId}_${localPressedAt}`] = localPressedAt;

    this.notifyMatchStateUpdated(updated);

    pushJuryPressToFirebase(juryId, fighter, action, syncedNow, this.arena).catch(() => {});

    const scored = updated.logs?.[0]?.uncounted === false && now - updated.logs[0].timestamp <= 2000;
    if (scored) {
      this.syncInBackground(updated);
    } else {
      const versionAtPress = updated.stateVersion;
      setTimeout(() => {
        const latest = matchEngine.getState() || this.currentMatchState;
        if (latest && latest.id === updated.id && latest.stateVersion === versionAtPress) {
          this.syncInBackground(latest);
        }
      }, 2100);
    }

    const pressTime = updated.activeJuryPresses?.[juryId]?.pressedAt;
    setTimeout(() => {
      try {
        const latest = matchEngine.getState() || this.currentMatchState;
        if (latest && latest.activeJuryPresses && latest.activeJuryPresses[juryId]?.pressedAt === pressTime) {
          const cleaned: MatchState = {
            ...latest,
            activeJuryPresses: {
              ...latest.activeJuryPresses,
              [juryId]: null
            }
          };
          this.notifyMatchStateUpdated(cleaned);
        }
      } catch {}
    }, 2000);

    return updated;
  }

  public async handleJuryUndo(
    currentState: MatchState,
    juryId: number,
    fighter?: FighterColor
  ): Promise<MatchState> {
    const updated = matchEngine.processJuryUndo(currentState, juryId, fighter);
    this.notifyMatchStateUpdated(updated);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleTimerTick(currentState: MatchState): Promise<MatchState> {
    const updated = matchEngine.processTimerTick(currentState);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleTimerCommand(
    currentState: MatchState,
    command: "START" | "PAUSE" | "ADD_10" | "SUB_10" | "RESET"
  ): Promise<MatchState> {
    const updated = matchEngine.processTimerCommand(currentState, command);

    if (command === "START") {
      if (!updated.timeLeft || updated.timeLeft <= 0) {
        updated.timeLeft = updated.roundDuration || 120;
      }
      const now = getSyncedNow();
      updated.timerStartedAt = now;
      updated.timerEndAt = now + updated.timeLeft * 1000;
      updated.status = MatchStatus.RUNNING;
      updated.secretarySignalNextRound = false;
      updated.showRoundOverPopup = false;
      updated.juryPanelLocked = false;
      updated.dewanPanelLocked = false;
      updated.showNextMatchPopup = false;
      updated.winnerPublished = false;
      updated.winnerColor = null;
      updated.winnerMethod = undefined;
      updated.isTieExtendedPossible = false;
    } else if (command === "PAUSE") {
      updated.status = MatchStatus.PAUSED;
      updated.timerEndAt = null;
      updated.timerStartedAt = null;
    } else if (command === "ADD_10" || command === "SUB_10") {
      if (updated.status === MatchStatus.RUNNING && updated.timerEndAt) {
        updated.timerEndAt += command === "ADD_10" ? 10000 : -10000;
      }
    } else if (command === "RESET") {
      const dur = updated.roundDuration || 120;
      updated.status = MatchStatus.IDLE;
      updated.timeLeft = dur;
      updated.timerEndAt = null;
      updated.timerStartedAt = null;
      updated.showRoundOverPopup = false;
      updated.secretarySignalNextRound = false;
      updated.winnerPublished = false;
      updated.winnerColor = null;
      updated.winnerMethod = undefined;
      updated.isTieExtendedPossible = false;
    }

    matchEngine.broadcast(updated);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleRoundAction(
    currentState: MatchState,
    roundAction: "NEXT" | "SET" | "FINISH",
    targetRound?: number
  ): Promise<MatchState> {
    const updated = matchEngine.processRoundAction(currentState, roundAction, targetRound);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleDewanAction(
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
  ): Promise<MatchState> {
    const updated = matchEngine.processDewanAction(currentState, actionData);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleVerificationStart(
    currentState: MatchState,
    type: "JATUHAN" | "PELANGGARAN",
    corner?: "RED" | "BLUE" | null,
    reason?: string
  ): Promise<MatchState> {
    const updated = matchEngine.processVerificationStart(currentState, type, corner, reason);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleVerificationVote(
    currentState: MatchState,
    juryId: number,
    vote: "MERAH" | "BIRU" | "TIDAK SAH"
  ): Promise<MatchState> {
    const updated = matchEngine.processVerificationVote(currentState, juryId, vote);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleVerificationApply(
    currentState: MatchState,
    manualResult?: "MERAH" | "BIRU" | "TIDAK SAH"
  ): Promise<MatchState> {
    const updated = matchEngine.processVerificationApply(currentState, manualResult);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleVerificationReset(currentState: MatchState): Promise<MatchState> {
    const updated = matchEngine.processVerificationReset(currentState);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleMetadataUpdate(
    currentState: MatchState,
    partialData: Partial<MatchState>
  ): Promise<MatchState> {
    const updated: MatchState = {
      ...currentState,
      ...partialData,
      lastUpdatedAt: Date.now(),
      stateVersion: (Number(currentState.stateVersion) || 0) + 1
    };
    matchEngine.broadcast(updated);
    this.syncInBackground(updated);
    return updated;
  }

  public async handleUpdateMetadata(
    currentState: MatchState,
    partialData: Partial<MatchState>
  ): Promise<MatchState> {
    return this.handleMetadataUpdate(currentState, partialData);
  }

  public async handleNextMatch(currentState: MatchState, nextData?: Partial<MatchState>): Promise<MatchState> {
    const nextState = matchEngine.processNextMatch(currentState, nextData);
    this.syncInBackground(nextState);
    return nextState;
  }

  public async handleResetMatch(newState: MatchState): Promise<MatchState> {
    const stamped: MatchState = {
      ...newState,
      lastUpdatedAt: Date.now(),
      stateVersion: (Number(newState.stateVersion) || 0) + 1
    };
    matchEngine.broadcast(stamped);
    this.syncInBackground(stamped);
    return stamped;
  }

  public getActiveDevices() {
    return this.activeDevices;
  }
}

export const rtdbScoringEngine = new RtdbScoringEngine();
