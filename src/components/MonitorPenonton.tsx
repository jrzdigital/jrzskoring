import React, { useState } from 'react';
import { TournamentState } from '../types';
import { calculateTandingScore, calculateSeniJurusScore, formatDuration } from '../utils/rules';
import {
  Maximize,
  Minimize,
  Radio,
  ShieldAlert,
  Award,
  Sparkles,
  Swords,
  Clock,
  Flame,
} from 'lucide-react';

interface MonitorPenontonProps {
  state: TournamentState;
  onSelectRole?: (role: any) => void;
}

export const MonitorPenonton: React.FC<MonitorPenontonProps> = ({ state }) => {
  const activeMatch = state.matches.find((m) => m.id === state.currentMatchId) || state.matches[0];
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!activeMatch) return null;

  const isTanding = activeMatch.category === 'tanding';
  const redScore = calculateTandingScore('red', activeMatch.actions, activeMatch.penalties, activeMatch.maxRounds);
  const blueScore = calculateTandingScore('blue', activeMatch.actions, activeMatch.penalties, activeMatch.maxRounds);

  const jurorScoresArray = Object.values(activeMatch.seniJurorScores || {});
  const seniResult = calculateSeniJurusScore(
    jurorScoresArray,
    activeMatch.seniCouncilPenalties || [],
    activeMatch.seniDurationSeconds || 180
  );

  const latestNotification = state.notifications[0];
  const showBanner = latestNotification && Date.now() - latestNotification.timestamp < 10000;

  return (
    <div className="min-h-screen bg-[#070212] text-slate-100 flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none overflow-x-hidden relative">
      {/* Dynamic Ambient Arena Lighting Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-blue-600 blur-[130px]" />
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-red-600 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-purple-600 blur-[150px]" />
      </div>

      {/* Arena TV Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-purple-900/50 bg-[#120726]/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              {state.tournamentName}
            </h1>
            <p className="text-[10px] sm:text-xs text-purple-300">
              {state.gelanggangActive} · {activeMatch.roundStage} ·{' '}
              <span className="font-bold text-amber-400">PARTAI #{activeMatch.partaiNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-xs font-semibold text-purple-200">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>TRANSMISI LIVE JURI</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-800/50 bg-purple-950/60 hover:bg-purple-900 text-purple-200 transition"
            title="Toggle Fullscreen TV Layar Lebar"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Live VAR / Verification Overlay on TV */}
      {activeMatch.verification && (
        <div className="relative z-20 my-2 animate-bounce-short">
          <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-950 via-purple-950 to-yellow-950 p-4 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert className="h-6 w-6 text-yellow-400 animate-pulse" />
              <h2 className="text-base sm:text-xl font-black uppercase tracking-widest text-white">
                VERIFIKASI WASIT JURI ({activeMatch.verification.type.toUpperCase()})
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-yellow-200 mt-1">
              Evaluasi sedang berlangsung untuk Sudut{' '}
              <strong className={activeMatch.verification.corner === 'red' ? 'text-red-400' : 'text-blue-400'}>
                {activeMatch.verification.corner === 'red' ? 'MERAH' : 'BIRU'}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Winner Certified Overlay */}
      {activeMatch.winner && (
        <div className="relative z-20 my-2">
          <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950/90 via-purple-950 to-amber-950/90 p-4 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-7 w-7 text-amber-400" />
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white">
                PEMENANG RESMI PARTAI #{activeMatch.partaiNumber}
              </h2>
            </div>
            <p className="text-sm sm:text-base font-bold mt-1">
              <span className={activeMatch.winner === 'red' ? 'text-red-400' : 'text-blue-400'}>
                SUDUT {activeMatch.winner.toUpperCase()}{' '}
                {activeMatch.winner === 'red'
                  ? `(${activeMatch.redCorner.name} - ${activeMatch.redCorner.contingent})`
                  : `(${activeMatch.blueCorner.name} - ${activeMatch.blueCorner.contingent})`}
              </span>{' '}
              · <span className="text-amber-300 font-normal">{activeMatch.winReason}</span>
            </p>
          </div>
        </div>
      )}

      {/* MODE TANDING: DUAL CORNER MEGA SCOREBOARD */}
      {isTanding ? (
        <main className="relative z-10 flex-1 my-3 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
            {/* SUDUT BIRU (KIRI - 5 COLS) */}
            <div className="lg:col-span-5 rounded-3xl border-2 border-blue-500/80 bg-gradient-to-br from-blue-950/70 via-[#0d1233] to-[#090518] p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-md bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow">
                    SUDUT BIRU
                  </span>
                  <span className="text-xs text-blue-300 font-mono">{activeMatch.blueCorner.weightClass}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white line-clamp-1">
                  {activeMatch.blueCorner.name}
                </h2>
                <p className="text-sm sm:text-base font-bold text-blue-200 mt-0.5">
                  {activeMatch.blueCorner.contingent}
                </p>
              </div>

              {/* Giant Score Digit */}
              <div className="my-6 text-center">
                <span className="font-mono text-8xl sm:text-9xl font-black text-blue-400 tracking-tighter tabular-nums drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]">
                  {blueScore.totalScore}
                </span>
              </div>

              {/* Rincian Poin & Hukuman Biru */}
              <div className="space-y-2 border-t border-blue-900/60 pt-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/40">
                    <span className="text-[10px] text-blue-300 uppercase block font-semibold">Pukulan (1)</span>
                    <strong className="font-mono text-lg text-white">{blueScore.punchesCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/40">
                    <span className="text-[10px] text-blue-300 uppercase block font-semibold">Tendangan (2)</span>
                    <strong className="font-mono text-lg text-white">{blueScore.kicksCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/40">
                    <span className="text-[10px] text-blue-300 uppercase block font-semibold">Jatuhan (3)</span>
                    <strong className="font-mono text-lg text-white">{blueScore.takedownsCount}</strong>
                  </div>
                </div>

                {/* Status Lampu Hukuman */}
                <div className="flex items-center justify-between px-2 pt-1 text-[11px]">
                  <span className="text-slate-400">Sanksi:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        blueScore.teguranCount > 0
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      Teguran: {blueScore.teguranCount}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        blueScore.peringatanCount > 0
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      Peringatan: {blueScore.peringatanCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER ARENA CLOCK & ROUND (1 COL) */}
            <div className="lg:col-span-1 rounded-3xl border border-purple-800/50 bg-[#120726]/90 p-4 shadow-xl flex flex-col items-center justify-center text-center gap-4">
              <div className="w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  BABAK
                </span>
                <span className="font-mono text-3xl font-black text-amber-400">
                  {activeMatch.currentRound}
                </span>
                <span className="text-[10px] text-purple-300 block">DARI {activeMatch.maxRounds}</span>
              </div>

              <div className="w-full py-4 border-y border-purple-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  WAKTU
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {formatDuration(activeMatch.timeRemainingSeconds)}
                </span>
                <span
                  className={`text-[9px] font-bold block mt-1 uppercase ${
                    activeMatch.timerIsRunning ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  {activeMatch.timerIsRunning ? 'BERJALAN' : 'JEDA'}
                </span>
              </div>

              <div className="text-[10px] text-purple-300/80 font-mono">
                {activeMatch.category.toUpperCase()}
              </div>
            </div>

            {/* SUDUT MERAH (KANAN - 5 COLS) */}
            <div className="lg:col-span-5 rounded-3xl border-2 border-red-500/80 bg-gradient-to-br from-red-950/70 via-[#270b1a] to-[#090518] p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-md bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow">
                    SUDUT MERAH
                  </span>
                  <span className="text-xs text-red-300 font-mono">{activeMatch.redCorner.weightClass}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white line-clamp-1">
                  {activeMatch.redCorner.name}
                </h2>
                <p className="text-sm sm:text-base font-bold text-red-200 mt-0.5">
                  {activeMatch.redCorner.contingent}
                </p>
              </div>

              {/* Giant Score Digit */}
              <div className="my-6 text-center">
                <span className="font-mono text-8xl sm:text-9xl font-black text-red-400 tracking-tighter tabular-nums drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]">
                  {redScore.totalScore}
                </span>
              </div>

              {/* Rincian Poin & Hukuman Merah */}
              <div className="space-y-2 border-t border-red-900/60 pt-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/40">
                    <span className="text-[10px] text-red-300 uppercase block font-semibold">Pukulan (1)</span>
                    <strong className="font-mono text-lg text-white">{redScore.punchesCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/40">
                    <span className="text-[10px] text-red-300 uppercase block font-semibold">Tendangan (2)</span>
                    <strong className="font-mono text-lg text-white">{redScore.kicksCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/40">
                    <span className="text-[10px] text-red-300 uppercase block font-semibold">Jatuhan (3)</span>
                    <strong className="font-mono text-lg text-white">{redScore.takedownsCount}</strong>
                  </div>
                </div>

                {/* Status Lampu Hukuman */}
                <div className="flex items-center justify-between px-2 pt-1 text-[11px]">
                  <span className="text-slate-400">Sanksi:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        redScore.teguranCount > 0
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      Teguran: {redScore.teguranCount}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        redScore.peringatanCount > 0
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      Peringatan: {redScore.peringatanCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* MODE SENI / JURUS: SPECTACULAR ARTISTIC SCOREBOARD */
        <main className="relative z-10 flex-1 my-3 flex flex-col justify-center">
          <div className="rounded-3xl border-2 border-purple-700/60 bg-gradient-to-b from-[#180a32] via-[#110724] to-[#090416] p-6 sm:p-8 shadow-2xl">
            {/* Athlete Profile & Category */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/60 pb-5">
              <div>
                <span className="px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
                  PENAMPIL {activeMatch.category.replace('_', ' ').toUpperCase()}
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
                  {activeMatch.seniCompetitor?.name || activeMatch.redCorner.name}
                </h2>
                <p className="text-base sm:text-lg font-bold text-amber-300 mt-1">
                  {activeMatch.seniCompetitor?.contingent || activeMatch.redCorner.contingent}
                </p>
              </div>

              {/* Stopwatch & Tolerance Status */}
              <div className="text-right">
                <span className="text-xs text-purple-300 block font-semibold">Waktu Penampilan:</span>
                <span className="font-mono text-4xl sm:text-5xl font-black text-white tabular-nums">
                  {formatDuration(activeMatch.seniDurationSeconds || 0)}
                </span>
                <span
                  className={`text-xs font-bold block mt-1 uppercase ${
                    seniResult.timeStatus === 'valid' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  Status Waktu: {seniResult.timeStatus} (Target: 03:00)
                </span>
              </div>
            </div>

            {/* 5 Juror Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
              {['juri-1', 'juri-2', 'juri-3', 'juri-4', 'juri-5'].map((jKey, idx) => {
                const jScore = activeMatch.seniJurorScores?.[jKey];
                const isHigh = jKey === seniResult.trimmedHighJuriId;
                const isLow = jKey === seniResult.trimmedLowJuriId;

                return (
                  <div
                    key={jKey}
                    className={`rounded-2xl p-4 border text-center transition-all ${
                      isHigh
                        ? 'border-amber-500/50 bg-amber-950/30 ring-1 ring-amber-400/40 opacity-75'
                        : isLow
                        ? 'border-rose-500/50 bg-rose-950/30 ring-1 ring-rose-400/40 opacity-75'
                        : jScore
                        ? 'border-purple-600/60 bg-purple-950/50 shadow-lg'
                        : 'border-purple-900/40 bg-purple-950/20'
                    }`}
                  >
                    <span className="text-xs font-bold text-purple-300 block mb-1">
                      JURI {idx + 1}
                    </span>
                    {jScore ? (
                      <>
                        <div className="font-mono text-3xl font-black text-white my-1 tabular-nums">
                          {jScore.totalScore.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-purple-300">
                          Kebenaran: {jScore.correctnessScore.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-purple-300">
                          Kemantapan: +{jScore.firmnessScore.toFixed(2)}
                        </div>
                        {isHigh && (
                          <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                            Tertinggi (Dibuang)
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                            Terendah (Dibuang)
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="py-4 text-xs text-purple-500 italic">Menunggu...</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Grand Score Bar */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-purple-950 via-amber-950/40 to-purple-950 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">SKOR AKHIR RESMI PERSILAT</h3>
                <p className="text-xs text-purple-300 mt-0.5">
                  Rata-rata 3 juri aktif dikurangi akumulasi penalti dewan (-{seniResult.totalCouncilDeduction.toFixed(2)})
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-5xl sm:text-6xl font-black text-amber-400 tabular-nums drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                  {seniResult.finalScore.toFixed(3)}
                </span>
                <span className="text-xs text-amber-300 font-bold uppercase">POIN RESMI</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Arena Footer Notification Ticker */}
      <footer className="relative z-10 flex items-center justify-between border-t border-purple-900/40 pt-3 text-xs text-purple-400">
        <div className="flex items-center gap-2 truncate max-w-2xl">
          <Flame className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">Live Update:</span>
          <span className="truncate text-purple-200">
            {latestNotification
              ? `${latestNotification.title} - ${latestNotification.message}`
              : 'Pertandingan berlangsung sesuai peraturan IPSI 2026.'}
          </span>
        </div>
        <div className="font-mono text-[11px] text-purple-400/80 shrink-0">
          SILAT-SCORE DIGITAL ARENA DISPLAY
        </div>
      </footer>
    </div>
  );
};
