import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Clock, 
  Activity, 
  AlertCircle, 
  Bell, 
  Radio, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { audioEngine } from '../../utils/audioEngine';

export const OperatorView: React.FC = () => {
  const {
    match,
    startTimer,
    pauseTimer,
    resetTimer,
    setRound,
    updateMatch,
    language,
    setRole,
  } = useTournament();

  // Medical Injury Timers (max 180 seconds as per Persilat rules)
  const [redMedicalSeconds, setRedMedicalSeconds] = useState<number>(180);
  const [blueMedicalSeconds, setBlueMedicalSeconds] = useState<number>(180);
  const [activeMedical, setActiveMedical] = useState<'red' | 'blue' | null>(null);

  // Gelanggang Arena Condition
  const [arenaState, setArenaState] = useState<string>('SIAP BERTANDING');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeMedical === 'red' && redMedicalSeconds > 0) {
      interval = setInterval(() => {
        setRedMedicalSeconds((prev) => {
          if (prev <= 1) {
            audioEngine.playBuzzer();
            setActiveMedical(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (activeMedical === 'blue' && blueMedicalSeconds > 0) {
      interval = setInterval(() => {
        setBlueMedicalSeconds((prev) => {
          if (prev <= 1) {
            audioEngine.playBuzzer();
            setActiveMedical(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMedical, redMedicalSeconds, blueMedicalSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const adjustSeconds = (delta: number) => {
    updateMatch((prev) => ({
      ...prev,
      timerSeconds: Math.max(0, prev.timerSeconds + delta),
    }));
  };

  const arenaStates = [
    { label: 'SIAP BERTANDING', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
    { label: 'PERTANDINGAN BERJALAN', color: 'bg-blue-600/30 text-blue-300 border-blue-500/40' },
    { label: 'TIME OUT WASIT', color: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
    { label: 'PERAWATAN MEDIS', color: 'bg-red-600/30 text-red-300 border-red-500/40' },
    { label: 'REVIEW VIDEO REPLAY (VR)', color: 'bg-purple-600/30 text-purple-300 border-purple-500/40' },
    { label: 'PEMBERSIHAN MATRAS', color: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Operator Header Bar */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-purple-950/80 border border-cyan-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 border border-cyan-400/50 flex items-center justify-center text-white shadow glow-blue">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-chakra text-lg font-black text-cyan-300 uppercase tracking-wider">
              {language === 'id' ? 'PANEL OPERATOR WAKTU & GELANGGANG' : 'TIMEKEEPER & ARENA OPERATOR'}
            </h2>
            <p className="text-xs text-gray-300">
              {match.arena} • {match.matchNumber} • {match.category.toUpperCase()} • {match.roundStage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Status Arena:</span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-black/60 border border-cyan-500/40 text-cyan-300">
            {arenaState}
          </span>
        </div>
      </div>

      {/* Main Grid: Master Timekeeper & Audio Soundboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Master Match Clock (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-gradient-to-b from-blue-950/80 via-black to-purple-950/80 border-2 border-blue-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden glow-blue">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3 mb-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                KONTROL WAKTU UTAMA (TIMER GELANGGANG)
              </span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  match.isTimerRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                }`}
              >
                {match.isTimerRunning ? 'BERJALAN' : 'BERHENTI (PAUSE)'}
              </span>
            </div>

            {/* Giant LED Time Display */}
            <div className="my-4 py-6 text-center bg-black/90 rounded-2xl border-2 border-cyan-500/40 shadow-inner">
              <span className="font-chakra text-7xl sm:text-8xl font-black text-white led-score tracking-tight drop-shadow-lg">
                {formatTime(match.timerSeconds)}
              </span>
              <div className="text-xs text-cyan-400 mt-2 font-bold uppercase tracking-widest">
                Babak {match.currentRound} dari {match.totalRounds} • Standar {match.roundDurationSeconds} Detik
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {!match.isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 font-chakra font-black text-base tracking-wider uppercase rounded-2xl text-white shadow-xl glow-purple active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Mulai (Gong)
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="py-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 font-chakra font-black text-base tracking-wider uppercase rounded-2xl text-white shadow-xl glow-gold active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  Jeda (Peluit)
                </button>
              )}

              <button
                onClick={resetTimer}
                className="py-4 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 border border-purple-500/50 font-chakra font-black text-base tracking-wider uppercase rounded-2xl text-purple-200 active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Babak
              </button>

              <button
                onClick={() => {
                  const nextR = match.currentRound < match.totalRounds ? match.currentRound + 1 : 1;
                  setRound(nextR);
                }}
                className="py-4 bg-gradient-to-r from-blue-900 to-cyan-900 hover:from-blue-800 border border-blue-500/50 font-chakra font-black text-base tracking-wider uppercase rounded-2xl text-cyan-200 active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                Babak Selanjutnya
              </button>
            </div>

            {/* Quick Adjustment Seconds */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-500/30">
              <button
                onClick={() => adjustSeconds(-10)}
                className="py-2 bg-black/60 hover:bg-white/5 border border-blue-500/30 rounded-xl text-xs font-bold text-cyan-300"
              >
                -10 Detik
              </button>
              <button
                onClick={() => adjustSeconds(10)}
                className="py-2 bg-black/60 hover:bg-white/5 border border-blue-500/30 rounded-xl text-xs font-bold text-cyan-300"
              >
                +10 Detik
              </button>
              <button
                onClick={() => {
                  updateMatch((prev) => ({ ...prev, timerSeconds: 120, roundDurationSeconds: 120 }));
                }}
                className="py-2 bg-black/60 hover:bg-white/5 border border-blue-500/30 rounded-xl text-xs font-bold text-white"
              >
                Set 2:00
              </button>
              <button
                onClick={() => {
                  updateMatch((prev) => ({ ...prev, timerSeconds: 180, roundDurationSeconds: 180 }));
                }}
                className="py-2 bg-black/60 hover:bg-white/5 border border-blue-500/30 rounded-xl text-xs font-bold text-white"
              >
                Set 3:00
              </button>
            </div>
          </div>

          {/* Arena Condition Status Selector */}
          <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest block">
              Publikasi Status Gelanggang ke Layar Monitor:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {arenaStates.map((st) => (
                <button
                  key={st.label}
                  onClick={() => setArenaState(st.label)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    arenaState === st.label
                      ? `${st.color} shadow-lg scale-[1.02]`
                      : 'bg-black/40 border-purple-500/20 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Soundboard & Doctor/Medical Injury Timers (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Soundboard Arena Manual */}
          <div className="bg-gradient-to-b from-purple-950/80 via-black to-blue-950/80 border-2 border-purple-500/50 rounded-3xl p-5 shadow-2xl space-y-3 glow-purple">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                SOUNDBOARD ARENA RESMI (WEB AUDIO)
              </span>
              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
                Web Audio Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => audioEngine.playGong()}
                className="p-3 bg-gradient-to-br from-amber-600 to-yellow-600 hover:from-amber-500 rounded-2xl text-black font-chakra font-black text-sm tracking-wider uppercase shadow glow-gold active:scale-95 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Bell className="w-5 h-5" />
                <span>GONG BABAK</span>
                <span className="text-[10px] font-sans font-bold opacity-80">Bel Perunggu</span>
              </button>

              <button
                onClick={() => audioEngine.playBuzzer()}
                className="p-3 bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 rounded-2xl text-white font-chakra font-black text-sm tracking-wider uppercase shadow glow-red active:scale-95 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Volume2 className="w-5 h-5" />
                <span>BUZZER HORN</span>
                <span className="text-[10px] font-sans font-bold opacity-80">Waktu Habis</span>
              </button>

              <button
                onClick={() => audioEngine.playWhistle()}
                className="p-3 bg-gradient-to-br from-blue-700 to-indigo-700 hover:from-blue-600 rounded-2xl text-white font-chakra font-black text-sm tracking-wider uppercase shadow glow-blue active:scale-95 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Radio className="w-5 h-5" />
                <span>PELUIT WASIT</span>
                <span className="text-[10px] font-sans font-bold opacity-80">Jeda / Peringatan</span>
              </button>

              <button
                onClick={() => audioEngine.playJudgeClick(3)}
                className="p-3 bg-gradient-to-br from-purple-700 to-fuchsia-700 hover:from-purple-600 rounded-2xl text-white font-chakra font-black text-sm tracking-wider uppercase shadow glow-purple active:scale-95 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span>KLIK TEST JURI</span>
                <span className="text-[10px] font-sans font-bold opacity-80">Tes Audio</span>
              </button>
            </div>
          </div>

          {/* Medical Injury Timer (Peraturan Persilat 2026: 3 Menit Akumulatif) */}
          <div className="bg-black/70 border-2 border-red-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
              <span className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                TIMER MEDIS / DOKTER (CEDERA ATLET)
              </span>
              <span className="text-[10px] text-gray-400">Maksimal 3:00 Menit</span>
            </div>

            {/* Red Fighter Medical */}
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="font-chakra font-bold text-xs text-red-300 block">
                  MEDIS SUDUT MERAH ({match.redCorner.athleteName})
                </span>
                <span className="font-chakra text-2xl font-black text-white led-score">
                  {formatTime(redMedicalSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMedical(activeMedical === 'red' ? null : 'red')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    activeMedical === 'red'
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-red-900/60 hover:bg-red-800 text-red-200'
                  }`}
                >
                  {activeMedical === 'red' ? 'Jeda' : 'Mulai'}
                </button>
                <button
                  onClick={() => {
                    setActiveMedical(null);
                    setRedMedicalSeconds(180);
                  }}
                  className="p-1.5 rounded-xl bg-black/60 text-gray-400 hover:text-white"
                  title="Reset 3:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Blue Fighter Medical */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="font-chakra font-bold text-xs text-blue-300 block">
                  MEDIS SUDUT BIRU ({match.blueCorner.athleteName})
                </span>
                <span className="font-chakra text-2xl font-black text-white led-score">
                  {formatTime(blueMedicalSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMedical(activeMedical === 'blue' ? null : 'blue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    activeMedical === 'blue'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-900/60 hover:bg-blue-800 text-blue-200'
                  }`}
                >
                  {activeMedical === 'blue' ? 'Jeda' : 'Mulai'}
                </button>
                <button
                  onClick={() => {
                    setActiveMedical(null);
                    setBlueMedicalSeconds(180);
                  }}
                  className="p-1.5 rounded-xl bg-black/60 text-gray-400 hover:text-white"
                  title="Reset 3:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
