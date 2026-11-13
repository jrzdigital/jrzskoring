/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import os from "os";

import { MatchState, MatchStatus, MatchLog, FighterColor, ActionType, ScoreDetail } from "./src/types";
import {
  loginUser,
  registerUser,
  getAllUsers,
  approveUser,
  rejectUser,
  createUserByAdmin,
  updateUserByAdmin,
  resetPasswordByAdmin,
  deleteUserByAdmin,
  getActivityLogs,
  createPasswordResetRequest,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
  verifyResetToken,
  resetPasswordWithToken,
  createIpUnlockRequest,
  getIpUnlockRequests,
  approveIpUnlockRequest,
  rejectIpUnlockRequest,
  resetUserBoundIp,
  updateUserBoundIp,
  toggleUserIpLock,
  syncUsersWithCloudRtdb
} from "./userManager";

function getRequestIp(req: any): string {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "127.0.0.1";
  if (Array.isArray(ip)) {
    ip = ip[0];
  }
  if (typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }
  return ip;
}

export function getDataDir(): string {
  if (process.env.JRZ_DATA_DIR) {
    try {
      if (!fs.existsSync(process.env.JRZ_DATA_DIR)) {
        fs.mkdirSync(process.env.JRZ_DATA_DIR, { recursive: true });
      }
      return process.env.JRZ_DATA_DIR;
    } catch (e) {}
  }
  const tmpDataDir = path.join(os.tmpdir(), "jrz-score-runtime");
  try {
    if (!fs.existsSync(tmpDataDir)) {
      fs.mkdirSync(tmpDataDir, { recursive: true });
    }
    return tmpDataDir;
  } catch (e) {
    return os.tmpdir();
  }
}

export function getActiveMatchFilePath(): string {
  return path.join(getDataDir(), "activeMatch.json");
}

export function getTournamentFilePath(): string {
  return path.join(getDataDir(), "tournament_data.json");
}

export function getArchiveDir(): string {
  const dir = path.join(getDataDir(), "arsip");
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
  return dir;
}

const app = express();
const PORT = process.env.ELECTRON_RUN_PORT
  ? parseInt(process.env.ELECTRON_RUN_PORT, 10)
  : process.env.DEFAULT_APP_PORT
    ? parseInt(process.env.DEFAULT_APP_PORT, 10)
    : 3000;

// Unique Server Instance ID per installation to strictly isolate different application installations
let serverInstanceId = "";
try {
  const instanceFile = path.join(getDataDir(), "server_instance.json");
  if (fs.existsSync(instanceFile)) {
    const data = JSON.parse(fs.readFileSync(instanceFile, "utf8"));
    serverInstanceId = data.instanceId;
  }
  if (!serverInstanceId) {
    serverInstanceId = "SRV-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    fs.writeFileSync(instanceFile, JSON.stringify({ instanceId: serverInstanceId, createdAt: new Date().toISOString() }));
  }
} catch (e) {
  serverInstanceId = "SRV-FIREBASE-CLOUD";
}

// Enable CORS for iframe preview, Electron, and local Wi-Fi devices
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-jrz-event-id, x-jrz-instance-id");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// SSE Clients array for real-time push synchronization
let sseClients: any[] = [];

// Send periodic heartbeat pings (every 10 seconds) to prevent routers from killing idle connections
setInterval(() => {
  sseClients.forEach(res => {
    try {
      res.write(": keepalive\n\n");
    } catch (e) {
      // client dropped
    }
  });
}, 10000);

interface JuryPing {
  ip: string;
  lastSeen: number;
}
const juryPings: { [juryId: number]: JuryPing } = {};

interface DevicePing {
  ip: string;
  lastSeen: number;
}
const devicePings: { [deviceId: string]: DevicePing } = {};

function updateJuryConnections() {
  const now = Date.now();
  activeMatch.juryConnections = {
    1: { active: (juryPings[1] && now - juryPings[1].lastSeen < 6000) || (devicePings["juri1"] && now - devicePings["juri1"].lastSeen < 6000) || false, ip: juryPings[1]?.ip || devicePings["juri1"]?.ip || "-", lastSeen: juryPings[1]?.lastSeen || devicePings["juri1"]?.lastSeen || 0 },
    2: { active: (juryPings[2] && now - juryPings[2].lastSeen < 6000) || (devicePings["juri2"] && now - devicePings["juri2"].lastSeen < 6000) || false, ip: juryPings[2]?.ip || devicePings["juri2"]?.ip || "-", lastSeen: juryPings[2]?.lastSeen || devicePings["juri2"]?.lastSeen || 0 },
    3: { active: (juryPings[3] && now - juryPings[3].lastSeen < 6000) || (devicePings["juri3"] && now - devicePings["juri3"].lastSeen < 6000) || false, ip: juryPings[3]?.ip || devicePings["juri3"]?.ip || "-", lastSeen: juryPings[3]?.lastSeen || devicePings["juri3"]?.lastSeen || 0 }
  };

  activeMatch.deviceConnections = {
    monitor: {
      active: (devicePings["monitor"] && now - devicePings["monitor"].lastSeen < 6000) || false,
      ip: devicePings["monitor"]?.ip || "-",
      lastSeen: devicePings["monitor"]?.lastSeen || 0
    },
    sekretaris: {
      active: (devicePings["sekretaris"] && now - devicePings["sekretaris"].lastSeen < 6000) || false,
      ip: devicePings["sekretaris"]?.ip || "-",
      lastSeen: devicePings["sekretaris"]?.lastSeen || 0
    },
    dewan: {
      active: (devicePings["dewan"] && now - devicePings["dewan"].lastSeen < 6000) || false,
      ip: devicePings["dewan"]?.ip || "-",
      lastSeen: devicePings["dewan"]?.lastSeen || 0
    },
    juri1: {
      active: (devicePings["juri1"] && now - devicePings["juri1"].lastSeen < 6000) || (juryPings[1] && now - juryPings[1].lastSeen < 6000) || false,
      ip: devicePings["juri1"]?.ip || juryPings[1]?.ip || "-",
      lastSeen: devicePings["juri1"]?.lastSeen || juryPings[1]?.lastSeen || 0
    },
    juri2: {
      active: (devicePings["juri2"] && now - devicePings["juri2"].lastSeen < 6000) || (juryPings[2] && now - juryPings[2].lastSeen < 6000) || false,
      ip: devicePings["juri2"]?.ip || juryPings[2]?.ip || "-",
      lastSeen: devicePings["juri2"]?.lastSeen || juryPings[2]?.lastSeen || 0
    },
    juri3: {
      active: (devicePings["juri3"] && now - devicePings["juri3"].lastSeen < 6000) || (juryPings[3] && now - juryPings[3].lastSeen < 6000) || false,
      ip: devicePings["juri3"]?.ip || juryPings[3]?.ip || "-",
      lastSeen: devicePings["juri3"]?.lastSeen || juryPings[3]?.lastSeen || 0
    }
  };
}

// Helper to broadcast state changes instantly to all connected panels
function broadcastState() {
  updateJuryConnections();
  activeMatch.lastUpdatedAt = Date.now();
  activeMatch.stateVersion = (Number(activeMatch.stateVersion) || 0) + 1;
  const data = JSON.stringify(activeMatch);
  
  // Persist current state to activeMatch.json for recovery on server restarts
  try {
    fs.writeFileSync(getActiveMatchFilePath(), data, "utf8");
  } catch (err) {
    console.error("[AUTOSAVE] Gagal menyimpan status pertandingan ke file:", err);
  }

  sseClients.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {
      // client dropped
    }
  });
}

// Middleware to automatically broadcast activeMatch updates via SSE
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (this: any, body: any) {
    const result = originalJson.call(this, body);
    if (
      req.method === "POST" && 
      (req.path.startsWith("/api/match-state") || 
       req.path.startsWith("/api/jury") || 
       req.path.startsWith("/api/dewan") || 
       req.path.startsWith("/api/tgr") || 
       req.path === "/api/matches-schedule/load")
    ) {
      broadcastState();
    }
    return result;
  };
  next();
});

// Main active match state in-memory database
let activeMatch: MatchState = {
  id: "match-1",
  eventName: "",
  fighterRedName: "",
  fighterRedClub: "",
  fighterBlueName: "",
  fighterBlueClub: "",
  classCategory: "",
  matchNumber: "",
  roundCount: 3,
  activeRound: 1,
  roundDuration: 120, // seconds
  timeLeft: 120,
  status: MatchStatus.IDLE,
  scoreRed: 0,
  scoreBlue: 0,
  redStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
  blueStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
  redPenalties: {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  },
  bluePenalties: {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  },
  activeJuryPresses: {
    1: null,
    2: null,
    3: null
  },
  juryScores: {
    1: {
      1: { red: 0, blue: 0 },
      2: { red: 0, blue: 0 },
      3: { red: 0, blue: 0 }
    },
    2: {
      1: { red: 0, blue: 0 },
      2: { red: 0, blue: 0 },
      3: { red: 0, blue: 0 }
    },
    3: {
      1: { red: 0, blue: 0 },
      2: { red: 0, blue: 0 },
      3: { red: 0, blue: 0 }
    }
  },
  verification: undefined,
  showRoundOverPopup: false,
  secretarySignalNextRound: false,
  juryPanelLocked: true,
  dewanPanelLocked: true,
  logoLeft: "",
  logoRight: "",
  gender: "PUTRA",
  stage: "PENYISIHAN",
  projectionMode: false,
  division: "DEWASA",
  losingCornerNoScoreDuration: 0,
  losingCornerColor: null,
  lastLosingScore: undefined,
  logs: [
    {
      id: "init",
      timestamp: Date.now(),
      round: 1,
      fighter: "RED",
      description: "Pertandingan diinisialisasi. Selamat bertanding!",
      points: 0,
      source: "Sistem",
      type: "SYSTEM"
    }
  ]
};

// Internal list to track history of individual jury inputs to calculate consensus
interface JuryPressHistory {
  id: string;
  juryId: number;
  fighter: FighterColor;
  action: ActionType;
  timestamp: number;
  consumed: boolean;
}

let juryPressHistory: JuryPressHistory[] = [];
let autoAdvanceTimer: NodeJS.Timeout | null = null;

// Recalculates total score for both fighters based on stats and penalties under IPSI 2022 rules
function recalculateScores() {
  // Pukulan = 1 * count
  // Tendangan = 2 * count
  // Jatuhan = 3 * count
  // Kuncian = 3 * count
  
  // Calculate Red Positive
  const redPositive = 
    (activeMatch.redStats.punches * 1) + 
    (activeMatch.redStats.kicks * 2) + 
    (activeMatch.redStats.drops * 3) + 
    (activeMatch.redStats.locks * 3) +
    (activeMatch.redStats.overrides || 0);
  
  // Red Warnings and Penalties
  // Teguran 1 = -1
  // Teguran 2 = -2
  // Peringatan 1 = -5
  // Peringatan 2 = -10
  let redPenaltyDeductions = activeMatch.redStats.pastPenaltiesDeductions || 0;
  if (activeMatch.redPenalties.teguran1) redPenaltyDeductions += 1;
  if (activeMatch.redPenalties.teguran2) redPenaltyDeductions += 2;
  if (activeMatch.redPenalties.peringatan1) redPenaltyDeductions += 5;
  if (activeMatch.redPenalties.peringatan2) redPenaltyDeductions += 10;
  
  activeMatch.redStats.warnings = redPenaltyDeductions;
  activeMatch.scoreRed = redPositive - redPenaltyDeductions;

  // Calculate Blue Positive
  const bluePositive = 
    (activeMatch.blueStats.punches * 1) + 
    (activeMatch.blueStats.kicks * 2) + 
    (activeMatch.blueStats.drops * 3) + 
    (activeMatch.blueStats.locks * 3) +
    (activeMatch.blueStats.overrides || 0);
    
  let bluePenaltyDeductions = activeMatch.blueStats.pastPenaltiesDeductions || 0;
  if (activeMatch.bluePenalties.teguran1) bluePenaltyDeductions += 1;
  if (activeMatch.bluePenalties.teguran2) bluePenaltyDeductions += 2;
  if (activeMatch.bluePenalties.peringatan1) bluePenaltyDeductions += 5;
  if (activeMatch.bluePenalties.peringatan2) bluePenaltyDeductions += 10;
  
  activeMatch.blueStats.warnings = bluePenaltyDeductions;
  activeMatch.scoreBlue = bluePositive - bluePenaltyDeductions;
}

function endCurrentRoundPenalties() {
  const redRoundDeduction = (activeMatch.redPenalties.teguran1 ? 1 : 0) + (activeMatch.redPenalties.teguran2 ? 2 : 0);
  const blueRoundDeduction = (activeMatch.bluePenalties.teguran1 ? 1 : 0) + (activeMatch.bluePenalties.teguran2 ? 2 : 0);

  activeMatch.redStats.pastPenaltiesDeductions = (activeMatch.redStats.pastPenaltiesDeductions || 0) + redRoundDeduction;
  activeMatch.blueStats.pastPenaltiesDeductions = (activeMatch.blueStats.pastPenaltiesDeductions || 0) + blueRoundDeduction;

  // Reset infractions for current round except warnings and disqualified
  activeMatch.redPenalties.binaan1 = false;
  activeMatch.redPenalties.binaan2 = false;
  activeMatch.redPenalties.teguran1 = false;
  activeMatch.redPenalties.teguran2 = false;

  activeMatch.bluePenalties.binaan1 = false;
  activeMatch.bluePenalties.binaan2 = false;
  activeMatch.bluePenalties.teguran1 = false;
  activeMatch.bluePenalties.teguran2 = false;

  recalculateScores();
}

// =========================================================================
// TIE-BREAKER RULE DETERMINATOR & AUTOMATIC PARTY SCHEDULER ADVANCEMENT
// =========================================================================

function runMatchTieBreaker(): { winner: "RED" | "BLUE"; method: string; tieExtended: boolean } {
  // Disqualified check
  if (activeMatch.redPenalties.disqualified && !activeMatch.bluePenalties.disqualified) {
    return { winner: "BLUE", method: "DISKUALIFIKASI LAWAN", tieExtended: false };
  }
  if (activeMatch.bluePenalties.disqualified && !activeMatch.redPenalties.disqualified) {
    return { winner: "RED", method: "DISKUALIFIKASI LAWAN", tieExtended: false };
  }

  // Recalculate to make absolutely sure they are correct
  recalculateScores();

  if (activeMatch.scoreRed > activeMatch.scoreBlue) {
    return { winner: "RED", method: "KEUNGGULAN SKOR", tieExtended: false };
  }
  if (activeMatch.scoreBlue > activeMatch.scoreRed) {
    return { winner: "BLUE", method: "KEUNGGULAN SKOR", tieExtended: false };
  }

  // Draw situation: KETENTUAN 1: Sedikitnya Nilai Hukuman (Penalti) Sesuai IPSI 2026
  let redPenPoints = (activeMatch.redStats?.pastPenaltiesDeductions || 0);
  if (activeMatch.redPenalties.teguran1) redPenPoints += 1;
  if (activeMatch.redPenalties.teguran2) redPenPoints += 2;
  if (activeMatch.redPenalties.peringatan1) redPenPoints += 5;
  if (activeMatch.redPenalties.peringatan2) redPenPoints += 10;

  let bluePenPoints = (activeMatch.blueStats?.pastPenaltiesDeductions || 0);
  if (activeMatch.bluePenalties.teguran1) bluePenPoints += 1;
  if (activeMatch.bluePenalties.teguran2) bluePenPoints += 2;
  if (activeMatch.bluePenalties.peringatan1) bluePenPoints += 5;
  if (activeMatch.bluePenalties.peringatan2) bluePenPoints += 10;

  if (redPenPoints < bluePenPoints) {
    return { winner: "RED", method: "NILAI SERI - LEBIH SEDIKIT HUKUMAN (PENALTI)", tieExtended: false };
  }
  if (bluePenPoints < redPenPoints) {
    return { winner: "BLUE", method: "NILAI SERI - LEBIH SEDIKIT HUKUMAN (PENALTI)", tieExtended: false };
  }

  // KETENTUAN 2: Nilai Prestasi Teknik
  // Drops (3) + Locks (3)
  const red3 = (activeMatch.redStats.drops || 0) + (activeMatch.redStats.locks || 0);
  const blue3 = (activeMatch.blueStats.drops || 0) + (activeMatch.blueStats.locks || 0);
  if (red3 !== blue3) {
    return { 
      winner: red3 > blue3 ? "RED" : "BLUE", 
      method: "NILAI SERI & HUKUMAN SAMA - PRESTASI TEKNIK JATUHAN/KUNCIAN DOMINAN", 
      tieExtended: false 
    };
  }

  // Kicks (2)
  const red2 = activeMatch.redStats.kicks || 0;
  const blue2 = activeMatch.blueStats.kicks || 0;
  if (red2 !== blue2) {
    return { 
      winner: red2 > blue2 ? "RED" : "BLUE", 
      method: "NILAI SERI & HUKUMAN SAMA - PRESTASI TEKNIK TENDANGAN DOMINAN", 
      tieExtended: false 
    };
  }

  // Punches (1)
  const red1 = activeMatch.redStats.punches || 0;
  const blue1 = activeMatch.blueStats.punches || 0;
  if (red1 !== blue1) {
    return { 
      winner: red1 > blue1 ? "RED" : "BLUE", 
      method: "NILAI SERI & HUKUMAN SAMA - PRESTASI TEKNIK PUKULAN DOMINAN", 
      tieExtended: false 
    };
  }

  // KETENTUAN 3: Penambahan babak ke 4 (jika belum berada di babak 4)
  if (activeMatch.activeRound < 4) {
    return { winner: "RED", method: "TIE_EXTENSION", tieExtended: true };
  }

  // KETENTUAN 4: Undian (Lotere)
  const lotere = Math.random() < 0.5 ? "RED" : "BLUE";
  return { 
    winner: lotere, 
    method: "NILAI SERI SEMPURNA DI BABAK 4 - KEPUTUSAN UNDIAN (LOTERE) RESMI", 
    tieExtended: false 
  };
}

