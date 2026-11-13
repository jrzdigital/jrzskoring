/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FIREBASE REALTIME DATABASE & AUTHENTICATION (RESILIENT REAL-TIME SYNC)
 * Menggunakan konfigurasi proyek Firebase resmi jrz-score dan Realtime Database Asia Southeast 1.
 * Apabila koneksi internet terputus/terganggu, seluruh data pertandingan tersimpan aman
 * di penyangga persisten perangkat dan otomatis tersinkron ke Firebase RTDB saat koneksi pulih.
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

const PENDING_QUEUE_STORAGE_KEY = "jrz_fb_pending_queue_v1";
const SNAPSHOT_STORAGE_PREFIX = "jrz_fb_snapshots_v1_";
const USERS_SNAPSHOT_STORAGE_KEY = "jrz_fb_users_cache_v1";
const FIREBASE_WRITE_TIMEOUT_MS = 5500;

export interface PendingFirebaseOp {
  id: string;
  coalesceKey: string;
  eventId: string;
  arena?: string;
  path: string;
  op: "set" | "update" | "remove";
  data?: any;
  createdAt: number;
  updatedAt: number;
  attempts: number;
}

export interface PendingSyncSummary {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: number;
  connected: boolean;
}

interface EventSnapshotVault {
  activeMatches?: Record<string, MatchState>;
  tgrsStates?: Record<string, any>;
  schedules?: any[];
  tournament?: any;
  archives?: Record<string, any>;
  updatedAt?: number;
}

let isFirebaseSdkConnected = false;
let hasInitializedConnectionMonitor = false;
let flushingPromise: Promise<{ flushed: number; remaining: number }> | null = null;
let isSyncingFlag = false;
let lastSuccessfulSyncAt = 0;

const pendingSyncListeners = new Set<(summary: PendingSyncSummary) => void>();

function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine !== false : true;
}

export function isCloudConnectionReady(): boolean {
  return isBrowserOnline() && isFirebaseSdkConnected;
}

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

function getActiveEventIdSafe(): string {
  return eventScopeManager.getActiveEventId() || "EVENT-A";
}

function getScopedPath(subPath: string, explicitEventId?: string): string {
  const eventId = explicitEventId || getActiveEventIdSafe();
  const cleaned = subPath.replace(/^\/+/, "");
  return `events/${eventId}/${cleaned}`;
}

function readPendingQueue(): PendingFirebaseOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingQueue(queue: PendingFirebaseOp[]): void {
  if (typeof window === "undefined") return;
  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(PENDING_QUEUE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (err) {
    console.warn("Gagal menyimpan antrean sinkronisasi lokal:", err);
  }
  emitPendingSyncSummary();
}

function emitPendingSyncSummary(): void {
  const summary: PendingSyncSummary = {
    pendingCount: readPendingQueue().length,
    isSyncing: isSyncingFlag,
    lastSyncedAt: lastSuccessfulSyncAt,
    connected: isCloudConnectionReady()
  };
  pendingSyncListeners.forEach((listener) => {
    try {
      listener(summary);
    } catch {}
  });
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("jrz_pending_sync_changed", { detail: summary }));
    } catch {}
  }
}

function enqueueCloudOp(params: {
  coalesceKey: string;
  eventId: string;
  arena?: string;
  path: string;
  op: "set" | "update" | "remove";
  data?: any;
}): void {
  const now = Date.now();
  const queue = readPendingQueue();
  const existingIdx = queue.findIndex((item) => item.coalesceKey === params.coalesceKey);

  if (existingIdx >= 0) {
    const existing = queue[existingIdx];
    let mergedOp = params.op;
    let mergedData = params.data;

    if (existing.op === "set" && params.op === "update" && existing.data && typeof existing.data === "object") {
      mergedOp = "set";
      mergedData = { ...existing.data, ...(params.data || {}) };
    } else if (existing.op === "update" && params.op === "update") {
      mergedData = { ...(existing.data || {}), ...(params.data || {}) };
    }

    queue[existingIdx] = {
      ...existing,
      path: params.path,
      op: mergedOp,
      data: mergedData,
      updatedAt: now
    };
  } else {
    queue.push({
      id: `op_${now}_${Math.random().toString(36).substring(2, 7)}`,
      coalesceKey: params.coalesceKey,
      eventId: params.eventId,
      arena: params.arena,
      path: params.path,
      op: params.op,
      data: params.data,
      createdAt: now,
      updatedAt: now,
      attempts: 0
    });
  }

  writePendingQueue(queue);
}

