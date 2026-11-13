/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CORE SCORING & STATE ENGINE FOR PENCAK SILAT JURUS TGRS
 * Standar Resmi PERSILAT & PB IPSI 2026:
 * - T: TUNGGAL BAKU (100 Jurus Baku IPSI, Aturan 3.1.1)
 * - G: GANDA (Teknik Serang Bela Pasangan)
 * - R: REGU (100 Gerak Baku Trio Serempak)
 * - S: SOLO KREATIF (Koreografi Senjata Bebas & Musik)
 */

import { useState, useEffect } from "react";
import { TgrsSubCategory } from "./categoryHelper";

export const DURASI_STANDAR_TGRS_DETIK = 180; // 3 Menit (03:00)
export const TOLERANSI_WAKTU_DETIK = 5; // Batas toleransi aman (+/- 5 detik)
export const SKOR_DASAR_BAKU = 9.90; // Standar Tunggal & Regu
export const SKOR_DASAR_GANDA_SOLO = 9.10; // Standar Ganda & Solo Kreatif / Tunggal Bebas
export const PENALTI_GERAK_311 = 0.01; // Pengurangan per kesalahan gerak baku

export type TgrsErrorType =
  | "GENERAL_WRONG"        // Salah Gerak Cepat (-0.01)
  | "DETAIL_GERAK"         // Rincian Detail Gerak Salah (-0.01)
  | "URUTAN_GERAK"         // Urutan Rincian Gerak Terbalik (-0.01)
  | "GERAKAN_TERTINGGAL"   // Gerakan Tertinggal / Terlewat (-0.01)
  | "SENJATA_TERLEPAS"     // Senjata Terlepas Tidak Menyentuh Matras (-0.01)
  | "KETIDAKKOMPAKAN";     // Khusus Regu: Tidak Kompak / Terlambat (-0.01)

export interface TgrsErrorRecord {
  id: string;
  type: TgrsErrorType;
  label: string;
  timestamp: number;
  timeFormatted: string;
  deduction: number;
}

export interface TgrsJudgeState {
  id: number;
  name: string;
  // Tunggal & Regu:
  errorsCount: number;
  errorHistory: TgrsErrorRecord[];
  kebenaranScore: number; // 9.90 - (errors * 0.01)
  kemantapanScore: number; // Tunggal: 0.01 - 0.10 | Ganda/Solo (Kemantapan & harmoni): starts 0.00
  // Ganda & Solo Kreatif (Tunggal Bebas):
  serangBelaScore?: number; // Tekhnik Serang Bela (starts 0.00)
  penjiwaanScore?: number;  // Penjiwaan penghayatan (starts 0.00)
  teknikScore?: number;     // Alias / fallback
  koreografiScore?: number; // Alias / fallback
  // Calculated:
  totalScore: number;
  isSubmitted: boolean;
  lastPressedAt?: number;
}

export interface TgrsDewanPenalties {
  toleransiWaktuCount?: number;     // 1. Penampilan melebihi / kurang dari toleransi waktu (-0.50 per hukuman)
  keluarGelanggangCount: number;    // 2. Penampilan keluar gelanggang 10M x 10M (-0.50 per hukuman)
  senjataJatuhCount: number;        // 3. Senjata Jatuh, Menyentuh matras (Tunggal) / tidak sesuai deskripsi (Ganda) (-0.50 per hukuman)
  senjataJatuhLuarGelanggangCount?: number; // 4. Senjata jatuh diluar gelanggang saat tim masih harus menggunakannya (Ganda) (-0.50 per hukuman)
  senjataRusakPatahCount?: number;  // Senjata terlepas dari gagangnya / patah / rusak (Tunggal Bebas) (-0.50 per hukuman)
  atributLepasCount: number;        // 5. Pakaian tidak sesuai aturan (-0.50 per hukuman)
  menahanGerakanCount?: number;     // 6. Menahan gerakan lebih dari 5 detik (-0.50 per hukuman)
  penaltiWaktuOtomatis: number;     // Otomatis dihitung dari deviasi waktu 3 menit
  diskualifikasi: boolean;          // Peragaan didiskualifikasi
}

export interface TgrsPerformerState {
  corner: "BLUE" | "RED";
  athleteName: string;
  contingent: string;
  timerElapsed: number; // Detik berjalan 0 -> 180+
  timerRemaining: number; // Detik mundur 180 -> 0
  timer3MinElapsed?: number; // Detik berjalan Timer 3 Menit (0 -> 180)
  isTimerRunning: boolean; // Timer 1 (Waktu Penampil) aktif
  isTimer2Running?: boolean; // Timer 2 (Timer 3 Menit) aktif
  isPerformerFinished?: boolean; // Timer 1 terkunci saat STOP ditekan
  performerTime?: number | null; // Nilai waktu terkunci Timer 1
  is3MinFinished?: boolean; // Timer 2 mencapai 03:00
  isFinished: boolean;
  targetDuration?: number; // Durasi target penampil (detik, default 180, opsi 90 / 110 / 180)
  judges: Record<number, TgrsJudgeState>;
  dewanPenalties: TgrsDewanPenalties;
  finalScore: number;
  averageScore: number;
  totalPenaltiDewan: number;
  discardedHigh: number[];
  discardedLow: number[];
  validScores: number[];
}

