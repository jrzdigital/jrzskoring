/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PANEL KETUA DEWAN KHUSUS KATEGORI JURUS GANDA & TUNGGAL BEBAS (SOLO KREATIF)
 * Standar Resmi PB IPSI & PERSILAT 2026:
 * - Baris 1: Tekhnik Serang Bela (dimulai dari 0.00 dan berubah sesuai input juri)
 * - Baris 2: Kemantapan dan harmoni (dimulai dari 0.00 dan berubah sesuai input juri)
 * - Baris 3: Penjiwaan penghayatan (dimulai dari 0.00 dan berubah sesuai input juri)
 * - Total Skor & Median: Dimulai dari 9.10 + input 3 aspek juri
 * - Dilengkapi Menu Hukuman Dewan & Pengumuman Pemenang Standar IPSI (seperti Jurus Tunggal Baku)
 */

import React, { useState, useEffect } from "react";
import {
  TgrsMatchState,
  TgrsPerformerState,
  TgrsDewanPenalties,
  SKOR_DASAR_GANDA_SOLO,
  computeTgrsFinalResult,
  computeTgrsMedianAndStdDev,
  formatTimeMMSS,
  saveTgrsLiveState,
  switchTgrsCorner,
  syncActiveCornerToPerformer,
  determineTgrsWinner,
  useTgrsDualElapsed
} from "../../utils/tgrsScoringEngine";
import { soundEffects } from "../../utils/audio";
import { Clock, CheckCircle2, ShieldAlert, Trophy, X, ChevronUp, AlertTriangle, Edit3, ArrowLeft, Maximize, Minimize } from "lucide-react";
import { TgrsVictoryDisplay } from "./TgrsVictoryDisplay";

interface TgrsGandaSoloDewanControlProps {
  state: TgrsMatchState;
  onUpdateState: (updater: (prev: TgrsMatchState) => TgrsMatchState) => void;
  onBackToLanding?: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TgrsGandaSoloDewanControl: React.FC<TgrsGandaSoloDewanControlProps> = ({
  state,
  onUpdateState,
  onBackToLanding,
  onSwitchToTanding,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const [showHukumanModal, setShowHukumanModal] = useState(false);
  const [showVictoryPreview, setShowVictoryPreview] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [localJudgesCount, setLocalJudgesCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("jrz_tgrs_judges_count") || localStorage.getItem("jrz_judges_count");
      if (stored) return Math.max(4, Math.min(10, parseInt(stored, 10)));
    } catch {}
    return Math.max(4, Math.min(10, state.judgesCount || 10));
  });