export function compileJuryPressStats(logs: MatchLog[]) {
  const stats = {
    juri1: { redPunch: 0, redKick: 0, bluePunch: 0, blueKick: 0, total: 0 },
    juri2: { redPunch: 0, redKick: 0, bluePunch: 0, blueKick: 0, total: 0 },
    juri3: { redPunch: 0, redKick: 0, bluePunch: 0, blueKick: 0, total: 0 },
    totalBluePunches: 0,
    totalBlueKicks: 0,
    totalRedPunches: 0,
    totalRedKicks: 0,
    totalPresses: 0
  };

  (logs || []).forEach(log => {
    const juryList: number[] = [];
    if (!log.uncounted && log.juryIds && Array.isArray(log.juryIds)) {
      juryList.push(...log.juryIds);
    } else if (log.uncounted && log.source && log.source.startsWith("Juri ")) {
      const jNum = parseInt(log.source.replace("Juri ", ""), 10);
      if (!isNaN(jNum)) juryList.push(jNum);
    }

    juryList.forEach(jId => {
      const target = jId === 1 ? stats.juri1 : jId === 2 ? stats.juri2 : jId === 3 ? stats.juri3 : null;
      if (!target) return;

      if (log.fighter === "BLUE") {
        if (log.type === "PUNCH") {
          target.bluePunch++;
          stats.totalBluePunches++;
        } else if (log.type === "KICK") {
          target.blueKick++;
          stats.totalBlueKicks++;
        }
      } else if (log.fighter === "RED") {
        if (log.type === "PUNCH") {
          target.redPunch++;
          stats.totalRedPunches++;
        } else if (log.type === "KICK") {
          target.redKick++;
          stats.totalRedKicks++;
        }
      }
      target.total++;
      stats.totalPresses++;
    });
  });

  return stats;
}

function processMatchFinish() {
  const winnerResult = runMatchTieBreaker();

  activeMatch.status = MatchStatus.FINISHED;
  // Kendali penuh ada pada Dewan Pertandingan: Pemenang BELUM diumumkan sampai Dewan menekan UMUMKAN PEMENANG!
  activeMatch.winnerPublished = false;
  activeMatch.showRoundOverPopup = false;
  activeMatch.dewanPanelLocked = false;
  activeMatch.juryPressStats = compileJuryPressStats(activeMatch.logs);

  if (winnerResult.tieExtended) {
    activeMatch.isTieExtendedPossible = true;
    activeMatch.winnerColor = null;
    activeMatch.winnerMethod = "DRAW / SERI (POIN AKHIR SAMA)";
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: "RED",
      description: "PERTANDINGAN SELESAI SEMENTARA! Hasil Seri/Sama Kuat di Akhir Babak. Menunggu Cek Nilai Dewan Pertandingan.",
      points: 0,
      source: "Sistem Keputusan",
      type: "SYSTEM"
    });
  } else {
    activeMatch.isTieExtendedPossible = false;
    activeMatch.winnerColor = winnerResult.winner;
    activeMatch.winnerMethod = winnerResult.method;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: winnerResult.winner,
      description: `BABAK TERAKHIR SELESAI! Menunggu Dewan Pertandingan melakukan Cek Nilai & Mengumumkan Pemenang Resmi.`,
      points: 0,
      source: "Dewan Pertandingan",
      type: "SYSTEM"
    });
  }

  // JANGAN jalankan autoAdvanceTimer di sini! Auto advance hanya berjalan 20 detik SETELAH Dewan mengumumkan pemenang.
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  broadcastState();
}

function propagateWinnerAcrossSchedules(
  matchId: string, 
  actualId: string, 
  winnerId: string | undefined, 
  winnerName: string | undefined, 
  winnerClub: string | undefined, 
  categoryClassId?: string, 
  gender?: string
) {
  if (!winnerId) return;
  const matchIdClean = matchId ? matchId.replace(/^match-/, "") : "";
  const actualIdClean = actualId ? actualId.replace(/^match-/, "") : "";

  const matchKeys = new Set([
    `winner-${matchIdClean}`,
    `winner-${actualIdClean}`,
    `winner-${matchId}`,
    `winner-${actualId}`,
    `winner-match-${matchIdClean}`,
    `winner-match-${actualIdClean}`
  ]);

  matchesSchedule.forEach(m => {
    // 1. Direct winner-{matchId} referencing across any arena/gelanggang
    if (m.fighterRedId && matchKeys.has(m.fighterRedId)) {
      m.fighterRedId = winnerId;
      if (winnerName) m.fighterRedName = winnerName;
      if (winnerClub) m.fighterRedClub = winnerClub;
    }
    if (m.fighterBlueId && matchKeys.has(m.fighterBlueId)) {
      m.fighterBlueId = winnerId;
      if (winnerName) m.fighterBlueName = winnerName;
      if (winnerClub) m.fighterBlueClub = winnerClub;
    }

    // 2. Pool A & Pool B Finals auto-feeding Grand Final
    if (categoryClassId && gender && m.categoryClassId === categoryClassId && m.gender === gender) {
      if (m.id && m.id.includes("-grand-f-")) {
        if (matchId.includes("-pa-f-") || actualId.includes("-pa-f-")) {
          m.fighterRedId = winnerId;
          if (winnerName) m.fighterRedName = winnerName;
          if (winnerClub) m.fighterRedClub = winnerClub;
        }
        if (matchId.includes("-pb-f-") || actualId.includes("-pb-f-")) {
          m.fighterBlueId = winnerId;
          if (winnerName) m.fighterBlueName = winnerName;
          if (winnerClub) m.fighterBlueClub = winnerClub;
        }
      }
    }
  });
}

function loadNextMatch() {
  const actualId = activeMatch.id.startsWith("match-") ? activeMatch.id.replace("match-", "") : activeMatch.id;
  const currentIdx = matchesSchedule.findIndex(m => m.id === actualId || m.matchNumber === activeMatch.matchNumber);
  
  // Find next match with status "BELUM"
  const nextMatch = matchesSchedule.find((m, idx) => idx > currentIdx && m.status === "BELUM");
  if (nextMatch) {
    const match = nextMatch;
    const pRed = participants.find(p => p.id === match.fighterRedId);
    const pBlue = participants.find(p => p.id === match.fighterBlueId);
    const cat = categories.find(c => c.id === match.categoryClassId);

    // Load into activeMatch state
    activeMatch.id = "match-" + match.id;
    activeMatch.matchNumber = match.matchNumber;
    activeMatch.stage = match.stage as any;
    activeMatch.gender = match.gender as any;
    activeMatch.status = MatchStatus.IDLE;
    activeMatch.roundCount = 3; // Reset default round count to 3 for the new match!
    activeMatch.activeRound = 1;
    activeMatch.timeLeft = activeMatch.roundDuration;
    if (match.arena) {
      activeMatch.arena = match.arena;
    }

    if (pRed) {
      activeMatch.fighterRedName = pRed.name;
      activeMatch.fighterRedClub = pRed.club;
    } else if (match.fighterRedName && match.fighterRedName !== "PESILAT MERAH") {
      activeMatch.fighterRedName = match.fighterRedName;
      activeMatch.fighterRedClub = match.fighterRedClub || "CONTINGENT MERAH";
    } else {
      activeMatch.fighterRedName = "PESILAT MERAH";
      activeMatch.fighterRedClub = "CONTINGENT MERAH";
    }

    if (pBlue) {
      activeMatch.fighterBlueName = pBlue.name;
      activeMatch.fighterBlueClub = pBlue.club;
    } else if (match.fighterBlueName && match.fighterBlueName !== "PESILAT BIRU") {
      activeMatch.fighterBlueName = match.fighterBlueName;
      activeMatch.fighterBlueClub = match.fighterBlueClub || "CONTINGENT BIRU";
    } else {
      activeMatch.fighterBlueName = "PESILAT BIRU";
      activeMatch.fighterBlueClub = "CONTINGENT BIRU";
    }

    if (cat) {
      activeMatch.classCategory = `Tanding ${cat.name} ${match.gender === "PUTRI" ? "Putri" : "Putra"} (${cat.minWeight}Kg - ${cat.maxWeight}Kg)`;
      activeMatch.division = cat.division || "DEWASA";
    } else {
      activeMatch.classCategory = "Tanding Bebas";
      activeMatch.division = "DEWASA";
    }
    // Reset special 30-point gap tracking variables
    activeMatch.losingCornerNoScoreDuration = 0;
    activeMatch.losingCornerColor = null;
    activeMatch.lastLosingScore = undefined;

    // Reset scores & stats
    activeMatch.scoreRed = 0;
    activeMatch.scoreBlue = 0;
    activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.redPenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
    activeMatch.bluePenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
    activeMatch.activeJuryPresses = { 1: null, 2: null, 3: null };
    activeMatch.juryScores = {
      1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
      2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
      3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
    };
    activeMatch.verification = undefined;
    activeMatch.showRoundOverPopup = false;
    activeMatch.showNextMatchPopup = true;
    activeMatch.secretarySignalNextRound = false;
    activeMatch.juryPanelLocked = true;
    activeMatch.dewanPanelLocked = true;
    activeMatch.winnerPublished = false;
    activeMatch.winnerColor = null;
    activeMatch.winnerMethod = undefined;
    activeMatch.isTieExtendedPossible = false;
    juryPressHistory = [];
    activeMatch.logs = [
      {
        id: "active-" + Date.now(),
        timestamp: Date.now(),
        round: 1,
        fighter: "RED",
        description: `OTOMATIS BERALIH: Partai ${match.matchNumber} (${activeMatch.classCategory}) diaktifkan otomatis dari jadwal.`,
        points: 0,
        source: "Sistem Otomatisasi",
        type: "SYSTEM"
      }
    ];

    nextMatch.status = "SEDANG" as any;
    broadcastState();
  } else {
    // If no further match in schedule, increment partai number for continuous standalone operation
    const curMatchNumStr = String(activeMatch.matchNumber || "Partai 1");
    const numMatch = curMatchNumStr.match(/\d+/);
    const nextNum = numMatch ? parseInt(numMatch[0], 10) + 1 : 2;
    const nextPartaiLabel = `Partai ${nextNum}`;

    activeMatch.id = "match-" + Date.now();
    activeMatch.matchNumber = nextPartaiLabel;
    activeMatch.status = MatchStatus.IDLE;
    activeMatch.roundCount = 3;
    activeMatch.activeRound = 1;
    activeMatch.timeLeft = activeMatch.roundDuration || 120;
    activeMatch.scoreRed = 0;
    activeMatch.scoreBlue = 0;
    activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.redPenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
    activeMatch.bluePenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
    activeMatch.activeJuryPresses = { 1: null, 2: null, 3: null };
    activeMatch.juryScores = {
      1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
      2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
      3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
    };
    activeMatch.verification = undefined;
    activeMatch.showRoundOverPopup = false;
    activeMatch.showNextMatchPopup = true;
    activeMatch.secretarySignalNextRound = false;
    activeMatch.juryPanelLocked = true;
    activeMatch.dewanPanelLocked = true;
    activeMatch.winnerPublished = false;
    activeMatch.winnerColor = null;
    activeMatch.winnerMethod = undefined;
    activeMatch.isTieExtendedPossible = false;
    activeMatch.losingCornerNoScoreDuration = 0;
    activeMatch.losingCornerColor = null;
    activeMatch.lastLosingScore = undefined;
    juryPressHistory = [];
    activeMatch.logs = [
      {
        id: "active-" + Date.now(),
        timestamp: Date.now(),
        round: 1,
        fighter: "RED",
        description: `Partai ${nextPartaiLabel} (${activeMatch.classCategory}) siap dimulai.`,
        points: 0,
        source: "Sistem Otomatisasi",
        type: "SYSTEM"
      }
    ];
    broadcastState();
  }
}

// Global server ticker for countdown synchronized across clients
let matchInterval: NodeJS.Timeout | null = null;
function checkRunningTimer() {
  if (activeMatch.status === MatchStatus.RUNNING) {
    if (!activeMatch.timeLeft || activeMatch.timeLeft <= 0) {
      activeMatch.timeLeft = activeMatch.roundDuration || 120;
    }
    const now = Date.now();
    if (!activeMatch.timerEndAt || activeMatch.timerEndAt <= now) {
      activeMatch.timerStartedAt = now;
      activeMatch.timerEndAt = now + activeMatch.timeLeft * 1000;
    }
    if (!matchInterval) {
      matchInterval = setInterval(() => {
        if (activeMatch.status === MatchStatus.RUNNING) {
          if (activeMatch.timeLeft > 0) {
            activeMatch.timeLeft--;
            
            // Special 30-point gap rule in the second round for Remaja/Dewasa
            const isRemajaOrDewasa = 
              activeMatch.division?.toUpperCase() === "REMAJA" || 
              activeMatch.division?.toUpperCase() === "DEWASA" ||
              activeMatch.classCategory?.toUpperCase().includes("REMAJA") ||
              activeMatch.classCategory?.toUpperCase().includes("DEWASA");

            if (activeMatch.activeRound === 2 && isRemajaOrDewasa) {
              const scoreDiff = Math.abs(activeMatch.scoreRed - activeMatch.scoreBlue);
              if (scoreDiff >= 30) {
                const currentLosingColor = activeMatch.scoreRed > activeMatch.scoreBlue ? "BLUE" : "RED";
                const currentLosingScore = currentLosingColor === "BLUE" ? activeMatch.scoreBlue : activeMatch.scoreRed;
                
                if (activeMatch.losingCornerColor === currentLosingColor) {
                  if (currentLosingScore > (activeMatch.lastLosingScore || 0)) {
                    // Score increased! Reset duration and update last score
                    activeMatch.losingCornerNoScoreDuration = 0;
                    activeMatch.lastLosingScore = currentLosingScore;
                  } else {
                    // No score increase, increment duration
                    activeMatch.losingCornerNoScoreDuration = (activeMatch.losingCornerNoScoreDuration || 0) + 1;
                    activeMatch.lastLosingScore = currentLosingScore;
                  }
                } else {
                  // Started tracking
                  activeMatch.losingCornerColor = currentLosingColor;
                  activeMatch.lastLosingScore = currentLosingScore;
                  activeMatch.losingCornerNoScoreDuration = 0;
                }

                // If 1 minute (60 seconds) is reached, leading corner wins!
                if ((activeMatch.losingCornerNoScoreDuration || 0) >= 60) {
                  const winnerColor = currentLosingColor === "BLUE" ? "RED" : "BLUE";
                  const winnerName = winnerColor === "RED" ? activeMatch.fighterRedName : activeMatch.fighterBlueName;
                  
                  activeMatch.status = MatchStatus.FINISHED;
                  activeMatch.winnerColor = winnerColor;
                  activeMatch.winnerMethod = "MENANG MUTLAK (SELISIH 30 POIN & 1 MENIT TANPA BALASAN)";
                  activeMatch.winnerPublished = true;
                  
                  activeMatch.logs.unshift({
                    id: Math.random().toString(36).substring(7),
                    timestamp: Date.now(),
                    round: activeMatch.activeRound,
                    fighter: winnerColor,
                    description: `KEMENANGAN MUTLAK! ${winnerName} menang karena selisih score >= 30 poin dironde kedua dan selama 1 menit tidak ada penambahan nilai dari sudut ${currentLosingColor === "BLUE" ? "Biru" : "Merah"}.`,
                    points: 0,
                    source: "Sistem",
                    type: "SYSTEM"
                  });

                  // Automatically update schedule match
                  const actualId = activeMatch.id.startsWith("match-") ? activeMatch.id.replace("match-", "") : activeMatch.id;
                  const currentIdx = matchesSchedule.findIndex(m => m.id === actualId || m.matchNumber === activeMatch.matchNumber);
                  if (currentIdx !== -1) {
                    matchesSchedule[currentIdx].status = "SELESAI";
                    matchesSchedule[currentIdx].winner = winnerColor === "RED" ? "MERAH" : "BIRU";
                    matchesSchedule[currentIdx].scoreRed = activeMatch.scoreRed;
                    matchesSchedule[currentIdx].scoreBlue = activeMatch.scoreBlue;
                    matchesSchedule[currentIdx].redStats = activeMatch.redStats ? { ...activeMatch.redStats } : undefined;
                    matchesSchedule[currentIdx].blueStats = activeMatch.blueStats ? { ...activeMatch.blueStats } : undefined;
                    matchesSchedule[currentIdx].fighterRedName = activeMatch.fighterRedName;
                    matchesSchedule[currentIdx].fighterBlueName = activeMatch.fighterBlueName;
                    matchesSchedule[currentIdx].fighterRedClub = activeMatch.fighterRedClub;
                    matchesSchedule[currentIdx].fighterBlueClub = activeMatch.fighterBlueClub;
                    matchesSchedule[currentIdx].classCategory = activeMatch.classCategory;
                  }

                  // Clear the running interval
                  if (matchInterval) {
                    clearInterval(matchInterval);
                    matchInterval = null;
                  }

                  if (autoAdvanceTimer) {
                    clearTimeout(autoAdvanceTimer);
                    autoAdvanceTimer = null;
                  }
                  autoAdvanceTimer = setTimeout(() => {
                    if (activeMatch.status === MatchStatus.FINISHED) {
                      console.log("OTOMATIS BERALIH: Durasi selebrasi selesai, memuat partai selanjutnya...");
                      loadNextMatch();
                      broadcastState();
                    }
                  }, 10000);
                }
              } else {
                // Score difference less than 30, reset tracking
                activeMatch.losingCornerColor = null;
                activeMatch.lastLosingScore = undefined;
                activeMatch.losingCornerNoScoreDuration = 0;
              }
            } else {
              // Not round 2 or not Remaja/Dewasa, reset tracking
              activeMatch.losingCornerColor = null;
              activeMatch.lastLosingScore = undefined;
              activeMatch.losingCornerNoScoreDuration = 0;
            }

            // Clean up old visual jury light presses after 1200ms
            const now = Date.now();
            [1, 2, 3].forEach(juryId => {
              const press = activeMatch.activeJuryPresses[juryId];
              if (press && (now - press.pressedAt) > 1200) {
                activeMatch.activeJuryPresses[juryId] = null;
              }
            });
            broadcastState();
          } else {
            // End of round automatically
            activeMatch.status = MatchStatus.PAUSED;
            activeMatch.timerEndAt = null;
            activeMatch.timerStartedAt = null;
            activeMatch.showRoundOverPopup = true;
            activeMatch.dewanPanelLocked = true; // Automatically lock dewan panel when round finishes
            activeMatch.logs.unshift({
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
              round: activeMatch.activeRound,
              fighter: "RED",
              description: `WAKTU HABIS! Ronde ${activeMatch.activeRound} Selesai.`,
              points: 0,
              source: "Sistem",
              type: "SYSTEM"
            });
            
            // On round end, automatically reset physical infractions except warnings and notify secretary
            if (activeMatch.activeRound < activeMatch.roundCount) {
              endCurrentRoundPenalties();
              activeMatch.secretarySignalNextRound = true;
            }
            
            // auto process winner and next schedules if final round completed
            if (activeMatch.activeRound === activeMatch.roundCount) {
              processMatchFinish();
            } else {
              broadcastState();
            }

            clearInterval(matchInterval!);
            matchInterval = null;
          }
        } else {
          broadcastState();
          clearInterval(matchInterval!);
          matchInterval = null;
        }
      }, 1000);
    }
  } else {
    if (matchInterval) {
      clearInterval(matchInterval);
      matchInterval = null;
    }
    broadcastState();
  }
}