export interface TgrsMatchState {
  id: string;
  partai: string;
  gelanggang: string;
  category: TgrsSubCategory;
  categoryLabel: string;
  gender: "PUTRA" | "PUTRI";
  ageCategory: string;
  stage: string;

  // Sistem Penampil VS (Sudut Biru vs Sudut Merah)
  activeCorner: "BLUE" | "RED";
  bluePerformer: TgrsPerformerState;
  redPerformer: TgrsPerformerState;
  winnerCorner?: "BLUE" | "RED" | "DRAW" | null;
  winnerReason?: string;
  winnerAnnounced: boolean;

  // Active Corner Mirrors (Backward-compatible for Jury, Timer & Dewan Controls)
  athleteName: string;
  contingent: string;
  targetDuration?: number; // Durasi target penampil (detik, default 180, opsi: 90s, 110s, 180s)
  timerElapsed: number; // Detik berjalan 0 -> 180+ (Waktu Penampil)
  timerRemaining: number; // Detik mundur 180 -> 0
  timer3MinElapsed?: number; // Detik berjalan Timer 2 (Timer 3 Menit)
  isTimerRunning: boolean; // Timer 1 (Waktu Penampil) aktif
  isTimer2Running?: boolean; // Timer 2 (Timer 3 Menit) aktif
  isPerformerFinished?: boolean; // Timer 1 terkunci saat STOP ditekan
  performerTime?: number | null; // Nilai waktu terkunci Timer 1
  is3MinFinished?: boolean; // Timer 2 mencapai 03:00
  isFinished: boolean;
  isLocked: boolean;
  timerStartedAt?: number | null;

  // Nilai Seluruh Juri (3, 5, atau 10 Juri)
  judgesCount: number;
  judges: Record<number, TgrsJudgeState>;

  // Hukuman Dewan
  dewanPenalties: TgrsDewanPenalties;

  // Hasil Kalkulasi Resmi
  finalScore: number;
  averageScore: number;
  medianScore?: number;
  stdDev?: number;
  discardedHigh: number[];
  discardedLow: number[];
  validScores: number[];
  totalPenaltiDewan: number;
  notes?: string;
}

/**
 * Interface & Fungsi Perhitungan Median & Standar Deviasi Standar PB IPSI / PERSILAT
 */
export interface TgrsMedianStats {
  median: number;
  stdDev: number;
  mean: number;
  sortedScores: number[];
  medianJudgeIds: number[];
}

export function computeTgrsMedianAndStdDev(
  scoresWithId: { id: number; score: number }[]
): TgrsMedianStats {
  if (scoresWithId.length === 0) {
    return {
      median: 0,
      stdDev: 0,
      mean: 0,
      sortedScores: [],
      medianJudgeIds: []
    };
  }

  // Urutkan skor ascending; jika sama pertahankan urutan
  const sorted = [...scoresWithId].sort((a, b) => a.score - b.score);
  const n = sorted.length;
  let median = 0;
  let medianJudgeIds: number[] = [];

  if (n % 2 === 1) {
    const mid = Math.floor(n / 2);
    median = sorted[mid].score;
    medianJudgeIds = [sorted[mid].id];
  } else {
    const mid1 = n / 2 - 1;
    const mid2 = n / 2;
    median = Number(((sorted[mid1].score + sorted[mid2].score) / 2).toFixed(3));
    medianJudgeIds = [sorted[mid1].id, sorted[mid2].id];
  }

  const scores = scoresWithId.map((s) => s.score);
  const sum = scores.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const variance = scores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    median,
    stdDev,
    mean,
    sortedScores: sorted.map((s) => s.score),
    medianJudgeIds
  };
}

/**
 * Hitung penalti waktu otomatis standar IPSI (Toleransi 5s, deviasi per 5s = -0.05)
 */
export function calculateTimePenalty(elapsedSeconds: number, target: number = DURASI_STANDAR_TGRS_DETIK): number {
  if (elapsedSeconds <= 0) return 0;
  const deviasi = Math.abs(elapsedSeconds - target);
  if (deviasi <= TOLERANSI_WAKTU_DETIK) {
    return 0.00; // Aman dalam toleransi
  }
  const over = deviasi - TOLERANSI_WAKTU_DETIK;
  if (over <= 5) return 0.05;
  if (over <= 10) return 0.10;
  if (over <= 15) return 0.15;
  if (over <= 20) return 0.20;
  return 0.25;
}

/**
 * Format detik ke string MM:SS
 */
export function formatTimeMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Format detik dengan presisi milidetik MM:SS.S
 */
export function formatTimePrecision(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.0";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
}

/**
 * Hitung skor individual seorang Juri berdasarkan kategori TGRS
 */
