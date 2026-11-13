import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  PlusCircle, 
  Save, 
  Award, 
  Users, 
  Layers, 
  Clock, 
  Swords, 
  ChevronRight,
  ShieldAlert,
  Flame,
  FileSpreadsheet,
  Globe
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { MatchCategory, CompetitionLevel } from '../../types/scoring';

export const SecretaryView: React.FC = () => {
  const {
    match,
    updateMatch,
    startTimer,
    pauseTimer,
    resetTimer,
    setRound,
    setCategory,
    resetMatchScores,
    createNewMatch,
    language,
    history,
  } = useTournament();

  const [customMinutes, setCustomMinutes] = useState<number>(Math.floor(match.roundDurationSeconds / 60));
  const [customSeconds, setCustomSeconds] = useState<number>(match.roundDurationSeconds % 60);

  const categories: { id: MatchCategory; label: string; desc: string }[] = [
    { id: 'tanding', label: 'TANDING', desc: 'Tarung 3 Babak (Pukulan, Tendangan, Jatuhan)' },
    { id: 'tunggal', label: 'TUNGGAL', desc: 'Jurus Baku 100 Gerak (Tangan Kosong, Golok, Toya)' },
    { id: 'ganda', label: 'GANDA', desc: 'Koreografi Serang Bela 2 Pesilat Bersenjata' },
    { id: 'regu', label: 'REGU', desc: 'Kekompakan Jurus Baku 3 Pesilat' },
    { id: 'solo_kreatif', label: 'SOLO KREATIF', desc: 'Koreografi Bebas Senjata Tradisional & Musik' },
  ];

  const competitionLevels: { id: CompetitionLevel; label: string }[] = [
    { id: 'kota', label: 'Kota / Kabupaten' },
    { id: 'provinsi', label: 'Kejurda / Provinsi' },
    { id: 'nasional', label: 'Kejurnas / Nasional (PON)' },
    { id: 'internasional', label: 'Internasional / Kejuaraan Dunia' },
  ];

  const arenas = ['Gelanggang A (Arena 1)', 'Gelanggang B (Arena 2)', 'Gelanggang C (Arena 3)', 'Gelanggang D (Arena 4)'];

  const stages = [
    'Babak Penyisihan',
    'Babak 16 Besar',
    'Babak Perempat Final',
    'Babak Semifinal',
    'Babak Final (Perebutan Emas)',
    'Perebutan Juara 3 (Perunggu)'
  ];

  const weightClasses = [
    'Kelas Usia Dini (26 - 28 Kg)',
    'Kelas Pra Remaja A (30 - 33 Kg)',
    'Kelas Remaja C (43 - 47 Kg)',
    'Kelas Dewasa A (45 - 50 Kg)',
    'Kelas Dewasa B (50 - 55 Kg)',
    'Kelas Dewasa C (55 - 60 Kg)',
    'Kelas Dewasa D (60 - 65 Kg)',
    'Kelas Dewasa E (65 - 70 Kg)',
    'Kelas Dewasa F (70 - 75 Kg)',
    'Kelas Dewasa G (75 - 80 Kg)',
    'Kelas Bebas Open (Open Class)',
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyDuration = () => {
    const total = customMinutes * 60 + customSeconds;
    if (total > 0) {
      updateMatch((prev) => ({
        ...prev,
        roundDurationSeconds: total,
        timerSeconds: total,
        isTimerRunning: false,
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Category Ribbon */}
      <div className="bg-gradient-to-r from-purple-950/70 via-black to-purple-950/70 border border-purple-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold tracking-widest text-purple-300 uppercase">
            {language === 'id' ? 'Pilih Kategori Pertandingan (Persilat 2026)' : 'Select Match Category'}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {categories.map((cat) => {
            const isSelected = match.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-300 text-white shadow-lg glow-purple scale-[1.02]'
                    : 'bg-black/50 border-purple-500/20 text-gray-300 hover:bg-purple-900/30 hover:border-purple-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-chakra font-extrabold text-sm tracking-wider uppercase">
                    {cat.label}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                </div>
                <p className="text-[11px] text-purple-200/80 line-clamp-2 leading-tight">
                  {cat.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Tournament Config & Match Timer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Match & Athletes Setup (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tournament Parameters */}
          <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <h3 className="font-chakra text-base font-bold text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {language === 'id' ? 'Pengaturan Gelanggang & Turnamen' : 'Tournament & Arena Config'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nama Kejuaraan</label>
                <input
                  type="text"
                  value={match.tournamentName}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, tournamentName: e.target.value }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Skala Kompetisi</label>
                <select
                  value={match.competitionLevel}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, competitionLevel: e.target.value as CompetitionLevel }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                >
                  {competitionLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id} className="bg-slate-900">
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Gelanggang / Matras</label>
                <select
                  value={match.arena}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, arena: e.target.value }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                >
                  {arenas.map((a) => (
                    <option key={a} value={a} className="bg-slate-900">{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nomor Partai / Match</label>
                <input
                  type="text"
                  value={match.matchNumber}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, matchNumber: e.target.value }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tahap Babak</label>
                <select
                  value={match.roundStage}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, roundStage: e.target.value }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                >
                  {stages.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Kelas & Kategori Umur</label>
                <select
                  value={match.classPool}
                  onChange={(e) => updateMatch((prev) => ({ ...prev, classPool: e.target.value }))}
                  className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                >
                  {weightClasses.map((w) => (
                    <option key={w} value={w} className="bg-slate-900">{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Gender Atlet</label>
                <div className="flex gap-2">
                  {(['putra', 'putri'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => updateMatch((prev) => ({ ...prev, gender: g }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        match.gender === g
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-black/40 border border-purple-500/20 text-gray-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Jumlah Juri Persilat</label>
                <div className="flex gap-2">
                  {([3, 5] as const).map((count) => (
                    <button
                      key={count}
                      onClick={() => updateMatch((prev) => ({ ...prev, activeJudgeCount: count }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        match.activeJudgeCount === count
                          ? 'bg-amber-500 text-black shadow font-extrabold'
                          : 'bg-black/40 border border-purple-500/20 text-gray-400 hover:text-white'
                      }`}
                    >
                      {count} Juri
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Athletes Data for Tanding OR Seni */}
          {match.category === 'tanding' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Red Corner Form */}
              <div className="bg-gradient-to-br from-red-950/50 to-black border-2 border-red-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-chakra font-black text-sm text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    SUDUT MERAH
                  </span>
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                    Skor: {match.redCorner.score}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-gray-400 font-semibold">Nama Pesilat</label>
                    <input
                      type="text"
                      value={match.redCorner.athleteName}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          redCorner: { ...prev.redCorner, athleteName: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-red-500/40 rounded-xl px-3 py-2 text-white font-bold tracking-wide focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold">Kontingen / Pengda</label>
                    <input
                      type="text"
                      value={match.redCorner.contingent}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          redCorner: { ...prev.redCorner, contingent: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-red-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold">Negara / Kota</label>
                    <input
                      type="text"
                      value={match.redCorner.countryOrCity}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          redCorner: { ...prev.redCorner, countryOrCity: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-red-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              </div>

              {/* Blue Corner Form */}
              <div className="bg-gradient-to-br from-blue-950/50 to-black border-2 border-blue-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-chakra font-black text-sm text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    SUDUT BIRU
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Skor: {match.blueCorner.score}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-gray-400 font-semibold">Nama Pesilat</label>
                    <input
                      type="text"
                      value={match.blueCorner.athleteName}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          blueCorner: { ...prev.blueCorner, athleteName: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-blue-500/40 rounded-xl px-3 py-2 text-white font-bold tracking-wide focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold">Kontingen / Pengda</label>
                    <input
                      type="text"
                      value={match.blueCorner.contingent}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          blueCorner: { ...prev.blueCorner, contingent: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-blue-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold">Negara / Kota</label>
                    <input
                      type="text"
                      value={match.blueCorner.countryOrCity}
                      onChange={(e) =>
                        updateMatch((prev) => ({
                          ...prev,
                          blueCorner: { ...prev.blueCorner, countryOrCity: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full mt-1 bg-black/60 border border-blue-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Seni Competitor Form */
            <div className="bg-gradient-to-br from-purple-950/60 to-black border-2 border-purple-500/50 rounded-2xl p-4 shadow-xl">
              <span className="font-chakra font-black text-sm text-purple-300 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Flame className="w-4 h-4 text-amber-400" />
                DATA PESILAT SENI ({match.category.toUpperCase()})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-400 font-semibold">Nama Pesilat / Regu</label>
                  <input
                    type="text"
                    value={match.seniCompetitor.athleteName}
                    onChange={(e) =>
                      updateMatch((prev) => ({
                        ...prev,
                        seniCompetitor: { ...prev.seniCompetitor, athleteName: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full mt-1 bg-black/60 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-bold tracking-wide focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold">Kontingen</label>
                  <input
                    type="text"
                    value={match.seniCompetitor.contingent}
                    onChange={(e) =>
                      updateMatch((prev) => ({
                        ...prev,
                        seniCompetitor: { ...prev.seniCompetitor, contingent: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full mt-1 bg-black/60 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold">Senjata yang Digunakan</label>
                  <input
                    type="text"
                    value={match.seniCompetitor.weaponUsed || ''}
                    onChange={(e) =>
                      updateMatch((prev) => ({
                        ...prev,
                        seniCompetitor: { ...prev.seniCompetitor, weaponUsed: e.target.value },
                      }))
                    }
                    placeholder="Contoh: Golok / Parang & Toya"
                    className="w-full mt-1 bg-black/60 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold">Skor Standar Baku</label>
                  <input
                    type="number"
                    step="0.01"
                    value={match.seniCompetitor.baseScore}
                    onChange={(e) =>
                      updateMatch((prev) => ({
                        ...prev,
                        seniCompetitor: { ...prev.seniCompetitor, baseScore: parseFloat(e.target.value) || 9.90 },
                      }))
                    }
                    className="w-full mt-1 bg-black/60 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timer Controller & Match Management (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Master Arena Clock Panel */}
          <div className="bg-gradient-to-b from-purple-950/70 via-black to-black border border-purple-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                {match.category === 'tanding' ? `BABAK ${match.currentRound} DARI ${match.totalRounds}` : 'WAKTU PENAMPILAN SENI'}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  match.isTimerRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {match.isTimerRunning ? 'BERJALAN' : 'BERHENTI / PAUSE'}
              </span>
            </div>

            {/* Giant Digital Time Clock */}
            <div className="my-3 py-3 text-center bg-black/80 rounded-2xl border border-purple-500/30 shadow-inner">
              <span className="font-chakra text-6xl sm:text-7xl font-extrabold tracking-tight text-white led-score">
                {formatTime(match.timerSeconds)}
              </span>
            </div>

            {/* Timer Master Controls */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {!match.isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-chakra font-bold text-sm tracking-wider uppercase rounded-xl text-white shadow-lg active:scale-95 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Mulai
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="py-3 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 font-chakra font-bold text-sm tracking-wider uppercase rounded-xl text-white shadow-lg active:scale-95 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  Jeda
                </button>
              )}

              <button
                onClick={resetTimer}
                className="py-3 px-3 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 font-chakra font-bold text-sm tracking-wider uppercase rounded-xl text-purple-200 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>

              <button
                onClick={() => {
                  const nextR = match.currentRound < match.totalRounds ? match.currentRound + 1 : 1;
                  setRound(nextR);
                }}
                className="py-3 px-3 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 font-chakra font-bold text-sm tracking-wider uppercase rounded-xl text-indigo-200 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
              >
                Babak +
              </button>
            </div>

            {/* Babak Selector Tabs */}
            {match.category === 'tanding' && (
              <div className="flex gap-2">
                {[1, 2, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRound(r)}
                    className={`flex-1 py-2 rounded-xl text-xs font-chakra font-extrabold tracking-wider uppercase transition-all ${
                      match.currentRound === r
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow glow-purple'
                        : 'bg-black/40 border border-purple-500/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    Babak {r}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Timer Duration Setup */}
            <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Ubah Durasi Standar:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-black/60 border border-purple-500/30 rounded-lg text-center py-1 text-white"
                />
                <span className="text-gray-400">m</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-12 bg-black/60 border border-purple-500/30 rounded-lg text-center py-1 text-white"
                />
                <span className="text-gray-400">s</span>
                <button
                  onClick={handleApplyDuration}
                  className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded-lg font-bold text-white text-[11px]"
                >
                  Set
                </button>
              </div>
            </div>
          </div>

          {/* Match State Actions: New Match & Reset */}
          <div className="bg-black/50 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Kontrol Partai & Riwayat
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Buat partai baru? Pertandingan saat ini akan diarsipkan ke riwayat.')) {
                    createNewMatch();
                  }
                }}
                className="py-2.5 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-xl text-xs font-bold text-white shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Partai Selanjutnya
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Reset seluruh skor pertandingan saat ini kembali ke 0?')) {
                    resetMatchScores();
                  }
                }}
                className="py-2.5 px-3 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 rounded-xl text-xs font-bold text-red-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Skor Partai
              </button>
            </div>

            {/* Quick Match History Count */}
            <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Pertandingan Tersimpan: <strong>{history.length}</strong> partai</span>
              <span className="text-purple-300 font-medium">Persilat/IPSI Rules 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
