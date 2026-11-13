import React, { useState } from 'react';
import { 
  Users, 
  RotateCcw, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Award,
  CheckCircle2,
  Undo2,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { Corner } from '../../types/scoring';

export const JudgePadView: React.FC = () => {
  const {
    match,
    activeJudgeId,
    setActiveJudgeId,
    submitJudgeStrike,
    adjustScoreDirect,
    updateSeniMovementMistake,
    updateSeniStamina,
    language,
  } = useTournament();

  const [lastAction, setLastAction] = useState<{ corner: Corner; type: string; points: number } | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStrike = (corner: Corner, type: 'pukulan' | 'tendangan' | 'jatuhan') => {
    submitJudgeStrike(activeJudgeId, corner, type);
    const points = type === 'pukulan' ? 1 : type === 'tendangan' ? 2 : 3;
    setLastAction({ corner, type, points });
  };

  const handleUndo = () => {
    if (lastAction) {
      adjustScoreDirect(lastAction.corner, -lastAction.points);
      setLastAction(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between p-2 sm:p-4 bg-gradient-to-b from-[#120224] via-black to-[#080010]">
      {/* Top Bar: Judge Identity, Timer, Round */}
      <div className="bg-black/70 border border-purple-500/30 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        {/* Judge Number Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500 text-black font-extrabold px-3 py-1 rounded-xl text-xs uppercase shadow glow-gold">
            <Users className="w-4 h-4" />
            <span>JURI {activeJudgeId}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-purple-500/20">
            {[1, 2, 3, 4, 5].slice(0, match.activeJudgeCount).map((jId) => (
              <button
                key={jId}
                onClick={() => setActiveJudgeId(jId)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  activeJudgeId === jId
                    ? 'bg-amber-400 text-black font-extrabold scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                J{jId}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Arena & Match info */}
        <div className="text-center">
          <span className="font-chakra text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest">
            {match.arena} • {match.matchNumber} ({match.category.toUpperCase()})
          </span>
          <div className="text-[11px] text-gray-400">
            {match.classPool} • {match.roundStage}
          </div>
        </div>

        {/* Right: Round & Clock */}
        <div className="flex items-center gap-3">
          {lastAction && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2 py-1 rounded-lg hover:bg-amber-900/60 active:scale-95 transition-all"
              title="Batalkan input nilai terakhir"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-purple-950/60 px-3 py-1 rounded-xl border border-purple-500/30">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-chakra font-bold text-sm text-white">
              {formatTime(match.timerSeconds)}
            </span>
            {match.category === 'tanding' && (
              <span className="text-xs font-extrabold text-amber-300 bg-black/50 px-2 py-0.5 rounded-lg border border-purple-500/30">
                B{match.currentRound}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Touch Area for TANDING vs SENI */}
      {match.category === 'tanding' ? (
        <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-6 my-2 sm:my-3">
          {/* ================= RED CORNER PAD ================= */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-red-950/60 via-red-950/30 to-black border-2 border-red-500/50 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
            {/* Header Red */}
            <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-2">
              <div>
                <span className="font-chakra font-black text-sm sm:text-lg text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  SUDUT MERAH
                </span>
                <p className="font-bold text-white text-xs sm:text-base truncate max-w-[160px] sm:max-w-xs">
                  {match.redCorner.athleteName}
                </p>
                <p className="text-[10px] sm:text-xs text-red-300/80 truncate">
                  {match.redCorner.contingent}
                </p>
              </div>
              <div className="text-right">
                <span className="font-chakra text-3xl sm:text-4xl font-extrabold text-red-400 led-score">
                  {match.redCorner.score}
                </span>
              </div>
            </div>

            {/* Red Strike Buttons: Pukulan, Tendangan, Jatuhan */}
            <div className="flex-1 grid grid-rows-3 gap-2 sm:gap-3 py-1">
              {/* PUKULAN (1 PT) */}
              <button
                onClick={() => handleStrike('red', 'pukulan')}
                className="judge-button w-full bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 active:from-red-900 active:to-red-700 text-white rounded-xl sm:rounded-2xl border-2 border-red-400/50 shadow-lg glow-red flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block">
                    PUKULAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-red-200">Serangan Tangan Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-red-400/30">
                  +1
                </div>
              </button>

              {/* TENDANGAN (2 PT) */}
              <button
                onClick={() => handleStrike('red', 'tendangan')}
                className="judge-button w-full bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 active:from-red-800 active:to-red-600 text-white rounded-xl sm:rounded-2xl border-2 border-red-300/60 shadow-lg glow-red flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block">
                    TENDANGAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-red-100">Serangan Kaki Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-red-300/40">
                  +2
                </div>
              </button>

              {/* JATUHAN (3 PT) */}
              <button
                onClick={() => handleStrike('red', 'jatuhan')}
                className="judge-button w-full bg-gradient-to-r from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white rounded-xl sm:rounded-2xl border-2 border-amber-400/70 shadow-xl glow-gold flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block text-amber-200">
                    JATUHAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-amber-100">Bantingan / Sapuan Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-amber-400/40 text-amber-300">
                  +3
                </div>
              </button>
            </div>
          </div>

          {/* ================= BLUE CORNER PAD ================= */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-blue-950/60 via-blue-950/30 to-black border-2 border-blue-500/50 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
            {/* Header Blue */}
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-2 mb-2">
              <div>
                <span className="font-chakra font-black text-sm sm:text-lg text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  SUDUT BIRU
                </span>
                <p className="font-bold text-white text-xs sm:text-base truncate max-w-[160px] sm:max-w-xs">
                  {match.blueCorner.athleteName}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-300/80 truncate">
                  {match.blueCorner.contingent}
                </p>
              </div>
              <div className="text-right">
                <span className="font-chakra text-3xl sm:text-4xl font-extrabold text-blue-400 led-score">
                  {match.blueCorner.score}
                </span>
              </div>
            </div>

            {/* Blue Strike Buttons: Pukulan, Tendangan, Jatuhan */}
            <div className="flex-1 grid grid-rows-3 gap-2 sm:gap-3 py-1">
              {/* PUKULAN (1 PT) */}
              <button
                onClick={() => handleStrike('blue', 'pukulan')}
                className="judge-button w-full bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 active:from-blue-900 active:to-blue-700 text-white rounded-xl sm:rounded-2xl border-2 border-blue-400/50 shadow-lg glow-blue flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block">
                    PUKULAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-200">Serangan Tangan Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-blue-400/30">
                  +1
                </div>
              </button>

              {/* TENDANGAN (2 PT) */}
              <button
                onClick={() => handleStrike('blue', 'tendangan')}
                className="judge-button w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 active:from-blue-800 active:to-blue-600 text-white rounded-xl sm:rounded-2xl border-2 border-blue-300/60 shadow-lg glow-blue flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block">
                    TENDANGAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-100">Serangan Kaki Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-blue-300/40">
                  +2
                </div>
              </button>

              {/* JATUHAN (3 PT) */}
              <button
                onClick={() => handleStrike('blue', 'jatuhan')}
                className="judge-button w-full bg-gradient-to-r from-amber-600 via-blue-600 to-blue-700 hover:from-amber-500 hover:to-blue-600 text-white rounded-xl sm:rounded-2xl border-2 border-amber-400/70 shadow-xl glow-gold flex items-center justify-between px-4 sm:px-6 py-2"
              >
                <div className="text-left">
                  <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider uppercase block text-amber-200">
                    JATUHAN
                  </span>
                  <span className="text-[10px] sm:text-xs text-amber-100">Bantingan / Sapuan Sah</span>
                </div>
                <div className="font-chakra text-3xl sm:text-4xl font-black bg-black/40 px-3 sm:px-4 py-1 rounded-xl border border-amber-400/40 text-amber-300">
                  +3
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SENI / JURUS JUDGE PAD ================= */
        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-4 space-y-4">
          <div className="bg-gradient-to-r from-purple-950/70 via-black to-purple-950/70 border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl text-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              PENILAIAN JURI SENI ({match.category.toUpperCase()})
            </span>
            <h3 className="font-chakra text-2xl font-black text-white mt-1">
              {match.seniCompetitor.athleteName}
            </h3>
            <p className="text-sm text-purple-300">
              {match.seniCompetitor.contingent} • Senjata: {match.seniCompetitor.weaponUsed || 'Tangan Kosong'}
            </p>

            <div className="my-6">
              <span className="text-xs text-gray-400 font-semibold block uppercase">Skor Berjalan Saat Ini</span>
              <span className="font-chakra text-6xl font-black text-amber-300 led-score">
                {match.seniCompetitor.finalScore.toFixed(3)}
              </span>
            </div>

            {/* Mistake Counter (-0.01 per mistake) */}
            <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 max-w-md mx-auto mb-4">
              <span className="text-xs font-bold text-purple-300 uppercase block mb-2">
                PENGURANGAN SALAH GERAK / LANGKAH (-0.01)
              </span>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => updateSeniMovementMistake(-1)}
                  className="p-3 bg-purple-900/50 hover:bg-purple-800 rounded-2xl text-purple-300 active:scale-95 transition-all"
                >
                  <MinusCircle className="w-8 h-8" />
                </button>

                <div className="text-center px-4">
                  <span className="font-chakra text-4xl font-extrabold text-white">
                    {match.seniCompetitor.movementMistakes}
                  </span>
                  <span className="text-[11px] text-red-400 block font-semibold">
                    -{(match.seniCompetitor.movementMistakes * 0.01).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => updateSeniMovementMistake(1)}
                  className="p-3 bg-red-600 hover:bg-red-500 rounded-2xl text-white active:scale-95 transition-all shadow glow-red"
                >
                  <PlusCircle className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Stamina & Soul Rating Slider (0.01 to 0.10) */}
            <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300 mb-2">
                <span>NILAI KEMANTAPAN / PENGHAYATAN / IRAMA:</span>
                <span className="text-amber-300 font-chakra text-sm">+{match.seniCompetitor.staminaHarmonyScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.10"
                step="0.01"
                value={match.seniCompetitor.staminaHarmonyScore}
                onChange={(e) => updateSeniStamina(parseFloat(e.target.value) || 0.05)}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0.01 (Cukup)</span>
                <span>0.05 (Baik)</span>
                <span>0.10 (Sempurna)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Touch ergonomics reminder & Persilat status */}
      <div className="bg-black/60 border border-purple-500/20 rounded-xl px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Ketuk tombol untuk mengirim nilai langsung ke konsensus dewan & monitor gelanggang.
        </span>
        <span className="text-purple-300 font-semibold hidden sm:inline">
          PERSILAT Official Scoring Rule 2026
        </span>
      </div>
    </div>
  );
};
