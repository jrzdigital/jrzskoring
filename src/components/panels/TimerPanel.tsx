import React, { useState, useEffect } from 'react';
import { useSilat } from '../../context/SilatContext';
import { MatchState, Corner } from '../../types/silat';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Bell,
  Volume2,
  Clock,
  Coffee,
  AlertCircle,
  Flag,
  ArrowLeft,
  Wifi,
  Smartphone,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  X,
  Radio,
  Sliders,
  ShieldAlert,
  ChevronDown,
  Layers
} from 'lucide-react';

interface TimerPanelProps {
  onBack?: () => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({ onBack }) => {
  const {
    activeMatch,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    changeRound,
    changeTotalRounds,
    toggleRestPeriod,
    playGong,
    playBuzzer,
    playWhistle,
    addOrUpdateMatch,
    resetAllToDefault
  } = useSilat();

  // Modals state
  const [showJuriGawaiModal, setShowJuriGawaiModal] = useState<boolean>(false);
  const [showResetMatchModal, setShowResetMatchModal] = useState<boolean>(false);

  // Total Rounds (2 Babak atau 3 Babak)
  const totalRounds = activeMatch?.totalRounds || 3;
  const [showMedicalModal, setShowMedicalModal] = useState<boolean>(false);

  // Medical Timeout state (Maksimal 3 menit akumulasi sesuai peraturan IPSI 2026)
  const [medicalCorner, setMedicalCorner] = useState<Corner>('RED');
  const [medicalSecondsRed, setMedicalSecondsRed] = useState<number>(0);
  const [medicalSecondsBlue, setMedicalSecondsBlue] = useState<number>(0);
  const [medicalActive, setMedicalActive] = useState<boolean>(false);

  // Medical stopwatch interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (medicalActive) {
      interval = setInterval(() => {
        if (medicalCorner === 'RED') {
          setMedicalSecondsRed((prev) => {
            if (prev >= 180) {
              setMedicalActive(false);
              playBuzzer();
              return 180;
            }
            return prev + 1;
          });
        } else {
          setMedicalSecondsBlue((prev) => {
            if (prev >= 180) {
              setMedicalActive(false);
              playBuzzer();
              return 180;
            }
            return prev + 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [medicalActive, medicalCorner, playBuzzer]);

  if (!activeMatch) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center text-center p-4 bg-[#040813] text-slate-100 font-sans">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 rounded-xl bg-[#070e1c] border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all active:scale-95 font-mono text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </button>
        )}
        <div className="cyber-glass border border-cyan-500/30 rounded-2xl p-6 max-w-md shadow-xl">
          <p className="text-slate-400 font-mono text-sm">
            Belum ada partai aktif yang dipilih di Panel Sekretaris.
          </p>
        </div>
      </div>
    );
  }

  const isTanding = activeMatch.category === 'TANDING';
  const timer = activeMatch.timer;

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Change default duration when match is not running
  const handleChangeDuration = (seconds: number) => {
    if (timer.isRunning) return;
    const updated: MatchState = {
      ...activeMatch,
      timer: {
        ...activeMatch.timer,
        durationTotal: seconds,
        timeRemaining: seconds,
        elapsedTime: 0
      }
    };
    addOrUpdateMatch(updated);
  };

  // Toleransi seni (175s - 185s = 2:55 - 3:05)
  const isSeniSafeZone = !isTanding && timer.elapsedTime >= 175 && timer.elapsedTime <= 185;
  const isSeniOvertime = !isTanding && timer.elapsedTime > 185;

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between p-2 sm:p-3 md:p-4 max-w-7xl mx-auto overflow-hidden animate-fade-in font-sans select-none bg-gradient-to-br from-[#19072b] via-[#05040a] to-[#030d22] cyber-arena-bg">
      
      {/* 1. TOP HEADER BAR: Back Button, Match Info, HUBUNGKAN GAWAI JURI & RESET PERTANDINGAN */}
      <header className="shrink-0 cyber-glass border border-cyan-500/30 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 shadow-md flex items-center justify-between gap-2 hud-bracket">
        {/* Left: Back button & Match Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#070e1c]/80 border border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 cyber-glass hover:glow-cyan shadow transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
              title="Kembali ke Beranda"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono font-black text-[9px] sm:text-[11px] uppercase tracking-wider glow-emerald border border-emerald-400/50 shrink-0">
                PANEL TIMER
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 truncate">
                {activeMatch.arena} · Partai #{activeMatch.matchNumber}
              </span>
              {/* Dropdown Pilihan Babak di Header */}
              <div className="relative inline-flex items-center">
                <select
                  value={totalRounds}
                  onChange={(e) => changeTotalRounds(Number(e.target.value))}
                  className="bg-[#070e1c] text-amber-300 hover:text-amber-200 text-[9px] sm:text-[11px] font-mono font-black rounded px-2 py-0.5 pr-5 border border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer appearance-none shadow"
                  title="Pilihan Babak yang digunakan (2 Babak / 3 Babak)"
                >
                  <option value={2} className="bg-[#0b162c] text-white">2 Babak</option>
                  <option value={3} className="bg-[#0b162c] text-white">3 Babak</option>
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-amber-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <h1 className="text-xs sm:text-base md:text-lg font-black text-white uppercase tracking-wide truncate leading-tight mt-0.5">
              {isTanding ? (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>TANDING:</span>
                  <span className="text-cyan-400">{activeMatch.tanding?.blueAthlete?.name || 'Sudut Biru'}</span>
                  <img src="./vs.png" alt="VS" className="h-3.5 w-auto object-contain inline-block select-none" draggable={false} />
                  <span className="text-rose-400">{activeMatch.tanding?.redAthlete?.name || 'Sudut Merah'}</span>
                </span>
              ) : (
                `SENI: ${activeMatch.jurus?.performer?.name || 'Pesilat'} (${activeMatch.category.replace('_', ' ')})`
              )}
            </h1>
            <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 font-mono truncate">
              {activeMatch.classGroup} · {activeMatch.stage.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Right: HUBUNGKAN GAWAI JURI & RESET PERTANDINGAN BUTTONS */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          {/* Tombol Hubungkan Gawai Juri (Cyan Glow) */}
          <button
            onClick={() => setShowJuriGawaiModal(true)}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-mono font-bold text-[10px] sm:text-xs md:text-sm border border-cyan-300 shadow-md flex items-center gap-1 sm:gap-2 transition-all cursor-pointer glow-cyan"
            title="Kelola & Hubungkan Gawai Juri 1, 2, 3"
          >
            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-200 animate-pulse" />
            <span className="hidden xs:inline">HUBUNGKAN GAWAI JURI</span>
            <span className="xs:hidden">GAWAI JURI</span>
          </button>

          {/* Tombol Reset Pertandingan (Red Glow) */}
          <button
            onClick={() => setShowResetMatchModal(true)}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-[10px] sm:text-xs md:text-sm border border-red-300 shadow-md flex items-center gap-1 sm:gap-2 transition-all cursor-pointer glow-red"
            title="Reset ulang pertandingan ini ke kondisi awal"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">RESET PERTANDINGAN</span>
            <span className="xs:hidden">RESET</span>
          </button>
        </div>
      </header>

      {/* 2. GIANT DIGITAL TIMER DISPLAY CARD (Vibrant Gold/Yellow Digits & Dark Stadium Container) */}
      <div className={`flex-1 min-h-0 my-1.5 sm:my-2.5 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 px-3 py-2 sm:px-5 sm:py-3.5 text-center shadow-2xl transition-all relative overflow-hidden hud-bracket flex flex-col justify-evenly items-center ${
        timer.isRest
          ? 'bg-[#070e1c]/95 border-amber-400 glow-gold'
          : timer.isRunning
            ? 'bg-[#070e1c]/95 border-emerald-500 glow-emerald'
            : 'cyber-glass-deep border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
      }`}>
        
        {/* Top line inside clock card: Round Indicator & Live Status */}
        <div className="w-full flex items-center justify-between px-2 sm:px-4">
          {/* Round / Target Badge */}
          <div>
            {isTanding ? (
              <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-md sm:rounded-lg bg-amber-500 text-slate-950 font-black font-mono text-[10px] sm:text-xs md:text-sm glow-gold border border-amber-300">
                BABAK {activeMatch.activeRound} / {totalRounds}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-600 text-white font-black font-mono text-[10px] sm:text-xs md:text-sm glow-emerald border border-emerald-400">
                TARGET 3:00
              </span>
            )}
          </div>

          {/* Status Text / Live Pulse */}
          <div className="text-[10px] sm:text-xs md:text-sm font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
            {medicalActive ? (
              <span className="text-rose-400 flex items-center gap-1.5 animate-pulse text-glow-red">
                <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                WAKTU MEDIS {medicalCorner === 'RED' ? 'MERAH' : 'BIRU'} BERJALAN
              </span>
            ) : timer.isRest ? (
              <span className="text-amber-400 flex items-center gap-1.5 text-glow-gold">
                <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" /> JEDA ISTIRAHAT BABAK (REST)
              </span>
            ) : timer.isRunning ? (
              <span className="text-emerald-400 flex items-center gap-1.5 text-glow-emerald">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-ping" />
                WAKTU PERTANDINGAN BERJALAN
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> WAKTU DIHENTIKAN (PAUSED)
              </span>
            )}
          </div>

          {/* Duration Preset Badge */}
          <div className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400/80">
            DURASI: {formatTime(timer.durationTotal || (isTanding ? 120 : 180))}
          </div>
        </div>

        {/* GIANT DIGITAL TIMER NUMBERS - Vibrant Yellow/Gold Digits */}
        <div className="py-0.5 sm:py-1 select-none">
          <span className="font-mono font-black text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight leading-none text-amber-400 text-glow-gold drop-shadow-[0_0_35px_rgba(251,191,36,0.5)]">
            {timer.isRest ? formatTime(timer.restTimeRemaining) : formatTime(isTanding ? timer.timeRemaining : timer.elapsedTime)}
          </span>
        </div>

        {/* Seni Zone Indicator */}
        {!isTanding && (
          <div className="max-w-md w-full mx-auto px-2 py-1 rounded-lg border border-cyan-500/30 bg-[#040813]/80 font-bold font-mono text-[9px] sm:text-xs flex items-center justify-between text-slate-300">
            <span>Zona Sah: 2:55 - 3:05</span>
            <span className={`px-2 py-0.5 rounded uppercase font-black ${
              isSeniSafeZone
                ? 'bg-emerald-600 text-white glow-emerald'
                : isSeniOvertime
                  ? 'bg-red-600 text-white animate-pulse glow-red'
                  : 'bg-amber-500 text-slate-950 glow-gold'
            }`}>
              {isSeniSafeZone ? 'Zona Sah (Aman)' : isSeniOvertime ? 'Terkena Penalti Lebih' : 'Di Bawah Target'}
            </span>
          </div>
        )}

        {/* ROW OF PRIMARY CONTROLS DIRECTLY UNDER TIMER (Start/Pause, Reset, Adjustments, Medical) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 w-full pt-1">
          {/* 1. Main Big Start/Pause Button */}
          {!timer.isRunning ? (
            <button
              onClick={startTimer}
              className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono font-black text-xs sm:text-base md:text-lg shadow-lg flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer glow-emerald border border-emerald-300"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>MULAI (START)</span>
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-mono font-black text-xs sm:text-base md:text-lg shadow-lg flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer glow-gold border border-amber-300"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>JEDA (PAUSE)</span>
            </button>
          )}

          {/* 2. Reset Timer Round Button */}
          <button
            onClick={() => {
              if (confirm('Reset ulang waktu babak ini ke waktu awal?')) {
                resetTimer();
              }
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#070e1c] hover:bg-[#091326] active:scale-95 text-cyan-300 hover:text-white font-mono font-bold text-xs sm:text-sm border border-cyan-500/40 shadow flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer hover:glow-cyan"
            title="Reset waktu babak berjalan"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span>Reset Waktu</span>
          </button>

          {/* 3. Fine Adjustments Buttons: -10s, -5s, +5s, +10s */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => adjustTimer(-10)}
              className="px-2 py-1 sm:px-2.5 sm:py-2 rounded-lg bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white text-[10px] sm:text-xs font-mono font-bold border border-cyan-500/30 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
              title="Kurangi 10 Detik"
            >
              <Minus className="w-3 h-3 text-rose-400" /> 10s
            </button>
            <button
              onClick={() => adjustTimer(-5)}
              className="px-2 py-1 sm:px-2.5 sm:py-2 rounded-lg bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white text-[10px] sm:text-xs font-mono font-bold border border-cyan-500/30 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
              title="Kurangi 5 Detik"
            >
              <Minus className="w-3 h-3 text-cyan-400" /> 5s
            </button>
            <button
              onClick={() => adjustTimer(5)}
              className="px-2 py-1 sm:px-2.5 sm:py-2 rounded-lg bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white text-[10px] sm:text-xs font-mono font-bold border border-cyan-500/30 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
              title="Tambah 5 Detik"
            >
              <Plus className="w-3 h-3 text-cyan-400" /> 5s
            </button>
            <button
              onClick={() => adjustTimer(10)}
              className="px-2 py-1 sm:px-2.5 sm:py-2 rounded-lg bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white text-[10px] sm:text-xs font-mono font-bold border border-cyan-500/30 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
              title="Tambah 10 Detik"
            >
              <Plus className="w-3 h-3 text-emerald-400" /> 10s
            </button>
          </div>

          {/* 4. Injury / Medical Warning Button (Waktu Medis) */}
          <button
            onClick={() => setShowMedicalModal(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 active:scale-95 text-rose-300 hover:text-white font-mono font-bold text-xs sm:text-sm border border-rose-500/50 shadow flex items-center gap-1.5 transition-all cursor-pointer glow-red"
            title="Buka Timer Waktu Medis / Dokter (Maks. 3 Menit)"
          >
            <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 animate-pulse" />
            <span>WAKTU MEDIS</span>
          </button>
        </div>

      </div>

      {/* 3. SECONDARY CONTROLS: ROUND & TIME SELECTIONS (LEFT) + OFFICIAL AUDIO SIGNALS (RIGHT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 shrink-0">
        
        {/* Left Card: Round Switcher, Rest Period & Duration Presets */}
        <div className="cyber-glass border border-cyan-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-lg flex flex-col justify-between hud-bracket">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
              <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
              <span>Kontrol Babak & Durasi Pertandingan</span>
            </h3>
            {/* Presets Durasi */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">Set Waktu:</span>
              {[
                { label: '1:30', secs: 90 },
                { label: '2:00', secs: 120 },
                { label: '3:00', secs: 180 }
              ].map((p) => (
                <button
                  key={p.secs}
                  onClick={() => handleChangeDuration(p.secs)}
                  disabled={timer.isRunning}
                  className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    timer.durationTotal === p.secs
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-[#070e1c] text-cyan-300 hover:text-white border border-cyan-500/30'
                  }`}
                  title={`Ubah durasi babak menjadi ${p.label}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Dropdown Pilihan Babak: 2 Babak & 3 Babak */}
          <div className="flex items-center justify-between gap-1.5 py-1 px-1.5 bg-[#050b17]/90 rounded-lg border border-cyan-500/25 my-1">
            <label htmlFor="timer-total-rounds-select" className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Pilihan Babak:</span>
            </label>
            <div className="relative">
              <select
                id="timer-total-rounds-select"
                value={totalRounds}
                onChange={(e) => changeTotalRounds(Number(e.target.value))}
                className="bg-[#0b162c] text-amber-300 hover:text-amber-200 font-mono font-black text-[10px] sm:text-xs rounded-md px-2 py-0.5 border border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer shadow-sm pr-6 appearance-none"
              >
                <option value={2} className="bg-[#0b162c] text-white">2 Babak</option>
                <option value={3} className="bg-[#0b162c] text-white">3 Babak</option>
              </select>
              <ChevronDown className="w-3 h-3 text-amber-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Round Buttons (Babak 1, 2 atau Babak 1, 2, 3 sesuai totalRounds) */}
          <div className={`grid gap-1 sm:gap-2 my-1 sm:my-1.5 ${totalRounds === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => (
              <button
                key={r}
                onClick={() => changeRound(r)}
                className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-mono font-black text-[11px] sm:text-xs md:text-sm transition-all cursor-pointer ${
                  activeMatch.activeRound === r
                    ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400 glow-red border border-rose-300'
                    : 'bg-[#070e1c] text-slate-300 hover:bg-[#091326] hover:text-white border border-cyan-500/30'
                }`}
              >
                Babak {r}
              </button>
            ))}
          </div>

          {/* Rest Period Toggle Button */}
          <button
            onClick={toggleRestPeriod}
            className={`w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-mono font-extrabold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-1.5 border transition-all cursor-pointer ${
              timer.isRest
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md animate-pulse glow-gold'
                : 'bg-[#070e1c] hover:bg-amber-950/40 text-amber-300 border-amber-500/40'
            }`}
          >
            <Coffee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{timer.isRest ? 'Hentikan Istirahat Babak' : 'Istirahat Babak (60 Detik)'}</span>
          </button>
        </div>

        {/* Right Card: Official Audio Signals (GONG, BUZZER, PELUIT WASIT) */}
        <div className="cyber-glass border border-cyan-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-lg flex flex-col justify-between hud-bracket">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span>Sinyal Audio Resmi Pertandingan</span>
            </h3>
            <span className="text-[9px] font-mono text-cyan-400/80">Web Audio API Offline</span>
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-2 my-1 sm:my-1.5">
            {/* BUZZER 1 */}
            <button
              onClick={playBuzzer}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-mono font-black text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow glow-gold border border-amber-300 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>BUZZER ARENA</span>
            </button>

            {/* BUZZER */}
            <button
              onClick={playBuzzer}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-black text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow glow-red border border-red-300 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>BUZZER</span>
            </button>

            {/* PELUIT */}
            <button
              onClick={playWhistle}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-mono font-black text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow glow-blue border border-blue-300 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>PELUIT WASIT</span>
            </button>
          </div>

          <p className="text-[8px] sm:text-[10px] text-slate-400 text-center font-mono truncate">
            Sinyal suara berdering otomatis pada peringatan 10 detik dan akhir babak
          </p>
        </div>

      </div>

      {/* MODAL 1: HUBUNGKAN GAWAI JURI */}
      {showJuriGawaiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#070e1c] border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-5 shadow-[0_0_50px_rgba(6,182,212,0.35)] relative hud-bracket">
            {/* Close Button */}
            <button
              onClick={() => setShowJuriGawaiModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Wifi className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono font-black text-base sm:text-lg text-white uppercase tracking-wider">
                  HUBUNGKAN GAWAI JURI
                </h3>
                <p className="text-xs font-mono text-cyan-400">
                  Coincidence Consensus System · Sinkronisasi Offline Multi-Perangkat
                </p>
              </div>
            </div>

            <div className="space-y-2.5 my-4">
              {/* Device 1 */}
              <div className="p-3 rounded-xl bg-[#030712] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="font-mono font-bold text-sm text-white">Gawai Juri 1 (Depan)</h4>
                    <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.101 · PIN: 211096</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  TERHUBUNG
                </div>
              </div>

              {/* Device 2 */}
              <div className="p-3 rounded-xl bg-[#030712] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="font-mono font-bold text-sm text-white">Gawai Juri 2 (Kanan)</h4>
                    <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.102 · PIN: 211096</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  TERHUBUNG
                </div>
              </div>

              {/* Device 3 */}
              <div className="p-3 rounded-xl bg-[#030712] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="font-mono font-bold text-sm text-white">Gawai Juri 3 (Kiri)</h4>
                    <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.103 · PIN: 211096</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  TERHUBUNG
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-slate-300 space-y-1">
              <p className="font-bold text-cyan-300">Informasi Jaringan Gelanggang:</p>
              <p>• Seluruh gawai terhubung melalui Firebase Realtime Database sinkron instant.</p>
              <p>• Toleransi konsensus nilai: 1.5 detik (IPSI 2026).</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  playGong();
                  setShowJuriGawaiModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs cursor-pointer shadow transition-all active:scale-95"
              >
                Tutup & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PERTANDINGAN */}
      {showResetMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#070e1c] border-2 border-red-500/60 rounded-2xl max-w-md w-full p-5 shadow-[0_0_50px_rgba(239,68,68,0.35)] relative hud-bracket">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-950 border border-red-500/50 text-red-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">
                  KONFIRMASI RESET PERTANDINGAN
                </h3>
                <p className="text-xs font-mono text-red-400">
                  Tindakan ini akan mengembalikan partai ini ke kondisi awal
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#030712] border border-red-500/30 text-xs font-mono text-slate-300 space-y-2">
              <p>Apakah Anda yakin ingin me-reset pertandingan ini?</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Waktu babak akan kembali ke {formatTime(timer.durationTotal || 120)}.</li>
                <li>Status timer akan dihentikan (Paused).</li>
                <li>Babak aktif akan diset ke Babak 1.</li>
              </ul>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResetMatchModal(false)}
                className="px-4 py-2 rounded-xl bg-[#070e1c] hover:bg-[#091326] text-slate-300 hover:text-white border border-slate-700 font-mono font-bold text-xs cursor-pointer transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetTimer();
                  changeRound(1);
                  setShowResetMatchModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs cursor-pointer shadow glow-red border border-red-400 transition-all active:scale-95"
              >
                Ya, Reset Pertandingan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WAKTU MEDIS / DOKTER (IPSI 2026: MAKS 3 MENIT TOTAL) */}
      {showMedicalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#070e1c] border-2 border-rose-500/60 rounded-2xl max-w-md w-full p-5 shadow-[0_0_50px_rgba(244,63,94,0.35)] relative hud-bracket">
            {/* Close Button */}
            <button
              onClick={() => setShowMedicalModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500/50 text-rose-400">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">
                  WAKTU MEDIS / DOKTER PERTANDINGAN
                </h3>
                <p className="text-[11px] font-mono text-rose-400">
                  Akumulasi maksimal 3 menit (180 detik) dalam satu partai
                </p>
              </div>
            </div>

            {/* Corner Selector */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <button
                onClick={() => setMedicalCorner('RED')}
                className={`py-2 px-3 rounded-xl font-mono font-bold text-xs flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                  medicalCorner === 'RED'
                    ? 'bg-rose-600 text-white border-rose-400 glow-red'
                    : 'bg-[#030712] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>Sudut Merah</span>
                <span className="text-[10px] font-normal">{activeMatch.tanding?.redAthlete?.name || 'Pesilat Merah'}</span>
                <span className="text-xs font-black mt-0.5">Terpakai: {formatTime(medicalSecondsRed)}</span>
              </button>

              <button
                onClick={() => setMedicalCorner('BLUE')}
                className={`py-2 px-3 rounded-xl font-mono font-bold text-xs flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                  medicalCorner === 'BLUE'
                    ? 'bg-cyan-600 text-white border-cyan-400 glow-cyan'
                    : 'bg-[#030712] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>Sudut Biru</span>
                <span className="text-[10px] font-normal">{activeMatch.tanding?.blueAthlete?.name || 'Pesilat Biru'}</span>
                <span className="text-xs font-black mt-0.5">Terpakai: {formatTime(medicalSecondsBlue)}</span>
              </button>
            </div>

            {/* Live Stopwatch for Current Corner */}
            <div className="py-4 my-2 rounded-xl bg-[#030712] border border-rose-500/30 text-center">
              <span className="font-mono text-[10px] font-bold text-slate-400 block uppercase">
                Sisa Waktu Medis {medicalCorner === 'RED' ? 'Sudut Merah' : 'Sudut Biru'}
              </span>
              <span className="font-mono font-black text-4xl text-rose-400 text-glow-red">
                {formatTime(Math.max(0, 180 - (medicalCorner === 'RED' ? medicalSecondsRed : medicalSecondsBlue)))}
              </span>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Total Kuota: 03:00 Menit
              </span>
            </div>

            {/* Action Buttons for Medical Stopwatch */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {!medicalActive ? (
                <button
                  onClick={() => {
                    pauseTimer(); // Auto pause match timer when medical starts
                    setMedicalActive(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow glow-emerald cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Waktu Medis</span>
                </button>
              ) : (
                <button
                  onClick={() => setMedicalActive(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow glow-gold cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Jeda Waktu Medis</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMedicalActive(false);
                  if (medicalCorner === 'RED') setMedicalSecondsRed(0);
                  else setMedicalSecondsBlue(0);
                }}
                className="px-3 py-2 rounded-xl bg-[#030712] hover:bg-slate-900 text-slate-300 font-mono text-xs border border-slate-700 cursor-pointer"
              >
                Reset
              </button>

              <button
                onClick={() => {
                  setMedicalActive(false);
                  setShowMedicalModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
