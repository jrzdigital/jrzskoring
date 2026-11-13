/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MASTER TGR TUNGGAL MODULE (SENI TUNGGAL BAKU IPSI & PERSILAT 2026)
 * Mengintegrasikan Timer 3 Menit, Panel Penjurian Aturan 3.1.1, Rekapitulasi Dewan & Scoreboard
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  TgrTunggalMatchState, 
  TgrRule311ErrorType,
  createDefaultTgrTunggalState,
  calculateJudgeScore,
  calculateTgrTimePenalty,
  calculateTgrFinalResult,
  formatTgrPrecisionTime,
  formatTgrTime
} from "../../utils/tgrTunggalScoring";
import { TgrTimer } from "./TgrTimer";
import { TgrJudgePanel } from "./TgrJudgePanel";
import { TgrDewanScoreboard } from "./TgrDewanScoreboard";
import { soundEffects } from "../../utils/audio";
import { 
  ArrowLeft, Clock, Shield, User, Tv, CheckCircle2, RotateCcw, 
  Maximize2, Minimize2, Trophy, Sparkles, Layers, Award, FileSpreadsheet, RefreshCw,
  Edit3, X, Check
} from "lucide-react";
import confetti from "canvas-confetti";

interface TgrTunggalViewProps {
  onBack?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  subViewOverride?: TgrSubViewMode;
  activeJudgeIdOverride?: number;
  matchData?: Partial<TgrTunggalMatchState>;
}

type TgrSubViewMode = "INTEGRATED" | "JUDGE" | "TIMER" | "DEWAN" | "MONITOR";

