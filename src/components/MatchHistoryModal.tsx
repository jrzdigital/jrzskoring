import React from 'react';
import { useMatch } from '../context/MatchContext';
import { MatchState } from '../types/silat';
import { FileText, Trash2, ArrowUpRight, Award, Trophy } from 'lucide-react';

interface MatchHistoryModalProps {
  onOpenProtocol: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({ onOpenProtocol }) => {
  const { history, clearHistory, loadMatchFromHistory, setActiveView } = useMatch();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 w-full space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Arsip & Rekap Pertandingan</h1>
            <p className="text-xs text-slate-400">
              Daftar seluruh partai tanding yang telah diselesaikan pada sistem ini
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Hapus seluruh arsip partai tersimpan?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Arsip</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-300">Belum Ada Riwayat Pertandingan Selesai</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pertandingan yang diputuskan pemenangnya pada Konsol Ketua Pertandingan akan otomatis diarsipkan di sini.
          </p>
          <button
            onClick={() => setActiveView('OPERATOR')}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Buka Konsol Pertandingan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((m) => {
            const isBlueWinner = m.winner === 'BLUE';
            const isRedWinner = m.winner === 'RED';

            return (
              <div 
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">Partai #{m.metadata.matchNumber}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{m.metadata.arena}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{m.metadata.roundPhase}</span>
                  </div>
                  <span className="text-slate-500 font-mono-nums">{m.metadata.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Blue Summary */}
                  <div className={`p-3 rounded-xl border ${
                    isBlueWinner 
                      ? 'bg-blue-950/60 border-blue-500/80 shadow-sm shadow-blue-500/20' 
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">Sudut Biru</span>
                      {isBlueWinner && <Award className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="font-extrabold text-sm text-white mt-1 truncate">
                      {m.blue.fighter.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {m.blue.fighter.contingent}
                    </div>
                    <div className="font-scoreboard text-3xl font-black text-blue-400 mt-2">
                      {m.blue.totalScore}
                    </div>
                  </div>

                  {/* Red Summary */}
                  <div className={`p-3 rounded-xl border ${
                    isRedWinner 
                      ? 'bg-red-950/60 border-red-500/80 shadow-sm shadow-red-500/20' 
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400 uppercase">Sudut Merah</span>
                      {isRedWinner && <Award className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="font-extrabold text-sm text-white mt-1 truncate">
                      {m.red.fighter.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {m.red.fighter.contingent}
                    </div>
                    <div className="font-scoreboard text-3xl font-black text-red-400 mt-2">
                      {m.red.totalScore}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Keputusan</span>
                    <span className="font-semibold text-amber-300">
                      {m.winDecision ? m.winDecision.replace(/_/g, ' ') : 'Selesai'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadMatchFromHistory(m);
                        onOpenProtocol();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold flex items-center gap-1"
                    >
                      <span>Berita Acara</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => loadMatchFromHistory(m)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                    >
                      Buka di Arena
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
