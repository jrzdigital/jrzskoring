/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CORE SCORING LOGIC FOR PENCAK SILAT TGR TUNGGAL (SENI TUNGGAL BAKU)
 * Sesuai Peraturan Resmi PERSILAT & PB IPSI (Aturan 3.1.1 & Batas Waktu 3 Menit)
 */

export const SKOR_DASAR_TUNGGAL = 9.90; // Standar Persilat / IPSI untuk 100 gerakan baku
export const PENALTI_KESALAHAN_311 = 0.01; // Pengurangan nilai per kesalahan gerak (Rule 3.1.1)
export const DURASI_STANDAR_TUNGGAL_DETIK = 180; // 3 menit (03:00)
export const TOLERANSI_WAKTU_DETIK = 5; // +/- 5 detik batas toleransi (175s s.d 185s aman)

/**
 * Rincian Klasifikasi Kesalahan Gerak Aturan 3.1.1
 */
export type TgrRule311ErrorType = 
  | 'DETAIL_GERAK'        // Kesalahan dalam rincian gerak (posisi kuda-kuda, sudut pukulan/tangkisan)
  | 'URUTAN_GERAK'        // Kesalahan urutan rincian gerak
  | 'GERAKAN_TERTINGGAL'  // Ada gerakan yang tertinggal / tidak ditampilkan
  | 'SENJATA_TERLEPAS'    // Senjata terlepas dari genggaman tetapi tidak menyentuh matras
  | 'GENERAL_WRONG';      // Tombol cepat kesalahan gerak umum (-0.01)

export interface TgrErrorRecord {
  id: string;
  type: TgrRule311ErrorType;
  label: string;
  timestamp: number;
  timeFormatted: string;
  deduction: number; // 0.01
}

export interface TgrJudgeState {
  id: number;
  name: string;
  errorsCount: number; // Jumlah total kesalahan
  errorHistory: TgrErrorRecord[]; // Riwayat kesalahan untuk backspace/audit
  kebenaranScore: number; // 9.90 - (errorsCount * 0.01)
  kemantapanScore: number; // Flow of movement & stamina (0.01 - 0.10)
  totalScore: number; // kebenaranScore + kemantapanScore
  isSubmitted: boolean;
  lastPressedAt?: number;
}

export interface TgrDewanPenalties {
  toleransiWaktuCount?: number;     // 1. Penampilan melebihi / kurang dari toleransi waktu (-0.50 each)
  keluarGelanggangCount: number;    // 2. Penampilan keluar gelanggang 10M x 10M (-0.50 each)
  senjataJatuhCount: number;        // 3. Senjata Jatuh, Menyentuh matras (-0.50 each)
  atributLepasCount: number;        // 4. Pakaian tidak sesuai aturan (-0.50 each)
  menahanGerakanCount?: number;     // 5. menahan gerakan lebih dari 5 detik (-0.50 each)
  penaltiWaktuOtomatis: number;    // Otomatis dihitung dari deviasi timer 3 menit
  diskualifikasi: boolean;         // Pelanggaran fatal / batas waktu melampaui toleransi ekstrem
}

export interface TgrTunggalMatchState {
  id: string;
  partai: string;
  gelanggang: string;
  athleteName: string;
  contingent: string;
  gender: 'PUTRA' | 'PUTRI';
  ageCategory: 'USIA DINI' | 'PRA REMAJA' | 'REMAJA' | 'DEWASA' | 'MASTER';
  stage: string; // Penyisihan, Semifinal, Final
  
  // Timer State (3 Menit)
  timerElapsed: number; // Detik berjalan (0 -> 180+)
  timerRemaining: number; // Detik hitung mundur (180 -> 0)
  isTimerRunning: boolean;
  isFinished: boolean;
  isLocked: boolean;
  startedAt?: number;

  // Nilai Juri (Standar 3 atau 5 Juri)
  judgesCount: 3 | 5;
  judges: Record<number, TgrJudgeState>;

