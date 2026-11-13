export type CornerColor = "MERAH" | "BIRU";
export type PenaltyType = "BINAAN_1" | "BINAAN_2" | "TEGURAN_1" | "TEGURAN_2" | "PERINGATAN_1" | "PERINGATAN_2" | "PERINGATAN_3" | "DISKUALIFIKASI";

export interface ScoreAction {
  id: string;
  corner: CornerColor;
  type: "PUKULAN" | "TENDANGAN" | "JATUHAN" | "PENALTY" | "MANUAL_ADJUST";
  points: number;
  reason?: string;
  round: number;
  timestamp: number;
}

export interface CornerDetail {
  name: string;
  contingent: string;
  totalScore: number;
  penalties: {
    binaan: number;
    teguran: number;
    peringatan: number;
    disqualified: boolean;
  };
}

export interface TandingMatchState {
  id: string;
  arena: string;
  matchNumber: string;
  weightClass: string;
  status: "WAITING" | "RUNNING" | "PAUSED" | "FINISHED";
  currentRound: number;
  maxRounds: number;
  roundDurationSeconds: number;
  timeRemaining: number;
  judgeCount: 3 | 5;
  redCorner: CornerDetail;
  blueCorner: CornerDetail;
  recentActions: ScoreAction[];
  winner: CornerColor | null;
  winMethod?: string;
}
