import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, UserCheck, Users, Shield } from 'lucide-react';
import { MatchData, Corner, ScoreActionType, JudgeId } from '../types/silat';
import { silatAudio } from '../utils/audio';

interface JuryPadProps {
  match: MatchData;
  onUpdateMatch: (match: MatchData) => void;
  activeJudge: JudgeId | 'ALL';
  setActiveJudge: (j: JudgeId | 'ALL') => void;
}

export const JuryPad: React.FC<JuryPadProps> = ({
  match,
  onUpdateMatch,
  activeJudge,
  setActiveJudge,
}) => {
  const [flashCorner, setFlashCorner] = useState<Corner | null>(null);
  const [lastActionText, setLastActionText] = useState<string>('');

  const handleScoreAction = (corner: Corner, action: ScoreActionType, points: number) => {
    // Determine judge IDs to submit for
    const judgeIdsToSubmit: JudgeId[] = activeJudge === 'ALL' ? [1, 2, 3] : [activeJudge];

    const newEntries = judgeIdsToSubmit.map((jid) => ({
      id: `score-${Date.now()}-${jid}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      matchId: match.id,
      round: match.currentRound,
      corner,
      action,
      points,
      judgeId: jid,
    }));

    onUpdateMatch({
      ...match,
      scores: [...match.scores, ...newEntries],
    });

    // Sound and visual feedback
    silatAudio.playScoreBeep(corner);
    setFlashCorner(corner);
    setLastActionText(`${corner.toUpperCase()}: ${action.replace('_', ' ')} (+${points})`);
    setTimeout(() => setFlashCorner(null), 300);
  };

  const handleUndo = () => {
    if (match.scores.length === 0) return;

    // Filter out the last entry by current judge or last entry overall
    const updated = [...match.scores];
    if (activeJudge === 'ALL') {
      updated.pop();
    } else {
      // Find last entry made by this judge
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].judgeId === activeJudge) {
          updated.splice(i, 1);
          break;
        }
      }
    }

    onUpdateMatch({
      ...match,
      scores: updated,
    });
    setLastActionText('Aksi terakhir dibatalkan (Undo)');
    silatAudio.playWhistle();
  };

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* Top Bar: Judge Selection & Round Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveJudge(1)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeJudge === 1
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Juri 1
            </button>
            <button
              onClick={() => setActiveJudge(2)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeJudge === 2
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Juri 2
            </button>
            <button
              onClick={() => setActiveJudge(3)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeJudge === 3
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Juri 3
            </button>
            <button
              onClick={() => setActiveJudge('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeJudge === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Operator Tunggal</span>
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-400">
            {activeJudge === 'ALL' ? 'Mode Operator Langsung (Semua Juri)' : `Terminal Juri ${activeJudge} Aktif`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-md">
            BABAK {match.currentRound}
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Batal (Undo)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Flash Banner */}
      {lastActionText && (
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{lastActionText}</span>
          </div>
          <span className="text-[10px] text-slate-500">Sentuh tombol untuk poin berikutnya</span>
        </div>
      )}

      {/* Touch Pad Grid: Split Sudut Merah vs Sudut Biru */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* LEFT PAD: SUDUT MERAH */}
        <div className={`bg-gradient-to-b from-red-950/80 to-slate-900 border-2 rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-xl ${
          flashCorner === 'merah' ? 'border-red-400 bg-red-900/50' : 'border-red-700/80'
        }`}>
          {/* Header Pesilat Merah */}
          <div className="border-b border-red-800/60 pb-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                SUDUT MERAH
              </span>
              <span className="text-xs font-mono text-red-300">
                {match.redFighter.contingent}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white uppercase mt-1 truncate">
              {match.redFighter.name}
            </h3>
          </div>

          {/* Big Touch Buttons for Merah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            {/* PUKULAN (+1) */}
            <button
              onClick={() => handleScoreAction('merah', 'PUKULAN', 1)}
              className="min-h-[72px] p-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl shadow-lg shadow-red-950/40 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-base sm:text-lg font-black tracking-wide">PUKULAN</span>
              <span className="text-xs font-mono font-bold text-red-200 mt-0.5">+1 POIN</span>
            </button>

            {/* TENDANGAN (+2) */}
            <button
              onClick={() => handleScoreAction('merah', 'TENDANGAN', 2)}
              className="min-h-[72px] p-4 bg-red-700 hover:bg-red-600 active:scale-95 text-white rounded-xl shadow-lg shadow-red-950/40 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-base sm:text-lg font-black tracking-wide">TENDANGAN</span>
              <span className="text-xs font-mono font-bold text-red-200 mt-0.5">+2 POIN</span>
            </button>

            {/* TANGKISAN + PUKULAN (+2) */}
            <button
              onClick={() => handleScoreAction('merah', 'TANGKISAN_PUKULAN', 2)}
              className="min-h-[64px] p-3 bg-slate-900 hover:bg-slate-800 border border-red-700/80 active:scale-95 text-white rounded-xl shadow flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-red-300 text-center">Tangkis + Pukulan</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300 mt-0.5">+2 Poin</span>
            </button>

            {/* TANGKISAN + TENDANGAN (+3) */}
            <button
              onClick={() => handleScoreAction('merah', 'TANGKISAN_TENDANGAN', 3)}
              className="min-h-[64px] p-3 bg-slate-900 hover:bg-slate-800 border border-red-700/80 active:scale-95 text-white rounded-xl shadow flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-red-300 text-center">Tangkis + Tendangan</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300 mt-0.5">+3 Poin</span>
            </button>

            {/* JATUHAN SAH (+3) - Full width */}
            <button
              onClick={() => handleScoreAction('merah', 'JATUHAN', 3)}
              className="sm:col-span-2 min-h-[68px] p-3 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 active:scale-95 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer select-none"
            >
              <Shield className="w-5 h-5 text-amber-300" />
              <div className="text-center">
                <div className="text-sm sm:text-base font-extrabold tracking-wide">
                  JATUHAN SAH (BANTINGAN / SAPUAN)
                </div>
                <div className="text-[11px] font-mono text-amber-200">
                  +3 POIN (Menjatuhkan lawan secara sah)
                </div>
              </div>
            </button>
          </div>

          <div className="text-center text-[11px] text-red-300/80 pt-2 border-t border-red-900/60">
            Peraturan IPSI 2022: Serangan sah mengenai sasaran tanpa terhalang tangkisan lawan.
          </div>
        </div>

        {/* RIGHT PAD: SUDUT BIRU */}
        <div className={`bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-xl ${
          flashCorner === 'biru' ? 'border-blue-400 bg-blue-900/50' : 'border-blue-700/80'
        }`}>
          {/* Header Pesilat Biru */}
          <div className="border-b border-blue-800/60 pb-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                SUDUT BIRU
              </span>
              <span className="text-xs font-mono text-blue-300">
                {match.blueFighter.contingent}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white uppercase mt-1 truncate">
              {match.blueFighter.name}
            </h3>
          </div>

          {/* Big Touch Buttons for Biru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            {/* PUKULAN (+1) */}
            <button
              onClick={() => handleScoreAction('biru', 'PUKULAN', 1)}
              className="min-h-[72px] p-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl shadow-lg shadow-blue-950/40 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-base sm:text-lg font-black tracking-wide">PUKULAN</span>
              <span className="text-xs font-mono font-bold text-blue-200 mt-0.5">+1 POIN</span>
            </button>

            {/* TENDANGAN (+2) */}
            <button
              onClick={() => handleScoreAction('biru', 'TENDANGAN', 2)}
              className="min-h-[72px] p-4 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white rounded-xl shadow-lg shadow-blue-950/40 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-base sm:text-lg font-black tracking-wide">TENDANGAN</span>
              <span className="text-xs font-mono font-bold text-blue-200 mt-0.5">+2 POIN</span>
            </button>

            {/* TANGKISAN + PUKULAN (+2) */}
            <button
              onClick={() => handleScoreAction('biru', 'TANGKISAN_PUKULAN', 2)}
              className="min-h-[64px] p-3 bg-slate-900 hover:bg-slate-800 border border-blue-700/80 active:scale-95 text-white rounded-xl shadow flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-blue-300 text-center">Tangkis + Pukulan</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300 mt-0.5">+2 Poin</span>
            </button>

            {/* TANGKISAN + TENDANGAN (+3) */}
            <button
              onClick={() => handleScoreAction('biru', 'TANGKISAN_TENDANGAN', 3)}
              className="min-h-[64px] p-3 bg-slate-900 hover:bg-slate-800 border border-blue-700/80 active:scale-95 text-white rounded-xl shadow flex flex-col items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-blue-300 text-center">Tangkis + Tendangan</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300 mt-0.5">+3 Poin</span>
            </button>

            {/* JATUHAN SAH (+3) - Full width */}
            <button
              onClick={() => handleScoreAction('biru', 'JATUHAN', 3)}
              className="sm:col-span-2 min-h-[68px] p-3 bg-gradient-to-r from-blue-800 to-cyan-700 hover:from-blue-700 hover:to-cyan-600 active:scale-95 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer select-none"
            >
              <Shield className="w-5 h-5 text-cyan-300" />
              <div className="text-center">
                <div className="text-sm sm:text-base font-extrabold tracking-wide">
                  JATUHAN SAH (BANTINGAN / SAPUAN)
                </div>
                <div className="text-[11px] font-mono text-cyan-200">
                  +3 POIN (Menjatuhkan lawan secara sah)
                </div>
              </div>
            </button>
          </div>

          <div className="text-center text-[11px] text-blue-300/80 pt-2 border-t border-blue-900/60">
            Peraturan IPSI 2022: Serangan sah mengenai sasaran tanpa terhalang tangkisan lawan.
          </div>
        </div>
      </div>
    </div>
  );
};
