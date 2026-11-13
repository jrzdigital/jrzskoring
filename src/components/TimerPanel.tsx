import React, { useEffect, useState, useRef } from 'react';
import { TournamentState } from '../types';
import { syncBus } from '../utils/syncBus';
import { formatDuration } from '../utils/rules';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Activity,
  HeartPulse,
  Volume2,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface TimerPanelProps {
  state: TournamentState;
  onSelectRole?: (role: any) => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({ state }) => {
  const activeMatch = state.matches.find((m) => m.id === state.currentMatchId) || state.matches[0];
  const [fallCount, setFallCount] = useState<number | null>(null);
  const [medicalTimeSeconds, setMedicalTimeSeconds] = useState<number | null>(null);

  const fallIntervalRef = useRef<any>(null);
  const medicalIntervalRef = useRef<any>(null);

  // Main countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (activeMatch?.timerIsRunning && activeMatch.timeRemainingSeconds > 0) {
      interval = setInterval(() => {
        syncBus.updateState((prev) => {
          const currentM = prev.matches.find((m) => m.id === prev.currentMatchId);
          if (!currentM || !currentM.timerIsRunning) return prev;

          const nextTime = Math.max(0, currentM.timeRemainingSeconds - 1);
          const isFinished = nextTime === 0;

          const updatedMatches = prev.matches.map((m) => {
            if (m.id === currentM.id) {
              return {
                ...m,
                timeRemainingSeconds: nextTime,
                seniDurationSeconds: (m.seniDurationSeconds || 0) + 1,
                timerIsRunning: !isFinished,
              };
            }
            return m;
          });

          return { ...prev, matches: updatedMatches };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMatch?.timerIsRunning, activeMatch?.timeRemainingSeconds]);

  // When timer hits 0: Play Gong automatically
  useEffect(() => {
    if (activeMatch && activeMatch.timeRemainingSeconds === 0 && !activeMatch.timerIsRunning) {
      syncBus.playSound('gong');
    }
  }, [activeMatch?.timeRemainingSeconds]);

  const handleToggleTimer = () => {
    if (!activeMatch) return;
    const nextRunning = !activeMatch.timerIsRunning;

    syncBus.updateState(
      (prev) => {
        const updatedMatches = prev.matches.map((m) => {
          if (m.id === activeMatch.id) {
            return {
              ...m,
              timerIsRunning: nextRunning,
              status: nextRunning ? ('ongoing' as const) : ('paused' as const),
            };
          }
          return m;
        });
        return { ...prev, matches: updatedMatches };
      },
      nextRunning ? 'gong' : 'buzzer'
    );

    syncBus.addNotification(
      nextRunning ? 'Waktu Dimulai (GONG)' : 'Waktu Dijeda (PAUSE)',
      `Operator waktu ${nextRunning ? 'memulai' : 'menjeda'} pertandingan partai ${activeMatch.partaiNumber}`,
      'timer'
    );
  };

  const handleResetTimer = () => {
    if (!activeMatch) return;
    const defaultSec = activeMatch.roundDurationSeconds || (activeMatch.category === 'tanding' ? 120 : 180);

    syncBus.updateState((prev) => {
      const updatedMatches = prev.matches.map((m) => {
        if (m.id === activeMatch.id) {
          return {
            ...m,
            timeRemainingSeconds: defaultSec,
            seniDurationSeconds: 0,
            timerIsRunning: false,
            status: 'paused' as const,
          };
        }
        return m;
      });
      return { ...prev, matches: updatedMatches };
    });
  };

  const handleNextRound = () => {
    if (!activeMatch) return;
    const nextRound = Math.min(activeMatch.maxRounds, activeMatch.currentRound + 1);
    const defaultSec = activeMatch.roundDurationSeconds || 120;

    syncBus.updateState(
      (prev) => {
        const updatedMatches = prev.matches.map((m) => {
          if (m.id === activeMatch.id) {
            return {
              ...m,
              currentRound: nextRound,
              timeRemainingSeconds: defaultSec,
              timerIsRunning: false,
              status: 'paused' as const,
            };
          }
          return m;
        });
        return { ...prev, matches: updatedMatches };
      },
      'gong'
    );

    syncBus.addNotification(
      `Memulai Babak ${nextRound}`,
      `Pertandingan beralih ke Babak ${nextRound} dari ${activeMatch.maxRounds}`,
      'announcement'
    );
  };

  // Start Wasit fall countdown 10 seconds
  const handleStartFallCount = () => {
    if (fallIntervalRef.current) clearInterval(fallIntervalRef.current);
    setFallCount(1);
    syncBus.playSound('buzzer');

    fallIntervalRef.current = setInterval(() => {
      setFallCount((prev) => {
        if (prev === null) return null;
        if (prev >= 10) {
          clearInterval(fallIntervalRef.current);
          syncBus.playSound('gong');
          return 10;
        }
        syncBus.playSound('buzzer');
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopFallCount = () => {
    if (fallIntervalRef.current) clearInterval(fallIntervalRef.current);
    setFallCount(null);
  };

  // Medical timeout
  const handleStartMedicalTimeout = () => {
    if (medicalIntervalRef.current) clearInterval(medicalIntervalRef.current);
    setMedicalTimeSeconds(60); // 1 minute
    medicalIntervalRef.current = setInterval(() => {
      setMedicalTimeSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(medicalIntervalRef.current);
          syncBus.playSound('buzzer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopMedical = () => {
    if (medicalIntervalRef.current) clearInterval(medicalIntervalRef.current);
    setMedicalTimeSeconds(null);
  };

  if (!activeMatch) return null;

  // Toleransi seni 3 menit (180 detik)
  const isSeni = activeMatch.category !== 'tanding';
  const elapsedSeni = activeMatch.seniDurationSeconds || 0;
  const seniToleranceStatus =
    elapsedSeni >= 175 && elapsedSeni <= 185
      ? 'Aman (2:55 - 3:05)'
      : elapsedSeni > 185
      ? 'Kelebihan Waktu (Over)'
      : 'Kurang Waktu (Under)';

  return (
    <div className="min-h-screen bg-[#090416] text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="mx-auto max-w-5xl w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <TimerIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">OPERATOR WAKTU & BEL ARENA</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-amber-400 font-bold border border-purple-800/40">
                  {state.gelanggangActive}
                </span>
              </div>
              <p className="text-xs text-purple-300">
                Sinkronisasi waktu presisi real-time dengan seluruh perangkat operasional & layar penonton.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-purple-400 block font-mono">
              Partai #{activeMatch.partaiNumber} · {activeMatch.roundStage}
            </span>
            <span className="text-xs font-bold text-white uppercase">
              {activeMatch.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* GIANT CHRONOMETER DISPLAY */}
        <div className="rounded-3xl border-2 border-purple-700/50 bg-gradient-to-b from-[#180a2f] via-[#110724] to-[#0a0418] p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                activeMatch.timerIsRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Radio className="h-3 w-3" />
              {activeMatch.timerIsRunning ? 'Pertandingan Berjalan' : 'Waktu Berhenti (Paused)'}
            </span>

            {!isSeni && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-200 border border-purple-800/50">
                Babak {activeMatch.currentRound} / {activeMatch.maxRounds}
              </span>
            )}
          </div>

          {/* Huge Tabular Numbers */}
          <div className="font-mono text-7xl sm:text-9xl font-black tracking-tight text-white tabular-nums select-none drop-shadow-2xl">
            {formatDuration(activeMatch.timeRemainingSeconds)}
          </div>

          {/* Seni elapsed time monitor */}
          {isSeni && (
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <span className="text-purple-300">
                Waktu Berjalan: <strong className="text-white font-mono">{formatDuration(elapsedSeni)}</strong>
              </span>
              <span className="text-purple-500">·</span>
              <span
                className={`font-bold ${
                  elapsedSeni >= 175 && elapsedSeni <= 185
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                Status Toleransi: {seniToleranceStatus}
              </span>
            </div>
          )}

          {/* Primary Big Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-4 rounded-2xl text-base sm:text-lg font-black text-white shadow-xl flex items-center gap-2.5 transition active:scale-95 ${
                activeMatch.timerIsRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
              }`}
            >
              {activeMatch.timerIsRunning ? (
                <>
                  <Pause className="h-6 w-6" />
                  JEDA WAKTU (PAUSE)
                </>
              ) : (
                <>
                  <Play className="h-6 w-6" />
                  MULAI WAKTU (START)
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="px-5 py-4 rounded-2xl bg-purple-950/80 border border-purple-800/50 hover:bg-purple-900/60 text-purple-200 font-bold text-sm flex items-center gap-2 transition active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Reset Waktu
            </button>

            {!isSeni && activeMatch.currentRound < activeMatch.maxRounds && (
              <button
                onClick={handleNextRound}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm flex items-center gap-2 transition active:scale-95 shadow-lg"
              >
                Lanjut ke Babak {activeMatch.currentRound + 1}
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tactical Arena Sound & Referee Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bel & Gong Arena */}
          <div className="rounded-2xl border border-purple-800/40 bg-[#130829] p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-amber-400" />
              Suara & Sinyal Arena
            </h3>
            <p className="text-[11px] text-purple-300">
              Bunyikan gong atau bel wasit yang langsung terdengar di semua perangkat penonton & gelanggang.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => syncBus.playSound('gong')}
                className="py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-black text-xs transition"
              >
                BUNYIKAN GONG
              </button>
              <button
                onClick={() => syncBus.playSound('buzzer')}
                className="py-3 rounded-xl bg-purple-900/40 border border-purple-700/40 hover:bg-purple-800/50 text-purple-200 font-bold text-xs transition"
              >
                BEL WASIT
              </button>
            </div>
          </div>

          {/* Hitungan Wasit (Jatuhan 10 Detik) */}
          <div className="rounded-2xl border border-purple-800/40 bg-[#130829] p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-400" />
              Hitungan Jatuhan Wasit (1-10s)
            </h3>
            {fallCount !== null ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/60 border border-rose-800/60">
                <span className="font-mono text-2xl font-black text-rose-400">
                  Hitungan: {fallCount} / 10
                </span>
                <button
                  onClick={handleStopFallCount}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Hentikan
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartFallCount}
                className="w-full py-3 rounded-xl bg-rose-900/60 border border-rose-700/50 hover:bg-rose-800 text-rose-200 font-bold text-xs transition"
              >
                Mulai Hitungan Jatuhan 10 Detik
              </button>
            )}
            <p className="text-[10px] text-purple-300/80">
              Digunakan wasit saat salah satu pesilat tersungkur/cedera di gelanggang.
            </p>
          </div>

          {/* Timeout Medis (Dokter Gelanggang) */}
          <div className="rounded-2xl border border-purple-800/40 bg-[#130829] p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-emerald-400" />
              Waktu Medis Dokter (1 Menit)
            </h3>
            {medicalTimeSeconds !== null ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
                <span className="font-mono text-2xl font-black text-emerald-400">
                  00:{medicalTimeSeconds.toString().padStart(2, '0')}
                </span>
                <button
                  onClick={handleStopMedical}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Tutup Medis
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartMedicalTimeout}
                className="w-full py-3 rounded-xl bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-800 text-emerald-200 font-bold text-xs transition"
              >
                Mulai Waktu Medis (60 Detik)
              </button>
            )}
            <p className="text-[10px] text-purple-300/80">
              Batas waktu perawatan medis resmi dokter pertandingan di gelanggang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
