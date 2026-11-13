export type Corner = "merah" | "biru";
export type MatchCategory = "TANDING" | "TUNGGAL" | "GANDA" | "REGU" | "SOLO_KREATIF";
export type Gender = "PUTRA" | "PUTRI";
export type AgeGroup = "USIA_DINI" | "PRA_REMAJA" | "REMAJA" | "DEWASA" | "MASTER";

export interface SilatAthlete {
  id: string;
  name: string;
  contingent: string;
  category: MatchCategory;
  gender: Gender;
  ageGroup: AgeGroup;
  weightClass?: string;
  weight?: number;
  pool?: string;
}

export interface ActiveJuriVote {
  id: string;
  juriId: number;
  corner: Corner;
  action: "PUKULAN" | "TENDANGAN" | "JATUHAN";
  points: number;
  timestamp: number;
}

export interface NilaiJuri {
  juriId: number;
  babak: number;
  sudut: Corner;
  pukulan: number;
  tendangan: number;
  jatuhan: number;
  hukuman: number;
  total: number;
}

export interface RoundScoreBreakdown {
  round: number;
  pukulan: number;
  tendangan: number;
  jatuhan: number;
  binaan: number;
  teguran: number;
  peringatan: number;
  subtotal: number;
}

export interface FighterMatchScore {
  name: string;
  contingent: string;
  totalScore: number;
  warningCount: number;
  teguranCount: number;
  binaanCount: number;
  rounds: {
    [roundNum: number]: {
      pukulan: number;
      tendangan: number;
      jatuhan: number;
      binaan: number;
      teguran: number;
      peringatan: number;
      rawPoints: number;
      deductions: number;
      netPoints: number;
    };
  };
}

export interface TandingMatch {
  id: string;
  matchNumber: string | number;
  arena: string;
  kelas: string;
  category?: string;
  gender?: string;
  golongan?: string;
  round: number;
  currentRound: number;
  timer: number;
  status: "PENDING" | "WARMUP" | "STARTED" | "RUNNING" | "PAUSED" | "FINISHED";
  merah: FighterMatchScore;
  biru: FighterMatchScore;
  jurors?: number[];
  winner?: Corner | null;
  winReason?: string;
}

export interface RegisteredAthlete {
  id: string;
  name: string;
  contingent: string;
  categoryClass: string;
  ageGroup: string;
  gender: 'PUTRA' | 'PUTRI';
  arena?: string;
  gelanggang?: string;
  discipline?: 'TANDING' | 'JURUS' | 'SENI';
  category?: 'TANDING' | 'JURUS';
  weight?: number;
  weightClass?: string;
  seed?: number;
  lotNumber?: number;
  createdAt?: number;
}
