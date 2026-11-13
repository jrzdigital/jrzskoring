import React from 'react';
import { 
  Trophy, 
  Clock, 
  Video, 
  Flame, 
  ShieldAlert, 
  Users, 
  Award, 
  Check, 
  X,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

export const ArenaMonitorView: React.FC = () => {
  const { match, language } = useTournament();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isFinished = match.status === 'selesai' && match.winner !== 'none';

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col justify-between p-2 sm:p-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d033a] via-[#0b0117] to-black relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: TOURNAMENT & CATEGORY BANNER */}
      <div className="relative z-10 bg-gradient-to-r from-black/80 via-purple-950/70 to-black/80 border border-purple-500/30 rounded-2xl px-4 py-2.5 sm:px-6 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 border border-purple-400/40 flex items-center justify-center text-amber-300 shadow glow-purple">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-chakra font-black text-sm sm:text-lg tracking-wider text-white uppercase flex items-center gap-2">
              <span>{match.tournamentName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold uppercase hidden md:inline-block">
                {match.competitionLevel}
              </span>
            </h1>
            <div className="text-xs text-purple-300 flex items-center gap-2">
              <span className="font-bold text-amber-400">{match.arena}</span>
              <span>•</span>
              <span className="text-white font-semibold">{match.matchNumber}</span>
              <span>•</span>
              <span className="uppercase text-purple-200">{match.roundStage}</span>
            </div>
          </div>
        </div>

        {/* Discipline Tag */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Kategori & Kelas</span>
            <span className="font-chakra font-extrabold text-sm sm:text-base text-amber-300 uppercase">
              {match.category} • {match.classPool} ({match.gender})
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ARENA DISPLAY (TANDING OR SENI) */}
      {match.category === 'tanding' ? (
        <div className="relative z-10 flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center my-3">
          {/* ================= RED CORNER DISPLAY (5 COLS) ================= */}
          <div className="col-span-5 h-full flex flex-col justify-between bg-gradient-to-br from-red-950/80 via-black to-red-950/40 border-2 border-red-500/60 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden glow-red">
            {/* Corner Badge */}
            <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shadow-md glow-red" />
                <span className="font-chakra font-black text-base sm:text-2xl text-red-400 tracking-wider uppercase">
                  SUDUT MERAH
                </span>
              </div>

              {/* Video Replay (VR) Indicator */}
              <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-red-500/40 text-xs">
                <Video className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-200 font-bold">VR: {match.redCorner.vrQuota}/2</span>
                {match.redCorner.vrActiveRequest === 'pending' && (
                  <span className="ml-1 text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                    REVIEW
                  </span>
                )}
              </div>
            </div>

            {/* Athlete Name & Contingent */}
            <div className="my-2 sm:my-4">
              <h2 className="font-chakra text-xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
                {match.redCorner.athleteName}
              </h2>
              <div className="text-sm sm:text-lg font-bold text-red-300 mt-1 uppercase flex items-center gap-2">
                <span>{match.redCorner.contingent}</span>
                <span className="text-gray-500">|</span>
                <span className="text-amber-300 font-semibold">{match.redCorner.countryOrCity}</span>
              </div>
            </div>

            {/* Giant Illuminated Score */}
            <div className="flex items-center justify-center my-2 sm:my-6 py-4 bg-black/70 rounded-2xl border border-red-500/40 shadow-inner">
              <span className="font-chakra text-7xl sm:text-8xl md:text-9xl font-black text-red-500 led-score tracking-tighter">
                {match.redCorner.score}
              </span>
            </div>

            {/* Round by Round & Fouls Summary */}
            <div className="space-y-2 border-t border-red-500/30 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-red-950/60 rounded-xl p-1.5 border border-red-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 1</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.redCorner.roundScores.round1}
                  </span>
                </div>
                <div className="bg-red-950/60 rounded-xl p-1.5 border border-red-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 2</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.redCorner.roundScores.round2}
                  </span>
                </div>
                <div className="bg-red-950/60 rounded-xl p-1.5 border border-red-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 3</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.redCorner.roundScores.round3}
                  </span>
                </div>
              </div>

              {/* Penalties Row */}
              <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-black/60 rounded-xl border border-red-500/20 text-red-200">
                <span className="font-semibold text-gray-400">Hukuman:</span>
                <div className="flex items-center gap-1.5">
                  {match.redCorner.fouls.binaan > 0 && (
                    <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      BN {match.redCorner.fouls.binaan}
                    </span>
                  )}
                  {match.redCorner.fouls.teguran1 && (
                    <span className="bg-amber-600 text-black px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      T1 (-1)
                    </span>
                  )}
                  {match.redCorner.fouls.teguran2 && (
                    <span className="bg-amber-600 text-black px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      T2 (-2)
                    </span>
                  )}
                  {match.redCorner.fouls.peringatan1 && (
                    <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      P1 (-5)
                    </span>
                  )}
                  {match.redCorner.fouls.peringatan2 && (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold animate-pulse">
                      P2 (-10)
                    </span>
                  )}
                  {!match.redCorner.fouls.teguran1 && !match.redCorner.fouls.peringatan1 && match.redCorner.fouls.binaan === 0 && (
                    <span className="text-gray-500 text-[10px]">Bersih / Tidak Ada</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= CENTER CLOCK & ROUND (2 COLS) ================= */}
          <div className="col-span-2 h-full flex flex-col items-center justify-center space-y-4">
            {/* Round Badge */}
            <div className="w-full text-center bg-gradient-to-b from-purple-950 to-black border border-purple-500/50 rounded-2xl py-2 px-3 shadow-xl glow-purple">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block">
                RONDE / ROUND
              </span>
              <span className="font-chakra text-3xl sm:text-4xl font-black text-amber-300">
                {match.currentRound}
              </span>
              <span className="text-[10px] text-gray-400 block font-semibold">
                DARI {match.totalRounds} BABAK
              </span>
            </div>

            {/* Central Glowing Timer */}
            <div className="w-full text-center bg-black/90 border-2 border-purple-400/50 rounded-3xl py-4 sm:py-6 px-2 shadow-2xl glow-purple relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-bold uppercase text-purple-300">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>WAKTU BERSIH</span>
              </div>
              <div className="font-chakra text-4xl sm:text-5xl md:text-6xl font-black text-white led-score mt-3">
                {formatTime(match.timerSeconds)}
              </div>
              <div className="mt-2">
                <span
                  className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    match.isTimerRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  }`}
                >
                  {match.isTimerRunning ? 'BERJALAN' : 'BERHENTI'}
                </span>
              </div>
            </div>

            {/* Strikes Comparison */}
            <div className="w-full bg-black/60 border border-purple-500/30 rounded-2xl p-2.5 text-center text-[10px] text-gray-300 space-y-1">
              <div className="font-bold text-purple-300 uppercase">Jatuhan Sah</div>
              <div className="flex items-center justify-around font-chakra text-sm font-extrabold">
                <span className="text-red-400">{match.redCorner.strikes.jatuhan}x</span>
                <span className="text-gray-600">:</span>
                <span className="text-blue-400">{match.blueCorner.strikes.jatuhan}x</span>
              </div>
            </div>
          </div>

          {/* ================= BLUE CORNER DISPLAY (5 COLS) ================= */}
          <div className="col-span-5 h-full flex flex-col justify-between bg-gradient-to-bl from-blue-950/80 via-black to-blue-950/40 border-2 border-blue-500/60 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden glow-blue">
            {/* Corner Badge */}
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse shadow-md glow-blue" />
                <span className="font-chakra font-black text-base sm:text-2xl text-blue-400 tracking-wider uppercase">
                  SUDUT BIRU
                </span>
              </div>

              {/* Video Replay (VR) Indicator */}
              <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-blue-500/40 text-xs">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-200 font-bold">VR: {match.blueCorner.vrQuota}/2</span>
                {match.blueCorner.vrActiveRequest === 'pending' && (
                  <span className="ml-1 text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                    REVIEW
                  </span>
                )}
              </div>
            </div>

            {/* Athlete Name & Contingent */}
            <div className="my-2 sm:my-4">
              <h2 className="font-chakra text-xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
                {match.blueCorner.athleteName}
              </h2>
              <div className="text-sm sm:text-lg font-bold text-blue-300 mt-1 uppercase flex items-center gap-2">
                <span>{match.blueCorner.contingent}</span>
                <span className="text-gray-500">|</span>
                <span className="text-amber-300 font-semibold">{match.blueCorner.countryOrCity}</span>
              </div>
            </div>

            {/* Giant Illuminated Score */}
            <div className="flex items-center justify-center my-2 sm:my-6 py-4 bg-black/70 rounded-2xl border border-blue-500/40 shadow-inner">
              <span className="font-chakra text-7xl sm:text-8xl md:text-9xl font-black text-blue-500 led-score tracking-tighter">
                {match.blueCorner.score}
              </span>
            </div>

            {/* Round by Round & Fouls Summary */}
            <div className="space-y-2 border-t border-blue-500/30 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-950/60 rounded-xl p-1.5 border border-blue-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 1</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.blueCorner.roundScores.round1}
                  </span>
                </div>
                <div className="bg-blue-950/60 rounded-xl p-1.5 border border-blue-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 2</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.blueCorner.roundScores.round2}
                  </span>
                </div>
                <div className="bg-blue-950/60 rounded-xl p-1.5 border border-blue-500/30">
                  <span className="text-[10px] text-gray-400 block font-semibold">Babak 3</span>
                  <span className="font-chakra font-bold text-base text-white">
                    {match.blueCorner.roundScores.round3}
                  </span>
                </div>
              </div>

              {/* Penalties Row */}
              <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-black/60 rounded-xl border border-blue-500/20 text-blue-200">
                <span className="font-semibold text-gray-400">Hukuman:</span>
                <div className="flex items-center gap-1.5">
                  {match.blueCorner.fouls.binaan > 0 && (
                    <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      BN {match.blueCorner.fouls.binaan}
                    </span>
                  )}
                  {match.blueCorner.fouls.teguran1 && (
                    <span className="bg-amber-600 text-black px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      T1 (-1)
                    </span>
                  )}
                  {match.blueCorner.fouls.teguran2 && (
                    <span className="bg-amber-600 text-black px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      T2 (-2)
                    </span>
                  )}
                  {match.blueCorner.fouls.peringatan1 && (
                    <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      P1 (-5)
                    </span>
                  )}
                  {match.blueCorner.fouls.peringatan2 && (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold animate-pulse">
                      P2 (-10)
                    </span>
                  )}
                  {!match.blueCorner.fouls.teguran1 && !match.blueCorner.fouls.peringatan1 && match.blueCorner.fouls.binaan === 0 && (
                    <span className="text-gray-500 text-[10px]">Bersih / Tidak Ada</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SENI / JURUS BIG MONITOR DISPLAY ================= */
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full my-4">
          <div className="bg-gradient-to-r from-purple-950/90 via-black to-purple-950/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl text-center glow-purple">
            <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              KATEGORI SENI PERSILAT 2026: {match.category.toUpperCase()}
            </span>
            <h2 className="font-chakra text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              {match.seniCompetitor.athleteName}
            </h2>
            <p className="text-base sm:text-xl font-bold text-purple-300 mt-1">
              {match.seniCompetitor.contingent} ({match.seniCompetitor.countryOrCity})
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
              {/* Performance Timer */}
              <div className="bg-black/80 border border-purple-500/30 rounded-2xl p-4">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Waktu Penampilan</span>
                <span className="font-chakra text-4xl sm:text-5xl font-black text-white led-score">
                  {formatTime(match.timerSeconds)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Standar: 03:00 Menit</span>
              </div>

              {/* Realtime Final Score */}
              <div className="bg-gradient-to-b from-purple-900/60 to-black border-2 border-amber-400/50 rounded-2xl p-4 shadow-xl glow-gold">
                <span className="text-xs text-amber-300 uppercase font-extrabold block">TOTAL SKOR AKHIR</span>
                <span className="font-chakra text-5xl sm:text-6xl font-black text-amber-300 led-score">
                  {match.seniCompetitor.finalScore.toFixed(3)}
                </span>
                <span className="text-[11px] text-amber-200 block mt-1">Nilai Resmi Dewan Juri</span>
              </div>

              {/* Mistake Deductions */}
              <div className="bg-black/80 border border-purple-500/30 rounded-2xl p-4">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Deviasi Gerakan</span>
                <span className="font-chakra text-4xl sm:text-5xl font-black text-red-400 led-score">
                  -{(match.seniCompetitor.movementMistakes * 0.01).toFixed(2)}
                </span>
                <span className="text-[10px] text-red-300/80 block mt-1">
                  {match.seniCompetitor.movementMistakes} Kesalahan Gerak
                </span>
              </div>
            </div>

            {/* Detail Components */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-black/60 p-3 rounded-2xl border border-purple-500/30">
              <div>
                <span className="text-gray-400 block">Skor Kebenaran:</span>
                <span className="font-chakra font-bold text-sm text-white">9.90 Standar</span>
              </div>
              <div>
                <span className="text-gray-400 block">Kemantapan/Irama:</span>
                <span className="font-chakra font-bold text-sm text-amber-300">
                  +{match.seniCompetitor.staminaHarmonyScore.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Hukuman Senjata:</span>
                <span className="font-chakra font-bold text-sm text-white">
                  {match.seniCompetitor.penalties.weaponDrop ? '-0.50' : '0.00'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Hukuman Arena/Baju:</span>
                <span className="font-chakra font-bold text-sm text-white">
                  {(match.seniCompetitor.penalties.outOfArena ? 0.50 : 0) + (match.seniCompetitor.penalties.costumeViolation ? 0.50 : 0) > 0 ? '-0.50' : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR: REALTIME JUDGE CONSENSUS LAMPS */}
      <div className="relative z-10 bg-black/80 border border-purple-500/30 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="font-chakra font-bold text-purple-300 uppercase">
            LAMPU KONSENSUS JURI:
          </span>
        </div>

        {/* 3 or 5 Judge Indicator Boxes */}
        <div className="flex items-center gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5].slice(0, match.activeJudgeCount).map((jId) => {
            const recent = match.recentJudgeVotes.find(
              (v) => v.judgeId === jId && v.timestamp >= Date.now() - 2500
            );

            return (
              <div
                key={jId}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-chakra font-bold text-xs transition-all ${
                  recent
                    ? recent.corner === 'red'
                      ? 'bg-red-600 border-red-300 text-white shadow-lg glow-red scale-110'
                      : 'bg-blue-600 border-blue-300 text-white shadow-lg glow-blue scale-110'
                    : 'bg-purple-950/30 border-purple-500/20 text-gray-500'
                }`}
              >
                <span>J{jId}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    recent
                      ? recent.corner === 'red'
                        ? 'bg-white'
                        : 'bg-white'
                      : 'bg-gray-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="text-gray-400 text-[11px] font-medium hidden sm:block">
          Sistem Resmi PERSILAT • Ikatan Pencak Silat Indonesia (IPSI) 2026
        </div>
      </div>

      {/* WINNER CHAMPION OVERLAY MODAL */}
      {isFinished && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-2xl w-full bg-gradient-to-b from-purple-950 via-black to-purple-950 border-2 border-amber-400/60 rounded-3xl p-8 shadow-2xl glow-gold relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-3xl flex items-center justify-center text-black shadow-2xl glow-gold animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block mb-1">
              KEPUTUSAN RESMI DEWAN PERTANDINGAN
            </span>

            <h2 className="font-chakra text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-2">
              PEMENANG SUDUT {match.winner.toUpperCase()}
            </h2>

            <div
              className={`text-2xl sm:text-4xl font-black uppercase tracking-wide my-4 py-3 px-6 rounded-2xl border-2 inline-block ${
                match.winner === 'red'
                  ? 'bg-red-600/30 border-red-400 text-red-300 glow-red'
                  : 'bg-blue-600/30 border-blue-400 text-blue-300 glow-blue'
              }`}
            >
              {match.winner === 'red' ? match.redCorner.athleteName : match.blueCorner.athleteName}
            </div>

            <p className="text-base text-gray-300 mb-6 font-semibold">
              {match.winDescription || `Menang ${match.winType?.toUpperCase()}`}
            </p>

            <div className="flex items-center justify-center gap-4 text-xs font-bold">
              <span className="text-amber-400 font-chakra text-lg">
                Skor Akhir: {match.redCorner.score} - {match.blueCorner.score}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