function readEventVault(eventId = getActiveEventIdSafe()): EventSnapshotVault {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${SNAPSHOT_STORAGE_PREFIX}${eventId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeEventVault(vault: EventSnapshotVault, eventId = getActiveEventIdSafe()): void {
  if (typeof window === "undefined") return;
  try {
    vault.updatedAt = Date.now();
    window.localStorage.setItem(`${SNAPSHOT_STORAGE_PREFIX}${eventId}`, JSON.stringify(vault));
  } catch (err) {
    console.warn("Gagal menyimpan snapshot lokal:", err);
  }
}

export function getLocalMatchSnapshot(arena = getActiveArena()): MatchState | null {
  const cleanArena = cleanArenaString(arena);
  const vault = readEventVault();
  const fromVault = vault.activeMatches?.[cleanArena];
  if (fromVault && fromVault.id) {
    return normalizeMatchState(fromVault);
  }
  if (typeof window !== "undefined") {
    try {
      const raw =
        window.localStorage.getItem("jrz_silat_match_state") ||
        window.localStorage.getItem("ipsi_match_state");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          const norm = normalizeMatchState(parsed);
          if (!parsed.arena || cleanArenaString(parsed.arena) === cleanArena) {
            return norm;
          }
        }
      }
    } catch {}
  }
  return null;
}

export function getLocalScheduleSnapshot(): any[] | null {
  const vault = readEventVault();
  if (Array.isArray(vault.schedules)) {
    return vault.schedules;
  }
  if (typeof window !== "undefined") {
    try {
      const raw =
        window.localStorage.getItem("jrz_cached_schedules") ||
        window.localStorage.getItem("match_schedules");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return null;
}

export function getLocalTgrsSnapshot(arena = getActiveArena()): any | null {
  const cleanArena = cleanArenaString(arena);
  const vault = readEventVault();
  if (vault.tgrsStates?.[cleanArena]) {
    return vault.tgrsStates[cleanArena];
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("jrz_tgrs_live_state");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export function getLocalUsersSnapshot(): UserAccount[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USERS_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLocalUsersSnapshot(users: UserAccount[]): void {
  if (typeof window === "undefined" || !Array.isArray(users)) return;
  try {
    window.localStorage.setItem(USERS_SNAPSHOT_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

async function executeWithTimeout<T>(promise: Promise<T>, timeoutMs = FIREBASE_WRITE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Firebase write timeout"));
      }
    }, timeoutMs);

    promise.then(
      (res) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(res);
        }
      },
      (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    );
  });
}

async function executeFirebaseOp(opItem: Pick<PendingFirebaseOp, "path" | "op" | "data">): Promise<void> {
  const targetRef = ref(db, opItem.path);
  if (opItem.op === "set") {
    await executeWithTimeout(set(targetRef, sanitizeForFirebase(opItem.data)));
  } else if (opItem.op === "update") {
    await executeWithTimeout(update(targetRef, sanitizeForFirebase(opItem.data)));
  } else if (opItem.op === "remove") {
    await executeWithTimeout(remove(targetRef));
  }
}

async function writeWithResilience(params: {
  coalesceKey: string;
  eventId: string;
  arena?: string;
  path: string;
  op: "set" | "update" | "remove";
  data?: any;
}): Promise<boolean> {
  if (!isCloudConnectionReady()) {
    enqueueCloudOp(params);
    return false;
  }

  try {
    await executeFirebaseOp(params);
    lastSuccessfulSyncAt = Date.now();
    // Jika masih ada antrean operasi terdahulu pada path lain, segera flush di latar belakang
    if (readPendingQueue().length > 0) {
      flushPendingCloudSync().catch(() => {});
    } else {
      emitPendingSyncSummary();
    }
    return true;
  } catch (err) {
    console.warn(`[Firebase Resilience] Koneksi tidak stabil saat menulis ${params.path}, data disimpan ke antrean sinkronisasi:`, err);
    enqueueCloudOp(params);
    return false;
  }
}

function hasPendingSyncForPath(path: string): boolean {
  const queue = readPendingQueue();
  return queue.some((item) => item.path === path);
}

function initGlobalConnectionMonitor(): void {
  if (hasInitializedConnectionMonitor || typeof window === "undefined") return;
  hasInitializedConnectionMonitor = true;

  try {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      const prev = isFirebaseSdkConnected;
      isFirebaseSdkConnected = Boolean(snap.val());
      emitPendingSyncSummary();

      if (isFirebaseSdkConnected && isBrowserOnline()) {
        if (!prev || readPendingQueue().length > 0) {
          flushPendingCloudSync().catch(() => {});
        }
      }
    });
  } catch {}

  const handleBrowserOnline = () => {
    emitPendingSyncSummary();
    if (isFirebaseSdkConnected || isBrowserOnline()) {
      setTimeout(() => {
        flushPendingCloudSync().catch(() => {});
      }, 400);
    }
  };

  const handleBrowserOffline = () => {
    emitPendingSyncSummary();
  };

  window.addEventListener("online", handleBrowserOnline);
  window.addEventListener("offline", handleBrowserOffline);

  // Jaring pengaman: jika koneksi pulih dan masih ada antrean tertunda, pastikan tersinkron
  setInterval(() => {
    if (isCloudConnectionReady() && readPendingQueue().length > 0 && !flushingPromise) {
      flushPendingCloudSync().catch(() => {});
    }
  }, 4000);
}