  // Hukuman Dewan
  dewanPenalties: TgrDewanPenalties;

  // Hasil Kalkulasi Resmi
  finalScore: number;
  medianScore: number;
  discardedHigh: number[];
  discardedLow: number[];
  validScores: number[];
  totalPenaltiDewan: number;
  winnerAnnounced: boolean;
}

/**
 * Hitung penalti deviasi waktu terhadap durasi standar 3 menit (180 detik)
 * Toleransi aman: 175 s.d 185 detik (deviasi <= 5s) = 0.00
 * Deviasi 6 s.d 10 detik: -0.05
 * Deviasi 11 s.d 15 detik: -0.10
 * Deviasi 16 s.d 20 detik: -0.15
 * Deviasi 21 s.d 25 detik: -0.20
 * Deviasi > 25 detik: -0.25 (atau diskualifikasi sesuai keputusan dewan)
 */
export function calculateTgrTimePenalty(elapsedSeconds: number, targetSeconds: number = DURASI_STANDAR_TUNGGAL_DETIK): number {
  if (elapsedSeconds <= 0) return 0;
  
  const deviasi = Math.abs(elapsedSeconds - targetSeconds);
  if (deviasi <= TOLERANSI_WAKTU_DETIK) {
    return 0.00; // Dalam batas toleransi aman (+/- 5 detik)
  }
  
  const deviasiLebih = deviasi - TOLERANSI_WAKTU_DETIK;
  if (deviasiLebih <= 5) return 0.05;
  if (deviasiLebih <= 10) return 0.10;
  if (deviasiLebih <= 15) return 0.15;
  if (deviasiLebih <= 20) return 0.20;
  return 0.25;
}

/**
 * Hitung skor individual seorang juri
 */
export function calculateJudgeScore(errorsCount: number, kemantapanScore: number): {
  kebenaranScore: number;
  totalScore: number;
} {
  const safeErrors = Math.max(0, errorsCount);
  const kebenaranScore = Math.max(0, Number((SKOR_DASAR_TUNGGAL - (safeErrors * PENALTI_KESALAHAN_311)).toFixed(2)));
  const safeKemantapan = Math.max(0, Math.min(0.10, Number((kemantapanScore || 0).toFixed(2))));
  const totalScore = Number((kebenaranScore + safeKemantapan).toFixed(2));
  
  return { kebenaranScore, totalScore };
}

/**
 * Rekapitulasi Nilai Akhir Seluruh Juri Berdasarkan Aturan Persilat / IPSI 2026
 * - Jika 5 juri: buang 1 skor tertinggi dan 1 skor terendah, lalu rata-ratakan 3 skor valid.
 * - Jika 3 juri: rata-ratakan seluruh 3 skor juri.
 * - Skor Akhir = Rata-Rata Juri Valid - Total Hukuman Dewan.
 */
