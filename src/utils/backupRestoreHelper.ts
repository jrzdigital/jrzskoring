/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cadangan & Pemulihan Data Turnamen (Backup & Restore JSON)
 * Memungkinkan ekspor seluruh data atlet terdaftar, jadwal pertandingan,
 * riwayat arsip, dan kategori ke format file JSON lokal, serta mengimpornya kembali.
 */

import { syncTournamentToFirebase, saveScheduleToFirebase } from "../services/firebase";
import { normalizeAthleteRecord } from "./baganGenerator";

export interface TournamentBackupPayload {
  app: string;
  version: string;
  backupDate: string;
  timestamp: number;
  metadata?: {
    tournamentName?: string;
    arena?: string;
    exportedBy?: string;
  };
  summary: {
    totalAthletes: number;
    totalMatches: number;
    totalArchives: number;
    totalCategories: number;
  };
  data: {
    athletes: any[];
    matchesSchedule: any[];
    archivedMatches: any[];
    categories: any[];
    activeMatch?: any;
    arenaMatches?: Record<string, any>;
    localStorageSnapshot?: Record<string, any>;
  };
}

/**
 * Mengumpulkan seluruh data atlet dari LocalStorage dan server
 */
export async function collectAllAthletes(): Promise<any[]> {
  const map = new Map<string, any>();

  // 1. Dari LocalStorage
  if (typeof window !== "undefined") {
    const keys = ["jrz_cached_participants", "registered_athletes", "jrz_portal_athletes"];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item, idx) => {
              if (item && (item.name || item.id)) {
                const norm = normalizeAthleteRecord(item, idx);
                const uniqueKey = norm.id || `${norm.name}_${norm.contingent}_${norm.weightClass}_${norm.gender}`;
                if (!map.has(uniqueKey)) {
                  map.set(uniqueKey, norm);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn(`Gagal membaca atlet dari ${key}:`, e);
      }
    }
  }

  // 2. Dari Server API (bila online)
  try {
    const res = await fetch("/api/participants").catch(() => null);
    if (res && res.ok) {
      const serverList = await res.json().catch(() => []);
      if (Array.isArray(serverList)) {
        serverList.forEach((item, idx) => {
          if (item && (item.name || item.id)) {
            const norm = normalizeAthleteRecord(item, idx);
            const uniqueKey = norm.id || `${norm.name}_${norm.contingent}_${norm.weightClass}_${norm.gender}`;
            if (!map.has(uniqueKey)) {
              map.set(uniqueKey, norm);
            }
          }
        });
      }
    }
  } catch {}

  return Array.from(map.values());
}

/**
 * Mengumpulkan seluruh jadwal pertandingan dari LocalStorage dan server
 */
export async function collectAllMatches(): Promise<any[]> {
  const map = new Map<string, any>();

  // 1. Dari LocalStorage
  if (typeof window !== "undefined") {
    const keys = ["jrz_cached_schedules", "match_schedules"];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((m) => {
              if (m && (m.id || m.matchNumber)) {
                const uniqueKey = m.id || `match-${m.matchNumber}-${m.stage}-${m.fighterRedName || m.fighterRedId}`;
                if (!map.has(uniqueKey)) {
                  map.set(uniqueKey, m);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn(`Gagal membaca jadwal dari ${key}:`, e);
      }
    }
  }

  // 2. Dari Server API
  try {
    const res = await fetch("/api/matches-schedule").catch(() => null);
    if (res && res.ok) {
      const serverList = await res.json().catch(() => []);
      if (Array.isArray(serverList)) {
        serverList.forEach((m) => {
          if (m && (m.id || m.matchNumber)) {
            const uniqueKey = m.id || `match-${m.matchNumber}-${m.stage}-${m.fighterRedName || m.fighterRedId}`;
            if (!map.has(uniqueKey)) {
              map.set(uniqueKey, m);
            }
          }
        });
      }
    }
  } catch {}

  return Array.from(map.values());
}

/**
 * Mengumpulkan riwayat pertandingan yang sudah selesai (Arsip)
 */
export function collectArchivedMatches(): any[] {
  const map = new Map<string, any>();
  if (typeof window !== "undefined") {
    const keys = ["jrz_archived_matches", "ipsi_finished_matches_archive"];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.id) {
                map.set(item.id, item);
              }
            });
          }
        }
      } catch {}
    }
  }
  return Array.from(map.values());
}

