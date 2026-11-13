/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ARENA SCOREBOARD & BIG SCREEN MONITOR FOR JURUS TGRS
 * (TUNGGAL, GANDA, REGU, SOLO KREATIF)
 * Tampilan Layar Panggung LED & Monitor Penonton Standar PB IPSI & PERSILAT 2026
 * Khusus Tunggal & Regu: Tampilan Persis Sesuai Standar Resmi Monitor Tunggal
 * (Header Putih Logo IPSI/Event, Bar Atlet Sudut Biru/Merah, Grid Median/Penalti/Waktu/StdDev & Skor Akhir Kuning Raksasa, Juri Baris Bawah)
 */

import React, { useEffect, useState } from "react";
import {
  TgrsMatchState,
  formatTimeMMSS,
  useTgrsDualElapsed,
  computeTgrsMedianAndStdDev,
  computeJudgeScore
} from "../../utils/tgrsScoringEngine";
import {
  Trophy,
  Award,
  Clock,
  Shield,
  RotateCcw,
  X,
  RefreshCw,
  ArrowLeft,
  Maximize2
} from "lucide-react";
import confetti from "canvas-confetti";
import { TgrsVictoryDisplay } from "./TgrsVictoryDisplay";

interface TgrsMonitorDisplayProps {
  state: TgrsMatchState;
  onBackToLanding?: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TgrsMonitorDisplay: React.FC<TgrsMonitorDisplayProps> = ({
  state,
  onBackToLanding,
  onSwitchToTanding,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showVictoryOverlay, setShowVictoryOverlay] = useState<boolean>(Boolean(state.winnerAnnounced));
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
      }
    };
    window.addEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
    return () => window.removeEventListener("jrz_judges_count_changed", handleJudgesCountChanged);
  }, []);

  // Trigger celebration confetti when winner is announced
  useEffect(() => {
    if (state.winnerAnnounced) {
      setShowVictoryOverlay(true);
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
        setTimeout(() => {
          try {
            confetti({
              particleCount: 100,
              spread: 120,
              origin: { y: 0.4 }
            });
          } catch {}
        }, 350);
      } catch {}
    } else {
      setShowVictoryOverlay(false);
    }
  }, [state.winnerAnnounced]);

  const { performerElapsed, timer3MinElapsed, isSafeZone, isOvertime } = useTgrsDualElapsed(state);

  const isTunggalOrRegu = state.category === "TUNGGAL" || state.category === "REGU";

  // Sudut aktif yang sedang tampil murni dari state sistem (Biru tampil pertama, Merah tampil selanjutnya)
  const activeCorner = state.activeCorner || "BLUE";
  const isRedCorner = activeCorner === "RED";
  const activePerformer = isRedCorner ? state.redPerformer : state.bluePerformer;

  const athleteName = activePerformer?.athleteName || state.athleteName || (isRedCorner ? "PESILAT MERAH" : "PESILAT BIRU");
  const contingent = activePerformer?.contingent || state.contingent || (isRedCorner ? "KONTINGEN MERAH" : "KONTINGEN BIRU");

  // Format Waktu Penampilan: MM : SS (contoh 01 : 23)
  const activeElapsed = activeCorner === state.activeCorner ? performerElapsed : (activePerformer?.timerElapsed || 0);
  const mStr = String(Math.floor(activeElapsed / 60)).padStart(2, "0");
  const sStr = String(Math.floor(activeElapsed % 60)).padStart(2, "0");
  const timeFormatted = `${mStr} : ${sStr}`;

  // Daftar Juri & Skor (Dinamis 4 sampai 10 Juri sesuai setting Panel Sekretaris)
  const totalJudgesCount = Math.max(4, Math.min(10, state.judgesCount || localJudgesCount || 10));
  const currentJudgesMap = activePerformer?.judges || state.judges || {};
  const activeJudgesList = Array.from({ length: totalJudgesCount }, (_, i) => {
    const id = i + 1;
    return currentJudgesMap[id] || {
      id,
      name: `Juri ${id}`,
      errorsCount: 0,
      errorHistory: [],
      kebenaranScore: isTunggalOrRegu ? 9.90 : 0.00,
      kemantapanScore: 0.00,
      serangBelaScore: isTunggalOrRegu ? undefined : 0.00,
      penjiwaanScore: isTunggalOrRegu ? undefined : 0.00,
      totalScore: isTunggalOrRegu ? 9.90 : 9.10,
      isSubmitted: false
    };
  });
  const scoresWithId = activeJudgesList.map((j) => {
    const computed = computeJudgeScore(state.category, j);
    return { id: j.id, score: computed.totalScore };
  });

  const medianStats = computeTgrsMedianAndStdDev(scoresWithId);
  const penaltiDewan = Number(activePerformer?.totalPenaltiDewan ?? state.totalPenaltiDewan ?? 0);
  const liveFinalScore = Math.max(0, Number((medianStats.median - penaltiDewan).toFixed(3)));

  const medianScore = medianStats.median.toFixed(3);
  const stdDevScore = medianStats.stdDev.toFixed(8);
  const penaltyScore = penaltiDewan > 0.001 ? `-${penaltiDewan.toFixed(2)}` : "0.00";
  const totalScore = (activePerformer?.isFinished && typeof activePerformer.finalScore === "number" && activePerformer.finalScore > 0)
    ? activePerformer.finalScore.toFixed(3)
    : liveFinalScore.toFixed(3);

  const medianJudgeIds = medianStats.medianJudgeIds || [];

  // Metadata Header Kejuaraan
  const eventTitle =
    (state as any).eventName ||
    (typeof window !== "undefined" && (localStorage.getItem("jrz_event_name") || localStorage.getItem("tournament_name"))) ||
    "KEJUARAAN NASIONAL PENCAK SILAT AMPANA OPEN 2026";

  const partaiNumber = state.partai || "19";
  let catName = "TUNGGAL TANGAN KOSONG";
  if (state.category === "REGU") {
    catName = "REGU (JURUS BAKU)";
  } else if (state.category === "GANDA") {
    catName = "GANDA (JURUS GANDA)";
  } else if (state.category === "SOLO_KREATIF" || (state.category as string) === "TUNGGAL_BEBAS") {
    catName = "TUNGGAL BEBAS (SOLO KREATIF)";
  } else if (state.categoryLabel) {
    catName = state.categoryLabel.toUpperCase();
  }

  const genderText = state.gender ? `(${state.gender.toUpperCase()})` : "(PUTRA)";
  const ageText = state.ageCategory ? state.ageCategory.toUpperCase() : "PRA REMAJA";
  const stageText = state.stage ? state.stage.toUpperCase() : "SEMIFINAL B1";

  const matchSubtitle = `PARTAI ${partaiNumber} - ${catName} ${genderText} ${ageText} - ${stageText}`;

  // Warna dinamis sesuai sudut penampil (Biru / Merah)
  const cornerBg = isRedCorner ? "bg-[#b91c1c]" : "bg-[#1d4ed8]";
  const cornerHeaderDark = isRedCorner ? "bg-[#991b1b]" : "bg-[#1e40af]";

  return (
    <div 
      className="w-full h-screen max-w-none overflow-hidden bg-slate-900 flex flex-col justify-between font-sans select-none relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* QUICK FLOATING CONTROLS (TAMPIL SAAT KURSOR DIGERAKKAN) */}
      <div className={`absolute top-2 right-4 z-40 flex items-center gap-2 transition-opacity duration-300 ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        {state.winnerAnnounced && (
          <button
            onClick={() => setShowVictoryOverlay(true)}
            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-md"
            title="Lihat Visual Pengumuman Pemenang"
          >
            <Trophy className="w-3.5 h-3.5 text-slate-950" />
            <span>Pengumuman Pemenang</span>
          </button>
        )}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-md"
            title="Kembali ke Menu Utama"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menu Utama</span>
          </button>
        )}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
            title="Layar Penuh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

        {/* 1. TOP HEADER KEJUARAAN (PUTIH/ABU TERANG DENGAN LOGO KIRI & KANAN) */}
        <header className="w-full bg-[#edf2f7] border-b-2 border-slate-300/80 px-4 sm:px-8 py-2 flex items-center justify-between shrink-0 shadow-sm">
          {/* Logo Kiri (IPSI) */}
          <div className="w-16 sm:w-20 md:w-28 h-10 sm:h-12 md:h-14 flex items-center justify-start shrink-0">
            <img 
              src="/LogoIPSI.png" 
              alt="Logo IPSI" 
              className="h-full w-auto object-contain filter drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/logomonitor1.png";
              }}
            />
          </div>

          {/* Teks Judul Kejuaraan & Informasi Partai */}
          <div className="flex-grow flex flex-col items-center justify-center text-center px-2">
            <h1 className="text-slate-900 font-sans font-black text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-wider uppercase leading-tight truncate max-w-5xl">
              {eventTitle}
            </h1>
            <h2 className="text-slate-800 font-sans font-extrabold text-[11px] sm:text-xs md:text-sm lg:text-[15px] xl:text-base tracking-wide uppercase leading-tight mt-0.5 truncate max-w-5xl">
              {matchSubtitle}
            </h2>
          </div>

          {/* Logo Kanan (Logo Kejuaraan / Sponsor) */}
          <div className="w-16 sm:w-20 md:w-28 h-10 sm:h-12 md:h-14 flex items-center justify-end shrink-0">
            <img 
              src="/logomonitor2.png" 
              alt="Logo Event" 
              className="h-full w-auto object-contain filter drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/jrzscoreutama.png";
              }}
            />
          </div>
        </header>

        {/* 2. BAR ATLET & KONTINGEN (WARNA SESUAI SUDUT BIRU / MERAH) */}
        <div className={`w-full ${cornerBg} text-white px-6 sm:px-12 py-2 sm:py-2.5 flex items-center justify-between shrink-0 shadow-md border-b-2 border-black/40`}>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-sans font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] truncate max-w-[45%]">
            {contingent}
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-sans font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] truncate max-w-[50%] text-right">
            {athleteName}
          </div>
        </div>

        {/* 3. MAIN SCORING GRID (KOLOM KIRI: 3 KOTAK + STD DEV | KOLOM KANAN: TOTAL SKOR RAKSASA) */}
        <main className="flex-grow flex flex-row items-stretch w-full overflow-hidden border-b-2 border-black/40">
          
          {/* KOLOM KIRI (~52% LEBAR) */}
          <div className="w-[52%] flex flex-col border-r-2 border-black/40">
            
            {/* SUB-BARIS ATAS: MEDIAN | PENALTY | TIME PERFORMANCE */}
            <div className="h-1/2 flex flex-row border-b-2 border-black/40">
              
              {/* KOTAK 1: MEDIAN */}
              <div className="w-1/3 flex flex-col border-r-2 border-black/30">
                <div className="bg-[#22c55e] py-1 sm:py-1.5 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shrink-0 border-b border-black/30">
                  MEDIAN
                </div>
                <div className={`flex-grow flex items-center justify-center ${cornerBg}`}>
                  <span className="text-white font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] font-mono">
                    {medianScore}
                  </span>
                </div>
              </div>

              {/* KOTAK 2: PENALTY */}
              <div className="w-1/3 flex flex-col border-r-2 border-black/30">
                <div className="bg-[#22c55e] py-1 sm:py-1.5 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shrink-0 border-b border-black/30">
                  PENALTY
                </div>
                <div className={`flex-grow flex items-center justify-center ${cornerBg}`}>
                  <span className="text-white font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] font-mono">
                    {penaltyScore}
                  </span>
                </div>
              </div>

              {/* KOTAK 3: TIME PERFORMANCE */}
              <div className="w-1/3 flex flex-col">
                <div className="bg-[#22c55e] py-1 sm:py-1.5 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shrink-0 border-b border-black/30">
                  TIME PERFORMANCE
                </div>
                <div className={`flex-grow flex items-center justify-center ${cornerBg}`}>
                  <span className="text-white font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] font-mono">
                    {timeFormatted}
                  </span>
                </div>
              </div>

            </div>

            {/* SUB-BARIS BAWAH: STANDARD DEVIATION */}
            <div className="h-1/2 flex flex-col">
              <div className="bg-[#22c55e] py-1 sm:py-1.5 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shrink-0 border-b border-black/30">
                STANDARD DEVIATION
              </div>
              <div className={`flex-grow flex items-center justify-center ${cornerBg}`}>
                <span className="text-white font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] font-mono">
                  {stdDevScore}
                </span>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (~48% LEBAR): TOTAL SCORE (KUNING RAKSASA) */}
          <div className="w-[48%] flex flex-col">
            <div className="bg-[#facc15] py-1 sm:py-1.5 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shrink-0 border-b border-black/30">
              TOTAL SCORE
            </div>
            <div className={`flex-grow flex items-center justify-center ${cornerBg} overflow-hidden p-2`}>
              <span className="text-[#fef08a] font-sans font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[11rem] 2xl:text-[13rem] leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-mono tracking-tight select-none">
                {totalScore}
              </span>
            </div>
          </div>

        </main>

        {/* 4. BARIS BAWAH: NILAI SELURUH JURI (JURI MEDIAN HIJAU, JURI LAIN MENGIKUTI WARNA SUDUT) */}
        <footer className="h-[18%] min-h-[75px] max-h-[110px] flex flex-row items-stretch w-full shrink-0 bg-slate-950 border-t-2 border-black/40">
          {activeJudgesList.map((j) => {
            const computed = computeJudgeScore(state.category, j);
            const score = computed.totalScore;
            const isMedian = medianJudgeIds.includes(j.id) || Math.abs(score - Number(medianScore)) < 0.0001;

            return (
              <div 
                key={j.id} 
                className="flex-1 flex flex-col border-r-2 border-black/30 last:border-r-0 min-w-0"
              >
                {/* Header Mini Juri */}
                <div className={`py-0.5 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider border-b border-black/20 ${
                  isMedian 
                    ? "bg-[#16a34a] text-slate-950" 
                    : `${cornerHeaderDark} text-white/90`
                }`}>
                  JURI {j.id}
                </div>

                {/* Angka Nilai Juri */}
                <div className={`flex-grow flex items-center justify-center py-1 sm:py-2 ${
                  isMedian 
                    ? "bg-[#16a34a]" 
                    : cornerBg
                }`}>
                  <span className="text-white font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-mono tracking-tight">
                    {score.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </footer>

        {/* TAMPILAN VISUAL KEMENANGAN (SESUAI CONTOH FOTO PENGUMUMAN PEMENANG) */}
        {state.winnerAnnounced && showVictoryOverlay && (
          <TgrsVictoryDisplay
            state={state}
            onClose={() => setShowVictoryOverlay(false)}
            onToggleFullscreen={onToggleFullscreen}
          />
        )}
      </div>
    );
};

export default TgrsMonitorDisplay;