export function computeJudgeScore(
  category: TgrsSubCategory,
  judge: Partial<TgrsJudgeState>
): { kebenaranScore: number; totalScore: number } {
  if (category === "TUNGGAL" || category === "REGU") {
    const safeErrors = Math.max(0, judge.errorsCount || 0);
    const kebenaran = Math.max(0, Number((SKOR_DASAR_BAKU - safeErrors * PENALTI_GERAK_311).toFixed(2)));
    const kemantapan = Math.max(0, Math.min(0.10, Number((judge.kemantapanScore || 0).toFixed(2))));
    const total = Number((kebenaran + kemantapan).toFixed(2));
    return { kebenaranScore: kebenaran, totalScore: total };
  } else {
    // KATEGORI GANDA & TUNGGAL BEBAS (SOLO KREATIF)
    // 3 Aspek dimulai dari 0.00 dan berubah sesuai input juri:
    // 1. Tekhnik Serang Bela
    // 2. Kemantapan dan harmoni
    // 3. Penjiwaan penghayatan
    // Total skor awal & median juri dimulai dari 9.10
    const serangBela = Math.max(0, Number((judge.serangBelaScore ?? judge.teknikScore ?? 0.00).toFixed(2)));
    const kemantapan = Math.max(0, Number((judge.kemantapanScore ?? 0.00).toFixed(2)));
    const penjiwaan = Math.max(0, Number((judge.penjiwaanScore ?? judge.koreografiScore ?? 0.00).toFixed(2)));
    const total = Number((SKOR_DASAR_GANDA_SOLO + serangBela + kemantapan + penjiwaan).toFixed(2));
    return { kebenaranScore: kemantapan, totalScore: total };
  }
}

/**
 * Rekapitulasi Nilai Akhir Seluruh Juri Berdasarkan Aturan PERSILAT & PB IPSI 2026
 */
export function computeTgrsFinalResult(
  category: TgrsSubCategory,
  judges: Record<number, TgrsJudgeState>,
  dewanPenalties: TgrsDewanPenalties,
  judgesCount: number = 10
) {
  const activeJudges = Object.values(judges).slice(0, judgesCount);
  const scoresWithId = activeJudges.map((j) => {
    const computed = computeJudgeScore(category, j);
    return { id: j.id, score: computed.totalScore };
  });
  const scores = scoresWithId.map((s) => s.score);

  if (scores.length === 0) {
    return {
      finalScore: 0,
      averageScore: 0,
      medianScore: 0,
      stdDev: 0,
      discardedHigh: [],
      discardedLow: [],
      validScores: [],
      totalPenaltiDewan: 0
    };
  }

  // Hitung total penalti dewan secara aman dengan fallback default
  const safePenalties: TgrsDewanPenalties = {
    toleransiWaktuCount: dewanPenalties?.toleransiWaktuCount ?? 0,
    keluarGelanggangCount: dewanPenalties?.keluarGelanggangCount ?? 0,
    senjataJatuhCount: dewanPenalties?.senjataJatuhCount ?? 0,
    senjataJatuhLuarGelanggangCount: dewanPenalties?.senjataJatuhLuarGelanggangCount ?? 0,
    senjataRusakPatahCount: dewanPenalties?.senjataRusakPatahCount ?? 0,
    atributLepasCount: dewanPenalties?.atributLepasCount ?? 0,
    menahanGerakanCount: dewanPenalties?.menahanGerakanCount ?? 0,
    penaltiWaktuOtomatis: dewanPenalties?.penaltiWaktuOtomatis ?? 0,
    diskualifikasi: Boolean(dewanPenalties?.diskualifikasi)
  };

  const totalPenaltiManual =
    ((safePenalties.toleransiWaktuCount || 0) * 0.50) +
    ((safePenalties.keluarGelanggangCount || 0) * 0.50) +
    ((safePenalties.senjataJatuhCount || 0) * 0.50) +
    ((safePenalties.senjataJatuhLuarGelanggangCount || 0) * 0.50) +
    ((safePenalties.senjataRusakPatahCount || 0) * 0.50) +
    ((safePenalties.atributLepasCount || 0) * 0.50) +
    ((safePenalties.menahanGerakanCount || 0) * 0.50);

  const totalPenaltiDewan = safePenalties.diskualifikasi
    ? 9.99
    : Number(((safePenalties.penaltiWaktuOtomatis || 0) + totalPenaltiManual).toFixed(3));

  if (safePenalties.diskualifikasi) {
    return {
      finalScore: 0.00,
      averageScore: 0.00,
      medianScore: 0.00,
      stdDev: 0.00,
      discardedHigh: [],
      discardedLow: [],
      validScores: scores,
      totalPenaltiDewan: 9.99
    };
  }

  // Kalkulasi Median & Standar Deviasi
  const medianStats = computeTgrsMedianAndStdDev(scoresWithId);

  // Sort scores ascending
  const sorted = [...scores].sort((a, b) => a - b);
  let discardedLow: number[] = [];
  let discardedHigh: number[] = [];
  let validScores: number[] = [];

  if (judgesCount === 5 && sorted.length >= 5) {
    discardedLow = [sorted[0]];
    discardedHigh = [sorted[sorted.length - 1]];
    validScores = sorted.slice(1, sorted.length - 1);
  } else if (judgesCount >= 10 && sorted.length >= 10) {
    // Pada format 10 juri, nilai median berbasis 2 nilai tengah
    validScores = [sorted[4], sorted[5]];
  } else {
    validScores = sorted;
  }

  const sumValid = validScores.reduce((acc, curr) => acc + curr, 0);
  const avg = validScores.length > 0 ? sumValid / validScores.length : 0;
  
  // Final score berbasis median untuk standar PB IPSI (4 sampai 10 Juri), atau rata-rata jika di bawah 4
  const baseScore = judgesCount >= 4 ? medianStats.median : avg;
  const finalScore = Math.max(0, Number((baseScore - totalPenaltiDewan).toFixed(3)));

  return {
    finalScore,
    averageScore: Number(avg.toFixed(3)),
    medianScore: medianStats.median,
    stdDev: medianStats.stdDev,
    discardedHigh,
    discardedLow,
    validScores,
    totalPenaltiDewan
  };
}