initGlobalConnectionMonitor();

export function assertOnlineForFirebase(): void {
  if (!isBrowserOnline()) {
    throw new Error("Koneksi internet terputus. Fitur ini memerlukan koneksi internet aktif.");
  }
}

export function getPendingCloudSyncCount(arena?: string): number {
  const queue = readPendingQueue();
  if (!arena) return queue.length;
  const cleanArena = cleanArenaString(arena);
  return queue.filter((item) => !item.arena || item.arena === cleanArena).length;
}

export function hasPendingCloudSync(arena = getActiveArena()): boolean {
  const cleanArena = cleanArenaString(arena);
  const queue = readPendingQueue();
  return queue.some((item) => !item.arena || item.arena === cleanArena);
}

export function subscribeToPendingSync(callback: (summary: PendingSyncSummary) => void): () => void {
  pendingSyncListeners.add(callback);
  callback({
    pendingCount: readPendingQueue().length,
    isSyncing: isSyncingFlag,
    lastSyncedAt: lastSuccessfulSyncAt,
    connected: isCloudConnectionReady()
  });
  return () => {
    pendingSyncListeners.delete(callback);
  };
}

export async function flushPendingCloudSync(): Promise<{ flushed: number; remaining: number }> {
  if (flushingPromise) return flushingPromise;

  const initialQueue = readPendingQueue();
  if (initialQueue.length === 0) {
    return { flushed: 0, remaining: 0 };
  }
  if (!isCloudConnectionReady()) {
    return { flushed: 0, remaining: initialQueue.length };
  }

  flushingPromise = (async () => {
    isSyncingFlag = true;
    emitPendingSyncSummary();
    let flushedCount = 0;

    try {
      while (true) {
        const currentQueue = readPendingQueue();
        if (currentQueue.length === 0 || !isCloudConnectionReady()) {
          break;
        }

        const nextOp = currentQueue[0];
        try {
          await executeFirebaseOp(nextOp);
          flushedCount++;
          lastSuccessfulSyncAt = Date.now();

          // Hapus operasi yang baru saja berhasil dikirim (baca ulang agar operasi baru yg masuk paralel tetap aman)
          const latestQueue = readPendingQueue();
          const remainingQueue = latestQueue.filter(
            (q) => !(q.id === nextOp.id && q.updatedAt === nextOp.updatedAt)
          );
          writePendingQueue(remainingQueue);
        } catch (err) {
          console.warn(`[Firebase Resilience] Gagal flush antrean ${nextOp.path}, akan dicoba ulang:`, err);
          const latestQueue = readPendingQueue();
          const idx = latestQueue.findIndex((q) => q.id === nextOp.id);
          if (idx >= 0) {
            latestQueue[idx] = { ...latestQueue[idx], attempts: (latestQueue[idx].attempts || 0) + 1 };
            writePendingQueue(latestQueue);
          }
          break;
        }
      }

      const remaining = readPendingQueue().length;
      if (flushedCount > 0 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("jrz_firebase_synced", {
            detail: { flushed: flushedCount, remaining, syncedAt: Date.now() }
          })
        );
      }
      return { flushed: flushedCount, remaining };
    } finally {
      isSyncingFlag = false;
      flushingPromise = null;
      emitPendingSyncSummary();
    }
  })();

  return flushingPromise;
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
  let localFbConnected = isFirebaseSdkConnected;

  const emitStatus = () => {
    callback(isBrowserOnline() && localFbConnected, Date.now());
  };

  const connectedRef = ref(db, ".info/connected");
  const unsubConnected = onValue(connectedRef, (snap) => {
    localFbConnected = Boolean(snap.val());
    isFirebaseSdkConnected = localFbConnected;
    emitStatus();
    if (localFbConnected && isBrowserOnline() && readPendingQueue().length > 0) {
      flushPendingCloudSync().catch(() => {});
    }
  });

  const handleOnline = () => {
    emitStatus();
    if (readPendingQueue().length > 0) {
      setTimeout(() => flushPendingCloudSync().catch(() => {}), 350);
    }
  };
  const handleOffline = () => {
    localFbConnected = false;
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

    // Pulihkan snapshot lokal yang ada segera jika sedang terputus atau belum menerima payload Firebase
    const cachedSnapshot = getLocalMatchSnapshot(cleanArena);
    if (cachedSnapshot && (!isCloudConnectionReady() || !matchEngine.getState())) {
      matchEngine.setState(cachedSnapshot);
      callback(cachedSnapshot);
    }

    const matchPath = getScopedPath(`arenas/${cleanArena}/activeMatch`);
    const matchRef = ref(db, matchPath);

    unsubMatch = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === "object") {
          const remoteNormalized = normalizeMatchState(val);
          const localCurrent = matchEngine.getState() || getLocalMatchSnapshot(cleanArena);

          // Jika ada perubahan lokal tertunda (akibat putus koneksi), jangan timpa dengan data Firebase yang lebih lama
          if (hasPendingSyncForPath(matchPath) || hasPendingCloudSync(cleanArena)) {
            if (localCurrent) {
              const { merged } = matchEngine.reconcileMatchStates(localCurrent, remoteNormalized, true);
              matchEngine.setState(merged);
              callback(merged);
              flushPendingCloudSync().catch(() => {});
              return;
            }
          }

          if (localCurrent && localCurrent.id === remoteNormalized.id) {
            const { merged, localIsNewer } = matchEngine.reconcileMatchStates(
              localCurrent,
              remoteNormalized,
              false
            );
            if (localIsNewer) {
              matchEngine.setState(merged);
              callback(merged);
              saveMatchStateToFirebase(merged, cleanArena).catch(() => {});
              return;
            }
          }

          const eventId = getActiveEventIdSafe();
          const vault = readEventVault(eventId);
          vault.activeMatches = { ...(vault.activeMatches || {}), [cleanArena]: remoteNormalized };
          writeEventVault(vault, eventId);

          matchEngine.setState(remoteNormalized);
          callback(remoteNormalized);
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
  const eventId = getActiveEventIdSafe();
  const cleanArena = cleanArenaString(arena || match.arena);
  const normalized = normalizeMatchState({
    ...match,
    arena: cleanArena,
    lastUpdatedAt: match.lastUpdatedAt || Date.now()
  });

  matchEngine.broadcast(normalized);

  // Simpan snapshot lokal segera agar data tidak pernah hilang bila koneksi mati mendadak
  const vault = readEventVault(eventId);
  vault.activeMatches = { ...(vault.activeMatches || {}), [cleanArena]: normalized };
  writeEventVault(vault, eventId);
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(normalized);
      window.localStorage.setItem("ipsi_match_state", serialized);
      window.localStorage.setItem("jrz_silat_match_state", serialized);
    } catch {}
  }

  const path = getScopedPath(`arenas/${cleanArena}/activeMatch`, eventId);
  const payload = sanitizeForFirebase({
    ...normalized,
    arena: cleanArena,
    lastUpdatedAt: normalized.lastUpdatedAt || Date.now()
  });

  await writeWithResilience({
    coalesceKey: `set:${path}`,
    eventId,
    arena: cleanArena,
    path,
    op: "set",
    data: payload
  });
}