  const onUpdateStateRef = useRef(onUpdateState);
  onUpdateStateRef.current = onUpdateState;
  useEffect(() => {
    const handleJudgesCountChanged = (e: any) => {
      const c = e.detail ? Number(e.detail) : 10;
      if (c >= 4 && c <= 10) {
        setLocalJudgesCount(c);
        onUpdateStateRef.current((prev) => {
          if (prev.judgesCount === c) return prev;
          const next = { ...prev, judgesCount: c };
          saveTgrsLiveState(next);
          return next;
        });
      }
    };
    window.addEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
    return () => window.removeEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
  }, []);

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
  const isTunggalBebas = state.category === "SOLO_KREATIF" || (state.category as string) === "TUNGGAL_BEBAS" || state.category !== "GANDA";

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
    if (isFinishedCorner) return;
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
    if (isFinishedCorner) return;
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const prevPenalties = prev.dewanPenalties || defaultPenalties;
      const isDq = !prevPenalties.diskualifikasi;
      const updatedPenalties: TgrsDewanPenalties = {
        ...prevPenalties,
        diskualifikasi: isDq
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

  const handleSwitchCorner = (target: "BLUE" | "RED") => {
    if (state.activeCorner === target) return;
    try { soundEffects.playClick(); } catch {}
    onUpdateState((prev) => {
      const next = switchTgrsCorner(prev, target);
      saveTgrsLiveState(next);
      return next;
    });
  };

  const handleAnnouncePartyWinner = () => {
    try { soundEffects.playGong(); } catch {}
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch {}

    onUpdateState((prev) => {
      const winner = determineTgrsWinner(prev);
      const next: TgrsMatchState = {
        ...prev,
        winnerCorner: winner.winnerCorner,
        winnerReason: winner.reason,
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
        winnerCorner: null,
        winnerReason: "",
        winnerAnnounced: false
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Override nilai juri langsung dari Dewan jika diperlukan
  const handleEditJudgeAspect = (judgeId: number, aspectKey: "serangBela" | "kemantapan" | "penjiwaan") => {
    const isFinishedCorner = Boolean((state.activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer)?.isFinished);
    if (isFinishedCorner) return;

    const j = currentJudgesMap[judgeId];
    let currentVal = 0.00;
    let aspectLabel = "";
    if (aspectKey === "serangBela") {
      currentVal = j?.serangBelaScore ?? j?.teknikScore ?? 0.00;
      aspectLabel = isTunggalBebas ? "Tekhnik Gerakan" : "Tekhnik Serang Bela";
    } else if (aspectKey === "kemantapan") {
      currentVal = j?.kemantapanScore ?? 0.00;
      aspectLabel = "Kemantapan dan harmoni";
    } else {
      currentVal = j?.penjiwaanScore ?? j?.koreografiScore ?? 0.00;
      aspectLabel = "Penjiwaan penghayatan";
    }

    const input = prompt(`Ubah nilai [${aspectLabel}] Juri ${judgeId}:`, currentVal.toFixed(2));
    if (input === null) return;
    const num = parseFloat(input);
    if (isNaN(num) || num < 0) return;

    onUpdateState((prev) => {
      const activeJudges = { ...(prev.activeCorner === "BLUE" ? prev.bluePerformer.judges : prev.redPerformer.judges) };
      const targetJ = activeJudges[judgeId] || {
        id: judgeId,
        name: `Juri ${judgeId}`,
        errorsCount: 0,
        errorHistory: [],
        kebenaranScore: 0.00,
        kemantapanScore: 0.00,
        serangBelaScore: 0.00,
        penjiwaanScore: 0.00,
        totalScore: SKOR_DASAR_GANDA_SOLO,
        isSubmitted: true
      };

      const updatedJ = { ...targetJ, isSubmitted: true };
      if (aspectKey === "serangBela") {
        updatedJ.serangBelaScore = num;
        updatedJ.teknikScore = num;
      } else if (aspectKey === "kemantapan") {
        updatedJ.kemantapanScore = num;
      } else {
        updatedJ.penjiwaanScore = num;
        updatedJ.koreografiScore = num;
      }

      // Hitung total skor juri: 9.10 + serangBela + kemantapan + penjiwaan
      const sb = updatedJ.serangBelaScore ?? 0;
      const km = updatedJ.kemantapanScore ?? 0;
      const pj = updatedJ.penjiwaanScore ?? 0;
      updatedJ.totalScore = Number((SKOR_DASAR_GANDA_SOLO + sb + km + pj).toFixed(2));
      updatedJ.kebenaranScore = km;

      activeJudges[judgeId] = updatedJ;

      const isBlue = prev.activeCorner === "BLUE";
      const currentPerformer = isBlue ? prev.bluePerformer : prev.redPerformer;
      const result = computeTgrsFinalResult(prev.category, activeJudges, currentPerformer.dewanPenalties, prev.judgesCount);

      const updatedPerformer = {
        ...currentPerformer,
        judges: activeJudges,
        finalScore: result.finalScore,
        averageScore: result.averageScore
      };

      const next = {
        ...prev,
        judges: activeJudges,
        finalScore: result.finalScore,
        averageScore: result.averageScore,
        bluePerformer: isBlue ? updatedPerformer : prev.bluePerformer,
        redPerformer: !isBlue ? updatedPerformer : prev.redPerformer
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  const activeCorner = state.activeCorner || "BLUE";
  const activePerformer = activeCorner === "BLUE" ? state.bluePerformer : state.redPerformer;
  const currentJudgesMap = activePerformer?.judges || state.judges || {};
  const dewanPenalties: TgrsDewanPenalties = activePerformer?.dewanPenalties || state.dewanPenalties || defaultPenalties;

  // Kolom Juri Dinamis (Mengikuti state.judgesCount dari Sekretaris, 4 s/d 10 Juri)
  const totalJudgesCount = Math.max(4, Math.min(10, state.judgesCount || localJudgesCount || 10));
  const judgeColumns = Array.from({ length: totalJudgesCount }, (_, i) => {
    const id = i + 1;
    const j = currentJudgesMap[id];
    // Aspek 1: Tekhnik Serang Bela (dimulai 0.00)
    const serangBela = j?.serangBelaScore !== undefined ? Number(j.serangBelaScore) : (j?.teknikScore !== undefined ? Number(j.teknikScore) : 0.00);
    // Aspek 2: Kemantapan dan harmoni (dimulai 0.00)
    const kemantapanHarmoni = j?.kemantapanScore !== undefined ? Number(j.kemantapanScore) : 0.00;
    // Aspek 3: Penjiwaan penghayatan (dimulai 0.00)
    const penjiwaan = j?.penjiwaanScore !== undefined ? Number(j.penjiwaanScore) : (j?.koreografiScore !== undefined ? Number(j.koreografiScore) : 0.00);
    // Total Skor Akhir Tiap Juri: Dimulai dengan nilai dasar 9.10 + akumulasi ketiga aspek
    const total = Number((SKOR_DASAR_GANDA_SOLO + serangBela + kemantapanHarmoni + penjiwaan).toFixed(2));

    return {
      id,
      serangBela,
      kemantapanHarmoni,
      penjiwaan,
      total,
      isSubmitted: Boolean(j?.isSubmitted)
    };
  });

  const computeCornerScore = (performer?: TgrsPerformerState) => {
    if (!performer) return SKOR_DASAR_GANDA_SOLO;
    const pPenalties = performer.dewanPenalties || defaultPenalties;
    const pResult = computeTgrsFinalResult(state.category, performer.judges || {}, pPenalties, totalJudgesCount);
    return pResult.finalScore;
  };

  const blueScore = computeCornerScore(state.bluePerformer);
  const redScore = computeCornerScore(state.redPerformer);
  const blueHasScore = Boolean(state.bluePerformer?.isFinished || blueScore > SKOR_DASAR_GANDA_SOLO);
  const redHasScore = Boolean(state.redPerformer?.isFinished || redScore > SKOR_DASAR_GANDA_SOLO);
  const hasScores = blueHasScore || redHasScore;
  const bothCornersFinished = Boolean(state.bluePerformer?.isFinished && state.redPerformer?.isFinished);

  const isBlueLeading = hasScores && blueScore > redScore;
  const isRedLeading = hasScores && redScore > blueScore;
  const { performerElapsed, isSafeZone, isOvertime } = useTgrsDualElapsed(state);

  const medianStats = computeTgrsMedianAndStdDev(
    judgeColumns.map((j) => ({ id: j.id, score: j.total }))
  );
  const medianJudgeIds = new Set(medianStats.medianJudgeIds);
  // Nilai Median berawal dari nilai dasar 9.100
  const medianValue = medianStats.median > 0 ? medianStats.median : SKOR_DASAR_GANDA_SOLO;
  const stdDevValue = medianStats.stdDev;
  const currentDewanPenalti = dewanPenalties.diskualifikasi
    ? 9.99
    : Number((
        ((dewanPenalties.toleransiWaktuCount || 0) * 0.50) +
        ((dewanPenalties.keluarGelanggangCount || 0) * 0.50) +
        ((dewanPenalties.senjataJatuhCount || 0) * 0.50) +
        ((dewanPenalties.senjataJatuhLuarGelanggangCount || 0) * 0.50) +
        ((dewanPenalties.senjataRusakPatahCount || 0) * 0.50) +
        ((dewanPenalties.atributLepasCount || 0) * 0.50) +
        ((dewanPenalties.menahanGerakanCount || 0) * 0.50) +
        (dewanPenalties.penaltiWaktuOtomatis || 0)
      ).toFixed(2));
  // Skor Akhir Sah dimulai dari nilai dasar 9.100 (Median 9.100 - Penalti)
  const calculatedFinalScore = dewanPenalties.diskualifikasi
    ? 0.00
    : Math.max(0, Number((medianValue - currentDewanPenalti).toFixed(3)));

  const categoryBadgeLabel = state.category === "GANDA" ? "SENI GANDA IPSI" : "TUNGGAL BEBAS (SOLO KREATIF)";

  return (
    <div className="bg-[#030614] min-h-screen md:h-screen md:max-h-screen text-slate-100 flex flex-col justify-between font-sans select-none p-1.5 sm:p-2 md:p-2.5 gap-1.5 relative overflow-x-hidden overflow-y-auto md:overflow-y-hidden">
      
      {/* TOP HEADER: INFO PERTANDINGAN (COMPACT & RESPONSIVE) */}
      <div className="bg-gradient-to-r from-[#070e28] via-[#0d1e52] to-[#070e28] border border-cyan-500/50 rounded-xl px-2.5 py-1.5 sm:py-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        
        {/* IDENTITAS ACARA */}
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-mono font-black text-amber-300 uppercase tracking-widest">
                PANEL DEWAN KETUA JURUS
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[8.5px] sm:text-[9px] font-mono font-black uppercase">
                {categoryBadgeLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-slate-300 mt-0.5">
              <span>GELANGGANG <strong className="text-white">{state.gelanggang}</strong></span>
              <span>•</span>
              <span>PARTAI <strong className="text-amber-400">{state.partai}</strong></span>
              <span>•</span>
              <span>{state.gender}</span>
              <span>•</span>
              <span>{state.ageCategory}</span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">{state.stage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL IKON BATAS (menubatas.png) MEMANJANG DI ATAS KEDUA SUDUT & TIMER */}
      <div className="w-full px-0.5 z-20 shrink-0 -my-0.5">
        <button
          type="button"
          onClick={() => setShowHukumanModal((prev) => !prev)}
          className="w-full relative group py-0.5 sm:py-1 flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-[0.99] select-none"
          title={showHukumanModal ? "Tekan Tombol Ikon Batas untuk Kembali ke Tampilan Layar Log Nilai Juri & Sudut" : "Tekan Tombol Ikon Batas untuk Membuka Menu Hukuman Dewan & Pengumuman Pemenang"}
        >
          {/* Garis Horizontal Memanjang (Gradasi Biru/Cyan ke Merah/Pink) */}
          <div className={`absolute inset-x-0 h-[3px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-rose-500 rounded-full transition-all duration-300 ${
            showHukumanModal
              ? "h-[4px] shadow-[0_0_24px_rgba(34,211,238,0.95)] ring-1 ring-cyan-300"
              : "shadow-[0_0_12px_rgba(236,72,153,0.6)] group-hover:h-[4px] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.8)]"
          }`} />
          
          {/* Ikon Tombol Batas di Tengah (menubatas.png) */}
          <div className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#050b1d] border-2 transition-all duration-300 flex items-center justify-center p-1 overflow-hidden ${
            showHukumanModal 
              ? "border-cyan-300 ring-2 ring-cyan-400/70 shadow-[0_0_22px_rgba(34,211,238,0.95)] scale-110" 
              : "border-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.8)] group-hover:border-cyan-300 group-hover:scale-110"
          }`}>
            <img 
              src="./menubatas.png" 
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
        /* POP UP / INLINE MENU HUKUMAN DEWAN & PENGUMUMAN PEMENANG */
        <div className="w-full flex-1 min-h-0 flex flex-col justify-between space-y-1.5 animate-in slide-in-from-bottom duration-300 overflow-y-auto pr-0.5">
          {/* HEADER BAR: INFORMASI SUDUT AKTIF */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-blue-950/90 via-[#0a1b38] to-rose-950/90 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <h2 className="text-xs sm:text-sm font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                  <span>MENU HUKUMAN DEWAN & PENGUMUMAN PEMENANG</span>
                </h2>
              </div>
            </div>

            {/* CORNER INDICATOR */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="px-2.5 py-1 rounded-lg font-mono text-[11px] sm:text-xs font-black uppercase bg-[#020512] border border-cyan-500/40 text-slate-200 flex items-center gap-1.5 shadow-inner">
                <span className={`w-2 h-2 rounded-full ${state.activeCorner === "BLUE" ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-rose-500 shadow-[0_0_8px_#ef4444]"}`} />
                <span>Sudut Aktif: {state.activeCorner === "BLUE" ? "BIRU" : "MERAH"} ({activePerformer?.athleteName})</span>
              </div>
            </div>
          </div>

          {/* DUA KOLOM: HUKUMAN DEWAN & PENGUMUMAN PEMENANG + REALTIME JURY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            {/* KOLOM KIRI: HUKUMAN DEWAN STANDAR IPSI (5 COLS) */}
            <div className="lg:col-span-5 bg-[#071026] border border-rose-500/40 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between space-y-2 shadow-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-500/20">
                <div>
                  <span className="text-[11px] sm:text-xs font-mono font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5">
                    HUKUMAN DEWAN PERTANDINGAN
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    Dikenakan pada: Sudut {state.activeCorner === "BLUE" ? "BIRU" : "MERAH"}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-black text-rose-400 bg-rose-950/70 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                  Total: -{currentDewanPenalti.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                {(state.category === "SOLO_KREATIF" ? [
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
                ] : [
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
                ]).map((item) => {
                  const count = Number(dewanPenalties[item.field]) || 0;
                  return (
                    <div
                      key={item.field}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#030716] border border-rose-500/30 gap-2"
                    >
                      <div className="flex-1">
                        <span className="text-[11px] font-mono font-bold text-slate-200 block leading-tight">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustPenalty(item.field, 1)}
                          title="Beri pengurangan nilai (-0.50)"
                          className="px-2 h-6 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-mono font-black text-xs cursor-pointer border border-rose-500/40 active:scale-95 transition-all shadow-sm"
                        >
                          -0.50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPenalty(item.field, -1)}
                          disabled={count <= 0}
                          title="Hapus 1 hukuman terakhir"
                          className="px-2 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-[10px] uppercase cursor-pointer border border-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          clr
                        </button>
                        <span className="min-w-7 h-6 px-1.5 flex items-center justify-center rounded bg-slate-900 border border-slate-700 font-mono font-black text-xs text-amber-400">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DISQUALIFICATION BUTTON (WARNA MERAH & TULISAN PUTIH) */}
              <button
                onClick={handleToggleDq}
                className={`w-full py-2 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 border ${
                  dewanPenalties.diskualifikasi
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-300 ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                    : "bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                }`}
              >
                <span className="text-white font-black">
                  {dewanPenalties.diskualifikasi ? "BATALKAN DISKUALIFIKASI (DIS)" : "DISKUALIFIKASI PERAGAAN (DIS)"}
                </span>
              </button>
            </div>

            {/* KOLOM KANAN: PENGUMUMAN PEMENANG & REALTIME SCORE FEED (7 COLS) */}
            <div className="lg:col-span-7 space-y-2.5 flex flex-col justify-between">
              {/* MENU UMUMKAN PEMENANG PARTAI (VS) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#091535] border border-amber-500/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                  <span className="text-[11px] sm:text-xs font-mono font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />
                    PENGUMUMAN PEMENANG PARTAI (VS)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[8.5px] font-black uppercase ${
                    bothCornersFinished
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  }`}>
                    {bothCornersFinished ? "✓ KEDUA SUDUT SELESAI" : "MENUNGGU PENAMPILAN"}
                  </span>
                </div>

                {/* HEAD-TO-HEAD SUMMARY */}
                <div className="grid grid-cols-2 gap-2">
                  {/* BIRU */}
                  <div className={`p-2 rounded-xl border transition-all ${
                    isBlueLeading ? "bg-blue-950/80 border-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : "bg-blue-950/40 border-blue-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold text-cyan-300 uppercase">
                        SUDUT BIRU {isBlueLeading ? "★ UNGGUL" : ""}
                      </span>
                      <span className={`text-[8.5px] font-mono font-bold ${
                        state.bluePerformer?.isFinished ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {state.bluePerformer?.isFinished ? "SELESAI" : "BELUM"}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                      {state.bluePerformer?.athleteName || "PESILAT BIRU"}
                    </h4>
                    <div className="text-right mt-0.5">
                      <span className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                        {blueScore.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* MERAH */}
                  <div className={`p-2 rounded-xl border transition-all ${
                    isRedLeading ? "bg-rose-950/80 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]" : "bg-rose-950/40 border-rose-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold text-rose-300 uppercase">
                        SUDUT MERAH {isRedLeading ? "★ UNGGUL" : ""}
                      </span>
                      <span className={`text-[8.5px] font-mono font-bold ${
                        state.redPerformer?.isFinished ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {state.redPerformer?.isFinished ? "SELESAI" : "BELUM"}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                      {state.redPerformer?.athleteName || "PESILAT MERAH"}
                    </h4>
                    <div className="text-right mt-0.5">
                      <span className="text-xs sm:text-sm font-mono font-black text-rose-300">
                        {redScore.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WINNER ACTION / STATUS */}
                <div>
                  {state.winnerAnnounced ? (
                    <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-center space-y-1 shadow-lg">
                      <span className="text-[11px] sm:text-xs font-mono font-black text-emerald-300 uppercase tracking-wider block">
                        PEMENANG RESMI PARTAI TELAH DIUMUMKAN: SUDUT {state.winnerCorner === "BLUE" ? "BIRU" : state.winnerCorner === "RED" ? "MERAH" : "DRAW"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 block">
                        {state.winnerReason}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowVictoryPreview(true)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                        >
                          Lihat Layar Pemenang
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelWinner}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[10px] font-mono text-rose-300 uppercase font-bold cursor-pointer transition-colors"
                        >
                          Batalkan / Revisi Pengumuman
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnnouncePartyWinner}
                      className="w-full py-2 rounded-xl font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      SAHKAN & UMUMKAN PEMENANG PARTAI (VS)
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE JURY SCORE FEED */}
              <div className="bg-[#050f24] border border-cyan-500/30 rounded-2xl p-2.5 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                    DAFTAR NILAI REAL-TIME SELURUH JURI ({totalJudgesCount} JURI BERTUGAS)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#03091e] border border-amber-500/40 text-[9px] font-mono text-amber-300 font-bold uppercase">
                    {totalJudgesCount} Juri (Panel Sekretaris)
                  </span>
                </div>

                {/* JURIES GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {judgeColumns.map((j) => (
                    <div
                      key={j.id}
                      className={`p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        j.isSubmitted
                          ? "bg-[#06182c] border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-[#040817] border-cyan-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="text-[10px] sm:text-xs font-mono font-black text-white">Juri {j.id}</span>
                        </div>
                        {j.isSubmitted ? (
                          <span className="px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px] font-mono font-bold uppercase">
                            Sah
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[8px] font-mono font-bold uppercase">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="my-0.5 text-center">
                        <span className="text-lg sm:text-xl font-mono font-black text-amber-400 leading-none block">
                          {j.total.toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 mt-0.5 block truncate">
                          SB:{j.serangBela.toFixed(2)} KM:{j.kemantapanHarmoni.toFixed(2)} PJ:{j.penjiwaan.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* TAMPILAN RESMI DEWAN KHUSUS GANDA & TUNGGAL BEBAS (SOLO KREATIF): SUDUT & LOG NILAI JURI & MEDIAN */
        <div className="w-full flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2">
          
          {/* SUDUT BIRU VS MERAH BANNER & ACTION BAR (LEBIH RINGKAS & DINAMIS) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 sm:gap-2 items-stretch shrink-0">
            {/* Sudut Biru Card */}
            <div
              onClick={() => handleSwitchCorner("BLUE")}
              className={`md:col-span-4 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeCorner === "BLUE"
                  ? "bg-[#0b1f4d] border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-2 ring-blue-400/50"
                  : "bg-[#060c24] border-blue-900/60 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[9.5px] font-mono font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeCorner === "BLUE" ? "bg-blue-400 animate-ping" : "bg-blue-600"}`} />
                  SUDUT BIRU {activeCorner === "BLUE" && "(AKTIF)"}
                </span>
                {isBlueLeading && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[8px] sm:text-[8.5px] font-mono font-black">
                    LEAD
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                {state.bluePerformer?.athleteName || "PESILAT BIRU"}
              </h3>
              <p className="text-[10px] font-mono text-blue-200/80 truncate">
                {state.bluePerformer?.contingent || "KONTINGEN BIRU"}
              </p>
              <div className="mt-0.5 pt-0.5 border-t border-blue-800/50 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                <span className="text-slate-300">Skor Akhir:</span>
                <span className="text-sm sm:text-base md:text-lg font-black text-amber-300">
                  {blueScore.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Central Action Bar: Status Timer */}
            <div className="md:col-span-4 bg-[#070e28] border border-cyan-500/40 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center text-center shadow-lg space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[9.5px] sm:text-[10.5px] font-mono font-black text-cyan-300 uppercase tracking-wider">
                  WAKTU PERAGAAN AKTIF
                </span>
              </div>
              <span className={`text-2xl sm:text-3xl font-mono font-black tracking-tight leading-none ${
                isOvertime ? "text-rose-400 animate-pulse" : isSafeZone ? "text-emerald-400" : "text-cyan-300"
              }`}>
                {formatTimeMMSS(performerElapsed)}
              </span>
              {hasScores && !isTunggalBebas && (
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => setShowHukumanModal(true)}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-black border border-amber-300 rounded-lg text-[9.5px] font-mono uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
                  >
                    <Trophy className="w-3 h-3" />
                    <span>Pemenang</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sudut Merah Card */}
            <div
              onClick={() => handleSwitchCorner("RED")}
              className={`md:col-span-4 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeCorner === "RED"
                  ? "bg-[#4a0d1f] border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)] ring-2 ring-rose-400/50"
                  : "bg-[#1f060c] border-rose-900/60 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[9.5px] font-mono font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeCorner === "RED" ? "bg-rose-400 animate-ping" : "bg-rose-600"}`} />
                  SUDUT MERAH {activeCorner === "RED" && "(AKTIF)"}
                </span>
                {isRedLeading && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[8px] sm:text-[8.5px] font-mono font-black">
                    LEAD
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase truncate mt-0.5">
                {state.redPerformer?.athleteName || "PESILAT MERAH"}
              </h3>
              <p className="text-[10px] font-mono text-rose-200/80 truncate">
                {state.redPerformer?.contingent || "KONTINGEN MERAH"}
              </p>
              <div className="mt-0.5 pt-0.5 border-t border-rose-800/50 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                <span className="text-slate-300">Skor Akhir:</span>
                <span className="text-sm sm:text-base md:text-lg font-black text-amber-300">
                  {redScore.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* TABEL LOG NILAI SELURUH JURI (1 - N) DENGAN KETINGGIAN PROPORSIONAL TANPA CLIPPING */}
          <div className="w-full bg-[#070e28] border border-cyan-500/60 rounded-xl p-1 sm:p-1.5 shadow-xl overflow-hidden flex-1 min-h-0 flex flex-col justify-center">
            <div className="overflow-x-auto w-full h-full flex items-center">
              <table className="w-full h-full border-collapse border border-blue-800/80 min-w-[640px] text-center font-mono">
                <thead>
                  <tr className="border-b border-blue-800/80 text-slate-100 font-bold text-[10px] sm:text-xs bg-[#0a1845]">
                    <th className="text-left py-1 sm:py-1.5 px-2 uppercase tracking-wider w-52 sm:w-60 font-black text-white border-r border-blue-800/80 bg-[#0d1e52]">
                      RINCIAN ASPEK
                    </th>
                    {judgeColumns.map((j) => (
                      <th key={j.id} className="py-1 sm:py-1.5 px-0.5 sm:px-1 font-black text-cyan-300 border-r border-blue-800/80 last:border-r-0 bg-[#0d205c]/80 text-[10px] sm:text-[11px]">
                        JURI {j.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-800/60 text-[10px] sm:text-xs">
                  
                  {/* BARIS 1: Tekhnik Gerakan / Tekhnik Serang Bela */}
                  <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                    <td className="text-left py-1 sm:py-1.5 px-2 font-bold text-slate-200 uppercase tracking-wide border-r border-blue-800/80 bg-[#08122e]">
                      {isTunggalBebas ? "Tekhnik Gerakan" : "Tekhnik Serang Bela"}
                    </td>
                    {judgeColumns.map((j) => (
                      <td
                        key={j.id}
                        onClick={() => handleEditJudgeAspect(j.id, "serangBela")}
                        className="py-1 sm:py-1.5 px-0.5 sm:px-1 font-black text-rose-400 text-xs sm:text-sm border-r border-blue-800/60 last:border-r-0 bg-[#060c24] hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title={`Klik untuk ubah ${isTunggalBebas ? "Tekhnik Gerakan" : "Tekhnik Serang Bela"} Juri ${j.id}`}
                      >
                        {j.serangBela.toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* BARIS 2: Kemantapan dan harmoni */}
                  <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                    <td className="text-left py-1 sm:py-1.5 px-2 font-bold text-slate-200 uppercase tracking-wide border-r border-blue-800/80 bg-[#08122e]">
                      Kemantapan dan harmoni
                    </td>
                    {judgeColumns.map((j) => (
                      <td
                        key={j.id}
                        onClick={() => handleEditJudgeAspect(j.id, "kemantapan")}
                        className="py-1 sm:py-1.5 px-0.5 sm:px-1 font-black text-amber-300 text-xs sm:text-sm border-r border-blue-800/60 last:border-r-0 bg-[#060c24] hover:bg-amber-950/40 cursor-pointer transition-colors"
                        title={`Klik untuk ubah Kemantapan dan harmoni Juri ${j.id}`}
                      >
                        {j.kemantapanHarmoni.toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* BARIS 3: Penjiwaan penghayatan */}
                  <tr className="border-b border-blue-800/60 hover:bg-blue-950/30 transition-colors">
                    <td className="text-left py-1 sm:py-1.5 px-2 font-bold text-slate-200 uppercase tracking-wide border-r-2 border-blue-800/80 bg-[#08122e]">
                      Penjiwaan penghayatan
                    </td>
                    {judgeColumns.map((j) => (
                      <td
                        key={j.id}
                        onClick={() => handleEditJudgeAspect(j.id, "penjiwaan")}
                        className="py-1 sm:py-1.5 px-0.5 sm:px-1 font-black text-cyan-400 text-xs sm:text-sm border-r border-blue-800/60 last:border-r-0 bg-[#060c24] hover:bg-cyan-950/40 cursor-pointer transition-colors"
                        title={`Klik untuk ubah Penjiwaan penghayatan Juri ${j.id}`}
                      >
                        {j.penjiwaan.toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* BARIS 4: TOTAL SKOR */}
                  <tr className="border-t border-cyan-500/80 bg-blue-950/40">
                    <td className="text-left py-1.5 sm:py-2 px-2 font-black text-cyan-300 uppercase tracking-wider text-[10px] sm:text-xs border-r border-blue-800/80 bg-[#0a1845]">
                      TOTAL SKOR (DASAR 9.10)
                    </td>
                    {judgeColumns.map((j) => (
                      <td key={j.id} className="py-1.5 sm:py-2 px-0.5 sm:px-1 font-black text-amber-300 text-xs sm:text-base border-r border-blue-800/60 last:border-r-0 bg-[#09153a]">
                        {j.total.toFixed(2)}
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* MIDDLE / BOTTOM SECTION: NILAI JURI BERTUGAS, MEDIAN, STANDAR DEVIASI, SKOR AKHIR */}
          <div className="w-full bg-[#070e28] border border-cyan-500/60 rounded-xl p-1.5 sm:p-2 shadow-xl space-y-1.5 shrink-0">
            
            {/* BARIS KARTU JURI HORIZONTAL (Median Hijau Zamrud) */}
            <div className="flex w-full border border-blue-900/80 rounded-lg overflow-hidden shadow-inner">
              {judgeColumns.map((j) => {
                const isMedian = medianJudgeIds.has(j.id);
                return (
                  <div
                    key={j.id}
                    className={`flex-1 flex flex-col items-center justify-center border-r border-blue-900/80 last:border-r-0 transition-all ${
                      isMedian ? "bg-[#059669] text-white" : "bg-[#2563eb] text-white"
                    }`}
                  >
                    <div className={`w-full py-0.5 text-center text-[9px] sm:text-[10px] font-mono font-bold tracking-wider ${
                      isMedian ? "bg-[#047857] text-white" : "bg-[#1d4ed8] text-blue-100"
                    }`}>
                      J{j.id}
                    </div>
                    <div className="py-0.5 sm:py-1 px-0.5 text-center font-mono font-black text-[11px] sm:text-xs md:text-sm">
                      {j.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3 KOLOM BERBARIS SECARA HORIZONTAL: MEDIAN, STANDAR DEVIASI, SKOR AKHIR */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-0.5">
              
              {/* 1. NILAI MEDIAN */}
              <div className="bg-[#051336] border border-emerald-500/70 rounded-lg p-1 sm:p-1.5 flex flex-col justify-center items-center text-center shadow-md">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider truncate w-full">
                  NILAI MEDIAN ({totalJudgesCount} JURI)
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-emerald-400 mt-0.5 tracking-tight leading-none">
                  {medianValue.toFixed(3)}
                </span>
                <span className="text-[8px] sm:text-[8.5px] font-mono text-emerald-300/80 mt-0.5 truncate">
                  Nilai Awal: 9.100 (Median Juri)
                </span>
              </div>

              {/* 2. STANDAR DEVIASI */}
              <div className="bg-[#051336] border border-blue-600/70 rounded-lg p-1 sm:p-1.5 flex flex-col justify-center items-center text-center shadow-md">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider truncate w-full">
                  STANDAR DEVIASI
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-cyan-300 mt-0.5 tracking-tight leading-none">
                  {stdDevValue.toFixed(4)}
                </span>
                <span className="text-[8px] sm:text-[8.5px] font-mono text-blue-300/80 mt-0.5 truncate">
                  Kriteria Pemecah Imbang
                </span>
              </div>

              {/* 3. SKOR AKHIR */}
              <div className="bg-[#051336] border border-amber-400/80 rounded-lg p-1 sm:p-1.5 flex flex-col justify-center items-center text-center shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider truncate w-full">
                  SKOR AKHIR SAH
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-amber-400 mt-0.5 tracking-tight leading-none">
                  {calculatedFinalScore.toFixed(3)}
                </span>
                <span className="text-[8px] sm:text-[8.5px] font-mono text-amber-300/80 mt-0.5 truncate">
                  Median ({medianValue.toFixed(3)}) - Penalti ({currentDewanPenalti.toFixed(2)})
                </span>
              </div>

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

export default TgrsGandaSoloDewanControl;
