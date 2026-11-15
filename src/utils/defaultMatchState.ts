import { MatchState } from "../types";
import { isJurusCategory, getTgrsSubCategory } from "./categoryHelper";

let serverTimeOffset = 0;

export function setServerTimeOffset(offset: number) {
  serverTimeOffset = offset;
}

export function getSyncedNow(): number {
  return Date.now() + serverTimeOffset;
}

const DEFAULT_PENALTIES = () => ({
  binaan1: false,
  binaan2: false,
  teguran1: false,
  teguran2: false,
  peringatan1: false,
  peringatan2: false,
  disqualified: false
});

const DEFAULT_STATS = () => ({
  punch: 0,
  kick: 0,
  drop: 0,
  punches: 0,
  kicks: 0,
  drops: 0,
  penalties: 0
});

export function createDefaultMatchState(arena: string = "ARENA A"): MatchState {
  return {
    id: `match-${Date.now()}`,
    matchNumber: "1",
    arena,
    kelas: "Kelas C (55-60 kg)",
    classCategory: "Kelas C (55-60 kg)",
    kategori: "TANDING",
    category: "TANDING",
    golongan: "DEWASA",
    division: "DEWASA",
    stage: "PENYISIHAN",
    status: "IDLE",
    currentRound: 1,
    activeRound: 1,
    roundCount: 3,
    roundTimer: 120,
    timeLeft: 120,
    roundDuration: 120,
    timerStartedAt: null,
    timerEndAt: null,
    fighterRedName: "Pesilat Merah",
    fighterRedClub: "Kontingen Merah",
    fighterBlueName: "Pesilat Biru",
    fighterBlueClub: "Kontingen Biru",
    scoreRed: 0,
    scoreBlue: 0,
    redStats: DEFAULT_STATS(),
    blueStats: DEFAULT_STATS(),
    redPenalties: DEFAULT_PENALTIES(),
    bluePenalties: DEFAULT_PENALTIES(),
    juryScores: {
      1: { red: 0, blue: 0 },
      2: { red: 0, blue: 0 },
      3: { red: 0, blue: 0 }
    },
    activeJuryPresses: { 1: null, 2: null, 3: null },
    juryPressHistory: [],
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
      active: false,
      action: null,
      targetCorner: null,
      votes: { 1: null, 2: null, 3: null },
      result: null
    },
    winner: null,
    winnerColor: null,
    winnerPublished: false
  };
}

export function normalizeMatchState(raw: any): MatchState {
  if (!raw) return createDefaultMatchState();
  const base = createDefaultMatchState(raw.arena || "ARENA A");
  const isJurus = isJurusCategory(raw);
  const subCat = isJurus ? getTgrsSubCategory(raw) : undefined;
  const resolvedKategori = isJurus ? (subCat || "TUNGGAL") : (raw.kategori || raw.category || "TANDING");

  const redName = raw.fighterRedName || raw.merah?.nama || raw.athleteRed?.name || base.fighterRedName;
  const redClub = raw.fighterRedClub || raw.merah?.kontingen || raw.athleteRed?.contingent || base.fighterRedClub;
  const blueName = raw.fighterBlueName || raw.biru?.nama || raw.athleteBlue?.name || base.fighterBlueName;
  const blueClub = raw.fighterBlueClub || raw.biru?.kontingen || raw.athleteBlue?.contingent || base.fighterBlueClub;

  const scoreRed = typeof raw.scoreRed === "number" ? raw.scoreRed : (typeof raw.merah?.skor === "number" ? raw.merah.skor : 0);
  const scoreBlue = typeof raw.scoreBlue === "number" ? raw.scoreBlue : (typeof raw.biru?.skor === "number" ? raw.biru.skor : 0);
  const activeRound = Number(raw.activeRound || raw.currentRound || 1);
  const roundDuration = Number(raw.roundDuration || 120);
  const timeLeft = typeof raw.timeLeft === "number" ? raw.timeLeft : (typeof raw.roundTimer === "number" ? raw.roundTimer : roundDuration);

  return {
    ...base,
    ...raw,
    kategori: resolvedKategori,
    category: resolvedKategori,
    classCategory: raw.classCategory || raw.kelas || base.classCategory,
    tgrSubCategory: subCat,
    discipline: isJurus ? "SENI" : "TANDING",
    isJurusCategory: isJurus,
    isJurus: isJurus,
    isTgr: isJurus,
    isSeni: isJurus,
    isTanding: !isJurus,
    currentRound: activeRound,
    activeRound,
    roundCount: Number(raw.roundCount || 3),
    roundDuration,
    timeLeft,
    roundTimer: timeLeft,
    fighterRedName: redName,
    fighterRedClub: redClub,
    fighterBlueName: blueName,
    fighterBlueClub: blueClub,
    scoreRed,
    scoreBlue,
    redStats: { ...DEFAULT_STATS(), ...(raw.redStats || {}) },
    blueStats: { ...DEFAULT_STATS(), ...(raw.blueStats || {}) },
    redPenalties: { ...DEFAULT_PENALTIES(), ...(raw.redPenalties || {}) },
    bluePenalties: { ...DEFAULT_PENALTIES(), ...(raw.bluePenalties || {}) },
    juryScores: raw.juryScores || base.juryScores,
    activeJuryPresses: { 1: null, 2: null, 3: null, ...(raw.activeJuryPresses || {}) },
    juryPressHistory: Array.isArray(raw.juryPressHistory) ? raw.juryPressHistory : [],
    merah: {
      nama: redName || "Pesilat Merah",
      kontingen: redClub || "Kontingen Merah",
      skor: scoreRed,
      teguranCount: raw.merah?.teguranCount || 0,
      peringatanCount: raw.merah?.peringatanCount || 0,
      scoreDetails: raw.merah?.scoreDetails || {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: scoreRed
      }
    },
    biru: {
      nama: blueName || "Pesilat Biru",
      kontingen: blueClub || "Kontingen Biru",
      skor: scoreBlue,
      teguranCount: raw.biru?.teguranCount || 0,
      peringatanCount: raw.biru?.peringatanCount || 0,
      scoreDetails: raw.biru?.scoreDetails || {
        pukulan: 0,
        tendangan: 0,
        jatuhan: 0,
        binaan: 0,
        teguran: 0,
        peringatan: 0,
        total: scoreBlue
      }
    },
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    verification: {
      ...base.verification!,
      ...(raw.verification || {}),
      votes: { 1: null, 2: null, 3: null, ...(raw.verification?.votes || {}) }
    }
  };
}
