/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FIREBASE REALTIME DATABASE & AUTHENTICATION (ONLINE-ONLY)
 * Menggunakan konfigurasi proyek Firebase resmi jrz-score dan Realtime Database Asia Southeast 1.
 * Aplikasi beroperasi secara penuh secara online dengan isolasi ruang lingkup event.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  onValue,
  get,
  set,
  update,
  off,
  onDisconnect,
  serverTimestamp,
  remove
} from "firebase/database";
import {
  getAuth,
  Auth,
  GoogleAuthProvider
} from "firebase/auth";

import { MatchState, UserAccount } from "../types";
import { normalizeMatchState } from "../utils/defaultMatchState";
import { matchEngine } from "../utils/matchEngine";
import { eventScopeManager } from "./eventScopeManager";

// Konfigurasi Firebase Resmi Proyek jrz-score
export const firebaseConfig = {
  apiKey: "AIzaSyDoTaTgw5dqhDkZocgpc7rJ68Ewopr4yHs",
  authDomain: "jrz-score.firebaseapp.com",
  databaseURL: "https://jrz-score-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jrz-score",
  storageBucket: "jrz-score.firebasestorage.app",
  messagingSenderId: "815167875593",
  appId: "1:815167875593:web:e954759fe7d675c5ab26d8",
  measurementId: "G-J2QTD6JSW8"
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { ref, onValue, get, set, update, off, onDisconnect, serverTimestamp, remove };

export function sanitizeForFirebase<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirebase(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(data as Record<string, any>)) {
    if (v !== undefined) {
      clean[k] = sanitizeForFirebase(v);
    }
  }
  return clean as T;
}

function getScopedPath(subPath: string): string {
  const eventId = eventScopeManager.getActiveEventId() || "EVENT-A";
  const cleaned = subPath.replace(/^\/+/, "");
  return `events/${eventId}/${cleaned}`;
}

export function assertOnlineForFirebase(): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("Koneksi internet terputus. Aplikasi hanya dapat berjalan secara online dengan Firebase.");
  }
}

export function hasPendingCloudSync(_arena = getActiveArena()): boolean {
  return false;
}

export async function flushPendingCloudSync(): Promise<void> {
  return Promise.resolve();
}

// -----------------------------------------------------------------------------
// PENGELOLAAN GELANGGANG AKTIF (ARENA A, B, C, D...)
// -----------------------------------------------------------------------------
export function cleanArenaString(arena?: any): string {
  if (typeof arena === "string") {
    return arena.replace("GELANGGANG ", "").replace("ARENA ", "").trim().toUpperCase() || "A";
  }
  const defaultArena = getActiveArena();
  if (typeof defaultArena === "string") {
    return defaultArena.replace("GELANGGANG ", "").replace("ARENA ", "").trim().toUpperCase() || "A";
  }
  return "A";
}

export function getActiveArena(): string {
  if (typeof window === "undefined") return "A";
  try {
    const saved = localStorage.getItem("jrz_active_arena") || localStorage.getItem("ipsi_active_arena");
    if (saved) return saved.replace("GELANGGANG ", "").replace("ARENA ", "").trim().toUpperCase() || "A";
  } catch {}
  return "A";
}

export function setActiveArena(arena: string): void {
  if (typeof window === "undefined") return;
  const clean = cleanArenaString(arena);
  try {
    localStorage.setItem("jrz_active_arena", clean);
    localStorage.setItem("ipsi_active_arena", clean);
    window.dispatchEvent(new CustomEvent("jrz_arena_changed", { detail: { arena: clean } }));
  } catch {}
}

