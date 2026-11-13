/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PANEL KETUA DEWAN UNTUK KATEGORI JURUS TGRS (TUNGGAL, GANDA, REGU, SOLO KREATIF)
 * Standar Resmi PB IPSI & PERSILAT 2026
 */

import React, { useState, useEffect } from "react";
import {
  TgrsMatchState,
  TgrsDewanPenalties,
  computeTgrsFinalResult,
  computeTgrsMedianAndStdDev,
  formatTimeMMSS,
  saveTgrsLiveState,
  switchTgrsCorner,
  syncActiveCornerToPerformer,
  determineTgrsWinner,
  useTgrsDualElapsed,
  useTgrsLiveElapsed
} from "../../utils/tgrsScoringEngine";
import { soundEffects } from "../../utils/audio";
import { sound } from "../../utils/sound";
import confetti from "canvas-confetti";
import { Clock, CheckCircle2, ShieldAlert, Trophy, X, ChevronUp, AlertTriangle } from "lucide-react";
import { TgrsVictoryDisplay } from "./TgrsVictoryDisplay";

interface TgrsDewanControlProps {
  state: TgrsMatchState;
  onUpdateState: (updater: (prev: TgrsMatchState) => TgrsMatchState) => void;
  onBackToLanding?: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TgrsDewanControl: React.FC<TgrsDewanControlProps> = (props) => {
  const {
    state,
    onUpdateState,
    onBackToLanding,
    onSwitchToTanding,
    onToggleFullscreen,
    isFullscreen = false
  } = props;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHukumanModal, setShowHukumanModal] = useState(false);
  const [showVictoryPreview, setShowVictoryPreview] = useState(false);
  const [editForm, setEditForm] = useState({
    athleteName: state.athleteName,
    contingent: state.contingent,
    category: state.category,
    gender: state.gender,
    ageCategory: state.ageCategory,
    partai: state.partai,
    stage: state.stage,
    gelanggang: state.gelanggang
  });

