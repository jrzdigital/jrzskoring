import React from 'react';
import { CornerColor, CornerState } from '../types/silat';
import { calculateTotalScore, calculateAttackTotal, calculatePenaltyTotal, formatTime } from '../utils/rules';
import { Shield, AlertOctagon, HeartPulse, Video } from 'lucide-react';

interface FighterCornerProps {
  color: CornerColor;
  state: CornerState;
  isActive: boolean;
  onSelect: () => void;
  currentRound: number;
}

export const FighterCorner: React.FC<FighterCornerProps> = ({
  color,
  state,
  isActive,
  onSelect,
  currentRound,
}) => {
  const isRed = color === 'red';
  const totalScore = calculateTotalScore(state);
  const attackTotal = calculateAttackTotal(state);
  const penaltyTotal = calculatePenaltyTotal(state);

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={`rounded-2xl bg-white border-2 transition-all cursor-pointer relative overflow-hidden select-none p-5 flex flex-col justify-between ${
        isRed
          ? isActive
            ? 'border-red-600 shadow-md ring-2 ring-red-500/20'
            : 'border-red-200 hover:border-red-400'
          : isActive
          ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
          : 'border-blue-200 hover:border-blue-400'
      }`}
    >
      {/* Top Banner & Fighter Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3.5 h-3.5 rounded-full ${
                isRed ? 'bg-red-600' : 'bg-blue-600'
              }`}
            />
            <span
              className={`text-xs font-black tracking-wider uppercase ${
                isRed ? 'text-red-700' : 'text-blue-700'
              }`}
            >
              {isRed ? 'SUDUT MERAH' : 'SUDUT BIRU'}
            </span>
          </div>

          {isActive && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                isRed ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              PILIHAN INPUT AKTIF
            </span>
          )}
        </div>

        {/* Fighter Name & Contingent */}
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 leading-tight truncate">
            {state.name}
          </h2>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <span className="text-neutral-700 font-bold uppercase">{state.contingent}</span>
            {state.school && (
              <>
                <span aria-hidden="true">·</span>
                <span>{state.school}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Jumbo Score Display */}
      <div className="my-4 py-4 px-2 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col items-center justify-center text-center">
        <div
          className={`font-mono font-black text-7xl sm:text-8xl tracking-tighter tabular-nums leading-none ${
            state.isDisqualified
              ? 'text-neutral-400 line-through'
              : totalScore > 0
              ? isRed
                ? 'text-red-600'
                : 'text-blue-600'
              : totalScore < 0
              ? 'text-red-700'
              : 'text-neutral-800'
          }`}
        >
          {state.isDisqualified ? 'DISQ' : totalScore}
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 mt-2">
          <span>Masuk: <strong className="text-neutral-800 tabular-nums">+{attackTotal}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Hukuman: <strong className="text-red-600 tabular-nums">{penaltyTotal}</strong></span>
        </div>
      </div>

      {/* Penalties & Tournament Badges Status Bar */}
      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {state.isDisqualified && (
            <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-600 text-white flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              DISKUALIFIKASI
            </span>
          )}
        </div>

        {/* VAR & Medical Status */}
        <div className="flex items-center gap-2 text-neutral-600 text-[11px]">
          {/* VAR Cards */}
          <span
            className="flex items-center gap-1 font-semibold text-neutral-700"
            title="Sisa Kartu VAR Protes Pelatih (Maksimal 2)"
          >
            <Video className="w-3.5 h-3.5 text-neutral-500" />
            <span>VAR: {state.varCards}</span>
          </span>

          {/* Medical Used */}
          <span
            className="flex items-center gap-1 font-semibold text-neutral-700"
            title="Total Waktu Medis Digunakan (Maksimal 3 Menit)"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span className="tabular-nums font-mono">{formatTime(state.medicalTimeUsedSeconds)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
