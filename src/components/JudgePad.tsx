import React, { useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { Corner, TandingScoreType } from '../types/silat';
import { 
  Users, 
  Gamepad2, 
  CheckCircle2, 
  Tv, 
  Undo2, 
  Sparkles,
  Zap
} from 'lucide-react';

export const JudgePad: React.FC = () => {
  const { 
    match, 
    activeJudgeId, 
    setActiveJudgeId, 
    submitJudgeVote, 
    undoLastAction, 
    setActiveView 
  } = useMatch();

  // Mode Simulasi 3 Juri Sekaligus (Simultaneous multi-judge simulation)
  const [multiJudgeSim, setMultiJudgeSim] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; corner: Corner } | null>(null);

  const handleVote = (judgeId: 1 | 2 | 3, corner: Corner, type: TandingScoreType) => {
    submitJudgeVote(judgeId, corner, type);
    
    // Provide instantaneous visual confirmation
    setFeedbackMsg({
      text: `Juri ${judgeId} menekan ${type} Sudut ${corner === 'BLUE' ? 'Biru' : 'Merah'}`,
      corner,
    });

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 1800);
  };

  const handleSimulateConsensus = (corner: Corner, type: TandingScoreType) => {
    // Automatically triggers 2 judges voting within 200ms to demonstrate 2/3 PERSILAT rule
    handleVote(1, corner, type);
    setTimeout(() => {
      handleVote(2, corner, type);
    }, 250);
  };

  const activeJudgeName = match.metadata.juryNames[activeJudgeId - 1] || `Juri ${activeJudgeId}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 w-full space-y-4">
      
      {/* 1. Judge Selection Top Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Touch Pad Wasit Juri
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Tablet Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {match.metadata.arena} · Partai #{match.metadata.matchNumber} · Babak {match.currentRound}
            </p>
          </div>
        </div>

        {/* Judge Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[1, 2, 3].map((num) => {
            const isSelected = activeJudgeId === num && !multiJudgeSim;
            return (
              <button
                key={num}
                onClick={() => {
                  setActiveJudgeId(num as 1 | 2 | 3);
                  setMultiJudgeSim(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Juri {num}
              </button>
            );
          })}

          <button
            onClick={() => setMultiJudgeSim(!multiJudgeSim)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              multiJudgeSim
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Simulasi 3 Juri</span>
          </button>
        </div>

        <button
          onClick={() => setActiveView('SCOREBOARD')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
        >
          <Tv className="w-3.5 h-3.5 text-blue-400" />
          <span>Lihat Skor Arena</span>
        </button>
      </div>

      {/* 2. Active Judge Identity Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Konsol Aktif:</span>
          <span className="font-bold text-amber-300">
            {multiJudgeSim ? 'Mode Simulasi Multi-Juri' : `Juri ${activeJudgeId} (${activeJudgeName})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Skor Saat Ini:</span>
          <span className="font-bold text-blue-400">Biru {match.blue.totalScore}</span>
          <span className="text-slate-600">-</span>
          <span className="font-bold text-red-400">Merah {match.red.totalScore}</span>
        </div>
      </div>

      {/* Flash Consensus Feedback Notification */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl border text-center text-xs font-bold animate-fadeIn transition-all ${
          feedbackMsg.corner === 'BLUE' 
            ? 'bg-blue-950/80 border-blue-500/80 text-blue-200' 
            : 'bg-red-950/80 border-red-500/80 text-red-200'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* 3. The Big Dual Hitpad (Sudut Biru vs Sudut Merah) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ================= BLUE CORNER TOUCH PAD ================= */}
        <div className="bg-slate-900 border-2 border-blue-600/70 rounded-3xl p-5 flex flex-col justify-between shadow-xl shadow-blue-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/60 mb-4">
            <div>
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest block">
                SUDUT BIRU
              </span>
              <h3 className="text-lg font-black text-white truncate max-w-[200px]">
                {match.blue.fighter.name}
              </h3>
            </div>
            <div className="bg-blue-600 text-white font-scoreboard text-2xl font-bold px-3 py-1 rounded-xl">
              {match.blue.totalScore}
            </div>
          </div>

          <div className="space-y-3">
            {/* Pukulan (+1) Touch Button */}
            <button
              onClick={() => handleVote(activeJudgeId, 'BLUE', 'PUKULAN')}
              className="w-full min-h-[64px] rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white p-4 flex items-center justify-between font-extrabold shadow-lg shadow-blue-600/30 active:scale-[0.97] transition-all"
            >
              <div className="text-left">
                <span className="text-base block">PUKULAN SAH</span>
                <span className="text-[11px] text-blue-200 font-normal">Serangan tangan masuk sasaran</span>
              </div>
              <span className="font-scoreboard text-3xl font-black bg-white/20 px-3 py-1 rounded-xl tabular-nums">
                +1
              </span>
            </button>

            {/* Tendangan (+2) Touch Button */}
            <button
              onClick={() => handleVote(activeJudgeId, 'BLUE', 'TENDANGAN')}
              className="w-full min-h-[64px] rounded-2xl bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white p-4 flex items-center justify-between font-extrabold shadow-lg shadow-blue-700/30 active:scale-[0.97] transition-all"
            >
              <div className="text-left">
                <span className="text-base block">TENDANGAN SAH</span>
                <span className="text-[11px] text-blue-200 font-normal">Serangan tungkai masuk sasaran</span>
              </div>
              <span className="font-scoreboard text-3xl font-black bg-white/20 px-3 py-1 rounded-xl tabular-nums">
                +2
              </span>
            </button>

            {/* Tangkis + Pukul (+2) */}
            <button
              onClick={() => handleVote(activeJudgeId, 'BLUE', 'TANGKIS_PUKUL')}
              className="w-full min-h-[54px] rounded-2xl bg-slate-800 hover:bg-blue-900/60 border border-blue-700/60 text-blue-200 p-3.5 flex items-center justify-between font-bold active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <span className="text-sm block">TANGKIS / ELAK + PUKUL</span>
                <span className="text-[10px] text-slate-400 font-normal">Tangkisan berhasil lalu balas</span>
              </div>
              <span className="font-scoreboard text-2xl font-bold bg-blue-950 px-2.5 py-0.5 rounded-lg border border-blue-800 tabular-nums">
                +2
              </span>
            </button>

            {/* Tangkis + Tendang (+3) */}
            <button
              onClick={() => handleVote(activeJudgeId, 'BLUE', 'TANGKIS_TENDANG')}
              className="w-full min-h-[54px] rounded-2xl bg-slate-800 hover:bg-blue-900/60 border border-blue-700/60 text-blue-200 p-3.5 flex items-center justify-between font-bold active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <span className="text-sm block">TANGKIS / ELAK + TENDANG</span>
                <span className="text-[10px] text-slate-400 font-normal">Tangkisan berhasil lalu tendang</span>
              </div>
              <span className="font-scoreboard text-2xl font-bold bg-blue-950 px-2.5 py-0.5 rounded-lg border border-blue-800 tabular-nums">
                +3
              </span>
            </button>
          </div>

          {/* Quick Auto-Consensus Simulation Button */}
          {multiJudgeSim && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                Simulasi Otomatis (Konsensus 2 Juri):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulateConsensus('BLUE', 'PUKULAN')}
                  className="py-1.5 px-2 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-semibold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>2 Juri: Pukul (+1)</span>
                </button>
                <button
                  onClick={() => handleSimulateConsensus('BLUE', 'TENDANGAN')}
                  className="py-1.5 px-2 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-semibold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>2 Juri: Tendang (+2)</span>
                </button>
              </div>
            </div>
          )}
        </div>


        {/* ================= RED CORNER TOUCH PAD ================= */}
        <div className="bg-slate-900 border-2 border-red-600/70 rounded-3xl p-5 flex flex-col justify-between shadow-xl shadow-red-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-red-900/60 mb-4">
            <div>
              <span className="text-[11px] font-black text-red-400 uppercase tracking-widest block">
                SUDUT MERAH
              </span>
              <h3 className="text-lg font-black text-white truncate max-w-[200px]">
                {match.red.fighter.name}
              </h3>
            </div>
            <div className="bg-red-600 text-white font-scoreboard text-2xl font-bold px-3 py-1 rounded-xl">
              {match.red.totalScore}
            </div>
          </div>

          <div className="space-y-3">
            {/* Pukulan (+1) Touch Button */}
            <button
              onClick={() => handleVote(activeJudgeId, 'RED', 'PUKULAN')}
              className="w-full min-h-[64px] rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white p-4 flex items-center justify-between font-extrabold shadow-lg shadow-red-600/30 active:scale-[0.97] transition-all"
            >
              <div className="text-left">
                <span className="text-base block">PUKULAN SAH</span>
                <span className="text-[11px] text-red-200 font-normal">Serangan tangan masuk sasaran</span>
              </div>
              <span className="font-scoreboard text-3xl font-black bg-white/20 px-3 py-1 rounded-xl tabular-nums">
                +1
              </span>
            </button>

            {/* Tendangan (+2) Touch Button */}
            <button
              onClick={() => handleVote(activeJudgeId, 'RED', 'TENDANGAN')}
              className="w-full min-h-[64px] rounded-2xl bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white p-4 flex items-center justify-between font-extrabold shadow-lg shadow-red-700/30 active:scale-[0.97] transition-all"
            >
              <div className="text-left">
                <span className="text-base block">TENDANGAN SAH</span>
                <span className="text-[11px] text-red-200 font-normal">Serangan tungkai masuk sasaran</span>
              </div>
              <span className="font-scoreboard text-3xl font-black bg-white/20 px-3 py-1 rounded-xl tabular-nums">
                +2
              </span>
            </button>

            {/* Tangkis + Pukul (+2) */}
            <button
              onClick={() => handleVote(activeJudgeId, 'RED', 'TANGKIS_PUKUL')}
              className="w-full min-h-[54px] rounded-2xl bg-slate-800 hover:bg-red-900/60 border border-red-700/60 text-red-200 p-3.5 flex items-center justify-between font-bold active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <span className="text-sm block">TANGKIS / ELAK + PUKUL</span>
                <span className="text-[10px] text-slate-400 font-normal">Tangkisan berhasil lalu balas</span>
              </div>
              <span className="font-scoreboard text-2xl font-bold bg-red-950 px-2.5 py-0.5 rounded-lg border border-red-800 tabular-nums">
                +2
              </span>
            </button>

            {/* Tangkis + Tendang (+3) */}
            <button
              onClick={() => handleVote(activeJudgeId, 'RED', 'TANGKIS_TENDANG')}
              className="w-full min-h-[54px] rounded-2xl bg-slate-800 hover:bg-red-900/60 border border-red-700/60 text-red-200 p-3.5 flex items-center justify-between font-bold active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <span className="text-sm block">TANGKIS / ELAK + TENDANG</span>
                <span className="text-[10px] text-slate-400 font-normal">Tangkisan berhasil lalu tendang</span>
              </div>
              <span className="font-scoreboard text-2xl font-bold bg-red-950 px-2.5 py-0.5 rounded-lg border border-red-800 tabular-nums">
                +3
              </span>
            </button>
          </div>

          {/* Quick Auto-Consensus Simulation Button */}
          {multiJudgeSim && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                Simulasi Otomatis (Konsensus 2 Juri):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulateConsensus('RED', 'PUKULAN')}
                  className="py-1.5 px-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>2 Juri: Pukul (+1)</span>
                </button>
                <button
                  onClick={() => handleSimulateConsensus('RED', 'TENDANGAN')}
                  className="py-1.5 px-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>2 Juri: Tendang (+2)</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. Bottom Controls: Undo last action */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <span className="text-xs text-slate-400">
          Aturan PERSILAT: Tombol yang ditekan berlaku dalam jendela waktu 1.5 detik untuk verifikasi kesepakatan juri.
        </span>

        <button
          onClick={undoLastAction}
          disabled={match.logs.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            match.logs.length === 0
              ? 'text-slate-600 bg-slate-950 cursor-not-allowed'
              : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Batalkan Nilai Terakhir (Undo)</span>
        </button>
      </div>

    </div>
  );
};
