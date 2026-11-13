import React, { useState, useEffect, useRef } from 'react';
import { useSilat } from '../../context/SilatContext';
import { Corner, TechniqueType } from '../../types/silat';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  User,
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatWaktu, hitungPenaltiWaktuOtomatis } from '../../services/ipsiRules';
import {
  iconPeringatan1,
  iconPeringatan2,
  iconBinaan1,
  iconBinaan2,
  iconTeguran1,
  iconTeguran2,
} from '../../assets/penaltyIcons';
import { getDynamicFontSizeClass, getDynamicTextStyle } from '../../utils/textScalingHelper';

interface MonitorPanelProps {
  onBack?: () => void;
}

// Audio Feedback Synthesizer
const playAudioFeedback = (freq: number = 800, duration: number = 0.05) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio error
  }
};

// SVG Pesilat Top Watermark
const PesilatStanceWatermark: React.FC<{ flip?: boolean; className?: string }> = ({ flip = false, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-14 h-14 sm:w-16 sm:h-16 text-cyan-400/25 pointer-events-none select-none ${flip ? '-scale-x-100' : ''} ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head */}
    <circle cx="50" cy="22" r="7" />
    <path d="M47 18 L53 18" />
    {/* Body / Torso */}
    <path d="M50 29 L50 48" />
    {/* Belt / Sash */}
    <path d="M44 48 L56 48" />
    <path d="M48 48 L46 58" />
    <path d="M52 48 L54 57" />
    {/* Left Arm (Pasang Depan) */}
    <path d="M50 33 L36 31 L26 23" />
    <circle cx="25" cy="22" r="2" fill="currentColor" />
    {/* Right Arm (Siku Tangkis) */}
    <path d="M50 33 L64 36 L72 26" />
    <circle cx="73" cy="25" r="2" fill="currentColor" />
    {/* Left Leg (Kuda-kuda Depan) */}
    <path d="M50 48 L35 60 L24 76 L18 78" />
    {/* Right Leg (Kuda-kuda Belakang) */}
    <path d="M50 48 L65 58 L78 74 L86 77" />
  </svg>
);

// Center Silat Upper (Standing Kembangan Stance)
const SilatStanceCenterTop: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    className="w-20 h-20 sm:w-24 sm:h-24 text-slate-300 pointer-events-none select-none opacity-80"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head */}
    <circle cx="60" cy="20" r="7.5" />
    <path d="M57 16 L63 16" />
    {/* Torso */}
    <path d="M60 28 L59 50" />
    {/* Belt */}
    <path d="M52 50 L66 50" />
    <path d="M57 50 L55 60" />
    <path d="M62 50 L64 61" />
    {/* Left Arm Pasang Atas */}
    <path d="M59 32 L44 26 L36 14" />
    <circle cx="35" cy="13" r="2.2" fill="currentColor" />
    {/* Right Arm Pasang Samping */}
    <path d="M60 32 L75 36 L88 32" />
    <circle cx="89" cy="32" r="2.2" fill="currentColor" />
    {/* Legs Kuda-kuda */}
    <path d="M59 50 L42 66 L30 84 L22 86" />
    <path d="M59 50 L76 64 L92 84 L100 86" />
  </svg>
);

// Center Silat Lower (Kuda-kuda Rendah)
const SilatStanceCenterBottom: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    className="w-20 h-20 sm:w-24 sm:h-24 text-slate-300 pointer-events-none select-none opacity-80"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head */}
    <circle cx="62" cy="30" r="7" />
    {/* Torso Rendah */}
    <path d="M61 37 L58 58" />
    {/* Belt */}
    <path d="M50 58 L66 58" />
    <path d="M55 58 L53 68" />
    <path d="M61 58 L63 69" />
    {/* Arms Kuda-kuda Samping */}
    <path d="M60 41 L42 45 L30 40" />
    <circle cx="29" cy="39" r="2" fill="currentColor" />
    <path d="M60 41 L78 43 L90 52" />
    <circle cx="91" cy="53" r="2" fill="currentColor" />
    {/* Legs Lebar Rendah */}
    <path d="M58 58 L38 72 L18 84 L10 86" />
    <path d="M58 58 L82 72 L102 85 L112 87" />
  </svg>
);

