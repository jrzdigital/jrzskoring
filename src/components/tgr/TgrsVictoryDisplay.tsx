/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TAMPILAN VISUAL KEMENANGAN KATEGORI JURUS TGRS
 * Desain Resmi Sesuai Contoh Foto Layar Arena (PENGUMUMAN PEMENANG)
 * - Header: PENGUMUMAN PEMENANG (Kuning Emas Raksasa)
 * - Badge Box: PEMENANG : SUDUT MERAH / BIRU
 * - Jenis Kemenangan: KEMENANGAN ANGKA (SKOR AKHIR) / Standar Deviasi / Diskualifikasi
 * - 2 Kolom Data Atlet (Sudut Biru & Sudut Merah) dengan Emblem VS 3D di tengah
 * - Tiap kolom: Nilai Akhir, Waktu Tampil & Nilai Hukuman, Standar Deviasi, Data Atlet
 * - Logika Kemenangan: Sudut pemenang menyala terang; sudut kalah abu-abu tanpa warna
 * - Footer: Gelanggang & JRZ SCORE Official Digital Skoring Pencak Silat
 */

import React, { useEffect } from "react";
import {
  TgrsMatchState,
  computeTgrsFinalResult,
  determineTgrsWinner
} from "../../utils/tgrsScoringEngine";
import confetti from "canvas-confetti";
import { X, Maximize2 } from "lucide-react";

interface TgrsVictoryDisplayProps {
  state: TgrsMatchState;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
}