/**
 * Mengumpulkan kategori kelas pertandingan
 */
export async function collectAllCategories(): Promise<any[]> {
  const map = new Map<string, any>();
  if (typeof window !== "undefined") {
    const keys = ["jrz_cached_categories", "tournament_categories"];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              if (c && (c.id || c.name)) {
                map.set(c.id || c.name, c);
              }
            });
          }
        }
      } catch {}
    }
  }

  try {
    const res = await fetch("/api/categories").catch(() => null);
    if (res && res.ok) {
      const serverCats = await res.json().catch(() => []);
      if (Array.isArray(serverCats)) {
        serverCats.forEach((c) => {
          if (c && (c.id || c.name)) {
            map.set(c.id || c.name, c);
          }
        });
      }
    }
  } catch {}

  return Array.from(map.values());
}

/**
 * Ekspor seluruh data atlet & pertandingan ke file JSON lokal dan otomatis unduh
 */
export async function exportTournamentBackupJson(): Promise<{
  success: boolean;
  filename: string;
  summary: TournamentBackupPayload["summary"];
}> {
  const [athletes, matchesSchedule, categories] = await Promise.all([
    collectAllAthletes(),
    collectAllMatches(),
    collectAllCategories()
  ]);

  const archivedMatches = collectArchivedMatches();

  // Snapshot active matches
  let activeMatch: any = null;
  const arenaMatches: Record<string, any> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("jrz_silat_match_state");
      if (raw) activeMatch = JSON.parse(raw);
      ["A", "B", "C", "D"].forEach((arena) => {
        const rawA = localStorage.getItem(`jrz_silat_match_state_${arena}`);
        if (rawA) {
          try { arenaMatches[arena] = JSON.parse(rawA); } catch {}
        }
      });
    } catch {}
  }

  // Backup snapshot keys
  const localStorageSnapshot: Record<string, any> = {};
  if (typeof window !== "undefined") {
    [
      "jrz_tournament_name",
      "ipsi_active_arena",
      "jrz_tournament_categories"
    ].forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) localStorageSnapshot[k] = val;
    });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `BACKUP_JRZ_ATLET_PERTANDINGAN_${dateFormatted}.json`;

  const payload: TournamentBackupPayload = {
    app: "JRZ_SCORE_IPSI_2026",
    version: "3.2.0",
    backupDate: now.toISOString(),
    timestamp: now.getTime(),
    metadata: {
      tournamentName: (typeof window !== "undefined" && localStorage.getItem("jrz_tournament_name")) || "PAKU BANTEN CHAMPIONSHIP",
      arena: (typeof window !== "undefined" && localStorage.getItem("ipsi_active_arena")) || "A",
      exportedBy: "Operator / Sekretaris"
    },
    summary: {
      totalAthletes: athletes.length,
      totalMatches: matchesSchedule.length,
      totalArchives: archivedMatches.length,
      totalCategories: categories.length
    },
    data: {
      athletes,
      matchesSchedule,
      archivedMatches,
      categories,
      activeMatch,
      arenaMatches,
      localStorageSnapshot
    }
  };

  // Trigger local file download
  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    summary: payload.summary
  };
}

/**
 * Validasi dan baca isi file JSON cadangan yang diunggah
 */