// Periodic background check to clear visual jury press animations (1200ms retention)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  [1, 2, 3].forEach(jId => {
    const press = activeMatch.activeJuryPresses[jId];
    if (press && (now - press.pressedAt) > 1200) {
      activeMatch.activeJuryPresses[jId] = null;
      changed = true;
    }
  });
  if (changed) {
    broadcastState();
  }
}, 80);

// API Routes definitions
app.get("/api/match-state", (req, res) => {
  updateJuryConnections();
  res.json(activeMatch);
});

app.post("/api/jury/ping", (req, res) => {
  const { juryId } = req.body;
  const idValue = Number(juryId);
  if (idValue >= 1 && idValue <= 3) {
    let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    if (ip === "::ffff:127.0.0.1" || ip === "::1") {
      ip = "127.0.0.1";
    }
    juryPings[idValue] = {
      ip: ip,
      lastSeen: Date.now()
    };
  }
  res.json({ success: true });
});

app.post("/api/device/ping", (req, res) => {
  const { deviceId } = req.body;
  if (typeof deviceId === "string" && deviceId.trim()) {
    let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    if (ip === "::ffff:127.0.0.1" || ip === "::1") {
      ip = "127.0.0.1";
    }
    devicePings[deviceId.trim()] = {
      ip: ip,
      lastSeen: Date.now()
    };
    updateJuryConnections();
    broadcastState();
  }
  res.json({ success: true });
});

// Server info endpoint to get local network IPs with 5G vs 2.4GHz & Hotspot classification
app.get("/api/server-info", (req, res) => {
  interface NetInfo {
    address: string;
    name: string;
    type: "hotspot" | "wifi" | "ethernet" | "virtual" | "other";
    label: string;
    priority: number;
  }
  
  const rawList: NetInfo[] = [];
  const ifaces = os.networkInterfaces();
  
  for (const name of Object.keys(ifaces)) {
    const lowerName = name.toLowerCase();
    for (const net of ifaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        const addr = net.address;
        let type: NetInfo["type"] = "other";
        let label = `LAN (${addr})`;
        let priority = 10;
        
        // 1. Detect Hotspot (e.g. Windows Mobile Hotspot default IP 192.168.137.1 or adapter name)
        if (addr === "192.168.137.1" || lowerName.includes("hotspot") || lowerName.includes("hosted") || lowerName.includes("wi-fi direct") || lowerName.includes("local area connection*")) {
          type = "hotspot";
          label = `Hotspot Laptop (2.4 GHz & 5 GHz) - ${addr}`;
          priority = 100; // Highest priority for connecting 2.4GHz mobile devices
        }
        // 2. Detect Virtual adapters to deprioritize / filter
        else if (
          lowerName.includes("vbox") ||
          lowerName.includes("virtualbox") ||
          lowerName.includes("vmware") ||
          lowerName.includes("vethernet") ||
          lowerName.includes("wsl") ||
          lowerName.includes("docker") ||
          addr.startsWith("192.168.56.") ||
          (addr.startsWith("172.") && (lowerName.includes("vethernet") || lowerName.includes("wsl") || lowerName.includes("docker")))
        ) {
          type = "virtual";
          label = `Virtual Adapter (${name}) - ${addr}`;
          priority = 1;
        }
        // 3. Detect Wi-Fi / WLAN (Router 5GHz / 2.4GHz)
        else if (lowerName.includes("wi-fi") || lowerName.includes("wireless") || lowerName.includes("wlan")) {
          type = "wifi";
          label = `Wi-Fi Router (${name}) - ${addr}`;
          priority = 80;
        }
        // 4. Detect Ethernet
        else if (lowerName.includes("ethernet") || lowerName.includes("eth")) {
          type = "ethernet";
          label = `Ethernet Kabel (${name}) - ${addr}`;
          priority = 60;
        }
        // 5. Standard private network IP (192.168.x.x, 10.x.x.x)
        else if (addr.startsWith("192.168.") || addr.startsWith("10.")) {
          type = "wifi";
          label = `Jaringan Lokal (${addr})`;
          priority = 70;
        }
        
        rawList.push({
          address: addr,
          name,
          type,
          label,
          priority
        });
      }
    }
  }

  // Sort by priority descending (Hotspot first, then Wi-Fi, then Ethernet, virtual last)
  rawList.sort((a, b) => b.priority - a.priority);

  // Filter out pure virtual adapters from top suggestions unless no other IP exists
  const cleanIps = rawList.map(r => r.address);
  const nonVirtualIps = rawList.filter(r => r.type !== "virtual").map(r => r.address);
  const finalIps = nonVirtualIps.length > 0 ? nonVirtualIps : (cleanIps.length > 0 ? cleanIps : ["127.0.0.1"]);

  const hostHeader = req.headers.host || "";
  const localSyncUrl = hostHeader ? `${req.protocol || "http"}://${hostHeader}` : `http://${finalIps[0] || "127.0.0.1"}:${PORT}`;

  let buildStamp = "v1.0.0-firebase";
  try {
    const stampCandidates = [
      path.join(process.cwd(), "dist", "build.stamp"),
      path.join(__dirname, "build.stamp"),
      path.join(__dirname, "..", "dist", "build.stamp")
    ];
    for (const sc of stampCandidates) {
      if (fs.existsSync(sc)) {
        buildStamp = fs.readFileSync(sc, "utf8").trim();
        break;
      }
    }
  } catch (e) {}

  res.json({
    ips: finalIps,
    interfaces: rawList,
    port: PORT,
    cloudSyncUrl: localSyncUrl,
    localSyncUrl,
    mode: "ONLINE_FIREBASE",
    serverInstanceId,
    buildStamp
  });
});

