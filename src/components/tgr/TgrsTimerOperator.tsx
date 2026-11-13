/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TIMER KHUSUS KATEGORI JURUS (TGRS: TUNGGAL, GANDA, REGU, SOLO KREATIF)
 * Standar Resmi PB IPSI & PERSILAT 2026:
 * - DUA TIMER BERJALAN MAJU DARI 00:00:
 *   1. TIMER WAKTU PENAMPIL: Berjalan maju dari 00:00 tanpa batas sampai tombol STOP ditekan
 *      (menandakan itulah waktu penampil yang sebenarnya).
 *   2. TIMER 3 MENIT: Berjalan maju dari 00:00 sampai menit 03:00 lalu berhenti di 03:00.
 *      Jika atlet belum selesai saat menit 03:00, timer 3 menit berhenti tetapi timer penampil
 *      terus berjalan untuk menghitung kelebihan waktunya (overtime).
 * - PEMILIHAN SUDUT (BIRU/MERAH) HANYA DILAKUKAN DI PANEL DEWAN:
 *   Panel timer hanya menerima data sudut aktif dari dewan (read-only).
 * - TUGAS OPERATOR TIMER HANYA MEMULAI (START) & MENGHENTIKAN (STOP) TIMER.
 * - TAMPILAN DINAMIS & RESPONSIF: Pas sempurna di layar perangkat (HP, Tablet, PC) tanpa ada bagian terpotong.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  TgrsMatchState,
  formatTimeMMSS,
  formatTimePrecision,
  saveTgrsLiveState,
  calculateTimePenalty,
  resetTgrsMatchToStandby,
  getTgrsPerformerElapsed,
  getTgrs3MinElapsed,
  DURASI_STANDAR_TGRS_DETIK,
  TOLERANSI_WAKTU_DETIK
} from "../../utils/tgrsScoringEngine";
import { soundEffects } from "../../utils/audio";
import { sound } from "../../utils/sound";
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Bell,
  Shuffle,
  Radio,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Users,
  Monitor
} from "lucide-react";