export async function updateMatchStateInFirebase(partialState: Partial<MatchState>, arena?: string): Promise<void> {
  const eventId = getActiveEventIdSafe();
  const cleanArena = cleanArenaString(arena || partialState.arena);
  const current = matchEngine.getState() || getLocalMatchSnapshot(cleanArena);

  if (current) {
    const updated = { ...current, ...partialState, lastUpdatedAt: Date.now() } as MatchState;
    await saveMatchStateToFirebase(updated, cleanArena);
    return;
  }

  const path = getScopedPath(`arenas/${cleanArena}/activeMatch`, eventId);
  const cleanPartial = sanitizeForFirebase({
    ...partialState,
    lastUpdatedAt: Date.now()
  });

  await writeWithResilience({
    coalesceKey: `set:${path}`,
    eventId,
    arena: cleanArena,
    path,
    op: "update",
    data: cleanPartial
  });
}

export async function archiveMatchToFirebase(matchState: MatchState): Promise<void> {
  if (!matchState || !matchState.id) return;
  const eventId = getActiveEventIdSafe();
  const archivePayload = sanitizeForFirebase({
    ...matchState,
    status: "FINISHED",
    archivedAt: Date.now(),
    archivedDate: new Date().toLocaleString("id-ID")
  });

  const vault = readEventVault(eventId);
  vault.archives = { ...(vault.archives || {}), [matchState.id]: archivePayload };
  writeEventVault(vault, eventId);

  const path = getScopedPath(`archives/${matchState.id}`, eventId);
  await writeWithResilience({
    coalesceKey: `archive:${eventId}:${matchState.id}`,
    eventId,
    arena: cleanArenaString(matchState.arena),
    path,
    op: "set",
    data: archivePayload
  });
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
  const eventId = getActiveEventIdSafe();
  let cleanArena: string;
  let jId: number;
  let payload: Record<string, any>;

  if (typeof juryIdOrPress === "object" && juryIdOrPress !== null) {
    cleanArena = cleanArenaString(juryIdOrPress.arena || arena);
    jId = Number(juryIdOrPress.juryId || 1);
    payload = sanitizeForFirebase({
      juryId: jId,
      fighter: juryIdOrPress.fighter,
      action: juryIdOrPress.action,
      pressedAt: juryIdOrPress.pressedAt || juryIdOrPress.timestamp || Date.now(),
      consumed: false
    });
  } else {
    jId = Number(juryIdOrPress);
    cleanArena = cleanArenaString(arena);
    payload = sanitizeForFirebase({
      juryId: jId,
      fighter,
      action,
      pressedAt: syncedNow || Date.now(),
      consumed: false
    });
  }

  const path = getScopedPath(`arenas/${cleanArena}/juryPresses/${jId}`, eventId);
  await writeWithResilience({
    coalesceKey: `press:${eventId}:${cleanArena}:${jId}`,
    eventId,
    arena: cleanArena,
    path,
    op: "set",
    data: payload
  });
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
    if (!isCloudConnectionReady()) return;
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
    if (isCloudConnectionReady()) {
      remove(deviceRef).catch(() => {});
    }
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

    const cached = getLocalScheduleSnapshot();
    if (cached && cached.length > 0 && !isCloudConnectionReady()) {
      callback(cached);
    }

    const schedPath = getScopedPath("schedules");
    const schedRef = ref(db, schedPath);
    unsub = onValue(schedRef, (snapshot) => {
      if (hasPendingSyncForPath(schedPath)) {
        const localSched = getLocalScheduleSnapshot();
        if (localSched) {
          callback(localSched);
          flushPendingCloudSync().catch(() => {});
          return;
        }
      }

      if (snapshot.exists()) {
        const val = snapshot.val();
        const arr = Array.isArray(val) ? val : Object.values(val || {});
        const eventId = getActiveEventIdSafe();
        const vault = readEventVault(eventId);
        vault.schedules = arr;
        writeEventVault(vault, eventId);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("jrz_cached_schedules", JSON.stringify(arr));
          } catch {}
        }
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
  const eventId = getActiveEventIdSafe();
  const cleanSchedules = sanitizeForFirebase(schedules || []);

  const vault = readEventVault(eventId);
  vault.schedules = cleanSchedules;
  writeEventVault(vault, eventId);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("jrz_cached_schedules", JSON.stringify(cleanSchedules));
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: cleanSchedules }));
    } catch {}
  }

  const path = getScopedPath("schedules", eventId);
  await writeWithResilience({
    coalesceKey: `schedules:${eventId}`,
    eventId,
    path,
    op: "set",
    data: cleanSchedules
  });
}

