/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo, useCallback, useReducer } from "react";
import { MatchState, FighterColor, ActionType, MatchStatus, AuthSession, UserAccount } from "../types";
import { sound } from "../utils/sound";
import { matchEngine } from "../utils/matchEngine";
import { createDefaultMatchState, normalizeMatchState, getSyncedNow, computeLiveTimeLeft } from "../utils/defaultMatchState";
import { authService } from "../services/authService";

// Dynamic code-splitting for heavy match panels to enable near-instant initial landing page loading
const ScoreboardView2 = React.lazy(() => import("./ScoreboardView2").then(m => ({ default: m.ScoreboardView2 })));
const DewanPanel = React.lazy(() => import("./DewanPanel").then(m => ({ default: m.DewanPanel })));
const JuryPanel = React.lazy(() => import("./JuryPanel").then(m => ({ default: m.JuryPanel })));
const SekretarisPanel = React.lazy(() => import("./SekretarisPanel").then(m => ({ default: m.SekretarisPanel })));
const OperatorPanel = React.lazy(() => import("./OperatorPanel").then(m => ({ default: m.OperatorPanel })));
const LaporanPanel = React.lazy(() => import("./LaporanPanel").then(m => ({ default: m.LaporanPanel })));

// TGRS (Tunggal, Ganda, Regu, Solo Kreatif) Jurus Components - Statically imported to guarantee zero dynamic fetch errors
import { TgrsJuryPad } from "./tgr/TgrsJuryPad";
import { TgrsGandaSoloJuryPad } from "./tgr/TgrsGandaSoloJuryPad";
import { TgrsDewanControl } from "./tgr/TgrsDewanControl";
import { TgrsGandaSoloDewanControl } from "./tgr/TgrsGandaSoloDewanControl";
import { TgrsMonitorDisplay } from "./tgr/TgrsMonitorDisplay";
import { TgrsTimerOperator } from "./tgr/TgrsTimerOperator";
import { SplashScreen } from "./SplashScreen";

import { detectMatchCategory, isTgrsCategory, isJurusCategory, getTgrsSubCategory, TgrsSubCategory } from "../utils/categoryHelper";
import { jurusDetectionService } from "../services/jurusDetectionService";
import { 
  validateAndSanitizeCategory, 
  MatchDiscipline, 
  TGRS_CATEGORIES, 
  TANDING_CLASSES 
} from "../utils/categoryValidation";
import { TgrsMatchState, loadTgrsLiveState, saveTgrsLiveState, createDefaultTgrsState, createDefaultPerformerState, DURASI_STANDAR_TGRS_DETIK, getTgrsLiveElapsed } from "../utils/tgrsScoringEngine";

import iconTimer from "../assets/images/icon_timer.png";
import iconLaporan from "../assets/images/icon_laporan.png";
import { FullScreenOverlay } from "./FullScreenOverlay";
import { PasswordAuthModal, REQUIRED_SYSTEM_PASSWORD } from "./PasswordAuthModal";
import { EventScopeModal } from "./EventScopeModal";
import { eventScopeManager } from "../services/eventScopeManager";
import { 
  Activity, 
  ShieldAlert, 
  Monitor, 
  UserCheck, 
  Play, 
  HelpCircle, 
  HardDrive, 
  Wifi,
  FileSpreadsheet,
  Award,
  Users,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  User,
  Shield,
  RefreshCw,
  Archive,
  AlertTriangle,
  RotateCcw,
  X,
  Unlock,
  Lock,
  PhoneCall,
  MessageCircle,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Tv,
  CheckCircle2,
  Database,
  Calendar,
  Clock,
  Trophy,
  FileText,
  Shuffle,
  Sparkles,
  Layers,
  Timer,
  Settings,
  Volume2,
  Sun,
  Moon,
  Download,
  Upload
} from "lucide-react";
import { rtdbScoringEngine } from "../services/rtdbScoringEngine";
import { saveMatchStateToFirebase, archiveMatchToFirebase, getActiveArena, setActiveArena, hasPendingCloudSync } from "../services/firebase";
import {
  exportTournamentBackupJson,
  parseAndValidateBackupFile,
  restoreTournamentBackupJson,
  TournamentBackupPayload
} from "../utils/backupRestoreHelper";

// Web Audio sound trigger helper
function playAppSound(freq = 600, duration = 0.1) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Suppress audio failure
  }
}

export type AppMode = 
  | "LANDING" 
  | "SIMULATOR" 
  | "SCOREBOARD" 
  | "DEWAN" 
  | "JURY1" 
  | "JURY2" 
  | "JURY3" 
  | "JURY4" 
  | "JURY5" 
  | "JURY6" 
  | "JURY7" 
  | "JURY8" 
  | "JURY9" 
  | "JURY10" 
  | "SEKRETARIS"
  | "OPERATOR"
  | "JADWAL"
  | "LOTING"
  | "LAPORAN"
  | "BRACKET";

// Helper to read initial mode from URL search parameters or saved UI session on unexpected refresh
function getInitialAppMode(): AppMode {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const rawMode = (params.get("mode") || params.get("role") || params.get("panel") || "").toUpperCase();
      if (rawMode.startsWith("JURY") || rawMode.startsWith("JURI")) {
        const num = parseInt(rawMode.replace(/\D/g, ""), 10);
        if (num >= 1 && num <= 10) return `JURY${num}` as AppMode;
        return "JURY1";
      }
      if (rawMode === "SCOREBOARD" || rawMode === "MONITOR" || rawMode === "SKOR") return "SCOREBOARD";
      if (rawMode === "DEWAN" || rawMode === "KETUA") return "DEWAN";
      if (rawMode === "SEKRETARIS" || rawMode === "SECRETARY") return "SEKRETARIS";
      if (rawMode === "OPERATOR" || rawMode === "TIMER") return "OPERATOR";
      if (rawMode === "JADWAL" || rawMode === "SCHEDULE") return "JADWAL";
      if (rawMode === "LOTING" || rawMode === "DRAW") return "LOTING";
      if (rawMode === "LAPORAN" || rawMode === "REPORT") return "LAPORAN";
      if (rawMode === "BRACKET" || rawMode === "BAGAN") return "BRACKET";
      if (rawMode === "SIMULATOR") return "SIMULATOR";

      // Selalu mulai di landing page ketika aplikasi dibuka / server dijalankan ulang tanpa query params
      try {
        window.localStorage.removeItem("ipsi_ui_session");
        window.sessionStorage?.removeItem("ipsi_ui_session");
      } catch {}
    } catch (e) {
      console.warn("Gagal membaca query params mode:", e);
    }
  }
  return "LANDING";
}

// Lightweight arena-styled suspense fallback
function PanelLoadingFallback() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] text-slate-300 p-6">
      <div className="w-9 h-9 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
      <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-300">
        Memuat Panel Pertandingan...
      </span>
    </div>
  );
}

interface MatchSimHubProps {
  initialMode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
  isMonitorOnly?: boolean;
  onBackToHome?: () => void;
  onLogout?: () => void;
}

// Unified Hub Reducer State for atomic Match & Category State Management
export interface HubMatchState {
  matchState: MatchState;
  tgrsState: TgrsMatchState;
  manualCategoryOverride: "TANDING" | "TGRS" | null;
}

export type HubMatchAction =
  | { type: "SET_MATCH_STATE"; payload: MatchState; clearOverride?: boolean }
  | { type: "UPDATE_MATCH_STATE"; updater: (prev: MatchState) => MatchState }
  | { type: "SET_TGRS_STATE"; payload: TgrsMatchState | ((prev: TgrsMatchState) => TgrsMatchState) }
  | { type: "SET_MANUAL_OVERRIDE"; override: "TANDING" | "TGRS" | null }
  | { type: "SWITCH_CATEGORY"; targetCategory: "TANDING" | "TGRS" }
  | { type: "RESET_MATCH"; cleanState: MatchState; cleanTgrs?: TgrsMatchState }
  | { type: "ACTIVATE_MATCH"; match: MatchState; tgrs?: TgrsMatchState };

function getInitialHubState(): HubMatchState {
  let initialMatch = createDefaultMatchState();
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("ipsi_match_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          initialMatch = normalizeMatchState(parsed);
        }
      } catch (e) {
        console.error("Gagal mengurai saved match state:", e);
      }
    }
  }

  const initialTgrs = loadTgrsLiveState();
  return {
    matchState: initialMatch,
    tgrsState: initialTgrs,
    manualCategoryOverride: null
  };
}

function hubMatchReducer(state: HubMatchState, action: HubMatchAction): HubMatchState {
  switch (action.type) {
    case "SET_MATCH_STATE": {
      const nextMatch = normalizeMatchState(action.payload);
      const isNewMatch = nextMatch.id !== state.matchState.id || nextMatch.matchNumber !== state.matchState.matchNumber;

      // Jika data pertandingan identik, jangan re-render / re-trigger state
      if (
        !isNewMatch &&
        nextMatch.stateVersion === state.matchState.stateVersion &&
        nextMatch.lastUpdatedAt === state.matchState.lastUpdatedAt &&
        nextMatch.scoreRed === state.matchState.scoreRed &&
        nextMatch.scoreBlue === state.matchState.scoreBlue &&
        nextMatch.status === state.matchState.status &&
        nextMatch.activeRound === state.matchState.activeRound &&
        nextMatch.timeLeft === state.matchState.timeLeft
      ) {
        return state;
      }

      const shouldClearOverride = action.clearOverride !== undefined ? action.clearOverride : isNewMatch;

      let nextTgrs = state.tgrsState;
      const isJurus = isJurusCategory(nextMatch);
      if (isJurus) {
        const subCat = getTgrsSubCategory(nextMatch);
        const cleanPartai = nextMatch.matchNumber
          ? String(nextMatch.matchNumber).replace(/[^0-9]/g, "") || nextTgrs.partai
          : nextTgrs.partai;
        const blueName = nextMatch.fighterBlueName || (nextMatch as any).athleteBlue?.name || nextTgrs.bluePerformer?.athleteName || "SUDUT BIRU";
        const blueClub = nextMatch.fighterBlueClub || (nextMatch as any).athleteBlue?.contingent || nextTgrs.bluePerformer?.contingent || "KONTINGEN BIRU";
        const redName = nextMatch.fighterRedName || (nextMatch as any).athleteRed?.name || nextTgrs.redPerformer?.athleteName || "SUDUT MERAH";
        const redClub = nextMatch.fighterRedClub || (nextMatch as any).athleteRed?.contingent || nextTgrs.redPerformer?.contingent || "KONTINGEN MERAH";
        const isCatChanged = nextTgrs.category !== subCat;

        // Hanya reset performer ke skor awal jika BENAR-BENAR partai baru dan belum ada performer
        const shouldResetBlue = (isNewMatch && isCatChanged) || !nextTgrs.bluePerformer;
        const shouldResetRed = (isNewMatch && isCatChanged) || !nextTgrs.redPerformer;

        nextTgrs = {
          ...nextTgrs,
          category: subCat,
          partai: cleanPartai,
          bluePerformer: shouldResetBlue
            ? createDefaultPerformerState("BLUE", subCat, blueName, blueClub)
            : { ...nextTgrs.bluePerformer, athleteName: blueName, contingent: blueClub },
          redPerformer: shouldResetRed
            ? createDefaultPerformerState("RED", subCat, redName, redClub)
            : { ...nextTgrs.redPerformer, athleteName: redName, contingent: redClub },
          athleteName: (nextTgrs.activeCorner || "BLUE") === "BLUE" ? blueName : redName,
          contingent: (nextTgrs.activeCorner || "BLUE") === "BLUE" ? blueClub : redClub,
          gender: (nextMatch.gender as any) || nextTgrs.gender,
          ageCategory: nextMatch.division || nextTgrs.ageCategory,
          stage: nextMatch.stage || nextTgrs.stage,
          judgesCount: nextMatch.judgesCount || nextTgrs.judgesCount || 10
        };
      }

      return {
        ...state,
        matchState: nextMatch,
        tgrsState: nextTgrs,
        manualCategoryOverride: shouldClearOverride ? null : state.manualCategoryOverride
      };
    }

    case "UPDATE_MATCH_STATE": {
      const nextMatch = action.updater(state.matchState);
      return {
        ...state,
        matchState: nextMatch
      };
    }

    case "SET_TGRS_STATE": {
      const nextTgrs = typeof action.payload === "function" ? action.payload(state.tgrsState) : action.payload;
      return {
        ...state,
        tgrsState: nextTgrs
      };
    }

    case "SET_MANUAL_OVERRIDE": {
      return {
        ...state,
        manualCategoryOverride: action.override
      };
    }

    case "SWITCH_CATEGORY": {
      const target = action.targetCategory;
      if (target === "TANDING") {
        const updatedMatch: MatchState = {
          ...state.matchState,
          kategori: "TANDING",
          category: "TANDING",
          discipline: "TANDING",
          classCategory: (state.matchState.classCategory && !isJurusCategory(state.matchState.classCategory))
            ? state.matchState.classCategory
            : "Tanding Bebas",
          isJurusCategory: false,
          isJurus: false,
          isTgr: false,
          isSeni: false,
          isTanding: true,
          roundCount: state.matchState.roundCount || 3,
          roundDuration: state.matchState.roundDuration || 120,
          timeLeft: state.matchState.status === "RUNNING" ? state.matchState.timeLeft : (state.matchState.roundDuration || 120)
        };
        const updatedTgrs: TgrsMatchState = {
          ...state.tgrsState,
          isTimerRunning: false,
          isTimer2Running: false
        };
        return {
          matchState: updatedMatch,
          tgrsState: updatedTgrs,
          manualCategoryOverride: "TANDING"
        };
      } else {
        // target === "TGRS"
        const subCat = state.tgrsState.category || "TUNGGAL";
        const updatedMatch: MatchState = {
          ...state.matchState,
          kategori: subCat,
          category: subCat,
          discipline: "SENI",
          classCategory: `Seni ${subCat}`,
          isJurusCategory: true,
          isJurus: true,
          isTgr: true,
          isSeni: true,
          isTanding: false,
          roundCount: 1,
          roundDuration: 180,
          timeLeft: state.matchState.status === "RUNNING" ? state.matchState.timeLeft : 180
        };
        return {
          matchState: updatedMatch,
          tgrsState: state.tgrsState,
          manualCategoryOverride: "TGRS"
        };
      }
    }

    case "RESET_MATCH": {
      return {
        matchState: action.cleanState,
        tgrsState: action.cleanTgrs || createDefaultTgrsState(),
        manualCategoryOverride: null
      };
    }

    case "ACTIVATE_MATCH": {
      const norm = normalizeMatchState(action.match);
      const isJurus = isJurusCategory(norm);
      let nextTgrs = action.tgrs || state.tgrsState;
      if (isJurus && !action.tgrs) {
        const subCat = getTgrsSubCategory(norm);
        const cleanPartai = norm.matchNumber ? String(norm.matchNumber).replace(/[^0-9]/g, "") || "1" : "1";
        const blueName = norm.fighterBlueName || (norm as any).athleteBlue?.name || "SUDUT BIRU";
        const blueClub = norm.fighterBlueClub || (norm as any).athleteBlue?.contingent || "KONTINGEN BIRU";
        const redName = norm.fighterRedName || (norm as any).athleteRed?.name || "SUDUT MERAH";
        const redClub = norm.fighterRedClub || (norm as any).athleteRed?.contingent || "KONTINGEN MERAH";
        nextTgrs = {
          ...nextTgrs,
          category: subCat,
          partai: cleanPartai,
          bluePerformer: createDefaultPerformerState("BLUE", subCat, blueName, blueClub),
          redPerformer: createDefaultPerformerState("RED", subCat, redName, redClub),
          athleteName: blueName,
          contingent: blueClub,
          gender: (norm.gender as any) || "PUTRA",
          ageCategory: norm.division || "DEWASA",
          stage: norm.stage || "PENYISIHAN",
          judgesCount: norm.judgesCount || 10
        };
      }
      return {
        matchState: norm,
        tgrsState: nextTgrs,
        manualCategoryOverride: null
      };
    }

    default:
      return state;
  }
}