// -----------------------------------------------------------------------------
// MONITOR STATUS KONEKSI FIREBASE REALTIME DATABASE (.info/connected + navigator.onLine)
// -----------------------------------------------------------------------------
export function subscribeToConnectionStatus(
  callback: (connected: boolean, lastPing?: number) => void
): () => void {
  let firebaseConnected = false;

  const emitStatus = () => {
    const browserOnline = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
    callback(browserOnline && firebaseConnected, Date.now());
  };

  const connectedRef = ref(db, ".info/connected");
  const unsubConnected = onValue(connectedRef, (snap) => {
    firebaseConnected = Boolean(snap.val());
    emitStatus();
  });

  const handleOnline = () => emitStatus();
  const handleOffline = () => {
    firebaseConnected = false;
    emitStatus();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }

  return () => {
    unsubConnected();
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
  };
}

// -----------------------------------------------------------------------------
// SINKRONISASI PERTANDINGAN AKTIF (MATCH STATE) SECARA REAL-TIME VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export function subscribeToActiveMatch(
  arenaOrCallback: string | ((state: MatchState) => void),
  callbackOrArena?: string | ((state: MatchState) => void) | ((devices: Record<string, any>) => void),
  onPresenceChange?: (devices: Record<string, any>) => void
): () => void {
  let arenaStr: string;
  let callback: (state: MatchState) => void;

  if (typeof arenaOrCallback === "function") {
    callback = arenaOrCallback;
    arenaStr = typeof callbackOrArena === "string" ? callbackOrArena : getActiveArena();
  } else {
    arenaStr = arenaOrCallback;
    callback = (typeof callbackOrArena === "function" ? callbackOrArena : () => {}) as any;
  }

  const cleanArena = cleanArenaString(arenaStr);
  let unsubMatch: (() => void) | null = null;
  let unsubPresence: (() => void) | null = null;

  const bindListeners = () => {
    if (unsubMatch) {
      unsubMatch();
      unsubMatch = null;
    }
    if (unsubPresence) {
      unsubPresence();
      unsubPresence = null;
    }

    const matchRef = ref(db, getScopedPath(`arenas/${cleanArena}/activeMatch`));
    unsubMatch = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === "object") {
          const normalized = normalizeMatchState(val);
          matchEngine.setState(normalized);
          callback(normalized);
        }
      }
    });

    if (typeof onPresenceChange === "function") {
      const presRef = ref(db, getScopedPath(`arenas/${cleanArena}/presence`));
      unsubPresence = onValue(presRef, (snapshot) => {
        onPresenceChange((snapshot.exists() && snapshot.val()) || {});
      });
    }
  };

  bindListeners();

  const handleScopeChange = () => bindListeners();
  if (typeof window !== "undefined") {
    window.addEventListener("jrz_event_scope_changed", handleScopeChange);
  }

  return () => {
    if (unsubMatch) unsubMatch();
    if (unsubPresence) unsubPresence();
    if (typeof window !== "undefined") {
      window.removeEventListener("jrz_event_scope_changed", handleScopeChange);
    }
  };
}

export async function saveMatchStateToFirebase(match: MatchState, arena?: string): Promise<void> {
  if (!match) return;
  assertOnlineForFirebase();
  const cleanArena = cleanArenaString(arena || match.arena);
  const normalized = normalizeMatchState(match);

  matchEngine.broadcast(normalized);

  const payload = sanitizeForFirebase({
    ...normalized,
    arena: cleanArena,
    lastUpdatedAt: normalized.lastUpdatedAt || Date.now()
  });

  await set(ref(db, getScopedPath(`arenas/${cleanArena}/activeMatch`)), payload);
}

export async function updateMatchStateInFirebase(partialState: Partial<MatchState>, arena?: string): Promise<void> {
  assertOnlineForFirebase();
  const cleanArena = cleanArenaString(arena || partialState.arena);
  const current = matchEngine.getState();
  if (current) {
    const updated = { ...current, ...partialState, lastUpdatedAt: Date.now() } as MatchState;
    await saveMatchStateToFirebase(updated, cleanArena);
  } else {
    await update(ref(db, getScopedPath(`arenas/${cleanArena}/activeMatch`)), sanitizeForFirebase({
      ...partialState,
      lastUpdatedAt: Date.now()
    }));
  }
}

