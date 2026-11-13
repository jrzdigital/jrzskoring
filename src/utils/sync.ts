import { SyncPacket } from '../types/scoring';
import {
  db,
  ref,
  set,
  onValue,
  off,
  sanitizeForFirebase,
  isCloudConnectionReady,
  subscribeToConnectionStatus
} from '../services/firebase';
import { eventScopeManager } from '../services/eventScopeManager';

type SyncListener = (packet: SyncPacket) => void;

class RealtimeSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private clientId: string = '';
  private activeUnsub: (() => void) | null = null;
  private connUnsub: (() => void) | null = null;
  private lastPacketTimestamp: number = 0;
  private pendingPacket: SyncPacket | null = null;

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
      this.connUnsub = subscribeToConnectionStatus((connected) => {
        if (connected && this.pendingPacket) {
          const toFlush = this.pendingPacket;
          this.pendingPacket = null;
          set(ref(db, this.getPacketPath()), sanitizeForFirebase(toFlush)).catch(() => {
            this.pendingPacket = toFlush;
          });
        }
      });
      this.activeUnsub = () => {
        off(packetRef, 'value', handler);
        if (this.connUnsub) {
          this.connUnsub();
          this.connUnsub = null;
        }
      };
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

    if (!isCloudConnectionReady()) {
      this.pendingPacket = fullPacket;
      return;
    }

    try {
      const packetRef = ref(db, this.getPacketPath());
      set(packetRef, sanitizeForFirebase(fullPacket)).catch(() => {
        this.pendingPacket = fullPacket;
      });
    } catch {
      this.pendingPacket = fullPacket;
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