export const TgrsVictoryDisplay: React.FC<TgrsVictoryDisplayProps> = ({
  state,
  onClose,
  onToggleFullscreen
}) => {
  const [countdown, setCountdown] = React.useState<number>(20);

  // Trigger selebrasi confetti saat tampilan kemenangan muncul
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 }
      });
      const t = setTimeout(() => {
        try {
          confetti({
            particleCount: 80,
            spread: 110,
            origin: { y: 0.35 }
          });
        } catch {}
      }, 400);
      return () => clearTimeout(t);
    } catch {}
  }, []);

  // Timer 20 detik untuk otomatis berpindah ke partai selanjutnya
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("jrz_skip_victory_countdown"));
            window.dispatchEvent(new CustomEvent("jrz_tgrs_advance_next_match"));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNextMatchNow = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jrz_skip_victory_countdown"));
      window.dispatchEvent(new CustomEvent("jrz_tgrs_advance_next_match"));
    }
  };

  // Perhitungan Data Lengkap Sudut Biru & Merah dengan Fallback Aman
  const judgesCount = state.judgesCount || 10;

  const defaultPenalties = {
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    atributLepasCount: 0,
    penaltiWaktuOtomatis: 0,
    diskualifikasi: false
  };

  const bluePerformer = state.bluePerformer;
  const redPerformer = state.redPerformer;

  const blueResult = computeTgrsFinalResult(
    state.category,
    bluePerformer?.judges || state.judges || {},
    bluePerformer?.dewanPenalties || defaultPenalties,
    judgesCount
  );

  const redResult = computeTgrsFinalResult(
    state.category,
    redPerformer?.judges || state.judges || {},
    redPerformer?.dewanPenalties || defaultPenalties,
    judgesCount
  );

  // Penentuan Pemenang
  const calcWinner = determineTgrsWinner(state);
  const winnerCorner = state.winnerCorner || calcWinner.winnerCorner;
  const rawReason = state.winnerReason || calcWinner.reason || "Unggul Nilai Akhir";

  const isRedWinner = winnerCorner === "RED";
  const isBlueWinner = winnerCorner === "BLUE";
  const isDraw = winnerCorner === "DRAW";

  // Label Jenis Kemenangan Sesuai Contoh Foto: "KEMENANGAN ANGKA (SKOR AKHIR)"
  let jenisKemenangan = "KEMENANGAN ANGKA (SKOR AKHIR)";
  const upperReason = rawReason.toUpperCase();
  if (upperReason.includes("DEVIASI")) {
    jenisKemenangan = "KEMENANGAN STANDAR DEVIASI";
  } else if (upperReason.includes("DISKUALIFIKASI")) {
    jenisKemenangan = isRedWinner
      ? "KEMENANGAN DISKUALIFIKASI (SUDUT BIRU DIDISKUALIFIKASI)"
      : "KEMENANGAN DISKUALIFIKASI (SUDUT MERAH DIDISKUALIFIKASI)";
  } else if (upperReason.includes("HUKUMAN")) {
    jenisKemenangan = "KEMENANGAN HUKUMAN DEWAN TERENDAH";
  } else if (upperReason.includes("WAKTU")) {
    jenisKemenangan = "KEMENANGAN DEVIASI WAKTU TERBAIK";
  } else if (isDraw) {
    jenisKemenangan = "KEPUTUSAN: HASIL PERTANDINGAN SERI (DRAW)";
  }

  // Waktu Tampil
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mStr = String(Math.floor(s / 60)).padStart(2, "0");
    const sStr = String(s % 60).padStart(2, "0");
    return `${mStr}:${sStr}`;
  };

  const blueElapsed = bluePerformer?.performerTime ?? bluePerformer?.timerElapsed ?? 0;
  const redElapsed = redPerformer?.performerTime ?? redPerformer?.timerElapsed ?? 0;

  const blueTimeFormatted = formatTime(blueElapsed);
  const redTimeFormatted = formatTime(redElapsed);

  // Nilai Hukuman (Contoh foto: -0.50 atau 0.00)
  const formatPenalty = (val?: number) => {
    const p = val ?? 0;
    if (p > 0.001) {
      return `-${p.toFixed(2)}`;
    }
    return "0.00";
  };

  const bluePenalty = formatPenalty(bluePerformer?.totalPenaltiDewan ?? blueResult.totalPenaltiDewan);
  const redPenalty = formatPenalty(redPerformer?.totalPenaltiDewan ?? redResult.totalPenaltiDewan);

  // Standar Deviasi (Presisi 8-9 Angka Desimal Sesuai Contoh Foto: 0.01479020)
  const formatStdDev = (val?: number) => {
    const num = val ?? 0;
    return num.toFixed(8);
  };

  const blueStdDev = formatStdDev(bluePerformer?.stdDev ?? blueResult.stdDev);
  const redStdDev = formatStdDev(redPerformer?.stdDev ?? redResult.stdDev);

  // Nilai Akhir (3 Desimal Sesuai Standar TGRS, Contoh Foto: 9.415 & 9.420)
  const blueScore = (bluePerformer?.finalScore ?? blueResult.finalScore ?? 0).toFixed(3);
  const redScore = (redPerformer?.finalScore ?? redResult.finalScore ?? 0).toFixed(3);

  // Data Atlet & Kontingen
  const blueAthlete = bluePerformer?.athleteName || "SAITAMA";
  const blueContingent = bluePerformer?.contingent || "PAPUA BARAT";
  const redAthlete = redPerformer?.athleteName || "IZUKU MIDORIYA";
  const redContingent = redPerformer?.contingent || "BANTEN";

  const gelanggangNum = state.gelanggang || "1";

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between items-center w-full h-[100dvh] bg-[#070b16] text-white font-sans select-none overflow-hidden p-3 sm:p-5 md:p-6 animate-fadeIn"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0d162d 0%, #060914 65%, #02040a 100%)"
      }}
    >
      {/* TOMBOL KONTROL TUTUP / FULLSCREEN DI POJOK ATAS */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2">
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-black/60 hover:bg-rose-900 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Tutup Tampilan Kemenangan"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* HEADER SECTION (PERSIS CONTOH FOTO) */}
      <header className="flex flex-col items-center justify-center text-center w-full shrink-0 pt-1 sm:pt-2">
        
        {/* 1. JUDUL ATAS: PENGUMUMAN PEMENANG (KUNING EMAS RAKSASA) */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.08em] sm:tracking-[0.14em] text-[#f6d149] drop-shadow-[0_4px_18px_rgba(246,209,73,0.55)] leading-tight">
          PENGUMUMAN PEMENANG
        </h1>

        {/* 2. BADGE KOTAK PEMENANG : SUDUT MERAH / BIRU */}
        <div className="mt-2 sm:mt-3 mb-1">
          <div className={`px-6 sm:px-12 py-1.5 sm:py-2 rounded-md sm:rounded-lg border font-sans font-black text-lg sm:text-2xl md:text-3xl tracking-widest uppercase shadow-2xl transition-all ${
            isRedWinner
              ? "bg-[#cc2b1e] border-[#f87171] text-white shadow-[0_0_35px_rgba(204,43,30,0.8)]"
              : isBlueWinner
              ? "bg-[#1d61e7] border-[#60a5fa] text-white shadow-[0_0_35px_rgba(29,97,231,0.8)]"
              : "bg-[#d97706] border-[#fde047] text-white shadow-[0_0_35px_rgba(217,119,6,0.8)]"
          }`}>
            {isRedWinner 
              ? "PEMENANG : SUDUT MERAH" 
              : isBlueWinner 
              ? "PEMENANG : SUDUT BIRU" 
              : "HASIL : PERTANDINGAN SERI"}
          </div>
        </div>

        {/* 3. JENIS KEMENANGAN (CONTOH FOTO: KEMENANGAN ANGKA (SKOR AKHIR)) */}
        <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold uppercase tracking-[0.2em] text-white mt-1 drop-shadow-md">
          {jenisKemenangan}
        </div>

        {/* 4. INDIKATOR OTOMATIS BERALIH KE PARTAI BERIKUTNYA DALAM 20 DETIK */}
        <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/40 text-[11px] sm:text-xs font-mono text-amber-300 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Partai Selanjutnya Otomatis Dimulai: <strong className="text-white font-black">{countdown}s</strong></span>
            <button
              type="button"
              onClick={handleNextMatchNow}
              className="ml-2 px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider cursor-pointer transition-colors shadow-sm active:scale-95"
              title="Lanjut Sekarang"
            >
              Lanjut Sekarang ➔
            </button>
          </div>
          <div className="w-48 sm:w-64 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(0, ((20 - countdown) / 20) * 100))}%` }}
            />
          </div>
        </div>

      </header>

      {/* MAIN TWO-COLUMN SECTION WITH CENTER VS EMBLEM */}
      <main className="w-full max-w-6xl mx-auto flex-grow flex items-center justify-center my-auto px-2 sm:px-4 relative py-2">
        
        {/* 3D "VS" EMBLEM ICON DI TENGAH-TENGAH PERSIS CONTOH FOTO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
          <div className="relative flex items-center justify-center drop-shadow-[0_0_30px_rgba(6,182,212,0.85)] filter transform scale-90 sm:scale-110 md:scale-125 lg:scale-140">
            <div className="flex items-center text-5xl sm:text-6xl md:text-7xl font-black italic tracking-tighter transform -skew-x-12 select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#e0faff] via-[#22d3ee] to-[#0284c7] drop-shadow-[0_0_20px_rgba(34,211,238,0.95)] pr-0.5">
                V
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#ffeedb] via-[#fb923c] to-[#e11d48] drop-shadow-[0_0_20px_rgba(251,146,60,0.95)] -ml-2">
                S
              </span>
            </div>
          </div>
        </div>

        {/* DUA KOLOM DATA ATLET: KIRI (SUDUT BIRU), KANAN (SUDUT MERAH) */}
        <div className="w-full grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-10 items-stretch">
          
          {/* ========================================================================= */}
          {/* KOLOM KIRI: SUDUT BIRU */}
          {/* Logika: Menyala terang jika Biru Menang; Abu-abu tanpa warna jika Kalah   */}
          {/* ========================================================================= */}
          <div className={`rounded-xl sm:rounded-2xl border-2 flex flex-col justify-between transition-all duration-500 overflow-hidden shadow-2xl ${
            isBlueWinner
              ? "bg-[#184ebd] border-cyan-400 shadow-[0_0_55px_rgba(24,78,189,0.7)] text-white"
              : isRedWinner
              ? "bg-[#0c1426] border-[#1a2c4e] shadow-inner text-slate-300"
              : "bg-[#0e1c3c] border-blue-500/50 text-white"
          }`}>
            
            {/* ROW 1: NILAI AKHIR (GIANT DIGITS) */}
            <div className="py-2.5 sm:py-4 px-2 text-center border-b border-white/20">
              <div className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase text-slate-300 mb-0.5">
                NILAI AKHIR
              </div>
              <div className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-mono font-black tracking-tight leading-none ${
                isBlueWinner 
                  ? "text-[#fef08a] drop-shadow-[0_0_22px_rgba(254,240,138,0.9)]" 
                  : "text-white"
              }`}>
                {blueScore}
              </div>
            </div>

            {/* ROW 2: WAKTU TAMPIL | NILAI HUKUMAN */}
            <div className="grid grid-cols-2 divide-x divide-white/20 border-b border-white/20 text-center py-2 sm:py-3 px-1">
              {/* SUB-COL 1: WAKTU TAMPIL */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                  WAKTU TAMPIL
                </span>
                <span className="text-xl sm:text-3xl md:text-4xl font-mono font-black tracking-wide text-white">
                  {blueTimeFormatted}
                </span>
              </div>

              {/* SUB-COL 2: NILAI HUKUMAN */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                  NILAI HUKUMAN
                </span>
                <span className="text-xl sm:text-3xl md:text-4xl font-mono font-black tracking-wide text-white">
                  {bluePenalty}
                </span>
              </div>
            </div>

            {/* ROW 3: STANDAR DEVIASI */}
            <div className="py-2 sm:py-3 px-2 text-center border-b border-white/20">
              <div className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                STANDAR DEVIASI
              </div>
              <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-mono font-black tracking-wider text-white">
                {blueStdDev}
              </div>
            </div>

            {/* ROW 4: DATA ATLET (NAMA & ASAL KONTINGEN) - ALIGN KIRI SESUAI FOTO */}
            <div className="p-3 sm:p-5 text-left flex flex-col justify-center">
              <div className={`text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-black uppercase tracking-wide truncate ${
                isBlueWinner 
                  ? "text-white drop-shadow-md" 
                  : "text-[#38bdf8]"
              }`}>
                {blueAthlete}
              </div>
              <div className="text-xs sm:text-base md:text-xl font-sans font-black uppercase tracking-wider text-slate-200 truncate mt-0.5 sm:mt-1">
                {blueContingent}
              </div>
            </div>

          </div>


          {/* ========================================================================= */}
          {/* KOLOM KANAN: SUDUT MERAH */}
          {/* Logika: Menyala terang jika Merah Menang; Abu-abu tanpa warna jika Kalah  */}
          {/* ========================================================================= */}
          <div className={`rounded-xl sm:rounded-2xl border-2 flex flex-col justify-between transition-all duration-500 overflow-hidden shadow-2xl ${
            isRedWinner
              ? "bg-[#d43729] border-[#f87171] shadow-[0_0_55px_rgba(212,55,41,0.7)] text-white"
              : isBlueWinner
              ? "bg-[#181116] border-[#3b1c24] shadow-inner text-slate-300"
              : "bg-[#381119] border-red-500/50 text-white"
          }`}>
            
            {/* ROW 1: NILAI AKHIR (GIANT DIGITS) */}
            <div className="py-2.5 sm:py-4 px-2 text-center border-b border-white/20">
              <div className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase text-slate-300 mb-0.5">
                NILAI AKHIR
              </div>
              <div className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-mono font-black tracking-tight leading-none ${
                isRedWinner 
                  ? "text-[#fef08a] drop-shadow-[0_0_22px_rgba(254,240,138,0.9)]" 
                  : "text-white"
              }`}>
                {redScore}
              </div>
            </div>

            {/* ROW 2: WAKTU TAMPIL | NILAI HUKUMAN */}
            <div className="grid grid-cols-2 divide-x divide-white/20 border-b border-white/20 text-center py-2 sm:py-3 px-1">
              {/* SUB-COL 1: WAKTU TAMPIL */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                  WAKTU TAMPIL
                </span>
                <span className="text-xl sm:text-3xl md:text-4xl font-mono font-black tracking-wide text-white">
                  {redTimeFormatted}
                </span>
              </div>

              {/* SUB-COL 2: NILAI HUKUMAN */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                  NILAI HUKUMAN
                </span>
                <span className="text-xl sm:text-3xl md:text-4xl font-mono font-black tracking-wide text-white">
                  {redPenalty}
                </span>
              </div>
            </div>

            {/* ROW 3: STANDAR DEVIASI */}
            <div className="py-2 sm:py-3 px-2 text-center border-b border-white/20">
              <div className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                STANDAR DEVIASI
              </div>
              <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-mono font-black tracking-wider text-white">
                {redStdDev}
              </div>
            </div>

            {/* ROW 4: DATA ATLET (NAMA & ASAL KONTINGEN) - ALIGN KANAN SESUAI FOTO */}
            <div className="p-3 sm:p-5 text-right flex flex-col justify-center">
              <div className={`text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-black uppercase tracking-wide truncate ${
                isRedWinner 
                  ? "text-white drop-shadow-md" 
                  : "text-[#f87171]"
              }`}>
                {redAthlete}
              </div>
              <div className="text-xs sm:text-base md:text-xl font-sans font-black uppercase tracking-wider text-slate-200 truncate mt-0.5 sm:mt-1">
                {redContingent}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER SECTION: GELANGGANG & DIGITAL SKORING PENCAK SILAT */}
      <footer className="w-full text-center py-1 sm:py-2 shrink-0">
        <span className="text-[10px] sm:text-xs md:text-sm font-sans font-bold uppercase tracking-widest text-[#38bdf8] drop-shadow-sm">
          GELANGGANG {gelanggangNum} - JRZ SCORE OFFICIAL DIGITAL SKORING PENCAK SILAT
        </span>
      </footer>

    </div>
  );
};

export default TgrsVictoryDisplay;