/**
 * Buat state default untuk satu sudut penampil (Biru atau Merah)
 */
export function createDefaultPerformerState(
  corner: "BLUE" | "RED",
  category: TgrsSubCategory = "TUNGGAL",
  athleteName?: string,
  contingent?: string
): TgrsPerformerState {
  const judges: Record<number, TgrsJudgeState> = {};
  for (let i = 1; i <= 10; i++) {
    const isTunggalOrRegu = category === "TUNGGAL" || category === "REGU";
    judges[i] = {
      id: i,
      name: `Juri ${i}`,
      errorsCount: 0,
      errorHistory: [],
      kebenaranScore: isTunggalOrRegu ? SKOR_DASAR_BAKU : 0.00,
      kemantapanScore: 0.00,
      serangBelaScore: isTunggalOrRegu ? undefined : 0.00,
      penjiwaanScore: isTunggalOrRegu ? undefined : 0.00,
      teknikScore: isTunggalOrRegu ? undefined : 0.00,
      koreografiScore: isTunggalOrRegu ? undefined : 0.00,
      totalScore: isTunggalOrRegu ? SKOR_DASAR_BAKU : SKOR_DASAR_GANDA_SOLO,
      isSubmitted: false
    };
  }

  const dewanPenalties: TgrsDewanPenalties = {
    toleransiWaktuCount: 0,
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    senjataJatuhLuarGelanggangCount: 0,
    senjataRusakPatahCount: 0,
    atributLepasCount: 0,
    menahanGerakanCount: 0,
    penaltiWaktuOtomatis: 0,
    diskualifikasi: false
  };

  const initialResult = computeTgrsFinalResult(category, judges, dewanPenalties, 10);
  const defaultName = athleteName || (corner === "BLUE" ? "PESILAT BIRU" : "PESILAT MERAH");
  const defaultContingent = contingent || (corner === "BLUE" ? "KONTINGEN BIRU" : "KONTINGEN MERAH");

  return {
    corner,
    athleteName: defaultName,
    contingent: defaultContingent,
    timerElapsed: 0,
    timerRemaining: DURASI_STANDAR_TGRS_DETIK,
    isTimerRunning: false,
    isFinished: false,
    judges,
    dewanPenalties,
    finalScore: initialResult.finalScore,
    averageScore: initialResult.averageScore,
    totalPenaltiDewan: initialResult.totalPenaltiDewan,
    discardedHigh: initialResult.discardedHigh,
    discardedLow: initialResult.discardedLow,
    validScores: initialResult.validScores
  };
}

/**
 * Reset seluruh data pertandingan TGRS ke posisi standby & siap penilaian untuk penampil selanjutnya.
 * Mereset timer ke 00:00, seluruh input nilai juri, hukuman dewan, status aksi timer (stop),
 * dan menyinkronkan seluruh panel (Dewan, Juri, Monitor, Timer).
 */