export async function archiveMatchToFirebase(matchState: MatchState): Promise<void> {
  if (!matchState || !matchState.id) return;
  assertOnlineForFirebase();
  const archivePayload = sanitizeForFirebase({
    ...matchState,
    status: "FINISHED",
    archivedAt: Date.now(),
    archivedDate: new Date().toLocaleString("id-ID")
  });
  await set(ref(db, getScopedPath(`archives/${matchState.id}`)), archivePayload);
}

// -----------------------------------------------------------------------------
// PENEKANAN NILAI JURI (JURY PRESS) REAL-TIME VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export async function pushJuryPressToFirebase(
  juryIdOrPress: number | Record<string, any>,
  fighter?: string,
  action?: string,
  syncedNow?: number,
  arena?: string
): Promise<void> {
  assertOnlineForFirebase();

  if (typeof juryIdOrPress === "object" && juryIdOrPress !== null) {
    const cleanArena = cleanArenaString(juryIdOrPress.arena || arena);
    const jId = Number(juryIdOrPress.juryId || 1);
    const payload = sanitizeForFirebase({
      juryId: jId,
      fighter: juryIdOrPress.fighter,
      action: juryIdOrPress.action,
      pressedAt: juryIdOrPress.pressedAt || juryIdOrPress.timestamp || Date.now(),
      consumed: false
    });
    await set(ref(db, getScopedPath(`arenas/${cleanArena}/juryPresses/${jId}`)), payload);
    return;
  }

  const jId = Number(juryIdOrPress);
  const cleanArena = cleanArenaString(arena);
  const payload = sanitizeForFirebase({
    juryId: jId,
    fighter,
    action,
    pressedAt: syncedNow || Date.now(),
    consumed: false
  });
  await set(ref(db, getScopedPath(`arenas/${cleanArena}/juryPresses/${jId}`)), payload);
}

export function subscribeToJuryPresses(
  arenaOrCallback: string | ((presses: Record<string, any>) => void),
  maybeCallbackOrArena?: string | ((presses: Record<string, any>) => void)
): () => void {
  let arenaStr: string;
  let callback: (presses: Record<string, any>) => void;

  if (typeof arenaOrCallback === "function") {
    callback = arenaOrCallback;
    arenaStr = typeof maybeCallbackOrArena === "string" ? maybeCallbackOrArena : getActiveArena();
  } else {
    arenaStr = arenaOrCallback;
    callback = typeof maybeCallbackOrArena === "function" ? maybeCallbackOrArena : () => {};
  }

  const cleanArena = cleanArenaString(arenaStr);
  let unsub: (() => void) | null = null;

  const bind = () => {
    if (unsub) unsub();
    const pressesRef = ref(db, getScopedPath(`arenas/${cleanArena}/juryPresses`));
    unsub = onValue(pressesRef, (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : null;
      if (val && typeof val === "object") {
        callback(val);
      }
    });
  };

  bind();

  const handleScope = () => bind();
  if (typeof window !== "undefined") {
    window.addEventListener("jrz_event_scope_changed", handleScope);
  }

  return () => {
    if (unsub) unsub();
    if (typeof window !== "undefined") {
      window.removeEventListener("jrz_event_scope_changed", handleScope);
    }
  };
}

