import { SyncPacket } from '../types/scoring';
import { db, ref, set, onValue, off, sanitizeForFirebase } from '../services/firebase';
import { eventScopeManager } from '../services/eventScopeManager';

type SyncListener = (packet: SyncPacket) => void;

class RealtimeSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private clientId: string = '';
  private activeUnsub: (() => void) | null = null;
  private lastPacketTimestamp: number = 0;

  constructor() {
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);
  }

  private getPacketPath(): string {
    const eventId = eventScopeManager.getActiveEventId() || 'EVENT-A';
    return `events/${eventId}/syncPackets/latest`;
  }

  private ensureFirebaseSubscription() {
    if (this.activeUnsub || typeof window === 'undefined') return;
    try {
      const packetRef = ref(db, this.getPacketPath());
      const handler = (snap: any) => {
        const packet = snap.val() as SyncPacket | null;
        if (!packet || packet.sender === this.clientId) return;
        if (packet.timestamp && packet.timestamp <= this.lastPacketTimestamp) return;
        this.lastPacketTimestamp = packet.timestamp || Date.now();
        this.handleIncoming(packet);
      };
      onValue(packetRef, handler);
      this.activeUnsub = () => off(packetRef, 'value', handler);
    } catch {
      // Ignore if Firebase is temporarily unreachable
    }
  }

  private handleIncoming(packet: SyncPacket) {
    if (!packet || packet.sender === this.clientId) return;
    this.listeners.forEach((listener) => {
      try {
        listener(packet);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  public broadcast(packet: Omit<SyncPacket, 'sender' | 'timestamp' | 'version'>) {
    const fullPacket: SyncPacket = {
      ...packet,
      version: '2026.1',
      sender: this.clientId,
      timestamp: Date.now(),
    };

    try {
      const packetRef = ref(db, this.getPacketPath());
      set(packetRef, sanitizeForFirebase(fullPacket)).catch((err) => {
        console.warn('Firebase RTDB sync packet write warning:', err);
      });
    } catch (err) {
      console.warn('Firebase RTDB broadcast error:', err);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.ensureFirebaseSubscription();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.activeUnsub) {
        this.activeUnsub();
        this.activeUnsub = null;
      }
    };
  }

  public getClientId(): string {
    return this.clientId;
  }
}

export const syncManager = new RealtimeSyncManager();
