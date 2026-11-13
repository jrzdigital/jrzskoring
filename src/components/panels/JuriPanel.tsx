import React, { useState, useEffect } from 'react';
import { 
  ActiveMatchState, 
  TandingCorner, 
  ScorePointType 
} from '../../types/silat';
import { syncEngine, formatTimeMinutes } from '../../utils/sync';
import { 
  Swords, 
  UserCheck, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Hand, 
  Footprints, 
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  Sparkles
} from 'lucide-react';

interface JuriPanelProps {
  matchState: ActiveMatchState;
}

export const JuriPanel: React.FC<JuriPanelProps> = ({ matchState }) => {
  const [selectedJuriId, setSelectedJuriId] = useState<number>(1);
  const isTanding = matchState.category === 'tanding';

  // State for Juri Seni Evaluation
  const currentSeniEval = matchState.seni.juriScores[selectedJuriId] || {
    kebenaranBase: 9.90,
    kesalahanMinorCount: 0,
    kesalahanMajorCount: 0,
    totalPotonganGerak: 0,
    kemantapanScore: 0.90,
    finalJuriScore: 9.90,
  };

  const [minorCount, setMinorCount] = useState(currentSeniEval.kesalahanMinorCount);
  const [majorCount, setMajorCount] = useState(currentSeniEval.kesalahanMajorCount);
  const [kemantapan, setKemantapan] = useState(currentSeniEval.kemantapanScore);

  useEffect(() => {
    if (matchState.seni.juriScores[selectedJuriId]) {
      setMinorCount(matchState.seni.juriScores[selectedJuriId].kesalahanMinorCount);
      setMajorCount(matchState.seni.juriScores[selectedJuriId].kesalahanMajorCount);
      setKemantapan(matchState.seni.juriScores[selectedJuriId].kemantapanScore);
    }
  }, [selectedJuriId, matchState.seni.juriScores]);

  // Handle score input for Tanding
  const handleScoreTap = (corner: TandingCorner, pointType: ScorePointType) => {
    if (matchState.status !== 'running') {
      alert('Pertandingan sedang berhenti/jeda. Timer harus berjalan untuk memasukkan nilai juri.');
      return;
    }
    syncEngine.recordJuriClick(selectedJuriId, corner, pointType);
  };

  // Handle Seni scoring adjustments
  const handleSeniUpdate = (newMinor: number, newMajor: number, newKemantapan: number) => {
    setMinorCount(newMinor);
    setMajorCount(newMajor);
    setKemantapan(newKemantapan);
    syncEngine.updateSeniJuriScore(
      selectedJuriId,
      9.90,
      newMinor,
      newMajor,
      newKemantapan
    );
  };

  // Recent clicks from this juri
  const myRecentClicks = matchState.tanding.recentJuriClicks
    .filter((c) => c.juriId === selectedJuriId)
    .slice(-4)
    .reverse();

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4">
      
      {/* Header & Juri Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14082B] p-4 sm:p-5 rounded-2xl border border-purple-800/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-purple-400 tracking-wider uppercase">
              Perangkat Penilai Digital
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-white">
              Panel Juri Pertandingan
            </h1>
          </div>
        </div>

        {/* Juri Selector Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 bg-[#1E0C3E] p-1 rounded-xl border border-purple-800/60">
          <span className="text-[11px] font-semibold text-purple-300 px-2 hidden sm:inline">Pilih Posisi:</span>
          {[1, 2, 3].map((id) => (
            <button
              key={id}
              onClick={() => setSelectedJuriId(id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedJuriId === id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
              }`}
            >
              Juri {id}
            </button>
          ))}
        </div>

        {/* Match Round & Timer Status */}
        <div className="flex items-center gap-2">
          <div className="bg-[#1F0C42] px-3 py-1.5 rounded-xl border border-purple-700/60 text-xs">
            <span className="text-purple-300">Waktu: </span>
            <span className="font-mono-num font-bold text-amber-300 text-sm">
              {formatTimeMinutes(matchState.timerSec)}
            </span>
            <span className="text-purple-400/60 mx-1">|</span>
            <span className="text-purple-200 font-semibold">
              Babak {matchState.round}
            </span>
          </div>

          <span className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase ${
            matchState.status === 'running'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse'
              : 'bg-amber-950 text-amber-300 border border-amber-600/60'
          }`}>
            {matchState.status === 'running' ? 'AKTIF' : 'JEDA'}
          </span>
        </div>
      </div>

      {/* MODE TANDING: DUAL CORNER TOUCH CONTROLS */}
      {isTanding ? (
        <div className="space-y-4">
          
          {/* Status Instruction */}
          {matchState.status !== 'running' && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-600/60 text-amber-200 text-xs text-center font-semibold">
              Pertandingan sedang dihentikan / jeda. Tombol nilai akan aktif otomatis saat Operator Waktu memulai timer.
            </div>
          )}

          {/* Dual Split Screen Grid (Optimized for Tablets & Phones) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* LEFT: SUDUT MERAH TOUCH PAD */}
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#280B1B] via-[#1A0713] to-[#11040D] border-2 sm:border-4 border-red-600/70 shadow-2xl space-y-4">
              
              {/* Corner Info */}
              <div className="flex items-center justify-between pb-3 border-b border-red-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/80 animate-pulse" />
                  <div>
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
                      SUDUT MERAH
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white truncate max-w-[200px]">
                      {matchState.tanding.red.name}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono-num text-red-400">
                    {matchState.tanding.red.totalScore}
                  </div>
                  <div className="text-[10px] text-red-300/70">Total Poin</div>
                </div>
              </div>

              {/* Giant Touch Buttons */}
              <div className="space-y-3">
                {/* Pukulan (+1) */}
                <button
                  onClick={() => handleScoreTap('merah', 'pukulan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-5 sm:py-6 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-red-950/60 font-black flex items-center justify-between text-base sm:text-lg transition-transform border border-red-400/30 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center">
                      <Hand className="w-6 h-6 text-red-200" />
                    </div>
                    <span>PUKULAN SAH</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +1
                  </span>
                </button>

                {/* Tendangan (+2) */}
                <button
                  onClick={() => handleScoreTap('merah', 'tendangan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-5 sm:py-6 px-4 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-red-950/60 font-black flex items-center justify-between text-base sm:text-lg transition-transform border border-amber-400/30 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center">
                      <Footprints className="w-6 h-6 text-amber-200" />
                    </div>
                    <span>TENDANGAN SAH</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +2
                  </span>
                </button>

                {/* Ajukan Jatuhan (+3) */}
                <button
                  onClick={() => handleScoreTap('merah', 'jatuhan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-4 sm:py-5 px-4 bg-gradient-to-r from-red-900 via-purple-900 to-red-900 hover:from-red-800 hover:to-purple-800 active:scale-95 disabled:opacity-50 text-amber-300 rounded-2xl shadow-xl shadow-purple-950/60 font-bold flex items-center justify-between text-sm sm:text-base transition-transform border border-purple-500/40 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>AJUKAN JATUHAN SAH</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +3
                  </span>
                </button>
              </div>

            </div>

            {/* RIGHT: SUDUT BIRU TOUCH PAD */}
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0C1B3B] via-[#081226] to-[#040914] border-2 sm:border-4 border-blue-600/70 shadow-2xl space-y-4">
              
              {/* Corner Info */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/80 animate-pulse" />
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                      SUDUT BIRU
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white truncate max-w-[200px]">
                      {matchState.tanding.blue.name}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono-num text-blue-400">
                    {matchState.tanding.blue.totalScore}
                  </div>
                  <div className="text-[10px] text-blue-300/70">Total Poin</div>
                </div>
              </div>

              {/* Giant Touch Buttons */}
              <div className="space-y-3">
                {/* Pukulan (+1) */}
                <button
                  onClick={() => handleScoreTap('biru', 'pukulan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-5 sm:py-6 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-blue-950/60 font-black flex items-center justify-between text-base sm:text-lg transition-transform border border-blue-400/30 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center">
                      <Hand className="w-6 h-6 text-blue-200" />
                    </div>
                    <span>PUKULAN SAH</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +1
                  </span>
                </button>

                {/* Tendangan (+2) */}
                <button
                  onClick={() => handleScoreTap('biru', 'tendangan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-5 sm:py-6 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 active:scale-95 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-blue-950/60 font-black flex items-center justify-between text-base sm:text-lg transition-transform border border-indigo-400/30 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center">
                      <Footprints className="w-6 h-6 text-indigo-200" />
                    </div>
                    <span>TENDANGAN SAH</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +2
                  </span>
                </button>

                {/* Ajukan Jatuhan (+3) */}
                <button
                  onClick={() => handleScoreTap('biru', 'jatuhan')}
                  disabled={matchState.status !== 'running'}
                  className="w-full py-4 sm:py-5 px-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 hover:from-blue-800 hover:to-indigo-900 active:scale-95 disabled:opacity-50 text-amber-300 rounded-2xl shadow-xl shadow-indigo-950/60 font-bold flex items-center justify-between text-sm sm:text-base transition-transform border border-indigo-500/40 select-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>AJUKAN JATUHAN SAH</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-mono-num bg-black/40 px-3 py-1 rounded-xl">
                    +3
                  </span>
                </button>
              </div>

            </div>

          </div>

          {/* Juri Feedback & Recent Inputs Bar */}
          <div className="p-4 rounded-2xl bg-[#14082B] border border-purple-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Input Terakhir Anda (Juri {selectedJuriId}):</span>
              {myRecentClicks.length === 0 ? (
                <span className="text-purple-400/60 italic">Belum ada input</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {myRecentClicks.map((click) => (
                    <span 
                      key={click.id}
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                        click.corner === 'merah'
                          ? 'bg-red-950 text-red-300 border border-red-700'
                          : 'bg-blue-950 text-blue-300 border border-blue-700'
                      }`}
                    >
                      {click.corner} {click.pointType} (+{click.points})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[11px] text-purple-300/70">
              Sistem Digital IPSI 2026 · Otomatis Konsensus 2/3 Juri
            </div>
          </div>

        </div>
      ) : (
        /* MODE SENI / JURUS EVALUATION PAD */
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-[#14082B] border border-purple-800/40 shadow-xl space-y-6">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-purple-900/40">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Evaluasi Seni / Jurus · Juri {selectedJuriId}
                </div>
                <h2 className="text-xl font-black text-white">
                  {matchState.seni.pesilatName}
                </h2>
                <div className="text-xs text-purple-300 mt-0.5">
                  {matchState.seni.kontingen} · Nomor Undian: <strong>{matchState.seni.nomorUndian}</strong> · Kategori: <strong>{matchState.seni.subCategory.toUpperCase()}</strong>
                </div>
              </div>

              {/* Total Juri Score Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-indigo-600/20 border border-amber-500/40 text-right">
                <div className="text-xs text-amber-300 font-semibold uppercase">Total Nilai Juri {selectedJuriId}</div>
                <div className="text-4xl font-black font-mono-num text-amber-400">
                  {currentSeniEval.finalJuriScore.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Assessment Component 1: Kebenaran Gerak (9.90 Base) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    1. Nilai Kebenaran Gerak (Nilai Dasar: 9.90)
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-300">
                  Potongan: -{currentSeniEval.totalPotonganGerak.toFixed(2)} Poin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Kesalahan Minor Gerakan (-0.01) */}
                <div className="p-4 rounded-2xl bg-[#1D0C3C] border border-purple-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Kesalahan Minor Gerak</div>
                      <div className="text-xs text-purple-300">Potongan -0.01 per kesalahan</div>
                    </div>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {minorCount}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSeniUpdate(Math.max(0, minorCount - 1), majorCount, kemantapan)}
                      className="flex-1 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 font-bold rounded-xl text-xs"
                    >
                      -1 Kurang
                    </button>
                    <button
                      onClick={() => handleSeniUpdate(minorCount + 1, majorCount, kemantapan)}
                      className="flex-1 py-2 bg-red-900/80 hover:bg-red-800 border border-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      +1 Kesalahan (-0.01)
                    </button>
                  </div>
                </div>

                {/* Kesalahan Fatal Gerak / Urutan (-0.05) */}
                <div className="p-4 rounded-2xl bg-[#1D0C3C] border border-purple-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Kesalahan Urutan / Gerakan</div>
                      <div className="text-xs text-purple-300">Potongan -0.05 per kesalahan</div>
                    </div>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {majorCount}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSeniUpdate(minorCount, Math.max(0, majorCount - 1), kemantapan)}
                      className="flex-1 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 font-bold rounded-xl text-xs"
                    >
                      -1 Kurang
                    </button>
                    <button
                      onClick={() => handleSeniUpdate(minorCount, majorCount + 1, kemantapan)}
                      className="flex-1 py-2 bg-red-900/80 hover:bg-red-800 border border-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      +1 Kesalahan (-0.05)
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Assessment Component 2: Kemantapan, Stamina & Penjiwaan (0.01 - 1.00) */}
            <div className="space-y-4 pt-4 border-t border-purple-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    2. Nilai Kemantapan, Penghayatan & Stamina
                  </h3>
                </div>
                <span className="text-lg font-black font-mono text-emerald-400">
                  +{kemantapan.toFixed(2)}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#1D0C3C] border border-purple-700/50 space-y-4">
                <p className="text-xs text-slate-300">
                  Geser atau pilih tingkat kemantapan gerak, irama, stamina, dan penjiwaan pesilat (skala 0.01 s/d 1.00).
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0.01}
                    max={1.00}
                    step={0.01}
                    value={kemantapan}
                    onChange={(e) => handleSeniUpdate(minorCount, majorCount, Number(e.target.value))}
                    className="flex-1 h-3 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="text-xl font-bold font-mono text-amber-300 min-w-[60px] text-right">
                    {kemantapan.toFixed(2)}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[0.80, 0.85, 0.90, 0.92, 0.95, 0.98].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleSeniUpdate(minorCount, majorCount, val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        kemantapan === val
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-purple-950 hover:bg-purple-900 text-purple-200'
                      }`}
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Sync Confirmation */}
            <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-between text-xs">
              <span className="text-purple-300">
                Nilai Juri {selectedJuriId} tersinkronkan otomatis ke Dewan dan Layar Monitor.
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Live Terhubung
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
