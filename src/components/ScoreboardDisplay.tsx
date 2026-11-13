import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ShieldAlert, 
  Award, 
  Video, 
  Check, 
  X,
  Volume2
} from 'lucide-react';
import { MatchData, ScoreEntry } from '../types/silat';
import { calculateMatchSummary, formatTime } from '../utils/rules';
import { silatAudio } from '../utils/audio';

interface ScoreboardDisplayProps {
  match: MatchData;
  onUpdateMatch: (match: MatchData) => void;
  onOpenDewan: () => void;
  onOpenJuryPad: () => void;
  onDeclareWinner: () => void;
}

export const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({
  match,
  onUpdateMatch,
  onOpenDewan,
  onOpenJuryPad,
  onDeclareWinner,
}) => {
  const summary = calculateMatchSummary(match);

  // Timer controls
  const handleToggleTimer = () => {
    if (match.timerStatus === 'RUNNING') {
      onUpdateMatch({
        ...match,
        timerStatus: 'PAUSED',
      });
      // Sesuai instruksi: jeda / pause TANPA SUARA
    } else {
      const isResuming = match.timeRemaining < match.roundDurationSeconds && match.timeRemaining > 0;
      onUpdateMatch({
        ...match,
        timerStatus: 'RUNNING',
      });
      // Sound buzzer hanya pada saat MULAI babak (bukan saat lanjutkan/resume dari jeda)
      if (!isResuming) {
        silatAudio.playBuzzer();
      }
    }
  };

  const handleResetTimer = () => {
    onUpdateMatch({
      ...match,
      timerStatus: 'STOPPED',
      timeRemaining: match.roundDurationSeconds,
    });
  };

  const handleNextRound = () => {
    if (match.currentRound < match.maxRounds) {
      const nextRound = match.currentRound + 1;
      onUpdateMatch({
        ...match,
        currentRound: nextRound,
        timeRemaining: match.roundDurationSeconds,
        timerStatus: 'STOPPED',
      });
    } else {
      onDeclareWinner();
    }
  };

  const handleSoundCheck = () => {
    silatAudio.playBuzzer();
  };

  // Video Challenge actions
  const handleResolveVideoChallenge = (approved: boolean) => {
    if (!match.videoChallenge) return;
    const isRed = match.videoChallenge.corner === 'merah';
    
    // If rejected, lose card. If approved, retain card.
    const updatedRedCards = isRed && !approved 
      ? Math.max(0, match.redCardsRemaining - 1) 
      : match.redCardsRemaining;
    const updatedBlueCards = !isRed && !approved 
      ? Math.max(0, match.blueCardsRemaining - 1) 
      : match.blueCardsRemaining;

    onUpdateMatch({
      ...match,
      redCardsRemaining: updatedRedCards,
      blueCardsRemaining: updatedBlueCards,
      videoChallenge: null,
    });
    silatAudio.playWhistle();
  };

  // Recent scores (last 5)
  const recentScores = [...match.scores].reverse().slice(0, 5);

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* Top Banner: Arena & Match Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
            {match.tournamentName}
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <span>{match.gelanggang.toUpperCase()}</span>
            <span className="text-slate-500 font-normal">·</span>
            <span>PARTAI {match.partaiNumber}</span>
            <span className="text-slate-500 font-normal">·</span>
            <span className="text-slate-300 font-medium">
              {match.weightClass} ({match.gender})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-md font-medium">
            {match.babakPenyisihan}
          </span>
          <button
            onClick={handleSoundCheck}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-md transition-colors"
            title="Uji Bunyi Sound Buzzer Arena"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Buzzer</span>
          </button>
        </div>
      </div>

      {/* VAR / Video Challenge Alert Banner if Active */}
      {match.videoChallenge && (
        <div className="bg-amber-950/80 border border-amber-600/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-300">
                PERMINTAAN VIDEO REPLAY (VAR) · SUDUT {match.videoChallenge.corner.toUpperCase()}
              </div>
              <div className="text-xs text-amber-200/80">
                Alasan: {match.videoChallenge.reason || 'Verifikasi teknik / jatuhan oleh pelatih'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResolveVideoChallenge(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              <Check className="w-4 h-4" />
              <span>VAR Diterima</span>
            </button>
            <button
              onClick={() => handleResolveVideoChallenge(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
            >
              <X className="w-4 h-4" />
              <span>VAR Ditolak (-1 Kartu)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Scoreboard Stadium Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* SUDUT MERAH (RED CORNER) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-red-950/70 via-red-900/40 to-slate-900 border-2 border-red-700/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-red-950/30">
          <div>
            {/* Header Sudut Merah */}
            <div className="flex items-center justify-between border-b border-red-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm shadow-red-400"></span>
                <span className="text-sm font-extrabold uppercase tracking-widest text-red-400">
                  SUDUT MERAH
                </span>
              </div>
              <div className="text-xs font-mono text-red-300">
                Kartu VAR: {match.redCardsRemaining}/2
              </div>
            </div>

            {/* Fighter Name & School */}
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight line-clamp-1">
                {match.redFighter.name}
              </h2>
              <div className="text-sm font-semibold text-red-300 mt-1 flex items-center gap-2">
                <span>{match.redFighter.contingent}</span>
                {match.redFighter.school && (
                  <>
                    <span className="text-red-500">·</span>
                    <span className="text-slate-300 font-normal">{match.redFighter.school}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Giant Score Display */}
          <div className="py-4 text-center my-auto">
            <div className="font-score text-7xl sm:text-9xl font-bold tracking-tight text-white drop-shadow-lg select-none">
              {summary.redTotal}
            </div>
            <div className="text-xs uppercase tracking-widest text-red-400 font-medium">
              TOTAL POIN MERAH
            </div>
          </div>

          {/* Bottom Breakdown & Indicators */}
          <div className="space-y-3 pt-4 border-t border-red-900/80">
            {/* Round by Round score pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[1, 2, 3].map((r) => (
                <div 
                  key={r}
                  className={`py-1.5 px-2 rounded-lg border text-xs ${
                    match.currentRound === r
                      ? 'bg-red-900/70 border-red-500 text-white font-bold'
                      : 'bg-slate-900/60 border-red-950 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-red-400 uppercase">Babak {r}</div>
                  <div className="text-base font-bold font-mono">
                    {summary.redByRound[r]?.totalRoundPoints ?? 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Penalties & Jatuhan Row */}
            <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Jatuhan:</span>
                <span className="font-bold text-amber-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {summary.redJatuhanTotal}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Binaan:</span>
                <span className="font-bold text-slate-200 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {summary.redPenalties.binaan}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Teguran:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
                  summary.redPenalties.teguran2 
                    ? 'bg-red-800 text-white border-red-600'
                    : summary.redPenalties.teguran1
                    ? 'bg-amber-900/60 text-amber-300 border-amber-700'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                  {summary.redPenalties.teguran2 ? 'II (-2)' : summary.redPenalties.teguran1 ? 'I (-1)' : '0'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Peringatan:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
                  summary.redPenalties.peringatan2
                    ? 'bg-red-600 text-white border-red-400'
                    : summary.redPenalties.peringatan1
                    ? 'bg-orange-800 text-orange-200 border-orange-600'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                  {summary.redPenalties.peringatan2 ? 'II (-10)' : summary.redPenalties.peringatan1 ? 'I (-5)' : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: TIMER & ARENA CONTROL */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-lg">
          {/* Round Header */}
          <div className="w-full">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              STATUS PERTANDINGAN
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider mt-1">
              {match.timerStatus === 'REST' ? 'ISTIRAHAT' : `BABAK ${match.currentRound}`}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              dari {match.maxRounds} Babak
            </div>
          </div>

          {/* Large Digital Stopwatch */}
          <div className="my-6">
            <div className={`font-score text-5xl sm:text-6xl font-bold tracking-tight select-none ${
              match.timerStatus === 'RUNNING' 
                ? 'text-emerald-400 animate-pulse' 
                : match.timeRemaining <= 10 
                ? 'text-red-500' 
                : 'text-white'
            }`}>
              {formatTime(match.timeRemaining)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mt-1">
              {match.timerStatus}
            </div>
          </div>

          {/* Match & Timer Action Buttons */}
          <div className="w-full space-y-2">
            <button
              onClick={handleToggleTimer}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                match.timerStatus === 'RUNNING'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {match.timerStatus === 'RUNNING' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Waktu</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Mulai Ronde</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleResetTimer}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700"
                title="Reset Waktu Ronde"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleNextRound}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700"
                title="Lanjut Babak / Selesai"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Babak+</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
              <button
                onClick={onOpenJuryPad}
                className="w-full py-2 px-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-semibold border border-blue-700 transition-colors"
              >
                Buka Pad Juri
              </button>
              <button
                onClick={onOpenDewan}
                className="w-full py-2 px-2 bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 rounded-lg text-xs font-semibold border border-amber-700/60 transition-colors"
              >
                Kontrol Dewan
              </button>
              <button
                onClick={onDeclareWinner}
                className="w-full py-2 px-2 bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 rounded-lg text-xs font-semibold border border-purple-700/60 transition-colors flex items-center justify-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Putusan Pemenang</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUDUT BIRU (BLUE CORNER) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-950/70 via-blue-900/40 to-slate-900 border-2 border-blue-700/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-blue-950/30">
          <div>
            {/* Header Sudut Biru */}
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></span>
                <span className="text-sm font-extrabold uppercase tracking-widest text-blue-400">
                  SUDUT BIRU
                </span>
              </div>
              <div className="text-xs font-mono text-blue-300">
                Kartu VAR: {match.blueCardsRemaining}/2
              </div>
            </div>

            {/* Fighter Name & School */}
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight line-clamp-1">
                {match.blueFighter.name}
              </h2>
              <div className="text-sm font-semibold text-blue-300 mt-1 flex items-center gap-2">
                <span>{match.blueFighter.contingent}</span>
                {match.blueFighter.school && (
                  <>
                    <span className="text-blue-500">·</span>
                    <span className="text-slate-300 font-normal">{match.blueFighter.school}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Giant Score Display */}
          <div className="py-4 text-center my-auto">
            <div className="font-score text-7xl sm:text-9xl font-bold tracking-tight text-white drop-shadow-lg select-none">
              {summary.blueTotal}
            </div>
            <div className="text-xs uppercase tracking-widest text-blue-400 font-medium">
              TOTAL POIN BIRU
            </div>
          </div>

          {/* Bottom Breakdown & Indicators */}
          <div className="space-y-3 pt-4 border-t border-blue-900/80">
            {/* Round by Round score pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[1, 2, 3].map((r) => (
                <div 
                  key={r}
                  className={`py-1.5 px-2 rounded-lg border text-xs ${
                    match.currentRound === r
                      ? 'bg-blue-900/70 border-blue-500 text-white font-bold'
                      : 'bg-slate-900/60 border-blue-950 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-blue-400 uppercase">Babak {r}</div>
                  <div className="text-base font-bold font-mono">
                    {summary.blueByRound[r]?.totalRoundPoints ?? 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Penalties & Jatuhan Row */}
            <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Jatuhan:</span>
                <span className="font-bold text-amber-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {summary.blueJatuhanTotal}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Binaan:</span>
                <span className="font-bold text-slate-200 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {summary.bluePenalties.binaan}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Teguran:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
                  summary.bluePenalties.teguran2 
                    ? 'bg-red-800 text-white border-red-600'
                    : summary.bluePenalties.teguran1
                    ? 'bg-amber-900/60 text-amber-300 border-amber-700'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                  {summary.bluePenalties.teguran2 ? 'II (-2)' : summary.bluePenalties.teguran1 ? 'I (-1)' : '0'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Peringatan:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded border ${
                  summary.bluePenalties.peringatan2
                    ? 'bg-red-600 text-white border-red-400'
                    : summary.bluePenalties.peringatan1
                    ? 'bg-orange-800 text-orange-200 border-orange-600'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                  {summary.bluePenalties.peringatan2 ? 'II (-10)' : summary.bluePenalties.peringatan1 ? 'I (-5)' : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Strike Activity Ticker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Log Penilaian Masuk:</span>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {recentScores.length === 0 ? (
            <span className="text-slate-500 italic">Belum ada poin yang tercatat di babak ini</span>
          ) : (
            recentScores.map((sc) => {
              const isRed = sc.corner === 'merah';
              return (
                <span
                  key={sc.id}
                  className={`px-2.5 py-1 rounded border font-mono font-medium flex items-center gap-1.5 ${
                    isRed
                      ? 'bg-red-950/60 border-red-800 text-red-300'
                      : 'bg-blue-950/60 border-blue-800 text-blue-300'
                  }`}
                >
                  <span className="font-bold">
                    {sc.judgeId === 0 ? 'Wasit' : `J${sc.judgeId}`}
                  </span>
                  <span>{sc.action.replace('_', ' ')}</span>
                  <span className={sc.points > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {sc.points > 0 ? `+${sc.points}` : sc.points}
                  </span>
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
