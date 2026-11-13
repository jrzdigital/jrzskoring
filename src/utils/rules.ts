import { CornerState, MatchSettings, TechniqueType, PenaltyType } from '../types/silat';

export const TECHNIQUE_CONFIG: Record<TechniqueType, { label: string; points: number; desc: string }> = {
  pukulan: {
    label: 'Pukulan',
    points: 1,
    desc: 'Pukulan bertenaga masuk sasaran sah tanpa terhalang',
  },
  tendangan: {
    label: 'Tendangan',
    points: 2,
    desc: 'Tendangan masuk sasaran sah dada/punggung tanpa terhalang',
  },
  jatuhan: {
    label: 'Jatuhan Sah',
    points: 3,
    desc: 'Bantingan/sapuan/guntingan berhasil menjatuhkan lawan sah',
  },
  tangkis_pukulan: {
    label: 'Tangkis + Pukul',
    points: 1,
    desc: 'Tangkisan/elakan teratur diikuti pukulan masuk sasaran',
  },
  tangkis_tendangan: {
    label: 'Tangkis + Tendang',
    points: 2,
    desc: 'Tangkisan/elakan teratur diikuti tendangan masuk sasaran',
  },
  kuncian: {
    label: 'Kuncian Sah',
    points: 3,
    desc: 'Teknik kuncian sah menahan gerak lawan hingga hitungan wasit',
  },
};

export const PENALTY_CONFIG: Record<PenaltyType, { label: string; deduction: number; severity: string; badge: string }> = {
  binaan_1: {
    label: 'Binaan I',
    deduction: 0,
    severity: 'Peringatan Lisan 1',
    badge: 'B1',
  },
  binaan_2: {
    label: 'Binaan II',
    deduction: 0,
    severity: 'Peringatan Lisan 2',
    badge: 'B2',
  },
  teguran_1: {
    label: 'Teguran I',
    deduction: -1,
    severity: 'Pengurangan 1 Poin',
    badge: 'T1 (-1)',
  },
  teguran_2: {
    label: 'Teguran II',
    deduction: -2,
    severity: 'Pengurangan 2 Poin',
    badge: 'T2 (-2)',
  },
  peringatan_1: {
    label: 'Peringatan I',
    deduction: -5,
    severity: 'Kartu Kuning 1 (-5 Poin)',
    badge: 'P1 (-5)',
  },
  peringatan_2: {
    label: 'Peringatan II',
    deduction: -10,
    severity: 'Kartu Kuning 2 (-10 Poin)',
    badge: 'P2 (-10)',
  },
  diskualifikasi: {
    label: 'Diskualifikasi',
    deduction: 0,
    severity: 'Kartu Merah / Pelanggaran Berat',
    badge: 'DISQ',
  },
};

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateTotalScore(corner: CornerState): number {
  return corner.roundScores[0] + corner.roundScores[1] + corner.roundScores[2];
}

export function calculateAttackTotal(corner: CornerState): number {
  return corner.roundAttackPoints[0] + corner.roundAttackPoints[1] + corner.roundAttackPoints[2];
}

export function calculatePenaltyTotal(corner: CornerState): number {
  return corner.roundPenaltyPoints[0] + corner.roundPenaltyPoints[1] + corner.roundPenaltyPoints[2];
}

export const INITIAL_RED_CORNER: CornerState = {
  name: 'Iqbal Candra Pratama',
  contingent: 'DKI JAKARTA',
  school: 'Merpati Putih',
  weightClass: 'Kelas F (70-75 kg)',
  roundScores: [0, 0, 0],
  roundAttackPoints: [0, 0, 0],
  roundPenaltyPoints: [0, 0, 0],
  binaanCount: 0,
  teguranCount: 0,
  peringatanCount: 0,
  isDisqualified: false,
  varCards: 2,
  varUsed: 0,
  medicalTimeUsedSeconds: 0,
  penalties: [],
};

export const INITIAL_BLUE_CORNER: CornerState = {
  name: 'Hanifan Yudani Kusumah',
  contingent: 'JAWA BARAT',
  school: 'Tapak Suci',
  weightClass: 'Kelas F (70-75 kg)',
  roundScores: [0, 0, 0],
  roundAttackPoints: [0, 0, 0],
  roundPenaltyPoints: [0, 0, 0],
  binaanCount: 0,
  teguranCount: 0,
  peringatanCount: 0,
  isDisqualified: false,
  varCards: 2,
  varUsed: 0,
  medicalTimeUsedSeconds: 0,
  penalties: [],
};

export const INITIAL_SETTINGS: MatchSettings = {
  arena: 'Gelanggang 1 (A)',
  matchNumber: 'Partai 14',
  category: 'Tanding Dewasa',
  gender: 'Putra',
  weightClass: 'Kelas F (70-75 kg)',
  roundDurationSeconds: 120, // 2 minutes
  breakDurationSeconds: 60, // 1 minute
  totalRounds: 3,
  refereeName: 'M. Syarifuddin, S.Pd',
  juryPresidentName: 'Dr. H. Bambang Subagyo',
  secretaryName: 'Rahmat Hidayat',
  scoringMode: 'operator',
  audioEnabled: true,
};