// -----------------------------------------------------------------------------
// DEVICE PRESENCE & MULTI-PERANGKAT VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export function registerDevicePresence(
  deviceId: string,
  roleNameOrArena?: string,
  arenaOrRoleName?: string
): () => void {
  // Signatures in callers: registerDevicePresence(deviceId, roleName, this.arena)
  // Cleanly detect whether 3rd arg is arena ("A","B","C","D") or role
  let cleanArena = getActiveArena();
  let resolvedRole = deviceId.toUpperCase();

  if (arenaOrRoleName && arenaOrRoleName.trim().length <= 10) {
    cleanArena = cleanArenaString(arenaOrRoleName);
    resolvedRole = roleNameOrArena || deviceId.toUpperCase();
  } else if (roleNameOrArena) {
    if (["A", "B", "C", "D"].includes(cleanArenaString(roleNameOrArena)) && !arenaOrRoleName) {
      cleanArena = cleanArenaString(roleNameOrArena);
    } else {
      resolvedRole = roleNameOrArena;
      if (arenaOrRoleName) cleanArena = cleanArenaString(arenaOrRoleName);
    }
  }

  const safeDeviceId = deviceId.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const deviceRef = ref(db, getScopedPath(`arenas/${cleanArena}/presence/${safeDeviceId}`));

  const writePresence = () => {
    const payload = {
      deviceId: safeDeviceId,
      role: resolvedRole,
      active: true,
      ip: "Firebase Cloud",
      lastSeen: Date.now()
    };
    set(deviceRef, payload).catch(() => {});
    try {
      onDisconnect(deviceRef).remove().catch(() => {});
    } catch {}
  };

  writePresence();
  const heartbeat = setInterval(writePresence, 15000);

  return () => {
    clearInterval(heartbeat);
    remove(deviceRef).catch(() => {});
  };
}

export function subscribeToDevicePresence(
  arenaOrCallback: string | ((devices: Record<string, any>) => void),
  maybeCallbackOrArena?: string | ((devices: Record<string, any>) => void)
): () => void {
  let arenaStr: string;
  let callback: (devices: Record<string, any>) => void;

  if (typeof arenaOrCallback === "function") {
    callback = arenaOrCallback;
    arenaStr = typeof maybeCallbackOrArena === "string" ? maybeCallbackOrArena : getActiveArena();
  } else {
    arenaStr = arenaOrCallback;
    callback = typeof maybeCallbackOrArena === "function" ? maybeCallbackOrArena : () => {};
  }

  const cleanArena = cleanArenaString(arenaStr);
  const presRef = ref(db, getScopedPath(`arenas/${cleanArena}/presence`));
  return onValue(presRef, (snapshot) => {
    callback((snapshot.exists() && snapshot.val()) || {});
  });
}

// -----------------------------------------------------------------------------
// JADWAL & ATLET (SCHEDULES) VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export function subscribeToSchedule(callback: (schedules: any[]) => void): () => void {
  let unsub: (() => void) | null = null;

  const bind = () => {
    if (unsub) unsub();
    const schedRef = ref(db, getScopedPath("schedules"));
    unsub = onValue(schedRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const arr = Array.isArray(val) ? val : Object.values(val || {});
        callback(arr);
      } else {
        callback([]);
      }
    });
  };

  bind();
  const handleScope = () => bind();
  if (typeof window !== "undefined") {
    window.addEventListener("jrz_event_scope_changed", handleScope);
  }

  return () => {
    if (unsub) unsub();
    if (typeof window !== "undefined") {
      window.removeEventListener("jrz_event_scope_changed", handleScope);
    }
  };
}

export async function saveScheduleToFirebase(schedules: any[]): Promise<void> {
  assertOnlineForFirebase();
  await set(ref(db, getScopedPath("schedules")), sanitizeForFirebase(schedules || []));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: schedules }));
  }
}

// -----------------------------------------------------------------------------
// PENGGUNA & MANAJEMEN AKUN VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export function subscribeToUsers(callback: (users: UserAccount[]) => void): () => void {
  const usersRef = ref(db, "users");
  return onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const list: UserAccount[] = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.values(val || {}).filter(Boolean) as UserAccount[];
      callback(list);
    } else {
      callback([]);
    }
  });
}

