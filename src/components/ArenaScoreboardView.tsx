import React from 'react';
import { CornerState, MatchSettings, MatchDecision } from '../types/silat';
import { calculateTotalScore, formatTime } from '../utils/rules';
import { Minimize2, Maximize2, ArrowLeft, Coffee } from 'lucide-react';

interface ArenaScoreboardViewProps {
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  redState: CornerState;
  blueState: CornerState;
  settings: MatchSettings;
  currentRound: number;
  timeRemainingSeconds: number;
  isBreak: boolean;
  breakTimeRemainingSeconds: number;
  isRunning: boolean;
  decision: MatchDecision | null;
}

export const ArenaScoreboardView: React.FC<ArenaScoreboardViewProps> = ({
  onClose,
  isFullscreen,
  onToggleFullscreen,
  redState,
  blueState,
  settings,
  currentRound,
  timeRemainingSeconds,
  isBreak,
  breakTimeRemainingSeconds,
  isRunning,
  decision,
}) => {
  const redScore = calculateTotalScore(redState);
  const blueScore = calculateTotalScore(blueState);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Banner: Arena, Match number, Category, Exit Arena View */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Kembali (Esc)"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm tracking-wider">
            IPSI
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
              {settings.arena} · {settings.matchNumber}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-500 uppercase">
              {settings.category} {settings.gender} · {settings.weightClass}
            </p>
          </div>
        </div>

        {/* Top-Right Action Buttons: Fullscreen and Kembali (Only Icons) */}
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Kembali ke Mode Kontrol Operator (Esc)"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Stage: Red Corner vs Timer vs Blue Corner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 my-4">
        {/* Sudut Merah Display (5 cols) */}
        <div className="lg:col-span-5 h-full rounded-3xl border-4 border-red-600 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-red-600" />
              <span className="text-sm font-black uppercase text-red-600 tracking-wider">
                SUDUT MERAH
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 leading-tight">
              {redState.name}
            </h2>
            <div className="text-lg sm:text-xl font-bold text-neutral-600 mt-1 uppercase">
              {redState.contingent}
            </div>
          </div>

          {/* Huge Score */}
          <div className="my-6 text-center">
            <div
              className={`font-mono text-8xl sm:text-9xl lg:text-[140px] font-black text-red-600 leading-none tabular-nums tracking-tighter ${
                redState.isDisqualified ? 'line-through opacity-50' : ''
              }`}
            >
              {redState.isDisqualified ? 'DISQ' : redScore}
            </div>
          </div>

          {/* Round breakdown & penalties */}
          <div className="pt-4 border-t-2 border-neutral-100 flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex gap-4">
              <span>B1: <strong className="font-mono">{redState.roundScores[0]}</strong></span>
              <span>B2: <strong className="font-mono">{redState.roundScores[1]}</strong></span>
              <span>B3: <strong className="font-mono">{redState.roundScores[2]}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {redState.teguranCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                  T:{redState.teguranCount}
                </span>
              )}
              {redState.peringatanCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                  P:{redState.peringatanCount}
                </span>
              )}
              <span className="text-neutral-500 font-medium">VAR: {redState.varCards}</span>
            </div>
          </div>
        </div>

        {/* Center Timer (2 cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-4">
          {/* Round Pill */}
          <div className="mb-3 px-4 py-1.5 rounded-full bg-neutral-900 text-white font-black text-sm uppercase tracking-widest">
            {isBreak ? `ISTIRAHAT` : `BABAK ${currentRound}`}
          </div>

          {/* Large Digital Clock */}
          <div
            className={`font-mono text-6xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tight ${
              isBreak
                ? 'text-amber-600'
                : timeRemainingSeconds <= 10 && timeRemainingSeconds > 0
                ? 'text-red-600 animate-pulse'
                : 'text-neutral-900'
            }`}
          >
            {isBreak ? formatTime(breakTimeRemainingSeconds) : formatTime(timeRemainingSeconds)}
          </div>

          {/* Status Label */}
          <div className="mt-3">
            {isBreak ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                <Coffee className="w-3.5 h-3.5" />
                Istirahat Babak
              </span>
            ) : isRunning ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Live Pertandingan
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
                Waktu Henti
              </span>
            )}
          </div>

          {decision && (
            <div className="mt-4 p-2 rounded-xl bg-neutral-900 text-white text-xs font-bold">
              PEMENANG:{' '}
              <span className={decision.winner === 'red' ? 'text-red-400' : 'text-blue-400'}>
                {decision.winner === 'red' ? 'SUDUT MERAH' : 'SUDUT BIRU'}
              </span>
            </div>
          )}
        </div>

        {/* Sudut Biru Display (5 cols) */}
        <div className="lg:col-span-5 h-full rounded-3xl border-4 border-blue-600 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-blue-600" />
              <span className="text-sm font-black uppercase text-blue-600 tracking-wider">
                SUDUT BIRU
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 leading-tight">
              {blueState.name}
            </h2>
            <div className="text-lg sm:text-xl font-bold text-neutral-600 mt-1 uppercase">
              {blueState.contingent}
            </div>
          </div>

          {/* Huge Score */}
          <div className="my-6 text-center">
            <div
              className={`font-mono text-8xl sm:text-9xl lg:text-[140px] font-black text-blue-600 leading-none tabular-nums tracking-tighter ${
                blueState.isDisqualified ? 'line-through opacity-50' : ''
              }`}
            >
              {blueState.isDisqualified ? 'DISQ' : blueScore}
            </div>
          </div>

          {/* Round breakdown & penalties */}
          <div className="pt-4 border-t-2 border-neutral-100 flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex gap-4">
              <span>B1: <strong className="font-mono">{blueState.roundScores[0]}</strong></span>
              <span>B2: <strong className="font-mono">{blueState.roundScores[1]}</strong></span>
              <span>B3: <strong className="font-mono">{blueState.roundScores[2]}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {blueState.teguranCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                  T:{blueState.teguranCount}
                </span>
              )}
              {blueState.peringatanCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                  P:{blueState.peringatanCount}
                </span>
              )}
              <span className="text-neutral-500 font-medium">VAR: {blueState.varCards}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="border-t-2 border-neutral-200 pt-3 flex items-center justify-between text-xs text-neutral-500 font-semibold">
        <span>Sistem Digital Skoring Resmi PB IPSI & PERSILAT</span>
        <span>Wasit: {settings.refereeName} · Ketua: {settings.juryPresidentName}</span>
      </div>
    </div>
  );
};