export function resetTgrsMatchToStandby(state: TgrsMatchState): TgrsMatchState {
  const category = state.category || "TUNGGAL";
  const judgesCount = state.judgesCount || 10;
  const isTunggalOrRegu = category === "TUNGGAL" || category === "REGU";

  const cleanJudges: Record<number, TgrsJudgeState> = {};
  for (let i = 1; i <= 10; i++) {
    cleanJudges[i] = {
      id: i,
      name: `Juri ${i}`,
      errorsCount: 0,
      errorHistory: [],
      kebenaranScore: isTunggalOrRegu ? SKOR_DASAR_BAKU : 0.00,
      kemantapanScore: 0.00,
      serangBelaScore: isTunggalOrRegu ? undefined : 0.00,
      penjiwaanScore: isTunggalOrRegu ? undefined : 0.00,
      teknikScore: isTunggalOrRegu ? undefined : 0.00,
      koreografiScore: isTunggalOrRegu ? undefined : 0.00,
      totalScore: isTunggalOrRegu ? SKOR_DASAR_BAKU : SKOR_DASAR_GANDA_SOLO,
      isSubmitted: false
    };
  }

  const cleanPenalties: TgrsDewanPenalties = {
    toleransiWaktuCount: 0,
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    senjataJatuhLuarGelanggangCount: 0,
    senjataRusakPatahCount: 0,
    atributLepasCount: 0,
    menahanGerakanCount: 0,
    penaltiWaktuOtomatis: 0,
    diskualifikasi: false
  };

  const initialResult = computeTgrsFinalResult(category, cleanJudges, cleanPenalties, judgesCount);

  // Pertahankan nama dan kontingen atlet yang sudah ada
  const blueName = state.bluePerformer?.athleteName || "PESILAT BIRU";
  const blueClub = state.bluePerformer?.contingent || "KONTINGEN BIRU";
  const redName = state.redPerformer?.athleteName || "PESILAT MERAH";
  const redClub = state.redPerformer?.contingent || "KONTINGEN MERAH";

  const bluePerformer: TgrsPerformerState = {
    corner: "BLUE",
    athleteName: blueName,
    contingent: blueClub,
    timerElapsed: 0,
    timerRemaining: DURASI_STANDAR_TGRS_DETIK,
    isTimerRunning: false,
    isFinished: false,
    judges: { ...cleanJudges },
    dewanPenalties: { ...cleanPenalties },
    finalScore: initialResult.finalScore,
    averageScore: initialResult.averageScore,
    totalPenaltiDewan: initialResult.totalPenaltiDewan,
    discardedHigh: initialResult.discardedHigh,
    discardedLow: initialResult.discardedLow,
    validScores: initialResult.validScores
  };

  const redPerformer: TgrsPerformerState = {
    corner: "RED",
    athleteName: redName,
    contingent: redClub,
    timerElapsed: 0,
    timerRemaining: DURASI_STANDAR_TGRS_DETIK,
    isTimerRunning: false,
    isFinished: false,
    judges: { ...cleanJudges },
    dewanPenalties: { ...cleanPenalties },
    finalScore: initialResult.finalScore,
    averageScore: initialResult.averageScore,
    totalPenaltiDewan: initialResult.totalPenaltiDewan,
    discardedHigh: initialResult.discardedHigh,
    discardedLow: initialResult.discardedLow,
    validScores: initialResult.validScores
  };

  const activeCorner = state.activeCorner || "BLUE";
  const activePerformer = activeCorner === "BLUE" ? bluePerformer : redPerformer;

  return {
    ...state,
    isTimerRunning: false,
    isFinished: false,
    isLocked: false,
    timerStartedAt: null,
    timerElapsed: 0,
    timerRemaining: DURASI_STANDAR_TGRS_DETIK,
    winnerCorner: null,
    winnerReason: "",
    winnerAnnounced: false,
    activeCorner,
    bluePerformer,
    redPerformer,
    athleteName: activePerformer.athleteName,
    contingent: activePerformer.contingent,
    judges: { ...cleanJudges },
    dewanPenalties: { ...cleanPenalties },
    finalScore: initialResult.finalScore,
    averageScore: initialResult.averageScore,
    totalPenaltiDewan: initialResult.totalPenaltiDewan,
    discardedHigh: initialResult.discardedHigh,
    discardedLow: initialResult.discardedLow,
    validScores: initialResult.validScores
  };
}

/**
 * State default peragaan TGRS
 */
export function createDefaultTgrsState(category: TgrsSubCategory = "TUNGGAL"): TgrsMatchState {
  const bluePerformer = createDefaultPerformerState("BLUE", category, "PESILAT BIRU", "KONTINGEN BIRU");
  const redPerformer = createDefaultPerformerState("RED", category, "PESILAT MERAH", "KONTINGEN MERAH");

  let label = "SENI TUNGGAL BAKU IPSI";
  if (category === "GANDA") label = "SENI GANDA IPSI";
  if (category === "REGU") label = "SENI REGU IPSI";
  if (category === "SOLO_KREATIF") label = "SOLO KREATIF IPSI";

  return {
    id: `tgrs-${Date.now()}`,
    partai: "1",
    gelanggang: "A",
    category,
    categoryLabel: label,
    gender: "PUTRA",
    ageCategory: "DEWASA",
    stage: "FINAL",

    // Sistem Penampil VS
    activeCorner: "BLUE",
    bluePerformer,
    redPerformer,
    winnerCorner: null,
    winnerReason: "",
    winnerAnnounced: false,

    // Active Mirror (Sudut Biru initially)
    athleteName: bluePerformer.athleteName,
    contingent: bluePerformer.contingent,
    timerElapsed: bluePerformer.timerElapsed,
    timerRemaining: bluePerformer.timerRemaining,
    isTimerRunning: bluePerformer.isTimerRunning,
    isFinished: bluePerformer.isFinished,
    isLocked: false,
    timerStartedAt: null,
    judgesCount: 10,
    judges: bluePerformer.judges,
    dewanPenalties: bluePerformer.dewanPenalties,
    finalScore: bluePerformer.finalScore,
    averageScore: bluePerformer.averageScore,
    discardedHigh: bluePerformer.discardedHigh,
    discardedLow: bluePerformer.discardedLow,
    validScores: bluePerformer.validScores,
    totalPenaltiDewan: bluePerformer.totalPenaltiDewan
  };
}

/**
 * Sinkronkan root mirrors aktif ke dalam state performer (Biru / Merah)
 */
export function syncActiveCornerToPerformer(state: TgrsMatchState): TgrsMatchState {
  const currentCorner = state.activeCorner || "BLUE";
  const performer: TgrsPerformerState = {
    corner: currentCorner,
    athleteName: state.athleteName,
    contingent: state.contingent,
    targetDuration: state.targetDuration || DURASI_STANDAR_TGRS_DETIK,
    timerElapsed: state.timerElapsed,
    timerRemaining: state.timerRemaining,
    timer3MinElapsed: state.timer3MinElapsed,
    isTimerRunning: state.isTimerRunning,
    isTimer2Running: state.isTimer2Running,
    isPerformerFinished: state.isPerformerFinished,
    performerTime: state.performerTime,
    is3MinFinished: state.is3MinFinished,
    isFinished: Boolean(state.isFinished || state.isPerformerFinished),
    judges: state.judges,
    dewanPenalties: state.dewanPenalties,
    finalScore: state.finalScore,
    averageScore: state.averageScore,
    totalPenaltiDewan: state.totalPenaltiDewan,
    discardedHigh: state.discardedHigh || [],
    discardedLow: state.discardedLow || [],
    validScores: state.validScores || []
  };

  if (currentCorner === "BLUE") {
    return {
      ...state,
      bluePerformer: performer
    };
  } else {
    return {
      ...state,
      redPerformer: performer
    };
  }
}