export const TgrTunggalView: React.FC<TgrTunggalViewProps> = ({
  onBack,
  isFullscreen = false,
  onToggleFullscreen,
  subViewOverride,
  activeJudgeIdOverride,
  matchData,
}) => {
  const [subView, setSubView] = useState<TgrSubViewMode>(() => {
    if (subViewOverride) return subViewOverride;
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const v = (params.get("subview") || params.get("view") || "").toUpperCase();
        if (v === "JUDGE" || v === "JURI") return "JUDGE";
        if (v === "TIMER" || v === "WAKTU") return "TIMER";
        if (v === "DEWAN" || v === "KETUA") return "DEWAN";
        if (v === "MONITOR" || v === "SKOR") return "MONITOR";
      } catch {}
    }
    return "INTEGRATED";
  });

  const [activeJudgeId, setActiveJudgeId] = useState<number>(() => {
    if (typeof activeJudgeIdOverride === "number") return activeJudgeIdOverride;
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const j = parseInt(params.get("jury") || params.get("juri") || "1", 10);
        if (j >= 1 && j <= 5) return j;
      } catch {}
    }
    return 1;
  });

  useEffect(() => {
    if (subViewOverride) {
      setSubView(subViewOverride);
    }
  }, [subViewOverride]);

  useEffect(() => {
    if (typeof activeJudgeIdOverride === "number") {
      setActiveJudgeId(activeJudgeIdOverride);
    }
  }, [activeJudgeIdOverride]);

  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    athleteName: "",
    contingent: "",
    gender: "PUTRA" as "PUTRA" | "PUTRI",
    ageCategory: "DEWASA" as "USIA DINI" | "PRA REMAJA" | "REMAJA" | "DEWASA" | "MASTER",
    partai: "1",
    stage: "FINAL",
  });
  const lastStorageSyncRef = useRef<number>(0);

  // Synchronized state with localStorage
  const [matchState, setMatchState] = useState<TgrTunggalMatchState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("jrz_tgr_tunggal_state");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return createDefaultTgrTunggalState();
  });

  // Save to localStorage on state change & notify other tabs
  const updateState = (updater: (prev: TgrTunggalMatchState) => TgrTunggalMatchState) => {
    setMatchState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("jrz_tgr_tunggal_state", JSON.stringify(next));
        window.dispatchEvent(new StorageEvent("storage", {
          key: "jrz_tgr_tunggal_state",
          newValue: JSON.stringify(next),
        }));
      } catch {}

      // Debounced push to server for cross-device/network synchronization
      try {
        fetch("/api/tgr/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next)
        }).catch(() => {});
      } catch {}

      return next;
    });
  };

  // Synchronize matchData passed from active match / secretary
  useEffect(() => {
    if (matchData && (matchData.athleteName || matchData.partai)) {
      updateState((prev) => ({
        ...prev,
        athleteName: matchData.athleteName || prev.athleteName,
        contingent: matchData.contingent || prev.contingent,
        gender: matchData.gender || prev.gender,
        partai: matchData.partai ? String(matchData.partai).replace(/[^0-9]/g, "") || prev.partai : prev.partai,
        stage: matchData.stage || prev.stage
      }));
    }
  }, [matchData?.athleteName, matchData?.contingent, matchData?.partai, matchData?.stage, matchData?.gender]);

  // Initial fetch from server state
  useEffect(() => {
    fetch("/api/tgr/state")
      .then(res => res.json())
      .then(data => {
        if (data && data.athleteName) {
          setMatchState(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  // Listen to remote changes across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "jrz_tgr_tunggal_state" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMatchState(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Timer Tick handler with throttled storage sync to prevent microstutter
  const handleTimerTick = (elapsed: number, remaining: number) => {
    const autoPenalty = calculateTgrTimePenalty(elapsed);
    setMatchState((prev) => {
      const next = {
        ...prev,
        timerElapsed: elapsed,
        timerRemaining: remaining,
        dewanPenalties: {
          ...prev.dewanPenalties,
          penaltiWaktuOtomatis: autoPenalty,
        },
      };

      const now = Date.now();
      if (now - lastStorageSyncRef.current >= 800) {
        lastStorageSyncRef.current = now;
        try {
          localStorage.setItem("jrz_tgr_tunggal_state", JSON.stringify(next));
          window.dispatchEvent(new StorageEvent("storage", {
            key: "jrz_tgr_tunggal_state",
            newValue: JSON.stringify(next),
          }));
        } catch {}
      }

      return next;
    });
  };

  const handleOpenEditModal = () => {
    setEditForm({
      athleteName: matchState.athleteName,
      contingent: matchState.contingent,
      gender: matchState.gender,
      ageCategory: matchState.ageCategory,
      partai: matchState.partai,
      stage: matchState.stage,
    });
    setShowEditModal(true);
  };

  const handleSaveEditModal = () => {
    updateState((prev) => ({
      ...prev,
      athleteName: editForm.athleteName.trim() || prev.athleteName,
      contingent: editForm.contingent.trim() || prev.contingent,
      gender: editForm.gender,
      ageCategory: editForm.ageCategory,
      partai: editForm.partai.trim() || prev.partai,
      stage: editForm.stage.trim() || prev.stage,
    }));
    setShowEditModal(false);
    try { soundEffects.playChime(); } catch {}
  };

  const handleTimerStart = () => {
    updateState((prev) => ({
      ...prev,
      isTimerRunning: true,
      isFinished: false,
      isLocked: false,
    }));
  };

  const handleTimerPause = () => {
    updateState((prev) => ({
      ...prev,
      isTimerRunning: false,
    }));
  };

  const handleTimerFinish = () => {
    updateState((prev) => {
      const finalPenalty = calculateTgrTimePenalty(prev.timerElapsed);
      return {
        ...prev,
        isTimerRunning: false,
        isFinished: true,
        dewanPenalties: {
          ...prev.dewanPenalties,
          penaltiWaktuOtomatis: finalPenalty,
        },
      };
    });
  };

  const handleTimerReset = () => {
    updateState((prev) => ({
      ...prev,
      timerElapsed: 0,
      timerRemaining: 180,
      isTimerRunning: false,
      isFinished: false,
      dewanPenalties: {
        ...prev.dewanPenalties,
        penaltiWaktuOtomatis: 0,
      },
    }));
  };

  // Judge Actions (Rule 3.1.1)
  const handleAddJudgeError = (errorType: TgrRule311ErrorType, label: string) => {
    updateState((prev) => {
      const currentJudge = prev.judges[activeJudgeId] || {
        id: activeJudgeId,
        name: `Juri ${activeJudgeId}`,
        errorsCount: 0,
        errorHistory: [],
        kebenaranScore: 9.90,
        kemantapanScore: 0.00,
        totalScore: 9.90,
        isSubmitted: false,
      };

      const nextErrorsCount = currentJudge.errorsCount + 1;
      const { kebenaranScore, totalScore } = calculateJudgeScore(nextErrorsCount, currentJudge.kemantapanScore);

      const newRecord = {
        id: `err-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: errorType,
        label,
        timestamp: Date.now(),
        timeFormatted: formatTgrPrecisionTime(prev.timerElapsed),
        deduction: 0.01,
      };

      const updatedJudge = {
        ...currentJudge,
        errorsCount: nextErrorsCount,
        errorHistory: [newRecord, ...currentJudge.errorHistory],
        kebenaranScore,
        totalScore,
        lastPressedAt: Date.now(),
      };

      return {
        ...prev,
        judges: {
          ...prev.judges,
          [activeJudgeId]: updatedJudge,
        },
      };
    });
  };

  const handleUndoJudgeError = () => {
    updateState((prev) => {
      const currentJudge = prev.judges[activeJudgeId];
      if (!currentJudge || currentJudge.errorsCount <= 0) return prev;

      const nextErrorsCount = Math.max(0, currentJudge.errorsCount - 1);
      const { kebenaranScore, totalScore } = calculateJudgeScore(nextErrorsCount, currentJudge.kemantapanScore);
      const nextHistory = currentJudge.errorHistory.slice(1);

      const updatedJudge = {
        ...currentJudge,
        errorsCount: nextErrorsCount,
        errorHistory: nextHistory,
        kebenaranScore,
        totalScore,
      };

      return {
        ...prev,
        judges: {
          ...prev.judges,
          [activeJudgeId]: updatedJudge,
        },
      };
    });
  };

  const handleSetJudgeFlowScore = (score: number) => {
    updateState((prev) => {
      const currentJudge = prev.judges[activeJudgeId];
      if (!currentJudge) return prev;

      const nextFlow = currentJudge.kemantapanScore === score ? 0.00 : score;
      const { kebenaranScore, totalScore } = calculateJudgeScore(currentJudge.errorsCount, nextFlow);

      const updatedJudge = {
        ...currentJudge,
        kemantapanScore: nextFlow,
        kebenaranScore,
        totalScore,
      };

      return {
        ...prev,
        judges: {
          ...prev.judges,
          [activeJudgeId]: updatedJudge,
        },
      };
    });
  };

  const handleSubmitJudgeScore = () => {
    updateState((prev) => {
      const currentJudge = prev.judges[activeJudgeId];
      if (!currentJudge) return prev;

      return {
        ...prev,
        judges: {
          ...prev.judges,
          [activeJudgeId]: {
            ...currentJudge,
            isSubmitted: true,
          },
        },
      };
    });
  };

  const handleResetJudgeScore = () => {
    updateState((prev) => {
      const currentJudge = prev.judges[activeJudgeId];
      if (!currentJudge) return prev;

      return {
        ...prev,
        judges: {
          ...prev.judges,
          [activeJudgeId]: {
            ...currentJudge,
            errorsCount: 0,
            errorHistory: [],
            kebenaranScore: 9.90,
            kemantapanScore: 0.00,
            totalScore: 9.90,
            isSubmitted: false,
          },
        },
      };
    });
  };

  // Dewan Penalties
  const handleUpdateDewanPenalties = (penalties: Partial<TgrTunggalMatchState["dewanPenalties"]>) => {
    updateState((prev) => ({
      ...prev,
      dewanPenalties: {
        ...prev.dewanPenalties,
        ...penalties,
      },
    }));
  };

  const handleToggleJudgesCount = (count: 3 | 5) => {
    updateState((prev) => ({
      ...prev,
      judgesCount: count,
    }));
  };

  const handleAnnounceWinner = () => {
    setShowCelebration(true);
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#06b6d4", "#f59e0b", "#10b981", "#ffffff"],
      });
    } catch {}
  };

  const handleFullResetMatch = () => {
    const fresh = createDefaultTgrTunggalState();
    setMatchState(fresh);
    setShowCelebration(false);
    try {
      localStorage.setItem("jrz_tgr_tunggal_state", JSON.stringify(fresh));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "jrz_tgr_tunggal_state",
        newValue: JSON.stringify(fresh),
      }));
    } catch {}
  };

  const finalCalculation = calculateTgrFinalResult(matchState.judges, matchState.dewanPenalties, matchState.judgesCount);

  return (
    <div className="min-h-screen bg-[#020512] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden p-2 sm:p-4 select-none">
      
      {/* TOP NAVIGATION BAR */}
      <header className="bg-[#040c24] border-b-2 border-cyan-500/40 px-3 sm:px-6 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg mb-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={() => {
                try { soundEffects.playClick(); } catch {}
                onBack();
              }}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center gap-1 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">KEMBALI</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                {subViewOverride === "JUDGE"
                  ? `PANEL JURI ${activeJudgeId} • KATEGORI JURUS (TGRS)`
                  : subViewOverride === "DEWAN"
                  ? "PANEL DEWAN • KATEGORI JURUS (TGRS)"
                  : subViewOverride === "MONITOR"
                  ? "SCOREBOARD ARENA LED • KATEGORI JURUS (TGRS)"
                  : subViewOverride === "TIMER"
                  ? "PANEL TIMER OPERATOR • KATEGORI JURUS (TGRS)"
                  : "KATEGORI TGR TUNGGAL BAKU"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-black uppercase">
                IPSI 2026 • ATURAN 3.1.1
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 hidden sm:block">
              {matchState.athleteName} ({matchState.contingent}) • Partai {matchState.partai} • {matchState.gender}
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs (Only if not in dedicated role view) */}
        {!subViewOverride ? (
          <div className="flex items-center gap-1 bg-slate-950/80 border border-cyan-500/30 p-1 rounded-xl">
            <button
              onClick={() => setSubView("INTEGRATED")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                subView === "INTEGRATED"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">SIMULASI</span>
            </button>
            <button
              onClick={() => setSubView("JUDGE")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                subView === "JUDGE"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>JURI {activeJudgeId}</span>
            </button>
            <button
              onClick={() => setSubView("TIMER")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                subView === "TIMER"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>TIMER 3:00</span>
            </button>
            <button
              onClick={() => setSubView("DEWAN")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                subView === "DEWAN"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>DEWAN</span>
            </button>
            <button
              onClick={() => setSubView("MONITOR")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                subView === "MONITOR"
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MONITOR</span>
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
              {matchState.athleteName} • {matchState.contingent}
            </span>
          </div>
        )}

        {/* Right: Edit Athlete, Reset & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEditModal}
            className="p-1.5 px-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-500/40 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Ubah Data Pesilat & Partai"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DATA PESILAT</span>
          </button>

          <button
            onClick={handleFullResetMatch}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 cursor-pointer transition-all active:scale-95"
            title="Reset Partai Tunggal Baru"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer transition-all active:scale-95"
              title="Layar Penuh (Fullscreen)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto space-y-4">
        
        {/* 1. INTEGRATED VIEW: ALL-IN-ONE CONSOLE */}
        {subView === "INTEGRATED" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Timer & Scoreboard (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <TgrTimer
                  elapsed={matchState.timerElapsed}
                  remaining={matchState.timerRemaining}
                  isRunning={matchState.isTimerRunning}
                  isFinished={matchState.isFinished}
                  onStart={handleTimerStart}
                  onPause={handleTimerPause}
                  onReset={handleTimerReset}
                  onFinish={handleTimerFinish}
                  onTick={handleTimerTick}
                />

                {/* Quick Info Box */}
                <div className="bg-[#040a1c] border border-cyan-500/30 rounded-xl p-3 text-xs font-mono space-y-1.5 text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Aturan Penilaian:</span>
                    <strong className="text-amber-400">PERSILAT 3.1.1</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Total Jurus / Gerakan:</span>
                    <strong className="text-cyan-300">14 Jurus / 100 Gerakan Baku</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Urutan Penampilan:</span>
                    <span className="text-white text-[10px]">Tangan Kosong → Golok → Toya</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batas Waktu Toleransi:</span>
                    <strong className="text-emerald-400">175s s.d 185s (+/- 5 detik)</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Judge Touch Console with 3.1.1 error buttons (7 cols) */}
              <div className="lg:col-span-7">
                <TgrJudgePanel
                  judgeState={matchState.judges[activeJudgeId] || createDefaultTgrTunggalState().judges[1]}
                  activeJudgeId={activeJudgeId}
                  athleteName={matchState.athleteName}
                  contingent={matchState.contingent}
                  gender={matchState.gender}
                  ageCategory={matchState.ageCategory}
                  stage={matchState.stage}
                  timerElapsed={matchState.timerElapsed}
                  isTimerRunning={matchState.isTimerRunning}
                  onSelectJudge={setActiveJudgeId}
                  onAddError={handleAddJudgeError}
                  onUndoError={handleUndoJudgeError}
                  onSetFlowScore={handleSetJudgeFlowScore}
                  onSubmitScore={handleSubmitJudgeScore}
                  onResetJudgeScore={handleResetJudgeScore}
                  judgesCount={matchState.judgesCount}
                />
              </div>
            </div>

            {/* Bottom Row: Official Council / Dewan Score Compilation */}
            <div>
              <TgrDewanScoreboard
                state={matchState}
                onUpdateDewanPenalties={handleUpdateDewanPenalties}
                onToggleJudgesCount={handleToggleJudgesCount}
                onAnnounceWinner={handleAnnounceWinner}
              />
            </div>
          </div>
        )}

        {/* 2. JUDGE ONLY VIEW (DEDICATED FOR TABLETS/SMARTPHONES) */}
        {subView === "JUDGE" && (
          <div className="max-w-4xl mx-auto w-full animate-fadeIn">
            <TgrJudgePanel
              judgeState={matchState.judges[activeJudgeId] || createDefaultTgrTunggalState().judges[1]}
              activeJudgeId={activeJudgeId}
              athleteName={matchState.athleteName}
              contingent={matchState.contingent}
              gender={matchState.gender}
              ageCategory={matchState.ageCategory}
              stage={matchState.stage}
              timerElapsed={matchState.timerElapsed}
              isTimerRunning={matchState.isTimerRunning}
              onSelectJudge={setActiveJudgeId}
              onAddError={handleAddJudgeError}
              onUndoError={handleUndoJudgeError}
              onSetFlowScore={handleSetJudgeFlowScore}
              onSubmitScore={handleSubmitJudgeScore}
              onResetJudgeScore={handleResetJudgeScore}
              judgesCount={matchState.judgesCount}
            />
          </div>
        )}

        {/* 3. TIMER ONLY VIEW */}
        {subView === "TIMER" && (
          <div className="max-w-2xl mx-auto w-full animate-fadeIn space-y-4">
            <TgrTimer
              elapsed={matchState.timerElapsed}
              remaining={matchState.timerRemaining}
              isRunning={matchState.isTimerRunning}
              isFinished={matchState.isFinished}
              onStart={handleTimerStart}
              onPause={handleTimerPause}
              onReset={handleTimerReset}
              onFinish={handleTimerFinish}
              onTick={handleTimerTick}
            />
          </div>
        )}

        {/* 4. DEWAN ONLY VIEW */}
        {subView === "DEWAN" && (
          <div className="w-full animate-fadeIn">
            <TgrDewanScoreboard
              state={matchState}
              onUpdateDewanPenalties={handleUpdateDewanPenalties}
              onToggleJudgesCount={handleToggleJudgesCount}
              onAnnounceWinner={handleAnnounceWinner}
            />
          </div>
        )}

        {/* 5. MONITOR ARENA LED VIEW */}
        {subView === "MONITOR" && (
          <div className="w-full animate-fadeIn space-y-6">
            <TgrDewanScoreboard
              state={matchState}
              onUpdateDewanPenalties={handleUpdateDewanPenalties}
              onToggleJudgesCount={handleToggleJudgesCount}
              onAnnounceWinner={handleAnnounceWinner}
              readOnly={true}
            />
          </div>
        )}
      </main>

      {/* POPUP CELEBRATION MODAL ON ANNOUNCE WINNER */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#0c1840] via-[#06102c] to-[#020512] border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-center relative shadow-[0_0_80px_rgba(245,158,11,0.5)] font-sans">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 mx-auto mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Trophy className="w-9 h-9" />
            </div>

            <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest block mb-1">
              HASIL RESMI KATEGORI TGR TUNGGAL BAKU
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-1">
              {matchState.athleteName}
            </h2>
            <p className="text-sm font-mono text-cyan-300 font-bold mb-4">
              {matchState.contingent} • {matchState.gender} ({matchState.ageCategory})
            </p>

            <div className="bg-[#030818] border border-amber-400/50 rounded-2xl p-5 my-3 shadow-inner">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                NILAI AKHIR DEWAN PERTANDINGAN
              </span>
              <span className="text-5xl sm:text-6xl font-mono font-black text-amber-400 tracking-wider">
                {finalCalculation.finalScore.toFixed(3)}
              </span>
              <div className="flex justify-center gap-4 mt-2 text-[10px] font-mono text-slate-300">
                <span>Waktu: <strong>{formatTgrPrecisionTime(matchState.timerElapsed)}</strong></span>
                <span>•</span>
                <span>Hukuman: <strong>-{finalCalculation.totalPenaltiDewan.toFixed(3)}</strong></span>
              </div>
            </div>

            <button
              onClick={() => setShowCelebration(false)}
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              TUTUP PENGUMUMAN
            </button>
          </div>
        </div>
      )}

      {/* EDIT ATHLETE & MATCH INFO MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1329] border-2 border-cyan-500/60 rounded-2xl p-5 sm:p-6 max-w-md w-full relative shadow-[0_0_60px_rgba(6,182,212,0.35)] text-slate-100 font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-wider">
                    UBAH DATA PESILAT TUNGGAL
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">Kategori TGR Tunggal Baku 3.1.1</span>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                  NAMA PESILAT
                </label>
                <input
                  type="text"
                  value={editForm.athleteName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, athleteName: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: ADI WIJAYA"
                  className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-sans font-bold uppercase focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                  KONTINGEN / TIM
                </label>
                <input
                  type="text"
                  value={editForm.contingent}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contingent: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: JAWA TENGAH"
                  className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-amber-400 font-sans font-bold uppercase focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    JENIS KELAMIN
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value as "PUTRA" | "PUTRI" }))}
                    className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold uppercase focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="PUTRA">PUTRA</option>
                    <option value="PUTRI">PUTRI</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    KATEGORI USIA
                  </label>
                  <select
                    value={editForm.ageCategory}
                    onChange={(e) => setEditForm(prev => ({ ...prev, ageCategory: e.target.value as any }))}
                    className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold uppercase focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="USIA DINI">USIA DINI</option>
                    <option value="PRA REMAJA">PRA REMAJA</option>
                    <option value="REMAJA">REMAJA</option>
                    <option value="DEWASA">DEWASA</option>
                    <option value="MASTER">MASTER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    PARTAI KE-
                  </label>
                  <input
                    type="text"
                    value={editForm.partai}
                    onChange={(e) => setEditForm(prev => ({ ...prev, partai: e.target.value }))}
                    placeholder="1"
                    className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    BABAK / TAHAP
                  </label>
                  <input
                    type="text"
                    value={editForm.stage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stage: e.target.value.toUpperCase() }))}
                    placeholder="FINAL"
                    className="w-full bg-[#050b1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-cyan-500/30">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-all"
              >
                BATAL
              </button>
              <button
                onClick={handleSaveEditModal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-sans font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>SIMPAN PERUBAHAN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ATTRIBUTION */}
      <footer className="text-center py-2 text-[10px] font-mono text-slate-500 border-t border-cyan-500/15 mt-4">
        JRZ SCORE DIGITAL SCORING • MODUL RESMI TGR TUNGGAL BAKU PERSILAT / IPSI 2026
      </footer>
    </div>
  );
};
