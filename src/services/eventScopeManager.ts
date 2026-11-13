/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Event & Database Scope Manager
 * Memastikan setiap instalasi aplikasi dan setiap event turnamen (Event A vs Event B)
 * memiliki ruang lingkup database Firebase Realtime Database terisolasi 100%.
 */

export interface EventProfile {
  id: string;
  name: string;
  location?: string;
  dates?: string;
  createdAt: number;
  lastActiveAt: number;
}

const STORAGE_INSTANCE_ID = "jrz_server_instance_id";
const STORAGE_ACTIVE_EVENT_ID = "jrz_active_event_id";
const STORAGE_EVENT_PROFILES = "jrz_event_profiles_list";

function generateUniqueId(prefix = "EVT"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export class EventScopeManager {
  private static instance: EventScopeManager | null = null;
  private activeEventId: string;
  private activeEventName: string;

  private constructor() {
    this.activeEventId = this.resolveActiveEventId();
    this.activeEventName = this.resolveActiveEventName();
    this.ensureEventProfileExists();
  }

  public static getInstance(): EventScopeManager {
    if (!EventScopeManager.instance) {
      EventScopeManager.instance = new EventScopeManager();
    }
    return EventScopeManager.instance;
  }

  public getServerInstanceId(): string {
    if (typeof window === "undefined") return "FIREBASE-CLOUD";
    try {
      let instanceId = localStorage.getItem(STORAGE_INSTANCE_ID);
      if (!instanceId) {
        instanceId = generateUniqueId("FB-INST");
        localStorage.setItem(STORAGE_INSTANCE_ID, instanceId);
      }
      return instanceId;
    } catch {
      return "FB-INST-CLOUD";
    }
  }

  public getActiveEventId(): string {
    return this.activeEventId;
  }

  public getActiveEventName(): string {
    return this.activeEventName;
  }

  private resolveActiveEventId(): string {
    if (typeof window === "undefined") return "EVENT-A";
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_EVENT_ID);
      if (saved && saved.trim()) return saved.trim();

      const defaultId = "EVENT-A";
      localStorage.setItem(STORAGE_ACTIVE_EVENT_ID, defaultId);
      return defaultId;
    } catch {
      return "EVENT-A";
    }
  }

  private resolveActiveEventName(): string {
    if (typeof window === "undefined") return "Kejuaraan Pencak Silat IPSI";
    try {
      const saved = localStorage.getItem("jrz_event_name");
      if (saved && saved.trim()) return saved.trim();
    } catch {}
    return "Event A - Kejuaraan Silat Resmi";
  }

  private ensureEventProfileExists() {
    if (typeof window === "undefined") return;
    try {
      const profiles = this.getEventProfiles();
      const exists = profiles.some((p) => p.id === this.activeEventId);
      if (!exists) {
        profiles.push({
          id: this.activeEventId,
          name: this.activeEventName,
          createdAt: Date.now(),
          lastActiveAt: Date.now()
        });
        localStorage.setItem(STORAGE_EVENT_PROFILES, JSON.stringify(profiles));
      }
    } catch {}
  }

  public getEventProfiles(): EventProfile[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_EVENT_PROFILES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "EVENT-A",
        name: "Event A - Kejuaraan Silat Resmi",
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      }
    ];
  }

  public switchEvent(targetEventId: string, eventName?: string): void {
    if (typeof window === "undefined") return;
    const cleanId = targetEventId.trim().toUpperCase();
    if (!cleanId) return;

    this.activeEventId = cleanId;
    if (eventName && eventName.trim()) {
      this.activeEventName = eventName.trim();
      try {
        localStorage.setItem("jrz_event_name", this.activeEventName);
      } catch {}
    }

    try {
      localStorage.setItem(STORAGE_ACTIVE_EVENT_ID, cleanId);

      const profiles = this.getEventProfiles();
      const existing = profiles.find((p) => p.id === cleanId);
      if (existing) {
        existing.lastActiveAt = Date.now();
        if (eventName) existing.name = eventName;
      } else {
        profiles.push({
          id: cleanId,
          name: eventName || `Event ${cleanId}`,
          createdAt: Date.now(),
          lastActiveAt: Date.now()
        });
      }
      localStorage.setItem(STORAGE_EVENT_PROFILES, JSON.stringify(profiles));

      window.dispatchEvent(
        new CustomEvent("jrz_event_scope_changed", {
          detail: { eventId: cleanId, eventName: this.activeEventName }
        })
      );
    } catch (e) {
      console.error("Gagal berpindah event scope:", e);
    }
  }

  public createNewEvent(name: string, customId?: string): string {
    const newId =
      customId && customId.trim() ? customId.trim().toUpperCase() : generateUniqueId("EVT");
    const cleanName = name.trim() || `Event ${newId}`;
    this.switchEvent(newId, cleanName);
    return newId;
  }

  public getScopedChannelName(baseChannel: string): string {
    return `jrz_${this.activeEventId}_${baseChannel}`;
  }

  /**
   * Menghasilkan key penyimpanan LocalStorage yang diisolasi per Event
   */
  public getScopedStorageKey(baseKey: string): string {
    return `jrz_${this.activeEventId}_${baseKey}`;
  }
}

export const eventScopeManager = EventScopeManager.getInstance();
