import React, { useState } from 'react';
import { TandingMatch, SeniMatch } from '../types/silat';
import { calculateTotalScore } from '../utils/silatCalculations';
import {
  Calendar,
  Award,
  Play,
  Trash2,
  FileDown,
  FileUp,
  Printer,
  PlusCircle,
  Shield,
  Layers,
} from 'lucide-react';

interface MatchHistoryViewProps {
  history: TandingMatch[];
  seniHistory: SeniMatch[];
  onLoadMatch: (match: TandingMatch) => void;
  onLoadSeniMatch: (match: SeniMatch) => void;
  onClearHistory: () => void;
  onPrintMatch: (match: TandingMatch) => void;
  onLoadSampleMatches: () => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  history,
  seniHistory,
  onLoadMatch,
  onLoadSeniMatch,
  onClearHistory,
  onPrintMatch,
  onLoadSampleMatches,
}) => {
  const [activeTab, setActiveTab] = useState<'tanding' | 'seni'>('tanding');

  const handleExportJSON = () => {
    const data = {
      tandingHistory: history,
      seniHistory: seniHistory,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_turnamen_silat_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-athletic text-2xl font-bold text-amber-400">
              JADWAL & ARSIP PERTANDINGAN
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {history.length} Tanding · {seniHistory.length} Seni
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Daftar partai pertandingan yang telah selesai atau dijadwalkan. Anda dapat memuat ulang ke layar scoreboard atau mencetak lembar nilai.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onLoadSampleMatches}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Muat Contoh Partai</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor Data JSON</span>
          </button>

          {(history.length > 0 || seniHistory.length > 0) && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-xl border border-red-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Tanding vs Seni */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tanding')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tanding'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Kategori Tanding ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('seni')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'seni'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Kategori Seni / TGR ({seniHistory.length})
        </button>
      </div>

      {/* TANDING LIST */}
      {activeTab === 'tanding' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300 text-sm">
                Belum ada arsip partai pertandingan tanding.
              </p>
              <p className="text-slate-500">
                Setelah pertandingan selesai dan pemenang disahkan di Meja Dewan, data akan otomatis terarsip di sini.
              </p>
              <button
                onClick={onLoadSampleMatches}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
              >
                Muat Contoh Partai Turnamen
              </button>
            </div>
          ) : (
            history.map((m) => {
              const merahTotal = calculateTotalScore(m.merah);
              const biruTotal = calculateTotalScore(m.biru);

              return (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-amber-400">{m.gelanggang}</span>
                      <span>·</span>
                      <span className="text-white font-semibold">PARTAI {m.partai}</span>
                      <span>·</span>
                      <span>{m.babakMatch}</span>
                      <span>·</span>
                      <span>{m.kelasTanding}</span>
                    </div>

                    {/* Match Result Strip */}
                    <div className="flex items-center gap-3 pt-1">
                      {/* Merah */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className={`text-sm font-bold ${m.winner === 'MERAH' ? 'text-amber-400 underline font-black' : 'text-slate-200'}`}>
                          {m.merah.name} ({merahTotal})
                        </span>
                      </div>

                      <span className="text-xs text-slate-600 font-bold">VS</span>

                      {/* Biru */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className={`text-sm font-bold ${m.winner === 'BIRU' ? 'text-amber-400 underline font-black' : 'text-slate-200'}`}>
                          {m.biru.name} ({biruTotal})
                        </span>
                      </div>
                    </div>

                    {m.victoryType && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Keputusan:{' '}
                        <span className="text-amber-300 font-semibold">
                          {m.victoryType.replace(/_/g, ' ')}
                        </span>{' '}
                        {m.winnerNotes && <span>({m.winnerNotes})</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onLoadMatch(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Muat ke Scoreboard</span>
                    </button>

                    <button
                      onClick={() => onPrintMatch(m)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                      title="Cetak Rekap"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SENI LIST */}
      {activeTab === 'seni' && (
        <div className="space-y-3">
          {seniHistory.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300 text-sm">
                Belum ada arsip penampilan kategori Seni (TGR).
              </p>
              <p className="text-slate-500">
                Nilai akhir dari form Skoring Seni akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            seniHistory.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-bold text-amber-400">{s.gelanggang}</span>
                    <span>·</span>
                    <span className="text-white font-semibold">PARTAI {s.partai}</span>
                    <span>·</span>
                    <span className="text-amber-300 font-bold uppercase">
                      SENI {s.kategori}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {s.pesilatName} · <span className="text-slate-400 font-normal">{s.kontingen}</span>
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Durasi: {Math.floor(s.timeElapsedSeconds / 60)}m {s.timeElapsedSeconds % 60}s · Nilai Akhir:{' '}
                    <span className="font-led font-black text-amber-400 text-sm">
                      {s.finalScore.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onLoadSeniMatch(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Muat ke Form Seni</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