interface TgrsTimerOperatorProps {
  state: TgrsMatchState;
  matchState?: any;
  onUpdateState: (updater: (prev: TgrsMatchState) => TgrsMatchState) => void;
  onBack: () => void;
  onSwitchToTanding?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TgrsTimerOperator: React.FC<TgrsTimerOperatorProps> = ({
  state,
  matchState,
  onUpdateState,
  onBack,
  onSwitchToTanding,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const [precisionMode, setPrecisionMode] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showMatchResetModal, setShowMatchResetModal] = useState<boolean>(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<string | null>(null);

  // Local states for smooth, high-precision dual-timer rendering
  const [displayPerformerElapsed, setDisplayPerformerElapsed] = useState<number>(() => {
    return getTgrsPerformerElapsed(state);
  });
  const [display3MinElapsed, setDisplay3MinElapsed] = useState<number>(() => {
    return getTgrs3MinElapsed(state);
  });

  // Stable references for high-frequency interval updates
  const targetDurationRef = useRef<number>(state.targetDuration || DURASI_STANDAR_TGRS_DETIK);
  targetDurationRef.current = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;

  const isTimer1RunningRef = useRef<boolean>(Boolean(state.isTimerRunning && !state.isPerformerFinished));
  const isTimer2RunningRef = useRef<boolean>(Boolean(state.isTimer2Running ?? (state.isTimerRunning && !state.is3MinFinished)));
  const isPerformerFinishedRef = useRef<boolean>(Boolean(state.isPerformerFinished));
  const is3MinFinishedRef = useRef<boolean>(Boolean(state.is3MinFinished || (state.timer3MinElapsed && state.timer3MinElapsed >= targetDurationRef.current)));
  const performerTimeRef = useRef<number | null>(state.performerTime ?? null);
  const timerStartedAtRef = useRef<number | null>(state.timerStartedAt || null);
  const basePerformerElapsedRef = useRef<number>(state.timerElapsed || 0);
  const lastSyncedSecRef = useRef<number>(-1);
  const onUpdateStateRef = useRef(onUpdateState);
  onUpdateStateRef.current = onUpdateState;

  // Audio trigger guards
  const warned250Ref = useRef<boolean>(false);
  const warned300Ref = useRef<boolean>(false);
  const warned305Ref = useRef<boolean>(false);

  // Reset audio guards when elapsed time is small/reset
  useEffect(() => {
    const curTarget = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;
    if (display3MinElapsed < (curTarget - 15) && displayPerformerElapsed < (curTarget - 15)) {
      warned250Ref.current = false;
      warned300Ref.current = false;
      warned305Ref.current = false;
    }
  }, [display3MinElapsed, displayPerformerElapsed, state.targetDuration]);

  // Synchronize when state changes externally (e.g. from background ticker, Dewan, or on tab refocus)
  useEffect(() => {
    const curTarget = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;
    targetDurationRef.current = curTarget;
    const isT1 = Boolean(state.isTimerRunning && !state.isPerformerFinished);
    const isT2 = Boolean(state.isTimer2Running ?? (state.isTimerRunning && !state.is3MinFinished));
    const isPerfDone = Boolean(state.isPerformerFinished);
    const is3mDone = Boolean(state.is3MinFinished || (state.timer3MinElapsed && state.timer3MinElapsed >= curTarget));

    isTimer1RunningRef.current = isT1;
    isTimer2RunningRef.current = isT2;
    isPerformerFinishedRef.current = isPerfDone;
    is3MinFinishedRef.current = is3mDone;
    performerTimeRef.current = state.performerTime ?? null;

    if (state.timerStartedAt && (isT1 || isT2)) {
      timerStartedAtRef.current = state.timerStartedAt;
      const raw = Math.max(0, (Date.now() - state.timerStartedAt) / 1000);
      if (isPerfDone && typeof state.performerTime === "number") {
        setDisplayPerformerElapsed(state.performerTime);
      } else {
        setDisplayPerformerElapsed(Number(raw.toFixed(1)));
      }
      if (is3mDone) {
        setDisplay3MinElapsed(curTarget);
      } else {
        setDisplay3MinElapsed(Number(Math.min(curTarget, raw).toFixed(1)));
      }
    } else {
      if (!isT1 && !isT2) {
        timerStartedAtRef.current = null;
      }
      setDisplayPerformerElapsed(getTgrsPerformerElapsed(state));
      setDisplay3MinElapsed(getTgrs3MinElapsed(state));
    }
  }, [
    state.isTimerRunning,
    state.isTimer2Running,
    state.isPerformerFinished,
    state.is3MinFinished,
    state.performerTime,
    state.timerStartedAt,
    state.timerElapsed,
    state.timer3MinElapsed,
    state.targetDuration
  ]);

  // High-precision clock ticker running continuously on mount
  useEffect(() => {
    const interval = setInterval(() => {
      const startedAt = timerStartedAtRef.current;
      const shouldRun = (isTimer1RunningRef.current && !isPerformerFinishedRef.current) || 
                        (isTimer2RunningRef.current && !is3MinFinishedRef.current);

      if (shouldRun && startedAt) {
        const now = Date.now();
        const rawElapsed = Number(((now - startedAt) / 1000).toFixed(1));

        // 1. Tick Timer 1 (Waktu Penampil): Hanya berjalan jika belum di-STOP
        let currentPerformerTime = basePerformerElapsedRef.current;
        if (isTimer1RunningRef.current && !isPerformerFinishedRef.current) {
          currentPerformerTime = rawElapsed;
          setDisplayPerformerElapsed(rawElapsed);
        } else if (isPerformerFinishedRef.current && performerTimeRef.current !== null) {
          currentPerformerTime = performerTimeRef.current;
          setDisplayPerformerElapsed(currentPerformerTime);
        }

        // 2. Tick Timer 2 (Timer Target / Batas Resmi): Berjalan maju sampai targetDuration (90s, 110s, 180s)
        // TETAP BERJALAN MESKIPUN TIMER 1 TELAH DI-STOP!
        const curTarget = targetDurationRef.current;
        let current3MinTime = Math.min(curTarget, rawElapsed);
        if (isTimer2RunningRef.current && !is3MinFinishedRef.current) {
          setDisplay3MinElapsed(current3MinTime);

          // Audio cues:
          // A. Peringatan 10 detik sebelum batas target (misal 01:20 untuk 01:30, 01:40 untuk 01:50, 02:50 untuk 03:00)
          if (rawElapsed >= Math.max(10, curTarget - 10) && !warned250Ref.current && !audioMuted) {
            warned250Ref.current = true;
            try { soundEffects.playChime(); } catch {}
          }

          // B. Batas waktu target tercapai (GONG BERBUNYI & TIMER 2 BERHENTI TEPAT DI TARGET)
          if (rawElapsed >= curTarget && !warned300Ref.current) {
            warned300Ref.current = true;
            is3MinFinishedRef.current = true;
            isTimer2RunningRef.current = false;
            setDisplay3MinElapsed(curTarget);
            try {
              if (!audioMuted) sound.playGong();
            } catch {}

            // Jika Timer 1 juga sudah selesai (STOP sudah ditekan sebelumnya), matikan timerStartedAt
            if (isPerformerFinishedRef.current) {
              timerStartedAtRef.current = null;
            }
          }
        }

        // C. Overtime buzzer jika atlet masih tampil melewati batas toleransi (+5 detik)
        if (rawElapsed >= (curTarget + 5) && !warned305Ref.current && !audioMuted && !isPerformerFinishedRef.current) {
          warned305Ref.current = true;
          try { sound.playBuzzer(); } catch {}
        }

        // Broadcast to parent & other panels once per whole second to avoid UI lag
        const wholeSec = Math.floor(rawElapsed);
        if (wholeSec !== lastSyncedSecRef.current) {
          lastSyncedSecRef.current = wholeSec;
          const currentRemaining = Math.max(0, Number((curTarget - currentPerformerTime).toFixed(1)));
          const allDone = isPerformerFinishedRef.current && (is3MinFinishedRef.current || rawElapsed >= curTarget);

          onUpdateStateRef.current((prev) => {
            const isBlue = prev.activeCorner === "BLUE";
            const updatedBlue = isBlue
              ? { 
                  ...prev.bluePerformer, 
                  timerElapsed: currentPerformerTime, 
                  timerRemaining: currentRemaining,
                  timer3MinElapsed: current3MinTime,
                  isTimerRunning: isTimer1RunningRef.current && !isPerformerFinishedRef.current,
                  isTimer2Running: isTimer2RunningRef.current && !is3MinFinishedRef.current,
                  isPerformerFinished: isPerformerFinishedRef.current,
                  performerTime: isPerformerFinishedRef.current ? performerTimeRef.current : null,
                  is3MinFinished: is3MinFinishedRef.current,
                  isFinished: allDone
                }
              : prev.bluePerformer;
            const updatedRed = !isBlue
              ? { 
                  ...prev.redPerformer, 
                  timerElapsed: currentPerformerTime, 
                  timerRemaining: currentRemaining,
                  timer3MinElapsed: current3MinTime,
                  isTimerRunning: isTimer1RunningRef.current && !isPerformerFinishedRef.current,
                  isTimer2Running: isTimer2RunningRef.current && !is3MinFinishedRef.current,
                  isPerformerFinished: isPerformerFinishedRef.current,
                  performerTime: isPerformerFinishedRef.current ? performerTimeRef.current : null,
                  is3MinFinished: is3MinFinishedRef.current,
                  isFinished: allDone
                }
              : prev.redPerformer;

            const next: TgrsMatchState = {
              ...prev,
              timerElapsed: currentPerformerTime,
              timerRemaining: currentRemaining,
              timer3MinElapsed: current3MinTime,
              isTimerRunning: isTimer1RunningRef.current && !isPerformerFinishedRef.current,
              isTimer2Running: isTimer2RunningRef.current && !is3MinFinishedRef.current,
              isPerformerFinished: isPerformerFinishedRef.current,
              performerTime: isPerformerFinishedRef.current ? performerTimeRef.current : null,
              is3MinFinished: is3MinFinishedRef.current,
              isFinished: allDone,
              timerStartedAt: allDone ? null : startedAt,
              bluePerformer: updatedBlue,
              redPerformer: updatedRed
            };
            saveTgrsLiveState(next);
            return next;
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [audioMuted]);

  // Operator action: START TIMER (Memulai Timer 1 & Timer 2 bersamaan dari 00:00)
  const handleStartTimer = () => {
    const isBlue = state.activeCorner === "BLUE";
    const isTargetFinished = isBlue ? Boolean(state.bluePerformer?.isFinished) : Boolean(state.redPerformer?.isFinished);
    if (isTargetFinished) {
      return;
    }

    try {
      if (!audioMuted) soundEffects.playClick();
    } catch {}

    const now = Date.now();
    const currentBase = displayPerformerElapsed;
    const startedAt = now - (currentBase * 1000);

    timerStartedAtRef.current = startedAt;
    isTimer1RunningRef.current = true;
    isTimer2RunningRef.current = true;
    isPerformerFinishedRef.current = false;
    is3MinFinishedRef.current = false;
    performerTimeRef.current = null;
    basePerformerElapsedRef.current = currentBase;

    onUpdateStateRef.current((prev) => {
      const isBlue = prev.activeCorner === "BLUE";
      const next: TgrsMatchState = {
        ...prev,
        isTimerRunning: true,
        isTimer2Running: true,
        isPerformerFinished: false,
        performerTime: null,
        is3MinFinished: false,
        isFinished: false,
        timerStartedAt: startedAt,
        bluePerformer: isBlue 
          ? { 
              ...prev.bluePerformer, 
              isTimerRunning: true, 
              isTimer2Running: true, 
              isPerformerFinished: false, 
              performerTime: null, 
              is3MinFinished: false, 
              isFinished: false 
            } 
          : prev.bluePerformer,
        redPerformer: !isBlue 
          ? { 
              ...prev.redPerformer, 
              isTimerRunning: true, 
              isTimer2Running: true, 
              isPerformerFinished: false, 
              performerTime: null, 
              is3MinFinished: false, 
              isFinished: false 
            } 
          : prev.redPerformer
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Operator action: STOP TIMER
  // Mengunci Timer 1 (Waktu Penampil), sementara Timer 2 TETAP BERJALAN ke 03:00 jika belum 3 menit!
  const handleStopTimer = () => {
    try {
      if (!audioMuted) soundEffects.playWhistle();
    } catch {}

    const finalPerformerTime = displayPerformerElapsed;
    isPerformerFinishedRef.current = true;
    performerTimeRef.current = finalPerformerTime;
    isTimer1RunningRef.current = false;
    basePerformerElapsedRef.current = finalPerformerTime;

    // Cek apakah Timer 2 sudah mencapai targetDuration
    const curTarget = targetDurationRef.current;
    const isTimer2Done = display3MinElapsed >= curTarget;
    if (isTimer2Done) {
      isTimer2RunningRef.current = false;
      is3MinFinishedRef.current = true;
      timerStartedAtRef.current = null;
    } else {
      // Timer 2 BELUM mencapai target: TETAP BERJALAN!
      isTimer2RunningRef.current = true;
    }

    const timePenalty = calculateTimePenalty(finalPerformerTime, curTarget);

    onUpdateStateRef.current((prev) => {
      const isBlue = prev.activeCorner === "BLUE";
      const currentRemaining = Math.max(0, Number((curTarget - finalPerformerTime).toFixed(1)));
      const allDone = isTimer2Done;

      const updatedBlue = isBlue
        ? {
            ...prev.bluePerformer,
            isFinished: allDone,
            isTimerRunning: false,
            isTimer2Running: !isTimer2Done,
            isPerformerFinished: true,
            performerTime: finalPerformerTime,
            timerElapsed: finalPerformerTime,
            timerRemaining: currentRemaining,
            timer3MinElapsed: display3MinElapsed,
            is3MinFinished: isTimer2Done,
            dewanPenalties: {
              ...prev.bluePerformer.dewanPenalties,
              penaltiWaktuOtomatis: timePenalty
            }
          }
        : prev.bluePerformer;

      const updatedRed = !isBlue
        ? {
            ...prev.redPerformer,
            isFinished: allDone,
            isTimerRunning: false,
            isTimer2Running: !isTimer2Done,
            isPerformerFinished: true,
            performerTime: finalPerformerTime,
            timerElapsed: finalPerformerTime,
            timerRemaining: currentRemaining,
            timer3MinElapsed: display3MinElapsed,
            is3MinFinished: isTimer2Done,
            dewanPenalties: {
              ...prev.redPerformer.dewanPenalties,
              penaltiWaktuOtomatis: timePenalty
            }
          }
        : prev.redPerformer;

      const next: TgrsMatchState = {
        ...prev,
        isFinished: allDone,
        isTimerRunning: false,
        isTimer2Running: !isTimer2Done,
        isPerformerFinished: true,
        performerTime: finalPerformerTime,
        timerStartedAt: isTimer2Done ? null : prev.timerStartedAt,
        timerElapsed: finalPerformerTime,
        timerRemaining: currentRemaining,
        timer3MinElapsed: display3MinElapsed,
        is3MinFinished: isTimer2Done,
        bluePerformer: updatedBlue,
        redPerformer: updatedRed
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Operator action: Hentikan Timer 2 secara manual jika diinginkan
  const handleStopTimer2Manually = () => {
    try {
      if (!audioMuted) sound.playGong();
    } catch {}

    const curTarget = targetDurationRef.current;
    isTimer2RunningRef.current = false;
    is3MinFinishedRef.current = true;
    timerStartedAtRef.current = null;
    setDisplay3MinElapsed(curTarget);

    onUpdateStateRef.current((prev) => {
      const isBlue = prev.activeCorner === "BLUE";
      const updatedBlue = isBlue
        ? { ...prev.bluePerformer, isTimer2Running: false, is3MinFinished: true, timer3MinElapsed: curTarget, isFinished: true }
        : prev.bluePerformer;
      const updatedRed = !isBlue
        ? { ...prev.redPerformer, isTimer2Running: false, is3MinFinished: true, timer3MinElapsed: curTarget, isFinished: true }
        : prev.redPerformer;

      const next: TgrsMatchState = {
        ...prev,
        isTimer2Running: false,
        is3MinFinished: true,
        timer3MinElapsed: DURASI_STANDAR_TGRS_DETIK,
        isFinished: true,
        timerStartedAt: null,
        bluePerformer: updatedBlue,
        redPerformer: updatedRed
      };
      saveTgrsLiveState(next);
      return next;
    });
  };

  // Operator action: RESET TIMER (Kembali ke 00:00 & 00:00 untuk kedua timer)
  const handleResetTimer = () => {
    try {
      if (!audioMuted) soundEffects.playClick();
    } catch {}

    warned250Ref.current = false;
    warned300Ref.current = false;
    warned305Ref.current = false;

    isTimer1RunningRef.current = false;
    isTimer2RunningRef.current = false;
    isPerformerFinishedRef.current = false;
    is3MinFinishedRef.current = false;
    performerTimeRef.current = null;
    timerStartedAtRef.current = null;
    basePerformerElapsedRef.current = 0;
    setDisplayPerformerElapsed(0);
    setDisplay3MinElapsed(0);

    const curTarget = targetDurationRef.current;
    onUpdateStateRef.current((prev) => {
      const isBlue = prev.activeCorner === "BLUE";
      const next: TgrsMatchState = {
        ...prev,
        timerElapsed: 0,
        timer3MinElapsed: 0,
        timerRemaining: curTarget,
        isTimerRunning: false,
        isTimer2Running: false,
        isPerformerFinished: false,
        performerTime: null,
        is3MinFinished: false,
        isFinished: false,
        timerStartedAt: null,
        bluePerformer: isBlue
          ? { 
              ...prev.bluePerformer, 
              timerElapsed: 0, 
              timer3MinElapsed: 0,
              timerRemaining: curTarget, 
              isTimerRunning: false, 
              isTimer2Running: false,
              isPerformerFinished: false,
              performerTime: null,
              is3MinFinished: false,
              isFinished: false 
            }
          : prev.bluePerformer,
        redPerformer: !isBlue
          ? { 
              ...prev.redPerformer, 
              timerElapsed: 0, 
              timer3MinElapsed: 0,
              timerRemaining: curTarget, 
              isTimerRunning: false, 
              isTimer2Running: false,
              isPerformerFinished: false,
              performerTime: null,
              is3MinFinished: false,
              isFinished: false 
            }
          : prev.redPerformer
      };
      saveTgrsLiveState(next);
      return next;
    });
    setShowResetConfirm(false);
  };

  // Operator action: RESET PERTANDINGAN (Reset total ke posisi standby untuk penampil selanjutnya)
  const handleResetMatchToStandby = () => {
    try {
      if (!audioMuted) {
        soundEffects.playWhistle();
      }
    } catch {}

    // 1. Reset timer internal refs & audio alerts
    warned250Ref.current = false;
    warned300Ref.current = false;
    warned305Ref.current = false;

    isTimer1RunningRef.current = false;
    isTimer2RunningRef.current = false;
    isPerformerFinishedRef.current = false;
    is3MinFinishedRef.current = false;
    performerTimeRef.current = null;
    timerStartedAtRef.current = null;
    basePerformerElapsedRef.current = 0;
    setDisplayPerformerElapsed(0);
    setDisplay3MinElapsed(0);

    // 2. Reset match state to initial standby via resetTgrsMatchToStandby helper
    onUpdateStateRef.current((prev) => {
      const next = resetTgrsMatchToStandby(prev);
      saveTgrsLiveState(next);
      return next;
    });

    setShowMatchResetModal(false);
    setResetSuccessToast(
      "Pertandingan berhasil direset! Seluruh panel (Dewan, Juri 1-5, Monitor, Timer) kembali ke posisi standby & siap penilaian."
    );
    setTimeout(() => {
      setResetSuccessToast(null);
    }, 4500);
  };

  // Calculations for dual timer display
  const targetDuration = state.targetDuration || DURASI_STANDAR_TGRS_DETIK; // e.g. 90s (01:30), 110s (01:50), 180s (03:00)
  const minTolerance = Math.max(0, targetDuration - TOLERANSI_WAKTU_DETIK);
  const maxTolerance = targetDuration + TOLERANSI_WAKTU_DETIK;
  const elapsed = displayPerformerElapsed;

  // 1. TIMER WAKTU PENAMPIL: Berjalan maju dari 00:00 tanpa batas sampai STOP ditekan
  const performerTimeSeconds = displayPerformerElapsed;
  const formattedPerformerTime = precisionMode ? formatTimePrecision(performerTimeSeconds) : formatTimeMMSS(performerTimeSeconds);

  // 2. TIMER TARGET: Berjalan maju dari 00:00 sampai targetDuration lalu berhenti
  const timer3MinSeconds = display3MinElapsed;
  const formatted3MinTime = precisionMode ? formatTimePrecision(timer3MinSeconds) : formatTimeMMSS(timer3MinSeconds);
  const is3MinLimitReached = timer3MinSeconds >= targetDuration;

  // Status toleransi & kelebihan waktu untuk Penampil
  const isSafeZone = performerTimeSeconds >= minTolerance && performerTimeSeconds <= maxTolerance;
  const isOvertime = performerTimeSeconds > maxTolerance;
  const progressPercent = Math.min(100, (timer3MinSeconds / targetDuration) * 100);

  // Overtime beyond 03:00 (jika atlet belum selesai saat 03:00)
  const overtimeSeconds = Math.max(0, performerTimeSeconds - targetDuration);
  const formattedOvertime = formatTimeMMSS(overtimeSeconds);

  const activeCorner = state.activeCorner || "BLUE";
  const activeAthleteName = activeCorner === "BLUE"
    ? (state.bluePerformer?.athleteName || state.athleteName || "PESILAT BIRU")
    : (state.redPerformer?.athleteName || "PESILAT MERAH");
  const activeContingent = activeCorner === "BLUE"
    ? (state.bluePerformer?.contingent || state.contingent || "KONTINGEN BIRU")
    : (state.redPerformer?.contingent || "KONTINGEN MERAH");
  const isCornerFinished = Boolean(
    activeCorner === "BLUE" ? state.bluePerformer?.isFinished : state.redPerformer?.isFinished
  );

  return (
    <div className="h-[100dvh] w-full max-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#030716] text-slate-100 p-2 sm:p-3 select-none gap-2">
      {/* 1. TOP HEADER & METADATA BAR (COMPACT & RESPONSIVE) */}
      <header className="shrink-0 p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-[#091535] via-[#0b1c48] to-[#091535] border border-cyan-500/40 shadow-md flex items-center justify-between gap-2">
        {/* Left: Branding & Match Info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-bold hidden sm:inline">MENU</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-slate-200 truncate">
              <span className="text-amber-400 font-black uppercase text-sm sm:text-base truncate">{state.categoryLabel || "SENI TUNGGAL"}</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-bold">GELANGGANG {state.gelanggang}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">PARTAI {state.partai}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol Reset Pertandingan (Siap Penampil Selanjutnya) */}
          <button
            onClick={() => setShowMatchResetModal(true)}
            disabled={state.isTimerRunning}
            className="px-2 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 text-rose-300 hover:text-white text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
            title="Reset seluruh panel pertandingan (Dewan, Juri, Monitor, Timer) ke posisi standby untuk penampil selanjutnya"
          >
            <RefreshCw className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Reset Pertandingan</span>
          </button>

          {onSwitchToTanding && (
            <button
              onClick={onSwitchToTanding}
              className="px-2 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-blue-200 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Beralih ke Timer Pertandingan Kategori Tanding"
            >
              <Shuffle className="w-3 h-3 text-cyan-300" />
              <span className="hidden md:inline">Timer Tanding</span>
            </button>
          )}

          {/* Precision toggle */}
          <button
            onClick={() => setPrecisionMode(!precisionMode)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
              precisionMode
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Ubah Presisi Waktu"
          >
            {precisionMode ? ".0s" : "00s"}
          </button>

          {/* Mute Audio */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              audioMuted
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title={audioMuted ? "Suara Bel Nonaktif" : "Suara Bel Aktif"}
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          )}

          {/* Real-time sync badge */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#020617] border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>TERKONEKSI</span>
          </div>
        </div>
      </header>

      {/* 2. INFORMASI SUDUT PENAMPIL */}
      <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-[#07112c] border border-cyan-500/30 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center min-w-0">
          <div className="truncate">
            <span className="text-xs sm:text-sm font-black text-white uppercase truncate block">
              <strong className={activeCorner === "BLUE" ? "text-cyan-300" : "text-rose-400"}>
                SUDUT {activeCorner === "BLUE" ? "BIRU" : "MERAH"}
              </strong> &bull; {activeAthleteName} ({activeContingent})
            </span>
          </div>
        </div>

        {(state.isTimerRunning || state.isFinished) && (
          <div className="shrink-0 text-right font-mono">
            <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase inline-block ${
              state.isTimerRunning
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}>
              {state.isTimerRunning ? "⏱️ BERJALAN" : "✓ SELESAI"}
            </span>
          </div>
        )}
      </div>

      {/* 3. DUAL TIMER DISPLAY (KEDUA TIMER BERJALAN MAJU DARI 00:00 - FITS VIEWPORT) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
        
        {/* TIMER 1: WAKTU PENAMPIL (DARI 00:00 KE WAKTU AKTUAL SAAT STOP DITEKAN) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 rounded-2xl bg-gradient-to-br from-[#071333] via-[#03091e] to-[#071333] border-2 border-cyan-400/70 shadow-lg text-center overflow-hidden">
          {/* Card Top */}
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30 shrink-0">
            <span className="text-[9.5px] sm:text-xs font-mono font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${state.isTimerRunning ? "bg-cyan-400 animate-ping" : "bg-cyan-500"}`} />
              TIMER 1: WAKTU PENAMPIL
            </span>
            <span className={`px-2 py-0.2 rounded font-mono text-[8.5px] sm:text-[9px] font-black uppercase ${
              state.isTimerRunning
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 animate-pulse"
                : state.isFinished
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              {state.isTimerRunning ? "⏱️ JALAN" : state.isFinished ? "⏹️ TERKUNCI (STOP)" : "⏸️ 00:00"}
            </span>
          </div>

          {/* Giant Digits (Scaled Responsively to Viewport) */}
          <div className="flex-1 flex flex-col items-center justify-center my-1 sm:my-2 min-h-0">
            <span className="text-[8.5px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">
              DURASI AKTUAL PENAMPIL
            </span>
            <div className={`text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-mono font-black tabular-nums tracking-tight leading-none ${
              isOvertime
                ? "text-rose-400 animate-pulse drop-shadow-[0_0_25px_rgba(244,63,94,0.7)]"
                : isSafeZone
                  ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                  : "text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]"
            }`}>
              {formattedPerformerTime}
            </div>

            {/* Toleransi & Overtime Badge */}
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10.5px] font-mono">
              <span className={`px-2.5 py-0.5 rounded-lg border font-bold ${
                isSafeZone
                  ? "bg-emerald-950/80 border-emerald-400 text-emerald-300"
                  : isOvertime
                    ? "bg-rose-950/80 border-rose-400 text-rose-300 animate-pulse"
                    : "bg-slate-900 border-slate-700 text-slate-300"
              }`}>
                {isSafeZone ? "✓ AMAN (TOLERANSI)" : isOvertime ? `⚠️ MELEBIHI ${formatTimeMMSS(maxTolerance)}` : "⏳ PERAGAAN"}
              </span>
              <span className="text-slate-400 font-mono hidden min-[480px]:inline">
                Toleransi: <strong className="text-emerald-400">{formatTimeMMSS(minTolerance)} - {formatTimeMMSS(maxTolerance)}</strong>
              </span>
            </div>
          </div>

          {/* Card Bottom: Summary Note */}
          <div className="pt-1.5 border-t border-cyan-900/40 text-center text-[9px] sm:text-[10px] font-mono text-slate-400 shrink-0">
            Durasi resmi penampil tercatat saat tombol <strong>STOP</strong> ditekan
          </div>
        </div>

        {/* TIMER 2: TIMER BATAS WAKTU (BERJALAN DARI 00:00 S/D TARGET LALU BERHENTI) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 rounded-2xl bg-gradient-to-br from-[#120a28] via-[#090317] to-[#120a28] border-2 border-amber-400/80 shadow-lg text-center overflow-hidden">
          {/* Card Top */}
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30 shrink-0">
            <span className="text-[9.5px] sm:text-xs font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${is3MinLimitReached ? "bg-rose-500" : "bg-amber-400 animate-pulse"}`} />
              TIMER 2: TIMER BATAS WAKTU ({formatTimeMMSS(targetDuration)})
            </span>
            <span className={`px-2 py-0.2 rounded font-mono text-[8.5px] sm:text-[9px] font-black uppercase ${
              is3MinLimitReached
                ? "bg-rose-500/20 text-rose-300 border border-rose-400/60"
                : "bg-amber-500/20 text-amber-300 border border-amber-400/50"
            }`}>
              {is3MinLimitReached ? `⏹️ ${formatTimeMMSS(targetDuration)} (STOP)` : `BATAS ${formatTimeMMSS(targetDuration)}`}
            </span>
          </div>

          {/* Giant Digits */}
          <div className="flex-1 flex flex-col items-center justify-center my-1 sm:my-2 min-h-0">
            <span className="text-[8.5px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">
              BATAS WAKTU (BERHENTI DI {formatTimeMMSS(targetDuration)})
            </span>
            <div className={`text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-mono font-black tabular-nums tracking-tight leading-none ${
              is3MinLimitReached
                ? "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                : timer3MinSeconds >= (targetDuration - 10)
                  ? "text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                  : "text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            }`}>
              {formatted3MinTime}
            </div>

            {/* Overtime or Progress Status */}
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10.5px] font-mono">
              {performerTimeSeconds > targetDuration ? (
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-300 font-bold animate-pulse">
                  LEBIH WAKTU: +{formattedOvertime}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-bold">
                  {Math.round(progressPercent)}% / {formatTimeMMSS(targetDuration)}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-1.5 border-t border-amber-900/40 space-y-1 shrink-0">
            <div className="flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono text-slate-400">
              <span>00:00</span>
              <span className="text-emerald-400 font-bold">{formatTimeMMSS(minTolerance)}</span>
              <span className="text-amber-300 font-bold">{formatTimeMMSS(targetDuration)}</span>
              <span className="text-rose-400 font-bold">{formatTimeMMSS(maxTolerance)}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  is3MinLimitReached
                    ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                    : isSafeZone
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#34d399]"
                      : "bg-gradient-to-r from-cyan-500 to-amber-400 shadow-[0_0_8px_#f59e0b]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 4. MAIN ACTION CONTROLS: HANYA BERTUGAS MEMULAI (START) & MENGHENTIKAN (STOP) TIMER */}
      <div className="shrink-0 bg-[#060e26] border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 shadow-lg space-y-1.5">
        
        {/* ROW 1: TOMBOL UTAMA START / STOP, STATUS TIMER 2, RESET WAKTU & RESET PERTANDINGAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-3xl mx-auto w-full">
          {/* Start / Stop / Status Button */}
          {state.isTimerRunning ? (
            <button
              onClick={handleStopTimer}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.6)] border border-rose-400 animate-pulse"
              title="Hentikan penampilan atlet (Kunci Waktu Penampil & hitung penalti otomatis)"
            >
              <Square className="w-4 h-4 fill-white shrink-0" />
              <span>HENTIKAN PENAMPIL (STOP)</span>
            </button>
          ) : isTimer2RunningRef.current && !is3MinFinishedRef.current && state.isPerformerFinished ? (
            <div className="flex flex-col gap-1">
              <div className="py-1.5 px-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-center shadow-md">
                <span className="text-[9px] font-mono text-cyan-300 font-black uppercase block">
                  ✓ PENAMPIL: {formattedPerformerTime} (TERKUNCI)
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold block animate-pulse">
                  ⏳ TIMER 2 JALAN: {formatted3MinTime} / 03:00
                </span>
              </div>
              <button
                onClick={handleStopTimer2Manually}
                className="py-1 px-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Hentikan Timer 2 sekarang tanpa menunggu 03:00"
              >
                <Square className="w-3 h-3 text-amber-400" />
                <span>HENTIKAN TIMER 2 (03:00)</span>
              </button>
            </div>
          ) : isCornerFinished ? (
            <div 
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-inner"
              title="Sudut ini telah selesai tampil. Hanya dapat cek nilai di panel dewan."
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PENAMPILAN SELESAI (NILAI TERKUNCI)</span>
            </div>
          ) : (
            <button
              onClick={handleStartTimer}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400"
              title="Mulai Timer 1 & Timer 2 serentak dari 00:00"
            >
              <Play className="w-4 h-4 fill-white shrink-0" />
              <span>MULAI (START)</span>
            </button>
          )}

          {/* Reset Timer Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={state.isTimerRunning}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 hover:border-slate-500 text-slate-200 font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Reset kedua timer kembali ke 00:00"
          >
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            <span>RESET TIMER (00:00)</span>
          </button>

          {/* Reset Pertandingan (Semua Panel Standby) Button */}
          <button
            onClick={() => setShowMatchResetModal(true)}
            disabled={state.isTimerRunning}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-rose-950/80 via-red-950/80 to-amber-950/80 hover:from-rose-900 hover:to-amber-900 disabled:opacity-40 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
            title="Reset seluruh panel (Dewan, Juri, Monitor, Timer) ke posisi standby siap penampil selanjutnya"
          >
            <RefreshCw className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">RESET PERTANDINGAN</span>
          </button>
        </div>

        {/* ROW 2: PILIHAN WAKTU PENAMPIL (MENGGANTIKAN SUARA MANUAL) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5 border-t border-slate-800/80 text-[10px] sm:text-xs font-mono">
          <span className="text-cyan-300 font-black uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            Pilihan Timer :
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { label: "01:30s", seconds: 90 },
              { label: "01:50s", seconds: 110 },
              { label: "03:00s", seconds: 180 },
            ].map((opt, idx) => {
              const currentTarget = state.targetDuration || DURASI_STANDAR_TGRS_DETIK;
              const isSelected = currentTarget === opt.seconds;
              return (
                <React.Fragment key={opt.seconds}>
                  {idx > 0 && <span className="text-slate-500 font-bold">-</span>}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      const nextDuration = opt.seconds;
                      targetDurationRef.current = nextDuration;
                      onUpdateState((prev) => {
                        const next: TgrsMatchState = {
                          ...prev,
                          targetDuration: nextDuration,
                          timerRemaining: Math.max(0, nextDuration - (prev.timerElapsed || 0)),
                          bluePerformer: prev.bluePerformer ? {
                            ...prev.bluePerformer,
                            targetDuration: nextDuration,
                            timerRemaining: Math.max(0, nextDuration - (prev.bluePerformer.timerElapsed || 0))
                          } : prev.bluePerformer,
                          redPerformer: prev.redPerformer ? {
                            ...prev.redPerformer,
                            targetDuration: nextDuration,
                            timerRemaining: Math.max(0, nextDuration - (prev.redPerformer.timerElapsed || 0))
                          } : prev.redPerformer
                        };
                        saveTgrsLiveState(next);
                        try {
                          localStorage.setItem("jrz_tgrs_target_duration", String(nextDuration));
                          window.dispatchEvent(new CustomEvent("jrz_tgrs_target_duration_changed", { detail: nextDuration }));
                        } catch {}
                        return next;
                      });
                    }}
                    className={`px-3 py-1 rounded-lg font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-amber-300 scale-105 ring-1 ring-amber-400"
                        : "bg-[#040a1d] hover:bg-[#0a1842] text-slate-300 border border-slate-700/80 hover:border-cyan-400/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. MODAL KONFIRMASI RESET TIMER SAJA */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b1329] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 mx-auto">
              <RotateCcw className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Reset Timer Jurus?
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Kedua timer akan dikembalikan ke <strong>00:00</strong> untuk Sudut {activeCorner === "BLUE" ? "Biru" : "Merah"}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleResetTimer}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
              >
                Ya, Reset 00:00
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI RESET PERTANDINGAN (SIAP PENAMPIL SELANJUTNYA) */}
      {showMatchResetModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b1329] border-2 border-rose-500/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-[0_0_50px_rgba(244,63,94,0.4)] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-300 mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6 text-rose-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Reset Pertandingan Jurus?
              </h3>
              <p className="text-xs text-rose-300/90 font-mono font-bold">
                Standby & Siap Penilaian untuk Penampil Selanjutnya
              </p>
            </div>

            {/* Checklist detail reset seluruh panel */}
            <div className="bg-[#050c1f] border border-slate-700/80 rounded-xl p-3 text-left space-y-2 text-[11px] font-mono text-slate-300">
              <div className="text-amber-400 font-bold uppercase text-[10px] tracking-wide border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>Sinkronisasi Semua Panel:</span>
                <span className="text-emerald-400 font-bold">POSISI STANDBY (0)</span>
              </div>
              <ul className="space-y-1.5 text-[10.5px]">
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Timer:</strong> Dihentikan & direset ke <strong>00:00</strong> (Waktu Penampil & Timer 3M).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Panel Juri (1-5):</strong> Seluruh input kesalahan direset ke 0, skor awal baku, status batal kirim.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Panel Dewan:</strong> Hukuman senjata jatuh, keluar gelanggang, atribut, dan penalti waktu direset ke 0.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Monitor className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Monitor Arena:</strong> Skor akhir, rerata, timer, dan status pemenang direset ke Standby.</span>
                </li>
              </ul>
              <div className="text-[9.5px] text-slate-400 pt-1 border-t border-slate-800 italic">
                * Identitas atlet, kategori ({state.categoryLabel || state.category}), dan gelanggang tetap dipertahankan.
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowMatchResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleResetMatchToStandby}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 border border-rose-400 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ya, Reset Semua Panel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TOAST NOTIFIKASI BERHASIL RESET */}
      {resetSuccessToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-[#061e14] border-2 border-emerald-400 text-emerald-200 px-4 py-3 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.5)] flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-sans font-bold leading-tight">
            {resetSuccessToast}
          </div>
        </div>
      )}
    </div>
  );
};

export default TgrsTimerOperator;
