/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * JURI PAD UNTUK KATEGORI JURUS TGRS (TUNGGAL, GANDA, REGU, SOLO KREATIF)
 * Standar Penjurian Resmi PB IPSI & PERSILAT 2026
 */

import React, { useState, useEffect, useRef } from "react";
import {
  TgrsMatchState,
  TgrsJudgeState,
  TgrsErrorType,
  SKOR_DASAR_BAKU,
  SKOR_DASAR_GANDA_SOLO,
  PENALTI_GERAK_311,
  computeJudgeScore,
  computeTgrsFinalResult,
  formatTimeMMSS,
  saveTgrsLiveState,
  useTgrsLiveElapsed
} from "../../utils/tgrsScoringEngine";
import { soundEffects } from "../../utils/audio";
import {
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Maximize2,
  Clock,
  Send,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import iconTimer from "../../assets/images/icon_timer.png";
import { TgrsGandaSoloJuryPad } from "./TgrsGandaSoloJuryPad";

const TUNING_BUTTON_VALUES = [
  0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10,
  0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
  0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
];

interface TgrsJuryPadProps {
  state: TgrsMatchState;
  activeJudgeId: number;
  onUpdateState: (updater: (prev: TgrsMatchState) => TgrsMatchState) => void;
  onBackToLanding?: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TgrsJuryPad: React.FC<TgrsJuryPadProps> = ({
  state,
  activeJudgeId: initialJudgeId,
  onUpdateState,
  onBackToLanding,
  onSwitchToTanding,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const [judgeId, setJudgeId] = useState<number>(initialJudgeId || 1);
  const [pulseBtn, setPulseBtn] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const lastPressRef = useRef<number>(0);
  const liveElapsed = useTgrsLiveElapsed(state);

  useEffect(() => {
    if (initialJudgeId && initialJudgeId >= 1 && initialJudgeId <= 10) {
      setJudgeId(initialJudgeId);
    }
  }, [initialJudgeId]);

  const currentJudge: TgrsJudgeState = state.judges[judgeId] || {
    id: judgeId,
    name: `Juri ${judgeId}`,
    errorsCount: 0,
    errorHistory: [],
    kebenaranScore: SKOR_DASAR_BAKU,
    kemantapanScore: 0.00,
    totalScore: SKOR_DASAR_BAKU,
    isSubmitted: false
  };

  const isTunggalOrRegu = !state.category || state.category === "TUNGGAL" || state.category === "REGU";
  const isGanda = state.category === "GANDA";
  const isSolo = state.category === "SOLO_KREATIF" || (state.category as string) === "TUNGGAL_BEBAS";

  if (isGanda || isSolo) {
    return (
      <TgrsGandaSoloJuryPad
        state={state}
        activeJudgeId={judgeId}
        onUpdateState={onUpdateState}
        onBackToLanding={onBackToLanding}
        onSwitchToTanding={onSwitchToTanding}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    );
  }

  const activeCorner = state.activeCorner || "BLUE";
  const currentPerformer = activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer;
  const contingent = currentPerformer?.contingent || state.contingent || (activeCorner === "BLUE" ? "SINGAPORE" : "INDONESIA");
  const athleteName = currentPerformer?.athleteName || state.athleteName || (activeCorner === "BLUE" ? "ATLIT BIRU" : "ATLIT MERAH");

  const isPerformerFinished = Boolean(currentPerformer?.isFinished || state.isFinished || state.isPerformerFinished);
  const isTimerActive = Boolean(state.isTimerRunning && !isPerformerFinished);
  const performerElapsed = currentPerformer?.performerTime ?? currentPerformer?.timerElapsed ?? liveElapsed ?? 0;
  const safeElapsed = Number.isFinite(performerElapsed) ? performerElapsed : 0;
  const anyElapsed = safeElapsed > 0 || (state.timerElapsed || 0) > 0;
  // Panel terkunci saat timer belum memulai pertandingan (belum jalan & waktu 00:00 & belum selesai)
  const isTimerNotStarted = isTunggalOrRegu && !isTimerActive && !anyElapsed && !state.timerStartedAt && !isPerformerFinished && !currentJudge.isSubmitted;

  // Anti double click (200ms debounce)
  const handleMarkError = (type: TgrsErrorType, label: string) => {
    if (currentJudge.isSubmitted || isTimerNotStarted) return;
    const now = Date.now();
    if (now - lastPressRef.current < 200) return;
    lastPressRef.current = now;

    setPulseBtn(type);
    setTimeout(() => setPulseBtn(null), 180);

    try { soundEffects.playClick(); } catch {}

    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activePerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;
      const newErrorsCount = (j.errorsCount || 0) + 1;
      const newHistory = [
        ...(j.errorHistory || []),
        {
          id: `err-${Date.now()}`,
          type,
          label,
          timestamp: now,
          timeFormatted: formatTimeMMSS(prev.timerElapsed),
          deduction: PENALTI_GERAK_311
        }
      ];

      const computed = computeJudgeScore(prev.category, {
        ...j,
        errorsCount: newErrorsCount,
        kemantapanScore: j.kemantapanScore
      });

      const updatedJudge: TgrsJudgeState = {
        ...j,
        errorsCount: newErrorsCount,
        errorHistory: newHistory,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore,
        lastPressedAt: now
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const penalties = activePerformer?.dewanPenalties || prev.dewanPenalties;
      const res = computeTgrsFinalResult(prev.category, updatedActiveJudges, penalties, prev.judgesCount);

      const updatedPerformer = {
        ...activePerformer,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        discardedHigh: res.discardedHigh,
        discardedLow: res.discardedLow,
        validScores: res.validScores
      };

      const nextState: TgrsMatchState = {
        ...prev,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };
      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  const handleUndoError = () => {
    if (currentJudge.isSubmitted || (currentJudge.errorsCount || 0) <= 0 || isTimerNotStarted) return;
    try { soundEffects.playClick(); } catch {}

    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activePerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;
      const newErrorsCount = Math.max(0, (j.errorsCount || 0) - 1);
      const newHistory = [...(j.errorHistory || [])];
      newHistory.pop();

      const computed = computeJudgeScore(prev.category, {
        ...j,
        errorsCount: newErrorsCount,
        kemantapanScore: j.kemantapanScore
      });

      const updatedJudge: TgrsJudgeState = {
        ...j,
        errorsCount: newErrorsCount,
        errorHistory: newHistory,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore,
        lastPressedAt: Date.now()
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const penalties = activePerformer?.dewanPenalties || prev.dewanPenalties;
      const res = computeTgrsFinalResult(prev.category, updatedActiveJudges, penalties, prev.judgesCount);

      const updatedPerformer = {
        ...activePerformer,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        discardedHigh: res.discardedHigh,
        discardedLow: res.discardedLow,
        validScores: res.validScores
      };

      const nextState: TgrsMatchState = {
        ...prev,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };
      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  const handleSetKemantapan = (val: number) => {
    if (currentJudge.isSubmitted || isTimerNotStarted) return;
    try { soundEffects.playClick(); } catch {}

    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activePerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;
      const computed = computeJudgeScore(prev.category, {
        ...j,
        kemantapanScore: val
      });

      const updatedJudge: TgrsJudgeState = {
        ...j,
        kemantapanScore: val,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const penalties = activePerformer?.dewanPenalties || prev.dewanPenalties;
      const res = computeTgrsFinalResult(prev.category, updatedActiveJudges, penalties, prev.judgesCount);

      const updatedPerformer = {
        ...activePerformer,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        discardedHigh: res.discardedHigh,
        discardedLow: res.discardedLow,
        validScores: res.validScores
      };

      const nextState: TgrsMatchState = {
        ...prev,
        judges: updatedActiveJudges,
        finalScore: res.finalScore,
        averageScore: res.averageScore,
        totalPenaltiDewan: res.totalPenaltiDewan,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };
      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  const handleSelectTuning = (
    field: "serangBelaScore" | "kemantapanScore" | "penjiwaanScore",
    val: number
  ) => {
    if (currentJudge.isSubmitted) return;
    try { soundEffects.playClick(); } catch {}

    const curr = currentJudge[field] ?? 0;
    // Toggle: jika tombol yang sama ditekan lagi, reset ke 0.00; jika berbeda ubah ke nilai baru
    const nextVal = Math.abs(curr - val) < 0.005 ? 0.00 : val;

    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;

      const safeVal = Math.max(0, Number(nextVal.toFixed(2)));
      const updatedFields: TgrsJudgeState = {
        ...j,
        [field]: safeVal
      };

      if (field === "serangBelaScore") updatedFields.teknikScore = safeVal;
      if (field === "penjiwaanScore") updatedFields.koreografiScore = safeVal;

      const computed = computeJudgeScore(prev.category, updatedFields);
      const updatedJudge: TgrsJudgeState = {
        ...updatedFields,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore,
        lastPressedAt: Date.now()
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const nextState = {
        ...prev,
        judges: {
          ...prev.judges,
          [judgeId]: updatedJudge
        },
        bluePerformer: isBlue
          ? {
              ...prev.bluePerformer,
              judges: updatedActiveJudges
            }
          : prev.bluePerformer,
        redPerformer: !isBlue
          ? {
              ...prev.redPerformer,
              judges: updatedActiveJudges
            }
          : prev.redPerformer
      };

      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  const handleSetScoreField = (
    field: "serangBelaScore" | "kemantapanScore" | "penjiwaanScore" | "teknikScore" | "koreografiScore",
    val: number
  ) => {
    if (currentJudge.isSubmitted) return;
    try { soundEffects.playClick(); } catch {}

    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;

      const safeVal = Math.max(0, Number(val.toFixed(2)));
      const updatedFields: TgrsJudgeState = {
        ...j,
        [field]: safeVal
      };

      // Sinkronkan alias jika field tertentu diubah
      if (field === "serangBelaScore") updatedFields.teknikScore = safeVal;
      if (field === "penjiwaanScore") updatedFields.koreografiScore = safeVal;

      const computed = computeJudgeScore(prev.category, updatedFields);

      const updatedJudge: TgrsJudgeState = {
        ...updatedFields,
        kebenaranScore: computed.kebenaranScore,
        totalScore: computed.totalScore
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const nextState = {
        ...prev,
        judges: {
          ...prev.judges,
          [judgeId]: updatedJudge
        },
        bluePerformer: isBlue ? { ...prev.bluePerformer, judges: updatedActiveJudges } : prev.bluePerformer,
        redPerformer: !isBlue ? { ...prev.redPerformer, judges: updatedActiveJudges } : prev.redPerformer
      };
      saveTgrsLiveState(nextState);
      return nextState;
    });
  };

  const handleSubmitScore = () => {
    if (isTimerNotStarted) return;
    try { soundEffects.playChime(); } catch {}
    onUpdateState((prev) => {
      const activeCorner = prev.activeCorner || "BLUE";
      const isBlue = activeCorner === "BLUE";
      const activeJudges = isBlue ? { ...prev.bluePerformer.judges } : { ...prev.redPerformer.judges };
      const j = activeJudges[judgeId] || prev.judges[judgeId] || currentJudge;
      const updatedJudge: TgrsJudgeState = {
        ...j,
        isSubmitted: true
      };

      const updatedActiveJudges = {
        ...activeJudges,
        [judgeId]: updatedJudge
      };

      const nextState = {
        ...prev,
        judges: {
          ...prev.judges,
          [judgeId]: updatedJudge
        },
        bluePerformer: isBlue ? { ...prev.bluePerformer, judges: updatedActiveJudges } : prev.bluePerformer,
        redPerformer: !isBlue ? { ...prev.redPerformer, judges: updatedActiveJudges } : prev.redPerformer
      };
      saveTgrsLiveState(nextState);
      return nextState;
    });
    setSubmittedMessage("Nilai Juri Berhasil Terkirim ke Dewan Pertandingan!");
    setTimeout(() => setSubmittedMessage(null), 3000);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (isTunggalOrRegu && !currentJudge.isSubmitted && !isTimerNotStarted) {
        if (e.code === "Space" || e.key.toLowerCase() === "w") {
          e.preventDefault();
          handleMarkError("GENERAL_WRONG", "Salah Gerak Baku");
        } else if (e.key === "1") {
          e.preventDefault();
          handleMarkError("DETAIL_GERAK", "Rincian Detail Gerak Salah");
        } else if (e.key === "2") {
          e.preventDefault();
          handleMarkError("URUTAN_GERAK", "Urutan Rincian Gerak Terbalik");
        } else if (e.key === "3") {
          e.preventDefault();
          handleMarkError("GERAKAN_TERTINGGAL", "Ada Gerakan Tertinggal");
        } else if (e.key === "4") {
          e.preventDefault();
          handleMarkError("SENJATA_TERLEPAS", "Senjata Terlepas");
        } else if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          handleUndoError();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmitScore();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentJudge.errorsCount, currentJudge.isSubmitted, isTunggalOrRegu, isTimerNotStarted]);

  const accuracyScore = currentJudge.kebenaranScore ?? (SKOR_DASAR_BAKU - (currentJudge.errorsCount || 0) * PENALTI_GERAK_311);
  const staminaScore = currentJudge.kemantapanScore || 0;
  const totalScore = currentJudge.totalScore ?? (accuracyScore + staminaScore);

  const subHeaderText = state.category === "REGU" 
    ? "JURUS REGU FULL (JURUS 1 - 100)" 
    : "JURUS TUNGGAL FULL (JURUS 1 - 14)";

  // TAMPILAN RESMI JURI TUNGGAL & REGU KATEGORI JURUS (SESUAI CONTOH Juritunggal.JPG)
  if (isTunggalOrRegu) {
    return (
      <div 
        className="bg-[#020510] text-slate-100 flex flex-col justify-between font-sans select-none p-2 sm:p-3 relative overflow-hidden"
        style={{
          height: "100dvh",
          maxHeight: "100dvh"
        }}
      >
        {/* TOP BAR HEADER */}
        <div className="grid grid-cols-3 items-center gap-2 px-1 pt-1 shrink-0 relative z-50">
          {/* LEFT: CONTINGENT & ATHLETE NAME */}
          <div className="flex flex-col justify-center text-left min-w-0">
            <div className="flex items-center gap-1.5">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="p-1 -ml-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                  title="Kembali ke Beranda"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] sm:text-xs font-sans text-[#728299] font-bold uppercase tracking-wider truncate">
                {contingent}
              </span>
            </div>
            <span className={`text-sm sm:text-base md:text-lg font-sans font-black uppercase tracking-wide truncate ${activeCorner === "RED" ? "text-rose-400" : "text-[#2e82f6]"}`}>
              {athleteName}
            </span>
          </div>

          {/* CENTER: ACTIVE CORNER BADGE & SUB-HEADER JURUS */}
          <div className="flex flex-col items-center justify-center">
            {/* ACTIVE CORNER BADGE (READ-ONLY, FOLLOWS DEWAN SELECTION) */}
            <div className="mb-1">
              {activeCorner === "BLUE" ? (
                <div className="px-5 sm:px-7 py-0.5 sm:py-1 rounded bg-[#1860ec] text-white font-sans font-black text-[11px] sm:text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(24,96,236,0.6)] flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  <span>SUDUT BIRU</span>
                </div>
              ) : (
                <div className="px-5 sm:px-7 py-0.5 sm:py-1 rounded bg-[#dc2626] text-white font-sans font-black text-[11px] sm:text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.6)] flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  <span>SUDUT MERAH</span>
                </div>
              )}
            </div>

            {/* JURUS SUBHEADER BAR */}
            <div className="w-full text-center border-t border-[#101e38] pt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-sans font-black text-white tracking-[0.15em] uppercase">
                {subHeaderText}
              </span>
            </div>
          </div>

          {/* RIGHT: GELANGGANG & CATEGORY */}
          <div className="flex flex-col justify-center text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              {/* Identitas Juri Terkunci (Non-Interactive, Ditentukan di Halaman Awal) */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#091535] border border-cyan-500/50 shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-mono font-black text-cyan-300 uppercase tracking-wider">
                  JURI {judgeId}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-sans text-[#728299] font-bold uppercase tracking-wider truncate">
                GELANGGANG {state.gelanggang || "1"}, Partai {state.partai || "2"}
              </span>
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="p-1 -mr-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-sm sm:text-base md:text-lg font-sans font-black text-[#f59e0b] uppercase tracking-wide truncate">
              {state.category === "REGU" ? "REGU/TEAM" : "TUNGGAL/SINGLE"}
            </span>
          </div>
        </div>

        {/* STATUS SUB-BAR (MISTAKE COUNT ON LEFT, STATUS ON RIGHT) */}
        <div className="border-t border-[#12203d] mt-1 pt-0.5 grid grid-cols-2 items-center shrink-0">
          <div className="text-center">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#ef4444] leading-none drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
              {currentJudge.errorsCount || 0}
            </span>
          </div>
          <div className="text-center">
            <span className={`text-xs sm:text-sm font-mono font-black tracking-[0.2em] uppercase ${
              currentJudge.isSubmitted 
                ? "text-[#ef4444]" 
                : state.isTimerRunning 
                  ? "text-[#22c55e]" 
                  : "text-[#ef4444]"
            }`}>
              {currentJudge.isSubmitted ? "LOCKED" : state.isTimerRunning ? "READY" : "LOCKED"}
            </span>
          </div>
        </div>

        {/* CENTER MAIN INTERACTIVE AREA: TWO GIANT BOXES (WRONG MOVE & READY/LOCKED) */}
        <div className="flex-1 rounded-2xl border border-[#1b2b48] bg-[#030816] p-2 relative flex items-stretch gap-2 min-h-0 my-1 overflow-hidden">
          
          {/* LEFT BOX: WRONG MOVE */}
          <button
            type="button"
            disabled={currentJudge.isSubmitted}
            onClick={() => handleMarkError("GENERAL_WRONG", "Salah Gerak Baku")}
            className={`flex-1 rounded-xl bg-[#0c182b] hover:bg-[#10223b] active:bg-[#07101e] border border-[#172740] flex items-center justify-center p-4 text-center cursor-pointer transition-all select-none touch-manipulation active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${
              pulseBtn === "GENERAL_WRONG" ? "ring-4 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)]" : ""
            }`}
            title="Salah Gerak (Kurang 0.01)"
          >
            <span className="text-[#64748b] hover:text-slate-200 font-sans font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.25em] uppercase">
              WRONG MOVE
            </span>
          </button>

          {/* RIGHT BOX: READY / SUBMIT / LOCKED (TERKUNCI SAH) */}
          <button
            type="button"
            disabled={currentJudge.isSubmitted}
            onClick={() => {
              if (!currentJudge.isSubmitted) {
                handleSubmitScore();
              }
            }}
            className={`flex-1 rounded-xl flex items-center justify-center p-4 text-center select-none touch-manipulation transition-all ${
              currentJudge.isSubmitted
                ? "bg-[#08182b] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-not-allowed opacity-95"
                : activeCorner === "RED"
                ? "bg-[#b91c1c] hover:bg-[#dc2626] active:bg-[#991b1b] border border-[#ef4444]/50 shadow-[0_0_30px_rgba(185,28,28,0.45)] cursor-pointer active:scale-[0.99]"
                : "bg-[#1565c0] hover:bg-[#1976d2] active:bg-[#0d47a1] border border-[#2196f3]/50 shadow-[0_0_30px_rgba(21,101,192,0.45)] cursor-pointer active:scale-[0.99]"
            }`}
            title={currentJudge.isSubmitted ? "Nilai Juri Terkunci & Sah (Tidak Dapat Diubah Kembali)" : "Kirim & Kunci Nilai Juri (Selesai)"}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <span className={`font-sans font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.25em] uppercase ${
                currentJudge.isSubmitted ? "text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" : "text-white"
              }`}>
                {currentJudge.isSubmitted ? "LOCKED" : "READY"}
              </span>
              {currentJudge.isSubmitted && (
                <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  NILAI SAH & TERKUNCI
                </span>
              )}
            </div>
          </button>

        </div>

        {/* BOTTOM SCORING AREA */}
        <div className="border-t border-[#13203c] pt-2 space-y-1 font-sans shrink-0">
          
          {/* ROW 1: BACKSPACE & ACCURACY TOTAL SCORE */}
          <div className="flex items-center justify-between gap-3 px-1 py-0.5">
            <button
              type="button"
              disabled={currentJudge.isSubmitted || (currentJudge.errorsCount || 0) <= 0}
              onClick={handleUndoError}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c1613] hover:bg-[#2c1e18] border border-[#7c2d12] text-[#f59e0b] font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-inner shrink-0"
              title="Batalkan kesalahan terakhir (Backspace)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>BACKSPACE</span>
            </button>

            <div className="flex-1 text-center">
              <span className="text-xs sm:text-sm font-sans font-bold text-[#8091a7] tracking-[0.15em] uppercase">
                ACCURACY TOTAL SCORE
              </span>
            </div>

            <div className="w-24 text-right shrink-0">
              <span className="text-base sm:text-lg md:text-xl font-mono font-black text-[#38bdf8]">
                {accuracyScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ROW 2: FLOW OF MOVEMENT / STAMINA */}
          <div className="px-1 py-0.5">
            <div className="text-center mb-1">
              <span className="text-[10.5px] sm:text-xs font-sans font-bold text-[#8091a7] tracking-wider uppercase">
                FLOW OF MOVEMENT / STAMINA <span className="text-[9.5px] font-normal opacity-80 lowercase">(range score : 0.01 - 0.10)</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 flex-1">
                {[0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10].map((val) => {
                  const isSelected = Math.abs((currentJudge.kemantapanScore || 0) - val) < 0.005;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={currentJudge.isSubmitted}
                      onClick={() => handleSetKemantapan(val)}
                      className={`py-1 sm:py-1.5 rounded font-mono font-bold text-[11px] sm:text-xs transition-all cursor-pointer select-none active:scale-95 text-center ${
                        isSelected
                          ? "bg-[#1d61e7] text-white border border-blue-300 shadow-[0_0_10px_rgba(29,97,231,0.6)] font-black"
                          : "bg-[#091528] hover:bg-[#12284d] text-slate-200 border border-[#1e3a5f]"
                      } disabled:opacity-40`}
                    >
                      {val.toFixed(2)}
                    </button>
                  );
                })}
              </div>

              <div className="w-24 text-right shrink-0">
                <span className="text-base sm:text-lg md:text-xl font-mono font-black text-[#38bdf8]">
                  {staminaScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3: TOTAL SCORE */}
          <div className="flex items-center justify-between px-1 pt-1 border-t border-[#13203c]">
            <div className="flex-1 text-center">
              <span className="text-sm sm:text-base font-sans font-black text-[#f59e0b] tracking-[0.2em] uppercase">
                TOTAL SCORE
              </span>
            </div>
            <div className="w-24 text-right shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-[#f59e0b]">
                {totalScore.toFixed(2)}
              </span>
            </div>
          </div>

        </div>

        {/* OVERLAY PANEL TERKUNCI (TANPA GRID, LATAR BELAKANG PENILAIAN TETAP TERLIHAT) */}
        {isTimerNotStarted && (
          <div className="absolute inset-0 z-40 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 select-none pointer-events-auto">
            {/* LOGO TIMER */}
            <img 
              src={iconTimer}
              alt="Logo Timer"
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain filter drop-shadow-[0_0_25px_rgba(255,255,255,0.45)] mb-3 sm:mb-4 select-none animate-pulse"
              onError={(e) => {
                e.currentTarget.src = "/icon timer.png";
              }}
            />

            {/* TULISAN TERKUNCI (SILVER BERKILAU & FONT IMPACT, TANPA ICON GEMBOK) */}
            <span 
              className="text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.2em] bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(255,255,255,0.85)] drop-shadow-[0_0_30px_rgba(203,213,225,0.7)] select-none font-black"
              style={{ fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" }}
            >
              TERKUNCI
            </span>
          </div>
        )}

        {/* TOAST NOTIFICATION ON SUBMIT */}
        {submittedMessage && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-300 flex items-center gap-2 animate-bounce z-50 font-bold text-xs uppercase">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{submittedMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN RESMI JURI KATEGORI GANDA & TUNGGAL BEBAS / SOLO KREATIF (SESUAI CONTOH Juriganda.JPG)
  const gandaTechniqueScore = currentJudge.serangBelaScore ?? currentJudge.teknikScore ?? 0.00;
  const gandaFirmnessScore = currentJudge.kemantapanScore ?? 0.00;
  const gandaSoulfulnessScore = currentJudge.penjiwaanScore ?? currentJudge.koreografiScore ?? 0.00;
  const gandaCombinedScore = Number((gandaTechniqueScore + gandaFirmnessScore + gandaSoulfulnessScore).toFixed(2));
  const gandaTotalAccumulation = Number((SKOR_DASAR_GANDA_SOLO + gandaCombinedScore).toFixed(2));

  const categoryTitle = isSolo
    ? "PENILAIAN KATEGORI SOLO KREATIF / TUNGGAL BEBAS"
    : "PENILAIAN KATEGORI GANDA / DOUBLE";

  const categoryRightBadge = isSolo ? "SOLO KREATIF" : "GANDA/DOUBLE";

  return (
    <div 
      className="bg-[#030612] text-slate-100 flex flex-col justify-between font-sans select-none p-2 sm:p-4 relative overflow-x-auto min-h-screen"
      style={{ minHeight: "100dvh" }}
    >
      <div className="w-full max-w-[1440px] mx-auto flex flex-col justify-between flex-1">
        
        {/* TOP BAR: HEADER SESUAI JURIGANDA.JPG */}
        <div className="grid grid-cols-3 items-center gap-2 mb-3 px-1 pt-1 shrink-0">
          
          {/* LEFT: CONTINGENT (TOP) & ATHLETE NAME (BOTTOM) */}
          <div className="flex flex-col justify-center text-left min-w-0">
            <div className="flex items-center gap-1.5">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="p-1 -ml-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                  title="Kembali ke Menu Utama"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] sm:text-xs font-sans text-[#728299] font-bold uppercase tracking-wider truncate">
                {contingent}
              </span>
            </div>
            <span className={`text-base sm:text-lg md:text-xl font-sans font-black uppercase tracking-wide truncate ${activeCorner === "RED" ? "text-[#ef4444]" : "text-[#2e82f6]"}`}>
              {athleteName}
            </span>
          </div>

          {/* CENTER: ACTIVE CORNER BADGE & CATEGORY TITLE (READ-ONLY, DIKENDALIKAN PANEL DEWAN) */}
          <div className="flex flex-col items-center justify-center">
            {/* ACTIVE CORNER BADGE (READ-ONLY, HANYA DIPILIH OLEH PANEL DEWAN) */}
            <div className="mb-1.5">
              {activeCorner === "BLUE" ? (
                <div className="px-6 sm:px-8 py-1 rounded bg-[#1860ec] text-white font-sans font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(24,96,236,0.7)] flex items-center justify-center gap-1.5 select-none">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  <span>SUDUT BIRU</span>
                </div>
              ) : (
                <div className="px-6 sm:px-8 py-1 rounded bg-[#dc2626] text-white font-sans font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.7)] flex items-center justify-center gap-1.5 select-none">
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  <span>SUDUT MERAH</span>
                </div>
              )}
            </div>

            {/* CATEGORY TITLE CENTERED */}
            <div className="w-full text-center">
              <span className="text-[10px] sm:text-xs md:text-sm font-sans font-black text-white tracking-[0.15em] uppercase">
                {categoryTitle}
              </span>
            </div>
          </div>

          {/* RIGHT: GELANGGANG/PARTAI & CATEGORY BADGE */}
          <div className="flex flex-col justify-center text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              {/* Identitas Juri Terkunci (Non-Interactive, Ditentukan di Halaman Awal) */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#091535] border border-amber-500/50 shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-mono font-black text-amber-300 uppercase tracking-wider">
                  JURI {judgeId}
                </span>
              </div>
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="p-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer mr-1"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] sm:text-xs font-sans text-[#728299] font-bold uppercase tracking-wider truncate">
                GELANGGANG {state.gelanggang || "1"}, Partai {state.partai || "2"}
              </span>
            </div>
            <span className="text-sm sm:text-base md:text-lg font-sans font-black text-[#f59e0b] tracking-wider uppercase truncate">
              {categoryRightBadge}
            </span>
          </div>

        </div>

        {/* MAIN SCORING TABLE SESUAI DENGAN JURIGANDA.JPG */}
        <div className="flex-1 flex flex-col justify-center my-auto">
          <div className="border border-[#142344] rounded-xl bg-[#04091a]/95 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[920px]">
                
                {/* TABLE HEADER */}
                <thead>
                  <tr className="border-b border-[#142344] bg-[#071026]/90 text-[#8291a7]">
                    <th className="w-[18%] py-3 px-4 text-left font-sans font-black text-xs uppercase tracking-wider">
                      KATEGORI PENILAIAN
                    </th>
                    <th className="w-[54%] py-3 px-4 text-center font-sans font-black text-xs uppercase tracking-wider">
                      KONTROL PENILAIAN (TUNING BUTTONS)
                    </th>
                    <th className="w-[12%] py-3 px-4 text-center font-sans font-black text-xs uppercase tracking-wider">
                      NILAI SKOR
                    </th>
                    <th className="w-[16%] py-3 px-4 text-center font-sans font-black text-xs uppercase tracking-wider border-l border-[#142344]">
                      TOTAL SCORE (COMBINED)
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                  
                  {/* BARIS 1: TEKNIK SERANG BELA (0.01 - 0.30) */}
                  <tr className="border-b border-[#142344]">
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-cyan-400 uppercase tracking-wide leading-tight">
                        {isSolo ? "Tekhnik Gerakan" : "TEKNIK SERANG BELA"}
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-cyan-500/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(gandaTechniqueScore - val) < 0.005;
                          return (
                            <button
                              key={`serang-bela-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("serangBelaScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-black text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_16px_rgba(6,182,212,0.95)] border-2 border-cyan-200 scale-105 z-10"
                                  : "bg-[#09152e] hover:bg-[#12234b] text-white border border-[#16274e] hover:border-cyan-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
                        {gandaTechniqueScore.toFixed(2)}
                      </div>
                    </td>

                    {/* TOTAL SCORE (COMBINED) - SPANS ALL 3 ROWS */}
                    <td rowSpan={3} className="py-6 px-4 text-center align-middle border-l border-[#142344] bg-[#030717]/60">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="font-sans font-black text-xs sm:text-sm text-slate-300 uppercase tracking-wider mb-1">
                          TOTAL SCORE
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Technique
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Firmness
                        </span>
                        <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-400">
                          - Soulfulness
                        </span>
                        <div className="mt-3 text-2xl sm:text-3xl md:text-4xl font-mono font-black text-cyan-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]">
                          {gandaCombinedScore.toFixed(2)}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* BARIS 2: KEMANTAPAN & HARMONISASI (0.01 - 0.30) */}
                  <tr className="border-b border-[#142344]">
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-amber-400 uppercase tracking-wide leading-tight">
                        KEMANTAPAN & HARMONISASI
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-amber-500/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(gandaFirmnessScore - val) < 0.005;
                          return (
                            <button
                              key={`kemantapan-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("kemantapanScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-black text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-[#f59e0b] text-slate-950 font-black shadow-[0_0_16px_rgba(245,158,11,0.95)] border-2 border-amber-200 scale-105 z-10"
                                  : "bg-[#09152e] hover:bg-[#12234b] text-white border border-[#16274e] hover:border-amber-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]">
                        {gandaFirmnessScore.toFixed(2)}
                      </div>
                    </td>
                  </tr>

                  {/* BARIS 3: PENJIWAAN & PENGHAYATAN (0.01 - 0.30) */}
                  <tr>
                    <td className="py-4 px-4 align-middle">
                      <div className="font-sans font-black text-xs sm:text-sm text-cyan-400 uppercase tracking-wide leading-tight">
                        PENJIWAAN & PENGHAYATAN
                      </div>
                      <div className="font-mono font-bold text-[10px] sm:text-xs text-cyan-500/80 mt-1">
                        (0.01 - 0.30)
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {TUNING_BUTTON_VALUES.map((val) => {
                          const isSelected = Math.abs(gandaSoulfulnessScore - val) < 0.005;
                          return (
                            <button
                              key={`penjiwaan-${val}`}
                              type="button"
                              disabled={currentJudge.isSubmitted}
                              onClick={() => handleSelectTuning("penjiwaanScore", val)}
                              className={`py-2 px-1 rounded-lg font-mono font-black text-xs sm:text-sm transition-all cursor-pointer text-center select-none ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_16px_rgba(6,182,212,0.95)] border-2 border-cyan-200 scale-105 z-10"
                                  : "bg-[#09152e] hover:bg-[#12234b] text-white border border-[#16274e] hover:border-cyan-500/50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center align-middle">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        SCORE
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
                        {gandaSoulfulnessScore.toFixed(2)}
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* BOTTOM BAR: TOTAL AKUMULASI SCORE JURI X SESUAI JURIGANDA.JPG */}
            <div className="border-t border-[#142344] bg-[#030614] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-sans font-black text-xs sm:text-sm md:text-base text-[#f59e0b] tracking-[0.2em] uppercase">
                  TOTAL AKUMULASI SCORE JURI {judgeId}
                </span>

                {/* STATUS & ACTIONS */}
                {currentJudge.isSubmitted ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[11px] font-mono font-black uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      NILAI TERKIRIM & TERKUNCI (SAH)
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitScore}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all active:scale-95 ml-2"
                  >
                    <Send className="w-3 h-3" />
                    Kirim & Kunci Nilai
                  </button>
                )}
              </div>

              <div className="font-mono font-black text-2xl sm:text-3xl md:text-4xl text-[#f59e0b] drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]">
                {gandaTotalAccumulation.toFixed(2)}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* TOAST NOTIFICATION ON SUBMIT */}
      {submittedMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-300 flex items-center gap-2 animate-bounce z-50 font-bold text-xs uppercase">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{submittedMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TgrsJuryPad;