export function MatchSimHub({ initialMode, onModeChange, isMonitorOnly = false, onBackToHome, onLogout }: MatchSimHubProps = {}) {
  const [hubState, dispatch] = useReducer(hubMatchReducer, undefined, getInitialHubState);
  const { matchState, tgrsState, manualCategoryOverride } = hubState;

  const matchStateRef = useRef<MatchState>(matchState);
  matchStateRef.current = matchState;
  const lastSavedScoresRef = useRef<{ id: string; activeRound: number; scoreRed: number; scoreBlue: number } | null>(null);
  const lastResetRef = useRef<{ id?: string; matchNumber?: string; time: number }>({ time: 0 });

  // Unified atomic dispatchers for backward compatibility across all child panel callbacks
  const setMatchState = useCallback((action: MatchState | ((prev: MatchState) => MatchState)) => {
    if (typeof action === "function") {
      dispatch({ type: "UPDATE_MATCH_STATE", updater: action });
    } else {
      dispatch({ type: "SET_MATCH_STATE", payload: action });
    }
  }, []);

  const setTgrsState = useCallback((action: TgrsMatchState | ((prev: TgrsMatchState) => TgrsMatchState)) => {
    dispatch({ type: "SET_TGRS_STATE", payload: action });
  }, []);

  const setManualCategoryOverride = useCallback((override: "TANDING" | "TGRS" | null) => {
    dispatch({ type: "SET_MANUAL_OVERRIDE", override });
  }, []);

  // Atomic category switch handler ensuring both matchState and tgrsState transition simultaneously
  const handleSwitchCategory = useCallback((targetCategory: "TANDING" | "TGRS") => {
    dispatch({ type: "SWITCH_CATEGORY", targetCategory });
    setTimeout(() => {
      const cur = matchStateRef.current;
      if (cur) {
        matchEngine.setState(cur);
        matchEngine.broadcast(cur);
        rtdbScoringEngine.setCurrentMatchState(cur);
        saveMatchStateToFirebase(cur, cur.arena || activeArena).catch(() => {});
        try {
          const raw = JSON.stringify(cur);
          localStorage.setItem("ipsi_match_state", raw);
          localStorage.setItem("jrz_silat_match_state", raw);
        } catch {}
        jurusDetectionService.evaluateAndSyncMatch(cur);
      }
    }, 0);
  }, []);

  // Set default mode based on prop, URL param, or default to LANDING
  const [appMode, setAppMode] = useState<AppMode>(() => initialMode || getInitialAppMode());

  // Initial splash screen state: Tampilan awal HANYA saat aplikasi pertama kali dibuka (disimpan per sesi)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        // Jika langsung mengakses via parameter role tertentu (misal: ?mode=JURY1 atau ?mode=SCOREBOARD), lewati splash
        if (params.get("mode") || params.get("role") || params.get("panel")) {
          return false;
        }
        // Jika sudah pernah dibuka/masuk dalam sesi ini, jangan tampilkan lagi
        if (sessionStorage.getItem("jrz_splash_seen_session") === "true") {
          return false;
        }
      } catch {}
    }
    return true;
  });

  const handleEnterSplash = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("jrz_splash_seen_session", "true");
      } catch {}
    }
    setShowSplash(false);
  }, []);

  useEffect(() => {
    // Preload panel chunks in background so 1st click immediately loads without delay
    const preloadPanels = () => {
      import("./ScoreboardView2").catch(() => {});
      import("./DewanPanel").catch(() => {});
      import("./JuryPanel").catch(() => {});
      import("./SekretarisPanel").catch(() => {});
      import("./OperatorPanel").catch(() => {});
      import("./LaporanPanel").catch(() => {});
    };
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(preloadPanels);
      } else {
        setTimeout(preloadPanels, 300);
      }
    }
  }, []);

  useEffect(() => {
    if (initialMode) {
      setAppMode(initialMode);
      setSuperAdminView("APP");
    }
  }, [initialMode]);

  useEffect(() => {
    if (onModeChange) {
      onModeChange(appMode);
    }
  }, [appMode, onModeChange]);
  const [fullscreenMode, setFullscreenMode] = useState<string | null>(null);
  const [nativeFs, setNativeFs] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [showJuryModal, setShowJuryModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showEventScopeModal, setShowEventScopeModal] = useState<boolean>(false);
  const [activeEventName, setActiveEventName] = useState<string>(() => eventScopeManager.getActiveEventName());

  useEffect(() => {
    const handleScopeChanged = () => {
      setActiveEventName(eventScopeManager.getActiveEventName());
    };
    window.addEventListener("jrz_event_scope_changed", handleScopeChanged);
    return () => window.removeEventListener("jrz_event_scope_changed", handleScopeChanged);
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showRefreshMenu, setShowRefreshMenu] = useState<boolean>(false);
  const [isSseActive, setIsSseActive] = useState<boolean>(false);
  const [isSekretarisSubScreen, setIsSekretarisSubScreen] = useState<boolean>(false);
  const handleSubScreenChange = useCallback((isSubScreen: boolean) => {
    setIsSekretarisSubScreen((prev) => (prev !== isSubScreen ? isSubScreen : prev));
  }, []);
  const [activeArena, setActiveArenaState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const a = params.get("arena") || params.get("gelanggang");
      if (a) return a.toUpperCase();
      return getActiveArena();
    }
    return "A";
  });

  // Sinkronisasi jumlah juri kategori jurus dari Panel Sekretaris
  const [jurusJudgesCount, setJurusJudgesCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jrz_tgrs_judges_count") || localStorage.getItem("jrz_judges_count");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 3 && parsed <= 10) return parsed;
      }
    }
    return 10;
  });

  useEffect(() => {
    const handleCountChange = (e: any) => {
      const count = e?.detail?.count || (typeof window !== "undefined" ? parseInt(localStorage.getItem("jrz_tgrs_judges_count") || localStorage.getItem("jrz_judges_count") || "10", 10) : 10);
      if (count && count >= 3 && count <= 10) {
        setJurusJudgesCount(count);
      }
    };
    window.addEventListener("jrz_judges_count_changed", handleCountChange);
    window.addEventListener("storage", handleCountChange);
    return () => {
      window.removeEventListener("jrz_judges_count_changed", handleCountChange);
      window.removeEventListener("storage", handleCountChange);
    };
  }, []);

  const effectiveJurusCount = useMemo(() => {
    const count = tgrsState?.judgesCount || matchState?.judgesCount || jurusJudgesCount || 10;
    return Math.max(3, Math.min(10, count));
  }, [tgrsState?.judgesCount, matchState?.judgesCount, jurusJudgesCount]);

  // Automatic match category detection from active match / partai
  const matchCategoryInfo = useMemo(() => {
    return detectMatchCategory(matchState);
  }, [
    matchState?.id,
    matchState?.kategori,
    matchState?.classCategory,
    matchState?.kelas,
    matchState?.category,
    matchState?.eventName,
    matchState?.stage,
    matchState?.isJurusCategory,
    matchState?.isJurus,
    matchState?.discipline
  ]);

  // Status apakah partai aktif saat ini adalah Jurus TGRS (Otomatis berpindah di sistem pusat tanpa intervensi manual)
  const isCurrentMatchTgrs = useMemo(() => {
    if (manualCategoryOverride === "TGRS") return true;
    if (manualCategoryOverride === "TANDING") return false;
    const catUpper = String(matchState?.kategori || matchState?.category || "").toUpperCase();
    if (["TUNGGAL", "GANDA", "REGU", "SOLO_KREATIF", "JURUS"].includes(catUpper)) {
      return true;
    }
    return Boolean(matchCategoryInfo.isJurusCategory || matchCategoryInfo.isTgr || isJurusCategory(matchState));
  }, [manualCategoryOverride, matchCategoryInfo.isJurusCategory, matchCategoryInfo.isTgr, matchState]);

  const handleToggleMatchCategory = useCallback(() => {
    const nextTarget = isCurrentMatchTgrs ? "TANDING" : "TGRS";
    handleSwitchCategory(nextTarget);
  }, [isCurrentMatchTgrs, handleSwitchCategory]);

  // Subscribe to Central Jurus Detection Service with atomic dispatch
  useEffect(() => {
    const unsubscribe = jurusDetectionService.subscribe((isJurus, info, match) => {
      if (match) {
        const isDiffMatch = match.id !== matchStateRef.current?.id || match.matchNumber !== matchStateRef.current?.matchNumber;
        dispatch({ type: "SET_MATCH_STATE", payload: match, clearOverride: isDiffMatch });
      }
    });
    return unsubscribe;
  }, []);

  // Sinkronkan data partai tanding aktif ke state TGRS ketika kategori TGRS terdeteksi (Sistem VS Sudut Biru vs Sudut Merah)
  useEffect(() => {
    if (matchCategoryInfo.isTgr && matchState) {
      setTgrsState((prev) => {
        const nextSub = matchCategoryInfo.tgrSubCategory || prev.category || "TUNGGAL";
        const cleanPartai = matchState.matchNumber
          ? String(matchState.matchNumber).replace(/[^0-9]/g, "") || prev.partai
          : prev.partai;
        
        const blueName = matchState.fighterBlueName || (matchState as any).athleteBlue?.name || prev.bluePerformer?.athleteName || "SUDUT BIRU";
        const blueClub = matchState.fighterBlueClub || (matchState as any).athleteBlue?.contingent || prev.bluePerformer?.contingent || "KONTINGEN BIRU";
        const redName = matchState.fighterRedName || (matchState as any).athleteRed?.name || prev.redPerformer?.athleteName || "SUDUT MERAH";
        const redClub = matchState.fighterRedClub || (matchState as any).athleteRed?.contingent || prev.redPerformer?.contingent || "KONTINGEN MERAH";

        const currentActive = prev.activeCorner || "BLUE";
        const activeName = currentActive === "BLUE" ? blueName : redName;
        const activeClub = currentActive === "BLUE" ? blueClub : redClub;

        const isCatChanged = prev.category !== nextSub;
        const bluePerf = (isCatChanged || !prev.bluePerformer)
          ? createDefaultPerformerState("BLUE", nextSub, blueName, blueClub)
          : { ...prev.bluePerformer, athleteName: blueName, contingent: blueClub };
        const redPerf = (isCatChanged || !prev.redPerformer)
          ? createDefaultPerformerState("RED", nextSub, redName, redClub)
          : { ...prev.redPerformer, athleteName: redName, contingent: redClub };

        // Cegah perulangan jika data identik
        if (
          prev.category === nextSub &&
          prev.partai === cleanPartai &&
          prev.bluePerformer?.athleteName === blueName &&
          prev.bluePerformer?.contingent === blueClub &&
          prev.redPerformer?.athleteName === redName &&
          prev.redPerformer?.contingent === redClub &&
          prev.athleteName === activeName &&
          prev.contingent === activeClub
        ) {
          return prev;
        }

        const next: TgrsMatchState = {
          ...prev,
          category: nextSub,
          categoryLabel: matchCategoryInfo.categoryLabel,
          partai: cleanPartai,
          gelanggang: activeArena || prev.gelanggang,
          activeCorner: currentActive,
          bluePerformer: bluePerf,
          redPerformer: redPerf,
          athleteName: activeName,
          contingent: activeClub,
          gender: (matchState.gender as any) || prev.gender,
          ageCategory: matchState.division || prev.ageCategory,
          stage: matchState.stage || prev.stage,
          judgesCount: matchState.judgesCount || prev.judgesCount || 10
        };
        return next;
      });
    }
  }, [
    matchState?.id,
    matchState?.matchNumber,
    matchState?.fighterBlueName,
    matchState?.fighterBlueClub,
    matchState?.fighterRedName,
    matchState?.fighterRedClub,
    matchState?.classCategory,
    matchState?.kategori,
    matchState?.judgesCount,
    matchCategoryInfo.isTgr,
    activeArena,
    setTgrsState
  ]);

  // Dengarkan pembaruan state TGRS & Partai Pertandingan (Tanding/Jurus) antar-tab/layar secara instan
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "jrz_tgrs_live_state" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.id) {
            setTgrsState((prev) => {
              if (
                prev.id === parsed.id &&
                prev.activeCorner === parsed.activeCorner &&
                prev.athleteName === parsed.athleteName &&
                prev.category === parsed.category &&
                prev.finalScore === parsed.finalScore
              ) {
                return prev;
              }
              return parsed;
            });
          }
        } catch {}
      }
      if ((e.key === "ipsi_match_state" || e.key === "jrz_silat_match_state") && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && (parsed.id || parsed.matchNumber)) {
            const isDiffMatch = parsed.id !== matchStateRef.current?.id || parsed.matchNumber !== matchStateRef.current?.matchNumber;
            if (!isDiffMatch) {
              const curVersion = Number(matchStateRef.current?.stateVersion) || 0;
              const newVersion = Number(parsed.stateVersion) || 0;
              const curTime = Number(matchStateRef.current?.lastUpdatedAt) || 0;
              const newTime = Number(parsed.lastUpdatedAt) || 0;
              if (newVersion < curVersion || (newVersion === curVersion && newTime <= curTime)) {
                return;
              }
            }
            dispatch({ type: "SET_MATCH_STATE", payload: parsed, clearOverride: isDiffMatch });
          }
        } catch {}
      }
    };
    const handleTgrCustom = (e: any) => {
      if (e.detail && e.detail.id) {
        setTgrsState((prev) => {
          if (
            prev.id === e.detail.id &&
            prev.activeCorner === e.detail.activeCorner &&
            prev.athleteName === e.detail.athleteName &&
            prev.category === e.detail.category &&
            prev.finalScore === e.detail.finalScore &&
            prev.isTimerRunning === e.detail.isTimerRunning &&
            prev.timerDuration === e.detail.timerDuration
          ) {
            return prev;
          }
          return e.detail;
        });
      }
    };
    const handleMatchActivated = (e: any) => {
      if (e.detail && (e.detail.id || e.detail.matchNumber)) {
        dispatch({ type: "ACTIVATE_MATCH", match: e.detail });
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("jrz_tgrs_state_updated", handleTgrCustom);
    window.addEventListener("jrz_activate_match", handleMatchActivated);
    window.addEventListener("force_match_sync", handleMatchActivated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("jrz_tgrs_state_updated", handleTgrCustom);
      window.removeEventListener("jrz_activate_match", handleMatchActivated);
      window.removeEventListener("force_match_sync", handleMatchActivated);
    };
  }, [setTgrsState]);

  // GLOBAL BACKGROUND TIMER TICKER UNTUK KATEGORI JURUS (TGRS):
  // Menjamin bahwa meskipun panel timer ditutup atau beralih ke panel manapun (Dewan, Juri, Scoreboard, Landing),
  // timer tetap terus berjalan secara realtime dan tersinkron ke semua panel.
  // Timer 1 (Waktu Penampil): Terus berjalan mencatat durasi penampilan aktual pesilat sampai STOP ditekan.
  // Timer 2 (Timer 3 Menit): Berjalan simultan hingga 03:00 lalu berhenti di 03:00.
  useEffect(() => {
    const isAnyTimerRunning = (tgrsState.isTimerRunning && !tgrsState.isPerformerFinished) || 
                              (tgrsState.isTimer2Running && !tgrsState.is3MinFinished);
    if (!isAnyTimerRunning || !tgrsState.timerStartedAt) return;

    const startedAt = tgrsState.timerStartedAt;
    let lastBroadcastSec = -1;

    const interval = setInterval(() => {
      const now = Date.now();
      const rawElapsed = Number(Math.max(0, (now - startedAt) / 1000).toFixed(1));
      const wholeSec = Math.floor(rawElapsed);

      setTgrsState((prev) => {
        if (!prev.timerStartedAt || prev.timerStartedAt !== startedAt) return prev;
        
        // 1. Timer 1 (Waktu Penampil): Hanya bertambah jika belum di-STOP
        const isT1Running = prev.isTimerRunning && !prev.isPerformerFinished;
        const currentPerformerElapsed = isT1Running 
          ? rawElapsed 
          : (prev.performerTime ?? prev.timerElapsed);

        // 2. Timer 2 (Timer Target / Durasi Resmi): Berjalan ke targetDuration (90s, 110s, 180s)
        const targetDuration = prev.targetDuration || DURASI_STANDAR_TGRS_DETIK;
        const isT2Running = (prev.isTimer2Running ?? true) && !prev.is3MinFinished;
        const current3MinElapsed = Math.min(targetDuration, rawElapsed);
        const is3MinLimitReached = rawElapsed >= targetDuration;

        const currentRemaining = Math.max(0, Number((targetDuration - currentPerformerElapsed).toFixed(1)));
        const isBlue = prev.activeCorner === "BLUE";
        const allDone = Boolean(prev.isPerformerFinished && (is3MinLimitReached || prev.is3MinFinished));

        const updatedBlue = isBlue
          ? { 
              ...prev.bluePerformer, 
              timerElapsed: currentPerformerElapsed, 
              timer3MinElapsed: current3MinElapsed,
              timerRemaining: currentRemaining, 
              isTimerRunning: isT1Running,
              isTimer2Running: !is3MinLimitReached && isT2Running,
              is3MinFinished: is3MinLimitReached,
              isFinished: allDone
            }
          : prev.bluePerformer;
        const updatedRed = !isBlue
          ? { 
              ...prev.redPerformer, 
              timerElapsed: currentPerformerElapsed, 
              timer3MinElapsed: current3MinElapsed,
              timerRemaining: currentRemaining, 
              isTimerRunning: isT1Running,
              isTimer2Running: !is3MinLimitReached && isT2Running,
              is3MinFinished: is3MinLimitReached,
              isFinished: allDone
            }
          : prev.redPerformer;

        const next: TgrsMatchState = {
          ...prev,
          timerElapsed: currentPerformerElapsed,
          timer3MinElapsed: current3MinElapsed,
          timerRemaining: currentRemaining,
          isTimerRunning: isT1Running,
          isTimer2Running: !is3MinLimitReached && isT2Running,
          is3MinFinished: is3MinLimitReached,
          isFinished: allDone,
          timerStartedAt: allDone ? null : startedAt,
          bluePerformer: updatedBlue,
          redPerformer: updatedRed
        };

        // Siarkan pembaruan tiap detik ke localStorage & tab/layar lain
        if (wholeSec !== lastBroadcastSec) {
          lastBroadcastSec = wholeSec;
          saveTgrsLiveState(next);
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    tgrsState.isTimerRunning, 
    tgrsState.isTimer2Running, 
    tgrsState.isPerformerFinished, 
    tgrsState.is3MinFinished, 
    tgrsState.timerStartedAt
  ]);

  // Backup & Restore JSON States
  const [isExportingBackup, setIsExportingBackup] = useState<boolean>(false);
  const [backupToast, setBackupToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingRestorePayload, setPendingRestorePayload] = useState<TournamentBackupPayload | null>(null);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const showBackupNotification = (text: string, type: "success" | "error" = "success") => {
    setBackupToast({ text, type });
    setTimeout(() => setBackupToast(null), 5500);
  };

  const handleExportBackup = async () => {
    playAppSound(800, 0.08);
    setIsExportingBackup(true);
    try {
      const res = await exportTournamentBackupJson();
      sound.playGong();
      showBackupNotification(
        `✅ Cadangan data berhasil diunduh: ${res.filename} (${res.summary.totalAthletes} Atlet, ${res.summary.totalMatches} Partai, ${res.summary.totalArchives} Riwayat)`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showBackupNotification(`❌ Gagal mengekspor data: ${err.message}`, "error");
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      playAppSound(700, 0.06);
      const payload = await parseAndValidateBackupFile(file);
      setPendingRestorePayload(payload);
    } catch (err: any) {
      showBackupNotification(`❌ Berkas tidak valid: ${err.message}`, "error");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestorePayload) return;
    setIsRestoringBackup(true);
    try {
      playAppSound(900, 0.1);
      const res = await restoreTournamentBackupJson(pendingRestorePayload, restoreMode);
      setPendingRestorePayload(null);
      sound.playGong();
      showBackupNotification(`✅ ${res.message}`, "success");
      setSyncCount((c) => c + 1);

      // Sinkronkan matchState jika ada activeMatch
      if (typeof window !== "undefined") {
        const rawCurrent = localStorage.getItem("jrz_silat_match_state");
        if (rawCurrent) {
          try {
            const parsedCurrent = JSON.parse(rawCurrent);
            if (parsedCurrent && parsedCurrent.id) {
              setMatchState(parsedCurrent);
              matchEngine.setState(parsedCurrent);
              matchEngine.broadcast(parsedCurrent);
              saveMatchStateToFirebase(parsedCurrent, parsedCurrent.arena || activeArena).catch(() => {});
            }
          } catch {}
        }
      }
    } catch (err: any) {
      console.error(err);
      showBackupNotification(`❌ Gagal memulihkan cadangan: ${err.message}`, "error");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const backupStats = useMemo(() => {
    if (typeof window === "undefined") return { athletes: 0, matches: 0, archives: 0 };
    try {
      const pRaw = localStorage.getItem("jrz_cached_participants") || localStorage.getItem("registered_athletes");
      const sRaw = localStorage.getItem("jrz_cached_schedules") || localStorage.getItem("match_schedules");
      const aRaw = localStorage.getItem("jrz_archived_matches");
      const p = pRaw ? JSON.parse(pRaw) : [];
      const s = sRaw ? JSON.parse(sRaw) : [];
      const a = aRaw ? JSON.parse(aRaw) : [];
      return {
        athletes: Array.isArray(p) ? p.length : 0,
        matches: Array.isArray(s) ? s.length : 0,
        archives: Array.isArray(a) ? a.length : 0
      };
    } catch {
      return { athletes: 0, matches: 0, archives: 0 };
    }
  }, [showSettingsModal, syncCount]);

  useEffect(() => {
    rtdbScoringEngine.switchArena(activeArena);
    setActiveArena(activeArena);
  }, [activeArena]);

  // Prefetch match panels in background after landing page has mounted for zero-latency navigation
  useEffect(() => {
    if (appMode === "LANDING") {
      const timer = setTimeout(() => {
        import("./DewanPanel");
        import("./OperatorPanel");
        import("./JuryPanel");
        import("./ScoreboardView2");
        import("./SekretarisPanel");
        import("./LaporanPanel");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [appMode]);

  // Theme Mode: LED Arena (Dark) vs White High-Contrast Mode
  const [themeMode, setThemeMode] = useState<"LED_ARENA" | "LIGHT_CONTRAST">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jrz_theme_mode");
      if (saved === "LIGHT_CONTRAST") return "LIGHT_CONTRAST";
    }
    return "LED_ARENA";
  });

  const handleSetTheme = (mode: "LED_ARENA" | "LIGHT_CONTRAST") => {
    setThemeMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("jrz_theme_mode", mode);
      window.dispatchEvent(new Event("jrz_theme_changed"));
    }
  };

  useEffect(() => {
    const handleThemeChange = () => {
      const saved = localStorage.getItem("jrz_theme_mode");
      setThemeMode(saved === "LIGHT_CONTRAST" ? "LIGHT_CONTRAST" : "LED_ARENA");
    };
    window.addEventListener("jrz_theme_changed", handleThemeChange);
    return () => window.removeEventListener("jrz_theme_changed", handleThemeChange);
  }, []);

  // Perintah user: PIN login dihapuskan saat aplikasi dimulai dan pada semua menu panel
  const [isAppAuthenticated, setIsAppAuthenticated] = useState<boolean>(true);
  const [pendingPanelMode, setPendingPanelMode] = useState<AppMode | null>(null);

  // Sinkronkan matchState aktif ke rtdbScoringEngine dan dengarkan evaluasi konsensus juri secara langsung
  useEffect(() => {
    if (matchState) {
      rtdbScoringEngine.setCurrentMatchState(matchState);
    }
  }, [matchState]);

  useEffect(() => {
    const unsub = rtdbScoringEngine.subscribeMatchStateUpdates((updatedState) => {
      if (updatedState) {
        setMatchState(updatedState);
      }
    });
    return () => unsub();
  }, []);

  // Default guest session when not signed in yet
  const DEFAULT_ACTIVE_USER: AuthSession["user"] = {
    id: "usr_operator_active",
    username: "operator",
    fullName: "Operator Gelanggang (Tanding)",
    role: "admin",
    status: "APPROVED",
    organization: "PB IPSI"
  };

  // Authentication State - reads from unified global SSO (ipsi_auth_user)
  const [currentUser, setCurrentUser] = useState<AuthSession["user"]>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("ipsi_auth_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.username) {
            return parsed;
          }
        } catch (e) {
          console.error("Gagal mengurai saved auth user:", e);
        }
      }
    }
    return DEFAULT_ACTIVE_USER;
  });

  // Sync with global SSO updates
  useEffect(() => {
    const handleUserSync = () => {
      try {
        const saved = window.localStorage.getItem("ipsi_auth_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.username) {
            setCurrentUser(parsed);
          }
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleUserSync);
    window.addEventListener("ipsi_auth_user_changed", handleUserSync);
    return () => {
      window.removeEventListener("storage", handleUserSync);
      window.removeEventListener("ipsi_auth_user_changed", handleUserSync);
    };
  }, []);

  const [superAdminView, setSuperAdminView] = useState<"DASHBOARD" | "APP">("APP");

  const handleLoginSuccess = (user: AuthSession["user"]) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ipsi_auth_user", JSON.stringify(user));
      window.dispatchEvent(new Event("ipsi_auth_user_changed"));
    }
    setSuperAdminView("APP");
    setAppMode(getInitialAppMode());
  };

  const handleLogout = () => {
    sound.playBuzzer();
    authService.logout();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("mode");
        url.searchParams.delete("panel");
        url.searchParams.delete("role");
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {
        // Ignore
      }
    }
    setAppMode("LANDING");
    setSuperAdminView("DASHBOARD");
    if (onLogout) {
      onLogout();
    }
  };

  // Gong sound effect triggers for starting and ending each round
  const prevStatusRef = useRef<MatchStatus | null>(null);
  const prevTimeLeftRef = useRef<number | null>(null);

  useEffect(() => {
    if (!matchState) return;
    
    const prevStatus = prevStatusRef.current;
    const prevTimeLeft = prevTimeLeftRef.current;
    const roundDur = matchState.roundDuration || 120;

    // 1. Play buzzer on START (Babak 1,2,3 Dimulai): transitioned to RUNNING from non-RUNNING (bukan saat resume dari jeda/PAUSED di tengah babak)
    const isResuming =
      prevStatus === MatchStatus.PAUSED &&
      prevTimeLeft !== null &&
      prevTimeLeft > 0 &&
      prevTimeLeft < roundDur;
    if (matchState.status === MatchStatus.RUNNING && prevStatus !== MatchStatus.RUNNING && prevStatus !== null && !isResuming) {
      sound.playBuzzer();
    }

    // 2. Play buzzer on END (Babak 1,2,3 Selesai): transitioned to timeLeft === 0 from timeLeft > 0
    if (matchState.timeLeft === 0 && prevTimeLeft !== null && prevTimeLeft > 0) {
      sound.playBuzzer();
    }

    prevStatusRef.current = matchState.status;
    prevTimeLeftRef.current = matchState.timeLeft;
  }, [matchState]);

  // Sinkronkan state aktif ke Firebase Realtime Database saat perubahan bermakna
  const lastVaultSigRef = useRef<string>("");
  useEffect(() => {
    if (matchState && matchState.id) {
      rtdbScoringEngine.setCurrentMatchState(matchState);
      const sig = `${matchState.id}_${matchState.stateVersion || 0}_${matchState.status}_${matchState.activeRound}_${matchState.scoreRed}_${matchState.scoreBlue}_${matchState.logs?.length || 0}_${matchState.juryPanelLocked}_${matchState.dewanPanelLocked}_${matchState.verification?.active || false}_${matchState.winnerPublished || false}_${matchState.timeLeft === 0 ? 0 : 1}`;
      if (sig !== lastVaultSigRef.current) {
        lastVaultSigRef.current = sig;
        try {
          const raw = JSON.stringify(matchState);
          localStorage.setItem("ipsi_match_state", raw);
        } catch {}
      }
    }
  }, [matchState, activeArena]);

  // Disable overflow on body when fullscreen is active (except SEKRETARIS which requires scrolling)
  useEffect(() => {
    const handleFsNotify = () => {
      const isFsActive = !!document.fullscreenElement;
      setNativeFs(isFsActive);
      if (isFsActive && appMode !== "SEKRETARIS") {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };

    document.addEventListener("fullscreenchange", handleFsNotify);
    document.addEventListener("webkitfullscreenchange", handleFsNotify);
    document.addEventListener("mozfullscreenchange", handleFsNotify);
    document.addEventListener("MSFullscreenChange", handleFsNotify);

    // Run initial state check
    handleFsNotify();

    return () => {
      document.removeEventListener("fullscreenchange", handleFsNotify);
      document.removeEventListener("webkitfullscreenchange", handleFsNotify);
      document.removeEventListener("mozfullscreenchange", handleFsNotify);
      document.removeEventListener("MSFullscreenChange", handleFsNotify);
      document.body.style.overflow = "";
    };
  }, [appMode]);

  // Auto-caching live match state and round scores locally in root component to prevent loss on refresh

  useEffect(() => {
    if (matchState && matchState.id) {
      const { id, activeRound, scoreRed, scoreBlue } = matchState;
      if (
        lastSavedScoresRef.current &&
        lastSavedScoresRef.current.id === id &&
        lastSavedScoresRef.current.activeRound === activeRound &&
        lastSavedScoresRef.current.scoreRed === scoreRed &&
        lastSavedScoresRef.current.scoreBlue === scoreBlue
      ) {
        return; // Skip saving to localStorage if round scores are exactly the same!
      }
      try {
        const key = `ipsi_round_scores_history_${id}`;
        const existing = localStorage.getItem(key);
        const history = existing ? JSON.parse(existing) : {};
        
        history[activeRound] = {
          round: activeRound,
          scoreRed: scoreRed,
          scoreBlue: scoreBlue,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(history));
        lastSavedScoresRef.current = { id, activeRound, scoreRed, scoreBlue };
      } catch (e) {
        console.error("Gagal caching local storage di level root", e);
      }
    }
  }, [matchState]);

  // Local high-performance clock tick interpolation & timer engine (anchored to timerEndAt for 0ms drift across refreshed panels)
  useEffect(() => {
    if (!currentUser || !matchState || matchState.status !== "RUNNING") {
      return;
    }

    const timer = setInterval(() => {
      setMatchState(prev => {
        if (!prev || prev.status !== "RUNNING") {
          return prev;
        }

        const now = getSyncedNow();
        const arenaKey = (prev.arena || activeArena || "A").toUpperCase();

        // Ensure timerEndAt is anchored if missing or invalid on a running state
        if (typeof prev.timerEndAt !== "number" || isNaN(prev.timerEndAt)) {
          const baseTime = typeof prev.timeLeft === "number" && prev.timeLeft >= 0 ? prev.timeLeft : (prev.roundDuration || 120);
          const anchored: MatchState = {
            ...prev,
            timeLeft: baseTime,
            timerStartedAt: now,
            timerEndAt: now + baseTime * 1000,
            showRoundOverPopup: false,
            secretarySignalNextRound: false
          };
          matchEngine.setState(anchored);
          return anchored;
        }

        const nextTime = Math.max(0, Math.ceil((prev.timerEndAt - now) / 1000));

        // Only update state when the integer second actually changes (or reaches 0)
        if (nextTime === prev.timeLeft && nextTime > 0) {
          return prev;
        }

        const tickStorageKey = `ipsi_last_timer_tick_${arenaKey}`;
        let shouldPersistTick = false;
        try {
          const lastTick = Number(window.localStorage.getItem(tickStorageKey)) || 0;
          if (now - lastTick >= 800 || nextTime <= 0) {
            shouldPersistTick = true;
            window.localStorage.setItem(tickStorageKey, String(now));
          }
        } catch {
          shouldPersistTick = true;
        }

        if (nextTime <= 0) {
          // Time reached 00:00! Cleanly finish the round / match
          const stateBeforeTick: MatchState = {
            ...prev,
            timeLeft: 1
          };
          const tickedEndState = matchEngine.processTimerTick(stateBeforeTick);
          tickedEndState.timeLeft = 0;
          tickedEndState.timerEndAt = null;
          tickedEndState.timerStartedAt = null;

          matchEngine.setState(tickedEndState);
          matchEngine.broadcast(tickedEndState);

          const isController = appMode === "DEWAN" || appMode === "OPERATOR" || appMode === "SEKRETARIS";
          if (isController || !isSseActive) {
            saveMatchStateToFirebase(tickedEndState, arenaKey).catch(() => {});
          }
          if (tickedEndState.status === MatchStatus.FINISHED) {
            fetch("/api/match-state/round", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roundAction: "FINISH" })
            }).catch(() => {});
          } else {
            fetch("/api/match-state/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                timeLeft: 0,
                status: MatchStatus.PAUSED,
                timerEndAt: null,
                timerStartedAt: null,
                showRoundOverPopup: true,
                secretarySignalNextRound: true,
                dewanPanelLocked: true
              })
            }).catch(() => {});
          }
          return tickedEndState;
        }

        const updatedRunning: MatchState = {
          ...prev,
          timeLeft: nextTime
        };

        if (shouldPersistTick) {
          matchEngine.setState(updatedRunning);
        }

        return updatedRunning;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [currentUser, isSseActive, activeArena, matchState?.status, matchState?.activeRound]);

  // Real-time in-memory & Firebase match state synchronization
  useEffect(() => {
    const unsubscribe = matchEngine.subscribe((remoteState) => {
      setMatchState(prev => {
        if (!prev) return remoteState;
        if (remoteState.status === "RUNNING") {
          const now = getSyncedNow();
          if (remoteState.timeLeft === 0) {
            return {
              ...remoteState,
              timeLeft: 0,
              timerEndAt: null
            };
          }

          let effectiveEndAt: number | null = null;
          if (
            prev.status === "RUNNING" &&
            prev.activeRound === remoteState.activeRound &&
            typeof prev.timerEndAt === "number" &&
            prev.timerEndAt > now
          ) {
            effectiveEndAt = prev.timerEndAt;
          } else if (typeof remoteState.timerEndAt === "number") {
            effectiveEndAt = remoteState.timerEndAt;
          } else if (typeof remoteState.timeLeft === "number" && remoteState.timeLeft > 0) {
            effectiveEndAt = now + remoteState.timeLeft * 1000;
          }

          const calculatedTime = effectiveEndAt !== null
            ? Math.max(0, Math.ceil((effectiveEndAt - now) / 1000))
            : (typeof remoteState.timeLeft === "number" ? remoteState.timeLeft : 0);

          return {
            ...remoteState,
            timerEndAt: effectiveEndAt,
            timerStartedAt: remoteState.timerStartedAt || prev.timerStartedAt || now,
            timeLeft: calculatedTime
          };
        }
        return remoteState;
      });
      setSyncCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Subscribe to Firebase Realtime Database active match state & atomic jury press updates
  useEffect(() => {
    const applyIncomingState = (remoteState: MatchState) => {
      setMatchState(prev => {
        if (!prev) return remoteState;
        if (remoteState.status === "RUNNING") {
          const now = getSyncedNow();
          if (remoteState.timeLeft === 0) {
            return {
              ...remoteState,
              timeLeft: 0,
              timerEndAt: null
            };
          }

          let effectiveEndAt: number | null = null;
          if (
            prev.status === "RUNNING" &&
            prev.activeRound === remoteState.activeRound &&
            typeof prev.timerEndAt === "number" &&
            prev.timerEndAt > now
          ) {
            effectiveEndAt = prev.timerEndAt;
          } else if (typeof remoteState.timerEndAt === "number") {
            effectiveEndAt = remoteState.timerEndAt;
          } else if (typeof remoteState.timeLeft === "number" && remoteState.timeLeft > 0) {
            effectiveEndAt = now + remoteState.timeLeft * 1000;
          }

          const calculatedTime = effectiveEndAt !== null
            ? Math.max(0, Math.ceil((effectiveEndAt - now) / 1000))
            : (typeof remoteState.timeLeft === "number" ? remoteState.timeLeft : 0);

          return {
            ...remoteState,
            timerEndAt: effectiveEndAt,
            timerStartedAt: remoteState.timerStartedAt || prev.timerStartedAt || now,
            timeLeft: calculatedTime
          };
        }
        return remoteState;
      });
      setErrorMsg(null);
      setSyncCount(prev => prev + 1);
    };

    const unsubMatch = rtdbScoringEngine.listenToActiveMatch(applyIncomingState);
    const unsubJuryUpdates = rtdbScoringEngine.subscribeMatchStateUpdates(applyIncomingState);

    return () => {
      unsubMatch();
      unsubJuryUpdates();
    };
  }, [currentUser, activeArena]);

  // Force local and tab sync listener
  useEffect(() => {
    const handleForceSync = (e: any) => {
      if (e.detail) {
        setMatchState(normalizeMatchState(e.detail));
      }
    };
    window.addEventListener("force_match_sync", handleForceSync);
    return () => window.removeEventListener("force_match_sync", handleForceSync);
  }, []);

  // Register device presence in Firebase RTDB based on active appMode
  useEffect(() => {
    if (!currentUser) return;
    const roleKey = appMode === "LANDING" 
      ? `user-${currentUser.username}` 
      : appMode.toLowerCase();
    rtdbScoringEngine.initDevice(roleKey, `${currentUser.fullName} (${appMode})`);
  }, [currentUser, appMode]);

  // Ensure matchState is never stuck in null state
  useEffect(() => {
    if (!matchState) {
      setMatchState(createDefaultMatchState());
    }
  }, [matchState]);

  // Otomatisasi: Ketika partai telah selesai dan pemenang telah diumumkan oleh Dewan (winnerPublished: true atau tgrsState.winnerAnnounced),
  // arsipkan data ke histori pertandingan pada panel sekretaris, tampilkan visual kemenangan pada panel monitor 20 detik,
  // lalu sistem mempersiapkan data pertandingan ke partai selanjutnya dan merubah semua data pada semua panel.
  useEffect(() => {
    const isTgrsFinished = Boolean(tgrsState?.winnerAnnounced);
    const isTandingFinished = Boolean(matchState && matchState.status === MatchStatus.FINISHED && matchState.winnerPublished);
    if (!isTgrsFinished && !isTandingFinished) return;

    const finishedMatchId = matchState?.id || tgrsState?.id;
    const celebrationDurationMs = 20000; // 20 detik tepat sesuai instruksi user

    // 1. Secara otomatis mengarsipkan data pertandingan pada menu history pertandingan pada panel sekretaris
    try {
      if (matchState) {
        archiveMatchToFirebase(matchState).catch(() => {});
        window.dispatchEvent(new CustomEvent("jrz_schedules_updated"));
      }
    } catch (e) {
      console.warn("Gagal arsip otomatis pertandingan:", e);
    }

    const executeAdvanceToNextMatch = async () => {
      console.log("OTOMATIS BERALIH KE PARTAI BERIKUTNYA: Selebrasi 20 detik selesai. Mengalihkan semua panel ke partai selanjutnya...");

      let advancedState: MatchState | null = null;
      if (matchState) {
        try {
          advancedState = await rtdbScoringEngine.handleNextMatch(matchState);
        } catch (err) {
          advancedState = matchEngine.processNextMatch(matchState);
        }
      }

      if (advancedState) {
        advancedState.status = MatchStatus.IDLE;
        advancedState.winnerPublished = false;
        advancedState.winnerColor = null;
        advancedState.winnerMethod = undefined;
        advancedState.scoreRed = 0;
        advancedState.scoreBlue = 0;
        advancedState.activeRound = 1;
        advancedState.timeLeft = advancedState.roundDuration || 120;
        advancedState.showNextMatchPopup = true;

        // Persiapkan data pertandingan baru TGRS & reset seluruh panel ke standby awal
        const isNextJurus = Boolean(
          advancedState.isJurus || 
          advancedState.isJurusCategory || 
          advancedState.isSeni || 
          advancedState.discipline === "SENI" || 
          advancedState.category?.toUpperCase().includes("JURUS") || 
          advancedState.category?.toUpperCase().includes("TUNGGAL") || 
          advancedState.category?.toUpperCase().includes("GANDA") || 
          advancedState.category?.toUpperCase().includes("REGU") || 
          advancedState.category?.toUpperCase().includes("SOLO")
        );

        let nextSub: TgrsSubCategory = "TUNGGAL";
        if (isNextJurus) {
          const catUpper = (advancedState.category || "").toUpperCase();
          if (catUpper.includes("GANDA")) nextSub = "GANDA";
          else if (catUpper.includes("REGU")) nextSub = "REGU";
          else if (catUpper.includes("SOLO") || catUpper.includes("BEBAS")) nextSub = "SOLO_KREATIF";
        }

        const blueName = advancedState.fighterBlueName || "SUDUT BIRU";
        const blueClub = advancedState.fighterBlueClub || "KONTINGEN BIRU";
        const redName = advancedState.fighterRedName || "SUDUT MERAH";
        const redClub = advancedState.fighterRedClub || "KONTINGEN MERAH";
        const targetDuration = advancedState.roundDuration || 180;

        const freshTgrs = createDefaultTgrsState(nextSub);
        freshTgrs.id = "tgrs-" + advancedState.id;
        freshTgrs.partai = String(advancedState.matchNumber || "1").replace(/[^0-9]/g, "") || "1";
        freshTgrs.gelanggang = String(advancedState.arena || "A").slice(-1).toUpperCase();
        freshTgrs.gender = (advancedState.gender as any) || "PUTRA";
        freshTgrs.ageCategory = advancedState.division || "DEWASA";
        freshTgrs.stage = advancedState.stage || "FINAL";
        freshTgrs.judgesCount = advancedState.judgesCount || jurusJudgesCount || 10;
        freshTgrs.targetDuration = targetDuration;
        freshTgrs.activeCorner = "BLUE";
        freshTgrs.bluePerformer = createDefaultPerformerState("BLUE", nextSub, blueName, blueClub);
        freshTgrs.redPerformer = createDefaultPerformerState("RED", nextSub, redName, redClub);
        freshTgrs.athleteName = blueName;
        freshTgrs.contingent = blueClub;
        freshTgrs.winnerAnnounced = false;
        freshTgrs.winnerCorner = null;
        freshTgrs.winnerReason = "";
        freshTgrs.isTimerRunning = false;
        freshTgrs.isTimer2Running = false;
        freshTgrs.isPerformerFinished = false;
        freshTgrs.is3MinFinished = false;
        freshTgrs.timerStartedAt = null;
        freshTgrs.timerElapsed = 0;
        freshTgrs.timer3MinElapsed = 0;

        setTgrsState(freshTgrs);
        saveTgrsLiveState(freshTgrs);

        setMatchState(advancedState);
        matchEngine.broadcast(advancedState);
        window.dispatchEvent(new CustomEvent("jrz_schedules_updated"));
        window.dispatchEvent(new CustomEvent("jrz_tgrs_reset_timer"));
        try {
          await saveMatchStateToFirebase(advancedState, rtdbScoringEngine.getStatus().arena);
        } catch {}
      }
    };

    const autoAdvanceTimer = setTimeout(executeAdvanceToNextMatch, celebrationDurationMs);

    const handleSkipEvent = () => {
      clearTimeout(autoAdvanceTimer);
      executeAdvanceToNextMatch();
    };
    window.addEventListener("jrz_skip_victory_countdown", handleSkipEvent);
    window.addEventListener("jrz_tgrs_advance_next_match", handleSkipEvent);

    return () => {
      clearTimeout(autoAdvanceTimer);
      window.removeEventListener("jrz_skip_victory_countdown", handleSkipEvent);
      window.removeEventListener("jrz_tgrs_advance_next_match", handleSkipEvent);
    };
  }, [matchState?.id, matchState?.status, matchState?.winnerPublished, tgrsState?.id, tgrsState?.winnerAnnounced]);

  // Synchronize state from Express backend with Server-Sent Events (SSE) for sub-ms real-time latency
  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    let eventSource: EventSource | null = null;
    let pollTimeout: NodeJS.Timeout | null = null;
    let isPollingScheduled = false;

    // High-performance clock dead-reckoning & conflict-free Firebase RTDB state merger
    const applyServerState = (data: any) => {
      if (!active || !data) return;
      const arenaKey = rtdbScoringEngine.getStatus().arena || "A";
      const localCached = matchEngine.getState();
      const { merged, localIsNewer } = matchEngine.reconcileMatchStates(
        localCached,
        data,
        hasPendingCloudSync(arenaKey)
      );

      // Ensure authoritative lock/unlock signals from server are immediately respected
      if (typeof data.juryPanelLocked === "boolean") {
        merged.juryPanelLocked = data.juryPanelLocked;
      }
      if (typeof data.dewanPanelLocked === "boolean") {
        merged.dewanPanelLocked = data.dewanPanelLocked;
      }
      if (typeof data.isPanelsLocked === "boolean") {
        merged.isPanelsLocked = data.isPanelsLocked;
      }
      if (data.juryPanelLocked === false || data.dewanPanelLocked === false || data.isPanelsLocked === false) {
        merged.showRoundOverPopup = false;
        merged.showNextMatchPopup = false;
        merged.secretarySignalNextRound = false;
      }

      if (localIsNewer && merged && merged.id && merged.id !== "match-none") {
        setMatchState(merged);
        matchEngine.broadcast(merged);
        saveMatchStateToFirebase(merged, arenaKey).catch(() => {});
        fetch("/api/match-state/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: merged })
        }).catch(() => {});
        return;
      }

      setMatchState(prev => {
        if (!prev) return merged;
        if (merged.status === "RUNNING") {
          const now = getSyncedNow();
          if (merged.timeLeft === 0) {
            return {
              ...merged,
              timeLeft: 0,
              timerEndAt: null
            };
          }

          let effectiveEndAt: number | null = null;
          if (
            prev.status === "RUNNING" &&
            prev.activeRound === merged.activeRound &&
            typeof prev.timerEndAt === "number" &&
            prev.timerEndAt > now
          ) {
            effectiveEndAt = prev.timerEndAt;
          } else if (typeof merged.timerEndAt === "number") {
            effectiveEndAt = merged.timerEndAt;
          } else if (typeof merged.timeLeft === "number" && merged.timeLeft > 0) {
            effectiveEndAt = now + merged.timeLeft * 1000;
          }

          const calculatedTime = effectiveEndAt !== null
            ? Math.max(0, Math.ceil((effectiveEndAt - now) / 1000))
            : (typeof merged.timeLeft === "number" ? merged.timeLeft : 0);

          return {
            ...merged,
            timerEndAt: effectiveEndAt,
            timerStartedAt: merged.timerStartedAt || prev.timerStartedAt || now,
            timeLeft: calculatedTime
          };
        }
        return merged;
      });
      setErrorMsg(null);
      setSyncCount(prev => prev + 1);
      // Update local in-memory state cleanly without redundant broadcasts
      matchEngine.setState(merged);
    };

    const fetchState = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800);
        const res = await fetch("/api/match-state", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Gagal mengambil status server");
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Bukan respons JSON server");
        }
        const data = await res.json();

        // Reconcile server state vs current state
        applyServerState(data);
      } catch (err: any) {
        if (active) {
          setIsSseActive(false);
        }
      }
    };

    // Lightweight, congestion-free recursive timeout polling
    const schedulePoll = () => {
      if (!active || isPollingScheduled) return;
      isPollingScheduled = true;
      pollTimeout = setTimeout(async () => {
        isPollingScheduled = false;
        await fetchState();
        if (active && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
          schedulePoll();
        }
      }, 1000); // Polling dynamically scheduled 1s after the previous one finishes
    };

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/match-state/stream");

      eventSource.onopen = () => {
        if (active) {
          setIsSseActive(true);
          setErrorMsg(null);
        }
        if (pollTimeout) {
          clearTimeout(pollTimeout);
          pollTimeout = null;
        }
        isPollingScheduled = false;
      };

      eventSource.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          applyServerState(data);
        } catch (e) {
          console.error("Gagal parse update real-time SSE", e);
        }
      };

      eventSource.onerror = (err) => {
        if (!active) return;
        setIsSseActive(false);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Schedule lightweight fallback polling
        schedulePoll();
      };
    };

    // 1. Fetch initial state
    fetchState();

    // 2. Start Real-time Stream
    connectSSE();

    // 3. Keep-alive connection check
    const keepAlive = setInterval(() => {
      if (active && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        connectSSE();
      }
    }, 4000);

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
      clearInterval(keepAlive);
    };
  }, [currentUser]);

  // API & Firebase RTDB Call helper functions
  const handleTimerCommand = async (command: "START" | "PAUSE" | "ADD_10" | "SUB_10" | "RESET") => {
    if (!matchState) return;
    if (command === "RESET") {
      const resetDuration = matchState.roundDuration || 120;
      const updated = await rtdbScoringEngine.handleUpdateMetadata(matchState, {
        timeLeft: resetDuration,
        status: MatchStatus.IDLE,
        timerEndAt: null,
        timerStartedAt: null,
        showRoundOverPopup: false,
        secretarySignalNextRound: false
      });
      setMatchState(updated);
      try {
        fetch("/api/match-state/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeLeft: resetDuration,
            status: MatchStatus.IDLE,
            showRoundOverPopup: false,
            secretarySignalNextRound: false
          })
        }).catch(() => {});
      } catch (err) {}
      return;
    }
    const updated = await rtdbScoringEngine.handleTimerCommand(matchState, command);
    setMatchState(updated);
    try {
      fetch("/api/match-state/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          timeLeft: updated.timeLeft,
          timerEndAt: updated.timerEndAt ?? null,
          timerStartedAt: updated.timerStartedAt ?? null
        })
      }).catch(() => {});
    } catch (err) {}
  };

  const handleRoundAction = async (roundAction: "NEXT" | "SET" | "FINISH", targetRound?: number) => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleRoundAction(matchState, roundAction, targetRound);
    setMatchState(updated);
    try {
      fetch("/api/match-state/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundAction, targetRound })
      }).catch(() => {});
    } catch (err) {}
  };

  const handleDewanAction = async (actionData: { command: "DROP" | "LOCK" | "PENALTY" | "OVERRIDE" | "CANCEL_DROP" | "RESET_ROUND_PENALTIES" | "DECLARE_VICTORY" | "PUNCH" | "CANCEL_PUNCH" | "KICK" | "CANCEL_KICK"; fighter: "RED" | "BLUE"; penaltyType?: string; overridePoints?: number }) => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleDewanAction(matchState, actionData);
    setMatchState(updated);
    try {
      fetch("/api/dewan/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData)
      }).catch(() => {});
    } catch (err) {}
  };

  const handleUpdateMetadata = async (data: Partial<MatchState>) => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleMetadataUpdate(matchState, data);
    setMatchState(updated);
    try {
      fetch("/api/match-state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).catch(() => {});
      if (data.judgesCount) {
        setTgrsState(prev => {
          const next = { ...prev, judgesCount: Number(data.judgesCount) };
          setTimeout(() => saveTgrsLiveState(next), 0);
          return next;
        });
      }
      if (data.juryPanelLocked !== undefined || data.dewanPanelLocked !== undefined || data.isPanelsLocked !== undefined) {
        const isLocked = Boolean(data.juryPanelLocked ?? data.dewanPanelLocked ?? data.isPanelsLocked);
        fetch("/api/match-state/toggle-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locked: isLocked })
        }).catch(() => {});
      }
    } catch (err) {}
  };

  const handleStartVerification = async (type: "JATUHAN" | "PELANGGARAN", corner?: "RED" | "BLUE" | null, reason?: string) => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleVerificationStart(matchState, type, corner, reason);
    setMatchState(updated);
    try {
      fetch("/api/match-state/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, corner, reason })
      }).catch(() => {});
    } catch (err) {}
  };

  const handleApplyVerification = async (decision?: "MERAH" | "BIRU" | "TIDAK SAH") => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleVerificationApply(matchState, decision);
    setMatchState(updated);
    try {
      fetch("/api/match-state/verify/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      }).catch(() => {});
    } catch (err) {}
  };

  const handleJuryVote = async (juryId: number, vote: "MERAH" | "BIRU" | "TIDAK SAH") => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleVerificationVote(matchState, juryId, vote);
    setMatchState(updated);
    try {
      fetch("/api/match-state/verify/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ juryId, vote })
      }).catch(() => {});
    } catch (err) {}
  };

  const handleResetVerification = async () => {
    if (!matchState) return;
    const updated = await rtdbScoringEngine.handleVerificationReset(matchState);
    setMatchState(updated);
    try {
      fetch("/api/match-state/verify/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});
    } catch (err) {}
  };

  const lastHubJuryPressRef = useRef<Record<string, number>>({});

  const handleJuryPress = async (juryId: number, fighter: FighterColor, action: ActionType) => {
    const baseState = matchStateRef.current || matchState || matchEngine.getState();
    if (!baseState) return;
    const now = Date.now();
    const comboKey = `${juryId}_${fighter}_${action}`;
    const anyKey = `${juryId}_ANY`;
    if (now - (lastHubJuryPressRef.current[comboKey] || 0) < 900) return;
    if (now - (lastHubJuryPressRef.current[anyKey] || 0) < 450) return;
    lastHubJuryPressRef.current[comboKey] = now;
    lastHubJuryPressRef.current[anyKey] = now;

    const pressId = `press_${juryId}_${now}`;

    // Sinkronisasi Firebase Realtime Database instan 0ms
    const updated = await rtdbScoringEngine.handleJuryPress(baseState, juryId, fighter, action, pressId, now);
    setMatchState(updated);
    matchEngine.setState(updated);
    matchEngine.broadcast(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jrz_score_sync", { detail: updated }));
      window.dispatchEvent(new CustomEvent("force_match_sync", { detail: updated }));
    }

    fetch("/api/jury/press", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-jrz-event-id": eventScopeManager.getActiveEventId()
      },
      body: JSON.stringify({
        juryId,
        fighter,
        action,
        pressId,
        timestamp: now,
        eventId: eventScopeManager.getActiveEventId()
      })
    })
        .then(async (res) => {
          if (res.ok) {
            const ct = res.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
              const serverState = await res.json();
              if (serverState && serverState.id && serverState.status === MatchStatus.RUNNING) {
                const normalized = normalizeMatchState(serverState);
                const { merged } = matchEngine.reconcileMatchStates(matchEngine.getState(), normalized, true);
                setMatchState(merged);
                matchEngine.setState(merged);
              }
            }
          }
        })
        .catch(() => {
          // Abaikan jika dev server reload
        });

    // Auto clear visual indicator from local React state after 2.0s
    const pressTime = updated.activeJuryPresses?.[juryId]?.pressedAt;
    setTimeout(() => {
      setMatchState(prev => {
        if (prev?.activeJuryPresses?.[juryId]?.pressedAt === pressTime) {
          return {
            ...prev,
            activeJuryPresses: {
              ...prev.activeJuryPresses,
              [juryId]: null
            }
          };
        }
        return prev;
      });
    }, 2000);
  };

  const handleResetMatch = async (customPayload?: Partial<MatchState>) => {
    const now = Date.now();
    const targetId = customPayload?.id || matchState?.id;
    const targetMatchNum = customPayload?.matchNumber || matchState?.matchNumber;
    if (
      lastResetRef.current.time > 0 &&
      now - lastResetRef.current.time < 500 &&
      targetId &&
      lastResetRef.current.id === targetId &&
      targetMatchNum &&
      lastResetRef.current.matchNumber === targetMatchNum
    ) {
      // Lewati eksekusi berulang jika event partai yang sama persis terpanggil < 500ms
      return;
    }
    lastResetRef.current = { id: targetId, matchNumber: targetMatchNum, time: now };

    const targetSource = customPayload || matchState;
    const isJurus = isJurusCategory(targetSource);
    const subCat: TgrsSubCategory | undefined = isJurus ? getTgrsSubCategory(targetSource) : undefined;
    const resolvedKategori = isJurus ? (subCat || "TUNGGAL") : "TANDING";

    const payload = {
      id: customPayload?.id || "match-" + Date.now(),
      eventName: customPayload?.eventName || matchState?.eventName || "KEJUARAAN PENCAK SILAT NASIONAL",
      fighterRedName: customPayload?.fighterRedName || matchState?.fighterRedName || "PESILAT MERAH",
      fighterRedClub: customPayload?.fighterRedClub || matchState?.fighterRedClub || "CONTINGENT MERAH",
      fighterBlueName: customPayload?.fighterBlueName || matchState?.fighterBlueName || "PESILAT BIRU",
      fighterBlueClub: customPayload?.fighterBlueClub || matchState?.fighterBlueClub || "CONTINGENT BIRU",
      classCategory: customPayload?.classCategory || matchState?.classCategory || (isJurus ? `Seni ${subCat || "Tunggal Baku"}` : "Tanding Bebas"),
      matchNumber: customPayload?.matchNumber || matchState?.matchNumber || "Partai -",
      roundCount: customPayload?.roundCount || matchState?.roundCount || (isJurus ? 1 : 3),
      roundDuration: customPayload?.roundDuration || matchState?.roundDuration || (isJurus ? 180 : 120),
      logoLeft: customPayload?.logoLeft || matchState?.logoLeft || "",
      logoRight: customPayload?.logoRight || matchState?.logoRight || "",
      gender: customPayload?.gender || matchState?.gender || "PUTRA",
      stage: customPayload?.stage || matchState?.stage || "PENYISIHAN",
      division: customPayload?.division || matchState?.division || "DEWASA",
      wmpThreshold: customPayload?.wmpThreshold || matchState?.wmpThreshold || 30,
      kategori: resolvedKategori,
      category: resolvedKategori,
      tgrSubCategory: subCat,
      discipline: isJurus ? "SENI" : "TANDING",
      isJurusCategory: isJurus,
      isJurus: isJurus,
      isTgr: isJurus,
      isSeni: isJurus,
      isTanding: !isJurus
    };

    setManualCategoryOverride(null); // Reset manual override agar otomatis mengikuti kategori partai baru

    if (isJurus) {
      const nextSub = subCat || "TUNGGAL";
      let catLabel = `JURUS ${nextSub}`;
      if (nextSub === "GANDA") catLabel = "SENI GANDA IPSI";
      else if (nextSub === "REGU") catLabel = "SENI REGU IPSI";
      else if (nextSub === "SOLO_KREATIF") catLabel = "SOLO KREATIF IPSI";
      else catLabel = "SENI TUNGGAL BAKU IPSI";

      const cleanPartai = targetSource?.matchNumber
        ? String(targetSource.matchNumber).replace(/[^0-9]/g, "") || "1"
        : "1";
      const blueName = targetSource?.fighterBlueName || (targetSource as any)?.athleteBlue?.name || "SUDUT BIRU";
      const blueClub = targetSource?.fighterBlueClub || (targetSource as any)?.athleteBlue?.contingent || "KONTINGEN BIRU";
      const redName = targetSource?.fighterRedName || (targetSource as any)?.athleteRed?.name || "SUDUT MERAH";
      const redClub = targetSource?.fighterRedClub || (targetSource as any)?.athleteRed?.contingent || "KONTINGEN MERAH";
      const targetDuration = targetSource?.roundDuration || 180;

      const preparedTgrs: TgrsMatchState = {
        ...tgrsState,
        id: "tgrs-" + (targetSource?.id || Date.now()),
        category: nextSub,
        categoryLabel: targetSource?.classCategory || catLabel,
        partai: cleanPartai,
        gelanggang: (targetSource?.arena ? String(targetSource.arena).replace(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase() : activeArena) || "A",
        activeCorner: "BLUE",
        bluePerformer: createDefaultPerformerState("BLUE", nextSub, blueName, blueClub),
        redPerformer: createDefaultPerformerState("RED", nextSub, redName, redClub),
        athleteName: blueName,
        contingent: blueClub,
        gender: (targetSource?.gender as any) || "PUTRA",
        ageCategory: targetSource?.division || targetSource?.ageCategory || "DEWASA",
        stage: targetSource?.stage || "PENYISIHAN",
        judgesCount: effectiveJurusCount || 10,
        targetDuration: targetDuration,
        isTimerRunning: false,
        isTimer2Running: false,
        isPerformerFinished: false,
        is3MinFinished: false,
        timerStartedAt: null,
        timerDuration: 0,
        timer3MinElapsed: 0,
        penaltyDisciplineTime: 0,
        penaltyDisciplineWeapon: 0,
        penaltyDisciplineCostume: 0,
        penaltyDisciplineOutArena: 0,
        penaltyDisciplineDropWeapon: 0,
        penaltyDisciplineImmobile: 0,
        penaltyPerformanceStamina: 0,
        finalScore: 0
      };

      setTgrsState(preparedTgrs);
      saveTgrsLiveState(preparedTgrs);
    }

    const resetState: MatchState = {
      ...(matchState || ({} as MatchState)),
      ...payload,
      isJurusCategory: isJurus,
      isJurus: isJurus,
      isTgr: isJurus,
      isSeni: isJurus,
      isTanding: !isJurus,
      discipline: isJurus ? "SENI" : "TANDING",
      kategori: resolvedKategori,
      category: resolvedKategori,
      status: MatchStatus.IDLE,
      activeRound: 1,
      timeLeft: payload.roundDuration || 120,
      scoreRed: 0,
      scoreBlue: 0,
      redStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
      blueStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
      redPenalties: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
      bluePenalties: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
      activeJuryPresses: { 1: null, 2: null, 3: null },
      juryScores: {
        1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
      },
      verification: undefined,
      showRoundOverPopup: false,
      secretarySignalNextRound: false,
      juryPanelLocked: false,
      dewanPanelLocked: false,
      winnerPublished: false,
      winnerColor: null,
      winnerMethod: undefined,
      logs: [
        {
          id: "reset-" + Date.now(),
          timestamp: Date.now(),
          round: 1,
          fighter: "RED",
          description: `Partai ${payload.matchNumber} (${payload.classCategory}) diaktifkan. Seluruh sistem siap penilaian.`,
          points: 0,
          source: "Sistem",
          type: "SYSTEM"
        }
      ]
    };

    const updated = await rtdbScoringEngine.handleResetMatch(resetState);
    setMatchState(updated);
    matchEngine.broadcast(updated);

    // Otomatis sinkronkan ke Jurus Detection Service (selalu panggil untuk TANDING maupun JURUS)
    jurusDetectionService.evaluateAndSyncMatch(updated);

    try {
      const raw = JSON.stringify(updated);
      localStorage.setItem("ipsi_match_state", raw);
      localStorage.setItem("jrz_silat_match_state", raw);
      localStorage.setItem(`jrz_silat_match_state_${(updated.arena || activeArena || "A").replace("ARENA ", "").trim()}`, raw);
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jrz_activate_match", { detail: updated }));
      window.dispatchEvent(new CustomEvent("force_match_sync", { detail: updated }));
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated"));
    }

    try {
      fetch("/api/match-state/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: resetState })
      }).catch(() => {});
      saveMatchStateToFirebase(updated, (updated.arena || activeArena || "A").replace("ARENA ", "").trim()).catch(() => {});
    } catch (err) {}
  };

  // Fungsi Reset Menyeluruh: Membersihkan seluruh data pertandingan & mempersiapkan aplikasi 100% bersih
  const handleCompleteReset = async (archiveFirst: boolean = false) => {
    sound.playClick();
    const arenaKey = (matchState?.arena || activeArena || "A").toUpperCase();

    // 1. Jika pengguna memilih 'Arsipkan data', simpan snapshot pertandingan ini ke arsip terlebih dahulu
    if (archiveFirst && matchState && matchState.id) {
      try {
        const archiveItem = {
          ...matchState,
          archivedAt: Date.now(),
          archivedDate: new Date().toLocaleString("id-ID")
        };
        const curArchiveRaw = window.localStorage.getItem("ipsi_finished_matches_archive");
        const archiveList = curArchiveRaw ? JSON.parse(curArchiveRaw) : [];
        archiveList.unshift(archiveItem);
        window.localStorage.setItem("ipsi_finished_matches_archive", JSON.stringify(archiveList));
        if (matchState.winnerColor) {
          archiveMatchToFirebase(matchState).catch(() => {});
        }
      } catch (e) {
        console.warn("Gagal mengarsipkan data pertandingan:", e);
      }
    }

    // 2. Format state baru yang 100% bersih dari seluruh sisa pertandingan sebelumnya
    const cleanDuration = matchState?.roundDuration || 120;
    const cleanState: MatchState = {
      id: "match-" + Date.now(),
      eventName: matchState?.eventName || "KEJUARAAN PENCAK SILAT NASIONAL",
      fighterRedName: "PESILAT MERAH",
      fighterRedClub: "SUDUT MERAH",
      fighterBlueName: "PESILAT BIRU",
      fighterBlueClub: "SUDUT BIRU",
      classCategory: matchState?.classCategory || "Tanding Bebas",
      matchNumber: "1",
      roundCount: 3,
      roundDuration: cleanDuration,
      timeLeft: cleanDuration,
      status: MatchStatus.IDLE,
      activeRound: 1,
      scoreRed: 0,
      scoreBlue: 0,
      redStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
      blueStats: { punches: 0, kicks: 0, drops: 0, locks: 0, warnings: 0, overrides: 0, pastPenaltiesDeductions: 0 },
      redPenalties: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
      bluePenalties: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
      activeJuryPresses: { 1: null, 2: null, 3: null },
      juryScores: {
        1: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        2: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } },
        3: { 1: { red: 0, blue: 0 }, 2: { red: 0, blue: 0 }, 3: { red: 0, blue: 0 } }
      },
      juryPressHistory: [],
      verification: undefined,
      showRoundOverPopup: false,
      secretarySignalNextRound: false,
      juryPanelLocked: true,
      dewanPanelLocked: true,
      winnerPublished: false,
      winnerColor: null,
      winnerMethod: undefined,
      isTieExtendedPossible: false,
      losingCornerColor: null,
      losingCornerNoScoreDuration: 0,
      lastLosingScore: null,
      showNextMatchPopup: false,
      gender: matchState?.gender || "PUTRA",
      stage: "PENYISIHAN",
      division: matchState?.division || "DEWASA",
      wmpThreshold: matchState?.wmpThreshold || 30,
      arena: arenaKey,
      logs: [
        {
          id: "reset-" + Date.now(),
          timestamp: Date.now(),
          round: 1,
          fighter: "RED",
          description: "Partai 1 diaktifkan. Seluruh data pertandingan telah direset bersih. Layar Juri & Dewan bersiap tanding.",
          points: 0,
          source: "Sistem",
          type: "SYSTEM"
        }
      ]
    };

    // 3. Simpan state bersih ke LocalStorage & AutoSave Vault serta bersihkan SEMUA data lama yang tersangkut
    if (typeof window !== "undefined") {
      try {
        const raw = JSON.stringify(cleanState);
        window.localStorage.setItem("ipsi_match_state", raw);
        window.localStorage.setItem("jrz_silat_match_state", raw);
        window.localStorage.setItem(`jrz_silat_match_state_${arenaKey}`, raw);

        // Bersihkan cache state browser
        window.localStorage.setItem("registered_athletes", JSON.stringify([]));
        window.localStorage.setItem("jrz_portal_athletes", JSON.stringify([]));
        window.localStorage.setItem("jrz_cached_participants", JSON.stringify([]));
        window.localStorage.setItem("jrz_cached_schedules", JSON.stringify([]));
        window.localStorage.setItem("jrz_cached_categories", JSON.stringify([]));
        window.localStorage.setItem("jrz_bracket_cleared", "true");
        window.localStorage.removeItem("jrz_active_category_filter");
        window.localStorage.setItem("jrz_archived_matches", JSON.stringify([]));
        window.localStorage.setItem("match_schedules", JSON.stringify([]));
        window.localStorage.setItem("silat_seni_match_history", JSON.stringify([]));
        window.localStorage.setItem("jrz_seni_queue", JSON.stringify([]));
        window.localStorage.setItem("jrz_tanding_queue", JSON.stringify([]));
        window.localStorage.removeItem("jrz_students");
        window.localStorage.removeItem("ipsi_jury_press_history");
        window.localStorage.removeItem("ipsi_brackets_data");
        window.localStorage.removeItem("ipsi_all_matches_schedule");
        window.localStorage.removeItem("ipsi_match_history");
        if (!archiveFirst) {
          window.localStorage.setItem("ipsi_finished_matches_archive", JSON.stringify([]));
        }

        Object.keys(window.localStorage).forEach(key => {
          if (
            key.startsWith("ipsi_autosave_") ||
            key.startsWith("ipsi_last_timer_tick_") ||
            key.startsWith("ipsi_schedule_") ||
            key.startsWith("rtdb_arenas/") ||
            key.startsWith("ipsi_session_") ||
            (key.startsWith("jrz_silat_match_state_") && key !== `jrz_silat_match_state_${arenaKey}`)
          ) {
            window.localStorage.removeItem(key);
          }
        });

        if (typeof window.sessionStorage !== "undefined") {
          window.sessionStorage.clear();
        }
      } catch (e) {
        console.warn("Gagal membersihkan cache lokal browser:", e);
      }
    }

    // Update Engine & Broadcast ke Firebase
    matchEngine.setState(cleanState);
    matchEngine.broadcast(cleanState);
    await rtdbScoringEngine.handleResetMatch(cleanState);
    dispatch({ type: "RESET_MATCH", cleanState });

    // 5. Sync ke Backend Server (Kosongkan state partai aktif, database turnamen, dan data peserta di server)
    try {
      await Promise.allSettled([
        fetch("/api/match-state/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: cleanState })
        }),
        fetch("/api/tournament/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }),
        fetch("/api/athletes/clear-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
      ]);
    } catch (e) {}

    // 6. Broadcast event ke seluruh tab dan panel agar antarmuka Loting, Bagan, Jadwal, dan Sekretaris langsung bersih 100%
    try {
      window.dispatchEvent(new CustomEvent("jrz_tournament_synced", {
        detail: { participants: [], categories: [], matches: [], bracketCleared: true }
      }));
      window.dispatchEvent(new CustomEvent("jrz_athletes_updated", { detail: { participants: [] } }));
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: [] }));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    // 7. Tutup modal konfirmasi reset & modal pengaturan
    setShowResetConfirmModal(false);
    setShowSettingsModal(false);
    sound.playGong();
  };

  const toggleFullscreen = (modeName: string) => {
    playAppSound(800, 0.08);
    const isCurrentlyFs = fullscreenMode === modeName || Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
    if (isCurrentlyFs) {
      setFullscreenMode(null);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        try {
          (document as any).webkitExitFullscreen();
        } catch {}
      }
      if (window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
        try {
          (window.screen.orientation as any).unlock();
        } catch (e) {
          console.warn("Screen orientation unlock failed:", e);
        }
      }
    } else {
      setFullscreenMode(modeName);
      // Attempt standard requestFullscreen
      const elem = document.documentElement;
      if (elem) {
        const reqFs = elem.requestFullscreen || (elem as any).webkitRequestFullscreen;
        if (reqFs) {
          reqFs.call(elem).then(() => {
            if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
              (window.screen.orientation as any).lock("landscape").catch((err: any) => {
                console.warn("Screen orientation lock to landscape failed:", err);
              });
            }
          }).catch((err: any) => {
            console.warn("Element HTML5 Fullscreen request blocked. Using CSS simulation backdrop.", err);
            if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
              (window.screen.orientation as any).lock("landscape").catch(() => {});
            }
          });
        }
      }
    }
  };

  const getPanelDisplayName = (mode: AppMode): string => {
    if (mode.startsWith("JURY")) {
      const num = mode.replace("JURY", "");
      return `Panel Juri ${num}`;
    }
    switch (mode) {
      case "DEWAN": return "Panel Ketua Pertandingan / Dewan";
      case "SEKRETARIS": return "Panel Sekretaris Pertandingan";
      case "OPERATOR": return "Panel Operator Timer & Skor";
      case "SCOREBOARD": return "Layar Utama Arena (Scoreboard Monitor)";
      case "JADWAL": return "Panel Jadwal Pertandingan";
      case "LOTING": return "Panel Loting & Bagan";
      case "LAPORAN": return "Panel Laporan & Rekap Nilai";
      case "BRACKET": return "Panel Bagan Turnamen";
      case "SIMULATOR": return "Panel Simulator Terpadu";
      default: return "Panel Pertandingan";
    }
  };

  const executeModeSwitch = (mode: typeof appMode) => {
    playAppSound(500, 0.08);
    setAppMode(mode);
    setFullscreenMode(null); // Reset when moving
    setIsSekretarisSubScreen(false);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (mode === "LANDING") {
          url.searchParams.delete("mode");
          url.searchParams.delete("panel");
          url.searchParams.delete("role");
        } else {
          url.searchParams.set("mode", mode);
        }
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleModeSwitch = (mode: typeof appMode) => {
    // Sesuai perintah: Seluruh menu panel langsung dibuka tanpa meminta PIN/password login
    executeModeSwitch(mode);
  };

  if (!matchState) {
    return (
      <div className="min-h-screen bg-[#0c041f] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <h2 className="font-sans font-bold text-lg">Inisialisasi Sistem Digital Scoreboard...</h2>
        <p className="text-sm text-slate-400 mt-2">Menyiapkan panel pertandingan...</p>
        <button
          onClick={() => setMatchState(createDefaultMatchState())}
          className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex items-center gap-2"
        >
          <Play className="w-4 h-4" /> Masuk ke Pertandingan Sekarang
        </button>
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-955/50 border border-purple-900/60 rounded-xl text-purple-200 text-xs max-w-md">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      themeMode === "LIGHT_CONTRAST" ? "bg-white text-slate-900" : "bg-[#0c041f] text-slate-100"
    } flex flex-col justify-between ${
      fullscreenMode || isMonitorOnly || appMode.startsWith("JURY")
        ? fullscreenMode === "SEKRETARIS"
          ? themeMode === "LIGHT_CONTRAST"
            ? "w-full min-h-screen bg-white relative z-50 text-slate-900"
            : "w-full min-h-screen bg-[#060211] relative z-50"
          : "h-screen w-screen overflow-hidden fixed inset-0 z-50"
        : ""
    }`} id="sim-hub-root">
      
      {/* UNIFIED AUTO-HIDING FULLSCREEN & KEMBALI OVERLAY (ACTIVE IN TOP-RIGHT CORNER) */}
      {!(
        (appMode === "SEKRETARIS" && isSekretarisSubScreen) ||
        appMode === "OPERATOR" ||
        appMode === "JADWAL" ||
        appMode === "LOTING" ||
        appMode === "BRACKET" ||
        appMode === "LAPORAN" ||
        appMode.startsWith("JURY")
      ) && (
        <FullScreenOverlay 
          onBack={
            isMonitorOnly
              ? () => {
                  sound.playClick();
                  if (onBackToHome) {
                    onBackToHome();
                  } else {
                    window.dispatchEvent(new CustomEvent("jrz_navigate_tab", { detail: "BERANDA" }));
                  }
                }
              : appMode !== "LANDING"
                ? () => handleModeSwitch("LANDING")
                : undefined
          } 
          showBack={Boolean(isMonitorOnly || appMode !== "LANDING")}
          backTitle={isMonitorOnly ? "Kembali ke Beranda JRZ SCORE" : "Kembali ke Pemilihan Peran Tanding"}
          backLabel={isMonitorOnly ? "KEMBALI KE BERANDA" : "KEMBALI"}
          isFullscreenProp={Boolean(fullscreenMode || nativeFs)}
          onToggleFullscreen={() => toggleFullscreen(appMode)}
        />
      )}

      {/* 1. INITIAL SPLASH SCREEN OR LANDING PAGE ROLE MENU SELECTION */}
      {appMode === "LANDING" && showSplash && (
        <SplashScreen
          onEnter={handleEnterSplash}
          themeMode={themeMode}
        />
      )}

      {appMode === "LANDING" && !showSplash && (
        <div 
          className="flex-grow flex flex-col justify-between items-center w-full font-sans select-none min-h-screen relative overflow-x-hidden p-3 sm:p-5 md:p-6 animate-fadeIn" 
          id="landing-page-container"
          style={{
            background: themeMode === "LIGHT_CONTRAST"
              ? "#ffffff"
              : "radial-gradient(ellipse at 50% 30%, #0c1842 0%, #040817 60%, #02040b 100%)"
          }}
        >
          {/* Full Screen Watermark Background: IMG_4754.JPG.jpeg */}
          <div 
            className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden" 
            aria-hidden="true"
          >
            <img 
              src="/IMG_4754.JPG.jpeg" 
              alt="Watermark Latar Belakang" 
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover object-center contrast-125 transition-opacity duration-300 ${
                themeMode === "LIGHT_CONTRAST" ? "opacity-[0.06] brightness-105" : "opacity-25 sm:opacity-30 brightness-95"
              }`} 
            />
            {/* Dark/Light vignette & gradient overlay for contrast and sleek arena aesthetic */}
            <div className={`absolute inset-0 transition-colors duration-300 ${
              themeMode === "LIGHT_CONTRAST"
                ? "bg-gradient-to-b from-white/95 via-white/98 to-slate-50"
                : "bg-gradient-to-b from-[#0c1842]/75 via-[#040817]/80 to-[#02040b]/92"
            }`} />
          </div>

          {/* TOMBOL MENU PENGATURAN BAGIAN KIRI ATAS LANDING PAGE (ICON GERIGI TANPA GRID/BOX) */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-30">
            <button
              onClick={() => {
                playAppSound(650, 0.08);
                setShowSettingsModal(true);
              }}
              className="group p-2 text-slate-400 hover:text-cyan-300 transition-all duration-300 cursor-pointer flex items-center justify-center active:scale-95 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              id="landing-settings-btn"
              title="Pengaturan Aplikasi"
              aria-label="Pengaturan"
            >
              <Settings className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-90 transition-transform duration-500 text-slate-300 group-hover:text-cyan-300" />
            </button>
          </div>
          {/* MAIN HERO & CENTERED BENTO-STYLE GRID */}
          <main className="flex-grow flex flex-col items-center justify-center py-2 sm:py-4 px-3 max-w-7xl mx-auto w-full z-10 my-auto animate-fadeIn">
            
            {/* MAIN LOGO UTAMA WITH ARENA LED GLOW */}
            <div className="flex flex-col justify-center items-center select-none w-full max-w-2xl px-2 py-0 mb-4 sm:mb-6">
              <div
                className="flex flex-col items-center bg-transparent border-none p-0 select-none group"
                id="matchsim-logo-header"
              >
                <img 
                  src="/jrzscoreutama.png" 
                  alt="JRZ Score Logo" 
                  loading="eager"
                  decoding="async"
                  className="max-h-32 sm:max-h-40 md:max-h-48 lg:max-h-54 w-auto max-w-full object-contain filter drop-shadow-[0_0_40px_rgba(59,130,246,0.65)] transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/logo_panel_dewan.svg")) {
                      target.src = "/logo_panel_dewan.svg";
                    }
                  }}
                />
              </div>
            </div>


            {/* DAFTAR PANEL MENU PERTANDINGAN (5 PANEL UTAMA: SEKRETARIS - DEWAN - OPERATOR - JURI - MONITOR) */}
            <div className="w-full max-w-6xl mb-4 sm:mb-6 px-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 w-full justify-items-center max-w-5xl mx-auto">
                
                {/* 1. SEKRETARIS */}
                <div 
                  onClick={() => handleModeSwitch("SEKRETARIS")}
                  className="group flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-95 select-none bg-transparent border-none p-2"
                  id="landing-card-sekretaris"
                  title="Masuk ke Panel Sekretaris Pertandingan"
                >
                  <div className="my-1 sm:my-2 flex items-center justify-center">
                    <img 
                      src="/iconsekretaris.png" 
                      alt="Sekretaris" 
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(147,51,234,0.7)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.95)] transition-all duration-300 z-10" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className={`font-sans font-black text-xs sm:text-sm tracking-wider uppercase mt-1 transition-colors ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-900 group-hover:text-purple-700" : "text-white group-hover:text-purple-300"
                  }`}>
                    SEKRETARIS
                  </span>
                </div>

                {/* 2. DEWAN */}
                <div 
                  onClick={() => handleModeSwitch("DEWAN")}
                  className="group flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-95 select-none bg-transparent border-none p-2"
                  id="landing-card-dewan"
                  title="Masuk ke Panel Dewan (Ketua Pertandingan)"
                >
                  <div className="my-1 sm:my-2 flex items-center justify-center">
                    <img 
                      src="/ketuadewan.png" 
                      alt="Ketua Dewan" 
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(37,99,235,0.7)] group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.95)] transition-all duration-300 z-10" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className={`font-sans font-black text-xs sm:text-sm tracking-wider uppercase mt-1 transition-colors ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-900 group-hover:text-blue-700" : "text-white group-hover:text-cyan-300"
                  }`}>
                    KETUA DEWAN
                  </span>
                </div>

                {/* 3. TIMER PERTANDINGAN (OPERATOR) */}
                <div 
                  onClick={() => handleModeSwitch("OPERATOR")}
                  className="group flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-95 select-none bg-transparent border-none p-2"
                  id="landing-card-timer"
                  title="Masuk ke Panel Timer Pertandingan"
                >
                  <div className="my-1 sm:my-2 flex items-center justify-center">
                    <img 
                      src={iconTimer} 
                      alt="Timer Pertandingan" 
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(0,128,0,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(52,211,153,0.95)] transition-all duration-300 z-10" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.icon-fallback') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="icon-fallback hidden w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-none bg-emerald-500/10 border border-emerald-400/40 items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(0,128,0,0.35)]">
                      <Timer className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-300" />
                    </div>
                  </div>
                  <span className={`font-sans font-black text-xs sm:text-sm tracking-wider uppercase mt-1 transition-colors ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-emerald-300"
                  }`}>
                    TIMER PERTANDINGAN
                  </span>
                </div>

                {/* 4. JURI */}
                <div 
                  onClick={() => {
                    setShowJuryModal(true);
                  }}
                  className="group flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-95 select-none bg-transparent border-none p-2"
                  id="landing-card-juri"
                  title="Masuk ke Panel Gawai Juri"
                >
                  <div className="my-1 sm:my-2 flex items-center justify-center">
                    <img 
                      src="/juri.png" 
                      alt="Panel Juri" 
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)] group-hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.95)] transition-all duration-300 z-10" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className={`font-sans font-black text-xs sm:text-sm tracking-wider uppercase mt-1 transition-colors ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-900 group-hover:text-amber-700" : "text-white group-hover:text-amber-300"
                  }`}>
                    PANEL JURI
                  </span>
                </div>

                {/* 5. MONITOR ARENA LED */}
                <div 
                  onClick={() => handleModeSwitch("SCOREBOARD")}
                  className="group flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-95 select-none bg-transparent border-none p-2"
                  id="landing-card-monitor"
                  title="Buka Layar Monitor Skor (Arena LED)"
                >
                  <div className="my-1 sm:my-2 flex items-center justify-center">
                    <img 
                      src="/iconmonitor.png" 
                      alt="Monitor Arena" 
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(225,29,72,0.7)] group-hover:drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] transition-all duration-300 z-10" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className={`font-sans font-black text-xs sm:text-sm tracking-wider uppercase mt-1 transition-colors ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-900 group-hover:text-rose-700" : "text-white group-hover:text-rose-300"
                  }`}>
                    MONITOR ARENA
                  </span>
                </div>

              </div>
            </div>

            {/* DEVELOPED BY ATTRIBUTION */}
            <div className="w-full text-center mt-2 mb-2 select-none" id="landing-developer-attribution">
              <span className={`text-xs sm:text-sm font-semibold tracking-wide font-mono transition-colors ${
                themeMode === "LIGHT_CONTRAST"
                  ? "text-slate-600"
                  : "text-slate-300"
              }`}>
                developed by : Jaka Oktorian
              </span>
            </div>

            {/* TULISAN BERGERAK KANAN KE KIRI (RUNNING TEXT TICKER) SESUAI REQUEST USER */}
            <div 
              className={`w-full max-w-5xl mx-auto mt-2 mb-1 overflow-hidden border border-yellow-500/40 relative shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all ${
                themeMode === "LIGHT_CONTRAST"
                  ? "bg-slate-900/95"
                  : "bg-black/70 backdrop-blur-md"
              }`}
              id="landing-running-text-ticker"
            >
              {/* Fade gradient di tepi kiri & kanan untuk efek visual halus */}
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 z-10 bg-gradient-to-r from-black/90 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 z-10 bg-gradient-to-l from-black/90 to-transparent pointer-events-none" />

              <div className="py-2 sm:py-2.5 px-3 flex items-center overflow-hidden">
                <div className="animate-marquee-flow flex items-center gap-8 sm:gap-12 whitespace-nowrap text-xs sm:text-sm md:text-[14.5px] font-bold font-sans tracking-wide text-yellow-300 select-none">
                  {[1, 2, 3, 4].map((idx) => (
                    <span key={idx} className="flex items-center gap-3">
                      <span className="text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] flex items-center gap-1.5">
                        <span>Selamat datang di aplikasi jrz score dan selamat bertanding | informasi aplikasi hubungi</span>
                        <a 
                          href="https://wa.me/6281379876424" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-yellow-200 hover:text-white underline decoration-yellow-400 decoration-1 underline-offset-2 transition-colors cursor-pointer"
                          title="Hubungi via WhatsApp (0813 7987 6424)"
                        >
                          Whatsapp 0813 7987 6424
                        </a>
                      </span>
                      <span className="text-yellow-500/70 font-black px-1">✦</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </main>

          {/* JURI GAWAI SELECTION OVERLAY MODAL */}
          {showJuryModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fadeIn">
              <div className="bg-gradient-to-b from-[#0e1633] via-[#090e24] to-[#040614] border-2 border-indigo-500/60 rounded-none p-6 sm:p-7 max-w-md w-full text-center relative shadow-[0_0_60px_rgba(79,70,229,0.4)]">
                
                <button 
                  onClick={() => setShowJuryModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-none hover:bg-indigo-950/60 text-indigo-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-14 h-14 rounded-none border-2 border-amber-400 bg-amber-500/10 flex items-center justify-center text-amber-400 mx-auto mb-2.5 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <User className="w-7 h-7" />
                </div>

                <h3 className="font-sans font-black text-base tracking-widest text-white uppercase mb-1">
                  PILIH GAWAI JURI
                </h3>
                <p className="text-[10px] text-cyan-300/80 mb-4 font-mono uppercase tracking-wider">
                  SISTEM SINKRONISASI MULTI-GAWAI JURI IPSI 2026
                </p>

                {/* KONTEN GAWAI JURI OTOMATIS BERDASARKAN KATEGORI PARTAI DARI SEKRETARIS */}
                {!isCurrentMatchTgrs ? (
                  /* KONTEN GAWAI JURI TANDING (KHUSUS 3 JURI) */
                  <div className="space-y-2.5">
                    <div className="text-[11px] text-blue-300 font-mono font-bold tracking-wider uppercase mb-2 bg-blue-950/60 p-2 border border-blue-500/30">
                      🥋 Kategori Aktif: TANDING ({matchState.classCategory || "Kelas Bebas"}) • Khusus 3 Juri
                    </div>
                    {[
                      { id: "JURY1", label: "Juri 1 (Gawai Depan)" },
                      { id: "JURY2", label: "Juri 2 (Gawai Kanan)" },
                      { id: "JURY3", label: "Juri 3 (Gawai Kiri)" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowJuryModal(false);
                          setManualCategoryOverride(null);
                          handleModeSwitch(item.id as AppMode);
                        }}
                        className="w-full bg-[#112048] hover:bg-[#18306d] border border-blue-500/40 text-slate-100 hover:text-white transition-all py-3 px-4 rounded-none font-black text-xs uppercase tracking-wider active:scale-95 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-blue-950/80 px-2 py-0.5 border border-blue-400/30">BUKA</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* KONTEN GAWAI JURI JURUS (MENYESUAIKAN JUMLAH JURI PANEL SEKRETARIS: 3..10) */
                  <div>
                    <div className="text-[11px] text-amber-300 font-mono font-bold tracking-wider uppercase mb-2 bg-amber-950/60 p-2 border border-amber-500/30">
                      ⚡ Kategori Aktif: JURUS ({matchCategoryInfo.categoryLabel}) • {effectiveJurusCount} Juri
                    </div>
                    <div className={`grid ${effectiveJurusCount <= 4 ? "grid-cols-2" : effectiveJurusCount <= 6 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"} gap-2 max-h-[45vh] overflow-y-auto p-1`}>
                      {Array.from({ length: effectiveJurusCount }, (_, i) => i + 1).map((jId) => (
                        <button
                          key={jId}
                          onClick={() => {
                            setShowJuryModal(false);
                            setManualCategoryOverride(null);
                            handleModeSwitch(`JURY${jId}` as AppMode);
                          }}
                          className="bg-gradient-to-b from-[#161a42] to-[#0c102a] hover:from-[#212763] hover:to-[#12183e] border border-purple-500/40 hover:border-purple-400 text-slate-100 hover:text-white transition-all p-2.5 rounded-none font-black text-xs uppercase tracking-wider active:scale-95 cursor-pointer shadow-md flex flex-col items-center justify-center gap-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        >
                          <span className="text-amber-400 font-black text-xs">JURI {jId}</span>
                          <span className="text-[9px] font-mono text-purple-200/80">Gawai {jId}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 text-[9.5px] text-cyan-400/60 font-mono tracking-widest border-t border-indigo-500/20 pt-3">
                  IPSI PERTANDINGAN v3.2.0 • ARENA LED
                </div>
              </div>
            </div>
          )}

          {/* MODAL PENGATURAN APLIKASI (DIBUKA DARI ICON GERIGI KIRI ATAS) */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-55 animate-fadeIn">
              <div className={`${
                themeMode === "LIGHT_CONTRAST"
                  ? "bg-white border-2 border-slate-700 text-slate-900 shadow-2xl"
                  : "bg-[#0b1329] border-2 border-cyan-500/60 text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.35)]"
              } rounded-none p-5 sm:p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto`}>
                
                {/* Header Modal */}
                <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
                  themeMode === "LIGHT_CONTRAST" ? "border-slate-300" : "border-slate-800"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-none border border-cyan-400/50 bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <Settings className="w-5 h-5 text-cyan-500 animate-spin" style={{ animationDuration: "12s" }} />
                    </div>
                    <div>
                      <h3 className={`font-sans font-black text-sm sm:text-base tracking-wider uppercase ${
                        themeMode === "LIGHT_CONTRAST" ? "text-slate-900" : "text-white"
                      }`}>
                        PENGATURAN APLIKASI
                      </h3>
                      <p className={`text-[10px] font-mono uppercase tracking-wider ${
                        themeMode === "LIGHT_CONTRAST" ? "text-cyan-700 font-bold" : "text-cyan-300/70"
                      }`}>
                        JRZ SCORE DIGITAL SCORING TANDING (IPSI 2026)
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowLogoutConfirm(false);
                    }}
                    className={`p-1.5 rounded-none transition-all cursor-pointer ${
                      themeMode === "LIGHT_CONTRAST" ? "hover:bg-slate-200 text-slate-600 hover:text-slate-900" : "hover:bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                    title="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* PILIHAN TEMA TAMPILAN: 1. MODE LED ARENA & 2. MODE WARNA PUTIH DAN BERKONTRAS TINGGI */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-mono font-bold uppercase text-amber-500 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        PILIHAN TEMA TAMPILAN:
                      </label>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${
                        themeMode === "LIGHT_CONTRAST"
                          ? "bg-amber-500/20 text-amber-700 border-amber-500/50"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      }`}>
                        {themeMode === "LIGHT_CONTRAST" ? "MODE PUTIH AKTIF" : "MODE LED ARENA AKTIF"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Pilihan 1: Mode Led arena */}
                      <button
                        type="button"
                        onClick={() => {
                          playAppSound(650, 0.05);
                          handleSetTheme("LED_ARENA");
                        }}
                        className={`p-2.5 rounded-none border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          themeMode === "LED_ARENA"
                            ? "bg-gradient-to-br from-[#0c1c44] to-[#060e22] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/60"
                            : themeMode === "LIGHT_CONTRAST"
                              ? "bg-white border-slate-300 hover:border-slate-500 text-slate-700"
                              : "bg-[#09132c]/80 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-sans font-black text-xs uppercase tracking-wider ${
                            themeMode === "LED_ARENA" ? "text-cyan-300" : themeMode === "LIGHT_CONTRAST" ? "text-slate-800" : "text-slate-300"
                          }`}>
                            1. Mode LED Arena
                          </span>
                          <Moon className={`w-4 h-4 ${themeMode === "LED_ARENA" ? "text-cyan-300" : "text-slate-400"}`} />
                        </div>
                        <span className={`text-[9px] leading-tight ${themeMode === "LIGHT_CONTRAST" ? "text-slate-600" : "text-slate-400"}`}>
                          Tema Gelap Cyber Arena dengan efek neon glow LED standar gelanggang malam hari.
                        </span>
                      </button>

                      {/* Pilihan 2: Mode tampilan warna putih dan berkontras tinggi */}
                      <button
                        type="button"
                        onClick={() => {
                          playAppSound(650, 0.05);
                          handleSetTheme("LIGHT_CONTRAST");
                        }}
                        className={`p-2.5 rounded-none border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          themeMode === "LIGHT_CONTRAST"
                            ? "bg-gradient-to-br from-white to-amber-50/50 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-2 ring-amber-500 text-slate-900"
                            : "bg-[#09132c]/80 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-sans font-black text-xs uppercase tracking-wider ${
                            themeMode === "LIGHT_CONTRAST" ? "text-amber-700 font-black" : "text-slate-300"
                          }`}>
                            2. Mode Warna Putih & Kontras Tinggi
                          </span>
                          <Sun className={`w-4 h-4 ${themeMode === "LIGHT_CONTRAST" ? "text-amber-600" : "text-slate-400"}`} />
                        </div>
                        <span className={`text-[9px] leading-tight ${
                          themeMode === "LIGHT_CONTRAST" ? "text-slate-700" : "text-slate-400"
                        }`}>
                          Mode tampilan warna putih dan ber-kontras tinggi, disesuaikan pada tiap panel agar optimal dengan tema background putih.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 1. GELANGGANG / ARENA SELECTION */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2`}>
                    <label className="text-[10px] font-mono font-bold uppercase text-cyan-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-500" />
                      PILIHAN GELANGGANG AKTIF:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["A", "B", "C", "D"].map((arenaKey) => (
                        <button
                          key={arenaKey}
                          onClick={() => {
                            playAppSound(600, 0.05);
                            setActiveArenaState(arenaKey);
                            rtdbScoringEngine.switchArena(arenaKey);
                            setActiveArena(arenaKey);
                          }}
                          className={`py-2 px-2.5 rounded-none font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                            activeArena === arenaKey
                              ? "bg-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-[1.02]"
                              : themeMode === "LIGHT_CONTRAST"
                                ? "bg-white text-slate-800 border-slate-300 hover:border-cyan-500"
                                : "bg-[#0b1633] text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-white"
                          }`}
                        >
                          GEL. {arenaKey}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. DURASI STANDAR RONDE */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2`}>
                    <label className="text-[10px] font-mono font-bold uppercase text-emerald-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      DURASI WAKTU TANDING (PER RONDE):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "1 MENIT (60s)", val: 60 },
                        { label: "1.5 MENIT (90s)", val: 90 },
                        { label: "2 MENIT (120s)", val: 120 }
                      ].map((d) => (
                        <button
                          key={d.val}
                          onClick={() => {
                            playAppSound(600, 0.05);
                            handleUpdateMetadata({
                              roundDuration: d.val,
                              timeLeft: matchState.status === MatchStatus.IDLE ? d.val : matchState.timeLeft
                            });
                          }}
                          className={`py-2 px-1.5 rounded-none font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider transition-all cursor-pointer border text-center ${
                            matchState.roundDuration === d.val
                              ? "bg-emerald-600 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                              : themeMode === "LIGHT_CONTRAST"
                                ? "bg-white text-slate-800 border-slate-300 hover:border-emerald-500"
                                : "bg-[#0b1633] text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-white"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. UJI SUARA & AUDIO ARENA */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2`}>
                    <label className="text-[10px] font-mono font-bold uppercase text-amber-600 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      UJI SUARA BELL & GONG ARENA:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => sound.playGong()}
                        className="py-2 px-3 rounded-none bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        TES GONG
                      </button>
                      <button
                        onClick={() => sound.playBuzzer()}
                        className="py-2 px-3 rounded-none bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                        TES BUZZER
                      </button>
                    </div>
                  </div>

                  {/* 4. LAYAR PENUH (FULLSCREEN) */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none flex items-center justify-between`}>
                    <div>
                      <span className={`font-bold block text-xs uppercase tracking-wider ${
                        themeMode === "LIGHT_CONTRAST" ? "text-slate-800" : "text-slate-200"
                      }`}>
                        MODE LAYAR PENUH (FULLSCREEN)
                      </span>
                      <span className={`text-[10px] ${themeMode === "LIGHT_CONTRAST" ? "text-slate-500" : "text-slate-400"}`}>
                        Maksimalkan tampilan layar penuh
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        toggleFullscreen("LANDING");
                      }}
                      className="py-1.5 px-3 rounded-none bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-400/60 text-indigo-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      FULLSCREEN
                    </button>
                  </div>

                  {/* 5. RESET DATA PERTANDINGAN */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none flex items-center justify-between`}>
                    <div>
                      <span className="font-bold text-rose-600 block text-xs uppercase tracking-wider">
                        RESET PERTANDINGAN
                      </span>
                      <span className={`text-[10px] ${themeMode === "LIGHT_CONTRAST" ? "text-slate-500" : "text-slate-400"}`}>
                        Bersihkan seluruh data & persiapkan partai baru
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowResetConfirmModal(true);
                      }}
                      className="py-1.5 px-3 rounded-none bg-red-955/60 hover:bg-red-800 border border-red-600/60 text-red-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      RESET
                    </button>
                  </div>

                  {/* 6. CADANGAN & PEMULIHAN DATA (BACKUP & RESTORE JSON) */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase text-cyan-500 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-500" />
                        CADANGAN & PEMULIHAN DATA (BACKUP JSON):
                      </label>
                      <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${
                        themeMode === "LIGHT_CONTRAST"
                          ? "bg-slate-200 text-slate-800 border-slate-300"
                          : "bg-cyan-950/60 text-cyan-300 border-cyan-800"
                      }`}>
                        {backupStats.athletes} Atlet • {backupStats.matches} Partai • {backupStats.archives} Riwayat
                      </span>
                    </div>

                    <p className={`text-[9.5px] leading-relaxed ${themeMode === "LIGHT_CONTRAST" ? "text-slate-600" : "text-slate-400"}`}>
                      Ekspor seluruh data atlet terdaftar, jadwal pertandingan, dan riwayat arsip ke file <strong>JSON lokal</strong> sebagai cadangan aman, atau impor kembali data dari file cadangan sebelumnya.
                    </p>

                    {backupToast && (
                      <div className={`p-2 rounded-none text-[10px] font-bold flex items-center gap-1.5 border animate-fadeIn ${
                        backupToast.type === "success"
                          ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                          : "bg-rose-950/80 border-rose-500 text-rose-300"
                      }`}>
                        {backupToast.type === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>{backupToast.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* Tombol Ekspor */}
                      <button
                        type="button"
                        disabled={isExportingBackup}
                        onClick={handleExportBackup}
                        className="py-2.5 px-3 rounded-none bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 border border-emerald-400/50"
                        title="Ekspor seluruh data atlet dan pertandingan ke file JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-200" />
                        <span>{isExportingBackup ? "MENYIAPKAN..." : "EKSPOR CADANGAN (JSON)"}</span>
                      </button>

                      {/* Tombol Impor */}
                      <label
                        className="py-2.5 px-3 rounded-none bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border border-cyan-400/50 text-center"
                        title="Impor kembali data dari file JSON cadangan lokal"
                      >
                        <Upload className="w-3.5 h-3.5 text-cyan-200" />
                        <span>IMPOR CADANGAN (JSON)</span>
                        <input
                          ref={backupFileInputRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={handleBackupFileSelected}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 6. ISOLASI EVENT & FIREBASE REALTIME DATABASE */}
                  <div className={`${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-50 border-slate-300" : "bg-[#070e22] border-slate-800"
                  } border p-3 rounded-none space-y-2`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-emerald-500" />
                        ISOLASI EVENT FIREBASE CLOUD:
                      </label>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                        FIREBASE RTDB ONLINE
                      </span>
                    </div>
                    <p className={`text-[10.5px] leading-relaxed ${themeMode === "LIGHT_CONTRAST" ? "text-slate-600" : "text-slate-400"}`}>
                      Event aktif: <strong className="text-emerald-400">{activeEventName}</strong>. Setiap event memiliki ruang lingkup database Firebase terisolasi penuh sehingga Event A tidak akan mengganggu Event B.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playAppSound(650, 0.05);
                        setShowEventScopeModal(true);
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-emerald-400 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>KELOLA ISOLASI EVENT FIREBASE</span>
                    </button>
                  </div>

                </div>

                {/* Footer Modal */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                  themeMode === "LIGHT_CONTRAST" ? "border-slate-300" : "border-slate-800"
                }`}>
                  <span className={`text-[9.5px] font-mono uppercase tracking-widest ${
                    themeMode === "LIGHT_CONTRAST" ? "text-slate-600" : "text-slate-400"
                  }`}>
                    IPSI 2026 STANDAR • v3.2.0
                  </span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowLogoutConfirm(false);
                    }}
                    className={`py-1.5 px-4 rounded-none font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      themeMode === "LIGHT_CONTRAST"
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    TUTUP
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* MODAL ISOLASI EVENT & FIREBASE REALTIME DATABASE */}
          <EventScopeModal
            isOpen={showEventScopeModal}
            onClose={() => setShowEventScopeModal(false)}
          />

          {/* MODAL KONFIRMASI PEMULIHAN CADANGAN DATA (RESTORE BACKUP JSON) */}
          {pendingRestorePayload && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-60 animate-fadeIn">
              <div className={`${
                themeMode === "LIGHT_CONTRAST"
                  ? "bg-white border-2 border-slate-700 text-slate-900"
                  : "bg-[#0b1329] border-2 border-cyan-500/80 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
              } p-5 sm:p-6 max-w-md w-full space-y-4`}>
                <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/30">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>KONFIRMASI IMPOR CADANGAN (JSON)</span>
                  </div>
                  <button
                    onClick={() => setPendingRestorePayload(null)}
                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <p className={themeMode === "LIGHT_CONTRAST" ? "text-slate-700" : "text-slate-300"}>
                    Berkas cadangan valid. Rincian basis data yang akan dipulihkan:
                  </p>
                  <div className={`p-3 rounded-none border font-mono space-y-1.5 ${
                    themeMode === "LIGHT_CONTRAST" ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-[#070e22] border-slate-700 text-slate-200"
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Atlet:</span>
                      <strong className="text-cyan-400">{pendingRestorePayload.summary.totalAthletes} Orang</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jadwal Pertandingan:</span>
                      <strong className="text-emerald-400">{pendingRestorePayload.summary.totalMatches} Partai</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Riwayat Selesai (Arsip):</span>
                      <strong className="text-amber-400">{pendingRestorePayload.summary.totalArchives} Partai</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Waktu Cadangan:</span>
                      <span className="text-slate-300">{new Date(pendingRestorePayload.timestamp).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="font-bold uppercase text-[10px] block mb-1.5 text-cyan-400 font-mono">
                      PILIH METODE PEMULIHAN:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode("replace")}
                        className={`p-2.5 border text-left rounded-none transition-all cursor-pointer ${
                          restoreMode === "replace"
                            ? "bg-cyan-900/40 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400"
                            : "bg-[#070e22] border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="font-bold text-[10.5px] uppercase">1. Gantikan Data</div>
                        <div className="text-[8.5px] text-slate-400 leading-tight mt-0.5">Ganti database lokal dengan file cadangan ini.</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestoreMode("merge")}
                        className={`p-2.5 border text-left rounded-none transition-all cursor-pointer ${
                          restoreMode === "merge"
                            ? "bg-cyan-900/40 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400"
                            : "bg-[#070e22] border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="font-bold text-[10.5px] uppercase">2. Gabungkan Data</div>
                        <div className="text-[8.5px] text-slate-400 leading-tight mt-0.5">Pertahankan data lama & tambahkan data dari file.</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPendingRestorePayload(null)}
                    className="px-3.5 py-2 rounded-none bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isRestoringBackup}
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 rounded-none bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRestoringBackup ? "MEMULIHKAN..." : "PULIHKAN CADANGAN SEKARANG"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLOATING ACTION ICONS (CORNER BOTTOM-RIGHT) REMOVED PER USER REQUEST */}

        </div>
      )}

      {/* 2. DYNAMIC SINGLE CONTAINER RENDERINGS BASED ON SELECTED ROLE */}
      <React.Suspense fallback={<PanelLoadingFallback />}>
        {appMode !== "LANDING" && appMode !== "SIMULATOR" && (
          <div className={`flex-grow flex flex-col justify-center select-none ${
          nativeFs || isMonitorOnly || fullscreenMode || appMode.startsWith("JURY") || (appMode === "OPERATOR" && isCurrentMatchTgrs)
            ? "p-0 w-screen h-[100dvh] max-w-none overflow-hidden fixed inset-0 z-50 bg-[#030716]" 
            : appMode === "DEWAN"
              ? "p-2 sm:p-4 w-full animate-fadeIn"
              : appMode === "SCOREBOARD"
                ? "p-1 sm:p-2 w-full h-full max-w-[1920px] mx-auto animate-fadeIn flex flex-col justify-center overflow-hidden"
                : "p-4 max-w-7xl mx-auto w-full animate-fadeIn"
        }`}>
          
          {/* Render individual mode widgets with complete callbacks */}
          {appMode === "SCOREBOARD" && (
            isCurrentMatchTgrs ? (
              <TgrsMonitorDisplay 
                key={`monitor-tgrs-${tgrsState.category}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                state={tgrsState}
                onBackToLanding={() => handleModeSwitch("LANDING")}
                onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                onToggleFullscreen={() => toggleFullscreen("SCOREBOARD")}
                isFullscreen={fullscreenMode === "SCOREBOARD"}
              />
            ) : (
              <ScoreboardView2 
                key={`monitor-tanding-${matchState.matchNumber}-${matchState.id}`}
                state={matchState} 
                onBack={() => handleModeSwitch("LANDING")}
                isMonitorMode={isMonitorOnly}
              />
            )
          )}

          {appMode === "DEWAN" && (
            isCurrentMatchTgrs ? (
              (tgrsState.category === "GANDA" || tgrsState.category === "SOLO_KREATIF") ? (
                <TgrsGandaSoloDewanControl 
                  key={`dewan-ganda-solo-${tgrsState.category}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                  state={tgrsState}
                  onUpdateState={(updater) => {
                    setTgrsState((prev) => {
                      const next = updater(prev);
                      setTimeout(() => saveTgrsLiveState(next), 0);
                      return next;
                    });
                  }}
                  onBackToLanding={() => handleModeSwitch("LANDING")}
                  onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                  onToggleFullscreen={() => toggleFullscreen("DEWAN")}
                  isFullscreen={fullscreenMode === "DEWAN"}
                />
              ) : (
                <TgrsDewanControl 
                  key={`dewan-tgrs-tunggal-${tgrsState.category}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                  state={tgrsState}
                  onUpdateState={(updater) => {
                    setTgrsState((prev) => {
                      const next = updater(prev);
                      setTimeout(() => saveTgrsLiveState(next), 0);
                      return next;
                    });
                  }}
                  onBackToLanding={() => handleModeSwitch("LANDING")}
                  onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                  onToggleFullscreen={() => toggleFullscreen("DEWAN")}
                  isFullscreen={fullscreenMode === "DEWAN"}
                />
              )
            ) : (
              <DewanPanel 
                key={`dewan-tanding-${matchState.matchNumber}-${matchState.id}`}
                state={matchState}
                onTimerCommand={handleTimerCommand}
                onRoundAction={handleRoundAction}
                onDewanAction={handleDewanAction}
                onUpdateMetadata={handleUpdateMetadata}
                onResetMatch={handleResetMatch}
                onStartVerification={handleStartVerification}
                onResetVerification={handleResetVerification}
                onApplyVerification={handleApplyVerification}
                onBack={() => handleModeSwitch("LANDING")}
                onToggleFullscreen={() => toggleFullscreen("DEWAN")}
                isFullscreen={fullscreenMode === "DEWAN"}
              />
            )
          )}

          {appMode === "SEKRETARIS" && (
            <SekretarisPanel
              key="panel-sekretaris-main"
              state={matchState}
              onUpdateMetadata={handleUpdateMetadata}
              onResetMatch={handleResetMatch}
              onTimerCommand={handleTimerCommand}
              onRoundAction={handleRoundAction}
              onDewanAction={handleDewanAction}
              onBack={() => handleModeSwitch("LANDING")}
              onToggleFullscreen={() => toggleFullscreen("SEKRETARIS")}
              isFullscreen={fullscreenMode === "SEKRETARIS"}
              onSubScreenChange={handleSubScreenChange}
              onOpenOperatorPanel={async (matchItem?: any) => {
                if (matchItem) {
                  await handleResetMatch(matchItem);
                }
                handleModeSwitch("OPERATOR");
              }}
            />
          )}

          {appMode.startsWith("JURY") && (
            (() => {
              const juryNum = parseInt(appMode.replace("JURY", ""), 10) || 1;
              if (isCurrentMatchTgrs) {
                const isGandaSolo = tgrsState.category === "GANDA" || tgrsState.category === "SOLO_KREATIF" || (tgrsState.category as string) === "TUNGGAL_BEBAS";
                if (isGandaSolo) {
                  return (
                    <TgrsGandaSoloJuryPad
                      key={`jury-tgrs-ganda-solo-${tgrsState.category}-${juryNum}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                      state={{
                        ...tgrsState,
                        judgesCount: effectiveJurusCount
                      }}
                      activeJudgeId={juryNum}
                      onUpdateState={(updater) => {
                        setTgrsState((prev) => {
                          const next = updater(prev);
                          setTimeout(() => saveTgrsLiveState(next), 0);
                          return next;
                        });
                      }}
                      onBackToLanding={() => handleModeSwitch("LANDING")}
                      onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                      onToggleFullscreen={() => toggleFullscreen(appMode)}
                      isFullscreen={fullscreenMode === appMode}
                    />
                  );
                }

                return (
                  <TgrsJuryPad 
                    key={`jury-tgrs-${tgrsState.category}-${juryNum}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                    state={{
                      ...tgrsState,
                      judgesCount: effectiveJurusCount
                    }}
                    activeJudgeId={juryNum}
                    onUpdateState={(updater) => {
                      setTgrsState((prev) => {
                        const next = updater(prev);
                        setTimeout(() => saveTgrsLiveState(next), 0);
                        return next;
                      });
                    }}
                    onBackToLanding={() => handleModeSwitch("LANDING")}
                    onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                    onToggleFullscreen={() => toggleFullscreen(appMode)}
                    isFullscreen={fullscreenMode === appMode}
                  />
                );
              }
              return (
                <JuryPanel 
                  key={`jury-tanding-${juryNum}-${matchState.matchNumber}-${matchState.id}`}
                  state={matchState} 
                  onJuryPress={handleJuryPress} 
                  onJuryVote={handleJuryVote} 
                  defaultJuryId={juryNum > 3 ? 1 : juryNum} 
                  onBack={() => handleModeSwitch("LANDING")}
                  onToggleFullscreen={() => toggleFullscreen(appMode)}
                  isFullscreen={fullscreenMode === appMode}
                  hideJurySelector={true}
                />
              );
            })()
          )}

          {appMode === "OPERATOR" && (
            isCurrentMatchTgrs ? (
              <TgrsTimerOperator
                key={`operator-tgrs-${tgrsState.category}-${tgrsState.partai || matchState.matchNumber}-${matchState.id}`}
                state={tgrsState}
                matchState={matchState}
                onUpdateState={(updater) => {
                  setTgrsState((prev) => {
                    const next = updater(prev);
                    setTimeout(() => saveTgrsLiveState(next), 0);
                    return next;
                  });
                }}
                onBack={() => handleModeSwitch("LANDING")}
                onSwitchToTanding={() => handleSwitchCategory("TANDING")}
                onToggleFullscreen={() => toggleFullscreen("OPERATOR")}
                isFullscreen={Boolean(fullscreenMode === "OPERATOR" || nativeFs)}
              />
            ) : (
              <OperatorPanel
                key={`operator-tanding-${matchState.matchNumber}-${matchState.id}`}
                matchState={matchState}
                onTimerCommand={handleTimerCommand}
                onRoundAction={handleRoundAction}
                onUpdateMetadata={handleUpdateMetadata}
                onResetMatch={handleResetMatch}
                onBack={() => handleModeSwitch("LANDING")}
                onSwitchToTgrs={() => handleSwitchCategory("TGRS")}
                onToggleFullscreen={() => toggleFullscreen("OPERATOR")}
                isFullscreen={Boolean(fullscreenMode === "OPERATOR" || nativeFs)}
              />
            )
          )}

          {appMode === "JADWAL" && (
            <SekretarisPanel
              key="panel-sekretaris-jadwal"
              initialTab="KONTROL"
              state={matchState}
              onUpdateMetadata={handleUpdateMetadata}
              onResetMatch={handleResetMatch}
              onTimerCommand={handleTimerCommand}
              onRoundAction={handleRoundAction}
              onDewanAction={handleDewanAction}
              onBack={() => handleModeSwitch("LANDING")}
              onToggleFullscreen={() => toggleFullscreen("SEKRETARIS")}
              isFullscreen={fullscreenMode === "SEKRETARIS"}
              onSubScreenChange={handleSubScreenChange}
              onOpenOperatorPanel={async (matchItem?: any) => {
                if (matchItem) {
                  await handleResetMatch(matchItem);
                }
                handleModeSwitch("OPERATOR");
              }}
            />
          )}

          {appMode === "LOTING" && (
            <SekretarisPanel
              key="panel-sekretaris-loting"
              initialTab="LOTING"
              state={matchState}
              onUpdateMetadata={handleUpdateMetadata}
              onResetMatch={handleResetMatch}
              onTimerCommand={handleTimerCommand}
              onRoundAction={handleRoundAction}
              onDewanAction={handleDewanAction}
              onBack={() => handleModeSwitch("LANDING")}
              onToggleFullscreen={() => toggleFullscreen("SEKRETARIS")}
              isFullscreen={fullscreenMode === "SEKRETARIS"}
              onSubScreenChange={handleSubScreenChange}
              onOpenOperatorPanel={async (matchItem?: any) => {
                if (matchItem) {
                  await handleResetMatch(matchItem);
                }
                handleModeSwitch("OPERATOR");
              }}
            />
          )}

          {appMode === "LAPORAN" && (
            <LaporanPanel
              currentMatchState={matchState}
              onBack={() => handleModeSwitch("LANDING")}
            />
          )}

          {appMode === "BRACKET" && (
            <SekretarisPanel
              key="panel-sekretaris-bracket"
              initialTab="BAGAN"
              state={matchState}
              onUpdateMetadata={handleUpdateMetadata}
              onResetMatch={handleResetMatch}
              onTimerCommand={handleTimerCommand}
              onRoundAction={handleRoundAction}
              onDewanAction={handleDewanAction}
              onBack={() => handleModeSwitch("LANDING")}
              onToggleFullscreen={() => toggleFullscreen("SEKRETARIS")}
              isFullscreen={fullscreenMode === "SEKRETARIS"}
              onSubScreenChange={handleSubScreenChange}
              onOpenOperatorPanel={async (matchItem?: any) => {
                if (matchItem) {
                  await handleResetMatch(matchItem);
                }
                handleModeSwitch("OPERATOR");
              }}
            />
          )}
        </div>
      )}

      {/* 3. SIMULATOR TERPADU VIEW (DEMO CONSOLE) */}
      {appMode === "SIMULATOR" && (
        <div className="flex-grow p-3 md:p-6 space-y-6 animate-fadeIn">
          
          {/* Top Mode Navigator within Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="text-center lg:text-left">
              <h1 className="font-sans font-black text-lg md:text-xl text-white tracking-tight flex items-center justify-center lg:justify-start gap-2 uppercase">
                🏆 PENCAK SILAT SIMULATOR <span className="bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded text-[10px] font-black leading-none font-mono tracking-widest align-middle">IPSI-2026</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Mode demonstrasi pengoperasian seluruh panel perangkat silat standar regulasi Peraturan IPSI 2026 & PERSILAT di satu layar komputer.
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => handleModeSwitch("LANDING")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition-all text-xs active:scale-95 cursor-pointer flex items-center gap-1"
                id="simulator-to-landing-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Landing Page</span>
              </button>
              
              <div className="w-[1.5px] h-6 bg-slate-800" />

              <span className="text-[10.5px] font-mono font-bold text-amber-500 uppercase tracking-wider block mr-1">Buka Panel:</span>
              <button onClick={() => handleModeSwitch("SCOREBOARD")} className="px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200">Layar Utama</button>
              <button onClick={() => handleModeSwitch("DEWAN")} className="px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200">Ketua/Dewan</button>
              <button onClick={() => handleModeSwitch("JURY1")} className="px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200">Juri 1</button>
            </div>

            <div className={`flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border ${
              isSseActive 
                ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/30" 
                : "text-amber-400 bg-amber-950/40 border-amber-800/30 font-bold"
            }`}>
              <Wifi className={`w-3.5 h-3.5 ${isSseActive ? "animate-pulse" : ""}`} />
              <span>
                {isSseActive 
                  ? `REAL-TIME IPSI 2026 ⚡ (#${syncCount})` 
                  : `POLLING FAILSAFE 🔄 (#${syncCount})`}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Scoreboard arena */}
            <div>
              <div className="mb-2 pl-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-indigo-400">
                <Monitor className="w-4 h-4" /> PENONTON / SCREEN UTAMA ARENA (SCOREBOARD - ARENA LED)
              </div>
              <ScoreboardView2 state={matchState} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Dewan Panel */}
              <div className="lg:col-span-7">
                <div className="mb-2 pl-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-indigo-400">
                  <UserCheck className="w-4 h-4" /> PANEL ADMINISTRATOR / KETUA PERTANDINGAN
                </div>
                <DewanPanel 
                  state={matchState}
                  onTimerCommand={handleTimerCommand}
                  onRoundAction={handleRoundAction}
                  onDewanAction={handleDewanAction}
                  onUpdateMetadata={handleUpdateMetadata}
                  onResetMatch={handleResetMatch}
                  onStartVerification={handleStartVerification}
                  onResetVerification={handleResetVerification}
                  onApplyVerification={handleApplyVerification}
                />
              </div>

              {/* 3 Sim-Juries container */}
              <div className="lg:col-span-5 space-y-4">
                <div className="mb-2 pl-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-indigo-400">
                  <HelpCircle className="w-4 h-4" /> KONTROL DARING (DIPENCET BERSAMAAN UNTUK KONSENSUS)
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/25 border border-indigo-800/40 rounded-2xl text-xs text-indigo-300 leading-relaxed font-sans">
                    <span className="font-bold uppercase text-amber-400 block mb-1">💡 Uji Coba Aturan Konsensus IPSI 2026 & PERSILAT:</span>
                    1. Pastikan status pertandingan adalah <span className="font-bold bg-emerald-600 text-white px-1 rounded uppercase text-[9.5px]">TANDING (WALK)</span> dengan memencet **START** di panel Dewan.<br />
                    2. Coba klik tombol **TENDANGAN** Merah di **Juri 1**.<br />
                    3. Kemudian, dalam rentang waktu toleransi (max 2.0 detik), klik tombol **TENDANGAN** Merah di **Juri 2** atau **Juri 3**!<br />
                    4. Skor Sudut Merah akan langsung bertambah **+2** karena disetujui secara konsensus mayoritas (2 dari 3 juri), dan riwayat tercatat secara real-time!
                  </div>
                  
                  <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/60 p-4 space-y-6">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800/50">Simulasi Gawai Juri 1</span>
                      <div className="mt-2 text-slate-100">
                        <JuryPanel state={matchState} onJuryPress={handleJuryPress} onJuryVote={handleJuryVote} defaultJuryId={1} hideJurySelector={true} />
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pl-1" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800/50">Simulasi Gawai Juri 2</span>
                      <div className="mt-2 text-slate-100">
                        <JuryPanel state={matchState} onJuryPress={handleJuryPress} onJuryVote={handleJuryVote} defaultJuryId={2} hideJurySelector={true} disableKeyboardShortcuts={true} />
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pl-1" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800/50">Simulasi Gawai Juri 3</span>
                      <div className="mt-2 text-slate-100">
                        <JuryPanel state={matchState} onJuryPress={handleJuryPress} onJuryVote={handleJuryVote} defaultJuryId={3} hideJurySelector={true} disableKeyboardShortcuts={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </React.Suspense>

      {/* GENERAL WEB INSTRUCTIONS ACCORDING TO USER'S LARAGON SETUP (SIMULATOR ONLY) */}
      {appMode === "SIMULATOR" && !fullscreenMode && (
        <footer className="py-4 md:py-6 px-6 bg-slate-900/45 border-t border-slate-850 flex flex-col md:flex-row justify-between items-center text-[10.5px] text-slate-500 font-mono gap-3 shrink-0">
          <div>
            <span>© 2026 IPSI DIGITAL PERATURAN TERBARU • LARAGON CONNECTED DESIGN</span>
          </div>
          <div className="flex items-center gap-3">
            <span>DIGITAL SCORING SYSTEM</span>
          </div>
        </footer>
      )}

      {/* FOOTER */}

      {/* DIALOG KONFIRMASI RESET DATA PERTANDINGAN: Reset semua, arsipkan data, batal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0a1128] border-2 border-rose-500/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(244,63,94,0.35)] flex flex-col text-left">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center shadow-lg shadow-rose-950/50 shrink-0">
                <RotateCcw className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                  PENGATURAN GELANGGANG
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  RESET DATA PERTANDINGAN
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Pilih tindakan reset data pertandingan. Seluruh skor, poin juri, hukuman, dan riwayat pertandingan akan dibersihkan untuk mempersiapkan aplikasi benar-benar bersih dari data pertandingan sebelumnya.
            </p>

            {/* 3 Opsi: Reset semua, arsipkan data, batal */}
            <div className="space-y-2.5">
              {/* OPSI 1: Reset semua */}
              <button
                type="button"
                onClick={() => handleCompleteReset(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between border border-rose-400/60 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-300" />
                  <div className="text-left">
                    <span className="block font-black text-xs">Reset semua</span>
                    <span className="block text-[10px] text-rose-200 font-normal font-sans">
                      Bersihkan seluruh data pertandingan langsung tanpa arsip
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-200" />
              </button>

              {/* OPSI 2: Arsipkan data */}
              <button
                type="button"
                onClick={() => handleCompleteReset(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-between border border-amber-300/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-slate-950" />
                  <div className="text-left">
                    <span className="block font-black text-xs">Arsipkan data</span>
                    <span className="block text-[10px] text-slate-900 font-normal font-sans">
                      Simpan data partai ini ke riwayat arsip, lalu reset bersih
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>

              {/* OPSI 3: Batal */}
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