/**
 * Pindah giliran sudut penampil (Biru <-> Merah)
 * Ketika berganti ke sudut yang belum tampil, panel dewan, monitor, serta timer di-set kembali ke awal untuk penampil baru.
 */
export function switchTgrsCorner(state: TgrsMatchState, targetCorner: "BLUE" | "RED"): TgrsMatchState {
  if (state.activeCorner === targetCorner) return state;

  // 1. Simpan sudut saat ini ke bluePerformer atau redPerformer
  const syncedState = syncActiveCornerToPerformer(state);

  // 2. Muat targetCorner ke root mirror
  const targetPerformer = targetCorner === "BLUE" ? syncedState.bluePerformer : syncedState.redPerformer;
  const isTargetAlreadyFinished = Boolean(targetPerformer.isFinished || targetPerformer.isPerformerFinished);

  const resetTarget: TgrsPerformerState = isTargetAlreadyFinished
    ? targetPerformer
    : {
        ...targetPerformer,
        timerElapsed: 0,
        timer3MinElapsed: 0,
        timerRemaining: targetPerformer.targetDuration || syncedState.targetDuration || DURASI_STANDAR_TGRS_DETIK,
        isTimerRunning: false,
        isTimer2Running: false,
        isPerformerFinished: false,
        is3MinFinished: false,
        performerTime: null,
        isFinished: false
      };

  const updatedBlue = targetCorner === "BLUE" ? resetTarget : syncedState.bluePerformer;
  const updatedRed = targetCorner === "RED" ? resetTarget : syncedState.redPerformer;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jrz_tgrs_reset_timer"));
  }

  return {
    ...syncedState,
    activeCorner: targetCorner,
    bluePerformer: updatedBlue,
    redPerformer: updatedRed,
    athleteName: resetTarget.athleteName,
    contingent: resetTarget.contingent,
    timerElapsed: resetTarget.timerElapsed,
    timerRemaining: resetTarget.timerRemaining,
    timer3MinElapsed: resetTarget.timer3MinElapsed,
    isTimerRunning: resetTarget.isTimerRunning,
    isTimer2Running: resetTarget.isTimer2Running,
    isPerformerFinished: resetTarget.isPerformerFinished,
    performerTime: resetTarget.performerTime,
    is3MinFinished: resetTarget.is3MinFinished,
    isFinished: isTargetAlreadyFinished,
    timerStartedAt: null,
    judges: resetTarget.judges,
    dewanPenalties: resetTarget.dewanPenalties,
    finalScore: resetTarget.finalScore,
    averageScore: resetTarget.averageScore,
    discardedHigh: resetTarget.discardedHigh || [],
    discardedLow: resetTarget.discardedLow || [],
    validScores: resetTarget.validScores || [],
    totalPenaltiDewan: resetTarget.totalPenaltiDewan
  };
}

/**
 * Tentukan pemenang antara Sudut Biru vs Sudut Merah berdasarkan aturan PERSILAT & PB IPSI
 */
export function determineTgrsWinner(state: TgrsMatchState): { winnerCorner: "BLUE" | "RED" | "DRAW"; reason: string } {
  const synced = syncActiveCornerToPerformer(state);
  const blue = synced.bluePerformer;
  const red = synced.redPerformer;

  // 1. Cek diskualifikasi
  if (blue.dewanPenalties?.diskualifikasi && !red.dewanPenalties?.diskualifikasi) {
    return { winnerCorner: "RED", reason: "Sudut Biru Terdiskualifikasi" };
  }
  if (red.dewanPenalties?.diskualifikasi && !blue.dewanPenalties?.diskualifikasi) {
    return { winnerCorner: "BLUE", reason: "Sudut Merah Terdiskualifikasi" };
  }
  if (blue.dewanPenalties?.diskualifikasi && red.dewanPenalties?.diskualifikasi) {
    return { winnerCorner: "DRAW", reason: "Kedua Sudut Terdiskualifikasi" };
  }

  // 2. Bandingkan Nilai Akhir
  const scoreDiff = Number((blue.finalScore - red.finalScore).toFixed(3));
  if (scoreDiff > 0.001) {
    return { winnerCorner: "BLUE", reason: `Unggul Nilai Akhir (${blue.finalScore.toFixed(2)} vs ${red.finalScore.toFixed(2)})` };
  } else if (scoreDiff < -0.001) {
    return { winnerCorner: "RED", reason: `Unggul Nilai Akhir (${red.finalScore.toFixed(2)} vs ${blue.finalScore.toFixed(2)})` };
  }

  // 3. Jika nilai akhir sama, bandingkan penalti dewan terendah
  if (blue.totalPenaltiDewan < red.totalPenaltiDewan) {
    return { winnerCorner: "BLUE", reason: "Penalti Hukuman Dewan Lebih Rendah" };
  } else if (red.totalPenaltiDewan < blue.totalPenaltiDewan) {
    return { winnerCorner: "RED", reason: "Penalti Hukuman Dewan Lebih Rendah" };
  }

  // 4. Jika masih sama, deviasi waktu terdekat dengan 03:00 (180s)
  const blueDev = Math.abs((blue.timerElapsed || 0) - DURASI_STANDAR_TGRS_DETIK);
  const redDev = Math.abs((red.timerElapsed || 0) - DURASI_STANDAR_TGRS_DETIK);
  if (blueDev < redDev) {
    return { winnerCorner: "BLUE", reason: "Deviasi Waktu Peragaan Lebih Presisi" };
  } else if (redDev < blueDev) {
    return { winnerCorner: "RED", reason: "Deviasi Waktu Peragaan Lebih Presisi" };
  }

  return { winnerCorner: "DRAW", reason: "Nilai dan Kriteria Imbang Sempurna" };
}