// Penalty Slot Silhouette Gestures using official tournament icons
const HandGestureIcon: React.FC<{ type: number; active: boolean; corner: 'BLUE' | 'RED' }> = ({ type, active, corner }) => {
  const getIconData = () => {
    switch (type) {
      case 1:
        return { src: iconBinaan1, alt: 'Binaan 1' };
      case 2:
        return { src: iconBinaan2, alt: 'Binaan 2' };
      case 3:
        return { src: iconTeguran1, alt: 'Teguran 1' };
      case 4:
        return { src: iconTeguran2, alt: 'Teguran 2' };
      case 5:
        return { src: iconPeringatan1, alt: 'Peringatan 1' };
      case 6:
      default:
        return { src: iconPeringatan2, alt: 'Peringatan 2' };
    }
  };

  const { src, alt } = getIconData();

  return (
    <div className="w-full h-full flex items-center justify-center p-0.5 select-none">
      <img
        src={src}
        alt={alt}
        className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain transition-all duration-300 ${
          active
            ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.85)] filter-none'
            : 'opacity-30 grayscale brightness-75'
        }`}
      />
    </div>
  );
};

// Clenched fist icon for PUKULAN in Jury Action Grid
const FistOutlineIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4" />
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
    <path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7" />
    <path d="M6 14a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
  </svg>
);

// Martial arts kick icon for TENDANGAN in Jury Action Grid
const KickActionIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="5" cy="5.5" r="2.2" fill="currentColor" />
    <path d="M6 8.5 L8.5 13.5 L7 19.5" />
    <path d="M7 19.5 L4.5 21" />
    <path d="M7.5 10 L10.5 8.5 L11 6" />
    <path d="M8.5 13 L14.5 11 L20.5 8" />
    <path d="M20.5 8 L22 10.5" />
  </svg>
);

export const MonitorPanel: React.FC<MonitorPanelProps> = ({ onBack }) => {
  const {
    activeMatch,
    config,
    lastVerificationResult,
    clearLastVerificationResult
  } = useSilat();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Verification Decision Overlay State (5 Detik Hitung Mundur)
  const [overlayCountdown, setOverlayCountdown] = useState<number>(0);
  const [activeDecisionOverlay, setActiveDecisionOverlay] = useState<{
    decision: 'MERAH' | 'BIRU' | 'TIDAK SAH';
    type: 'JATUHAN' | 'PELANGGARAN';
    corner: Corner;
  } | null>(null);

  useEffect(() => {
    if (!lastVerificationResult) return;

    setActiveDecisionOverlay(lastVerificationResult);
    setOverlayCountdown(5);

    const interval = setInterval(() => {
      setOverlayCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      setActiveDecisionOverlay(null);
      clearLastVerificationResult();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [lastVerificationResult, clearLastVerificationResult]);

  // Monitor fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    playAudioFeedback(880, 0.05);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleBack = () => {
    playAudioFeedback(600, 0.05);
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Celebration confetti when match finishes
  useEffect(() => {
    if (activeMatch?.status === 'FINISHED' && activeMatch.result) {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
    }
  }, [activeMatch?.status, activeMatch?.result]);

  // Track recently approved hits to illuminate jury cells for ~2.5 seconds (Persilat standard)
  const [recentHits, setRecentHits] = useState<{
    corner: Corner;
    technique: TechniqueType;
    juryConfirmed: number[];
    timestamp: number;
  }[]>([]);
  const lastHitIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeMatch?.tanding) return;
    const allHits = [
      ...(activeMatch.tanding.blueScores?.approvedHits || []),
      ...(activeMatch.tanding.redScores?.approvedHits || [])
    ];
    if (allHits.length === 0) return;
    const latest = allHits[allHits.length - 1];
    if (latest && latest.id !== lastHitIdRef.current) {
      lastHitIdRef.current = latest.id;
      const now = Date.now();
      setRecentHits(prev => [
        ...prev.filter(h => now - h.timestamp < 2500),
        {
          corner: latest.corner,
          technique: latest.technique,
          juryConfirmed: latest.juryConfirmed || [],
          timestamp: now
        }
      ]);
    }
  }, [activeMatch?.tanding?.blueScores?.approvedHits, activeMatch?.tanding?.redScores?.approvedHits]);

  useEffect(() => {
    if (recentHits.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setRecentHits(prev => prev.filter(h => now - h.timestamp < 2500));
    }, 250);
    return () => clearInterval(timer);
  }, [recentHits.length]);

  if (!activeMatch) {
    return (
      <div className="w-full min-h-screen bg-[#050B14] text-cyan-300 flex items-center justify-center p-6 text-center font-mono">
        <div className="border border-cyan-500/30 rounded-2xl p-8 bg-blue-950/40 backdrop-blur-md">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-spin" />
          <h2 className="text-xl font-black uppercase tracking-wider text-white">STANDBY ARENA MONITOR</h2>
          <p className="text-sm text-cyan-400/80 mt-2">Menunggu pemilihan partai dari Panel Sekretaris Pertandingan...</p>
        </div>
      </div>
    );
  }

  const isJurus = activeMatch.category !== 'TANDING';

  // ================= RENDER MONITOR KATEGORI JURUS (STANDAR PERSILAT & PB IPSI 2026) =================
  if (isJurus) {
    const displayMatch = activeMatch;
    const jurusData = displayMatch.jurus;
    const performer = jurusData?.performer || {
      id: 'seni-performer',
      name: 'Ilham Ramadhan',
      contingent: 'Sumatera Barat',
      gender: displayMatch.gender,
      category: displayMatch.category,
      classGroup: displayMatch.classGroup || 'Tunggal Putra Baku',
      ageGroup: displayMatch.ageGroup || 'DEWASA'
    };
    const sudut = jurusData?.performerCorner || 'BLUE';
    const isRedCorner = sudut === 'RED';
    const timerData = displayMatch.timer;
    const durasiTampil = timerData?.elapsedTime || (timerData?.durationTotal ? Math.max(0, timerData.durationTotal - timerData.timeRemaining) : 0) || 0;
    const targetDetik = config.roundDurationSeni || 180;
    const isOvertime = durasiTampil > targetDetik;

    const juryCount = config.jurorsCountSeni || 5;
    const juryNumbers = Array.from({ length: juryCount }, (_, i) => i + 1);

    const juryDetails = juryNumbers.map((num) => {
      const sc = jurusData?.juryScores?.[num];
      const kebenaranBase = sc?.kebenaranBase ?? 9.90;
      const kesalahanCount = sc?.kesalahanCount ?? 0;
      const kebenaranFinal = sc?.kebenaranFinal ?? Number((kebenaranBase - kesalahanCount * 0.01).toFixed(3));
      const kemantapanScore = sc?.kemantapanScore ?? 0.05;
      const penaltyDeduction = sc?.penaltyDeduction ?? 0;
      const finalScore = sc?.finalScore ?? Number((kebenaranFinal + kemantapanScore - penaltyDeduction).toFixed(3));
      const isSubmitted = sc?.isSubmitted ?? true;
      return {
        num,
        kebenaranFinal,
        kemantapanScore,
        penaltyDeduction,
        finalScore,
        isSubmitted
      };
    });

    const sortedScores = [...juryDetails].sort((a, b) => a.finalScore - b.finalScore);
    const droppedMap = new Map<number, 'Tertinggi' | 'Terendah'>();

    if (juryCount >= 8) {
      if (sortedScores[0]) droppedMap.set(sortedScores[0].num, 'Terendah');
      if (sortedScores[1]) droppedMap.set(sortedScores[1].num, 'Terendah');
      const top1 = sortedScores[sortedScores.length - 1];
      const top2 = sortedScores[sortedScores.length - 2];
      if (top1) droppedMap.set(top1.num, 'Tertinggi');
      if (top2) droppedMap.set(top2.num, 'Tertinggi');
    } else if (juryCount >= 5) {
      if (sortedScores[0]) droppedMap.set(sortedScores[0].num, 'Terendah');
      const top1 = sortedScores[sortedScores.length - 1];
      if (top1) droppedMap.set(top1.num, 'Tertinggi');
    }

    const validJuries = juryDetails.filter((j) => !droppedMap.has(j.num));
    const avgJuriSah = validJuries.length > 0
      ? validJuries.reduce((sum, j) => sum + j.finalScore, 0) / validJuries.length
      : 9.95;

    const autoTimePen = hitungPenaltiWaktuOtomatis(durasiTampil, targetDetik);
    const penDewan = jurusData?.penalties || {
      timeToleranceViolation: autoTimePen,
      weaponDropped: 0,
      weaponBroken: 0,
      outOfArena: 0,
      attireViolation: 0,
      unauthorizedSound: 0,
      totalPenalties: autoTimePen
    };

    const totalHukuman = Number((
      (penDewan.timeToleranceViolation || autoTimePen) +
      (penDewan.weaponDropped || 0) +
      (penDewan.weaponBroken || 0) +
      (penDewan.outOfArena || 0) +
      (penDewan.attireViolation || 0) +
      (penDewan.unauthorizedSound || 0)
    ).toFixed(3));

    const finalScore = Math.max(0, Number((avgJuriSah - totalHukuman).toFixed(3)));

    const formatTimerMMSS = (totalSeconds: number) => {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    return (
      <div className="w-full min-h-screen bg-[#030712] text-slate-100 p-3 sm:p-5 flex flex-col justify-between select-none font-sans relative overflow-x-hidden">
        
        {/* Subtle Cyber Arena Background Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* ================= TOP BAR (SESUAI CONTOH GAMBAR) ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-900/40 relative z-20">
          {/* Sisi Kiri: Logo + Gelanggang + Nama Kejuaraan */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow"
              title="Kembali ke Menu Utama"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <img
              src="/jrzscoreutama.png"
              alt="Logo IPSI"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full bg-slate-900 p-0.5 border border-amber-400/50 shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />

            <div className="space-y-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                {displayMatch.arena || config.arenaName || 'GELANGGANG 1'}
              </span>
              <div className="text-xs sm:text-sm font-black uppercase text-white tracking-wider font-mono truncate max-w-[260px] sm:max-w-[420px]">
                {config.tournamentName || 'KEJUARAAN NASIONAL PENCAK SILAT IPSI'}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: 3 Pill Kategori (Jurus Tunggal Baku, Putra - Pra Usia Dini, Partai / Final) + Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Pill 1: Kategori Jurus */}
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#081830] border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]"></span>
              <span className="uppercase">{displayMatch.classGroup || displayMatch.category.replace('_', ' ')}</span>
            </div>

            {/* Pill 2: Gender & Golongan Usia */}
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1e1506] border border-amber-500/60 text-amber-300 font-mono text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"></span>
              <span className="uppercase">{displayMatch.gender || 'PUTRA'} • {displayMatch.ageGroup || 'PRA USIA DINI'}</span>
            </div>

            {/* Pill 3: Partai & Babak */}
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#072016] border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"></span>
              <span className="uppercase">PARTAI {displayMatch.matchNumber} / {displayMatch.stage || 'FINAL'}</span>
            </div>

            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 sm:p-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white rounded-xl border border-cyan-500/40 cursor-pointer shadow active:scale-95 ml-1"
              title={isFullscreen ? 'Keluar Layar Penuh (F11)' : 'Layar Penuh (F11)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Winner Overlay if match is finished */}
        {displayMatch.status === 'FINISHED' && (
          <div className="my-2 relative z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 font-bold border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.5)] text-center animate-pulse">
              <span className="text-xs font-black uppercase tracking-widest block font-mono">
                ★ PENAMPILAN SELESAI & DISAHKAN DEWAN JURI ★
              </span>
              <h3 className="text-base sm:text-lg font-black mt-0.5">
                PESILAT: {performer.name} ({performer.contingent}) — NILAI AKHIR: {finalScore.toFixed(3)}
              </h3>
            </div>
          </div>
        )}

        {/* ================= MAIN SECTION: 2 KOLOM SESUAI CONTOH GAMBAR ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-3 relative z-10 items-stretch">
          
          {/* KOLOM KIRI (DIDALAM GARIS MERAH): SUDUT, NAMA ATLET, KONTINGEN & NILAI AKHIR SAH */}
          <div className="lg:col-span-5 relative rounded-3xl p-6 sm:p-8 border-2 border-cyan-400 bg-gradient-to-b from-[#0a1835]/95 via-[#060f24]/95 to-[#030816] shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col justify-between overflow-hidden backdrop-blur-md">
            
            {/* Watermark Sudut Faint (BIRU / MERAH) */}
            <div className="absolute top-2 right-4 pointer-events-none select-none text-6xl sm:text-7xl lg:text-8xl font-black font-sans uppercase tracking-widest text-cyan-500/10">
              {isRedCorner ? 'MERAH' : 'BIRU'}
            </div>

            <div className="space-y-4 relative z-10">
              {/* Badge Sudut */}
              <div>
                <span className={`inline-block px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black font-mono text-white shadow-md uppercase tracking-wider ${
                  isRedCorner ? 'bg-red-600 shadow-red-900/50' : 'bg-blue-600 shadow-blue-900/50'
                }`}>
                  SUDUT {isRedCorner ? 'MERAH' : 'BIRU'}
                </span>
              </div>

              {/* Nama Atlet */}
              <div>
                <h1 
                  className={`font-black text-white uppercase tracking-tight leading-tight line-clamp-2 ${getDynamicFontSizeClass(performer.name, 'athlete', { variant: 'scoreboard' })}`}
                  style={getDynamicTextStyle(performer.name, 'athlete', 36, 16)}
                >
                  {performer.name}
                </h1>
              </div>

              {/* Asal Kontingen */}
              <div 
                className={`flex items-center gap-2 text-cyan-400 font-extrabold font-mono uppercase tracking-wide ${getDynamicFontSizeClass(performer.contingent, 'contingent')}`}
                style={getDynamicTextStyle(performer.contingent, 'contingent', 18, 12)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0"></span>
                <span>{performer.contingent}</span>
                {performer.teamMembers && performer.teamMembers.length > 0 && (
                  <span className="text-cyan-300/70 text-xs font-normal">
                    ({performer.teamMembers.join(', ')})
                  </span>
                )}
              </div>
            </div>

            {/* Garis Pembatas Horisontal */}
            <div className="my-6 border-t border-cyan-500/20 relative z-10" />

            {/* Skor Akhir yang Sah */}
            <div className="text-center relative z-10 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-mono font-bold tracking-wider text-amber-400 uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
                <span>SKOR AKHIR SAH</span>
              </div>
              <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono text-amber-400 tracking-tight drop-shadow-[0_0_35px_rgba(251,191,36,0.5)]">
                {finalScore.toFixed(3)}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (LINGKARAN MERAH): TIMER PENAMPIL */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-[#0b1426]/90 via-[#070e1c]/95 to-[#040813] shadow-[0_0_25px_rgba(15,23,42,0.5)] flex flex-col justify-between overflow-hidden backdrop-blur-md">
            
            {/* Header: WAKTU TAMPIL */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold tracking-wider text-amber-400 uppercase">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>WAKTU TAMPIL</span>
            </div>

            {/* Kotak Recessed Timer */}
            <div className="my-auto py-8 sm:py-12 px-4 rounded-3xl bg-[#040711] border border-slate-800/80 shadow-inner text-center space-y-4">
              {/* Digit Timer Raksasa (mm:ss) */}
              <div className={`text-7xl sm:text-8xl lg:text-9xl font-black font-mono tracking-tight leading-none ${
                isOvertime 
                  ? 'text-red-500 animate-pulse drop-shadow-[0_0_40px_rgba(239,68,68,0.7)]' 
                  : 'text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.5)]'
              }`}>
                {formatTimerMMSS(durasiTampil)}
              </div>

              {/* Status Berhenti / Berjalan */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  timerData?.isRunning 
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                    : 'bg-slate-500'
                }`}></span>
                <span>
                  STATUS: {timerData?.isRunning ? 'BERJALAN' : durasiTampil > 0 ? (isOvertime ? 'OVERTIME' : 'BERHENTI') : 'BERHENTI'}
                </span>
              </div>
            </div>

            {/* Footer Keterangan Target Durasi */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2">
              <span>TARGET: {Math.floor(targetDetik / 60)}:00 MENIT</span>
              <span>{isOvertime ? 'WAKTU MELEBIHI BATAS' : durasiTampil > 0 ? `BERJALAN: ${durasiTampil} DETIK` : 'MENUNGGU MULAI'}</span>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM ROW: NILAI JURI BERTUGAS (URUTAN TERKECIL KE TERBESAR) ================= */}
        <div className="space-y-2 pt-3 relative z-10 border-t border-cyan-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-cyan-300 uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
              <span>NILAI JURI BERTUGAS (URUTAN TERKECIL KE TERBESAR)</span>
            </div>

            <div className="px-3.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 font-mono text-xs sm:text-sm font-bold shadow-sm">
              NILAI MEDIAN ({juryCount} JURI): {finalScore.toFixed(3)}
            </div>
          </div>

          {/* Grid Tile J1 ... J10 */}
          <div className={`grid gap-2 ${
            juryCount === 3
              ? 'grid-cols-3'
              : juryCount === 5
              ? 'grid-cols-5'
              : 'grid-cols-5 sm:grid-cols-10'
          }`}>
            {sortedScores.map((j, idx) => {
              const hasScore = j.isSubmitted || j.finalScore > 0;
              const isDropped = droppedMap.has(j.num);
              const displayNum = idx + 1;

              return (
                <div
                  key={j.num}
                  className="rounded-xl overflow-hidden border border-cyan-900/40 bg-[#050b18] shadow-sm flex flex-col"
                >
                  {/* Header J1, J2, ... */}
                  <div className="bg-[#09152b] py-1 text-center font-mono font-bold text-[11px] text-cyan-300 border-b border-cyan-900/30">
                    J{displayNum}
                  </div>

                  {/* Nilai Juri */}
                  <div className="h-12 sm:h-14 flex items-center justify-center p-1 text-center">
                    <span className={`text-base sm:text-lg font-mono font-black ${
                      !hasScore
                        ? 'text-slate-600'
                        : isDropped
                        ? 'text-red-400/80 line-through'
                        : 'text-slate-100'
                    }`}>
                      {hasScore ? j.finalScore.toFixed(3) : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= TANDING MONITOR =================
  const isTanding = activeMatch.category === 'TANDING';
  const tanding = activeMatch.tanding;
  const jurus = activeMatch.jurus;
  const timer = activeMatch.timer;

  // Skor utama & Logika Sudut Unggul Poin (Warna dasar abu-abu netral, warna sudut aktif hanya saat unggul/pemenang)
  const bluePoints = tanding?.blueScores?.totalPoints ?? 0;
  const redPoints = tanding?.redScores?.totalPoints ?? 0;
  const isMatchFinished = activeMatch.status === 'FINISHED';
  const winnerCorner = activeMatch.result?.winnerCorner;
  const isBlueLeading = (isMatchFinished && winnerCorner)
    ? winnerCorner === 'BLUE'
    : (isTanding && bluePoints > redPoints);
  const isRedLeading = (isMatchFinished && winnerCorner)
    ? winnerCorner === 'RED'
    : (isTanding && redPoints > bluePoints);

  // Format Timer mm:ss and hundredths
  const formatTimerDigits = (seconds: number) => {
    const s = Math.max(0, seconds || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return {
      main: `${String(m).padStart(2, '0')} : ${String(sec).padStart(2, '0')}`,
      sub: ': 00'
    };
  };

  const timerDigits = formatTimerDigits(timer.isRest ? timer.restTimeRemaining : timer.timeRemaining);

  // Tournament and Match Info Subtitle exact to monitor.JPG
  const tournamentTitle = (config.tournamentName && config.tournamentName.trim() !== '')
    ? config.tournamentName.toUpperCase()
    : 'KEJUARAAN PENCAK SILAT NASIONAL';

  const matchCategoryText = activeMatch.category === 'TANDING'
    ? `${activeMatch.ageGroup || 'DEWASA'} | ${activeMatch.classGroup || 'KELAS C (55KG - 60KG)'} - ${activeMatch.gender || 'PUTRA'}`
    : `${activeMatch.category} - ${activeMatch.gender || 'PUTRA'}`;

  const matchHeaderSubtitle = `PARTAI ${String(activeMatch.matchNumber).padStart(2, '0')} | ${matchCategoryText} | ${activeMatch.stage || 'PENYISIHAN'} | ${activeMatch.arena || 'A'}`;

  // Helper checking penalty status
  const hasPenalty = (corner: 'BLUE' | 'RED', type: string) => {
    if (!tanding) return false;
    const scores = corner === 'BLUE' ? tanding.blueScores : tanding.redScores;
    return scores.penalties.some(p => p.type === type);
  };

  const getJatuhanCount = (corner: 'BLUE' | 'RED') => {
    if (!tanding) return 0;
    const scores = corner === 'BLUE' ? tanding.blueScores : tanding.redScores;
    return scores.approvedHits.filter(h => h.technique === 'JATUHAN').length;
  };

  // Jumlah Juri Kategori Jurus (Seni) Sesuai Konfigurasi Sekretaris (3, 5, atau 10 Juri)
  const activeSeniJuryCount = config.jurorsCountSeni || 5;
  const seniJuryIds = Array.from({ length: activeSeniJuryCount }, (_, i) => i + 1);

  const seniJuriesData = seniJuryIds.map((num) => {
    const sc = jurus?.juryScores?.[num];
    return {
      num,
      finalScore: sc ? sc.finalScore : 9.950,
      kebenaranFinal: sc ? sc.kebenaranFinal : 9.90,
      kemantapanScore: sc ? sc.kemantapanScore : 0.05,
      kesalahanCount: sc ? sc.kesalahanCount : 0,
      isSubmitted: sc ? sc.isSubmitted : false
    };
  });

  const sortedSeniJuries = [...seniJuriesData].sort((a, b) => a.finalScore - b.finalScore);
  const seniRankMap = new Map<number, number>();
  sortedSeniJuries.forEach((item, index) => {
    seniRankMap.set(item.num, index + 1);
  });

  let discardedSeniNums = new Set<number>();
  let medianSeniNums = new Set<number>();
  if (activeSeniJuryCount === 10) {
    discardedSeniNums = new Set([
      sortedSeniJuries[0]?.num,
      sortedSeniJuries[1]?.num,
      sortedSeniJuries[8]?.num,
      sortedSeniJuries[9]?.num
    ].filter(Boolean));
    medianSeniNums = new Set([sortedSeniJuries[4]?.num, sortedSeniJuries[5]?.num].filter(Boolean));
  } else if (activeSeniJuryCount === 5) {
    discardedSeniNums = new Set([
      sortedSeniJuries[0]?.num,
      sortedSeniJuries[4]?.num
    ].filter(Boolean));
    medianSeniNums = new Set([sortedSeniJuries[2]?.num].filter(Boolean));
  } else {
    discardedSeniNums = new Set();
    medianSeniNums = new Set([sortedSeniJuries[1]?.num].filter(Boolean));
  }



  // Check if a jury has a pending unconfirmed vote for corner + technique (2.0s window)
  const isVotePending = (corner: Corner, tech: TechniqueType, juryId: number) => {
    if (!tanding?.currentVotes) return false;
    const now = Date.now();
    return tanding.currentVotes.some(
      v => v.corner === corner && v.technique === tech && v.juryNumber === juryId && (now - v.timestamp < 2200)
    );
  };

  // Check if a jury confirmed a recent hit
  const isHitConfirmed = (corner: Corner, tech: TechniqueType, juryId: number) => {
    const now = Date.now();
    return recentHits.some(
      h => h.corner === corner && h.technique === tech && h.juryConfirmed.includes(juryId) && (now - h.timestamp < 2500)
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#19072b] via-[#05040a] to-[#030d22] text-white flex flex-col justify-between p-2 sm:p-3 relative overflow-hidden select-none font-sans cyber-arena-bg">
      
      {/* Background Stance Watermarks (Top Left & Top Right) */}
      <div className="absolute top-2 left-4 z-0 pointer-events-none opacity-40">
        <PesilatStanceWatermark />
      </div>
      <div className="absolute top-2 right-4 z-0 pointer-events-none opacity-40">
        <PesilatStanceWatermark flip={true} />
      </div>

      {/* TOP BAR / CONTROLS (Floating back & fullscreen buttons) */}
      <div className="relative z-20 flex items-center justify-between mb-1">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
          title="Kembali"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* TOP CENTER CAPSULE HEADER */}
        <div className="flex-1 max-w-2xl mx-auto px-2">
          <div className="rounded-full border-2 border-cyan-500/80 bg-gradient-to-r from-blue-950 via-[#0A1A3A] to-blue-950 px-6 sm:px-10 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.35)] text-center">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider font-sans leading-tight">
              {tournamentTitle}
            </h1>
            <p className="text-[10px] sm:text-[11px] md:text-xs font-bold text-cyan-300 uppercase tracking-wide mt-0.5 font-mono">
              {matchHeaderSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">LIVE ARENA</span>
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* WINNER OVERLAY (If match finished) */}
      {activeMatch.status === 'FINISHED' && activeMatch.result && (
        <div className="relative z-30 my-1 p-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-lg border-2 border-slate-900 text-center animate-pulse shrink-0">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest block font-mono">
            ★ KEPUTUSAN PEMENANG RESMI PERTANDINGAN ★
          </span>
          <h2 className="text-base sm:text-xl font-black tracking-tight mt-0.5">
            {isTanding && tanding
              ? `PEMENANG: SUDUT ${activeMatch.result.winnerCorner === 'RED' ? 'MERAH' : 'BIRU'} - ${
                  activeMatch.result.winnerCorner === 'RED'
                    ? tanding.redAthlete.name
                    : tanding.blueAthlete.name
                } (${activeMatch.result.winnerCorner === 'RED' ? tanding.redAthlete.contingent : tanding.blueAthlete.contingent})`
              : `PESILAT: ${jurus.performer.name} - NILAI AKHIR: ${jurus.finalMedianScore.toFixed(3)}`
            }
          </h2>
          <span className="text-xs font-extrabold mt-0.5 inline-block px-3 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono">
            MENANG {activeMatch.result.winType}
          </span>
        </div>
      )}

      {/* BANNER TRANSPARAN VERIFIKASI DEWAN SEDANG BERLANGSUNG */}
      {activeMatch.verification?.active && (
        <div className="relative z-30 my-1 px-4 py-2.5 rounded-2xl bg-[#040813]/85 backdrop-blur-md border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tracking-widest uppercase block animate-pulse">
                VERIFIKASI DEWAN SEDANG BERLANGSUNG
              </span>
              <span className="text-[11px] text-slate-300 font-semibold block">
                {activeMatch.verification.type === 'JATUHAN' ? 'Tinjauan Jatuhan' : 'Tinjauan Pelanggaran'} • Sudut {activeMatch.verification.corner === 'BLUE' ? 'BIRU' : 'MERAH'} (&ldquo;{activeMatch.verification.reason}&rdquo;)
              </span>
            </div>
          </div>

          {/* Status Suara Juri (J1, J2, J3) Secara Live */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((jId) => {
              const v = activeMatch.verification?.votes?.[jId];
              return (
                <div
                  key={jId}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-black flex items-center gap-1.5 transition-all ${
                    v === 'MERAH'
                      ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.7)] scale-105'
                      : v === 'BIRU'
                      ? 'bg-blue-950/90 border-blue-500 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.7)] scale-105'
                      : v === 'TIDAK SAH'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.7)] scale-105'
                      : 'bg-[#071326]/90 border-slate-700 text-slate-400 animate-pulse'
                  }`}
                >
                  <span className="text-[10px] text-cyan-400">J{jId}:</span>
                  <span>{v || 'MENUNGGU'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= CORNER HEADER ROW ================= */}
      {isTanding && tanding ? (
        <div className="relative z-10 grid grid-cols-12 gap-2 sm:gap-3 items-end mb-2">
          
          {/* SUDUT BIRU HEADER & TAB */}
          <div className="col-span-5 flex flex-col items-start min-w-0">
            {/* Top tab badge KONTINGEN BIRU */}
            <div 
              className={`bg-[#0080FF] text-white font-black px-4 py-1 rounded-t-lg uppercase tracking-wider font-mono shadow-md ml-1 max-w-[95%] truncate ${getDynamicFontSizeClass(tanding.blueAthlete?.contingent, 'contingent', { variant: 'badge' })}`}
              style={getDynamicTextStyle(tanding.blueAthlete?.contingent, 'contingent', 12, 9)}
            >
              {tanding.blueAthlete?.contingent || 'KONTINGEN BIRU'}
            </div>
            {/* Blue corner capsule */}
            <div className="w-full rounded-xl border-2 border-cyan-400 bg-gradient-to-r from-cyan-950 via-[#0A2550] to-blue-900 p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 shadow-[0_0_15px_rgba(6,182,212,0.3)] min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-cyan-400/70 bg-cyan-950 flex items-center justify-center text-cyan-300 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 
                  className={`font-black text-white uppercase tracking-wider ${getDynamicFontSizeClass(tanding.blueAthlete?.name, 'athlete', { variant: 'monitor' })}`}
                  style={getDynamicTextStyle(tanding.blueAthlete?.name, 'athlete', 20, 11)}
                >
                  {tanding.blueAthlete?.name || 'SUDUT BIRU'}
                </h2>
              </div>
            </div>
          </div>

          {/* CENTER DIGITAL TIMER DISPLAY */}
          <div className="col-span-2 flex flex-col items-center justify-end">
            <div className="w-full rounded-xl border-2 border-slate-700/80 bg-slate-950/90 py-1.5 px-2 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] border-cyan-500/30">
              <div className="flex items-baseline justify-center font-mono font-black text-amber-400 text-xl sm:text-2xl md:text-3xl tracking-wider leading-none">
                <span>{timerDigits.main}</span>
                <span className="text-xs sm:text-sm text-amber-300/80 ml-1 font-bold">{timerDigits.sub}</span>
              </div>
            </div>
          </div>

          {/* SUDUT MERAH HEADER & TAB */}
          <div className="col-span-5 flex flex-col items-end min-w-0">
            {/* Top tab badge KONTINGEN MERAH */}
            <div 
              className={`bg-[#E11D48] text-white font-black px-4 py-1 rounded-t-lg uppercase tracking-wider font-mono shadow-md mr-1 max-w-[95%] truncate ${getDynamicFontSizeClass(tanding.redAthlete?.contingent, 'contingent', { variant: 'badge' })}`}
              style={getDynamicTextStyle(tanding.redAthlete?.contingent, 'contingent', 12, 9)}
            >
              {tanding.redAthlete?.contingent || 'KONTINGEN MERAH'}
            </div>
            {/* Red corner capsule */}
            <div className="w-full rounded-xl border-2 border-red-500 bg-gradient-to-l from-red-950 via-[#400B1A] to-rose-900 p-2 sm:p-2.5 flex items-center justify-end gap-2.5 sm:gap-3 shadow-[0_0_15px_rgba(239,68,68,0.3)] min-w-0">
              <div className="min-w-0 flex-1 text-right">
                <h2 
                  className={`font-black text-white uppercase tracking-wider ${getDynamicFontSizeClass(tanding.redAthlete?.name, 'athlete', { variant: 'monitor' })}`}
                  style={getDynamicTextStyle(tanding.redAthlete?.name, 'athlete', 20, 11)}
                >
                  {tanding.redAthlete?.name || 'SUDUT MERAH'}
                </h2>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-red-400/70 bg-red-950 flex items-center justify-center text-red-300 shrink-0">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>
      ) : null}

      {/* ================= MAIN SCOREBOARD AREA (3 COLUMNS) ================= */}
      {isTanding && tanding ? (
        <div className="relative z-10 flex-1 grid grid-cols-12 gap-2 sm:gap-3 items-stretch min-h-0 mb-2">
          
          {/* ================= LEFT SIDE: SUDUT BIRU ================= */}
          <div className="col-span-5 flex gap-2 h-full min-h-0">
            
            {/* Outer Penalty Column (Jatuhan & 6 Gestures) */}
            <div className="w-24 sm:w-28 md:w-32 lg:w-36 shrink-0 rounded-xl border-2 border-cyan-500/50 bg-[#071326] flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              {/* Jatuhan counter badge - Enlarge text & count, legible from afar, proportional & dynamic */}
              <div
                className={`rounded-xl border-2 transition-all duration-300 py-1.5 px-1 sm:px-2 text-center flex flex-col items-center justify-center relative overflow-hidden select-none ${
                  getJatuhanCount('BLUE') > 0
                    ? 'border-cyan-300 bg-gradient-to-b from-cyan-900 via-cyan-950 to-[#031326] shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-1 ring-cyan-300/60'
                    : 'border-cyan-500/50 bg-gradient-to-b from-[#092240] to-[#051426] shadow-sm'
                }`}
              >
                {getJatuhanCount('BLUE') > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-400/10 to-cyan-400/25 pointer-events-none animate-pulse" />
                )}

                <div className="flex items-center justify-center gap-1 font-mono font-black text-[10px] sm:text-xs md:text-sm tracking-wider uppercase text-cyan-300 leading-tight">
                  <span>JATUHAN</span>
                  <span className="text-cyan-400">:</span>
                </div>

                <div className="flex items-baseline justify-center gap-0.5 mt-0.5 leading-none">
                  <span
                    className={`font-mono font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all duration-300 ${
                      getJatuhanCount('BLUE') > 0
                        ? 'text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.95)] scale-105'
                        : 'text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {getJatuhanCount('BLUE')}
                  </span>
                  <span
                    className={`font-mono font-black text-xs sm:text-sm md:text-base ${
                      getJatuhanCount('BLUE') > 0 ? 'text-yellow-400 font-bold' : 'text-cyan-300/80 font-bold'
                    }`}
                  >
                    X
                  </span>
                </div>
              </div>

              {/* 6 Gesture Penalty Slots */}
              <div className="flex-1 grid grid-cols-2 gap-1 my-1.5 min-h-0">
                {/* 1. Binaan 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'BINAAN_1')
                      ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Binaan 1"
                >
                  <HandGestureIcon type={1} active={hasPenalty('BLUE', 'BINAAN_1')} corner="BLUE" />
                </div>

                {/* 2. Binaan 2 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'BINAAN_2')
                      ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Binaan 2"
                >
                  <HandGestureIcon type={2} active={hasPenalty('BLUE', 'BINAAN_2')} corner="BLUE" />
                </div>

                {/* 3. Teguran 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'TEGURAN_1')
                      ? 'border-orange-400 bg-orange-950/80 shadow-[0_0_10px_rgba(251,146,60,0.4)]'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Teguran 1 (-1)"
                >
                  <HandGestureIcon type={3} active={hasPenalty('BLUE', 'TEGURAN_1')} corner="BLUE" />
                </div>

                {/* 4. Teguran 2 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'TEGURAN_2')
                      ? 'border-orange-400 bg-orange-950/80 shadow-[0_0_10px_rgba(251,146,60,0.4)]'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Teguran 2 (-2)"
                >
                  <HandGestureIcon type={4} active={hasPenalty('BLUE', 'TEGURAN_2')} corner="BLUE" />
                </div>

                {/* 5. Peringatan 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'PERINGATAN_1')
                      ? 'border-rose-400 bg-rose-950/80 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Peringatan 1 (-5)"
                >
                  <HandGestureIcon type={5} active={hasPenalty('BLUE', 'PERINGATAN_1')} corner="BLUE" />
                </div>

                {/* 6. Peringatan 2 / Diskualifikasi */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('BLUE', 'PERINGATAN_2') || hasPenalty('BLUE', 'DISKUALIFIKASI')
                      ? 'border-red-500 bg-red-950/90 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                      : 'border-cyan-900/60 bg-slate-950/60'
                  }`}
                  title="Peringatan 2 (-10) / Diskualifikasi"
                >
                  <HandGestureIcon
                    type={6}
                    active={hasPenalty('BLUE', 'PERINGATAN_2') || hasPenalty('BLUE', 'DISKUALIFIKASI')}
                    corner="BLUE"
                  />
                </div>
              </div>
            </div>

            {/* Giant Solid Blue Score Box with Leading Gold Rotating Beam & Neutral Gray Base */}
            <div
              className={`flex-1 rounded-2xl relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
                isBlueLeading
                  ? 'p-[3.5px] shadow-[0_0_40px_rgba(234,179,8,0.7),0_0_15px_rgba(250,204,21,0.85)] ring-2 ring-amber-400/60'
                  : isRedLeading
                  ? 'border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner opacity-75'
                  : 'border-2 border-slate-600 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-md'
              }`}
            >
              {/* Rotating Gold Border Line (Outer rotating beam) when Blue is leading */}
              {isBlueLeading && (
                <div
                  className="absolute inset-[-150%] animate-spin-slow pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0 280deg, #b45309 300deg, #f59e0b 320deg, #fef08a 345deg, #ffffff 355deg, #eab308 360deg)',
                  }}
                />
              )}

              {/* Inner Score Container */}
              <div
                className={`relative z-10 w-full h-full rounded-[13px] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isBlueLeading
                    ? 'bg-[#0080FF] border border-amber-300/80 shadow-[inset_0_0_20px_rgba(251,191,36,0.35)]'
                    : isRedLeading
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400'
                    : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-slate-100'
                }`}
              >
                {/* Gold sparkling shimmer particles & badge when leading */}
                {isBlueLeading && (
                  <>
                    {/* Lencana UNGGUL dengan ikon bintang berkilau emas telah dihapus sesuai instruksi */}
                    {isMatchFinished && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md z-20">
                        <span>PEMENANG</span>
                      </div>
                    )}

                    {/* Gold ambient shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-300/20 via-transparent to-amber-400/15 pointer-events-none" />

                    {/* Floating gold glitter sparks */}
                    <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-yellow-200 animate-ping pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-yellow-300 animate-pulse pointer-events-none" />
                  </>
                )}

                <span
                  className={`font-mono font-black text-8xl sm:text-9xl md:text-[140px] lg:text-[170px] leading-none select-none transition-all ${
                    isBlueLeading
                      ? 'drop-shadow-[0_0_30px_rgba(250,204,21,0.95)] text-yellow-50'
                      : isRedLeading
                      ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-slate-400'
                      : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-slate-100'
                  }`}
                >
                  {tanding.blueScores.totalPoints}
                </span>
              </div>
            </div>

          </div>

          {/* ================= CENTER COLUMN: ROUND SELECTOR (LOGO ATAS & BAWAH DIHAPUS) ================= */}
          <div className="col-span-2 rounded-xl border-2 border-slate-800 bg-[#071326] flex flex-col items-center justify-center p-2 text-center h-full min-h-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            
            {/* Round Buttons Stack */}
            <div className="w-full px-1 py-1 space-y-2 font-mono my-auto">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-400 uppercase block mb-1">
                ROUND
              </span>
              {Array.from({ length: Math.max(1, activeMatch.totalRounds || (activeMatch as any).roundCount || config.totalRounds || 3) }, (_, i) => i + 1).map((rNum) => {
                const isActive = activeMatch.activeRound === rNum;
                return (
                  <div
                    key={rNum}
                    className={`w-full py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all text-center ${
                      isActive
                        ? 'bg-[#16A34A] text-white shadow-[0_0_15px_rgba(22,163,74,0.5)] border border-emerald-400'
                        : 'bg-[#0E1F3B] border border-slate-800 text-slate-500'
                    }`}
                  >
                    {rNum}
                  </div>
                );
              })}
            </div>

          </div>

          {/* ================= RIGHT SIDE: SUDUT MERAH ================= */}
          <div className="col-span-5 flex gap-2 h-full min-h-0">
            
            {/* Giant Solid Red Score Box with Leading Gold Rotating Beam & Neutral Gray Base */}
            <div
              className={`flex-1 rounded-2xl relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
                isRedLeading
                  ? 'p-[3.5px] shadow-[0_0_40px_rgba(234,179,8,0.7),0_0_15px_rgba(250,204,21,0.85)] ring-2 ring-amber-400/60'
                  : isBlueLeading
                  ? 'border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner opacity-75'
                  : 'border-2 border-slate-600 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-md'
              }`}
            >
              {/* Rotating Gold Border Line (Outer rotating beam) when Red is leading */}
              {isRedLeading && (
                <div
                  className="absolute inset-[-150%] animate-spin-slow pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0 280deg, #b45309 300deg, #f59e0b 320deg, #fef08a 345deg, #ffffff 355deg, #eab308 360deg)',
                  }}
                />
              )}

              {/* Inner Score Container */}
              <div
                className={`relative z-10 w-full h-full rounded-[13px] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isRedLeading
                    ? 'bg-[#EF4444] border border-amber-300/80 shadow-[inset_0_0_20px_rgba(251,191,36,0.35)]'
                    : isBlueLeading
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400'
                    : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-slate-100'
                }`}
              >
                {/* Gold sparkling shimmer particles & badge when leading */}
                {isRedLeading && (
                  <>
                    {/* Lencana UNGGUL dengan ikon bintang berkilau emas telah dihapus sesuai instruksi */}
                    {isMatchFinished && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md z-20">
                        <span>PEMENANG</span>
                      </div>
                    )}

                    {/* Gold ambient shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-300/20 via-transparent to-amber-400/15 pointer-events-none" />

                    {/* Floating gold glitter sparks */}
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-200 animate-ping pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-yellow-300 animate-pulse pointer-events-none" />
                  </>
                )}

                <span
                  className={`font-mono font-black text-8xl sm:text-9xl md:text-[140px] lg:text-[170px] leading-none select-none transition-all ${
                    isRedLeading
                      ? 'drop-shadow-[0_0_30px_rgba(250,204,21,0.95)] text-yellow-50'
                      : isBlueLeading
                      ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-slate-400'
                      : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-slate-100'
                  }`}
                >
                  {tanding.redScores.totalPoints}
                </span>
              </div>
            </div>

            {/* Outer Penalty Column (Jatuhan & 6 Gestures) */}
            <div className="w-24 sm:w-28 md:w-32 lg:w-36 shrink-0 rounded-xl border-2 border-red-500/50 bg-[#1D080F] flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              {/* Jatuhan counter badge - Enlarge text & count, legible from afar, proportional & dynamic */}
              <div
                className={`rounded-xl border-2 transition-all duration-300 py-1.5 px-1 sm:px-2 text-center flex flex-col items-center justify-center relative overflow-hidden select-none ${
                  getJatuhanCount('RED') > 0
                    ? 'border-red-400 bg-gradient-to-b from-red-900 via-red-950 to-[#20030a] shadow-[0_0_20px_rgba(239,68,68,0.6)] ring-1 ring-red-400/60'
                    : 'border-red-500/50 bg-gradient-to-b from-[#2a0914] to-[#160408] shadow-sm'
                }`}
              >
                {getJatuhanCount('RED') > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/10 to-red-500/25 pointer-events-none animate-pulse" />
                )}

                <div className="flex items-center justify-center gap-1 font-mono font-black text-[10px] sm:text-xs md:text-sm tracking-wider uppercase text-red-300 leading-tight">
                  <span>JATUHAN</span>
                  <span className="text-red-400">:</span>
                </div>

                <div className="flex items-baseline justify-center gap-0.5 mt-0.5 leading-none">
                  <span
                    className={`font-mono font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all duration-300 ${
                      getJatuhanCount('RED') > 0
                        ? 'text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.95)] scale-105'
                        : 'text-red-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {getJatuhanCount('RED')}
                  </span>
                  <span
                    className={`font-mono font-black text-xs sm:text-sm md:text-base ${
                      getJatuhanCount('RED') > 0 ? 'text-yellow-400 font-bold' : 'text-red-300/80 font-bold'
                    }`}
                  >
                    X
                  </span>
                </div>
              </div>

              {/* 6 Gesture Penalty Slots */}
              <div className="flex-1 grid grid-cols-2 gap-1 my-1.5 min-h-0">
                {/* 1. Binaan 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'BINAAN_1')
                      ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Binaan 1"
                >
                  <HandGestureIcon type={1} active={hasPenalty('RED', 'BINAAN_1')} corner="RED" />
                </div>

                {/* 2. Binaan 2 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'BINAAN_2')
                      ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Binaan 2"
                >
                  <HandGestureIcon type={2} active={hasPenalty('RED', 'BINAAN_2')} corner="RED" />
                </div>

                {/* 3. Teguran 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'TEGURAN_1')
                      ? 'border-orange-400 bg-orange-950/80 shadow-[0_0_10px_rgba(251,146,60,0.4)]'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Teguran 1 (-1)"
                >
                  <HandGestureIcon type={3} active={hasPenalty('RED', 'TEGURAN_1')} corner="RED" />
                </div>

                {/* 4. Teguran 2 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'TEGURAN_2')
                      ? 'border-orange-400 bg-orange-950/80 shadow-[0_0_10px_rgba(251,146,60,0.4)]'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Teguran 2 (-2)"
                >
                  <HandGestureIcon type={4} active={hasPenalty('RED', 'TEGURAN_2')} corner="RED" />
                </div>

                {/* 5. Peringatan 1 */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'PERINGATAN_1')
                      ? 'border-rose-400 bg-rose-950/80 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Peringatan 1 (-5)"
                >
                  <HandGestureIcon type={5} active={hasPenalty('RED', 'PERINGATAN_1')} corner="RED" />
                </div>

                {/* 6. Peringatan 2 / Diskualifikasi */}
                <div
                  className={`rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all ${
                    hasPenalty('RED', 'PERINGATAN_2') || hasPenalty('RED', 'DISKUALIFIKASI')
                      ? 'border-red-500 bg-red-950/90 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                      : 'border-red-900/60 bg-slate-950/60'
                  }`}
                  title="Peringatan 2 (-10) / Diskualifikasi"
                >
                  <HandGestureIcon
                    type={6}
                    active={hasPenalty('RED', 'PERINGATAN_2') || hasPenalty('RED', 'DISKUALIFIKASI')}
                    corner="RED"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : null}

      {/* ================= BOTTOM JURY ACTION GRID: EXACT MATCH TO Monitor aksi juri .png ================= */}
      {isTanding && tanding ? (
        <div className="relative z-10 rounded-2xl border-2 border-blue-600/70 bg-[#061226]/95 p-2 sm:p-2.5 shadow-[0_0_25px_rgba(37,99,235,0.4)] backdrop-blur-md">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            
            {/* ROW 1: PUKULAN (FIST ICON IN CENTER) */}
            <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Sudut Biru: Juri 1, 2, 3 */}
              <div className="col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                {[1, 2, 3].map((jId) => {
                  const isPending = isVotePending('BLUE', 'PUKULAN', jId);
                  const isConfirmed = isHitConfirmed('BLUE', 'PUKULAN', jId);
                  return (
                    <div
                      key={`blue-pukulan-${jId}`}
                      className={`h-8 sm:h-9 md:h-10 rounded-lg flex items-center justify-center font-mono text-sm sm:text-base font-black transition-all duration-150 ${
                        isConfirmed
                          ? 'bg-[#0000FF] border-2 border-cyan-300 text-white shadow-[0_0_15px_rgba(0,0,255,0.95)] scale-[1.02]'
                          : isPending
                          ? 'bg-amber-400/30 border-2 border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                          : 'bg-[#081735]/80 border border-blue-900/60 text-blue-300/60'
                      }`}
                    >
                      {jId}
                    </div>
                  );
                })}
              </div>

              {/* Center Column: Pukulan (Fist) Icon */}
              <div className="col-span-2 flex items-center justify-center">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-9 md:w-11 md:h-10 rounded-lg border border-cyan-500/50 bg-[#0A1A3A] flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  title="Pukulan (+1)"
                >
                  <FistOutlineIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                </div>
              </div>

              {/* Sudut Merah: Juri 1, 2, 3 */}
              <div className="col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                {[1, 2, 3].map((jId) => {
                  const isPending = isVotePending('RED', 'PUKULAN', jId);
                  const isConfirmed = isHitConfirmed('RED', 'PUKULAN', jId);
                  return (
                    <div
                      key={`red-pukulan-${jId}`}
                      className={`h-8 sm:h-9 md:h-10 rounded-lg flex items-center justify-center font-mono text-sm sm:text-base font-black transition-all duration-150 ${
                        isConfirmed
                          ? 'bg-[#FF0000] border-2 border-rose-300 text-white shadow-[0_0_15px_rgba(255,0,0,0.95)] scale-[1.02]'
                          : isPending
                          ? 'bg-amber-400/30 border-2 border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                          : 'bg-[#250812]/80 border border-red-900/60 text-red-300/60'
                      }`}
                    >
                      {jId}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: TENDANGAN (KICK ICON IN CENTER) */}
            <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Sudut Biru: Juri 1, 2, 3 */}
              <div className="col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                {[1, 2, 3].map((jId) => {
                  const isPending = isVotePending('BLUE', 'TENDANGAN', jId);
                  const isConfirmed = isHitConfirmed('BLUE', 'TENDANGAN', jId);
                  return (
                    <div
                      key={`blue-tendangan-${jId}`}
                      className={`h-8 sm:h-9 md:h-10 rounded-lg flex items-center justify-center font-mono text-sm sm:text-base font-black transition-all duration-150 ${
                        isConfirmed
                          ? 'bg-[#0000FF] border-2 border-cyan-300 text-white shadow-[0_0_15px_rgba(0,0,255,0.95)] scale-[1.02]'
                          : isPending
                          ? 'bg-amber-400/30 border-2 border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                          : 'bg-[#081735]/80 border border-blue-900/60 text-blue-300/60'
                      }`}
                    >
                      {jId}
                    </div>
                  );
                })}
              </div>

              {/* Center Column: Tendangan (Kick) Icon */}
              <div className="col-span-2 flex items-center justify-center">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-9 md:w-11 md:h-10 rounded-lg border border-cyan-500/50 bg-[#0A1A3A] flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  title="Tendangan (+2)"
                >
                  <KickActionIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                </div>
              </div>

              {/* Sudut Merah: Juri 1, 2, 3 */}
              <div className="col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                {[1, 2, 3].map((jId) => {
                  const isPending = isVotePending('RED', 'TENDANGAN', jId);
                  const isConfirmed = isHitConfirmed('RED', 'TENDANGAN', jId);
                  return (
                    <div
                      key={`red-tendangan-${jId}`}
                      className={`h-8 sm:h-9 md:h-10 rounded-lg flex items-center justify-center font-mono text-sm sm:text-base font-black transition-all duration-150 ${
                        isConfirmed
                          ? 'bg-[#FF0000] border-2 border-rose-300 text-white shadow-[0_0_15px_rgba(255,0,0,0.95)] scale-[1.02]'
                          : isPending
                          ? 'bg-amber-400/30 border-2 border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                          : 'bg-[#250812]/80 border border-red-900/60 text-red-300/60'
                      }`}
                    >
                      {jId}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Status Bar untuk kategori Seni Sesuai Konfigurasi Sekretaris (3, 5, atau 10 Juri) */
        <div className="relative z-10 border border-cyan-500/40 rounded-xl bg-[#071326]/95 p-2 text-center font-mono text-xs text-slate-400 shadow-md">
          <div className={`grid gap-2 ${
            activeSeniJuryCount === 3
              ? 'grid-cols-3'
              : activeSeniJuryCount === 5
              ? 'grid-cols-5'
              : 'grid-cols-5 sm:grid-cols-10'
          }`}>
            {seniJuryIds.map((jId) => (
              <div key={jId} className="border border-cyan-900/50 bg-slate-950/70 py-1.5 px-1 rounded-lg">
                <span className="text-slate-400 text-[10px] font-bold block">JURI {jId}</span>
                <span className={`font-black text-xs ${jurus?.juryScores?.[jId]?.isSubmitted ? 'text-emerald-400' : 'text-cyan-300'}`}>
                  {jurus?.juryScores?.[jId]?.isSubmitted ? 'TERKIRIM' : 'STANDBY'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAY HASIL PUTUSAN BERUKURAN BESAR SELAMA 5 DETIK DENGAN HITUNG MUNDUR */}
      {activeDecisionOverlay && (
        <div className="fixed inset-0 z-50 bg-[#040813]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in font-sans">
          <div
            className={`max-w-2xl w-full p-6 sm:p-10 rounded-3xl border-4 shadow-2xl relative flex flex-col items-center space-y-6 ${
              activeDecisionOverlay.decision === 'MERAH'
                ? 'border-red-500 bg-gradient-to-b from-red-950/90 to-[#040813] shadow-[0_0_60px_rgba(239,68,68,0.8)]'
                : activeDecisionOverlay.decision === 'BIRU'
                ? 'border-blue-500 bg-gradient-to-b from-blue-950/90 to-[#040813] shadow-[0_0_60px_rgba(59,130,246,0.8)]'
                : 'border-slate-300 bg-gradient-to-b from-slate-900/90 to-[#040813] shadow-[0_0_60px_rgba(255,255,255,0.4)]'
            }`}
          >
            {/* Countdown Badge */}
            <div className="px-4 py-1.5 rounded-full bg-slate-950/90 border border-slate-700 text-cyan-400 font-mono text-xs font-black flex items-center gap-2 shadow-inner">
              <span>KEMBALI KE PAPAN SKOR DALAM</span>
              <span className="text-amber-400 text-sm font-black">{overlayCountdown}S</span>
            </div>

            <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-cyan-300">
              HASIL PUTUSAN RESMI DEWAN (IPSI 2026)
            </span>

            {/* Keputusan Berukuran Besar */}
            <div className="my-2">
              {activeDecisionOverlay.decision === 'MERAH' && (
                <div className="space-y-3">
                  <span className="text-6xl sm:text-8xl block animate-bounce">🔴</span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-red-500 uppercase tracking-wider glow-red font-mono">
                    SAH SUDUT MERAH (+3 POIN)
                  </h1>
                  <p className="text-sm sm:text-base text-red-200 font-bold">
                    {activeDecisionOverlay.type === 'JATUHAN'
                      ? 'Jatuhan dinyatakan SAH untuk pesilat Sudut Merah (+3 Poin Jatuhan)'
                      : 'Pelanggaran Sudut Merah Dinyatakan SAH'}
                  </p>
                </div>
              )}

              {activeDecisionOverlay.decision === 'BIRU' && (
                <div className="space-y-3">
                  <span className="text-6xl sm:text-8xl block animate-bounce">🔵</span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-blue-400 uppercase tracking-wider glow-blue font-mono">
                    SAH SUDUT BIRU (+3 POIN)
                  </h1>
                  <p className="text-sm sm:text-base text-blue-200 font-bold">
                    {activeDecisionOverlay.type === 'JATUHAN'
                      ? 'Jatuhan dinyatakan SAH untuk pesilat Sudut Biru (+3 Poin Jatuhan)'
                      : 'Pelanggaran Sudut Biru Dinyatakan SAH'}
                  </p>
                </div>
              )}

              {activeDecisionOverlay.decision === 'TIDAK SAH' && (
                <div className="space-y-3">
                  <span className="text-6xl sm:text-8xl block">⚪</span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 uppercase tracking-wider font-mono">
                    TIDAK SAH (DIBATALKAN)
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 font-bold">
                    Tinjauan verifikasi dewan dinyatakan TIDAK SAH / Dibatalkan
                  </p>
                </div>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(overlayCountdown / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
