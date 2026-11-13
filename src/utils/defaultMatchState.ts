import { MatchState } from "../types";
import { isJurusCategory, getTgrsSubCategory } from "./categoryHelper";

let serverTimeOffset = 0;

export function setServerTimeOffset(offset: number) {
  serverTimeOffset = offset;
}

export function getSyncedNow(): number {
  return Date.now() + serverTimeOffset;
}

export function createDefaultMatchState(arena: string = "ARENA A"): MatchState {
  return {
    id: `match-${Date.now()}`,
    matchNumber: "1",
    arena,
    kelas: "Kelas C (55-60 kg)",
    kategori: "TANDING",
    golongan: "DEWASA",
    status: "PENDING",
    currentRound: 1,
    roundTimer: 120,
    roundDuration: 120,
    merah: {
      nama: "Pesilat Merah",
      kontingen: "Kontingen Merah",
      skor: 0,
      scoreDetails: {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: 0
      },
      teguranCount: 0,
      peringatanCount: 0
    },
    biru: {
      nama: "Pesilat Biru",
      kontingen: "Kontingen Biru",
      skor: 0,
      scoreDetails: {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: 0
      },
      teguranCount: 0,
      peringatanCount: 0
    },
    logs: [],
    verification: {
      action: null,
      targetCorner: null,
      votes: { 1: null, 2: null, 3: null },
      result: null
    },
    winner: null
  };
}

export function normalizeMatchState(raw: any): MatchState {
  if (!raw) return createDefaultMatchState();
  const isJurus = isJurusCategory(raw);
  const subCat = isJurus ? getTgrsSubCategory(raw) : undefined;
  const resolvedKategori = isJurus ? (subCat || "TUNGGAL") : (raw.kategori || raw.category || "TANDING");

  return {
    ...createDefaultMatchState(raw.arena || "ARENA A"),
    ...raw,
    kategori: resolvedKategori,
    category: resolvedKategori,
    tgrSubCategory: subCat,
    discipline: isJurus ? "SENI" : "TANDING",
    isJurusCategory: isJurus,
    isJurus: isJurus,
    isTgr: isJurus,
    isSeni: isJurus,
    isTanding: !isJurus,
    merah: {
      nama: raw.merah?.nama || "Pesilat Merah",
      kontingen: raw.merah?.kontingen || "Kontingen Merah",
      skor: typeof raw.merah?.skor === "number" ? raw.merah.skor : 0,
      teguranCount: raw.merah?.teguranCount || 0,
      peringatanCount: raw.merah?.peringatanCount || 0,
      scoreDetails: raw.merah?.scoreDetails || {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: raw.merah?.skor || 0
      }
    },
    biru: {
      nama: raw.biru?.nama || "Pesilat Biru",
      kontingen: raw.biru?.kontingen || "Kontingen Biru",
      skor: typeof raw.biru?.skor === "number" ? raw.biru.skor : 0,
      teguranCount: raw.biru?.teguranCount || 0,
      peringatanCount: raw.biru?.peringatanCount || 0,
      scoreDetails: raw.biru?.scoreDetails || {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: raw.biru?.skor || 0
      }
    },
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    verification: raw.verification || {
      action: null,
      targetCorner: null,
      votes: { 1: null, 2: null, 3: null },
      result: null
    }
  };
}
