export type AppView =
  | 'landing'
  | 'dewan'
  | 'sekretaris'
  | 'juri'
  | 'monitor'
  | 'loting'
  | 'jadwal'
  | 'bracket'
  | 'timer'
  | 'laporan';

export interface Participant {
  id: string;
  name: string;
  contingent: string;
  school: string;
  category: string;
  gender: 'Putra' | 'Putri';
  weightClass: string;
  weightActualKg: number;
  weightInStatus: 'Lolos' | 'Kelebihan' | 'Belum Timbang';
  medicalStatus: 'Layak' | 'Tidak Layak' | 'Perlu Observasi';
  lotNumber?: number;
  seed?: number;
}

export interface ScheduledMatch {
  id: string;
  matchNumber: string; // e.g. "Partai 14"
  arena: string; // "Gelanggang 1 (A)"
  session: string; // "Sesi Pagi (08:30 - 12:00)"
  roundPhase: 'Penyisihan' | 'Perempat Final' | 'Semi Final' | 'Final';
  category: string;
  gender: 'Putra' | 'Putri';
  weightClass: string;
  redFighter: {
    name: string;
    contingent: string;
    school: string;
    score?: number;
    isWinner?: boolean;
  };
  blueFighter: {
    name: string;
    contingent: string;
    school: string;
    score?: number;
    isWinner?: boolean;
  };
  status: 'Menunggu' | 'Pemanasan' | 'Sedang Berlangsung' | 'Selesai';
  winnerNote?: string;
}

export interface ContingentMedal {
  rank: number;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface DewanCase {
  id: string;
  timestamp: string;
  matchNumber: string;
  arena: string;
  corner: 'red' | 'blue';
  fighterName: string;
  issueType: 'Tinjauan VAR' | 'Intervensi Wasit' | 'Diskualifikasi' | 'Banding Manajer';
  description: string;
  status: 'Menunggu Keputusan' | 'Disetujui' | 'Ditolak';
  decisionNotes?: string;
}