export function calculateTgrFinalResult(
  judges: Record<number, TgrJudgeState>,
  dewanPenalties: TgrDewanPenalties,
  judgesCount: 3 | 5 = 5
) {
  const activeJudges = Object.values(judges).slice(0, judgesCount);
  const scores = activeJudges.map(j => j.totalScore || 0);

  if (scores.length === 0) {
    return {
      finalScore: 0,
      medianScore: 0,
      discardedHigh: [],
      discardedLow: [],
      validScores: [],
      totalPenaltiDewan: 0,
    };
  }

  // Hitung total penalti dewan
  const safePenalties: TgrDewanPenalties = {
    toleransiWaktuCount: dewanPenalties?.toleransiWaktuCount ?? 0,
    keluarGelanggangCount: dewanPenalties?.keluarGelanggangCount ?? 0,
    senjataJatuhCount: dewanPenalties?.senjataJatuhCount ?? 0,
    atributLepasCount: dewanPenalties?.atributLepasCount ?? 0,
    menahanGerakanCount: dewanPenalties?.menahanGerakanCount ?? 0,
    penaltiWaktuOtomatis: dewanPenalties?.penaltiWaktuOtomatis ?? 0,
    diskualifikasi: Boolean(dewanPenalties?.diskualifikasi)
  };

  const totalPenaltiManual = 
    ((safePenalties.toleransiWaktuCount || 0) * 0.50) +
    ((safePenalties.keluarGelanggangCount || 0) * 0.50) +
    ((safePenalties.senjataJatuhCount || 0) * 0.50) +
    ((safePenalties.atributLepasCount || 0) * 0.50) +
    ((safePenalties.menahanGerakanCount || 0) * 0.50);

  const totalPenaltiDewan = safePenalties.diskualifikasi 
    ? 9.99 
    : Number(((safePenalties.penaltiWaktuOtomatis || 0) + totalPenaltiManual).toFixed(3));

  if (safePenalties.diskualifikasi) {
    return {
      finalScore: 0.00,
      medianScore: 0.00,
      discardedHigh: [],
      discardedLow: [],
      validScores: scores,
      totalPenaltiDewan: 9.99,
    };
  }

  // Sort scores ascending
  const sorted = [...scores].sort((a, b) => a - b);
  let discardedLow: number[] = [];
  let discardedHigh: number[] = [];
  let validScores: number[] = [];

  if (judgesCount === 5 && sorted.length >= 5) {
    discardedLow = [sorted[0]];
    discardedHigh = [sorted[sorted.length - 1]];
    validScores = sorted.slice(1, sorted.length - 1);
  } else {
    validScores = sorted;
  }

  const sumValid = validScores.reduce((acc, curr) => acc + curr, 0);
  const averageJuri = validScores.length > 0 ? sumValid / validScores.length : 0;
  const finalScore = Math.max(0, Number((averageJuri - totalPenaltiDewan).toFixed(3)));

  return {
    finalScore,
    medianScore: Number(averageJuri.toFixed(3)),
    discardedHigh,
    discardedLow,
    validScores,
    totalPenaltiDewan,
  };
}

/**
 * Format detik menjadi tampilan MM:SS
 */
export function formatTgrTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format detik dengan presisi milidetik MM:SS.S
 */
export function formatTgrPrecisionTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const dec = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${dec}`;
}

/**
 * Default State Generator
 */
export function createDefaultTgrTunggalState(): TgrTunggalMatchState {
  const judges: Record<number, TgrJudgeState> = {};
  for (let i = 1; i <= 5; i++) {
    judges[i] = {
      id: i,
      name: `Juri ${i}`,
      errorsCount: 0,
      errorHistory: [],
      kebenaranScore: SKOR_DASAR_TUNGGAL,
      kemantapanScore: 0.00,
      totalScore: SKOR_DASAR_TUNGGAL,
      isSubmitted: false,
    };
  }

  return {
    id: `tgr-${Date.now()}`,
    partai: '1',
    gelanggang: 'A',
    athleteName: 'PENDEKAR TUNGGAL BAKU',
    contingent: 'KONTINGEN PERSILAT',
    gender: 'PUTRA',
    ageCategory: 'DEWASA',
    stage: 'FINAL',
    timerElapsed: 0,
    timerRemaining: DURASI_STANDAR_TUNGGAL_DETIK,
    isTimerRunning: false,
    isFinished: false,
    isLocked: false,
    judgesCount: 5,
    judges,
    dewanPenalties: {
      toleransiWaktuCount: 0,
      keluarGelanggangCount: 0,
      senjataJatuhCount: 0,
      atributLepasCount: 0,
      menahanGerakanCount: 0,
      penaltiWaktuOtomatis: 0,
      diskualifikasi: false,
    },
    finalScore: SKOR_DASAR_TUNGGAL,
    medianScore: SKOR_DASAR_TUNGGAL,
    discardedHigh: [],
    discardedLow: [],
    validScores: [SKOR_DASAR_TUNGGAL, SKOR_DASAR_TUNGGAL, SKOR_DASAR_TUNGGAL],
    totalPenaltiDewan: 0,
    winnerAnnounced: false,
  };
}
