export enum MatchStatus {
  IDLE = "IDLE",
  PENDING = "PENDING",
  READY = "READY",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  ROUND_BREAK = "ROUND_BREAK",
  FINISHED = "FINISHED"
}
export type FighterColor = "MERAH" | "BIRU" | "RED" | "BLUE";
export type ActionType =
  | "PUKULAN"
  | "TENDANGAN"
  | "JATUHAN"
  | "BINAAN"
  | "TEGURAN"
  | "PERINGATAN"
  | "DISKUALIFIKASI"
  | "KOREKSI"
  | "PUNCH"
  | "KICK"
  | "DROP"
  | "SYSTEM";

export interface ScoreDetail {
  pukulan: number;
  tendangan: number;
  jatuhan: number;
  binaan: number;
  teguran: number;
  peringatan: number;
  total: number;
}

export interface MatchLog {
  id: string;
  round: number;
  fighter: FighterColor;
  action?: ActionType;
  type?: string;
  points: number;
  timestamp: number;
  desc?: string;
  description?: string;
  source?: string;
  uncounted?: boolean;
  pressId?: string;
  juryIds?: number[];
}

export interface FighterInfo {
  nama: string;
  kontingen: string;
  skor: number;
  scoreDetails?: ScoreDetail;
  teguranCount?: number;
  peringatanCount?: number;
}

export interface MatchState {
  id: string;
  matchNumber?: string | number;
  arena: string;
  kelas: string;
  kategori?: string;
  category?: string;
  classCategory?: string;
  golongan?: string;
  division?: string;
  gender?: string;
  stage?: string;
  eventName?: string;
  status: MatchStatus | string;
  currentRound: number;
  activeRound?: number;
  roundCount?: number;
  roundTimer: number;
  timeLeft?: number;
  roundDuration?: number;
  timerStartedAt?: number | null;
  timerEndAt?: number | null;
  merah: FighterInfo;
  biru: FighterInfo;
  fighterRedName?: string;
  fighterRedClub?: string;
  fighterBlueName?: string;
  fighterBlueClub?: string;
  scoreRed?: number;
  scoreBlue?: number;
  redStats?: Record<string, any>;
  blueStats?: Record<string, any>;
  redPenalties?: Record<string, any>;
  bluePenalties?: Record<string, any>;
  logs: MatchLog[];
  activeJuryPresses?: Record<number, any>;
  juryScores?: Record<number, any>;
  juryPressHistory?: any[];
  verification?: {
    action: ActionType | null;
    targetCorner: FighterColor | null;
    votes: Record<number, FighterColor | "TIDAK SAH" | "INVALID" | null>;
    result: FighterColor | "TIDAK SAH" | null;
    active?: boolean;
    type?: "JATUHAN" | "PELANGGARAN" | string;
    corner?: "RED" | "BLUE" | null;
    reason?: string;
  };
  verificationDetails?: any;
  winner?: FighterColor | null;
  winnerColor?: FighterColor | null;
  winMethod?: string;
  winnerMethod?: string;
  winnerPublished?: boolean;
  showRoundOverPopup?: boolean;
  showNextMatchPopup?: boolean;
  secretarySignalNextRound?: boolean;
  juryPanelLocked?: boolean;
  dewanPanelLocked?: boolean;
  isPanelsLocked?: boolean;
  isTieExtendedPossible?: boolean;
  losingCornerColor?: FighterColor | null;
  losingCornerNoScoreDuration?: number;
  lastLosingScore?: number | null;
  wmpThreshold?: number;
  isJurusCategory?: boolean;
  isJurus?: boolean;
  isTgr?: boolean;
  isSeni?: boolean;
  isTanding?: boolean;
  tgrSubCategory?: string;
  discipline?: string;
  judgesCount?: number;
  stateVersion?: number;
  lastUpdatedAt?: number;
  [key: string]: any;
}

export interface AuthSession {
  user: UserAccount;
  token?: string;
  loggedInAt: number;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  fullName?: string;
  email?: string;
  password?: string;
  role: "superadmin" | "sekretaris" | "dewan" | "juri" | "operator" | "monitor" | string;
  arenaAccess?: string;
  isApproved?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
  boundIp?: string;
  isIpLocked?: boolean;
  avatarUrl?: string;
  createdAt?: number;
  approvedBy?: string;
  approvedAt?: number;
  [key: string]: any;
}

export interface Athlete {
  id: string;
  nama: string;
  kontingen: string;
  usia: string;
  gender: "Putera" | "Puteri";
  beratBadan?: number;
  kelasTanding?: string;
  pool?: string;
  kategori?: string;
}

export interface JudgeScore {
  juriId?: number;
  kebenaran?: number;
  kemantapan?: number;
  teknik?: number;
  harmonisasi?: number;
  penjiwaan?: number;
  merah?: number;
  biru?: number;
}

export interface CompetitorPerformance {
  id?: string;
  athleteId?: string;
  nama: string;
  kontingen: string;
  skorTotal?: number;
  pukulan?: number;
  tendangan?: number;
  jatuhan?: number;
  teguran?: number;
  peringatan?: number;
  wrongMovesDeduction: number;
  judgesScores: Record<number, JudgeScore>;
  finalScore?: number;
}

export interface Match {
  id: string;
  noPartai?: number | string;
  partai?: number | string;
  arena: string;
  kelas?: string;
  kategori: string;
  golongan?: string;
  gender?: string;
  babak?: string;
  status: "pending" | "aktif" | "selesai" | "RUNNING" | "PAUSED" | "FINISHED";
  competitors?: CompetitorPerformance[];
  atletMerah?: Athlete | null;
  atletBiru?: Athlete | null;
  skorMerah?: number;
  skorBiru?: number;
  pemenang?: "merah" | "biru" | null;
}

export interface AppState {
  matches: Match[];
  activeMatchId: string | null;
  selectedArena: string;
  timer: {
    elapsedSeconds: number;
    isRunning: boolean;
    currentRound: number;
    roundDuration: number;
  };
  juryCount: number;
  hornActive: boolean;
}

export interface Student {
  id: string;
  name: string;
  nis?: string;
  tingkatan?: string;
  active: boolean;
  avatarUrl?: string;
}

export interface StudentAttendanceRecord {
  studentId: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALPA";
  notes?: string;
}

export interface TrainingPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface TrainingLog {
  id: string;
  date: string;
  title: string;
  location: string;
  instructor: string;
  program: string;
  notes: string;
  attendance: StudentAttendanceRecord[];
  photos: TrainingPhoto[];
  tags?: string[];
}

export interface SchoolProfile {
  name: string;
  branch: string;
  logoUrl?: string;
  address?: string;
}