// Authentication & User Management API Routes
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  const ip = getRequestIp(req);
  await syncUsersWithCloudRtdb().catch(() => {});
  const result = loginUser(username, password, ip);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.post("/api/auth/register", (req, res) => {
  const ip = getRequestIp(req);
  const result = registerUser(req.body || {}, ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get("/api/users/list", async (req, res) => {
  await syncUsersWithCloudRtdb().catch(() => {});
  const users = getAllUsers();
  res.json(users);
});

app.post("/api/users/approve", (req, res) => {
  const { userId, username, approvedBy } = req.body || {};
  const ip = getRequestIp(req);
  const targetKey = userId || username;
  const result = approveUser(targetKey, approvedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/reject", (req, res) => {
  const { userId, username, rejectedBy } = req.body || {};
  const ip = getRequestIp(req);
  const targetKey = userId || username;
  const result = rejectUser(targetKey, rejectedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/create", (req, res) => {
  const { username, password, fullName, role, organization, emailOrPhone, createdBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = createUserByAdmin(
    { username, password, fullName, role, organization, emailOrPhone },
    createdBy || "Super Admin",
    ip
  );
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/update", (req, res) => {
  const { userId, updates, updatedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = updateUserByAdmin(userId, updates || {}, updatedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/reset-password", (req, res) => {
  const { userId, newPassword, resetBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = resetPasswordByAdmin(userId, newPassword, resetBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const deletedBy = (req.query.deletedBy as string) || "Super Admin";
  const ip = getRequestIp(req);
  const result = deleteUserByAdmin(userId, deletedBy, ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get("/api/users/activity-logs", (req, res) => {
  const logs = getActivityLogs();
  res.json(logs);
});

// Password Reset Workflow Endpoints
app.post("/api/auth/forgot-password-request", (req, res) => {
  const { username, emailOrPhone } = req.body || {};
  const ip = getRequestIp(req);
  const result = createPasswordResetRequest(username, emailOrPhone, ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get("/api/auth/reset-requests", (req, res) => {
  const requests = getPasswordResetRequests();
  res.json(requests);
});

app.post("/api/auth/approve-reset-request", (req, res) => {
  const { requestId, approvedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = approvePasswordResetRequest(requestId, approvedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/auth/reject-reset-request", (req, res) => {
  const { requestId, rejectedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = rejectPasswordResetRequest(requestId, rejectedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get("/api/auth/verify-reset-token", (req, res) => {
  const token = (req.query.token as string) || "";
  const result = verifyResetToken(token);
  if (!result.valid) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/auth/reset-password-with-token", (req, res) => {
  const { token, newPassword } = req.body || {};
  const ip = getRequestIp(req);
  const result = resetPasswordWithToken(token, newPassword, ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Client IP & IP Unlock Management API Routes
app.get("/api/auth/client-ip", (req, res) => {
  const ip = getRequestIp(req);
  res.json({ ip });
});

app.post("/api/auth/ip-unlock-request", (req, res) => {
  const { username, requestedIp, reason, emailOrPhone } = req.body || {};
  const ip = getRequestIp(req);
  const result = createIpUnlockRequest(username, requestedIp || ip, reason, emailOrPhone, ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get("/api/auth/ip-unlock-requests", (req, res) => {
  const requests = getIpUnlockRequests();
  res.json(requests);
});

app.post("/api/auth/approve-ip-unlock", (req, res) => {
  const { requestId, approvedBy, actionType } = req.body || {};
  const ip = getRequestIp(req);
  const result = approveIpUnlockRequest(requestId, approvedBy || "Super Admin", actionType || "SET_NEW_IP", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/auth/reject-ip-unlock", (req, res) => {
  const { requestId, rejectedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = rejectIpUnlockRequest(requestId, rejectedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/reset-bound-ip", (req, res) => {
  const { userId, resetBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = resetUserBoundIp(userId, resetBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/update-bound-ip", (req, res) => {
  const { userId, customIp, updatedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = updateUserBoundIp(userId, customIp, updatedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/users/toggle-ip-lock", (req, res) => {
  const { userId, enabled, updatedBy } = req.body || {};
  const ip = getRequestIp(req);
  const result = toggleUserIpLock(userId, !!enabled, updatedBy || "Super Admin", ip);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});


// SSE endpoint for real-time streaming state
app.get("/api/match-state/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  
  // Send current state immediately on connection
  res.write(`data: ${JSON.stringify(activeMatch)}\n\n`);
  
  sseClients.push(res);
  
  req.on("close", () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Update metadata (Event name, athletes, etc.)
app.post("/api/match-state/update", (req, res) => {
  const { 
    eventName, 
    fighterRedName, 
    fighterRedClub, 
    fighterBlueName, 
    fighterBlueClub, 
    classCategory, 
    matchNumber, 
    roundCount, 
    roundDuration,
    timeLeft,
    logoLeft,
    logoRight,
    gender,
    stage,
    showRoundOverPopup,
    showNextMatchPopup,
    projectionMode,
    juryPanelLocked,
    dewanPanelLocked,
    isPanelsLocked,
    secretarySignalNextRound,
    division
  } = req.body;

  if (eventName !== undefined) activeMatch.eventName = eventName;
  if (fighterRedName !== undefined) activeMatch.fighterRedName = fighterRedName;
  if (fighterRedClub !== undefined) activeMatch.fighterRedClub = fighterRedClub;
  if (fighterBlueName !== undefined) activeMatch.fighterBlueName = fighterBlueName;
  if (fighterBlueClub !== undefined) activeMatch.fighterBlueClub = fighterBlueClub;
  if (classCategory !== undefined) activeMatch.classCategory = classCategory;
  if (matchNumber !== undefined) activeMatch.matchNumber = matchNumber;
  if (roundCount !== undefined) activeMatch.roundCount = Number(roundCount);
  if (logoLeft !== undefined) activeMatch.logoLeft = logoLeft;
  if (logoRight !== undefined) activeMatch.logoRight = logoRight;
  if (gender !== undefined) activeMatch.gender = gender;
  if (stage !== undefined) activeMatch.stage = stage;
  if (showRoundOverPopup !== undefined) activeMatch.showRoundOverPopup = showRoundOverPopup;
  if (showNextMatchPopup !== undefined) activeMatch.showNextMatchPopup = showNextMatchPopup;
  
  // Dedicated & synchronized panel lock/unlock handling
  const isUnlockRequested = juryPanelLocked === false || dewanPanelLocked === false || isPanelsLocked === false;
  if (isUnlockRequested) {
    activeMatch.juryPanelLocked = false;
    activeMatch.dewanPanelLocked = false;
    activeMatch.isPanelsLocked = false;
    activeMatch.showNextMatchPopup = false;
    activeMatch.showRoundOverPopup = false;
    activeMatch.secretarySignalNextRound = false;
  } else {
    if (juryPanelLocked !== undefined) activeMatch.juryPanelLocked = !!juryPanelLocked;
    if (dewanPanelLocked !== undefined) activeMatch.dewanPanelLocked = !!dewanPanelLocked;
    if (isPanelsLocked !== undefined) activeMatch.isPanelsLocked = !!isPanelsLocked;
  }

  if (projectionMode !== undefined) activeMatch.projectionMode = projectionMode;
  if (timeLeft !== undefined) activeMatch.timeLeft = Number(timeLeft);
  if (secretarySignalNextRound !== undefined) activeMatch.secretarySignalNextRound = !!secretarySignalNextRound;
  if (division !== undefined) activeMatch.division = division;
  if (req.body.judgesCount !== undefined) {
    activeMatch.judgesCount = Number(req.body.judgesCount);
    if (activeTgrsState) activeTgrsState.judgesCount = Number(req.body.judgesCount);
  }
  
  if (roundDuration !== undefined) {
    activeMatch.roundDuration = Number(roundDuration);
    if (activeMatch.status === MatchStatus.IDLE) {
      activeMatch.timeLeft = Number(roundDuration);
    }
  }

  activeMatch.lastUpdatedAt = Date.now();
  activeMatch.stateVersion = (Number(activeMatch.stateVersion) || 0) + 1;

  activeMatch.logs.unshift({
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    round: activeMatch.activeRound,
    fighter: "RED",
    description: isUnlockRequested 
      ? "Kunci panel Dewan & Juri dibuka oleh Operator / Sekretaris"
      : "Detail data pertandingan diperbarui oleh Sekretaris / Dewan",
    points: 0,
    source: "Sekretaris",
    type: "SYSTEM"
  });

  broadcastState();
  res.json(activeMatch);
});

// Dedicated atomic Lock/Unlock endpoint for instant cross-device LAN sync (2.4GHz <-> 5GHz)
app.post("/api/match-state/toggle-lock", (req, res) => {
  const { locked } = req.body;
  const isLocked = Boolean(locked);

  activeMatch.juryPanelLocked = isLocked;
  activeMatch.dewanPanelLocked = isLocked;
  activeMatch.isPanelsLocked = isLocked;

  if (!isLocked) {
    activeMatch.showRoundOverPopup = false;
    activeMatch.showNextMatchPopup = false;
    activeMatch.secretarySignalNextRound = false;
  }

  activeMatch.lastUpdatedAt = Date.now();
  activeMatch.stateVersion = (Number(activeMatch.stateVersion) || 0) + 1;

  activeMatch.logs.unshift({
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    round: activeMatch.activeRound,
    fighter: "RED",
    description: isLocked 
      ? "🔒 PANEL JURI & DEWAN DIKUNCI oleh Operator / Sekretaris"
      : "🔓 PANEL JURI & DEWAN DIBUKA KUNCI oleh Operator / Sekretaris",
    points: 0,
    source: "Operator",
    type: "SYSTEM"
  });

  broadcastState();
  res.json(activeMatch);
});

// Dismiss popup endpoint specifically
app.post("/api/match-state/dismiss-popup", (req, res) => {
  activeMatch.showRoundOverPopup = false;
  broadcastState();
  res.json(activeMatch);
});

// Restore full match state from client autosave
app.post("/api/match-state/restore", (req, res) => {
  const { state } = req.body || {};
  if (state && typeof state === "object") {
    activeMatch = {
      ...activeMatch,
      ...state
    };
    checkRunningTimer();
    broadcastState();
    return res.json({ success: true, activeMatch });
  }
  return res.status(400).json({ error: "State tidak valid" });
});

// TGRS Jurus API state persistence & synchronization
let activeTgrsState: any = null;

app.get("/api/tgr/state", (req, res) => {
  res.json(activeTgrsState || {});
});

app.post("/api/tgr/state", (req, res) => {
  activeTgrsState = req.body;
  if (activeTgrsState && activeTgrsState.athleteName) {
    if (activeTgrsState.partai) {
      activeMatch.matchNumber = String(activeTgrsState.partai).startsWith("Partai")
        ? activeTgrsState.partai
        : `Partai ${activeTgrsState.partai}`;
    }
    activeMatch.fighterRedName = activeTgrsState.athleteName;
    activeMatch.fighterRedClub = activeTgrsState.contingent || "";
    activeMatch.kategori = activeTgrsState.category || activeTgrsState.kategori || "TUNGGAL";
    activeMatch.classCategory = activeTgrsState.categoryLabel || `Seni ${activeTgrsState.category}`;
    if (activeTgrsState.ageCategory) activeMatch.division = activeTgrsState.ageCategory;
    if (activeTgrsState.gender) activeMatch.gender = activeTgrsState.gender;
    if (activeTgrsState.judgesCount) activeMatch.judgesCount = Number(activeTgrsState.judgesCount);
  }
  broadcastState();
  res.json({ success: true, state: activeTgrsState });
});

// Reset match data completely for a clean party
app.post("/api/match-state/reset", (req, res) => {
  activeMatch = {
    id: "match-1",
    eventName: req.body.eventName || "",
    fighterRedName: req.body.fighterRedName || "",
    fighterRedClub: req.body.fighterRedClub || "",
    fighterBlueName: req.body.fighterBlueName || "",
    fighterBlueClub: req.body.fighterBlueClub || "",
    classCategory: req.body.classCategory || "",
    matchNumber: req.body.matchNumber || "",
    roundCount: Number(req.body.roundCount) || 3,
    activeRound: 1,
    roundDuration: Number(req.body.roundDuration) || 120,
    timeLeft: Number(req.body.roundDuration) || 120,
    status: MatchStatus.IDLE,
    scoreRed: 0,
    scoreBlue: 0,
    redStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
    blueStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
    redPenalties: {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false
    },
    bluePenalties: {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false
    },
    activeJuryPresses: { 1: null, 2: null, 3: null },
    juryScores: {
      1: {
        1: { red: 0, blue: 0 },
        2: { red: 0, blue: 0 },
        3: { red: 0, blue: 0 }
      },
      2: {
        1: { red: 0, blue: 0 },
        2: { red: 0, blue: 0 },
        3: { red: 0, blue: 0 }
      },
      3: {
        1: { red: 0, blue: 0 },
        2: { red: 0, blue: 0 },
        3: { red: 0, blue: 0 }
      }
    },
    verification: undefined,
    showRoundOverPopup: false,
    secretarySignalNextRound: false,
    juryPanelLocked: true,
    dewanPanelLocked: true,
    logoLeft: req.body.logoLeft || req.body.logoSisiKiri || "",
    logoRight: req.body.logoRight || req.body.logoSisiKanan || "",
    gender: req.body.gender || "PUTRA",
    stage: req.body.stage || "PENYISIHAN",
    projectionMode: false,
    division: req.body.division || "DEWASA",
    losingCornerNoScoreDuration: 0,
    losingCornerColor: null,
    lastLosingScore: undefined,
    winnerPublished: false,
    winnerColor: null,
    winnerMethod: undefined,
    isTieExtendedPossible: false,
    logs: [
      {
        id: "reset-" + Date.now(),
        timestamp: Date.now(),
        round: 1,
        fighter: "RED",
        description: "Pertandingan diatur ulang / mulai baru.",
        points: 0,
        source: "Sistem",
        type: "SYSTEM"
      }
    ]
  };
  juryPressHistory = [];
  checkRunningTimer();
  res.json(activeMatch);
});

// Timer play/pause and time controls
app.post("/api/match-state/timer", (req, res) => {
  const { command, timeLeft, timerEndAt, timerStartedAt } = req.body;
  if (command === "START") {
    if (typeof timeLeft === "number" && timeLeft > 0) {
      activeMatch.timeLeft = timeLeft;
    } else if (!activeMatch.timeLeft || activeMatch.timeLeft <= 0) {
      activeMatch.timeLeft = activeMatch.roundDuration || 120;
    }
    const now = Date.now();
    activeMatch.timerStartedAt = typeof timerStartedAt === "number" && timerStartedAt > 0 ? timerStartedAt : now;
    activeMatch.timerEndAt = typeof timerEndAt === "number" && timerEndAt > now ? timerEndAt : (now + activeMatch.timeLeft * 1000);
    activeMatch.status = MatchStatus.RUNNING;
    activeMatch.secretarySignalNextRound = false;
    activeMatch.juryPanelLocked = false; // Automatically unlock!
    activeMatch.dewanPanelLocked = false; // Automatically unlock!
    activeMatch.showRoundOverPopup = false; // Automatically hide round over popup on start
    activeMatch.showNextMatchPopup = false; // Automatically hide next match popup on start
    activeMatch.winnerPublished = false;
    activeMatch.winnerColor = null;
    activeMatch.winnerMethod = undefined;
    activeMatch.isTieExtendedPossible = false;
    // Bersihkan status diskualifikasi lama saat memulai waktu pertandingan
    if (activeMatch.redPenalties) activeMatch.redPenalties.disqualified = false;
    if (activeMatch.bluePenalties) activeMatch.bluePenalties.disqualified = false;
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: "RED",
      description: `WAKTU DIMULAI - Ronde ${activeMatch.activeRound}!`,
      points: 0,
      source: "Sistem",
      type: "SYSTEM"
    });
  } else if (command === "PAUSE") {
    activeMatch.status = MatchStatus.PAUSED;
    activeMatch.timerEndAt = null;
    activeMatch.timerStartedAt = null;
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: "RED",
      description: "WAKTU DIHENTIKAN!",
      points: 0,
      source: "Sistem",
      type: "SYSTEM"
    });
  } else if (command === "ADD_10") {
    activeMatch.timeLeft = Math.min(activeMatch.roundDuration || 120, activeMatch.timeLeft + 10);
    if (activeMatch.status === MatchStatus.RUNNING) {
      activeMatch.timerEndAt = Date.now() + activeMatch.timeLeft * 1000;
    }
  } else if (command === "SUB_10") {
    activeMatch.timeLeft = Math.max(0, activeMatch.timeLeft - 10);
    if (activeMatch.status === MatchStatus.RUNNING) {
      activeMatch.timerEndAt = Date.now() + activeMatch.timeLeft * 1000;
    }
  } else if (command === "RESET") {
    activeMatch.status = MatchStatus.IDLE;
    activeMatch.timeLeft = activeMatch.roundDuration || 120;
    activeMatch.timerEndAt = null;
    activeMatch.timerStartedAt = null;
    activeMatch.showRoundOverPopup = false;
    activeMatch.showNextMatchPopup = false;
    activeMatch.secretarySignalNextRound = false;
  }

  checkRunningTimer();
  broadcastState();
  res.json(activeMatch);
});

// Round switching endpoint
app.post("/api/match-state/round", (req, res) => {
  const { roundAction, targetRound } = req.body;
  
  // Clear secretary next round signal and timer timestamps
  activeMatch.secretarySignalNextRound = false;
  activeMatch.juryPanelLocked = false; // Automatically unlock!
  activeMatch.showRoundOverPopup = false; // Automatically hide round over popup on round change
  activeMatch.timerEndAt = null;
  activeMatch.timerStartedAt = null;

  if (roundAction === "NEXT") {
    if (activeMatch.activeRound < activeMatch.roundCount) {
      endCurrentRoundPenalties();
      activeMatch.activeRound++;
      activeMatch.timeLeft = activeMatch.roundDuration || 120;
      activeMatch.timerEndAt = null;
      activeMatch.timerStartedAt = null;
      activeMatch.status = MatchStatus.PAUSED;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        round: activeMatch.activeRound,
        fighter: "RED",
        description: `Beralih ke Ronde ${activeMatch.activeRound}. Siap!`,
        points: 0,
        source: "Sistem",
        type: "SYSTEM"
      });
    }
  } else if (roundAction === "SET" && targetRound) {
    const tRound = Number(targetRound);
    if (tRound !== activeMatch.activeRound) {
      endCurrentRoundPenalties();
      activeMatch.activeRound = tRound;
      activeMatch.timeLeft = activeMatch.roundDuration || 120;
      activeMatch.timerEndAt = null;
      activeMatch.timerStartedAt = null;
      activeMatch.status = MatchStatus.PAUSED;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        round: activeMatch.activeRound,
        fighter: "RED",
        description: `Babak disetel ke Ronde ${targetRound} oleh Ketua Pertandingan`,
        points: 0,
        source: "Ketua Pertandingan",
        type: "SYSTEM"
      });
    }
  } else if (roundAction === "FINISH") {
    processMatchFinish();
  }

  checkRunningTimer();
  broadcastState();
  res.json(activeMatch);
});

// Secretary: Publish/Announce Winner to visual monitoring panel
app.post("/api/match-state/publish-winner", (req, res) => {
  activeMatch.winnerPublished = true;
  broadcastState();
  res.json(activeMatch);
});

// Secretary: Archive current match and advance to next partai match
app.post("/api/match-state/next-match", (req, res) => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  const actualId = activeMatch.id.startsWith("match-") ? activeMatch.id.replace("match-", "") : activeMatch.id;
  let currentIdx = matchesSchedule.findIndex(m => m.id === actualId || m.matchNumber === activeMatch.matchNumber);
  
  const winnerSide = activeMatch.winnerColor === "RED" 
    ? "MERAH" 
    : (activeMatch.winnerColor === "BLUE" 
        ? "BIRU" 
        : (activeMatch.scoreRed > activeMatch.scoreBlue ? "MERAH" : (activeMatch.scoreBlue > activeMatch.scoreRed ? "BIRU" : undefined)));

  const juryStats = compileJuryPressStats(activeMatch.logs);
  activeMatch.juryPressStats = juryStats;

  if (currentIdx !== -1) {
    matchesSchedule[currentIdx].status = "SELESAI" as any;
    if (winnerSide) {
      matchesSchedule[currentIdx].winner = winnerSide;
    }
    // Archive final scores, stats and metadata
    matchesSchedule[currentIdx].scoreRed = activeMatch.scoreRed;
    matchesSchedule[currentIdx].scoreBlue = activeMatch.scoreBlue;
    matchesSchedule[currentIdx].redStats = activeMatch.redStats ? { ...activeMatch.redStats } : undefined;
    matchesSchedule[currentIdx].blueStats = activeMatch.blueStats ? { ...activeMatch.blueStats } : undefined;
    matchesSchedule[currentIdx].fighterRedName = activeMatch.fighterRedName;
    matchesSchedule[currentIdx].fighterBlueName = activeMatch.fighterBlueName;
    matchesSchedule[currentIdx].fighterRedClub = activeMatch.fighterRedClub;
    matchesSchedule[currentIdx].fighterBlueClub = activeMatch.fighterBlueClub;
    matchesSchedule[currentIdx].classCategory = activeMatch.classCategory;
    matchesSchedule[currentIdx].juryPressStats = { ...juryStats };
    matchesSchedule[currentIdx].logs = activeMatch.logs ? JSON.parse(JSON.stringify(activeMatch.logs)) : [];

    if (winnerSide) {
      const matchObj = matchesSchedule[currentIdx];
      const winId = winnerSide === "MERAH" ? matchObj.fighterRedId : matchObj.fighterBlueId;
      const winName = winnerSide === "MERAH" ? (matchObj.fighterRedName || activeMatch.fighterRedName) : (matchObj.fighterBlueName || activeMatch.fighterBlueName);
      const winClub = winnerSide === "MERAH" ? (matchObj.fighterRedClub || activeMatch.fighterRedClub) : (matchObj.fighterBlueClub || activeMatch.fighterBlueClub);
      propagateWinnerAcrossSchedules(matchObj.id, actualId, winId, winName, winClub, matchObj.categoryClassId, matchObj.gender);
    }
  } else {
    // Archive standalone / unlisted match into schedule history
    matchesSchedule.push({
      id: actualId || "archived-" + Date.now(),
      matchNumber: activeMatch.matchNumber || "Partai 1",
      stage: (activeMatch.stage as any) || "PENYISIHAN",
      gender: (activeMatch.gender as any) || "PUTRA",
      status: "SELESAI" as any,
      winner: winnerSide,
      scoreRed: activeMatch.scoreRed,
      scoreBlue: activeMatch.scoreBlue,
      redStats: activeMatch.redStats ? { ...activeMatch.redStats } : undefined,
      blueStats: activeMatch.blueStats ? { ...activeMatch.blueStats } : undefined,
      fighterRedName: activeMatch.fighterRedName,
      fighterBlueName: activeMatch.fighterBlueName,
      fighterRedClub: activeMatch.fighterRedClub,
      fighterBlueClub: activeMatch.fighterBlueClub,
      classCategory: activeMatch.classCategory,
      division: activeMatch.division || "DEWASA",
      juryPressStats: { ...juryStats },
      logs: activeMatch.logs ? JSON.parse(JSON.stringify(activeMatch.logs)) : []
    });
  }
  saveTournamentData();
  const finishedMatchObj = currentIdx !== -1 ? matchesSchedule[currentIdx] : matchesSchedule[matchesSchedule.length - 1];
  archiveCompletedMatch(finishedMatchObj);
  loadNextMatch();
  broadcastState();
  res.json(activeMatch);
});

// Secretary: Transition to Babak 4 (Overtime/Extended) in case of a perfect draw
app.post("/api/match-state/add-round-4", (req, res) => {
  activeMatch.roundCount = 4;
  activeMatch.activeRound = 4;
  activeMatch.timeLeft = activeMatch.roundDuration;
  activeMatch.status = MatchStatus.PAUSED;
  activeMatch.showRoundOverPopup = false;
  activeMatch.winnerPublished = false;
  activeMatch.isTieExtendedPossible = false;
  activeMatch.winnerColor = null;
  activeMatch.winnerMethod = undefined;
  activeMatch.logs.unshift({
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    round: 4,
    fighter: "RED",
    description: "BABAK TAMBAHAN KE-4 DIMULAI! Nilai Prestasi Teknik & Hukuman Kedua Pesilat Sama Seimbang di Akhir Babak 3.",
    points: 0,
    source: "Sistem Keputusan",
    type: "SYSTEM"
  });
  broadcastState();
  res.json(activeMatch);
});

// Server-side debounce map to prevent double-clicks from jury devices
const lastServerJuryPressMap: Record<string, number> = {};

// Jury button press endpoint with Consensus Logic
app.post("/api/jury/press", (req, res) => {
  const { juryId, fighter, action, pressId } = req.body;
  
  const now = Date.now();
  const CONSENSUS_WINDOW_MS = 2000; // Toleransi waktu sinkronisasi konsensus juri: max 2 detik (2000 ms)

  // Anti-double-click guard (800ms for same button, 400ms across any button)
  const pressKey = `${juryId}_${fighter}_${action}`;
  const anyKey = `${juryId}_ANY`;
  if (now - (lastServerJuryPressMap[pressKey] || 0) < 800 || now - (lastServerJuryPressMap[anyKey] || 0) < 400) {
    return res.json(activeMatch);
  }
  lastServerJuryPressMap[pressKey] = now;
  lastServerJuryPressMap[anyKey] = now;

  // Show active status indicator instantly on monitor
  activeMatch.activeJuryPresses[Number(juryId)] = {
    fighter,
    action,
    pressedAt: now
  };

  // Schedule auto-clearing visual indicator on backend after 2 seconds
  setTimeout(() => {
    if (activeMatch.activeJuryPresses[Number(juryId)]?.pressedAt === now) {
      activeMatch.activeJuryPresses[Number(juryId)] = null;
      broadcastState();
    }
  }, 2000);

  if (activeMatch.status !== MatchStatus.RUNNING) {
    // If not running, record test log so officials can see the remote responds
    const alreadyLoggedTest = (activeMatch.logs || []).some(
      l => (pressId && l.id === pressId) || (l.source === `Juri ${juryId}` && l.fighter === fighter && l.type === action && Math.abs(now - (l.timestamp || 0)) < 1200)
    );
    if (!alreadyLoggedTest) {
      activeMatch.logs.unshift({
        id: pressId || Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `UJI COBA GAWAI: Juri ${juryId} menekan ${action === "PUNCH" ? "Pukulan" : "Tendangan"} ${fighter === "RED" ? "Merah" : "Biru"} (Status: ${activeMatch.status})`,
        points: action === "PUNCH" ? 1 : 2,
        source: `Juri ${juryId}`,
        type: action,
        uncounted: true
      });
      broadcastState();
    }
    return res.json(activeMatch);
  }

  // Clear non-consumed presses older than 2.0 seconds
  juryPressHistory = juryPressHistory.filter(p => !p.consumed && (now - p.timestamp) <= CONSENSUS_WINDOW_MS);

  const currentPress: JuryPressHistory = {
    id: Math.random().toString(36).substring(7),
    juryId: Number(juryId),
    fighter,
    action,
    timestamp: now,
    consumed: false
  };
  juryPressHistory.push(currentPress);

  const pointValue = action === "PUNCH" ? 1 : 2;

  // Check if there is an active consensus log created recently (within 2 seconds) for the same event
  // where our juryId is not yet included (3-jury rapid join within 2s)
  const recentConsensusLog = activeMatch.logs.find(log => 
    !log.uncounted &&
    log.round === activeMatch.activeRound &&
    log.fighter === fighter &&
    log.type === action &&
    (now - log.timestamp) <= CONSENSUS_WINDOW_MS &&
    log.juryIds &&
    !log.juryIds.includes(Number(juryId))
  );

  if (recentConsensusLog && recentConsensusLog.juryIds) {
    // Add current jury to the existing consensus
    recentConsensusLog.juryIds.push(Number(juryId));
    recentConsensusLog.juryIds.sort();
    
    // Update labels
    recentConsensusLog.source = `Konsensus Juri (J${recentConsensusLog.juryIds.join(", J")})`;
    recentConsensusLog.description = `NILAI MASUK: Juri ${recentConsensusLog.juryIds.join(" & ")} setuju +${pointValue} Poin ${action === "PUNCH" ? "Pukulan" : "Tendangan"} ${fighter === "RED" ? "Merah" : "Biru"}!`;
    
    // Mark this press as consumed
    currentPress.consumed = true;

    // Apply scores to round-by-round score cards for this jury
    const id = Number(juryId);
    if (!activeMatch.juryScores[id]) {
      activeMatch.juryScores[id] = {
        1: { red: 0, blue: 0 },
        2: { red: 0, blue: 0 },
        3: { red: 0, blue: 0 }
      };
    }
    const r = activeMatch.activeRound;
    if (!activeMatch.juryScores[id][r]) {
      activeMatch.juryScores[id][r] = { red: 0, blue: 0 };
    }
    if (fighter === "RED") {
      activeMatch.juryScores[id][r].red += pointValue;
    } else {
      activeMatch.juryScores[id][r].blue += pointValue;
    }

  } else {
    // Evaluate Consensus (Coincidence within 2.0 seconds / 2000ms of other unconsumed presses)
    const matchingPresses = juryPressHistory.filter(p => 
      !p.consumed &&
      p.juryId !== currentPress.juryId &&
      p.fighter === fighter &&
      p.action === action &&
      (now - p.timestamp) <= CONSENSUS_WINDOW_MS
    );

    if (matchingPresses.length > 0) {
      // Consensus is reached within 2.0 seconds between current and matching presses!
      currentPress.consumed = true;
      matchingPresses.forEach(p => p.consumed = true);

      const juryIdsInvolved = [currentPress.juryId, ...matchingPresses.map(p => p.juryId)].sort();

      // Remove single uncounted logs for the presses and juries involved in this consensus
      const pressIdsToRemove = [currentPress.id, ...matchingPresses.map(p => p.id)];
      if (pressId) pressIdsToRemove.push(pressId);
      activeMatch.logs = activeMatch.logs.filter((log) => {
        if (log.pressId && pressIdsToRemove.includes(log.pressId)) return false;
        if (
          log.uncounted &&
          log.round === activeMatch.activeRound &&
          log.fighter === fighter &&
          log.type === action &&
          (now - (log.timestamp || 0)) <= 3000 &&
          juryIdsInvolved.some((jId) => log.source === `Juri ${jId}` || (log.juryIds && log.juryIds.includes(jId)))
        ) {
          return false;
        }
        return true;
      });

      // Apply scores to cumulative stats
      if (fighter === "RED") {
        if (action === "PUNCH") activeMatch.redStats.punches++;
        else activeMatch.redStats.kicks++;
      } else {
        if (action === "PUNCH") activeMatch.blueStats.punches++;
        else activeMatch.blueStats.kicks++;
      }

      // Apply scores specifically to the individual round-by-round jury cards!
      juryIdsInvolved.forEach(id => {
        if (!activeMatch.juryScores[id]) {
          activeMatch.juryScores[id] = {
            1: { red: 0, blue: 0 },
            2: { red: 0, blue: 0 },
            3: { red: 0, blue: 0 }
          };
        }
        const r = activeMatch.activeRound;
        if (!activeMatch.juryScores[id][r]) {
          activeMatch.juryScores[id][r] = { red: 0, blue: 0 };
        }
        if (fighter === "RED") {
          activeMatch.juryScores[id][r].red += pointValue;
        } else {
          activeMatch.juryScores[id][r].blue += pointValue;
        }
      });

      // Record verified match log
      activeMatch.logs.unshift({
        id: pressId || Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `NILAI MASUK: Juri ${juryIdsInvolved.join(" & ") } setuju +${pointValue} Poin ${action === "PUNCH" ? "Pukulan" : "Tendangan"} ${fighter === "RED" ? "Merah" : "Biru"} (Konsensus <=2 Detik)!`,
        points: pointValue,
        source: `Konsensus Juri (J${juryIdsInvolved.join(", J")})`,
        type: action,
        uncounted: false,
        juryIds: juryIdsInvolved
      });

      recalculateScores();
    } else {
      // More than 2.0s or only one jury has pressed: not counted and goes to monitor log as uncounted attempt
      const alreadyLogged = (activeMatch.logs || []).some(
        (l) =>
          (pressId && (l.id === pressId || l.pressId === pressId)) ||
          (l.round === activeMatch.activeRound &&
           l.fighter === fighter &&
           l.type === action &&
           (l.source === `Juri ${juryId}` || (l.juryIds && l.juryIds.includes(Number(juryId)))) &&
           Math.abs(now - (l.timestamp || 0)) <= 1500)
      );
      if (!alreadyLogged) {
        activeMatch.logs.unshift({
          id: pressId || Math.random().toString(36).substring(7),
          timestamp: now,
          round: activeMatch.activeRound,
          fighter,
          description: `PERCOBAAN POIN: Juri ${juryId} menekan ${action === "PUNCH" ? "Pukulan" : "Tendangan"} ${fighter === "RED" ? "Merah" : "Biru"} (Menunggu Konsensus <=2 Detik)`,
          points: pointValue,
          source: `Juri ${juryId}`,
          type: action,
          uncounted: true,
          pressId: pressId || currentPress.id
        });
      }
    }
  }

  broadcastState();
  res.json(activeMatch);
});

// Jury button backspace/undo endpoint
app.post("/api/jury/undo", (req, res) => {
  const { juryId, fighter } = req.body;
  const jId = Number(juryId);
  const r = activeMatch.activeRound;
  const fLabel = fighter === "RED" ? "Merah" : "Biru";
  const now = Date.now();

  // Find the most recent log item in activeMatch.logs in the current round for this fighter
  // that was registered by this juryId
  const logIndex = activeMatch.logs.findIndex(log => 
    log.round === r &&
    log.fighter === fighter &&
    (log.source === `Juri ${jId}` || (log.juryIds && log.juryIds.includes(jId)))
  );

  if (logIndex !== -1) {
    const log = activeMatch.logs[logIndex];
    const pointValue = log.points;

    // Revert consensus scores and stats if applicable
    if (log.juryIds && log.juryIds.includes(jId)) {
      log.juryIds.forEach(id => {
        if (activeMatch.juryScores[id] && activeMatch.juryScores[id][r]) {
          if (fighter === "RED") {
            activeMatch.juryScores[id][r].red = Math.max(0, activeMatch.juryScores[id][r].red - pointValue);
          } else {
            activeMatch.juryScores[id][r].blue = Math.max(0, activeMatch.juryScores[id][r].blue - pointValue);
          }
        }
      });

      // Revert Stats
      if (fighter === "RED") {
        if (log.type === "PUNCH") {
          activeMatch.redStats.punches = Math.max(0, activeMatch.redStats.punches - 1);
        } else {
          activeMatch.redStats.kicks = Math.max(0, activeMatch.redStats.kicks - 1);
        }
      } else {
        if (log.type === "PUNCH") {
          activeMatch.blueStats.punches = Math.max(0, activeMatch.blueStats.punches - 1);
        } else {
          activeMatch.blueStats.kicks = Math.max(0, activeMatch.blueStats.kicks - 1);
        }
      }

      // Add a system log informing the undo
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: r,
        fighter,
        description: `BATAL POIN: Poin ${log.type === "PUNCH" ? "Pukulan" : "Tendangan"} ${fLabel} dibatalkan oleh Juri ${jId}.`,
        points: -pointValue,
        source: `Juri ${jId}`,
        type: "SYSTEM"
      });
    }

    // Since we unshifted a cancel log above if consensus, we find the index again
    const finalLogIndex = activeMatch.logs.findIndex((l, idx) => idx >= (log.juryIds && log.juryIds.includes(jId) ? 1 : 0) && l.id === log.id);
    if (finalLogIndex !== -1) {
      activeMatch.logs.splice(finalLogIndex, 1);
    }

    recalculateScores();
    broadcastState();
  }

  res.json(activeMatch);
});

// Dewan / Chairperson Actions (Jatuhan, Kuncian, Penalties, Overrides & Verifikasi)
app.post("/api/dewan/action", (req, res) => {
  const { command, fighter, penaltyType, overridePoints } = req.body;
  const now = Date.now();
  const fLabel = fighter === "RED" ? "Merah" : "Biru";

  if (command === "PUNCH") {
    if (fighter === "RED") activeMatch.redStats.punches++;
    else activeMatch.blueStats.punches++;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `KOREKSI DEWAN (+1): Poin Pukulan untuk Pesilat Sudut ${fLabel}!`,
      points: 1,
      source: "Dewan Pertandingan",
      type: "PUNCH"
    });
  } 
  else if (command === "CANCEL_PUNCH") {
    if (fighter === "RED") {
      if (activeMatch.redStats.punches > 0) activeMatch.redStats.punches--;
    } else {
      if (activeMatch.blueStats.punches > 0) activeMatch.blueStats.punches--;
    }

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `KOREKSI DEWAN (-1): Poin Pukulan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
      points: -1,
      source: "Dewan Pertandingan",
      type: "PUNCH"
    });
  }
  else if (command === "KICK") {
    if (fighter === "RED") activeMatch.redStats.kicks++;
    else activeMatch.blueStats.kicks++;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `KOREKSI DEWAN (+2): Poin Tendangan untuk Pesilat Sudut ${fLabel}!`,
      points: 2,
      source: "Dewan Pertandingan",
      type: "KICK"
    });
  }
  else if (command === "CANCEL_KICK") {
    if (fighter === "RED") {
      if (activeMatch.redStats.kicks > 0) activeMatch.redStats.kicks--;
    } else {
      if (activeMatch.blueStats.kicks > 0) activeMatch.blueStats.kicks--;
    }

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `KOREKSI DEWAN (-2): Poin Tendangan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
      points: -2,
      source: "Dewan Pertandingan",
      type: "KICK"
    });
  }
  else if (command === "DROP") {
    // Direct Jatuhan +3 points
    if (fighter === "RED") activeMatch.redStats.drops++;
    else activeMatch.blueStats.drops++;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `SKOR JATUHAN: +3 Poin Jatuhan untuk Pesilat ${fighter === "RED" ? "Merah" : "Biru"}!`,
      points: 3,
      source: "Dewan Pertandingan",
      type: "DROP"
    });
  } 
  
  else if (command === "CANCEL_DROP") {
    if (fighter === "RED") {
      if (activeMatch.redStats.drops > 0) activeMatch.redStats.drops--;
    } else {
      if (activeMatch.blueStats.drops > 0) activeMatch.blueStats.drops--;
    }

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `BATAL JATUHAN: -3 Poin Jatuhan dibatalkan untuk Pesilat Sudut ${fLabel}!`,
      points: -3,
      source: "Dewan Pertandingan",
      type: "DROP"
    });
  } 
  
  else if (command === "LOCK") {
    // Direct Kuncian +3 points
    if (fighter === "RED") activeMatch.redStats.locks++;
    else activeMatch.blueStats.locks++;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `SKOR KUNCIAN: +3 Poin Kuncian untuk Pesilat ${fighter === "RED" ? "Merah" : "Biru"}!`,
      points: 3,
      source: "Dewan Pertandingan",
      type: "LOCK"
    });
  } 
  
  else if (command === "PENALTY") {
    const pTarget = fighter === "RED" ? activeMatch.redPenalties : activeMatch.bluePenalties;
    const cleanPenalty = (penaltyType || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    if (cleanPenalty === "binaan1") {
      pTarget.binaan1 = !pTarget.binaan1;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `BINAAN 1 ${pTarget.binaan1 ? "AKTIF" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.binaan1) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("BINAAN 1") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "binaan2") {
      pTarget.binaan2 = !pTarget.binaan2;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `BINAAN 2 ${pTarget.binaan2 ? "AKTIF" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.binaan2) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("BINAAN 2") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "teguran1") {
      pTarget.teguran1 = !pTarget.teguran1;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `TEGURAN 1 ${pTarget.teguran1 ? "AKTIF (-1)" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: pTarget.teguran1 ? -1 : 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.teguran1) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("TEGURAN 1") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "teguran2") {
      pTarget.teguran2 = !pTarget.teguran2;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `TEGURAN 2 ${pTarget.teguran2 ? "AKTIF (-2)" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: pTarget.teguran2 ? -2 : 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.teguran2) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("TEGURAN 2") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "peringatan1") {
      pTarget.peringatan1 = !pTarget.peringatan1;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `PERINGATAN 1 ${pTarget.peringatan1 ? "AKTIF (-5)" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: pTarget.peringatan1 ? -5 : 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.peringatan1) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("PERINGATAN 1") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "peringatan2") {
      pTarget.peringatan2 = !pTarget.peringatan2;
      activeMatch.logs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        round: activeMatch.activeRound,
        fighter,
        description: `PERINGATAN 2 ${pTarget.peringatan2 ? "AKTIF (-10)" : "DIBATALKAN"} untuk Pesilat Sudut ${fLabel}!`,
        points: pTarget.peringatan2 ? -10 : 0,
        source: "Dewan Pertandingan",
        type: "PENALTY"
      });
      if (!pTarget.peringatan2) {
        const origLog = activeMatch.logs.find(l => 
          l.fighter === fighter && 
          l.round === activeMatch.activeRound && 
          l.type === "PENALTY" && 
          l.description && l.description.includes("PERINGATAN 2") && 
          l.description.includes("AKTIF") &&
          !l.uncounted
        );
        if (origLog) origLog.uncounted = true;
      }
    } 
    
    else if (cleanPenalty === "disqualified" || cleanPenalty === "diskualifikasi") {
      pTarget.disqualified = !pTarget.disqualified;
      if (pTarget.disqualified) {
        processMatchFinish();
      } else {
        activeMatch.status = MatchStatus.PAUSED;
        activeMatch.logs.unshift({
          id: Math.random().toString(36).substring(7),
          timestamp: now,
          round: activeMatch.activeRound,
          fighter,
          description: `DISKUALIFIKASI DIBATALKAN untuk Pesilat Sudut ${fLabel}!`,
          points: 0,
          source: "Dewan Pertandingan",
          type: "PENALTY"
        });
      }
    }
  } 
  
  else if (command === "OVERRIDE" && overridePoints !== undefined) {
    const val = Number(overridePoints);
    if (fighter === "RED") {
      activeMatch.redStats.overrides = (activeMatch.redStats.overrides || 0) + val;
      activeMatch.scoreRed = activeMatch.scoreRed + val;
    } else {
      activeMatch.blueStats.overrides = (activeMatch.blueStats.overrides || 0) + val;
      activeMatch.scoreBlue = activeMatch.scoreBlue + val;
    }

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter,
      description: `KOREKSI NILAI PEMBINA: ${val > 0 ? "+" : ""}${val} nilai Sudut ${fLabel}.`,
      points: val,
      source: "Dewan/Ketua Pertandingan",
      type: "SYSTEM"
    });
  }

  else if (command === "RESET_ROUND_PENALTIES") {
    endCurrentRoundPenalties();
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter: "RED",
      description: `HUKUMAN DIARSIPKAN (IPSI 2026): Teguran babak ini diarsipkan ke akumulasi pengurangan poin.`,
      points: 0,
      source: "Sekretaris Pertandingan",
      type: "SYSTEM"
    });
  }
  
  else if (command === "DECLARE_VICTORY") {
    recalculateScores();

    // Pastikan pemenang sesuai dengan nilai aktual terbaru setelah 'Cek Nilai' oleh Dewan
    let finalWinner: "RED" | "BLUE" = fighter;
    let finalMethod = penaltyType || "MENANG ANGKA / MUTLAK";

    if (activeMatch.redPenalties?.disqualified && !activeMatch.bluePenalties?.disqualified) {
      finalWinner = "BLUE";
      finalMethod = "DISKUALIFIKASI LAWAN (SUDUT MERAH)";
    } else if (activeMatch.bluePenalties?.disqualified && !activeMatch.redPenalties?.disqualified) {
      finalWinner = "RED";
      finalMethod = "DISKUALIFIKASI LAWAN (SUDUT BIRU)";
    } else if (activeMatch.scoreRed > activeMatch.scoreBlue) {
      finalWinner = "RED";
      const diff = activeMatch.scoreRed - activeMatch.scoreBlue;
      finalMethod = diff >= 30 ? "MENANG SELISIH 30 ANGKA (WMP)" : "MENANG ANGKA / MUTLAK";
    } else if (activeMatch.scoreBlue > activeMatch.scoreRed) {
      finalWinner = "BLUE";
      const diff = activeMatch.scoreBlue - activeMatch.scoreRed;
      finalMethod = diff >= 30 ? "MENANG SELISIH 30 ANGKA (WMP)" : "MENANG ANGKA / MUTLAK";
    }

    const fWinnerName = finalWinner === "RED" ? activeMatch.fighterRedName : activeMatch.fighterBlueName;
    const finalLabel = finalWinner === "RED" ? "Merah" : "Biru";

    activeMatch.status = MatchStatus.FINISHED;
    activeMatch.winnerPublished = true;
    activeMatch.winnerColor = finalWinner;
    activeMatch.winnerMethod = finalMethod;
    activeMatch.dewanPanelLocked = true;
    activeMatch.juryPanelLocked = true;

    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      round: activeMatch.activeRound,
      fighter: finalWinner,
      description: `PERTANDINGAN SELESAI! PEMENANG RESMI: ${fWinnerName || "PESILAT"} Sudut ${finalLabel} (${activeMatch.winnerMethod})`,
      points: 0,
      source: "Dewan Pertandingan",
      type: "SYSTEM"
    });

    const actualId = activeMatch.id.startsWith("match-") ? activeMatch.id.replace("match-", "") : activeMatch.id;
    let currentIdx = matchesSchedule.findIndex(m => m.id === actualId || m.matchNumber === activeMatch.matchNumber);
    if (currentIdx !== -1) {
      matchesSchedule[currentIdx].status = "SELESAI" as any;
      matchesSchedule[currentIdx].winner = finalWinner === "RED" ? "MERAH" : "BIRU";
      matchesSchedule[currentIdx].scoreRed = activeMatch.scoreRed;
      matchesSchedule[currentIdx].scoreBlue = activeMatch.scoreBlue;
      matchesSchedule[currentIdx].redStats = activeMatch.redStats ? { ...activeMatch.redStats } : undefined;
      matchesSchedule[currentIdx].blueStats = activeMatch.blueStats ? { ...activeMatch.blueStats } : undefined;
      matchesSchedule[currentIdx].fighterRedName = activeMatch.fighterRedName;
      matchesSchedule[currentIdx].fighterBlueName = activeMatch.fighterBlueName;
      matchesSchedule[currentIdx].fighterRedClub = activeMatch.fighterRedClub;
      matchesSchedule[currentIdx].fighterBlueClub = activeMatch.fighterBlueClub;
      matchesSchedule[currentIdx].classCategory = activeMatch.classCategory;
      matchesSchedule[currentIdx].juryPressStats = compileJuryPressStats(activeMatch.logs);
      activeMatch.juryPressStats = { ...matchesSchedule[currentIdx].juryPressStats };
      saveTournamentData();
      archiveCompletedMatch(matchesSchedule[currentIdx]);
    } else {
      // Archive standalone match into tournament schedule
      const newArchived: any = {
        id: actualId || "match-" + Date.now(),
        matchNumber: activeMatch.matchNumber || "Partai 1",
        stage: (activeMatch.stage as any) || "PENYISIHAN",
        gender: (activeMatch.gender as any) || "PUTRA",
        status: "SELESAI" as any,
        winner: finalWinner === "RED" ? "MERAH" : "BIRU",
        scoreRed: activeMatch.scoreRed,
        scoreBlue: activeMatch.scoreBlue,
        redStats: activeMatch.redStats ? { ...activeMatch.redStats } : undefined,
        blueStats: activeMatch.blueStats ? { ...activeMatch.blueStats } : undefined,
        fighterRedName: activeMatch.fighterRedName,
        fighterBlueName: activeMatch.fighterBlueName,
        fighterRedClub: activeMatch.fighterRedClub,
        fighterBlueClub: activeMatch.fighterBlueClub,
        classCategory: activeMatch.classCategory,
        division: activeMatch.division || "DEWASA",
        juryPressStats: compileJuryPressStats(activeMatch.logs),
        logs: JSON.parse(JSON.stringify(activeMatch.logs || []))
      };
      matchesSchedule.push(newArchived);
      saveTournamentData();
      archiveCompletedMatch(newArchived);
    }

    // Broadcast winner announcement immediately to monitor and all panels
    broadcastState();

    // Selebrasi kemenangan di layar monitor selama tepat 20 detik, lalu otomatis persiapkan partai selanjutnya
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    autoAdvanceTimer = setTimeout(() => {
      if (activeMatch.status === MatchStatus.FINISHED && activeMatch.winnerPublished) {
        console.log("OTOMATIS BERALIH (20 DETIK): Selebrasi selesai. Mempersiapkan data partai selanjutnya...");
        loadNextMatch();
        broadcastState();
      }
    }, 20000);
  }

  recalculateScores();
  res.json(activeMatch);
});

// Skip 20-second victory celebration and immediately load next match from queue
app.post("/api/match-state/skip-celebration", (req, res) => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  loadNextMatch();
  broadcastState();
  res.json({ message: "Selebrasi dilewati, partai berikutnya berhasil dimuat.", activeMatch });
});

// Real-time "Verifikasi" endpoints
app.post("/api/match-state/verify/start", (req, res) => {
  const { type, corner, reason } = req.body; // "JATUHAN" | "PELANGGARAN", corner?: "RED" | "BLUE"
  
  activeMatch.verification = {
    active: true,
    type,
    corner: corner || null,
    reason: reason || "",
    votes: { 1: null, 2: null, 3: null },
    result: null,
    applied: false,
    timestamp: Date.now()
  };

  activeMatch.logs.unshift({
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    round: activeMatch.activeRound,
    fighter: corner || "RED",
    description: `DEWAN MEMINTA VERIFIKASI: 【${type}】${corner ? ` Sudut ${corner === "RED" ? "Merah" : "Biru"}` : ""}. Menunggu vote J1, J2, J3.`,
    points: 0,
    source: "Dewan Pertandingan",
    type: "SYSTEM"
  });

  broadcastState();
  res.json(activeMatch);
});

app.post("/api/match-state/verify/vote", (req, res) => {
  const { juryId, vote } = req.body; // juryId: 1|2|3, vote: "MERAH" | "BIRU" | "TIDAK SAH"
  
  if (!activeMatch.verification || !activeMatch.verification.active) {
    return res.status(400).json({ error: "Sesi verifikasi tidak sedang aktif!" });
  }

  activeMatch.verification.votes[Number(juryId)] = vote;

  const votedScores = Object.values(activeMatch.verification.votes);
  const totalVotes = votedScores.filter(v => v !== null).length;

  const tallies = { MERAH: 0, BIRU: 0, "TIDAK SAH": 0 };
  votedScores.forEach(v => {
    if (v && (tallies as any)[v] !== undefined) (tallies as any)[v]++;
  });

  let reachedMajority: "MERAH" | "BIRU" | "TIDAK SAH" | null = null;
  if (tallies.MERAH >= 2) reachedMajority = "MERAH";
  else if (tallies.BIRU >= 2) reachedMajority = "BIRU";
  else if (tallies["TIDAK SAH"] >= 2) reachedMajority = "TIDAK SAH";
  else if (totalVotes === 3) reachedMajority = "TIDAK SAH"; // tie/split

  if (reachedMajority) {
    activeMatch.verification.result = reachedMajority;
  }

  broadcastState();
  res.json(activeMatch);
});

app.post("/api/match-state/verify/apply", (req, res) => {
  const { result } = req.body; // optional manual override from dewan
  if (!activeMatch.verification) {
    return res.status(400).json({ error: "Tidak ada data verifikasi aktif!" });
  }

  const finalDecision = result || activeMatch.verification.result || "TIDAK SAH";
  activeMatch.verification.result = finalDecision;
  activeMatch.verification.active = false;
  activeMatch.verification.applied = true;

  if (activeMatch.verification.type === "JATUHAN" && finalDecision !== "TIDAK SAH") {
    // Sesuai perintah: Nilai consensus jatuhan dari juri sah TIDAK OTOMATIS menambahkan nilai jatuhan.
    // Nilai jatuhan diinput/ditambahkan secara manual oleh Dewan untuk menghindari double nilai jatuhan.
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: finalDecision === "MERAH" ? "RED" : "BLUE",
      description: `VERIFIKASI RESMI: KEPUTUSAN JATUHAN SAH untuk Sudut ${finalDecision === "MERAH" ? "Merah" : "Biru"} (Nilai jatuhan diinput secara manual oleh Dewan).`,
      points: 0,
      source: "Verifikasi Dewan (VAR)",
      type: "DROP"
    });
    recalculateScores();
  } else {
    activeMatch.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      round: activeMatch.activeRound,
      fighter: "RED",
      description: `HASIL VERIFIKASI: Keputusan resmi adalah 【${
        finalDecision === "TIDAK SAH" ? "TIDAK SAH" : `${activeMatch.verification.type} SAH untuk ${finalDecision}`
      }】 (Aksi nilai/hukuman dilakukan manual oleh Dewan)!`,
      points: 0,
      source: "Sistem Verifikasi Juri",
      type: "SYSTEM"
    });
  }

  broadcastState();
  res.json(activeMatch);
});

app.post("/api/match-state/verify/reset", (req, res) => {
  activeMatch.verification = undefined;
  broadcastState();
  res.json(activeMatch);
});

// ==========================================
// IPSI REGISTRATION & MATCH SCHEDULE MODULE
// ==========================================

let categories: any[] = [];

let participants: any[] = [];

interface ScheduleMatch {
  id: string;
  matchNumber: string;
  stage: string;
  categoryClassId?: string;
  fighterRedId?: string;
  fighterBlueId?: string;
  arena?: string;
  gender: string;
  status: "BELUM" | "SEDANG" | "SELESAI";
  winner?: "MERAH" | "BIRU";
  scoreRed?: number;
  scoreBlue?: number;
  redStats?: any;
  blueStats?: any;
  fighterRedName?: string;
  fighterBlueName?: string;
  fighterRedClub?: string;
  fighterBlueClub?: string;
  classCategory?: string;
  division?: string;
  juryPressStats?: any;
  logs?: MatchLog[];
}

let matchesSchedule: ScheduleMatch[] = [];

export function saveTournamentData() {
  try {
    const filePath = getTournamentFilePath();
    const payload = JSON.stringify({
      categories,
      participants,
      matchesSchedule,
      lastUpdated: Date.now()
    }, null, 2);
    fs.writeFileSync(filePath, payload, "utf8");
  } catch (err) {
    console.error("[TOURNAMENT_SAVE] Gagal menyimpan data turnamen ke file:", err);
  }
}

export function loadTournamentData() {
  try {
    const filePath = getTournamentFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      if (data && data.trim().length > 0) {
        const parsed = JSON.parse(data);
        if (parsed) {
          if (Array.isArray(parsed.categories)) categories = parsed.categories;
          if (Array.isArray(parsed.participants)) participants = parsed.participants;
          if (Array.isArray(parsed.matchesSchedule)) matchesSchedule = parsed.matchesSchedule;
          console.log(`[TOURNAMENT_LOAD] Memulihkan data event: ${categories.length} kategori, ${participants.length} peserta, ${matchesSchedule.length} partai jadwal dari disk (${filePath})`);
        }
      }
    }
  } catch (err) {
    console.error("[TOURNAMENT_LOAD] Gagal memuat data turnamen dari disk:", err);
  }
}

export function archiveCompletedMatch(match: any) {
  if (!match) return;
  try {
    const archiveDir = getArchiveDir();
    const matchNo = (match.matchNumber || "partai").toString().replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `partai_${matchNo}_${Date.now()}.json`;
    const fullPath = path.join(archiveDir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(match, null, 2), "utf8");

    // Maintain riwayat_event.json in the arsip folder
    const summaryFile = path.join(archiveDir, "riwayat_event.json");
    let summary: any[] = [];
    if (fs.existsSync(summaryFile)) {
      try {
        const raw = fs.readFileSync(summaryFile, "utf8");
        summary = JSON.parse(raw);
        if (!Array.isArray(summary)) summary = [];
      } catch (e) {
        summary = [];
      }
    }
    const idx = summary.findIndex((m: any) => m && (m.id === match.id || m.matchNumber === match.matchNumber));
    if (idx >= 0) {
      summary[idx] = match;
    } else {
      summary.push(match);
    }
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf8");
    console.log(`[ARSIP] Berhasil menyimpan riwayat partai: ${filename} ke ${archiveDir}`);
  } catch (err) {
    console.error("[ARSIP] Gagal menyimpan arsip riwayat pertandingan:", err);
  }
}

// -- Categories API
app.get("/api/categories", (req, res) => {
  res.json(categories);
});

app.post("/api/categories", (req, res) => {
  const { id, name, minWeight, maxWeight, division } = req.body;
  if (!name) return res.status(400).json({ error: "Nama kategori tidak boleh kosong" });

  if (id) {
    categories = categories.map(c => c.id === id ? { id, name, minWeight: Number(minWeight), maxWeight: Number(maxWeight), division } : c);
    saveTournamentData();
    res.json({ message: "Kategori berhasil diperbarui", categories });
  } else {
    const newCategory = {
      id: "cat-" + Date.now(),
      name,
      minWeight: Number(minWeight) || 0,
      maxWeight: Number(maxWeight) || 100,
      division: division || "Dewasa"
    };
    categories.push(newCategory);
    saveTournamentData();
    res.json({ message: "Kategori berhasil ditambahkan", categories });
  }
});

app.delete("/api/categories/:id", (req, res) => {
  categories = categories.filter(c => c.id !== req.params.id);
  saveTournamentData();
  res.json({ message: "Kategori berhasil dihapus", categories });
});

// -- Participants API
app.get("/api/participants", (req, res) => {
  res.json(participants);
});

app.post("/api/participants", (req, res) => {
  const { id, name, club, gender, categoryClassId, weight } = req.body;
  if (!name || !club || !categoryClassId) {
    return res.status(400).json({ error: "Kolom nama, kontingen, dan kelas wajib diisi" });
  }

  if (id) {
    participants = participants.map(p => p.id === id ? { id, name: name.toUpperCase(), club: club.toUpperCase(), gender, categoryClassId, weight: Number(weight) || 0 } : p);
    saveTournamentData();
    res.json({ message: "Peserta berhasil diperbarui", participants });
  } else {
    const newParticipant = {
      id: "p-" + Date.now(),
      name: name.toUpperCase(),
      club: club.toUpperCase(),
      gender: gender || "PUTRA",
      categoryClassId,
      weight: Number(weight) || 0
    };
    participants.push(newParticipant);
    saveTournamentData();
    res.json({ message: "Peserta berhasil ditambahkan", participants });
  }
});

app.delete("/api/participants/:id", (req, res) => {
  participants = participants.filter(p => p.id !== req.params.id);
  saveTournamentData();
  res.json({ message: "Peserta berhasil dihapus", participants });
});

// -- Backup & Restore JSON API
app.get("/api/backup/export", (req, res) => {
  res.json({
    app: "JRZ_SCORE_IPSI_2026",
    version: "3.2.0",
    backupDate: new Date().toISOString(),
    timestamp: Date.now(),
    categories,
    participants,
    matchesSchedule,
    activeMatch
  });
});

app.post("/api/backup/import", (req, res) => {
  const { categories: newCats, participants: newParts, matchesSchedule: newMatches, activeMatch: newActive, mode } = req.body || {};

  if (mode === "merge") {
    if (Array.isArray(newParts)) {
      const partMap = new Map<string, any>();
      participants.forEach(p => partMap.set(p.id || p.name, p));
      newParts.forEach((p, idx) => {
        const id = p.id || `p-${Date.now()}-${idx}`;
        partMap.set(id, { ...p, id });
      });
      participants = Array.from(partMap.values());
    }

    if (Array.isArray(newMatches)) {
      const matchMap = new Map<string, any>();
      matchesSchedule.forEach(m => matchMap.set(m.id || `m-${m.matchNumber}`, m));
      newMatches.forEach((m, idx) => {
        const id = m.id || `m-${Date.now()}-${idx}`;
        matchMap.set(id, { ...m, id });
      });
      matchesSchedule = Array.from(matchMap.values());
    }

    if (Array.isArray(newCats)) {
      const catMap = new Map<string, any>();
      categories.forEach(c => catMap.set(c.id || c.name, c));
      newCats.forEach((c, idx) => {
        const id = c.id || `cat-${Date.now()}-${idx}`;
        catMap.set(id, { ...c, id });
      });
      categories = Array.from(catMap.values());
    }
  } else {
    if (Array.isArray(newParts)) participants = newParts;
    if (Array.isArray(newMatches)) matchesSchedule = newMatches;
    if (Array.isArray(newCats)) categories = newCats;
    if (newActive && newActive.id) {
      activeMatch = { ...activeMatch, ...newActive };
    }
  }

  saveTournamentData();
  broadcastState();

  res.json({
    success: true,
    message: "Cadangan data atlet & pertandingan berhasil dipulihkan di server!",
    totalParticipants: participants.length,
    totalMatches: matchesSchedule.length,
    totalCategories: categories.length
  });
});

// -- Match Schedules API
app.get("/api/matches-schedule", (req, res) => {
  res.json(matchesSchedule);
});

app.post("/api/matches-schedule", (req, res) => {
  const { id, matchNumber, stage, categoryClassId, fighterRedId, fighterBlueId, arena, gender, status } = req.body;
  if (!matchNumber || !categoryClassId || !fighterRedId || !fighterBlueId) {
    return res.status(400).json({ error: "Seluruh kolom partai wajib diisi lengkap!" });
  }

  const payload = {
    id: id || "m-" + Date.now(),
    matchNumber,
    stage: stage || "PENYISIHAN",
    categoryClassId,
    fighterRedId,
    fighterBlueId,
    arena: arena || "Gelanggang A",
    gender: gender || "PUTRA",
    status: status || "BELUM"
  };

  if (id) {
    matchesSchedule = matchesSchedule.map(m => m.id === id ? payload : m);
    saveTournamentData();
    res.json({ message: "Jadwal Pertandingan berhasil diperbarui", matchesSchedule });
  } else {
    matchesSchedule.push(payload);
    saveTournamentData();
    res.json({ message: "Jadwal Pertandingan berhasil didaftarkan", matchesSchedule });
  }
});

app.delete("/api/matches-schedule/:id", (req, res) => {
  matchesSchedule = matchesSchedule.filter(m => m.id !== req.params.id);
  saveTournamentData();
  res.json({ message: "Jadwal Pertandingan berhasil dihapus", matchesSchedule });
});

// -- Real-Time Athlete Registration & Schedule Auto-Generator API
app.post("/api/athletes/sync-one", (req, res) => {
  const { athlete } = req.body;
  if (!athlete || !athlete.name) {
    return res.status(400).json({ error: "Data atlet tidak valid" });
  }

  const athleteName = athlete.name.trim().toUpperCase();
  const athleteClub = (athlete.contingent || athlete.schoolOrClub || "KONTINGEN UMUM").trim().toUpperCase();
  const gender = athlete.gender === "PUTRI" ? "PUTRI" : "PUTRA";
  const category = athlete.category || "TANDING";
  const athleteId = athlete.id || "atl-" + Date.now();

  if (category === "TANDING") {
    // 1. Resolve or create category class
    let categoryName = "Kelas Bebas";
    let minW = 0;
    let maxW = 100;
    const classCat = athlete.classCategory || "";
    const matchClass = classCat.match(/Kelas\s+([A-Za-z0-9]+)/i);
    if (matchClass && matchClass[1]) {
      categoryName = `Kelas ${matchClass[1].toUpperCase()}`;
    } else if (athlete.weightTarget) {
      categoryName = `Kelas ${athlete.weightTarget}kg`;
    }

    const weightMatch = classCat.match(/\((\d+)\s*[-–]\s*(\d+)\s*kg\)/i);
    if (weightMatch) {
      minW = parseInt(weightMatch[1]);
      maxW = parseInt(weightMatch[2]);
    } else if (athlete.weightTarget) {
      minW = Math.max(0, Math.floor(athlete.weightTarget - 2.5));
      maxW = Math.ceil(athlete.weightTarget + 2.5);
    }

    let catClassId = "cat-kelas-a";
    if (athlete.categoryClassId) {
      catClassId = athlete.categoryClassId;
    } else if (matchClass && matchClass[1]) {
      catClassId = `cat-kelas-${matchClass[1].toLowerCase()}`;
    }

    let targetCat = categories.find(c => c.id === catClassId || c.name.toLowerCase() === categoryName.toLowerCase());
    if (!targetCat) {
      targetCat = {
        id: catClassId,
        name: categoryName,
        minWeight: minW,
        maxWeight: maxW,
        division: athlete.ageCategory || "Dewasa"
      };
      categories.push(targetCat);
    } else {
      targetCat.id = catClassId;
    }

    // 2. Register participant
    const existingPIdx = participants.findIndex(p => p.id === athleteId);
    const participantObj = {
      id: athleteId,
      name: athleteName,
      club: athleteClub,
      gender,
      categoryClassId: targetCat.id,
      weight: athlete.weightTarget || athlete.actualWeight || 0
    };

    if (existingPIdx >= 0) {
      participants[existingPIdx] = participantObj;
    } else {
      participants.push(participantObj);
    }

    // 3. Auto-pair or create schedule match
    // Check if there is an existing match waiting for blue corner in the same category & gender
    let matchedSlot = matchesSchedule.find(m => 
      m.categoryClassId === targetCat?.id && 
      m.gender === gender && 
      m.status === "BELUM" &&
      (!m.fighterBlueId || m.fighterBlueId === "KOSONG" || m.fighterBlueId.startsWith("placeholder-")) &&
      m.fighterRedId !== athleteId
    );

    let affectedMatch: ScheduleMatch | null = null;

    if (matchedSlot) {
      matchedSlot.fighterBlueId = athleteId;
      matchedSlot.fighterBlueName = athleteName;
      matchedSlot.fighterBlueClub = athleteClub;
      affectedMatch = matchedSlot;
    } else {
      // Check if athlete is already assigned to a match
      const alreadyInMatch = matchesSchedule.find(m => m.fighterRedId === athleteId || m.fighterBlueId === athleteId);
      if (!alreadyInMatch) {
        const nextPartaiNum = matchesSchedule.length + 1;
        const partaiStr = `Partai ${nextPartaiNum < 10 ? "0" + nextPartaiNum : nextPartaiNum}`;
        const newMatch: ScheduleMatch = {
          id: "m-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          matchNumber: partaiStr,
          stage: "PENYISIHAN",
          categoryClassId: targetCat.id,
          fighterRedId: athleteId,
          fighterRedName: athleteName,
          fighterRedClub: athleteClub,
          fighterBlueId: "KOSONG",
          fighterBlueName: "MENUNGGU LAWAN",
          fighterBlueClub: "-",
          arena: athlete.arena || "Gelanggang A",
          gender,
          status: "BELUM",
          classCategory: athlete.classCategory || `Tanding ${categoryName} ${gender === "PUTRI" ? "Putri" : "Putra"}`
        };
        matchesSchedule.push(newMatch);
        affectedMatch = newMatch;
      }
    }

    // If activeMatch is empty or placeholder, automatically seed with first real match
    if (matchesSchedule.length === 1 && (activeMatch.id === "match-none" || activeMatch.fighterRedName === "PESILAT MERAH")) {
      loadAndActivateMatch(matchesSchedule[0].id);
    }

    broadcastState();

    return res.json({
      success: true,
      message: `Atlet ${athleteName} berhasil disinkronkan ke Panel Skoring & Jadwal Partai!`,
      participant: participantObj,
      category: targetCat,
      affectedMatch,
      matchesSchedule,
      participants,
      categories
    });
  } else {
    // SENI category
    return res.json({
      success: true,
      message: `Atlet seni ${athleteName} berhasil didaftarkan ke antrean skoring seni!`,
      athleteId,
      category: "SENI"
    });
  }
});

// -- Delete Single Athlete API
app.delete("/api/athletes/:id", (req, res) => {
  const athleteId = req.params.id;
  participants = participants.filter(p => p.id !== athleteId && p.id !== `p-${athleteId}`);

  // Re-evaluate matchesSchedule
  matchesSchedule = matchesSchedule.filter(m => {
    // If match was solely this athlete against empty slot, remove it completely
    if (m.fighterRedId === athleteId && (!m.fighterBlueId || m.fighterBlueId === "KOSONG" || m.fighterBlueId.startsWith("placeholder-"))) {
      return false;
    }
    if (m.fighterBlueId === athleteId && (!m.fighterRedId || m.fighterRedId === "KOSONG" || m.fighterRedId.startsWith("placeholder-"))) {
      return false;
    }

    // If athlete was on red side and blue has a fighter, vacate red side
    if (m.fighterRedId === athleteId) {
      m.fighterRedId = "KOSONG";
      m.fighterRedName = "MENUNGGU LAWAN";
      m.fighterRedClub = "-";
    }

    // If athlete was on blue side, vacate blue side
    if (m.fighterBlueId === athleteId) {
      m.fighterBlueId = "KOSONG";
      m.fighterBlueName = "MENUNGGU LAWAN";
      m.fighterBlueClub = "-";
    }

    return true;
  });

  // Re-number remaining matches
  matchesSchedule.forEach((m, idx) => {
    const num = idx + 1;
    m.matchNumber = `Partai ${num < 10 ? "0" + num : num}`;
  });

  // If activeMatch contains this athlete, reload next match or reset
  if (
    activeMatch.fighterRedName?.toUpperCase().includes(athleteId) || 
    activeMatch.fighterBlueName?.toUpperCase().includes(athleteId) ||
    activeMatch.id === `match-${athleteId}`
  ) {
    if (matchesSchedule.length > 0) {
      loadAndActivateMatch(matchesSchedule[0].id);
    } else {
      activeMatch.id = "match-none";
      activeMatch.fighterRedName = "PESILAT MERAH";
      activeMatch.fighterRedClub = "CONTI MERAH";
      activeMatch.fighterBlueName = "PESILAT BIRU";
      activeMatch.fighterBlueClub = "CONTI BIRU";
      activeMatch.matchNumber = "Partai -";
      activeMatch.scoreRed = 0;
      activeMatch.scoreBlue = 0;
      activeMatch.status = MatchStatus.IDLE;
    }
  }

  saveTournamentData();
  broadcastState();

  res.json({
    success: true,
    message: `Atlet ${athleteId} berhasil dihapus dari sistem`,
    participants,
    matchesSchedule
  });
});

// -- Clear All Athletes & Associated Matches API
app.post("/api/athletes/clear-all", (req, res) => {
  participants = [];
  matchesSchedule = [];

  // Reset active match state completely
  activeMatch.id = "match-none";
  activeMatch.fighterRedName = "PESILAT MERAH";
  activeMatch.fighterRedClub = "CONTI MERAH";
  activeMatch.fighterBlueName = "PESILAT BIRU";
  activeMatch.fighterBlueClub = "CONTI BIRU";
  activeMatch.classCategory = "Tanding Kelas Bebas";
  activeMatch.matchNumber = "Partai -";
  activeMatch.scoreRed = 0;
  activeMatch.scoreBlue = 0;
  activeMatch.timeLeft = activeMatch.roundDuration;
  activeMatch.status = MatchStatus.IDLE;
  activeMatch.winnerPublished = false;
  activeMatch.winnerColor = null;
  activeMatch.winnerMethod = undefined;
  activeMatch.logs = [
    {
      id: "clear-" + Date.now(),
      timestamp: Date.now(),
      round: 1,
      fighter: "RED",
      description: "Seluruh database data atlet dan jadwal pertandingan telah dibersihkan secara bersih.",
      points: 0,
      source: "Sistem",
      type: "SYSTEM"
    }
  ];
  activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.redPenalties = {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  };
  activeMatch.bluePenalties = {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  };

  saveTournamentData();
  broadcastState();

  res.json({
    success: true,
    message: "Semua data atlet dan jadwal pertandingan berhasil dibersihkan!",
    participants: [],
    matchesSchedule: []
  });
});

// -- Bulk Tournament Import API (Atomic Save)
app.post("/api/tournament/import-batch", (req, res) => {
  const { newCategories, newParticipants, newMatches } = req.body;
  
  if (Array.isArray(newCategories)) {
    categories = newCategories;
  }
  if (Array.isArray(newParticipants)) {
    participants = newParticipants;
  }
  if (Array.isArray(newMatches)) {
    matchesSchedule = newMatches;
    if (newMatches.length > 0) {
      const activeMatchInNew = newMatches.find((m: any) => m && m.id === activeMatch.id);
      if (activeMatchInNew) {
        // Perbarui atribut partai aktif (nama atlet, kontingen, nomor partai) tanpa mengganggu skor berjalan
        if (activeMatchInNew.matchNumber) {
          activeMatch.matchNumber = `Partai ${String(activeMatchInNew.matchNumber).replace(/^(partai\s*)+/i, "")}`;
        }
        if (activeMatchInNew.arena) activeMatch.arena = activeMatchInNew.arena;
        if (activeMatchInNew.stage) activeMatch.stage = activeMatchInNew.stage;
        if (activeMatchInNew.classCategory) activeMatch.classCategory = activeMatchInNew.classCategory;
        if (activeMatchInNew.fighterRedName) activeMatch.fighterRedName = activeMatchInNew.fighterRedName;
        if (activeMatchInNew.fighterRedClub) activeMatch.fighterRedClub = activeMatchInNew.fighterRedClub;
        if (activeMatchInNew.fighterBlueName) activeMatch.fighterBlueName = activeMatchInNew.fighterBlueName;
        if (activeMatchInNew.fighterBlueClub) activeMatch.fighterBlueClub = activeMatchInNew.fighterBlueClub;
        broadcastState();
      } else if (activeMatch.id === "match-none" || !activeMatch.id) {
        loadAndActivateMatch(newMatches[0].id);
        broadcastState();
      }
    } else {
      // Reset the active match running state to a clean template since all matches are deleted
      activeMatch.id = "match-none";
      activeMatch.fighterRedName = "PESILAT MERAH";
      activeMatch.fighterRedClub = "CONTI MERAH";
      activeMatch.fighterBlueName = "PESILAT BIRU";
      activeMatch.fighterBlueClub = "CONTI BIRU";
      activeMatch.classCategory = "Tanding Kelas Bebas";
      activeMatch.matchNumber = "Partai -";
      activeMatch.scoreRed = 0;
      activeMatch.scoreBlue = 0;
      activeMatch.timeLeft = activeMatch.roundDuration;
      activeMatch.status = MatchStatus.IDLE;
      activeMatch.logs = [
        {
          id: "reset-" + Date.now(),
          timestamp: Date.now(),
          round: 1,
          fighter: "RED",
          description: "Database turnamen, peserta, dan jadwal resmi telah di-reset bersih.",
          points: 0,
          source: "Sistem",
          type: "SYSTEM"
        }
      ];
      
      activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
      activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
      activeMatch.secretarySignalNextRound = false;
      activeMatch.redPenalties = {
        binaan1: false,
        binaan2: false,
        teguran1: false,
        teguran2: false,
        peringatan1: false,
        peringatan2: false,
        disqualified: false
      };
      activeMatch.bluePenalties = {
        binaan1: false,
        binaan2: false,
        teguran1: false,
        teguran2: false,
        peringatan1: false,
        peringatan2: false,
        disqualified: false
      };
      broadcastState();
    }
  }
  
  saveTournamentData();

  res.json({
    message: "Data alur bagan turnamen berhasil disinkronkan ke server secara permanen!",
    categories,
    participants,
    matchesSchedule
  });
});

// -- Complete Tournament Database Reset API
app.post("/api/tournament/reset", (req, res) => {
  participants = [];
  matchesSchedule = [];
  // Keep categories intact during athlete reset so classes are preserved
  
  // Reset the active match running state to a clean template
  activeMatch.id = "match-none";
  activeMatch.fighterRedName = "PESILAT MERAH";
  activeMatch.fighterRedClub = "CONTI MERAH";
  activeMatch.fighterBlueName = "PESILAT BIRU";
  activeMatch.fighterBlueClub = "CONTI BIRU";
  activeMatch.classCategory = "Tanding Kelas Bebas";
  activeMatch.matchNumber = "Partai -";
  activeMatch.scoreRed = 0;
  activeMatch.scoreBlue = 0;
  activeMatch.timeLeft = activeMatch.roundDuration;
  activeMatch.status = MatchStatus.IDLE;
  activeMatch.logs = [
    {
      id: "reset-" + Date.now(),
      timestamp: Date.now(),
      round: 1,
      fighter: "RED",
      description: "Database turnamen, peserta, dan jadwal resmi telah di-reset bersih.",
      points: 0,
      source: "Sistem",
      type: "SYSTEM"
    }
  ];
  
  activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.secretarySignalNextRound = false;
  activeMatch.redPenalties = {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  };
  activeMatch.bluePenalties = {
    binaan1: false,
    binaan2: false,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    disqualified: false
  };
  
  saveTournamentData();
  broadcastState();
  
  res.json({
    message: "Data turnamen, atlit terdaftar, dan jadwal pertandingan IPSI berhasil di-reset bersih!",
    categories,
    participants,
    matchesSchedule,
    activeMatch
  });
});

// ==========================================
// EVENT ARCHIVE & RIWAYAT PERTANDINGAN APIS
// ==========================================

// Get information about data & archive locations and existing backup files
app.get("/api/archive/info", (req, res) => {
  const dataDir = getDataDir();
  const archiveDir = getArchiveDir();
  let files: string[] = [];
  try {
    if (fs.existsSync(archiveDir)) {
      files = fs.readdirSync(archiveDir);
    }
  } catch (e) {}

  res.json({
    dataDir,
    archiveDir,
    activeMatchFile: getActiveMatchFilePath(),
    tournamentFile: getTournamentFilePath(),
    archiveFiles: files
  });
});

// List all archived matches and saved event snapshots
app.get("/api/archive/events", (req, res) => {
  const archiveDir = getArchiveDir();
  try {
    const summaryFile = path.join(archiveDir, "riwayat_event.json");
    let completedMatches: any[] = [];
    if (fs.existsSync(summaryFile)) {
      try {
        completedMatches = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
      } catch (e) {
        completedMatches = [];
      }
    }
    const allFiles = fs.existsSync(archiveDir) ? fs.readdirSync(archiveDir).map(file => {
      try {
        const stat = fs.statSync(path.join(archiveDir, file));
        return {
          fileName: file,
          sizeBytes: stat.size,
          modifiedAt: stat.mtimeMs,
          isEventBackup: file.startsWith("event_") || file.endsWith(".json")
        };
      } catch (e) {
        return { fileName: file, sizeBytes: 0, modifiedAt: 0, isEventBackup: false };
      }
    }) : [];

    res.json({
      success: true,
      archiveDir,
      completedMatches,
      files: allFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save complete event snapshot to a portable archive file
app.post("/api/archive/save-event", (req, res) => {
  const { eventName } = req.body;
  const name = (eventName || "Event_IPSI").replace(/[^a-zA-Z0-9_-]/g, "_");
  const archiveDir = getArchiveDir();
  const filename = `event_${name}_${Date.now()}.json`;
  const filePath = path.join(archiveDir, filename);

  const archivePayload = {
    eventName: eventName || "Kejuaraan Pencak Silat IPSI",
    savedAt: new Date().toISOString(),
    categories,
    participants,
    matchesSchedule,
    activeMatch
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(archivePayload, null, 2), "utf8");
    res.json({
      success: true,
      message: `Arsip event berhasil disimpan di folder arsip aplikasi: ${filename}`,
      fileName: filename,
      filePath
    });
  } catch (err: any) {
    res.status(500).json({ error: "Gagal menyimpan arsip event: " + err.message });
  }
});

// Restore/reopen an event from an archive file
app.post("/api/archive/restore-event", (req, res) => {
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: "Nama berkas arsip wajib diisi!" });

  const archiveDir = getArchiveDir();
  const filePath = path.join(archiveDir, path.basename(fileName));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Berkas arsip tidak ditemukan di folder: " + archiveDir });
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.categories)) categories = parsed.categories;
    if (Array.isArray(parsed.participants)) participants = parsed.participants;
    if (Array.isArray(parsed.matchesSchedule)) matchesSchedule = parsed.matchesSchedule;
    if (parsed.activeMatch && parsed.activeMatch.id) activeMatch = parsed.activeMatch;

    saveTournamentData();
    broadcastState();

    res.json({
      success: true,
      message: `Arsip event "${fileName}" berhasil dibuka kembali dan dipulihkan!`,
      categories,
      participants,
      matchesSchedule,
      activeMatch
    });
  } catch (err: any) {
    res.status(500).json({ error: "Gagal memulihkan arsip event: " + err.message });
  }
});

// Clear all match history and archived match records from the server and disk
app.post("/api/archive/clear-history", (req, res) => {
  try {
    // 1. Kosongkan riwayat partai yang selesai di jadwal
    matchesSchedule = [];

    // 2. Hapus seluruh berkas rekapan arsip pertandingan di folder data/arsip
    const archiveDir = getArchiveDir();
    if (fs.existsSync(archiveDir)) {
      try {
        const files = fs.readdirSync(archiveDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(archiveDir, file));
          } catch (e) {}
        }
      } catch (e) {}
    }

    // 3. Reset pertandingan aktif ke keadaan bersih
    activeMatch.id = "match-none";
    activeMatch.matchNumber = "Partai -";
    activeMatch.fighterRedName = "PESILAT MERAH";
    activeMatch.fighterRedClub = "CONTI MERAH";
    activeMatch.fighterBlueName = "PESILAT BIRU";
    activeMatch.fighterBlueClub = "CONTI BIRU";
    activeMatch.scoreRed = 0;
    activeMatch.scoreBlue = 0;
    activeMatch.timeLeft = activeMatch.roundDuration;
    activeMatch.status = MatchStatus.IDLE;
    activeMatch.winnerPublished = false;
    activeMatch.winnerColor = null;
    activeMatch.winnerMethod = undefined;
    activeMatch.logs = [
      {
        id: "cleared-" + Date.now(),
        timestamp: Date.now(),
        round: 1,
        fighter: "RED",
        description: "Seluruh sejarah dan arsip data pertandingan telah dibersihkan secara bersih.",
        points: 0,
        source: "Sistem",
        type: "SYSTEM"
      }
    ];
    activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
    activeMatch.redPenalties = {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false
    };
    activeMatch.bluePenalties = {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false
    };

    saveTournamentData();
    try {
      fs.writeFileSync(getActiveMatchFilePath(), JSON.stringify(activeMatch, null, 2), "utf8");
    } catch (e) {}

    broadcastState();

    res.json({
      success: true,
      message: "Seluruh sejarah riwayat pertandingan dan berkas arsip berhasil dihapus bersih!",
      matchesSchedule: [],
      activeMatch
    });
  } catch (err: any) {
    res.status(500).json({ error: "Gagal menghapus sejarah pertandingan: " + err.message });
  }
});

// Helper to load and activate a match schedule
function loadAndActivateMatch(matchId: string | number) {
  const cleanId = String(matchId || "").trim();
  const rawId = cleanId.replace(/^match-/, "");
  const match = matchesSchedule.find(m => {
    if (!m) return false;
    const mIdStr = String(m.id || "").trim();
    const mIdRaw = mIdStr.replace(/^match-/, "");
    const mNumStr = String(m.matchNumber || "").trim().toLowerCase();
    const cleanNumStr = cleanId.toLowerCase();
    const rawNumStr = rawId.toLowerCase();
    return (
      mIdStr === cleanId ||
      mIdRaw === rawId ||
      mIdStr === rawId ||
      mIdRaw === cleanId ||
      mNumStr === cleanNumStr ||
      mNumStr === rawNumStr ||
      mNumStr.replace(/^(partai\s*)+/i, "").trim() === cleanNumStr.replace(/^(partai\s*)+/i, "").trim()
    );
  });
  if (!match) return false;

  const pRed = participants.find(p => p.id === match.fighterRedId);
  const pBlue = participants.find(p => p.id === match.fighterBlueId);
  const cat = categories.find(c => c.id === match.categoryClassId);

  // Load into activeMatch state
  activeMatch.id = "match-" + match.id;
  activeMatch.matchNumber = match.matchNumber ? (String(match.matchNumber).startsWith("Partai") ? match.matchNumber : `Partai ${match.matchNumber}`) : "Partai 1";
  activeMatch.stage = (match.stage as any) || "PENYISIHAN";
  activeMatch.gender = (match.gender as any) || "PUTRA";
  activeMatch.status = MatchStatus.IDLE;
  activeMatch.activeRound = 1;
  activeMatch.timeLeft = activeMatch.roundDuration || 120;
  if (match.arena) activeMatch.arena = match.arena;

  if (pRed) {
    activeMatch.fighterRedName = pRed.name;
    activeMatch.fighterRedClub = pRed.club;
  } else if (match.fighterRedName) {
    activeMatch.fighterRedName = match.fighterRedName;
    activeMatch.fighterRedClub = match.fighterRedClub || "CONTINGENT MERAH";
  } else {
    activeMatch.fighterRedName = "PESILAT MERAH";
    activeMatch.fighterRedClub = "CONTINGENT MERAH";
  }

  if (pBlue) {
    activeMatch.fighterBlueName = pBlue.name;
    activeMatch.fighterBlueClub = pBlue.club;
  } else if (match.fighterBlueName) {
    activeMatch.fighterBlueName = match.fighterBlueName;
    activeMatch.fighterBlueClub = match.fighterBlueClub || "CONTINGENT BIRU";
  } else {
    activeMatch.fighterBlueName = "PESILAT BIRU";
    activeMatch.fighterBlueClub = "CONTINGENT BIRU";
  }

  if (match.classCategory) {
    activeMatch.classCategory = match.classCategory;
    activeMatch.division = (cat && cat.division) || "DEWASA";
  } else if (cat) {
    activeMatch.classCategory = `Tanding ${cat.name} ${match.gender === "PUTRI" ? "Putri" : "Putra"} (${cat.minWeight}Kg - ${cat.maxWeight}Kg)`;
    activeMatch.division = cat.division || "DEWASA";
  } else {
    activeMatch.classCategory = "Tanding Bebas";
    activeMatch.division = "DEWASA";
  }

  // Set category accurately (TANDING or TGRS subcategories)
  const isTgrs = /tunggal|ganda|regu|solo|kreatif|seni/i.test(activeMatch.classCategory) && !/tanding/i.test(activeMatch.classCategory);
  if (isTgrs) {
    if (/tunggal/i.test(activeMatch.classCategory)) (activeMatch as any).kategori = "SENI TUNGGAL BAKU IPSI";
    else if (/ganda/i.test(activeMatch.classCategory)) (activeMatch as any).kategori = "SENI GANDA IPSI";
    else if (/regu/i.test(activeMatch.classCategory)) (activeMatch as any).kategori = "SENI REGU IPSI";
    else if (/solo|kreatif/i.test(activeMatch.classCategory)) (activeMatch as any).kategori = "SOLO KREATIF IPSI";
    (activeMatch as any).category = (activeMatch as any).kategori;
    (activeMatch as any).discipline = "SENI";
    (activeMatch as any).isJurusCategory = true;
    (activeMatch as any).isJurus = true;
    (activeMatch as any).isTgr = true;
    (activeMatch as any).isSeni = true;
    (activeMatch as any).isTanding = false;
  } else {
    (activeMatch as any).kategori = "TANDING";
    (activeMatch as any).category = "TANDING";
    (activeMatch as any).discipline = "TANDING";
    (activeMatch as any).isJurusCategory = false;
    (activeMatch as any).isJurus = false;
    (activeMatch as any).isTgr = false;
    (activeMatch as any).isSeni = false;
    (activeMatch as any).isTanding = true;
  }

  // Reset special 30-point gap tracking variables
  activeMatch.losingCornerNoScoreDuration = 0;
  activeMatch.losingCornerColor = null;
  activeMatch.lastLosingScore = undefined;

  // Clear score & stats resets for fresh match!
  activeMatch.scoreRed = 0;
  activeMatch.scoreBlue = 0;
  activeMatch.redStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.blueStats = { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 };
  activeMatch.redPenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
  activeMatch.bluePenalties = { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
  activeMatch.activeJuryPresses = { 1: null, 2: null, 3: null };
  activeMatch.juryScores = {
    1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
    2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
    3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
  };
  activeMatch.verification = undefined;
  activeMatch.showRoundOverPopup = false;
  activeMatch.showNextMatchPopup = false;
  activeMatch.secretarySignalNextRound = false;
  activeMatch.winnerPublished = false;
  activeMatch.winnerColor = null;
  activeMatch.winnerMethod = undefined;
  activeMatch.isTieExtendedPossible = false;
  activeMatch.juryPanelLocked = false;
  activeMatch.dewanPanelLocked = false;
  juryPressHistory = [];
  activeMatch.lastUpdatedAt = Date.now();
  activeMatch.stateVersion = (Number(activeMatch.stateVersion) || 0) + 1;
  activeMatch.logs = [
    {
      id: "active-" + Date.now(),
      timestamp: Date.now(),
      round: 1,
      fighter: "RED",
      description: `Partai ${match.matchNumber} (${activeMatch.classCategory}) diaktifkan dari database jadwal.`,
      points: 0,
      source: "Database Jadwal",
      type: "SYSTEM"
    }
  ];

  // Update original status inline
  matchesSchedule = matchesSchedule.map(m => m.id === match.id ? { ...m, status: "SEDANG" as any } : m);
  saveTournamentData();
  return true;
}

// -- Activate/Load Match to Active State Panel
app.post("/api/matches-schedule/load", (req, res) => {
  const { matchId } = req.body;
  const success = loadAndActivateMatch(matchId);
  if (!success) return res.status(404).json({ error: "Partai pertandingan tidak ditemukan" });
  broadcastState();
  res.json({ success: true, message: "Sukses memuat partai pertandingan", activeMatch, matchesSchedule });
});

// Vite middleware flow for full stack reactivity
async function startServer() {
  // Load saved match state on startup to automatically resume previous matches
  try {
    const activeMatchPath = getActiveMatchFilePath();
    if (fs.existsSync(activeMatchPath)) {
      const savedData = fs.readFileSync(activeMatchPath, "utf8");
      if (savedData && savedData.trim().length > 0) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed && parsed.id) {
            // Sanitize bloated base64 logos from old cache
            if (parsed.logoLeft && typeof parsed.logoLeft === "string" && parsed.logoLeft.length > 500000) {
              parsed.logoLeft = "";
            }
            if (parsed.logoRight && typeof parsed.logoRight === "string" && parsed.logoRight.length > 500000) {
              parsed.logoRight = "";
            }
            activeMatch = parsed;
            console.log(`[RECOVERY] Memulihkan sisa waktu & status pertandingan sebelumnya dari file: Partai ${activeMatch.matchNumber}, Sisa Waktu: ${activeMatch.timeLeft} detik`);
            if (activeMatch.status === MatchStatus.RUNNING) {
              console.log("[RECOVERY] Pertandingan sebelumnya dalam status RUNNING. Otomatis melanjutkan penghitungan waktu!");
              checkRunningTimer();
            }
          }
        } catch (jsonErr) {
          console.warn("[RECOVERY] File status pertandingan sebelumnya korup atau tidak lengkap, mengabaikan pemulihan otomatis.");
        }
      }
    }
  } catch (err) {
    console.error("[RECOVERY] Gagal memulihkan status pertandingan sebelumnya dari disk:", err);
  }

  // Load saved tournament data (categories, participants, schedule matches)
  loadTournamentData();

  // Sync users with Cloud RTDB on startup and periodically (every 30s) for remote multi-laptop sync
  syncUsersWithCloudRtdb().catch(() => {});
  setInterval(() => {
    syncUsersWithCloudRtdb().catch(() => {});
  }, 30000);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), "dist");
    
    // In compiled dist/server.cjs context, __dirname is the 'dist' directory itself.
    const localDirHtml = path.join(__dirname, "index.html");
    const parentDirDistHtml = path.join(__dirname, "..", "dist", "index.html");

    if (fs.existsSync(localDirHtml)) {
      distPath = __dirname;
    } else if (fs.existsSync(parentDirDistHtml)) {
      distPath = path.join(__dirname, "..", "dist");
    } else if ((process as any).resourcesPath) {
      const resPath = (process as any).resourcesPath;
      const p1 = path.join(resPath, "app.asar", "dist");
      const p2 = path.join(resPath, "app", "dist");
      const p3 = path.join(resPath, "app.asar");
      const p4 = path.join(resPath, "app");
      
      if (fs.existsSync(path.join(p1, "index.html"))) {
        distPath = p1;
      } else if (fs.existsSync(path.join(p2, "index.html"))) {
        distPath = p2;
      } else if (fs.existsSync(path.join(p3, "index.html"))) {
        distPath = p3;
      } else if (fs.existsSync(path.join(p4, "index.html"))) {
        distPath = p4;
      }
    }
    
    console.log(`[DISCO IPSI ENGINE] Serving static client files from production path: ${distPath}`);
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pencak Silat IPSI Server is up & running on port ${PORT} (Standalone Localhost Server)`);
  });

  serverInstance.on("error", (err: any) => {
    console.error("[DISCO IPSI ENGINE] Express server encountered an error:", err);
    if (err.code === "EADDRINUSE") {
      console.error(`[DISCO IPSI ENGINE] Port ${PORT} is already in use on 0.0.0.0.`);
    }
    process.exit(1);
  });
}

startServer();
