import { TournamentState, SystemNotification } from '../types';
import { INITIAL_STATE } from './initialData';
import { arenaAudio } from './audio';
import { db, ref, set, onValue, off, sanitizeForFirebase } from '../services/firebase';
import { eventScopeManager } from '../services/eventScopeManager';

type StateListener = (state: TournamentState) => void;

class SyncBusManager {
  private state: TournamentState = INITIAL_STATE;
  private listeners: Set<StateListener> = new Set();
  private activeUnsub: (() => void) | null = null;
  private clientId: string = 'bus_' + Math.random().toString(36).substring(2, 9);
  private lastSoundEventId: string = '';

  private getStatePath(): string {
    const eventId = eventScopeManager.getActiveEventId() || 'EVENT-A';
    return `events/${eventId}/tournamentBus/state`;
  }

  private getSoundPath(): string {
    const eventId = eventScopeManager.getActiveEventId() || 'EVENT-A';
    return `events/${eventId}/tournamentBus/soundEvent`;
  }

  private ensureFirebaseListeners() {
    if (this.activeUnsub || typeof window === 'undefined') return;
    try {
      const stateRef = ref(db, this.getStatePath());
      const soundRef = ref(db, this.getSoundPath());

      const stateHandler = (snap: any) => {
        const remote = snap.val();
        if (remote && remote.state) {
          this.state = remote.state as TournamentState;
          this.notifyListeners();
        }
      };

      const soundHandler = (snap: any) => {
        const evt = snap.val();
        if (
          evt &&
          evt.id &&
          evt.id !== this.lastSoundEventId &&
          evt.sender !== this.clientId &&
          Date.now() - (evt.timestamp || 0) < 5000
        ) {
          this.lastSoundEventId = evt.id;
          this.handleSoundEvent(evt.sound, evt.corner);
        }
      };

      onValue(stateRef, stateHandler);
      onValue(soundRef, soundHandler);

      this.activeUnsub = () => {
        off(stateRef, 'value', stateHandler);
        off(soundRef, 'value', soundHandler);
      };
    } catch {
      // Ignore setup errors when unmounted
    }
  }

  public getState(): TournamentState {
    return this.state;
  }

  public subscribe(listener: StateListener): () => void {
    this.ensureFirebaseListeners();
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.activeUnsub) {
        this.activeUnsub();
        this.activeUnsub = null;
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public updateState(
    updater: (prevState: TournamentState) => TournamentState,
    soundEffect?: 'gong' | 'buzzer' | 'point' | 'penalty',
    soundCorner?: 'red' | 'blue'
  ) {
    const newState = updater(this.state);
    this.state = newState;

    try {
      set(ref(db, this.getStatePath()), {
        sender: this.clientId,
        updatedAt: Date.now(),
        state: sanitizeForFirebase(newState),
      }).catch((err) => {
        console.warn('Failed to sync state to Firebase RTDB:', err);
      });
    } catch (e) {
      console.warn('Failed to write state to Firebase RTDB:', e);
    }

    if (soundEffect) {
      this.playSound(soundEffect, soundCorner);
    }

    this.notifyListeners();
  }

  public playSound(sound: 'gong' | 'buzzer' | 'point' | 'penalty', corner?: 'red' | 'blue') {
    this.handleSoundEvent(sound, corner);
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.lastSoundEventId = id;
    try {
      set(ref(db, this.getSoundPath()), {
        id,
        sender: this.clientId,
        sound,
        corner: corner || null,
        timestamp: Date.now(),
      }).catch(() => {});
    } catch {}
  }

  private handleSoundEvent(sound: 'gong' | 'buzzer' | 'point' | 'penalty', corner?: 'red' | 'blue') {
    if (!this.state.soundEnabled) return;
    if (sound === 'gong') arenaAudio.playGong();
    else if (sound === 'buzzer') arenaAudio.playBuzzer();
    else if (sound === 'point') arenaAudio.playPointChime(corner);
    else if (sound === 'penalty') arenaAudio.playPenaltyTone();
  }

  public resetToDefault() {
    this.updateState(() => INITIAL_STATE, 'gong');
  }

  public addNotification(
    title: string,
    message: string,
    type: SystemNotification['type'],
    corner?: 'red' | 'blue'
  ) {
    const notif: SystemNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: Date.now(),
      title,
      message,
      type,
      corner,
    };
    this.updateState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications].slice(0, 30),
    }));
  }
}

export const syncBus = new SyncBusManager();
