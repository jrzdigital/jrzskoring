import React, { useEffect, useRef } from 'react';
import { formatTime } from '../utils/rules';
import { playGongSound, playWarningClap, playWhistleSound, playDoubleGong } from '../utils/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Bell, 
  AlertTriangle,
  Coffee,
  CheckCircle2
} from 'lucide-react';

interface MatchTimerProps {
  currentRound: number;
  totalRounds: number;
  timeRemainingSeconds: number;
  setTimeRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  roundDurationSeconds: number;
  breakDurationSeconds: number;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  isBreak: boolean;
  setIsBreak: (isBreak: boolean) => void;
  breakTimeRemainingSeconds: number;
  setBreakTimeRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  onRoundChange: (newRound: number) => void;
  onMatchComplete: () => void;
  audioEnabled: boolean;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({
  currentRound,
  totalRounds,
  timeRemainingSeconds,
  setTimeRemainingSeconds,
  roundDurationSeconds,
  breakDurationSeconds,
  isRunning,
  setIsRunning,
  isBreak,
  setIsBreak,
  breakTimeRemainingSeconds,
  setBreakTimeRemainingSeconds,
  onRoundChange,
  onMatchComplete,
  audioEnabled,
}) => {
  const hasPlayedWarningRef = useRef(false);

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (!isBreak) {
          // Regular Match Round Running
          setTimeRemainingSeconds((prev) => {
            // 10s Warning Clapper
            if (prev === 11 && !hasPlayedWarningRef.current) {
              if (audioEnabled) playWarningClap();
              hasPlayedWarningRef.current = true;
            }

            if (prev <= 1) {
              // Round End
              if (audioEnabled) {
                if (currentRound >= totalRounds) {
                  playDoubleGong();
                } else {
                  playGongSound();
                }
              }
              setIsRunning(false);
              hasPlayedWarningRef.current = false;

              if (currentRound < totalRounds) {
                // Auto trigger break period
                setIsBreak(true);
                setBreakTimeRemainingSeconds(breakDurationSeconds);
                // Auto start break countdown
                setIsRunning(true);
              } else {
                onMatchComplete();
              }
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Break period countdown
          setBreakTimeRemainingSeconds((prevBreak) => {
            if (prevBreak <= 1) {
              // Break finished! Signal fighters back to arena
              if (audioEnabled) playGongSound();
              setIsRunning(false);
              setIsBreak(false);
              // Move to next round
              const nextRound = currentRound + 1;
              onRoundChange(nextRound);
              setTimeRemainingSeconds(roundDurationSeconds);
              hasPlayedWarningRef.current = false;
              return 0;
            }
            return prevBreak - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    isBreak,
    currentRound,
    totalRounds,
    roundDurationSeconds,
    breakDurationSeconds,
    audioEnabled,
    onRoundChange,
    onMatchComplete,
    setIsRunning,
    setIsBreak,
    setTimeRemainingSeconds,
    setBreakTimeRemainingSeconds,
  ]);

  // Handle Play/Pause
  const handleToggleTimer = () => {
    if (!isRunning && !isBreak && timeRemainingSeconds === roundDurationSeconds) {
      // First start of the round
      if (audioEnabled) playGongSound();
    }
    setIsRunning(!isRunning);
  };

  // Wasit "Ti" / Stop whistle and pause
  const handleRefereeTi = () => {
    if (audioEnabled) playWhistleSound();
    setIsRunning(false);
  };

  // Manual Gong trigger
  const handleManualGong = () => {
    if (audioEnabled) playGongSound();
  };

  // Reset current round timer
  const handleResetRound = () => {
    setIsRunning(false);
    setIsBreak(false);
    hasPlayedWarningRef.current = false;
    setTimeRemainingSeconds(roundDurationSeconds);
  };

  // Skip or go to next round
  const handleNextRound = () => {
    setIsRunning(false);
    setIsBreak(false);
    hasPlayedWarningRef.current = false;
    if (currentRound < totalRounds) {
      const nextR = currentRound + 1;
      onRoundChange(nextR);
      setTimeRemainingSeconds(roundDurationSeconds);
      if (audioEnabled) playGongSound();
    } else {
      onMatchComplete();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-col items-center">
      {/* Round & Status Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((r) => (
            <button
              key={r}
              onClick={() => {
                if (!isRunning) {
                  onRoundChange(r);
                  setIsBreak(false);
                  setTimeRemainingSeconds(roundDurationSeconds);
                }
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                currentRound === r && !isBreak
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : currentRound > r
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              Babak {r}
            </button>
          ))}
        </div>

        {/* State Banner */}
        <div className="flex items-center gap-2">
          {isBreak ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold animate-pulse">
              <Coffee className="w-3 h-3 text-amber-700" />
              <span>Istirahat Antar Babak</span>
            </div>
          ) : isRunning ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Waktu Berjalan (Live)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
              <span>Waktu Berhenti (Henti)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Digital Clock Display */}
      <div className="py-2 text-center select-none">
        <div 
          className={`font-mono font-extrabold tracking-tight tabular-nums transition-colors ${
            isBreak 
              ? 'text-amber-600 text-6xl sm:text-7xl' 
              : timeRemainingSeconds <= 10 && timeRemainingSeconds > 0
              ? 'text-red-600 text-7xl sm:text-8xl animate-pulse'
              : 'text-neutral-900 text-7xl sm:text-8xl'
          }`}
        >
          {isBreak ? formatTime(breakTimeRemainingSeconds) : formatTime(timeRemainingSeconds)}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mt-1">
          {isBreak ? `Istirahat Menuju Babak ${currentRound + 1}` : `Waktu Pertandingan Babak ${currentRound}`}
        </p>
      </div>

      {/* Timer Controls */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-neutral-100">
        <button
          onClick={handleToggleTimer}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Jeda (Pause)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{isBreak ? 'Mulai Istirahat' : 'Mulai (Start)'}</span>
            </>
          )}
        </button>

        {/* Wasit "Ti" button (Instant whistle & pause) */}
        <button
          onClick={handleRefereeTi}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors active:scale-95"
          title="Bunyikan Peluit Wasit & Hentikan Waktu Pertandingan"
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Wasit: "TI / HENTI"</span>
        </button>

        {/* Gong manual button */}
        <button
          onClick={handleManualGong}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
          title="Bunyikan Suara Gong Arena"
        >
          <Bell className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">Gong</span>
        </button>

        {/* Reset round button */}
        <button
          onClick={handleResetRound}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
          title="Reset Waktu Babak Saat Ini"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Next round button */}
        <button
          onClick={handleNextRound}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-900 text-white transition-colors"
          title={currentRound < totalRounds ? 'Lanjut ke Babak Berikutnya' : 'Selesaikan Pertandingan'}
        >
          {currentRound < totalRounds ? (
            <>
              <span>Babak {currentRound + 1}</span>
              <SkipForward className="w-4 h-4" />
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Selesai Babak</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
