/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * JUDGE PANEL FOR TGR TUNGGAL (ATURAN 3.1.1 KESALAHAN GERAK)
 * Evaluasi 100 Gerakan Baku IPSI & PERSILAT (Base Score 9.90 • -0.01 Per Kesalahan)
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  TgrJudgeState, 
  TgrRule311ErrorType, 
  SKOR_DASAR_TUNGGAL, 
  PENALTI_KESALAHAN_311,
  formatTgrTime 
} from "../../utils/tgrTunggalScoring";
import { soundEffects } from "../../utils/audio";
import { AlertCircle, RotateCcw, Check, Sparkles, User, Award, Shield, CheckCircle2 } from "lucide-react";

interface TgrJudgePanelProps {
  judgeState: TgrJudgeState;
  activeJudgeId: number;
  athleteName: string;
  contingent: string;
  gender: "PUTRA" | "PUTRI";
  ageCategory: string;
  stage: string;
  timerElapsed: number;
  isTimerRunning: boolean;
  onSelectJudge?: (id: number) => void;
  onAddError: (errorType: TgrRule311ErrorType, label: string) => void;
  onUndoError: () => void;
  onSetFlowScore: (score: number) => void;
  onSubmitScore: () => void;
  onResetJudgeScore?: () => void;
  judgesCount?: 3 | 5;
}