// -----------------------------------------------------------------------------
// PENGGUNA & MANAJEMEN AKUN VIA FIREBASE RTDB
// -----------------------------------------------------------------------------
export function subscribeToUsers(callback: (users: UserAccount[]) => void): () => void {
  const cached = getLocalUsersSnapshot();
  if (cached && cached.length > 0 && !isCloudConnectionReady()) {
    callback(cached);
  }

  const usersRef = ref(db, "users");
  return onValue(usersRef, (snapshot) => {
    const hasPendingUserOps = readPendingQueue().some((q) => q.path.startsWith("users/"));
    if (hasPendingUserOps) {
      const localUsers = getLocalUsersSnapshot();
      if (localUsers) {
        callback(localUsers);
        flushPendingCloudSync().catch(() => {});
        return;
      }
    }

    if (snapshot.exists()) {
      const val = snapshot.val();
      const list: UserAccount[] = Array.isArray(val)
        ? val.filter(Boolean)
        : (Object.values(val || {}).filter(Boolean) as UserAccount[]);
      saveLocalUsersSnapshot(list);
      callback(list);
    } else {
      callback([]);
    }
  });
}

export async function saveUserToFirebase(user: UserAccount): Promise<void> {
  const safeKey = (user.id || user.username || `usr-${Date.now()}`).replace(/[.#$/[\]]/g, "_");
  const cleanUser = sanitizeForFirebase({ ...user, id: safeKey });

  const cached = getLocalUsersSnapshot() || [];
  const nextUsers = [...cached.filter((u) => u.id !== safeKey), cleanUser];
  saveLocalUsersSnapshot(nextUsers);

  const path = `users/${safeKey}`;
  await writeWithResilience({
    coalesceKey: `user:${safeKey}`,
    eventId: "GLOBAL_USERS",
    path,
    op: "set",
    data: cleanUser
  });
}

export async function updateUserInFirebase(userId: string, partial: Partial<UserAccount>): Promise<void> {
  const safeKey = userId.replace(/[.#$/[\]]/g, "_");
  const cleanPartial = sanitizeForFirebase(partial);

  const cached = getLocalUsersSnapshot();
  if (cached) {
    const nextUsers = cached.map((u) => (u.id === safeKey ? { ...u, ...cleanPartial } : u));
    saveLocalUsersSnapshot(nextUsers);
  }

  const path = `users/${safeKey}`;
  await writeWithResilience({
    coalesceKey: `user:${safeKey}`,
    eventId: "GLOBAL_USERS",
    path,
    op: "update",
    data: cleanPartial
  });
}

export async function deleteUserFromFirebase(userId: string): Promise<void> {
  const safeKey = userId.replace(/[.#$/[\]]/g, "_");
  const cached = getLocalUsersSnapshot();
  if (cached) {
    saveLocalUsersSnapshot(cached.filter((u) => u.id !== safeKey));
  }

  const path = `users/${safeKey}`;
  await writeWithResilience({
    coalesceKey: `user:${safeKey}`,
    eventId: "GLOBAL_USERS",
    path,
    op: "remove"
  });
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

    if (!isCloudConnectionReady()) {
      const vault = readEventVault();
      const cachedResult: Record<string, MatchState | null> = {};
      arenas.forEach((a) => {
        const active = vault.activeMatches?.[a];
        cachedResult[a] = active ? normalizeMatchState(active) : null;
      });
      callback(cachedResult);
    }

    const arenasRef = ref(db, getScopedPath("arenas"));
    unsub = onValue(arenasRef, (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : {};
      const vault = readEventVault();
      const result: Record<string, MatchState | null> = {};
      arenas.forEach((a) => {
        const active = hasPendingCloudSync(a) && vault.activeMatches?.[a]
          ? vault.activeMatches[a]
          : val?.[a]?.activeMatch;
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
  const eventId = getActiveEventIdSafe();
  const payload = sanitizeForFirebase(
    participants !== undefined || categories !== undefined
      ? {
          matches: dataOrMatches || [],
          participants: participants || [],
          categories: categories || [],
          updatedAt: Date.now()
        }
      : { ...(dataOrMatches || {}), updatedAt: Date.now() }
  );

  const vault = readEventVault(eventId);
  vault.tournament = payload;
  writeEventVault(vault, eventId);

  const path = getScopedPath("tournament", eventId);
  await writeWithResilience({
    coalesceKey: `tournament:${eventId}`,
    eventId,
    path,
    op: "set",
    data: payload
  });
}

export async function saveTgrsStateToFirebase(tgrsState: any, arena?: string): Promise<void> {
  if (!tgrsState) return;
  const eventId = getActiveEventIdSafe();
  const cleanArena = cleanArenaString(arena || tgrsState.gelanggang);
  const payload = sanitizeForFirebase({
    ...tgrsState,
    lastUpdatedAt: Date.now()
  });

  const vault = readEventVault(eventId);
  vault.tgrsStates = { ...(vault.tgrsStates || {}), [cleanArena]: payload };
  writeEventVault(vault, eventId);

  const path = getScopedPath(`arenas/${cleanArena}/tgrsState`, eventId);
  await writeWithResilience({
    coalesceKey: `tgrs:${eventId}:${cleanArena}`,
    eventId,
    arena: cleanArena,
    path,
    op: "set",
    data: payload
  });
}

export function subscribeToTgrsState(arena: string, callback: (state: any) => void): () => void {
  const cleanArena = cleanArenaString(arena);
  const cached = getLocalTgrsSnapshot(cleanArena);
  if (cached && !isCloudConnectionReady()) {
    callback(cached);
  }

  const tgrsPath = getScopedPath(`arenas/${cleanArena}/tgrsState`);
  return onValue(ref(db, tgrsPath), (snap) => {
    if (hasPendingSyncForPath(tgrsPath)) {
      const localTgrs = getLocalTgrsSnapshot(cleanArena);
      if (localTgrs) {
        callback(localTgrs);
        flushPendingCloudSync().catch(() => {});
        return;
      }
    }
    if (snap.exists()) {
      const val = snap.val();
      const eventId = getActiveEventIdSafe();
      const vault = readEventVault(eventId);
      vault.tgrsStates = { ...(vault.tgrsStates || {}), [cleanArena]: val };
      writeEventVault(vault, eventId);
      callback(val);
    }
  });
}

// -----------------------------------------------------------------------------
// KOMPATIBILITAS TOURNAMENT CONTEXT
// -----------------------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  if (!isBrowserOnline()) return false;
  try {
    const snap = await executeWithTimeout(get(ref(db, ".info/connected")), 3500);
    const ok = Boolean(snap.val());
    isFirebaseSdkConnected = ok;
    return ok;
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