export async function saveUserToFirebase(user: UserAccount): Promise<void> {
  assertOnlineForFirebase();
  const safeKey = (user.id || user.username || `usr-${Date.now()}`).replace(/[.#$/[\]]/g, "_");
  await set(ref(db, `users/${safeKey}`), sanitizeForFirebase({ ...user, id: safeKey }));
}

export async function updateUserInFirebase(userId: string, partial: Partial<UserAccount>): Promise<void> {
  assertOnlineForFirebase();
  const safeKey = userId.replace(/[.#$/[\]]/g, "_");
  await update(ref(db, `users/${safeKey}`), sanitizeForFirebase(partial));
}

export async function deleteUserFromFirebase(userId: string): Promise<void> {
  assertOnlineForFirebase();
  const safeKey = userId.replace(/[.#$/[\]]/g, "_");
  await remove(ref(db, `users/${safeKey}`));
}

export function isMatchOngoing(match: any): boolean {
  if (!match) return false;
  return (
    match.status === "RUNNING" ||
    match.status === "ONGOING" ||
    match.status === "BERLANGSUNG" ||
    match.isPaused === true ||
    match.isTimerRunning === true
  );
}

export function subscribeToAllArenasMatches(
  callback: (matches: Record<string, MatchState | null>) => void
): () => void {
  const arenas = ["A", "B", "C", "D"];
  let unsub: (() => void) | null = null;

  const bind = () => {
    if (unsub) unsub();
    const arenasRef = ref(db, getScopedPath("arenas"));
    unsub = onValue(arenasRef, (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : {};
      const result: Record<string, MatchState | null> = {};
      arenas.forEach((a) => {
        const active = val?.[a]?.activeMatch;
        result[a] = active ? normalizeMatchState(active) : null;
      });
      callback(result);
    });
  };

  bind();
  const handleScope = () => bind();
  if (typeof window !== "undefined") {
    window.addEventListener("jrz_event_scope_changed", handleScope);
  }

  return () => {
    if (unsub) unsub();
    if (typeof window !== "undefined") {
      window.removeEventListener("jrz_event_scope_changed", handleScope);
    }
  };
}

export async function syncTournamentToFirebase(
  dataOrMatches: any,
  participants?: any[],
  categories?: any[]
): Promise<void> {
  assertOnlineForFirebase();
  const payload =
    participants !== undefined || categories !== undefined
      ? {
          matches: dataOrMatches || [],
          participants: participants || [],
          categories: categories || [],
          updatedAt: Date.now()
        }
      : { ...(dataOrMatches || {}), updatedAt: Date.now() };

  await set(ref(db, getScopedPath("tournament")), sanitizeForFirebase(payload));
}

export async function saveTgrsStateToFirebase(tgrsState: any, arena?: string): Promise<void> {
  if (!tgrsState) return;
  assertOnlineForFirebase();
  const cleanArena = cleanArenaString(arena || tgrsState.gelanggang);
  await set(ref(db, getScopedPath(`arenas/${cleanArena}/tgrsState`)), sanitizeForFirebase({
    ...tgrsState,
    lastUpdatedAt: Date.now()
  }));
}

export function subscribeToTgrsState(arena: string, callback: (state: any) => void): () => void {
  const cleanArena = cleanArenaString(arena);
  return onValue(ref(db, getScopedPath(`arenas/${cleanArena}/tgrsState`)), (snap) => {
    if (snap.exists()) {
      callback(snap.val());
    }
  });
}

// -----------------------------------------------------------------------------
// KOMPATIBILITAS TOURNAMENT CONTEXT
// -----------------------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const snap = await get(ref(db, ".info/connected"));
    return Boolean(snap.val());
  } catch {
    return false;
  }
}

export function subscribeToMatch(_matchId: string, callback: (match: any) => void): () => void {
  return subscribeToActiveMatch(getActiveArena(), (state) => {
    callback(state);
  });
}

export async function syncMatchToDb(match: any): Promise<void> {
  await saveMatchStateToFirebase(match);
}
