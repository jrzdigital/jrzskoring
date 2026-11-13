import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Unlock,
  Lock,
  Volume2,
  Clock,
  ArrowLeft,
  Maximize,
  Minimize,
  CheckCircle2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useSilat } from '../context/SilatContext';
import { soundFx } from '../utils/soundEffects';
import { Corner } from '../types/silat';

interface SeniJurusTimerProps {
  onBack?: () => void;
  onSwitchToTanding?: () => void;
}

export const SeniJurusTimer: React.FC<SeniJurusTimerProps> = ({
  onBack,
  onSwitchToTanding
}) => {
  const {
    config,
    activeMatch,
    addOrUpdateMatch,
    playGong,
    playBuzzer,
    playWhistle
  } = useSilat();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    soundFx.playClick(2);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sudut Aktif (BIRU atau MERAH)
  const [activeCorner, setActiveCorner] = useState<Corner>('BLUE');

  // Presets & Target Duration (Default 03:00 / 180s)
  const [durasiTampil, setDurasiTampil] = useState<string>('03:00');
  const targetSeconds = durasiTampil === '01:30' ? 90 : durasiTampil === '02:00' ? 120 : 180;
  const minToleranceSecs = Math.max(0, targetSeconds - 5);
  const maxToleranceSecs = targetSeconds + 5;

  // Timers State
  // Timer 1: Waktu Tampil Arena (T1)
  const [time1, setTime1] = useState<number>(() => {
    return activeMatch?.category !== 'TANDING' && activeMatch?.timer?.elapsedTime ? activeMatch.timer.elapsedTime : 0;
  });
  // Timer 2: Waktu Nyata Penampil (T2)
  const [time2, setTime2] = useState<number>(() => {
    return activeMatch?.category !== 'TANDING' && activeMatch?.timer?.elapsedTime ? activeMatch.timer.elapsedTime : 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [judgesCount, setJudgesCount] = useState<number>(10);

  // Interval Ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound helper with fallbacks
  const triggerGong = () => {
    try {
      soundFx.playGong();
    } catch {
      playGong();
    }
  };

  const triggerBuzzer = () => {
    try {
      soundFx.playBuzzer();
    } catch {
      playBuzzer();
    }
  };

  const triggerWhistle = () => {
    try {
      soundFx.playWhistle();
    } catch {
      playWhistle();
    }
  };

  // Timer Tick Loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime1((prev1) => {
          const next1 = prev1 + 1;
          // Gong otomatis saat menyentuh batas target durasi
          if (next1 === targetSeconds) {
            triggerGong();
          }
          return next1;
        });
        setTime2((prev2) => prev2 + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, targetSeconds]);

  // Sync to SilatContext activeMatch
  useEffect(() => {
    if (activeMatch && activeMatch.category !== 'TANDING') {
      addOrUpdateMatch({
        ...activeMatch,
        timer: {
          ...activeMatch.timer,
          isRunning,
          elapsedTime: time2,
          durationTotal: targetSeconds,
          timeRemaining: Math.max(0, targetSeconds - time2)
        }
      });
    }
  }, [isRunning, time2, targetSeconds]);

  // START / STOP Toggle
  const handleToggleTimer = () => {
    triggerGong();
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  // RESET TIMER
  const handleReset = () => {
    soundFx.playClick(1);
    setIsRunning(false);
    setTime1(0);
    setTime2(0);
  };

  // LOCK / UNLOCK TOGGLE
  const handleToggleUnlock = () => {
    soundFx.playClick(2);
    setIsUnlocked((prev) => !prev);
  };

  // MANUAL TIME ADJUSTMENT (+/- seconds on Timer 2 and Timer 1)
  const handleAdjust = (delta: number) => {
    soundFx.playClick(1);
    setTime1((prev) => Math.max(0, prev + delta));
    setTime2((prev) => Math.max(0, prev + delta));
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Tolerance evaluation for Timer 2 (IPSI 2026)
  let timingZone: 'before' | 'safe' | 'over' = 'before';
  let secondsDeviation = 0;
  if (time2 >= minToleranceSecs && time2 <= maxToleranceSecs) {
    timingZone = 'safe';
    secondsDeviation = 0;
  } else if (time2 > maxToleranceSecs) {
    timingZone = 'over';
    secondsDeviation = time2 - maxToleranceSecs;
  } else if (time2 > 0) {
    timingZone = 'before';
    secondsDeviation = minToleranceSecs - time2;
  }

  // Active athlete & contingent display based on corner
  const contingent = activeCorner === 'BLUE'
    ? (activeMatch?.tanding?.blueAthlete?.contingent || activeMatch?.jurus?.performer?.contingent || 'PAKU BANTEN')
    : (activeMatch?.tanding?.redAthlete?.contingent || 'KONTINGEN MERAH');

  const athleteName = activeCorner === 'BLUE'
    ? (activeMatch?.tanding?.blueAthlete?.name || activeMatch?.jurus?.performer?.name || 'JAKA & RENDI')
    : (activeMatch?.tanding?.redAthlete?.name || 'PESILAT SUDUT MERAH');

  const categoryLabel = activeMatch?.category
    ? activeMatch.category.replace('_', ' ')
    : 'JURUS GANDA';

  const stageLabel = activeMatch?.stage
    ? activeMatch.stage.replace('_', ' ')
    : 'FINAL POOL A';

  const partaiNum = activeMatch?.matchNumber || 1;
  const genderLabel = activeMatch?.gender || 'PUTRA';
  const ageLabel = activeMatch?.ageGroup ? activeMatch.ageGroup.replace('_', ' ') : 'REMAJA';

  const tournamentTitle = config?.tournamentName || 'KEJUARAAN NASIONAL PENCAK SILAT IPSI REKOR INDONESIA';
  const arenaTitle = activeMatch?.arena || config?.arena || 'GELANGGANG 1';

  // Keyboard Shortcuts: Space (Play/Stop), R (Reset), U/K (Lock/Unlock), B (Buzzer), P (Peluit), 1 (Biru), 2 (Merah)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleToggleUnlock();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        triggerBuzzer();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        triggerWhistle();
      } else if (e.key === '1') {
        e.preventDefault();
        setActiveCorner('BLUE');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveCorner('RED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isUnlocked, time2, activeCorner]);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-[#02050e] text-white flex flex-col justify-between font-sans select-none overflow-hidden relative">
      
      {/* 1. TOP HEADER (EXACTLY MATCHING IMAGE) */}
      <header className="bg-[#050c18] border-b border-[#142642] px-3 sm:px-6 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
        
        {/* Left: Tournament Title */}
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-lg bg-[#071324] hover:bg-[#0c1f36] border border-cyan-500/30 text-cyan-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
              title="Kembali ke Menu Utama"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          <h1 className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider font-mono truncate">
            {tournamentTitle}
          </h1>
        </div>

        {/* Right: Category, Match & Age Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] shrink-0">
          <span className="bg-[#091528] border border-cyan-500/50 text-cyan-300 px-2.5 sm:px-3 py-0.5 rounded-full font-bold uppercase">
            PARTAI {partaiNum} / {stageLabel}
          </span>
          <span className="bg-[#10192a] border border-zinc-700 text-zinc-200 px-2.5 sm:px-3 py-0.5 rounded-full font-bold uppercase hidden xs:inline">
            {categoryLabel}
          </span>
          <span className="bg-[#1a1406] border border-amber-500/50 text-amber-300 px-2.5 sm:px-3 py-0.5 rounded-full font-bold uppercase hidden sm:inline">
            {genderLabel} • {ageLabel}
          </span>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded-lg bg-[#071324] hover:bg-[#0c1f36] border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title={isFullscreen ? 'Layar Normal' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>

      </header>

      {/* 2. SUB-HEADER: SUDUT SELECTOR & ACTIVE ATHLETE DISPLAY */}
      <div className="bg-[#030914] border-b border-[#142642] px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 z-10 shrink-0">
        
        {/* Sudut Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            SUDUT :
          </span>

          <button
            onClick={() => { soundFx.playClick(1); setActiveCorner('BLUE'); }}
            className={`px-3 py-1 rounded-full font-mono text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeCorner === 'BLUE'
                ? 'bg-[#1e61ff] border-blue-400 text-white shadow-[0_0_12px_rgba(30,97,255,0.6)]'
                : 'bg-[#061224] hover:bg-[#0b1c38] border-[#162540] text-zinc-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>BIRU</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(1); setActiveCorner('RED'); }}
            className={`px-3 py-1 rounded-full font-mono text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeCorner === 'RED'
                ? 'bg-[#e11d48] border-rose-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]'
                : 'bg-[#1c080d] hover:bg-[#2c0e16] border-[#162540] text-zinc-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>MERAH</span>
          </button>
        </div>

        {/* Performer Details: Contingent above, Athlete Name below */}
        <div className="flex items-center gap-2 truncate">
          <div className="text-right truncate">
            <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider block ${
              activeCorner === 'RED' ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {contingent}
            </span>
            <h2 className="text-xs sm:text-sm md:text-base font-mono font-black text-white uppercase tracking-wide leading-none truncate">
              {athleteName}
            </h2>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            activeCorner === 'RED'
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
              : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]'
          }`} />
        </div>

      </div>

      {/* 3. MAIN WORKSPACE: STATUS STRIP + 2 DUAL TIMERS + 3 HERO BUTTONS + SETTINGS */}
      <main className="flex-1 px-3 sm:px-6 py-2 flex flex-col justify-between max-w-7xl mx-auto w-full gap-2 min-h-0 overflow-hidden z-10">
        
        {/* STATUS STRIP */}
        <div className="flex items-center justify-between bg-[#070e1c] border border-[#142642] px-3 py-1.5 rounded-xl text-xs font-mono shadow-sm shrink-0">
          
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : time2 > 0 ? 'bg-amber-400' : 'bg-amber-500'
            }`} />
            <span className="font-black uppercase tracking-wider text-[11px] sm:text-xs">
              STATUS: {
                isRunning
                  ? 'SEDANG BERJALAN (PLAY) • GONG AKTIF'
                  : time2 >= targetSeconds
                    ? 'WAKTU HABIS (SELESAI)'
                    : time2 > 0
                      ? 'DIHENTIKAN SEMENTARA (PAUSED)'
                      : 'STANDBY SIAP TAMPIL'
              }
            </span>
          </div>

          {/* Kunci Status Badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[10px] hidden sm:inline">KUNCI JURI &amp; DEWAN:</span>
            <span className={`px-2.5 py-0.5 rounded font-black text-[9px] sm:text-[10px] tracking-wider uppercase border flex items-center gap-1 ${
              isUnlocked
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 animate-pulse'
                : 'bg-rose-950/80 border-rose-500 text-rose-300'
            }`}>
              {isUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
              {isUnlocked ? 'TERBUKA' : 'TERKUNCI'}
            </span>
          </div>

        </div>

        {/* 2 DUAL TIMERS: SIDE BY SIDE (TIMER 1 & TIMER 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 flex-1 min-h-0 items-stretch">
          
          {/* ===================== KOTAK KIRI: TIMER 1 (WAKTU TAMPIL ARENA) ===================== */}
          <div className="bg-gradient-to-b from-[#08152c] to-[#040a16] border-2 border-[#162a4a] rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Top Info */}
            <div className="flex justify-between items-center border-b border-[#142642] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  TIMER 1
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-zinc-300 uppercase">
                  WAKTU TAMPIL ARENA (T1)
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400">
                BATAS: {durasiTampil} ({targetSeconds}s)
              </span>
            </div>

            {/* Giant Clock Numbers (Cyan Glow, Exactly like Screenshot) */}
            <div className="my-auto py-1 sm:py-2 text-center flex flex-col items-center justify-center">
              <div className="text-7xl sm:text-8xl lg:text-9xl font-mono font-black text-cyan-300 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(6,182,212,0.65)] select-none">
                {formatTime(time1)}
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono font-bold text-cyan-400/80 mt-1 uppercase tracking-widest">
                {time1} DETIK BERJALAN
              </div>
            </div>

            {/* Progress Gauge to Official Target */}
            <div className="space-y-1 pt-1.5 border-t border-[#142642]">
              <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-400">
                <span>00:00</span>
                <span>TARGET RESMI ({durasiTampil})</span>
              </div>
              <div className="w-full bg-[#030712] h-2 rounded-full overflow-hidden border border-[#142642]">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  style={{ width: `${Math.min(100, (time1 / targetSeconds) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* ===================== KOTAK KANAN: TIMER 2 (WAKTU NYATA PENAMPIL) ===================== */}
          <div className="bg-gradient-to-b from-[#1c1404] to-[#0a0702] border-2 border-amber-500/70 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Top Info */}
            <div className="flex justify-between items-center border-b border-[#2d2208] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400 text-black text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  TIMER 2
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
                  WAKTU NYATA PENAMPIL (T2)
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                <span className={`text-[10px] sm:text-xs font-mono font-black uppercase ${
                  isRunning ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isRunning ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>
            </div>

            {/* Giant Clock Numbers (Bright Yellow Glow, Exactly like Screenshot) */}
            <div className="my-auto py-1 sm:py-2 text-center flex flex-col items-center justify-center">
              <div className="text-7xl sm:text-8xl lg:text-9xl font-mono font-black text-[#ffea00] tracking-tight leading-none drop-shadow-[0_0_35px_rgba(255,234,0,0.7)] select-none">
                {formatTime(time2)}
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-400/80 mt-1 uppercase tracking-widest">
                {time2} DETIK TOTAL WAKTU AKTUAL
              </div>
            </div>

            {/* Tolerance & Status Strip */}
            <div className="pt-1.5 border-t border-[#2d2208]">
              {timingZone === 'safe' ? (
                <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 py-1 px-2 rounded-lg text-center font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">BEBAS DENDA (IPSI 2026: {formatTime(minToleranceSecs)} - {formatTime(maxToleranceSecs)})</span>
                </div>
              ) : timingZone === 'over' ? (
                <div className="bg-rose-950/80 border border-rose-500 text-rose-300 py-1 px-2 rounded-lg text-center font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
                  <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                  <span className="truncate">LEBIH {secondsDeviation}s DARI TOLERANSI (-{(secondsDeviation * 0.01).toFixed(2)})</span>
                </div>
              ) : time2 > 0 ? (
                <div className="bg-[#1a1407] border border-amber-600/60 text-amber-300 py-1 px-2 rounded-lg text-center font-mono font-bold text-[10px] flex items-center justify-center gap-1.5">
                  <Clock size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">DI BAWAH TOLERANSI MINIMAL ({formatTime(minToleranceSecs)})</span>
                </div>
              ) : (
                <div className="bg-[#121212] border border-[#2d2208] text-zinc-400 py-1 px-2 rounded-lg text-center font-mono font-bold text-[10px]">
                  STANDBY SIAP PENAMPILAN
                </div>
              )}
            </div>

          </div>

        </div>

        {/* 4. THREE HERO TACTICAL BUTTONS (EXACTLY MATCHING IMAGE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 shrink-0">
          
          {/* BUTTON 1: MULAI (PLAY) / STOP TIMER (SOLID GREEN) */}
          <button
            onClick={handleToggleTimer}
            className={`h-14 sm:h-18 lg:h-20 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-mono font-black uppercase tracking-wider transition-all duration-200 border-2 shadow-2xl active:scale-[0.98] cursor-pointer ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)] animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
            }`}
          >
            {isRunning ? (
              <>
                <Square size={22} className="fill-white" />
                <span className="text-base sm:text-lg lg:text-xl">STOP TIMER</span>
              </>
            ) : (
              <>
                <Play size={22} className="fill-white" />
                <span className="text-base sm:text-lg lg:text-xl">MULAI (PLAY)</span>
              </>
            )}
          </button>

          {/* BUTTON 2: RESET WAKTU (DARK BLUE WITH AMBER BORDER) */}
          <button
            onClick={() => {
              if (confirm('Reset ulang waktu arena dan waktu penampil ke 00:00?')) {
                handleReset();
              }
            }}
            className="h-14 sm:h-18 lg:h-20 px-4 bg-[#081528] hover:bg-[#0f233f] border-2 border-amber-500/70 hover:border-amber-400 text-amber-300 hover:text-white rounded-2xl flex items-center justify-center gap-2.5 font-mono font-black uppercase tracking-wider transition-all shadow-xl active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw size={20} className="text-amber-400" />
            <span className="text-base sm:text-lg lg:text-xl">RESET WAKTU</span>
          </button>

          {/* BUTTON 3: BUKA KUNCI / KUNCI JURI & DEWAN (TEAL/GREEN BORDER) */}
          <button
            onClick={handleToggleUnlock}
            className={`h-14 sm:h-18 lg:h-20 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-mono font-black uppercase tracking-wider transition-all border-2 shadow-xl active:scale-[0.98] cursor-pointer ${
              isUnlocked
                ? 'bg-[#18080c] hover:bg-[#280c14] border-rose-500 text-rose-300 shadow-rose-950/50'
                : 'bg-[#06241a] hover:bg-[#0a3828] border-emerald-400 text-emerald-300 shadow-emerald-950/50'
            }`}
          >
            {isUnlocked ? (
              <>
                <Lock size={20} className="text-rose-400" />
                <span className="text-base sm:text-lg lg:text-xl">KUNCI JURI &amp; DEWAN</span>
              </>
            ) : (
              <>
                <Unlock size={20} className="text-emerald-400" />
                <span className="text-base sm:text-lg lg:text-xl">BUKA KUNCI JURI</span>
              </>
            )}
          </button>

        </div>

        {/* 5. SECONDARY UTILITIES: DURASI, JURI, AUDIO & KALIBRASI (EXACTLY MATCHING IMAGE) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-[#070e1c] border border-[#142642] p-2 rounded-xl shadow-md shrink-0">
          
          {/* Sub-col 1: Preset Durasi Tampil */}
          <div className="md:col-span-4 lg:col-span-3 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Clock size={12} className="text-cyan-400" />
              DURASI:
            </span>
            <div className="flex items-center gap-1 w-full">
              {[
                { label: '03:00', val: '03:00' },
                { label: '02:00', val: '02:00' },
                { label: '01:30', val: '01:30' }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => {
                    soundFx.playClick(1);
                    setDurasiTampil(p.val);
                  }}
                  className={`flex-1 py-1 px-1 rounded-lg text-center font-mono font-bold text-[10px] border transition-all cursor-pointer ${
                    durasiTampil === p.val
                      ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-sm'
                      : 'bg-[#0b172a] hover:bg-[#122442] text-zinc-300 border-[#162540]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-col 2: JUMLAH JURI */}
          <div className="md:col-span-5 lg:col-span-4 flex items-center gap-1.5 border-t md:border-t-0 md:border-l md:border-r border-[#142642] pt-1 md:pt-0 md:px-2">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Users size={12} className="text-cyan-400" />
              JURI:
            </span>
            <div className="grid grid-cols-4 gap-1 w-full">
              {[4, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    soundFx.playClick(1);
                    setJudgesCount(num);
                  }}
                  className={`py-1 rounded-lg text-[10px] font-mono font-extrabold transition-all duration-200 cursor-pointer text-center border ${
                    judgesCount === num
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-[#050b16] hover:bg-[#0c182c] text-zinc-400 border-[#162540]'
                  }`}
                >
                  {num} Juri
                </button>
              ))}
            </div>
          </div>

          {/* Sub-col 3: Audio Arena Horn (BUZZER & PELUIT) */}
          <div className="md:col-span-3 lg:col-span-3 flex items-center gap-1 border-t md:border-t-0 md:border-r border-[#142642] pt-1 md:pt-0 md:pr-2">
            <button
              onClick={triggerBuzzer}
              className="w-full bg-[#24080e] hover:bg-[#3d0e19] border border-rose-500/70 text-rose-300 py-1 px-1.5 rounded-lg font-mono font-black text-[10px] uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Bunyikan Buzzer Arena"
            >
              <AlertTriangle size={11} className="text-rose-400" />
              <span>BUZZER</span>
            </button>
            <button
              onClick={triggerWhistle}
              className="w-full bg-[#1c1808] hover:bg-[#2e260c] border border-yellow-500/70 text-yellow-300 py-1 px-1.5 rounded-lg font-mono font-black text-[10px] uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Bunyikan Peluit Wasit"
            >
              <Volume2 size={11} className="text-yellow-400" />
              <span>PELUIT</span>
            </button>
          </div>

          {/* Sub-col 4: Kalibrasi Manual Waktu (-5s, -1s, +1s, +5s) */}
          <div className="md:col-span-12 lg:col-span-2 flex items-center gap-1">
            <div className="grid grid-cols-4 gap-0.5 w-full">
              <button
                onClick={() => handleAdjust(-5)}
                className="bg-[#0b172a] hover:bg-[#122442] border border-[#162540] text-rose-400 py-1 rounded font-mono font-bold text-[9px] transition-all cursor-pointer active:scale-95 text-center"
              >
                -5s
              </button>
              <button
                onClick={() => handleAdjust(-1)}
                className="bg-[#0b172a] hover:bg-[#122442] border border-[#162540] text-rose-400 py-1 rounded font-mono font-bold text-[9px] transition-all cursor-pointer active:scale-95 text-center"
              >
                -1s
              </button>
              <button
                onClick={() => handleAdjust(+1)}
                className="bg-[#0b172a] hover:bg-[#122442] border border-[#162540] text-emerald-400 py-1 rounded font-mono font-bold text-[9px] transition-all cursor-pointer active:scale-95 text-center"
              >
                +1s
              </button>
              <button
                onClick={() => handleAdjust(+5)}
                className="bg-[#0b172a] hover:bg-[#122442] border border-[#162540] text-emerald-400 py-1 rounded font-mono font-bold text-[9px] transition-all cursor-pointer active:scale-95 text-center"
              >
                +5s
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER (MATCHING BOTTOM BAR IN IMAGE) */}
      <footer className="bg-[#040813] border-t border-[#142642] px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-500 z-10 shrink-0">
        <div>
          STANDAR ATURAN JURUS RESMI IPSI 2026 &amp; PERSILAT • TOLERANSI WAKTU 5 DETIK
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold">{arenaTitle}</span>
          <span>JRZ SCORE TGR • STANDAR RESMI IPSI 2026 &amp; PERSILAT</span>
        </div>
      </footer>

    </div>
  );
};

export default SeniJurusTimer;