export const TgrJudgePanel: React.FC<TgrJudgePanelProps> = ({
  judgeState,
  activeJudgeId,
  athleteName,
  contingent,
  gender,
  ageCategory,
  stage,
  timerElapsed,
  isTimerRunning,
  onAddError,
  onUndoError,
  onSetFlowScore,
  onSubmitScore,
  onResetJudgeScore,
  judgesCount = 5,
}) => {
  const [pulseBtn, setPulseBtn] = useState<string | null>(null);
  const lastPressRef = useRef<number>(0);

  // Anti-double-click guard (250ms debounce per physical press)
  const handleMarkError = (type: TgrRule311ErrorType, label: string) => {
    const now = Date.now();
    if (now - lastPressRef.current < 250) return;
    lastPressRef.current = now;

    setPulseBtn(type);
    setTimeout(() => setPulseBtn(null), 180);

    try { soundEffects.playClick(); } catch {}
    onAddError(type, label);
  };

  const handleBackspace = () => {
    if (judgeState.errorsCount <= 0) return;
    try { soundEffects.playClick(); } catch {}
    onUndoError();
  };

  const handleSelectFlow = (val: number) => {
    try { soundEffects.playClick(); } catch {}
    onSetFlowScore(val);
  };

  const handleSubmit = () => {
    try { soundEffects.playChime(); } catch {}
    onSubmitScore();
  };

  // Keyboard shortcut listener for judge hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        handleMarkError("GENERAL_WRONG", "Salah Gerak Baku");
      } else if (e.key === "1") {
        e.preventDefault();
        handleMarkError("DETAIL_GERAK", "Rincian Detail Gerak Salah");
      } else if (e.key === "2") {
        e.preventDefault();
        handleMarkError("URUTAN_GERAK", "Urutan Rincian Gerak Terbalik/Salah");
      } else if (e.key === "3") {
        e.preventDefault();
        handleMarkError("GERAKAN_TERTINGGAL", "Ada Gerakan Tertinggal / Lewat");
      } else if (e.key === "4") {
        e.preventDefault();
        handleMarkError("SENJATA_TERLEPAS", "Senjata Terlepas Tidak Menyentuh Matras");
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [judgeState.errorsCount]);

  return (
    <div className="bg-[#040816] border-2 border-cyan-500/40 rounded-2xl p-3 sm:p-5 flex flex-col justify-between font-sans shadow-2xl relative overflow-hidden select-none">
      {/* Top Banner Gradient */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-blue-500 shadow-[0_0_15px_#06b6d4]" />

      {/* HEADER: INFO PESILAT & JURI SELECTOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3 border-b border-cyan-500/20 mb-3">
        {/* Athlete Info */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold shadow-inner shrink-0">
            <User className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-wider truncate">
                {athleteName}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-600/30 border border-blue-400/40 text-blue-300 font-mono text-[9px] font-bold uppercase shrink-0">
                {gender}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300/80">
              <span className="truncate">{contingent}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{ageCategory}</span>
              <span>•</span>
              <span className="text-slate-400">{stage}</span>
            </div>
          </div>
        </div>

        {/* Identitas Juri Terkunci (Non-Interactive, Ditentukan di Halaman Awal) */}
        <div className="flex items-center gap-2 bg-[#020512] border border-amber-500/40 px-3 py-1.5 rounded-xl shrink-0 self-end sm:self-auto shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
            JURI {activeJudgeId}
          </span>
        </div>
      </div>

      {/* SCORE DASHBOARD ROW (ACCURACY + FLOW = TOTAL SCORE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Nilai Dasar */}
        <div className="bg-[#03091e] border border-cyan-500/30 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            SKOR DASAR BAKU
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-cyan-300">
            {SKOR_DASAR_TUNGGAL.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-cyan-400/60 uppercase">100 Gerakan Sah</span>
        </div>

        {/* Kesalahan Gerak (3.1.1) */}
        <div className="bg-[#120710] border border-rose-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-rose-400 uppercase tracking-wider">
            SALAH GERAK (3.1.1)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-rose-400">
              {judgeState.errorsCount}x
            </span>
            <span className="text-xs font-mono text-rose-300/80">
              (-{(judgeState.errorsCount * PENALTI_KESALAHAN_311).toFixed(2)})
            </span>
          </div>
          <span className="text-[8px] font-mono text-rose-400/60 uppercase">-0.01 Per Gerak</span>
        </div>

        {/* Kemantapan / Flow Score */}
        <div className="bg-[#040e1e] border border-emerald-500/30 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            KEMANTAPAN / FLOW
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            +{judgeState.kemantapanScore.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-emerald-400/60 uppercase">Skor 0.01 - 0.10</span>
        </div>

        {/* Total Nilai Juri Ini */}
        <div className="bg-gradient-to-br from-[#0c1a40] to-[#040c24] border-2 border-amber-400/70 rounded-xl p-2.5 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-black text-amber-300 uppercase tracking-wider">
            TOTAL NILAI JURI {activeJudgeId}
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 leading-none my-0.5">
            {judgeState.totalScore.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-amber-300/80 uppercase">
            Kebenaran: {judgeState.kebenaranScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CORE RULE 3.1.1 TOUCH AREA */}
      <div className="my-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            TOMBOL KESALAHAN GERAK SESUAI ATURAN PERSILAT 3.1.1 (-0.01)
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            Waktu: <strong className="text-white">{formatTgrTime(timerElapsed)}</strong>
          </span>
        </div>

        {/* GIANT PRIMARY WRONG MOVE BUTTON (FOR RAPID SINGLE TAP DURING LIVE ROUTINE) */}
        <button
          onClick={() => handleMarkError("GENERAL_WRONG", "Salah Gerak Baku")}
          className={`w-full py-5 sm:py-6 rounded-2xl bg-gradient-to-b from-[#b91c1c] via-[#991b1b] to-[#7f1d1d] hover:from-[#dc2626] hover:to-[#991b1b] active:from-[#7f1d1d] active:to-[#450a0a] border-2 border-rose-400/80 text-white font-sans font-black text-base sm:text-xl uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.45)] flex items-center justify-center gap-3 touch-manipulation select-none active:scale-[0.98] ${
            pulseBtn === "GENERAL_WRONG" ? "scale-98 ring-4 ring-rose-400" : ""
          }`}
          title="Tekan 1 Kali untuk Mengurangi 0.01 Poin Kesalahan Gerak (Shortcut: Spasi / W)"
        >
          <span className="text-2xl sm:text-3xl">✖</span>
          <span>WRONG MOVE (-0.01)</span>
          <span className="text-xs font-mono font-normal opacity-80 bg-red-950/70 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>ATURAN 3.1.1</span>
            <span className="text-[10px] text-amber-300 font-bold hidden sm:inline">[Spasi / W]</span>
          </span>
        </button>

        {/* 4 SPECIFIC 3.1.1 ERROR BREAKDOWN BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Detail Gerakan Salah */}
          <button
            onClick={() => handleMarkError("DETAIL_GERAK", "Rincian Detail Gerak Salah")}
            className="p-3 rounded-xl bg-[#091530] hover:bg-[#0f214a] border border-cyan-500/40 text-cyan-200 hover:text-white font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 shadow touch-manipulation relative"
            title="Posisi kuda-kuda, sudut tangkisan/pukulan tidak sesuai gerakan baku (Shortcut: 1)"
          >
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold text-cyan-400/70 bg-cyan-950/50 px-1 rounded">[1]</span>
            <span>DETAIL GERAK SALAH</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">-0.01</span>
          </button>

          {/* 2. Urutan Gerak Salah */}
          <button
            onClick={() => handleMarkError("URUTAN_GERAK", "Urutan Rincian Gerak Terbalik/Salah")}
            className="p-3 rounded-xl bg-[#091530] hover:bg-[#0f214a] border border-cyan-500/40 text-cyan-200 hover:text-white font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 shadow touch-manipulation relative"
            title="Urutan gerakan tidak sesuai alur 100 gerakan baku (Shortcut: 2)"
          >
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold text-cyan-400/70 bg-cyan-950/50 px-1 rounded">[2]</span>
            <span>URUTAN GERAK SALAH</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">-0.01</span>
          </button>

          {/* 3. Gerakan Tertinggal / Hilang */}
          <button
            onClick={() => handleMarkError("GERAKAN_TERTINGGAL", "Ada Gerakan Tertinggal / Lewat")}
            className="p-3 rounded-xl bg-[#091530] hover:bg-[#0f214a] border border-cyan-500/40 text-cyan-200 hover:text-white font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 shadow touch-manipulation relative"
            title="Gerakan dilewati atau tidak diperagakan oleh pesilat (Shortcut: 3)"
          >
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold text-cyan-400/70 bg-cyan-950/50 px-1 rounded">[3]</span>
            <span>GERAKAN TERTINGGAL</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">-0.01</span>
          </button>

          {/* 4. Senjata Terlepas (Tanpa Menyentuh Matras) */}
          <button
            onClick={() => handleMarkError("SENJATA_TERLEPAS", "Senjata Terlepas Tidak Menyentuh Matras")}
            className="p-3 rounded-xl bg-[#091530] hover:bg-[#0f214a] border border-cyan-500/40 text-cyan-200 hover:text-white font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 shadow touch-manipulation relative"
            title="Senjata golok atau toya terlepas dari tangan tapi berhasil ditangkap kembali sebelum lantai (Shortcut: 4)"
          >
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold text-cyan-400/70 bg-cyan-950/50 px-1 rounded">[4]</span>
            <span>SENJATA TERLEPAS</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">-0.01</span>
          </button>
        </div>
      </div>

      {/* ROW: BACKSPACE BUTTON & RECENT ACTION FEEDBACK */}
      <div className="flex items-center justify-between gap-3 p-2 bg-[#020512] border border-cyan-500/25 rounded-xl my-1">
        {/* Backspace Button */}
        <button
          onClick={handleBackspace}
          disabled={judgeState.errorsCount <= 0}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${
            judgeState.errorsCount > 0
              ? "bg-[#180a0a] hover:bg-[#2c1212] border-amber-500/60 text-amber-300 hover:text-amber-200 cursor-pointer active:scale-95 shadow"
              : "bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
          }`}
          title="Batalkan 1 Kesalahan Terakhir (+0.01)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>BATALKAN SALAH (BACKSPACE +0.01)</span>
        </button>

        {/* History info badge */}
        <div className="text-[9.5px] font-mono text-slate-400 text-right">
          {judgeState.errorHistory.length > 0 ? (
            <span>Terakhir: <strong className="text-amber-400">{judgeState.errorHistory[0].label}</strong> ({judgeState.errorHistory[0].timeFormatted})</span>
          ) : (
            <span className="text-emerald-400">Belum ada catatan kesalahan gerak</span>
          )}
        </div>
      </div>

      {/* FLOW OF MOVEMENT & STAMINA SELECTION (0.01 - 0.10) */}
      <div className="my-2 p-3 bg-[#030818] border border-emerald-500/30 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            PENILAIAN KEMANTAPAN, IRAMA, & PENGHAYATAN STAMINA (0.01 s.d 0.10)
          </span>
          <span className="text-xs font-mono font-black text-emerald-400">
            Terpilih: +{judgeState.kemantapanScore.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {[0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10].map((val) => {
            const isSelected = Math.abs(judgeState.kemantapanScore - val) < 0.001;
            return (
              <button
                key={val}
                onClick={() => handleSelectFlow(val)}
                className={`py-2 rounded-lg font-mono font-black text-xs transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-b from-emerald-500 to-teal-600 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105"
                    : "bg-[#050c20] hover:bg-[#091536] border-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                +{val.toFixed(2)}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER ACTION: KIRIM / SUBMIT NILAI KE SERVER DEWAN */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-cyan-500/20">
        <div className="text-[10px] font-mono text-slate-400">
          Status: {judgeState.isSubmitted ? (
            <span className="text-emerald-400 font-bold uppercase">✓ NILAI TELAH DIKIRIM KE DEWAN</span>
          ) : (
            <span className="text-amber-400 font-bold uppercase animate-pulse">● SIAP VERIFIKASI / BELUM DIKIRIM</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onResetJudgeScore && (
            <button
              onClick={onResetJudgeScore}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-all border border-slate-800 cursor-pointer"
            >
              Reset Juri Ini
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={judgeState.isSubmitted}
            className={`px-5 py-2.5 rounded-xl font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              judgeState.isSubmitted
                ? "bg-emerald-700/60 text-emerald-200 border border-emerald-500/40 cursor-not-allowed opacity-90 shadow-emerald-950/50"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-900/50 cursor-pointer active:scale-95"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{judgeState.isSubmitted ? "NILAI TERKUNCI & SAH" : "KIRIM NILAI RESMI"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