export async function parseAndValidateBackupFile(file: File): Promise<TournamentBackupPayload> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("Berkas file tidak ditemukan"));
    }
    if (!file.name.endsWith(".json")) {
      return reject(new Error("Format berkas harus berupa file JSON (.json)"));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validasi minimal struktur data
        let athletes: any[] = [];
        let matchesSchedule: any[] = [];
        let archivedMatches: any[] = [];
        let categories: any[] = [];

        if (parsed.data) {
          athletes = Array.isArray(parsed.data.athletes) ? parsed.data.athletes : [];
          matchesSchedule = Array.isArray(parsed.data.matchesSchedule) ? parsed.data.matchesSchedule : [];
          archivedMatches = Array.isArray(parsed.data.archivedMatches) ? parsed.data.archivedMatches : [];
          categories = Array.isArray(parsed.data.categories) ? parsed.data.categories : [];
        } else if (Array.isArray(parsed.athletes) || Array.isArray(parsed.participants)) {
          // Format flat fallback
          athletes = Array.isArray(parsed.athletes) ? parsed.athletes : (parsed.participants || []);
          matchesSchedule = Array.isArray(parsed.matchesSchedule) ? parsed.matchesSchedule : (parsed.matches || []);
          archivedMatches = Array.isArray(parsed.archivedMatches) ? parsed.archivedMatches : [];
          categories = Array.isArray(parsed.categories) ? parsed.categories : [];
        } else if (Array.isArray(parsed)) {
          // Bila array langsung
          athletes = parsed;
        } else {
          return reject(new Error("Format data JSON tidak valid: tidak ditemukan struktur atlet atau pertandingan"));
        }

        const payload: TournamentBackupPayload = {
          app: parsed.app || "JRZ_SCORE_IPSI_2026",
          version: parsed.version || "3.2.0",
          backupDate: parsed.backupDate || new Date().toISOString(),
          timestamp: parsed.timestamp || Date.now(),
          metadata: parsed.metadata || {},
          summary: {
            totalAthletes: athletes.length,
            totalMatches: matchesSchedule.length,
            totalArchives: archivedMatches.length,
            totalCategories: categories.length
          },
          data: {
            athletes,
            matchesSchedule,
            archivedMatches,
            categories,
            activeMatch: parsed.data?.activeMatch || parsed.activeMatch,
            arenaMatches: parsed.data?.arenaMatches || {},
            localStorageSnapshot: parsed.data?.localStorageSnapshot || {}
          }
        };

        resolve(payload);
      } catch (err: any) {
        reject(new Error(`Gagal membaca isi JSON: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file dari disk"));
    reader.readAsText(file);
  });
}

/**
 * Pulihkan / Impor data dari payload JSON cadangan ke dalam sistem
 */
export async function restoreTournamentBackupJson(
  payload: TournamentBackupPayload,
  mode: "replace" | "merge" = "replace"
): Promise<{
  success: boolean;
  message: string;
  summary: TournamentBackupPayload["summary"];
}> {
  if (!payload || !payload.data) {
    throw new Error("Payload cadangan kosong atau tidak valid");
  }

  let finalAthletes = payload.data.athletes || [];
  let finalMatches = payload.data.matchesSchedule || [];
  let finalArchives = payload.data.archivedMatches || [];
  let finalCategories = payload.data.categories || [];

  if (mode === "merge") {
    const existingAthletes = await collectAllAthletes();
    const existingMatches = await collectAllMatches();
    const existingArchives = collectArchivedMatches();
    const existingCategories = await collectAllCategories();

    // Gabungkan & deduplikasi atlet
    const athleteMap = new Map<string, any>();
    existingAthletes.forEach((a, idx) => {
      const norm = normalizeAthleteRecord(a, idx);
      athleteMap.set(norm.id || `${norm.name}_${norm.contingent}_${norm.weightClass}`, norm);
    });
    finalAthletes.forEach((a, idx) => {
      const norm = normalizeAthleteRecord(a, idx);
      athleteMap.set(norm.id || `${norm.name}_${norm.contingent}_${norm.weightClass}`, norm);
    });
    finalAthletes = Array.from(athleteMap.values());

    // Gabungkan & deduplikasi jadwal partai
    const matchMap = new Map<string, any>();
    existingMatches.forEach((m) => matchMap.set(m.id || `m-${m.matchNumber}`, m));
    finalMatches.forEach((m) => matchMap.set(m.id || `m-${m.matchNumber}`, m));
    finalMatches = Array.from(matchMap.values());

    // Gabungkan riwayat arsip
    const archiveMap = new Map<string, any>();
    existingArchives.forEach((a) => archiveMap.set(a.id, a));
    finalArchives.forEach((a) => archiveMap.set(a.id, a));
    finalArchives = Array.from(archiveMap.values());

    // Gabungkan kategori
    const catMap = new Map<string, any>();
    existingCategories.forEach((c) => catMap.set(c.id || c.name, c));
    finalCategories.forEach((c) => catMap.set(c.id || c.name, c));
    finalCategories = Array.from(catMap.values());
  }

  // 1. Simpan ke LocalStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("jrz_cached_participants", JSON.stringify(finalAthletes));
      localStorage.setItem("registered_athletes", JSON.stringify(finalAthletes));
      localStorage.setItem("jrz_portal_athletes", JSON.stringify(finalAthletes));

      localStorage.setItem("jrz_cached_schedules", JSON.stringify(finalMatches));
      localStorage.setItem("match_schedules", JSON.stringify(finalMatches));

      if (finalArchives.length > 0) {
        localStorage.setItem("jrz_archived_matches", JSON.stringify(finalArchives));
        localStorage.setItem("ipsi_finished_matches_archive", JSON.stringify(finalArchives));
      }

      if (finalCategories.length > 0) {
        localStorage.setItem("jrz_cached_categories", JSON.stringify(finalCategories));
      }

      localStorage.removeItem("jrz_bracket_cleared");

      // Pulihkan snapshot metadata
      if (payload.data.localStorageSnapshot) {
        Object.entries(payload.data.localStorageSnapshot).forEach(([k, v]) => {
          try {
            localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
          } catch {}
        });
      }

      // Pulihkan active match bila replace
      if (mode === "replace" && payload.data.activeMatch && payload.data.activeMatch.id) {
        localStorage.setItem("jrz_silat_match_state", JSON.stringify(payload.data.activeMatch));
      }
      if (mode === "replace" && payload.data.arenaMatches) {
        Object.entries(payload.data.arenaMatches).forEach(([arenaKey, aState]) => {
          try {
            localStorage.setItem(`jrz_silat_match_state_${arenaKey}`, JSON.stringify(aState));
          } catch {}
        });
      }
    } catch (e) {
      console.error("Gagal menyimpan ke LocalStorage:", e);
    }
  }

  // 2. Sinkronkan data ke Firebase Realtime Database
  try {
    await syncTournamentToFirebase(finalMatches, finalAthletes, finalCategories);
    await saveScheduleToFirebase(finalMatches);
  } catch (err) {
    console.warn("Gagal sinkronisasi backup ke Firebase RTDB:", err);
  }

  // 3. Sinkronkan ke Server Backend (bila backend aktif)
  try {
    await fetch("/api/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participants: finalAthletes,
        matchesSchedule: finalMatches,
        categories: finalCategories,
        activeMatch: mode === "replace" ? payload.data.activeMatch : undefined,
        mode
      })
    }).catch(() => {});
  } catch {}

  // 4. Siarkan event sinkronisasi turnamen ke seluruh view
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("jrz_tournament_synced", {
        detail: {
          participants: finalAthletes,
          matches: finalMatches,
          categories: finalCategories
        }
      }));
      window.dispatchEvent(new CustomEvent("jrz_athletes_updated", { detail: { participants: finalAthletes } }));
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: { matches: finalMatches } }));
      window.dispatchEvent(new StorageEvent("storage", { key: "jrz_cached_participants" }));
      window.dispatchEvent(new StorageEvent("storage", { key: "jrz_cached_schedules" }));
    } catch {}
  }

  const resultSummary = {
    totalAthletes: finalAthletes.length,
    totalMatches: finalMatches.length,
    totalArchives: finalArchives.length,
    totalCategories: finalCategories.length
  };

  return {
    success: true,
    message: `Berhasil memulihkan cadangan: ${resultSummary.totalAthletes} atlet, ${resultSummary.totalMatches} partai jadwal, dan ${resultSummary.totalArchives} riwayat pertandingan.`,
    summary: resultSummary
  };
}