const TGRS_STORAGE_KEY = "jrz_tgrs_live_state";

let lastSavedTgrsJson = "";

/**
 * Simpan dan sebar luaskan state TGRS ke seluruh tab & server lokal
 */
export function saveTgrsLiveState(state: TgrsMatchState): void {
  if (typeof window === "undefined" || !state) return;
  try {
    const synced = syncActiveCornerToPerformer(state);
    const serialized = JSON.stringify(synced);
    if (serialized === lastSavedTgrsJson) return;
    lastSavedTgrsJson = serialized;

    localStorage.setItem(TGRS_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent("jrz_tgrs_state_updated", { detail: synced }));

    import("../services/firebase")
      .then((fb) => fb.saveTgrsStateToFirebase(synced, synced.gelanggang))
      .catch(() => {});
  } catch (err) {
    console.error("Gagal menyimpan state TGRS:", err);
  }
}

/**
 * Baca state TGRS tersimpan
 */
export function loadTgrsLiveState(defaultCategory: TgrsSubCategory = "TUNGGAL"): TgrsMatchState {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(TGRS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          // Backwards compatibility migration
          if (!parsed.activeCorner) {
            parsed.activeCorner = "BLUE";
          }
          if (!parsed.bluePerformer) {
            parsed.bluePerformer = createDefaultPerformerState(
              "BLUE",
              parsed.category || defaultCategory,
              parsed.athleteName || "PESILAT BIRU",
              parsed.contingent || "KONTINGEN BIRU"
            );
          }
          if (!parsed.redPerformer) {
            parsed.redPerformer = createDefaultPerformerState(
              "RED",
              parsed.category || defaultCategory,
              "PESILAT MERAH",
              "KONTINGEN MERAH"
            );
          }
          if (parsed.winnerAnnounced === undefined) {
            parsed.winnerAnnounced = false;
          }
          const defaultDewan: TgrsDewanPenalties = {
            toleransiWaktuCount: 0,
            keluarGelanggangCount: 0,
            senjataJatuhCount: 0,
            senjataJatuhLuarGelanggangCount: 0,
            senjataRusakPatahCount: 0,
            atributLepasCount: 0,
            menahanGerakanCount: 0,
            penaltiWaktuOtomatis: 0,
            diskualifikasi: false
          };
          if (!parsed.dewanPenalties) {
            parsed.dewanPenalties = { ...defaultDewan };
          } else {
            parsed.dewanPenalties = {
              ...defaultDewan,
              ...parsed.dewanPenalties,
              diskualifikasi: Boolean(parsed.dewanPenalties.diskualifikasi)
            };
          }
          if (parsed.bluePerformer) {
            parsed.bluePerformer.dewanPenalties = {
              ...defaultDewan,
              ...(parsed.bluePerformer.dewanPenalties || {}),
              diskualifikasi: Boolean(parsed.bluePerformer.dewanPenalties?.diskualifikasi)
            };
          }
          if (parsed.redPerformer) {
            parsed.redPerformer.dewanPenalties = {
              ...defaultDewan,
              ...(parsed.redPerformer.dewanPenalties || {}),
              diskualifikasi: Boolean(parsed.redPerformer.dewanPenalties?.diskualifikasi)
            };
          }

          // Kalibrasi otomatis kategori GANDA & SOLO KREATIF (Tunggal Bebas) ke nilai dasar 9.10
          const isGandaOrSolo = parsed.category === "GANDA" || parsed.category === "SOLO_KREATIF";
          if (isGandaOrSolo) {
            const calibrateJudges = (judgesMap?: Record<number, any>) => {
              if (!judgesMap) return;
              Object.values(judgesMap).forEach((j: any) => {
                const sb = j.serangBelaScore ?? j.teknikScore ?? 0.00;
                const km = j.kemantapanScore ?? 0.00;
                const pj = j.penjiwaanScore ?? j.koreografiScore ?? 0.00;
                j.serangBelaScore = sb;
                j.kemantapanScore = km;
                j.penjiwaanScore = pj;
                j.totalScore = Number((SKOR_DASAR_GANDA_SOLO + sb + km + pj).toFixed(2));
              });
            };

            if (parsed.bluePerformer?.judges) {
              calibrateJudges(parsed.bluePerformer.judges);
              const bRes = computeTgrsFinalResult(parsed.category, parsed.bluePerformer.judges, parsed.bluePerformer.dewanPenalties, parsed.judgesCount || 10);
              parsed.bluePerformer.finalScore = bRes.finalScore;
              parsed.bluePerformer.averageScore = bRes.averageScore;
            }

            if (parsed.redPerformer?.judges) {
              calibrateJudges(parsed.redPerformer.judges);
              const rRes = computeTgrsFinalResult(parsed.category, parsed.redPerformer.judges, parsed.redPerformer.dewanPenalties, parsed.judgesCount || 10);
              parsed.redPerformer.finalScore = rRes.finalScore;
              parsed.redPerformer.averageScore = rRes.averageScore;
            }

            const activeC = parsed.activeCorner || "BLUE";
            const activeP = activeC === "BLUE" ? parsed.bluePerformer : parsed.redPerformer;
            if (activeP) {
              parsed.judges = activeP.judges;
              parsed.finalScore = activeP.finalScore;
              parsed.averageScore = activeP.averageScore;
            }
          }

          return parsed;
        }
      }
    } catch {}
  }
  return createDefaultTgrsState(defaultCategory);
}