  const [nativeFs, setNativeFs] = useState(false);
  const [localJudgesCount, setLocalJudgesCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("jrz_tgrs_judges_count") || localStorage.getItem("jrz_judges_count");
      if (stored) return Math.max(4, Math.min(10, parseInt(stored, 10)));
    } catch {}
    return Math.max(4, Math.min(10, state.judgesCount || 10));
  });

  useEffect(() => {
    const handleJudgesCountChanged = (e: any) => {
      const c = e.detail ? Number(e.detail) : 10;
      if (c >= 4 && c <= 10) {
        setLocalJudgesCount(c);
        onUpdateState((prev) => {
          if (prev.judgesCount === c) return prev;
          const next = { ...prev, judgesCount: c };
          saveTgrsLiveState(next);
          return next;
        });
      }
    };
    window.addEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
    return () => window.removeEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
  }, [onUpdateState]);

  useEffect(() => {
    const handleFs = () => {
      setNativeFs(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFs);
    document.addEventListener("webkitfullscreenchange", handleFs);
    return () => {
      document.removeEventListener("fullscreenchange", handleFs);
      document.removeEventListener("webkitfullscreenchange", handleFs);
    };
  }, []);

  const isFs = isFullscreen || nativeFs;

  const defaultPenalties: TgrsDewanPenalties = {
    toleransiWaktuCount: 0,
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    senjataJatuhLuarGelanggangCount: 0,
    senjataRusakPatahCount: 0,
    atributLepasCount: 0,
    menahanGerakanCount: 0,
    penaltiWaktuOtomatis: 0,
    diskualifikasi: false
  };

  // Penalties adjustment
  const handleAdjustPenalty = (field: keyof TgrsDewanPenalties, delta: number) => {
    const isFinishedCorner = Boolean((state.activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer)?.isFinished);
    if (isFinishedCorner) return; // Mode Cek Nilai: skor sudut selesai terkunci
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const prevPenalties = prev.dewanPenalties || defaultPenalties;
      const currentVal = Number(prevPenalties[field]) || 0;
      const nextVal = Math.max(0, currentVal + delta);
      const updatedPenalties: TgrsDewanPenalties = {
        ...prevPenalties,
        [field]: nextVal
      };
      const result = computeTgrsFinalResult(
        prev.category,
        prev.judges,
        updatedPenalties,
        prev.judgesCount
      );
      const isBlue = prev.activeCorner === "BLUE";
      const updatedBlue = isBlue
        ? {
            ...prev.bluePerformer,
            dewanPenalties: updatedPenalties,
            totalPenaltiDewan: result.totalPenaltiDewan,
            finalScore: result.finalScore
          }
        : prev.bluePerformer;
      const updatedRed = !isBlue
        ? {
            ...prev.redPerformer,
            dewanPenalties: updatedPenalties,
            totalPenaltiDewan: result.totalPenaltiDewan,
            finalScore: result.finalScore
          }
        : prev.redPerformer;

      const next = {
        ...prev,
        dewanPenalties: updatedPenalties,
        finalScore: result.finalScore,
        averageScore: result.averageScore,
        totalPenaltiDewan: result.totalPenaltiDewan,
        bluePerformer: updatedBlue,
        redPerformer: updatedRed
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  const handleToggleDq = () => {
    const isFinishedCorner = Boolean((state.activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer)?.isFinished);
    if (isFinishedCorner) return; // Mode Cek Nilai: skor sudut selesai terkunci
    try { soundEffects.playBuzzer(); } catch {}
    onUpdateState((prev) => {
      const prevPenalties = prev.dewanPenalties || defaultPenalties;
      const updatedPenalties: TgrsDewanPenalties = {
        ...prevPenalties,
        diskualifikasi: !prevPenalties.diskualifikasi
      };
      const result = computeTgrsFinalResult(
        prev.category,
        prev.judges,
        updatedPenalties,
        prev.judgesCount
      );
      const isBlue = prev.activeCorner === "BLUE";
      const updatedBlue = isBlue
        ? {
            ...prev.bluePerformer,
            dewanPenalties: updatedPenalties,
            totalPenaltiDewan: result.totalPenaltiDewan,
            finalScore: result.finalScore
          }
        : prev.bluePerformer;
      const updatedRed = !isBlue
        ? {
            ...prev.redPerformer,
            dewanPenalties: updatedPenalties,
            totalPenaltiDewan: result.totalPenaltiDewan,
            finalScore: result.finalScore
          }
        : prev.redPerformer;

      const next = {
        ...prev,
        dewanPenalties: updatedPenalties,
        finalScore: result.finalScore,
        averageScore: result.averageScore,
        totalPenaltiDewan: result.totalPenaltiDewan,
        redPerformer: updatedRed
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Corner Switching & VS Management (Klik Kolom)
  const handleSwitchCorner = (target: "BLUE" | "RED") => {
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const next = switchTgrsCorner(prev, target);
      const targetPerformer = target === "BLUE" ? next.bluePerformer : next.redPerformer;
      if (targetPerformer?.isFinished) {
        next.isTimerRunning = false;
        next.isTimer2Running = false;
        next.isFinished = true;
      }
      saveTgrsLiveState(next);
      return next;
    });
  };

  const handleFinishCurrentCorner = () => {
    try { soundEffects.playBuzzer(); } catch {}
    onUpdateState((prev) => {
      const synced = syncActiveCornerToPerformer(prev);
      const isBlue = synced.activeCorner === "BLUE";
      const updatedBlue = isBlue
        ? { ...synced.bluePerformer, isFinished: true, isTimerRunning: false }
        : synced.bluePerformer;
      const updatedRed = !isBlue
        ? { ...synced.redPerformer, isFinished: true, isTimerRunning: false }
        : synced.redPerformer;

      const next: TgrsMatchState = {
        ...synced,
        isFinished: true,
        isTimerRunning: false,
        bluePerformer: updatedBlue,
        redPerformer: updatedRed
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Announce Party Winner & Sahkan Nilai
  const handleAnnouncePartyWinner = () => {
    try {
      sound.playGong();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    onUpdateState((prev) => {
      const winnerCalc = determineTgrsWinner(prev);
      const next: TgrsMatchState = {
        ...prev,
        isTimerRunning: false,
        isFinished: true,
        winnerCorner: winnerCalc.winnerCorner,
        winnerReason: winnerCalc.reason,
        winnerAnnounced: true
      };
      saveTgrsLiveState(next);
      return next;
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jrz_tgrs_winner_announced"));
    }
  };

  const handleCancelWinner = () => {
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const next: TgrsMatchState = {
        ...prev,
        winnerAnnounced: false,
        winnerCorner: null,
        winnerReason: ""
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Reset a single jury
  const handleResetJudge = (jId: number) => {
    const isFinishedCorner = Boolean((state.activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer)?.isFinished);
    if (isFinishedCorner) return; // Mode Cek Nilai: skor sudut selesai terkunci
    const targetJudge = currentJudgesMap[jId];
    if (targetJudge?.isSubmitted) {
      alert(`Nilai Juri ${jId} sudah terkunci & sah, tidak dapat diubah kembali.`);
      return;
    }
    if (!confirm(`Reset nilai Juri ${jId}?`)) return;
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const isTunggalOrRegu = prev.category === "TUNGGAL" || prev.category === "REGU";
      const resetJ = {
        id: jId,
        name: `Juri ${jId}`,
        errorsCount: 0,
        errorHistory: [],
        kebenaranScore: isTunggalOrRegu ? 9.90 : 5.50,
        kemantapanScore: isTunggalOrRegu ? 0.00 : 5.50,
        serangBelaScore: prev.category === "GANDA" ? 5.50 : undefined,
        teknikScore: prev.category === "SOLO_KREATIF" ? 5.50 : undefined,
        koreografiScore: prev.category === "SOLO_KREATIF" ? 5.50 : undefined,
        totalScore: isTunggalOrRegu ? 9.90 : 11.00,
        isSubmitted: false
      };
      const nextJudges = {
        ...prev.judges,
        [jId]: resetJ
      };
      const result = computeTgrsFinalResult(prev.category, nextJudges, prev.dewanPenalties, prev.judgesCount);
      const next = {
        ...prev,
        judges: nextJudges,
        finalScore: result.finalScore,
        averageScore: result.averageScore,
        totalPenaltiDewan: result.totalPenaltiDewan
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  const handleSaveEdit = () => {
    let label = "SENI TUNGGAL BAKU IPSI";
    if (editForm.category === "GANDA") label = "SENI GANDA IPSI";
    if (editForm.category === "REGU") label = "SENI REGU IPSI";
    if (editForm.category === "SOLO_KREATIF") label = "SOLO KREATIF IPSI";

    onUpdateState((prev) => {
      const next: TgrsMatchState = {
        ...prev,
        athleteName: editForm.athleteName.trim() || prev.athleteName,
        contingent: editForm.contingent.trim() || prev.contingent,
        category: editForm.category,
        categoryLabel: label,
        gender: editForm.gender,
        ageCategory: editForm.ageCategory,
        partai: editForm.partai.trim() || prev.partai,
        stage: editForm.stage.trim() || prev.stage,
        gelanggang: editForm.gelanggang.trim() || prev.gelanggang
      };
      const result = computeTgrsFinalResult(next.category, next.judges, next.dewanPenalties, next.judgesCount);
      next.finalScore = result.finalScore;
      next.averageScore = result.averageScore;
      next.totalPenaltiDewan = result.totalPenaltiDewan;
      saveTgrsLiveState(next);
      return next;
    });
    setShowEditModal(false);
  };

  // Sudut aktif & data performer
  const activeCorner = state.activeCorner || "BLUE";
  const activePerformer = activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer;
  const currentJudgesMap = activePerformer?.judges || state.judges || {};
  const isTunggalOrRegu = state.category === "TUNGGAL" || state.category === "REGU";
  const dewanPenalties: TgrsDewanPenalties = activePerformer?.dewanPenalties || state.dewanPenalties || defaultPenalties;

  // Kolom Juri Dinamis (Mengikuti state.judgesCount dari Sekretaris, 4 s/d 10 Juri)
  const totalJudgesCount = Math.max(4, Math.min(10, state.judgesCount || localJudgesCount || 10));
  const judgeColumns = Array.from({ length: totalJudgesCount }, (_, i) => {
    const id = i + 1;
    const j = currentJudgesMap[id];
    const errors = j?.errorsCount ?? 0;
    const kebenaran = j?.kebenaranScore !== undefined ? Number(j.kebenaranScore) : (isTunggalOrRegu ? 9.90 : 5.50);
    const kemantapan = j?.kemantapanScore !== undefined ? Number(j.kemantapanScore) : (isTunggalOrRegu ? 0.00 : 5.50);
    const total = j?.totalScore !== undefined ? Number(j.totalScore) : Number((kebenaran + kemantapan).toFixed(2));
    return {
      id,
      errors,
      kebenaran,
      kemantapan,
      total,
      isSubmitted: Boolean(j?.isSubmitted)
    };
  });

  const activeJudgesList = Array.from({ length: totalJudgesCount }, (_, i) => {
    const id = i + 1;
    return currentJudgesMap[id] || {
      id,
      name: `Juri ${id}`,
      errorsCount: 0,
      errorHistory: [],
      kebenaranScore: isTunggalOrRegu ? 9.90 : 5.50,
      kemantapanScore: isTunggalOrRegu ? 0.00 : 5.50,
      totalScore: isTunggalOrRegu ? 9.90 : 11.00,
      isSubmitted: false
    };
  });
  const submittedCount = activeJudgesList.filter((j) => j.isSubmitted).length;

  // Nilai masuk & penentu keunggulan kolom skor
  const blueScore = Number(state.bluePerformer?.finalScore ?? 0);
  const redScore = Number(state.redPerformer?.finalScore ?? 0);
  const blueHasScore = Boolean(state.bluePerformer?.isFinished || blueScore > 0);
  const redHasScore = Boolean(state.redPerformer?.isFinished || redScore > 0);
  const hasScores = (blueHasScore && blueScore > 0) || (redHasScore && redScore > 0);
  const bothCornersFinished = Boolean(state.bluePerformer?.isFinished && state.redPerformer?.isFinished);

  const isBlueLeading = hasScores && blueScore > redScore;
  const isRedLeading = hasScores && redScore > blueScore;
  const { performerElapsed, timer3MinElapsed, isSafeZone, isOvertime } = useTgrsDualElapsed(state);
  const timerPercentage = Math.min(100, (timer3MinElapsed / 180) * 100);

  const medianStats = computeTgrsMedianAndStdDev(
    judgeColumns.map((j) => ({ id: j.id, score: j.total }))
  );
  const medianJudgeIds = new Set(medianStats.medianJudgeIds);
  const medianValue = medianStats.median;
  const stdDevValue = medianStats.stdDev;
  const currentDewanPenalti = activePerformer?.totalPenaltiDewan ?? state.totalPenaltiDewan ?? 0;
  const calculatedFinalScore = Math.max(0, Number((medianValue - currentDewanPenalti).toFixed(3)));

  return (
    <div className="bg-[#030614] min-h-screen text-slate-100 flex flex-col justify-between font-sans select-none p-2 sm:p-4 space-y-3 relative">
      
      {/* HEADER PANEL DEWAN KATEGORI JURUS (DISEMBUNYIKAN SAAT MODE FULL SCREEN) */}
      {!isFs && (
        <>
          {/* HEADER: KATEGORI TGRS & PESILAT INFO */}
          <div className="bg-[#08122c] border border-cyan-500/30 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-mono font-black text-xs shadow-inner shrink-0">
                DEWAN
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-black text-white uppercase tracking-wider truncate">
                    {state.athleteName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono text-[9.5px] font-black uppercase shrink-0">
                    {state.gender}
                  </span>
                  <button
                    onClick={() => {
                      setEditForm({
                        athleteName: state.athleteName,
                        contingent: state.contingent,
                        category: state.category,
                        gender: state.gender,
                        ageCategory: state.ageCategory,
                        partai: state.partai,
                        stage: state.stage,
                        gelanggang: state.gelanggang
                      });
                      setShowEditModal(true);
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-mono font-bold uppercase cursor-pointer"
                    title="Edit Data Pesilat / Partai"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-1">
                  <span className="text-amber-400 font-bold truncate">{state.contingent}</span>
                  <span>•</span>
                  <span className="text-cyan-300">{state.ageCategory}</span>
                  <span>•</span>
                  <span className="text-slate-400">Partai {state.partai} ({state.stage})</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Gelanggang {state.gelanggang}</span>
                </div>
              </div>
            </div>

            {/* KATEGORI OTOMATIS: IDENTIFIKASI DARI PANEL SEKRETARIS */}
            <div className="flex items-center gap-2 bg-[#020512] border border-cyan-500/30 px-3.5 py-2 rounded-2xl shrink-0 self-stretch lg:self-auto justify-center">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                KATEGORI:
              </span>
              <span className="px-3.5 py-1.5 rounded-xl font-mono font-black text-xs uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                {state.categoryLabel || (state.category === "SOLO_KREATIF" ? "SOLO KREATIF IPSI" : `SENI ${state.category} IPSI`)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* TOMBOL IKON BATAS (menubatas.png) MEMANJANG DI ATAS KEDUA SUDUT & TIMER */}
      <div className={`w-full ${isFs ? "mt-0" : "-mt-3 sm:-mt-3.5"} px-0.5 z-20`}>
        <button
          type="button"
          onClick={() => setShowHukumanModal((prev) => !prev)}
          className="w-full relative group py-1 sm:py-1.5 flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-[0.99] select-none"
          title={showHukumanModal ? "Tekan Tombol Ikon Batas untuk Kembali ke Tampilan Layar Log Nilai Juri & Sudut" : "Tekan Tombol Ikon Batas untuk Membuka Menu Hukuman Dewan & Pengumuman Pemenang"}
        >
          {/* Garis Horizontal Memanjang (Gradasi Biru/Cyan ke Merah/Pink) */}
          <div className={`absolute inset-x-0 h-[3px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-rose-500 rounded-full transition-all duration-300 ${
            showHukumanModal
              ? "h-[4px] shadow-[0_0_24px_rgba(34,211,238,0.95)] ring-1 ring-cyan-300"
              : "shadow-[0_0_12px_rgba(236,72,153,0.6)] group-hover:h-[4px] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.8)]"
          }`} />
          
          {/* Ikon Tombol Batas di Tengah (menubatas.png) */}
          <div className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#050b1d] border-2 transition-all duration-300 flex items-center justify-center p-1 overflow-hidden ${
            showHukumanModal 
              ? "border-cyan-300 ring-2 ring-cyan-400/70 shadow-[0_0_22px_rgba(34,211,238,0.95)] scale-110" 
              : "border-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.8)] group-hover:border-cyan-300 group-hover:scale-110"
          }`}>
            <img 
              src="/menubatas.png" 
              alt="Menu Batas Dewan" 
              className={`w-full h-full object-contain filter invert drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] transition-all duration-300 ${
                showHukumanModal 
                  ? "rotate-90 scale-105 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]" 
                  : "rotate-0 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
              }`} 
            />
          </div>
        </button>
      </div>

      {showHukumanModal ? (
        /* POP UP MENU HUKUMAN DEWAN & PENGUMUMAN PEMENANG (NAIK KE ATAS PAS DENGAN BATAS MENUTUPI SUDUT & LOG JURI) */
        <div className="w-full -mt-1 sm:-mt-1.5 space-y-3.5 animate-in slide-in-from-bottom duration-300">
          {/* HEADER BAR: INFORMASI & NAVIGASI KEMBALI */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-[#0a1b38] to-rose-950/90 border border-cyan-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <h2 className="text-xs sm:text-sm font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                  <span>MENU HUKUMAN DEWAN & PENGUMUMAN PEMENANG</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                    STANDAR IPSI 2026
                  </span>
                </h2>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Klik tombol ikon batas (menubatas.png) di atas untuk kembali ke tampilan layar log nilai juri dan sudut
                </p>
              </div>
            </div>

            {/* CORNER INDICATOR & TUTUP */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase bg-[#020512] border border-cyan-500/40 text-slate-200 flex items-center gap-2 shadow-inner">
                <span className={`w-2.5 h-2.5 rounded-full ${state.activeCorner === "BLUE" ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-rose-500 shadow-[0_0_8px_#ef4444]"}`} />
                <span>Sudut Aktif: {state.activeCorner === "BLUE" ? "BIRU" : "MERAH"} ({activePerformer?.athleteName})</span>
              </div>

              <button
                type="button"
                onClick={() => setShowHukumanModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer"
                title="Kembali ke Layar Log Nilai Juri"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* DUA KOLOM: HUKUMAN DEWAN & PENGUMUMAN PEMENANG + REALTIME JURY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* KOLOM KIRI: HUKUMAN DEWAN STANDAR IPSI (5 COLS) */}
            <div className="lg:col-span-5 bg-[#071026] border border-rose-500/40 rounded-3xl p-4 flex flex-col justify-between space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div>
                  <span className="text-xs font-mono font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5">
                    HUKUMAN DEWAN PERTANDINGAN
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Dikenakan pada: Sudut {state.activeCorner === "BLUE" ? "BIRU" : "MERAH"}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/70 border border-rose-500/30 px-2.5 py-1 rounded-xl">
                  Total: -{state.totalPenaltiDewan.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {(state.category === "REGU" ? [
                  {
                    field: "toleransiWaktuCount" as keyof TgrsDewanPenalties,
                    label: "1. penampilan lebih atau kurang dari toleransi waktu",
                  },
                  {
                    field: "keluarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "2. penampilan keluar gelanggang 10Mx10M",
                  },
                  {
                    field: "atributLepasCount" as keyof TgrsDewanPenalties,
                    label: "3. pakaian tidak sesuai aturan",
                  },
                  {
                    field: "menahanGerakanCount" as keyof TgrsDewanPenalties,
                    label: "4. menahan gerakan lebih dari 5 (lima) detik",
                  },
                ] : state.category === "SOLO_KREATIF" ? [
                  {
                    field: "keluarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "1. penampilan satu kaki keluar gelanggang 10M x 10M",
                  },
                  {
                    field: "senjataJatuhCount" as keyof TgrsDewanPenalties,
                    label: "2. senjata jatuh tidak memenuhi sinopsis",
                  },
                  {
                    field: "senjataJatuhLuarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "3. senjata jatuh keluar gelanggang saat masih harus digunakan",
                  },
                  {
                    field: "senjataRusakPatahCount" as keyof TgrsDewanPenalties,
                    label: "4. senjata terlepas dari gagangnya / patah / rusak",
                  },
                  {
                    field: "atributLepasCount" as keyof TgrsDewanPenalties,
                    label: "5. mengenakan pakaian yang tidak sesuai dengan ketentuan",
                  },
                  {
                    field: "toleransiWaktuCount" as keyof TgrsDewanPenalties,
                    label: "6. penampilan melebihi / kurang dari toleransi waktu",
                  },
                ] : state.category === "GANDA" ? [
                  {
                    field: "toleransiWaktuCount" as keyof TgrsDewanPenalties,
                    label: "1. Penampilan lebih/kurang dari toleransi waktu",
                  },
                  {
                    field: "keluarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "2. penampilan keluar gelanggang 10M x 10M",
                  },
                  {
                    field: "senjataJatuhCount" as keyof TgrsDewanPenalties,
                    label: "3. senjata jatuh tidak sesuai dengan deskripsi/sinopsis",
                  },
                  {
                    field: "senjataJatuhLuarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "4. senjata jatuh diluar gelanggang saat tim masih harus menggunakannya",
                  },
                  {
                    field: "atributLepasCount" as keyof TgrsDewanPenalties,
                    label: "5. pakaian tidak sesuai aturan (atasan & bawahan, serta kain samping & ikat kepala tidak satu motif / pakaian robek)",
                  },
                  {
                    field: "menahanGerakanCount" as keyof TgrsDewanPenalties,
                    label: "6. menahan gerakan lebih dari 5 (lima) detik",
                  },
                ] : [
                  {
                    field: "toleransiWaktuCount" as keyof TgrsDewanPenalties,
                    label: "1. Penampilan melebihi / kurang dari toleransi waktu",
                  },
                  {
                    field: "keluarGelanggangCount" as keyof TgrsDewanPenalties,
                    label: "2. Penampilan keluar gelanggang 10M x 10M",
                  },
                  {
                    field: "senjataJatuhCount" as keyof TgrsDewanPenalties,
                    label: "3. Senjata Jatuh, Menyentuh matras",
                  },
                  {
                    field: "atributLepasCount" as keyof TgrsDewanPenalties,
                    label: "4. Pakaian tidak sesuai aturan",
                  },
                  {
                    field: "menahanGerakanCount" as keyof TgrsDewanPenalties,
                    label: "5. menahan gerakan lebih dari 5 (lima) detik",
                  },
                ]).map((item) => {
                  const count = Number(dewanPenalties[item.field]) || 0;
                  return (
                    <div
                      key={item.field}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#030716] border border-rose-500/30 gap-3"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-mono font-bold text-slate-200 block leading-snug">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustPenalty(item.field, 1)}
                          title="Beri pengurangan nilai (-0.50)"
                          className="px-2.5 h-7 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-mono font-black text-xs cursor-pointer border border-rose-500/40 active:scale-95 transition-all shadow-sm"
                        >
                          -0.50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPenalty(item.field, -1)}
                          disabled={count <= 0}
                          title="Hapus 1 hukuman terakhir"
                          className="px-2.5 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs uppercase cursor-pointer border border-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          clr
                        </button>
                        <span className="min-w-8 h-7 px-2 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 font-mono font-black text-sm text-amber-400">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DISQUALIFICATION BUTTON */}
              <button
                onClick={handleToggleDq}
                className={`w-full py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition-all ${
                  dewanPenalties.diskualifikasi
                    ? "bg-rose-600 text-white ring-4 ring-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                    : "bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-rose-500/50"
                }`}
              >
                <span>
                  {dewanPenalties.diskualifikasi ? "BATALKAN DISKUALIFIKASI (DIS)" : "DISKUALIFIKASI PERAGAAN (DIS)"}
                </span>
              </button>
            </div>

            {/* KOLOM KANAN: PENGUMUMAN PEMENANG & REALTIME SCORE FEED (7 COLS) */}
            <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
              {/* MENU UMUMKAN PEMENANG PARTAI (VS) */}
              <div className="p-4 rounded-3xl bg-[#091535] border border-amber-500/40 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400 inline" />
                    PENGUMUMAN PEMENANG PARTAI (VS)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase ${
                    bothCornersFinished
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  }`}>
                    {bothCornersFinished ? "✓ KEDUA SUDUT SELESAI" : "MENUNGGU PENAMPILAN"}
                  </span>
                </div>

                {/* HEAD-TO-HEAD SUMMARY */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* BIRU */}
                  <div className={`p-2.5 rounded-2xl border transition-all ${
                    isBlueLeading ? "bg-blue-950/80 border-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-blue-950/40 border-blue-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
                        SUDUT BIRU {isBlueLeading ? "★ UNGGUL" : ""}
                      </span>
                      <span className={`text-[9px] font-mono font-bold ${
                        state.bluePerformer?.isFinished ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {state.bluePerformer?.isFinished ? "SELESAI" : "BELUM"}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                      {state.bluePerformer?.athleteName || "PESILAT BIRU"}
                    </h4>
                    <div className="text-right mt-1">
                      <span className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                        {blueScore.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* MERAH */}
                  <div className={`p-2.5 rounded-2xl border transition-all ${
                    isRedLeading ? "bg-rose-950/80 border-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-rose-950/40 border-rose-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-rose-300 uppercase">
                        SUDUT MERAH {isRedLeading ? "★ UNGGUL" : ""}
                      </span>
                      <span className={`text-[9px] font-mono font-bold ${
                        state.redPerformer?.isFinished ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {state.redPerformer?.isFinished ? "SELESAI" : "BELUM"}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                      {state.redPerformer?.athleteName || "PESILAT MERAH"}
                    </h4>
                    <div className="text-right mt-1">
                      <span className="text-xs sm:text-sm font-mono font-black text-rose-300">
                        {redScore.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WINNER ACTION / STATUS */}
                <div>
                  {state.winnerAnnounced ? (
                    <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 text-center space-y-1.5 shadow-xl">
                      <span className="text-xs sm:text-sm font-mono font-black text-emerald-300 uppercase tracking-wider block">
                        PEMENANG RESMI PARTAI TELAH DIUMUMKAN: SUDUT {state.winnerCorner === "BLUE" ? "BIRU" : state.winnerCorner === "RED" ? "MERAH" : "DRAW"}
                      </span>
                      <span className="text-xs font-mono text-slate-300 block">
                        {state.winnerReason}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowVictoryPreview(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                        >
                          Lihat Layar Pemenang
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelWinner}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-rose-300 uppercase font-bold cursor-pointer transition-colors"
                        >
                          Batalkan / Revisi Pengumuman
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnnouncePartyWinner}
                      className="w-full py-3 rounded-2xl font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                    >
                      SAHKAN & UMUMKAN PEMENANG PARTAI (VS)
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE JURY SCORE FEED */}
              <div className="bg-[#050f24] border border-cyan-500/30 rounded-3xl p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                    DAFTAR NILAI REAL-TIME SELURUH JURI ({totalJudgesCount} JURI BERTUGAS)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#03091e] border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold uppercase">
                    {totalJudgesCount} Juri (Panel Sekretaris)
                  </span>
                </div>

                {/* JURIES GRID */}
                <div className={`grid gap-2 ${
                  totalJudgesCount <= 5 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                }`}>
                  {activeJudgesList.map((j) => (
                    <div
                      key={j.id}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        j.isSubmitted
                          ? "bg-[#06182c] border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          : "bg-[#040817] border-cyan-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-xs font-mono font-black text-white">{j.name}</span>
                        </div>
                        {j.isSubmitted ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8.5px] font-mono font-bold uppercase">
                            Sah
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[8.5px] font-mono font-bold uppercase">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="my-1.5 text-center">
                        <span className="text-2xl font-mono font-black text-amber-400 leading-none block">
                          {(j.totalScore || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
                        <span className={`text-[8.5px] font-mono font-bold flex items-center gap-1 ${
                          j.isSubmitted ? "text-emerald-400" : "text-slate-500"
                        }`}>
                          {j.isSubmitted ? "🔒 Terkunci (Sah)" : "● Menilai..."}
                        </span>
                        {!j.isSubmitted && (
                          <button
                            onClick={() => handleResetJudge(j.id)}
                            className="text-[9px] font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAMPILAN AWAL: KEDUA SUDUT (BIRU & MERAH), TIMER TENGAH & LOG NILAI JURI RESMI */
        <>
          {/* SISTEM PENAMPIL (SUDUT BIRU vs SUDUT MERAH) & TIMER TENGAH (GRID 5-2-5) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch -mt-1 sm:-mt-1.5">
        {/* SUDUT BIRU CARD (5 COLS) (Klik kolom untuk memilih atlet) */}
        <div 
          onClick={() => handleSwitchCorner("BLUE")}
          className={`md:col-span-5 p-3.5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
            state.activeCorner === "BLUE"
              ? "bg-gradient-to-br from-blue-950 via-[#0a2760] to-blue-900 border-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-2 ring-cyan-400/50"
              : isBlueLeading
                ? "bg-gradient-to-br from-blue-950/70 via-[#0a2760]/70 to-blue-900/70 border-cyan-500/50 hover:border-cyan-400"
                : "bg-gradient-to-b from-[#222838]/95 via-[#1a1f2c]/95 to-[#131722]/95 border-slate-600/70 shadow-md text-slate-300 hover:border-blue-500/60"
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
            <span className={`text-xs font-mono font-black uppercase tracking-widest flex items-center gap-1.5 ${
              state.activeCorner === "BLUE" || isBlueLeading ? "text-cyan-300" : "text-blue-400"
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm" />
              SUDUT BIRU {isBlueLeading ? "★ UNGGUL" : ""}
            </span>
          </div>

          <div className="my-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase truncate">
                {state.bluePerformer?.athleteName || "PESILAT BIRU"}
              </h3>
              <span className="text-xs font-mono text-cyan-300 block truncate">
                {state.bluePerformer?.contingent || "KONTINGEN BIRU"}
              </span>
            </div>

            {/* Nilai Sah dipindahkan ke sudut kanan sejajar dengan nama atlet */}
            <div className="text-right shrink-0 bg-blue-950/80 border border-blue-500/40 px-3 py-1.5 rounded-xl shadow-inner">
              <span className="text-[10px] text-slate-300 block font-mono font-bold uppercase tracking-wider">
                NILAI SAH
              </span>
              <strong className={`text-lg sm:text-xl font-mono font-black block leading-none ${
                isBlueLeading ? "text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]" : "text-amber-400"
              }`}>
                {state.bluePerformer?.finalScore?.toFixed(3) || "0.000"}
              </strong>
            </div>
          </div>
        </div>

        {/* KOLOM TENGAH: TIMER WAKTU PENAMPIL & SISA TARGET (03:00) (2 COLS) */}
        <div className="md:col-span-2 bg-gradient-to-b from-[#091535] via-[#040a1d] to-[#091535] border-2 border-cyan-400/60 rounded-2xl p-2.5 text-center shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col justify-between items-center relative overflow-hidden">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between pb-1 border-b border-cyan-500/30">
            <span className="text-[9px] font-mono font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>TIMER</span>
            </span>
            <span className={`px-1.5 py-0.2 rounded font-mono text-[8px] font-black uppercase ${
              activePerformer?.isFinished
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : state.isTimerRunning
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse"
                  : state.isFinished
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              {activePerformer?.isFinished ? "✓ SELESAI" : state.isTimerRunning ? "⏱️ JALAN" : state.isFinished ? "✓ SELESAI" : "⏸️ JEDA"}
            </span>
          </div>

          {/* Main Timer Digits */}
          <div className="my-1 sm:my-1.5 text-center w-full">
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
              WAKTU PENAMPIL
            </span>
            <span className={`text-2xl sm:text-3xl font-mono font-black tabular-nums tracking-tight leading-none block ${
              isOvertime
                ? "text-rose-400 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]"
                : isSafeZone
                  ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.7)]"
                  : "text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            }`}>
              {formatTimeMMSS(performerElapsed)}
            </span>
            <div className="text-[7.5px] font-mono text-slate-400 mt-0.5">
              Toleransi: <span className="text-emerald-400 font-bold">{formatTimeMMSS(Math.max(0, (state.targetDuration || 180) - 5))} - {formatTimeMMSS((state.targetDuration || 180) + 5)}</span>
            </div>
          </div>

          {/* Timer Batas Waktu & Progress Bar */}
          <div className="w-full pt-1.5 border-t border-cyan-900/40 space-y-1">
            <div className="flex items-center justify-between text-[8.5px] font-mono">
              <span className="text-slate-400 font-bold uppercase truncate">
                BATAS WAKTU:
              </span>
              <strong className={`text-xs sm:text-sm font-mono font-black shrink-0 ${
                timer3MinElapsed >= (state.targetDuration || 180) ? "text-rose-400" : "text-amber-300"
              }`}>
                {formatTimeMMSS(timer3MinElapsed)} / {formatTimeMMSS(state.targetDuration || 180)}
              </strong>
            </div>

            {/* Progress Bar (0 -> 180s) */}
            <div className="w-full bg-slate-900/90 rounded-full h-1.5 border border-slate-700/80 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  timer3MinElapsed >= 180
                    ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                    : isSafeZone
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* SUDUT MERAH CARD (5 COLS) (Klik kolom untuk memilih atlet) */}
        <div 
          onClick={() => handleSwitchCorner("RED")}
          className={`md:col-span-5 p-3.5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
            state.activeCorner === "RED"
              ? "bg-gradient-to-br from-rose-950 via-[#4e0915] to-red-900 border-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] ring-2 ring-rose-400/50"
              : isRedLeading
                ? "bg-gradient-to-br from-rose-950/70 via-[#4e0915]/70 to-red-900/70 border-rose-500/50 hover:border-rose-400"
                : "bg-gradient-to-b from-[#222838]/95 via-[#1a1f2c]/95 to-[#131722]/95 border-slate-600/70 shadow-md text-slate-300 hover:border-rose-500/60"
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
            <span className={`text-xs font-mono font-black uppercase tracking-widest flex items-center gap-1.5 ${
              state.activeCorner === "RED" || isRedLeading ? "text-rose-300" : "text-rose-400"
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
              SUDUT MERAH {isRedLeading ? "★ UNGGUL" : ""}
            </span>
          </div>

          <div className="my-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase truncate">
                {state.redPerformer?.athleteName || "PESILAT MERAH"}
              </h3>
              <span className="text-xs font-mono text-rose-300 block truncate">
                {state.redPerformer?.contingent || "KONTINGEN MERAH"}
              </span>
            </div>

            {/* Nilai Sah dipindahkan ke sudut kanan sejajar dengan nama atlet */}
            <div className="text-right shrink-0 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-xl shadow-inner">
              <span className="text-[10px] text-slate-300 block font-mono font-bold uppercase tracking-wider">
                NILAI SAH
              </span>
              <strong className={`text-lg sm:text-xl font-mono font-black block leading-none ${
                isRedLeading ? "text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]" : "text-amber-400"
              }`}>
                {state.redPerformer?.finalScore?.toFixed(3) || "0.000"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* TAMPILAN RESMI DEWAN: LOG NILAI JURI, MEDIAN & NILAI AKHIR (STANDAR IPSI 2026 - dewantunggal2.jpg) */}
      <div className="w-full space-y-3.5">
        {/* TOP SECTION: TABEL LOG NILAI SELURUH JURI (1 - N) */}
        <div className="w-full bg-[#070e28] border-2 border-blue-900/80 rounded-2xl p-2.5 sm:p-4 shadow-2xl overflow-hidden space-y-2.5">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full border-collapse border border-blue-800/80 min-w-[700px] text-center font-mono">
              <thead>
                <tr className="border-b-2 border-blue-800/80 text-slate-100 font-bold text-xs sm:text-sm bg-[#0a1845]">
                  <th className="text-left py-2.5 px-3 uppercase tracking-wider w-56 sm:w-64 font-black text-white border-r-2 border-blue-800/80 bg-[#0d1e52]">
                    RINCIAN ASPEK
                  </th>
                  {judgeColumns.map((j) => (
                    <th key={j.id} className="py-2.5 px-1.5 sm:px-2 font-black text-cyan-300 border-r border-blue-800/80 last:border-r-0 bg-[#0d205c]/80">
                      JURI {j.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-800/60 text-xs sm:text-sm">
                {/* BARIS 1: KESALAHAN GERAK (Merah / Rose) */}
                <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                  <td className="text-left py-2.5 px-3 font-bold text-slate-200 uppercase tracking-wide border-r-2 border-blue-800/80 bg-[#08122e]">
                    KESALAHAN GERAK
                  </td>
                  {judgeColumns.map((j) => (
                    <td key={j.id} className="py-2.5 px-1.5 sm:px-2 font-black text-rose-400 text-sm sm:text-base border-r border-blue-800/60 last:border-r-0 bg-[#060c24]">
                      {j.errors}
                    </td>
                  ))}
                </tr>

                {/* BARIS 2: NILAI KEBENARAN (0 - 9.90) (Kuning / Gold) */}
                <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                  <td className="text-left py-2.5 px-3 font-bold text-slate-200 uppercase tracking-wide border-r-2 border-blue-800/80 bg-[#08122e]">
                    {isTunggalOrRegu
                      ? "NILAI KEBENARAN (0 - 9.90)"
                      : state.category === "GANDA"
                        ? "TEKNIK SERANG BELA (5.00 - 6.00)"
                        : state.category === "SOLO_KREATIF"
                          ? "TEKHNIK GERAKAN (5.00 - 6.00)"
                          : "NILAI TEKNIK (5.00 - 6.00)"}
                  </td>
                  {judgeColumns.map((j) => (
                    <td key={j.id} className="py-2.5 px-1.5 sm:px-2 font-black text-amber-300 text-sm sm:text-base border-r border-blue-800/60 last:border-r-0 bg-[#060c24]">
                      {j.kebenaran.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* BARIS 3: KEMANTAPAN & STAMINA (Cyan / Biru Muda) */}
                <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                  <td className="text-left py-2.5 px-3 font-bold text-slate-200 uppercase tracking-wide border-r-2 border-blue-800/80 bg-[#08122e]">
                    {isTunggalOrRegu
                      ? "KEMANTAPAN & STAMINA"
                      : state.category === "GANDA"
                        ? "KEMANTAPAN & KOREOGRAFI"
                        : "KOREOGRAFI & MUSIK"}
                  </td>
                  {judgeColumns.map((j) => (
                    <td key={j.id} className="py-2.5 px-1.5 sm:px-2 font-black text-cyan-400 text-sm sm:text-base border-r border-blue-800/60 last:border-r-0 bg-[#060c24]">
                      {j.kemantapan.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* BARIS 4: TOTAL SKOR (Footer Row - Kuning Emas Tebal) */}
                <tr className="border-t-2 border-blue-700/80 bg-blue-950/40">
                  <td className="text-left py-3 px-3 font-black text-cyan-400 uppercase tracking-wider text-xs sm:text-sm border-r-2 border-blue-800/80 bg-[#0a1845]">
                    TOTAL SKOR
                  </td>
                  {judgeColumns.map((j) => (
                    <td key={j.id} className="py-3 px-1.5 sm:px-2 font-black text-amber-300 text-sm sm:text-lg border-r border-blue-800/60 last:border-r-0 bg-[#09153a]">
                      {j.total.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* MIDDLE SECTION: NILAI JURI BERTUGAS DIIKUTI 3 KOLOM BERBARIS SECARA HORIZONTAL: MEDIAN, STANDAR DEVIASI, SKOR AKHIR */}
        <div className="w-full bg-[#070e28] border-2 border-blue-900/80 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-3">
          {/* HEADER MENU NILAI JURI BERTUGAS */}
          <div className="flex items-center justify-between pb-1.5 border-b border-blue-900/60">
            <span className="text-xs sm:text-sm font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#22d3ee]" />
              NILAI JURI BERTUGAS
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold">
              {judgeColumns.length} JURI
            </span>
          </div>

          {/* BARIS KARTU JURI HORIZONTAL (Dinamis sesuai state.judgesCount, Median Hijau Zamrud) */}
          <div className="flex w-full border border-blue-900/80 rounded-lg overflow-hidden shadow-inner">
            {judgeColumns.map((j) => {
              const isMedian = medianJudgeIds.has(j.id);
              return (
                <div
                  key={j.id}
                  className={`flex-1 flex flex-col items-center justify-center border-r border-blue-900/80 last:border-r-0 transition-all ${
                    isMedian
                      ? "bg-[#059669] text-white"
                      : "bg-[#2563eb] text-white"
                  }`}
                >
                  <div className={`w-full py-1 text-center text-[10px] sm:text-[11px] font-mono font-bold tracking-wider ${
                    isMedian ? "bg-[#047857]" : "bg-[#1d4ed8]"
                  }`}>
                    J{j.id}
                  </div>
                  <div className="py-2 px-1 font-mono font-black text-xs sm:text-sm text-center">
                    {j.total.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 KOLOM BERBARIS SECARA HORIZONTAL: MEDIAN | STANDAR DEVIASI | SKOR AKHIR */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1 items-stretch">
            {/* 1. MEDIAN */}
            <div className="bg-[#050b24] border-2 border-blue-600/80 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(37,99,235,0.2)] min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-black text-slate-300 uppercase tracking-wider block mb-1 truncate w-full">
                MEDIAN
              </span>
              <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-amber-300 tracking-tight leading-none tabular-nums">
                {medianValue.toFixed(3)}
              </span>
            </div>

            {/* 2. STANDAR DEVIASI */}
            <div className="bg-[#050b24] border-2 border-blue-600/80 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(37,99,235,0.2)] min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-black text-slate-300 uppercase tracking-wider block mb-1 truncate w-full">
                STANDAR DEVIASI
              </span>
              <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-cyan-300 tracking-tight leading-none tabular-nums">
                {stdDevValue.toFixed(4)}
              </span>
            </div>

            {/* 3. SKOR AKHIR */}
            <div className="bg-[#0e1742] border-2 border-emerald-500/80 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-black text-emerald-300 uppercase tracking-wider block mb-1 truncate w-full">
                SKOR AKHIR
              </span>
              <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-white tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] tabular-nums">
                {dewanPenalties.diskualifikasi ? "DIS" : calculatedFinalScore.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON / WINNER STATUS (JIKA SUDAH DIUMUMKAN ATAU KEDUA SUDUT SELESAI) */}
        {state.winnerAnnounced ? (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 text-center space-y-1.5 shadow-xl">
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-300 uppercase tracking-wider block">
              PEMENANG RESMI PARTAI TELAH DIUMUMKAN: SUDUT {state.winnerCorner === "BLUE" ? "BIRU" : state.winnerCorner === "RED" ? "MERAH" : "DRAW"}
            </span>
            <span className="text-xs font-mono text-slate-300 block">
              {state.winnerReason}
            </span>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVictoryPreview(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
              >
                Lihat Layar Pemenang
              </button>
              <button
                type="button"
                onClick={handleCancelWinner}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-rose-300 uppercase font-bold cursor-pointer transition-colors"
              >
                Batalkan / Revisi Pengumuman
              </button>
            </div>
          </div>
        ) : bothCornersFinished ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowHukumanModal(true)}
              className="w-full py-3.5 rounded-2xl font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
            >
              KEDUA SUDUT TELAH SELESAI • CEK NILAI SELURUH JURI & HUKUMAN KEDUA SUDUT
            </button>
            <button
              onClick={handleAnnouncePartyWinner}
              className="w-full py-3 rounded-2xl font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              🏆 UMUMKAN PEMENANG PARTAI (BERALIH KE VISUAL KEMENANGAN 20 DETIK)
            </button>
          </div>
        ) : state.activeCorner === "BLUE" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleFinishCurrentCorner()}
              className="py-3 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider bg-blue-900/80 hover:bg-blue-800 border border-blue-500/50 text-white cursor-pointer active:scale-95 transition-all shadow-md"
            >
              ✓ KUNCI PENAMPILAN SUDUT BIRU SELESAI
            </button>
            <button
              onClick={() => {
                handleFinishCurrentCorner();
                handleSwitchCorner("RED");
              }}
              className="py-3 px-4 rounded-xl font-sans font-black text-xs uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white cursor-pointer active:scale-95 transition-all shadow-lg"
            >
              SUDUT SELANJUTNYA: SUDUT MERAH ➔ (RESET TIMER & SIAPKAN PENILAIAN)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSwitchCorner("BLUE")}
              className="py-3 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider bg-blue-950 border border-blue-600 text-cyan-300 hover:bg-blue-900 cursor-pointer active:scale-95 transition-all shadow-md"
            >
              ⬅ KEMBALI CEK SUDUT BIRU
            </button>
            <button
              onClick={() => handleFinishCurrentCorner()}
              className="py-3 px-4 rounded-xl font-sans font-black text-xs uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white cursor-pointer active:scale-95 transition-all shadow-lg"
            >
              ✓ SELESAIKAN PENAMPIL MERAH (KEDUA SUDUT SELESAI)
            </button>
          </div>
        )}
      </div>
    </>
  )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-fadeIn">
          <div className="bg-[#0b1329] border-2 border-cyan-500/60 p-5 rounded-3xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider">
                EDIT DATA PERTANDINGAN JURUS TGRS
              </h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">NAMA PESILAT / REGUNYA</label>
                <input
                  type="text"
                  value={editForm.athleteName}
                  onChange={(e) => setEditForm({ ...editForm, athleteName: e.target.value })}
                  className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white uppercase outline-none focus:border-cyan-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">KONTINGEN / PROVINSI</label>
                <input
                  type="text"
                  value={editForm.contingent}
                  onChange={(e) => setEditForm({ ...editForm, contingent: e.target.value })}
                  className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white uppercase outline-none focus:border-cyan-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">NOMOR PARTAI</label>
                  <input
                    type="text"
                    value={editForm.partai}
                    onChange={(e) => setEditForm({ ...editForm, partai: e.target.value })}
                    className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">GELANGGANG</label>
                  <input
                    type="text"
                    value={editForm.gelanggang}
                    onChange={(e) => setEditForm({ ...editForm, gelanggang: e.target.value })}
                    className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">GOLONGAN USIA</label>
                  <select
                    value={editForm.ageCategory}
                    onChange={(e) => setEditForm({ ...editForm, ageCategory: e.target.value })}
                    className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white outline-none"
                  >
                    {["USIA DINI", "PRA REMAJA", "REMAJA", "DEWASA", "MASTER"].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">JENIS KELAMIN</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                    className="w-full bg-[#040817] border border-cyan-500/40 p-2.5 rounded-xl font-bold text-white outline-none"
                  >
                    <option value="PUTRA">PUTRA</option>
                    <option value="PUTRI">PUTRI</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW LAYAR VISUAL PEMENANG */}
      {showVictoryPreview && (
        <TgrsVictoryDisplay
          state={state}
          onClose={() => setShowVictoryPreview(false)}
        />
      )}
    </div>
  );
};

export default TgrsDewanControl;
