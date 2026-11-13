/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TIMER COMPONENT FOR TGR TUNGGAL (BATAS WAKTU 3 MENIT • 180 DETIK)
 * Standar Toleransi IPSI & PERSILAT 2026 (+/- 5 Detik)
 */

import React, { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle2, Clock, AlertTriangle, Volume2, Shield } from "lucide-react";
import { 
  DURASI_STANDAR_TUNGGAL_DETIK, 
  TOLERANSI_WAKTU_DETIK, 
  calculateTgrTimePenalty, 
  formatTgrPrecisionTime, 
  formatTgrTime 
} from "../../utils/tgrTunggalScoring";
import { soundEffects } from "../../utils/audio";

interface TgrTimerProps {
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  isFinished: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinish: () => void;
  onTick: (elapsed: number, remaining: number) => void;
  readOnly?: boolean;
}

export const TgrTimer: React.FC<TgrTimerProps> = ({
  elapsed,
  remaining,
  isRunning,
  isFinished,
  onStart,
  onPause,
  onReset,
  onFinish,
  onTick,
  readOnly = false,
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warned250Ref = useRef<boolean>(false);
  const warned300Ref = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const baseElapsedRef = useRef<number>(elapsed);

  const [targetDuration, setTargetDuration] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("jrz_tgrs_target_duration") || DURASI_STANDAR_TUNGGAL_DETIK);
    }
    return DURASI_STANDAR_TUNGGAL_DETIK;
  });

  // Status toleransi waktu (01:30s, 01:50s, atau 03:00s)
  const minTolerance = Math.max(0, targetDuration - TOLERANSI_WAKTU_DETIK);
  const maxTolerance = targetDuration + TOLERANSI_WAKTU_DETIK;
  const timePenalty = calculateTgrTimePenalty(elapsed, targetDuration);

  let timingStatus: "PREPARING" | "WARNING_SOON" | "SAFE_ZONE" | "OVERTIME" = "PREPARING";
  if (elapsed >= minTolerance && elapsed <= maxTolerance) {
    timingStatus = "SAFE_ZONE";
  } else if (elapsed > maxTolerance) {
    timingStatus = "OVERTIME";
  } else if (elapsed >= (targetDuration - 15)) {
    timingStatus = "WARNING_SOON";
  }

  // Keep baseElapsed in sync when elapsed changes externally while paused (e.g. onReset)
  useEffect(() => {
    if (!isRunning) {
      baseElapsedRef.current = elapsed;
    }
  }, [elapsed, isRunning]);

  // High-precision wall-clock timer tick (every 100ms without setInterval drift)
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const diffSeconds = (now - startTimeRef.current) / 1000;
        const nextElapsed = Number((baseElapsedRef.current + diffSeconds).toFixed(1));
        const nextRemaining = Math.max(0, Number((targetDuration - nextElapsed).toFixed(1)));
        
        // Audio cues at warning tone (target - 10s)
        const warningThreshold = Math.max(0, targetDuration - 10);
        if (nextElapsed >= warningThreshold && !warned250Ref.current) {
          warned250Ref.current = true;
          try { soundEffects.playAlert(); } catch {}
        }

        // Audio cues at target limit tone
        if (nextElapsed >= targetDuration && !warned300Ref.current) {
          warned300Ref.current = true;
          try { soundEffects.playGong(); } catch {}
        }

        onTick(nextElapsed, nextRemaining);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onTick]);

  const handleStart = () => {
    try { soundEffects.playGong(); } catch {}
    onStart();
  };

  const handlePause = () => {
    baseElapsedRef.current = elapsed;
    try { soundEffects.playClick(); } catch {}
    onPause();
  };

  const handleFinish = () => {
    baseElapsedRef.current = elapsed;
    try { soundEffects.playGong(); } catch {}
    onFinish();
  };

  const handleReset = () => {
    warned250Ref.current = false;
    warned300Ref.current = false;
    baseElapsedRef.current = 0;
    try { soundEffects.playClick(); } catch {}
    onReset();
  };

  return (
    <div className="bg-gradient-to-b from-[#091535] via-[#050c20] to-[#020512] border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Top Accent Strip */}
      <div className={`absolute top-0 inset-x-0 h-1.5 transition-colors ${
        timingStatus === "SAFE_ZONE"
          ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-[0_0_15px_#10b981]"
          : timingStatus === "OVERTIME"
          ? "bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 shadow-[0_0_15px_#ef4444]"
          : "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
      }`} />

      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/25">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-wider leading-none">
              TIMER RESMI TGR TUNGGAL
            </h3>
            <span className="text-[9.5px] font-mono text-cyan-300 font-bold tracking-widest uppercase">
              Batas Waktu: 3 Menit (180 Detik) • Toleransi +/- 5s
            </span>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border flex items-center gap-1.5 ${
          timingStatus === "SAFE_ZONE"
            ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            : timingStatus === "OVERTIME"
            ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
            : timingStatus === "WARNING_SOON"
            ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            : "bg-slate-900 border-slate-700 text-slate-300"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isRunning ? "bg-cyan-400 animate-ping" : "bg-slate-500"
          }`} />
          <span>
            {timingStatus === "SAFE_ZONE" ? "TOLERANSI AMAN (0.00)" : 
             timingStatus === "OVERTIME" ? `LEBIH WAKTU (-${timePenalty.toFixed(2)})` :
             timingStatus === "WARNING_SOON" ? "MENDEKATI 3:00" : "PERSIAPAN"}
          </span>
        </div>
      </div>

      {/* Main Dual Timer Display */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 my-2">
        {/* Countdown: Sisa Waktu Menuju 03:00 */}
        <div className="bg-[#030818] border border-cyan-500/30 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner relative">
          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
            HITUNG MUNDUR (SISA)
          </span>
          <span className={`text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-wider leading-none drop-shadow-[0_0_12px_rgba(6,182,212,0.5)] ${
            remaining <= 10 && remaining > 0 ? "text-amber-400 animate-pulse" : remaining === 0 ? "text-rose-500" : "text-cyan-300"
          }`}>
            {formatTgrTime(remaining)}
          </span>
          <span className="text-[9px] font-mono text-cyan-400/70 mt-1">
            Target: 03:00
          </span>
        </div>

        {/* Countup: Waktu Aktual Berjalan */}
        <div className={`border rounded-xl p-3 flex flex-col items-center justify-center shadow-inner relative transition-colors ${
          timingStatus === "SAFE_ZONE" 
            ? "bg-emerald-950/30 border-emerald-500/50" 
            : timingStatus === "OVERTIME"
            ? "bg-rose-950/30 border-rose-500/50"
            : "bg-[#030818] border-cyan-500/30"
        }`}>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
            WAKTU AKTUAL (BERJALAN)
          </span>
          <span className={`text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-wider leading-none drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] ${
            timingStatus === "SAFE_ZONE" ? "text-emerald-400" : timingStatus === "OVERTIME" ? "text-rose-400" : "text-amber-400"
          }`}>
            {formatTgrPrecisionTime(elapsed)}
          </span>
          <span className="text-[9px] font-mono text-amber-400/80 mt-1">
            {elapsed >= minTolerance && elapsed <= maxTolerance 
              ? "✓ Rentang Sah 02:55 - 03:05" 
              : elapsed > maxTolerance 
              ? `Deviasi: +${(elapsed - 180).toFixed(1)}s (-${timePenalty.toFixed(2)})`
              : "Menuju 3 Menit"}
          </span>
        </div>
      </div>

      {/* Visual Tolerance Bar (175s - 185s Zone Indicator) */}
      <div className="w-full bg-[#030716] border border-cyan-500/30 rounded-xl p-2.5 my-2">
        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400 mb-1">
          <span>00:00</span>
          <span className="text-emerald-400">02:55 (MIN)</span>
          <span className="text-cyan-300 font-black">03:00 (TARGET)</span>
          <span className="text-emerald-400">03:05 (MAX)</span>
          <span className="text-rose-400">&gt; 03:05</span>
        </div>
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden relative border border-slate-700/80">
          {/* Safe Zone Highlight between 175s and 185s */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/35 border-x border-emerald-400" 
            style={{ left: `${(175 / 200) * 100}%`, width: `${(10 / 200) * 100}%` }}
            title="Zona Toleransi Waktu Aman (+/- 5 detik)"
          />
          {/* Current Progress Indicator */}
          <div 
            className={`h-full transition-all duration-100 ${
              timingStatus === "SAFE_ZONE" ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" :
              timingStatus === "OVERTIME" ? "bg-rose-500 shadow-[0_0_10px_#ef4444]" :
              "bg-gradient-to-r from-cyan-500 to-blue-500"
            }`}
            style={{ width: `${Math.min(100, (elapsed / 200) * 100)}%` }}
          />
        </div>
      </div>

      {/* Target Duration Selector (01:30s, 01:50s, 03:00s) */}
      <div className="flex items-center justify-center gap-1.5 py-1 px-2 border-t border-cyan-500/20 text-[10px] font-mono">
        <span className="text-cyan-300 font-bold uppercase">Pilihan Timer:</span>
        {[
          { label: "01:30s", seconds: 90 },
          { label: "01:50s", seconds: 110 },
          { label: "03:00s", seconds: 180 },
        ].map((opt) => (
          <button
            key={opt.seconds}
            type="button"
            onClick={() => {
              setTargetDuration(opt.seconds);
              try {
                localStorage.setItem("jrz_tgrs_target_duration", String(opt.seconds));
                window.dispatchEvent(new CustomEvent("jrz_tgrs_target_duration_changed", { detail: opt.seconds }));
              } catch {}
            }}
            className={`px-2.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer ${
              targetDuration === opt.seconds
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "bg-slate-900 text-slate-300 border border-slate-700 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Controls (Hidden if read-only) */}
      {!readOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-cyan-500/25">
          {/* Start / Play */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-sans font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              title="Mulai Timer Penampilan (Bel Gong Awal)"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>MULAI</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-sans font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              title="Jeda Waktu Penampilan"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>JEDA (PAUSE)</span>
            </button>
          )}

          {/* Selesai / Finish Penampilan */}
          <button
            onClick={handleFinish}
            disabled={elapsed <= 0}
            className={`font-sans font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider ${
              elapsed > 0 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
            }`}
            title="Tandai Pesilat Menyelesaikan Seluruh 100 Jurus Baku"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SELESAI (GONG)</span>
          </button>

          {/* Reset Timer */}
          <button
            onClick={handleReset}
            disabled={isRunning}
            className={`font-sans font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider ${
              !isRunning 
                ? "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer active:scale-95" 
                : "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50"
            }`}
            title="Reset Timer Kembali ke 03:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET 3:00</span>
          </button>

          {/* Time Penalty Indicator Button */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center">
            <span className="text-[8px] font-mono text-slate-400 uppercase font-bold">Hukuman Waktu</span>
            <span className={`text-xs font-mono font-black ${
              timePenalty > 0 ? "text-rose-400 font-extrabold" : "text-emerald-400"
            }`}>
              {timePenalty > 0 ? `-${timePenalty.toFixed(2)}` : "0.00 (SAH)"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