/**
 * Menghitung durasi berjalan aktual penampil (Timer 1) secara presisi:
 * - Berjalan maju dari 00:00 tanpa batas sampai tombol STOP ditekan.
 * - Saat STOP ditekan, waktu penampil TERKUNCI pada nilai aktualnya (tidak terpengaruh Timer 2).
 */
export function getTgrsPerformerElapsed(state: TgrsMatchState): number {
  if (state.isPerformerFinished && typeof state.performerTime === "number") {
    return state.performerTime;
  }
  if (state.isTimerRunning && state.timerStartedAt && !state.isPerformerFinished) {
    return Number(Math.max(0, (Date.now() - state.timerStartedAt) / 1000).toFixed(1));
  }
  return state.timerElapsed || 0;
}

/**
 * Menghitung durasi Timer 2 (Timer Batas Waktu / Target):
 * - Berjalan maju dari 00:00 hingga targetDuration (01:30, 01:50, atau 03:00) lalu berhenti.
 * - TETAP TERUS BERJALAN menuju targetDuration meskipun Timer 1 (Waktu Penampil) telah ditekan STOP.
 */
export function getTgrs3MinElapsed(state: TgrsMatchState): number {
  const target = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;
  if (state.is3MinFinished) {
    return target;
  }
  if (state.timerStartedAt && (state.isTimerRunning || state.isTimer2Running)) {
    const raw = (Date.now() - state.timerStartedAt) / 1000;
    if (raw >= target) {
      return target;
    }
    return Number(Math.max(0, raw).toFixed(1));
  }
  return Math.min(target, state.timer3MinElapsed ?? (state.timerElapsed || 0));
}

/**
 * Backward-compatible helper: mengembalikan waktu penampil
 */
export function getTgrsLiveElapsed(state: TgrsMatchState): number {
  return getTgrsPerformerElapsed(state);
}

/**
 * Hook reaktif dual-timer untuk sinkronisasi real-time Timer 1 dan Timer 2 di seluruh panel.
 */
export function useTgrsDualElapsed(state: TgrsMatchState) {
  const [performerElapsed, setPerformerElapsed] = useState<number>(() => getTgrsPerformerElapsed(state));
  const [timer3MinElapsed, setTimer3MinElapsed] = useState<number>(() => getTgrs3MinElapsed(state));

  useEffect(() => {
    setPerformerElapsed(getTgrsPerformerElapsed(state));
    setTimer3MinElapsed(getTgrs3MinElapsed(state));

    const isRunning = (state.isTimerRunning && !state.isPerformerFinished) || (state.isTimer2Running && !state.is3MinFinished);
    if (!isRunning || !state.timerStartedAt) return;

    const interval = setInterval(() => {
      setPerformerElapsed(getTgrsPerformerElapsed(state));
      setTimer3MinElapsed(getTgrs3MinElapsed(state));
    }, 100);

    return () => clearInterval(interval);
  }, [
    state.isTimerRunning,
    state.isTimer2Running,
    state.timerStartedAt,
    state.isPerformerFinished,
    state.is3MinFinished,
    state.performerTime,
    state.timerElapsed,
    state.timer3MinElapsed,
    state.targetDuration
  ]);

  const targetDuration = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;
  const minTolerance = Math.max(0, targetDuration - TOLERANSI_WAKTU_DETIK);
  const maxTolerance = targetDuration + TOLERANSI_WAKTU_DETIK;
  const isSafeZone = performerElapsed >= minTolerance && performerElapsed <= maxTolerance;
  const isOvertime = performerElapsed > maxTolerance;

  return {
    performerElapsed,
    timer3MinElapsed,
    targetDuration,
    minTolerance,
    maxTolerance,
    isPerformerFinished: Boolean(state.isPerformerFinished),
    is3MinFinished: Boolean(state.is3MinFinished || timer3MinElapsed >= targetDuration),
    isSafeZone,
    isOvertime
  };
}

/**
 * Hook reaktif untuk menampilkan timer berjalan real-time (100ms) di panel apapun.
 */
export function useTgrsLiveElapsed(state: TgrsMatchState): number {
  const { performerElapsed } = useTgrsDualElapsed(state);
  return performerElapsed;
}
