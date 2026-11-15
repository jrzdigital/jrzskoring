import React, { useState, useEffect, useRef } from 'react';
import { useSilat } from '../../context/SilatContext';
import { Corner, TechniqueType } from '../../types/silat';
import {
  Footprints,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Maximize2,
  Minimize2,
  Timer as TimerIcon,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react';

// White outline icon of a clenched fist for PUKULAN (matches martial arts scoring tablets)
const FistOutlineIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
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

interface JuryPanelProps {
  onBack?: () => void;
}

export const JuryPanel: React.FC<JuryPanelProps> = ({ onBack }) => {
  const {
    config,
    activeMatch,
    selectedJuryNumber,
    submitJuryVote,
    voteVerification,
    incrementJurusMistake,
    decrementJurusMistake,
    setJurusKemantapan,
    submitJurusScore,
    setJurusScoreDirect
  } = useSilat();

  const [lastVoted, setLastVoted] = useState<{ corner: Corner; tech: TechniqueType } | null>(null);
  const [consensusNotice, setConsensusNotice] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Jurus Panel (image.png) Specific States
  const [viewMode, setViewMode] = useState<'AUTO' | 'TANDING' | 'JURUS'>('AUTO');
  const [selectedCorner, setSelectedCorner] = useState<'BLUE' | 'RED'>('BLUE');
  const [isSystemActive, setIsSystemActive] = useState<boolean>(false);
  const [selectedStamina, setSelectedStamina] = useState<number>(0.00);
  const [leftCardPulse, setLeftCardPulse] = useState<boolean>(false);
  const [rightCardPulse, setRightCardPulse] = useState<boolean>(false);
  const [jurusToast, setJurusToast] = useState<string | null>(null);

  // Verifikasi Dewan State
  const verification = activeMatch?.verification;
  const isVerificationActive = verification?.active === true;
  const myVote = verification?.votes?.[selectedJuryNumber];

  const handleVerificationVote = async (vote: 'MERAH' | 'BIRU' | 'TIDAK SAH') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}

    await voteVerification(selectedJuryNumber, vote);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const isTanding = activeMatch?.category === 'TANDING';
  const tanding = activeMatch?.tanding;
  const jurus = activeMatch?.jurus;

  // Mode Juri: Apakah menampilkan Tampilan Jurus (Seni) atau Tanding
  const isJurusScreen = viewMode === 'JURUS' || (viewMode === 'AUTO' && !isTanding);

  // Audio Click Feedback
  const playSound = (freq = 880, duration = 0.08) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }
    } catch {}
  };

  // Simultaneous Two-Button Touch & Press Detection for Activation
  const leftPressedRef = useRef(false);
  const rightPressedRef = useRef(false);
  const isSystemActiveRef = useRef(false);
  const lastPressTimeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const justActivatedRef = useRef<number>(0);

  useEffect(() => {
    isSystemActiveRef.current = isSystemActive;
  }, [isSystemActive]);

  const tryActivateSystem = (from: 'left' | 'right') => {
    const now = Date.now();
    if (from === 'left') {
      lastPressTimeRef.current.left = now;
      if (now - lastPressTimeRef.current.right < 750 || rightPressedRef.current) {
        playSound(1200, 0.15);
        setIsSystemActive(true);
        isSystemActiveRef.current = true;
        justActivatedRef.current = now;
        setJurusToast(null); // Notifikasi langsung disembunyikan ketika sistem aktif
        return true;
      }
    } else {
      lastPressTimeRef.current.right = now;
      if (now - lastPressTimeRef.current.left < 750 || leftPressedRef.current) {
        playSound(1200, 0.15);
        setIsSystemActive(true);
        isSystemActiveRef.current = true;
        justActivatedRef.current = now;
        setJurusToast(null); // Notifikasi langsung disembunyikan ketika sistem aktif
        return true;
      }
    }
    return false;
  };

  // Jurus Event Handlers (Sama Persis Seperti image.png)
  const toggleSystemActive = () => {
    playSound(isSystemActiveRef.current ? 440 : 1200, 0.12);
    setIsSystemActive((prev) => {
      const next = !prev;
      isSystemActiveRef.current = next;
      setJurusToast(null); // Sembunyikan notifikasi saat aktif
      return next;
    });
  };

  const handleLeftButtonPress = () => {
    // Abaikan click sintetis jika baru saja aktif dalam 600ms lewat sentuhan 2 tombol
    if (Date.now() - justActivatedRef.current < 600) {
      return;
    }
    if (currentJurySeni.isSubmitted) return;

    if (!isSystemActiveRef.current && !isSystemActive) {
      if (tryActivateSystem('left')) {
        return;
      }
      playSound(300, 0.15);
      setJurusToast('Tekan tombol kiri & kanan secara bersamaan untuk mengaktifkan sistem.');
      setTimeout(() => setJurusToast(null), 2500);
      return;
    }
    playSound(880, 0.08);
    incrementJurusMistake(selectedJuryNumber);
    setLeftCardPulse(true);
    setTimeout(() => setLeftCardPulse(false), 200);
  };

  const handleRightButtonPress = () => {
    // Abaikan click sintetis jika baru saja aktif dalam 600ms lewat sentuhan 2 tombol
    if (Date.now() - justActivatedRef.current < 600) {
      return;
    }
    if (currentJurySeni.isSubmitted) {
      setJurusToast(`Nilai Juri #${selectedJuryNumber} sudah terkunci sah.`);
      setTimeout(() => setJurusToast(null), 2000);
      return;
    }

    if (!isSystemActiveRef.current && !isSystemActive) {
      if (tryActivateSystem('right')) {
        return;
      }
      playSound(300, 0.15);
      setJurusToast('Tekan tombol kiri & kanan secara bersamaan untuk mengaktifkan sistem.');
      setTimeout(() => setJurusToast(null), 2500);
      return;
    }
    playSound(1000, 0.15);
    submitJurusScore(selectedJuryNumber);
    setRightCardPulse(true);
    setTimeout(() => setRightCardPulse(false), 200);
    setJurusToast(`NILAI JURI #${selectedJuryNumber} BERHASIL DIKIRIM & DISAHKAN!`);
    setTimeout(() => setJurusToast(null), 3000);
  };

  const handleBackspace = () => {
    if (currentJurySeni.isSubmitted) return;
    playSound(600, 0.06);
    decrementJurusMistake(selectedJuryNumber);
  };

  const handleSelectStamina = (val: number) => {
    if (currentJurySeni.isSubmitted) return;
    playSound(950, 0.06);
    setSelectedStamina(val);
    setJurusKemantapan(selectedJuryNumber, val);
  };

  const handleResetDefault = () => {
    if (currentJurySeni.isSubmitted) return;
    playSound(500, 0.1);
    setJurusScoreDirect(selectedJuryNumber, { kesalahanCount: 0, kemantapanScore: 0.00 });
    setSelectedStamina(0.00);
    setJurusToast('Nilai Juri di-reset ke nilai standar awal.');
    setTimeout(() => setJurusToast(null), 2500);
  };

  // Shortcut Keyboard Juri (ArrowLeft/A/1: Penilaian, ArrowRight/D/2: Kirim Nilai, Backspace: Batalkan, Space/Enter: Aktifkan)
  useEffect(() => {
    if (!isJurusScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === '1') {
        handleLeftButtonPress();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '2') {
        handleRightButtonPress();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJurusScreen, isSystemActive, selectedJuryNumber, selectedStamina]);

  // Current Jury Seni Score Object
  const currentJurySeni = jurus?.juryScores[selectedJuryNumber] || {
    juryNumber: selectedJuryNumber,
    kebenaranBase: 9.90,
    kesalahanCount: 0,
    kebenaranFinal: 9.90,
    kemantapanScore: 0.05,
    penaltyDeduction: 0,
    finalScore: 9.95,
    isSubmitted: false
  };

  // Skor Dinamis Jurus Presisi 100% Sesuai image.png
  const mistakeCount = currentJurySeni.kesalahanCount || 0;
  const displayAccuracyScore = (9.90 - mistakeCount * 0.01).toFixed(2);
  const displayStaminaScore = selectedStamina > 0 ? selectedStamina.toFixed(2) : '0.00';
  const displayTotalScore = (selectedStamina === 0 && mistakeCount === 0)
    ? '9.00'
    : selectedStamina === 0
    ? ((9.90 - mistakeCount * 0.01) - 0.90).toFixed(2)
    : ((9.90 - mistakeCount * 0.01) + selectedStamina).toFixed(2);

  // Performer Data (Sudut Biru default, atau Sudut Merah jika diklik)
  const displayContingent = selectedCorner === 'BLUE'
    ? (activeMatch?.tanding?.blueAthlete?.contingent || jurus?.performer?.contingent || 'BALI')
    : (activeMatch?.tanding?.redAthlete?.contingent || 'JAWA BARAT');

  const displayAthleteName = selectedCorner === 'BLUE'
    ? (activeMatch?.tanding?.blueAthlete?.name || jurus?.performer?.name || 'BENNY G. SUMARSONO')
    : (activeMatch?.tanding?.redAthlete?.name || 'I GEDE ARYA');

  const categoryDisplayTitle = activeMatch?.category === 'JURUS_GANDA'
    ? 'GANDA BAKU (IPSI/PERSILAT)'
    : activeMatch?.category === 'JURUS_REGU'
    ? 'REGU BAKU (IPSI/PERSILAT)'
    : activeMatch?.category === 'SOLO_KREATIF'
    ? 'SOLO KREATIF (IPSI/PERSILAT)'
    : 'TUNGGAL BAKU (IPSI/PERSILAT)';

  const subCategoryTitle = activeMatch?.category === 'JURUS_GANDA'
    ? 'JURUS GANDA (3 MENIT)'
    : activeMatch?.category === 'JURUS_REGU'
    ? 'JURUS REGU (100 GERAKAN - 3 MENIT)'
    : activeMatch?.category === 'SOLO_KREATIF'
    ? 'SOLO KREATIF (3 MENIT)'
    : 'JURUS TUNGGAL FULL (100 GERAKAN - 3 MENIT)';

  // Listen to approvedHits changes to show real-time consensus confirmation for Tanding
  const totalApprovedHits = (tanding?.redScores.approvedHits.length || 0) + (tanding?.blueScores.approvedHits.length || 0);
  useEffect(() => {
    if (!tanding) return;
    const latestRed = tanding.redScores.approvedHits[0];
    const latestBlue = tanding.blueScores.approvedHits[0];
    const latest = [latestRed, latestBlue].filter(Boolean).sort((a, b) => (b!.id > a!.id ? 1 : -1))[0];

    if (latest && latest.juryConfirmed.length >= 2) {
      const cornerLabel = latest.corner === 'BLUE' ? 'SUDUT BIRU' : 'SUDUT MERAH';
      const techLabel = latest.technique;
      const ptsLabel = latest.points > 0 ? `+${latest.points}` : latest.points;
      const juriesLabel = latest.juryConfirmed.join(' & ');
      setConsensusNotice(`NILAI SAH! ${ptsLabel} ${techLabel} ${cornerLabel} (Disahkan Juri ${juriesLabel})`);
      const timer = setTimeout(() => setConsensusNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [totalApprovedHits]);

  if (!activeMatch) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-600 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 shadow-sm transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title="Kembali ke Halaman Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Belum ada partai aktif</h2>
        <p className="text-sm text-slate-500 mt-1">Silakan pilih atau jadwalkan partai pertandingan di Panel Sekretaris.</p>
      </div>
    );
  }

  // Handle Touch Press for Tanding (PUKULAN / TENDANGAN)
  const handleVote = (corner: Corner, tech: TechniqueType) => {
    submitJuryVote(selectedJuryNumber, corner, tech);
    setLastVoted({ corner, tech });
    setTimeout(() => setLastVoted(null), 2000);
  };

  // Check pending vote from this jury within 2 seconds
  const currentPendingVotes = tanding?.currentVotes || [];
  const hasPendingVote = (corner: Corner, tech: TechniqueType) => {
    return currentPendingVotes.some(
      (v) => v.juryNumber === selectedJuryNumber && v.corner === corner && v.technique === tech
    );
  };

  // ================= RENDER TAMPILAN JURUS (SAMA PERSIS 100% SEPERTI CONTOH image.png) =================
  if (isJurusScreen) {
    return (
      <div className="w-full h-screen h-[100dvh] max-h-[100dvh] bg-[#040814] text-slate-100 font-sans p-1.5 sm:p-2.5 md:p-3.5 flex flex-col justify-between select-none overflow-hidden touch-manipulation">
        
        {/* Toast Notifikasi Jurus */}
        {jurusToast && (
          <div className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-[#09152e] text-yellow-300 border-2 border-yellow-400 font-mono font-black text-xs sm:text-sm shadow-2xl animate-bounce flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
            <span>{jurusToast}</span>
          </div>
        )}

        <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5 max-w-[1700px] w-full mx-auto flex-1 min-h-0 flex flex-col justify-between">
          
          {/* ================= 1. BARIS ATAS: KONTINGEN, NAMA ATLET, PILIH SUDUT, ARENA & KELAS ================= */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 border-b border-slate-800/80 pb-1 shrink-0">
            
            {/* Sisi Kiri: BALI & BENNY G. SUMARSONO */}
            <div className="text-left min-w-0 max-w-[32%] sm:max-w-none">
              <div className="text-cyan-400 font-mono text-[9px] sm:text-xs font-bold tracking-wider uppercase truncate">
                {displayContingent}
              </div>
              <h1 className="text-white font-mono text-xs sm:text-base md:text-xl font-black tracking-wide uppercase truncate mt-0.5">
                {displayAthleteName}
              </h1>
            </div>

            {/* Tengah: Selector Pill [● SUDUT BIRU] & [● SUDUT MERAH] */}
            <div className="flex items-center justify-center shrink-0">
              <div className="inline-flex items-center bg-[#070f20] border border-slate-700/80 rounded-full p-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setSelectedCorner('BLUE')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-black font-mono transition-all cursor-pointer ${
                    selectedCorner === 'BLUE'
                      ? 'bg-[#1d64ec] text-white shadow-[0_0_15px_rgba(29,100,236,0.8)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs text-blue-200">●</span>
                  <span>SUDUT BIRU</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCorner('RED')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-black font-mono transition-all cursor-pointer ${
                    selectedCorner === 'RED'
                      ? 'bg-[#dc2626] text-white shadow-[0_0_15px_rgba(220,38,38,0.8)]'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs text-red-400">●</span>
                  <span>SUDUT MERAH</span>
                </button>
              </div>
            </div>

            {/* Sisi Kanan: GELANGGANG 1, PARTAI 2 & TUNGGAL BAKU (IPSI/PERSILAT) */}
            <div className="text-right shrink-0 max-w-[32%] sm:max-w-none">
              <div className="text-cyan-400 font-mono text-[9px] sm:text-xs font-bold tracking-wider uppercase truncate">
                {activeMatch?.arena || 'GELANGGANG 1'}, PARTAI {activeMatch?.matchNumber || 2}
              </div>
              <div className="text-yellow-400 font-mono text-[10px] sm:text-xs md:text-base font-black tracking-wider uppercase truncate mt-0.5">
                {categoryDisplayTitle}
              </div>
            </div>
          </div>

          {/* ================= 2. SUB-HEADER: SALAH: 0, JURUS TUNGGAL FULL, UNLOCKED, 🔒 JURI 1 ================= */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 py-0.5 text-xs font-mono shrink-0">
            
            {/* SALAH: 0 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-slate-200 font-bold tracking-wider text-[10px] sm:text-xs">SALAH:</span>
              <span className="px-2 py-0.5 rounded bg-[#eab308] text-slate-950 font-black text-xs sm:text-sm shadow">
                {mistakeCount}
              </span>
            </div>

            {/* JURUS TUNGGAL FULL (100 GERAKAN - 3 MENIT) */}
            <div className="text-slate-100 font-bold tracking-widest uppercase text-center text-[9px] sm:text-[11px] md:text-xs truncate px-1">
              {subCategoryTitle}
            </div>

            {/* UNLOCKED & 🔒 JURI 1 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className={`font-black tracking-wider text-[10px] sm:text-xs ${isSystemActive ? 'text-[#00f0ff]' : 'text-slate-400'}`}>
                {isSystemActive ? 'UNLOCKED' : 'LOCKED'}
              </span>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500 bg-[#071328] text-cyan-400 font-bold shadow text-[10px] sm:text-xs">
                <Lock className="w-3 h-3" />
                <span>JURI {selectedJuryNumber}</span>
              </div>
            </div>
          </div>

          {/* ================= 3. WARNING ALERT BANNER: HANYA MUNCUL KETIKA SISTEM BELUM AKTIF ================= */}
          {/* Ketika juri telah menekan 2 tombol sekaligus dan sistem telah aktif, notifikasi ini disembunyikan sesuai perintah user */}
          {!isSystemActive && (
            <div className="w-full px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-yellow-600/80 bg-[#161208] flex items-center justify-between gap-2 text-[10px] sm:text-xs md:text-sm font-mono font-bold text-yellow-300 shadow-md shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">
                  SISTEM JURI BELUM AKTIF — TEKAN TOMBOL KIRI & KANAN SECARA BERSAMAAN
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSound(1200, 0.15);
                  setIsSystemActive(true);
                  isSystemActiveRef.current = true;
                  justActivatedRef.current = Date.now();
                  setJurusToast(null);
                }}
                className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-[#78350f] hover:bg-[#92400e] border border-yellow-500 text-yellow-300 font-mono font-black text-[10px] sm:text-xs tracking-wider cursor-pointer active:scale-95 transition-all shadow shrink-0"
              >
                TEKAN KIRI & KANAN
              </button>
            </div>
          )}

          {/* ================= 4. AREA UTAMA: 2 TOMBOL RAKSASA & HUB LOGO TENGAH ================= */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-2.5 md:gap-4 items-stretch flex-1 min-h-0 my-0.5 sm:my-1">
            
            {/* TOMBOL KIRI: PENILAIAN */}
            <button
              type="button"
              onClick={handleLeftButtonPress}
              onTouchStart={() => {
                leftPressedRef.current = true;
                lastPressTimeRef.current.left = Date.now();
                if (!isSystemActiveRef.current && !isSystemActive) {
                  tryActivateSystem('left');
                }
              }}
              onTouchEnd={() => {
                leftPressedRef.current = false;
              }}
              className={`h-full min-h-0 rounded-2xl sm:rounded-3xl bg-red-600/50 border p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] shadow-2xl relative select-none group touch-manipulation ${
                leftCardPulse
                  ? 'border-yellow-400 ring-4 ring-yellow-400/50 bg-red-600/70'
                  : 'border-red-500/60 hover:border-red-400'
              }`}
            >
              <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-cyan-500 bg-cyan-950/70 text-cyan-400 font-mono text-[9px] sm:text-xs font-bold tracking-wider mb-1.5 sm:mb-2.5">
                ◀ TOMBOL KIRI
              </div>
              <div className="text-yellow-400 font-mono text-xl sm:text-3xl md:text-5xl font-black tracking-widest uppercase group-hover:scale-105 transition-transform leading-tight">
                PENILAIAN
              </div>
              <div className="text-yellow-500/90 font-mono text-[9px] sm:text-xs md:text-sm font-bold mt-1 sm:mt-2 line-clamp-2">
                {isSystemActive ? 'Tekan untuk Mencatat Kesalahan (-0.01)' : 'Tekan bersama Tombol Kanan untuk Aktifkan'}
              </div>
            </button>

            {/* HUB TENGAH: LOGO JRZ SCORE, BADGE IPSI 2026 & PERSILAT, BOX JURI */}
            <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 w-20 sm:w-32 md:w-40 shrink-0 py-0.5 self-center mx-auto">
              {/* JRZ SCORE Logo */}
              <div className="flex flex-col items-center justify-center">
                <img
                  src="./jrzscoreutama.png"
                  alt="JRZ SCORE"
                  className="h-8 sm:h-12 md:h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* IPSI 2026 & PERSILAT Badge */}
              <div className="px-1.5 sm:px-2 py-0.5 rounded-full border border-cyan-500/70 bg-[#061226] text-cyan-400 font-mono text-[8px] sm:text-[10px] font-bold tracking-wider uppercase shadow-sm text-center">
                IPSI 2026 & PERSILAT
              </div>

              {/* JURI 1 (TEKAN KIRI+KANAN) Box */}
              {/* Ketika sistem telah aktif, notifikasi 'SISTEM AKTIF' / 'TEKAN KIRI+KANAN' disembunyikan sesuai perintah user */}
              <button
                type="button"
                onClick={toggleSystemActive}
                className={`w-full px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer text-center shadow-md ${
                  isSystemActive
                    ? 'border-cyan-500/80 bg-[#051c36] text-cyan-300'
                    : 'border-yellow-500/80 bg-[#1e1506] text-yellow-400 animate-pulse'
                }`}
                title="Klik untuk Mengaktifkan / Mengunci Sistem Juri"
              >
                <span className="font-mono font-black text-[10px] sm:text-xs uppercase leading-tight block">
                  JURI {selectedJuryNumber}
                </span>
                {!isSystemActive && (
                  <span className="font-mono text-[8px] sm:text-[9px] opacity-80 block mt-0.5">
                    TEKAN KIRI+KANAN
                  </span>
                )}
              </button>
            </div>

            {/* TOMBOL KANAN: KIRIM NILAI */}
            <button
              type="button"
              onClick={handleRightButtonPress}
              onTouchStart={() => {
                rightPressedRef.current = true;
                lastPressTimeRef.current.right = Date.now();
                if (!isSystemActiveRef.current && !isSystemActive) {
                  tryActivateSystem('right');
                }
              }}
              onTouchEnd={() => {
                rightPressedRef.current = false;
              }}
              className={`h-full min-h-0 rounded-2xl sm:rounded-3xl bg-green-600/50 border p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] shadow-2xl relative select-none group touch-manipulation ${
                rightCardPulse
                  ? 'border-yellow-400 ring-4 ring-yellow-400/50 bg-green-600/70'
                  : 'border-green-500/60 hover:border-green-400'
              }`}
            >
              <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-cyan-500 bg-cyan-950/70 text-cyan-400 font-mono text-[9px] sm:text-xs font-bold tracking-wider mb-1.5 sm:mb-2.5">
                TOMBOL KANAN ▶
              </div>
              <div className="text-yellow-400 font-mono text-xl sm:text-3xl md:text-5xl font-black tracking-widest uppercase group-hover:scale-105 transition-transform leading-tight">
                KIRIM NILAI
              </div>
              <div className="text-yellow-500/90 font-mono text-[9px] sm:text-xs md:text-sm font-bold mt-1 sm:mt-2 line-clamp-2">
                {isSystemActive ? 'Kirim & Sahkan Nilai Juri ke Server' : 'Tekan bersama Tombol Kiri untuk Aktifkan'}
              </div>
            </button>

          </div>

          {/* ================= 5. KONTROL NILAI BAWAH: BACKSPACE, ACCURACY, FLOW, TOTAL SCORE ================= */}
          <div className="space-y-0.5 sm:space-y-1 pt-0.5 sm:pt-1 border-t border-slate-800/80 shrink-0">
            
            {/* Baris 1: BACKSPACE & ACCURACY TOTAL SCORE */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={handleBackspace}
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-700 bg-[#070e1b] hover:border-cyan-500 text-slate-300 hover:text-white font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
                title="Batalkan / Koreksi Kesalahan Terakhir (+0.01)"
              >
                <span className="text-xs sm:text-sm">⌧</span>
                <span>BACKSPACE</span>
              </button>

              <div className="text-slate-200 font-mono font-bold text-[10px] sm:text-xs tracking-widest uppercase text-center flex-1 truncate px-1">
                ACCURACY TOTAL SCORE
              </div>

              <div className="text-cyan-400 font-mono font-black text-lg sm:text-2xl md:text-3xl tracking-wider min-w-[55px] sm:min-w-[65px] text-right shrink-0">
                {displayAccuracyScore}
              </div>
            </div>

            {/* Baris 2: FLOW OF MOVEMENT / STAMINA (0.01 - 0.10) */}
            <div className="space-y-0.5">
              <div className="text-slate-300 font-mono text-[9px] sm:text-xs font-bold tracking-widest uppercase text-center truncate">
                FLOW OF MOVEMENT / STAMINA (RANGE SCORE : 0.01 - 0.10)
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <div className="grid grid-cols-10 gap-0.5 sm:gap-1 flex-1">
                  {[0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectStamina(val)}
                      className={`py-1 sm:py-1.5 rounded font-mono text-[9px] sm:text-xs font-bold transition-all cursor-pointer text-center px-0.5 ${
                        Math.abs(selectedStamina - val) < 0.005
                          ? 'bg-cyan-600 border border-cyan-400 text-white font-black shadow-md ring-1 ring-cyan-300'
                          : 'bg-[#061022] border border-slate-800 hover:border-cyan-500/70 text-slate-300 hover:text-white'
                      }`}
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>

                <div className="text-cyan-400 font-mono font-black text-lg sm:text-2xl md:text-3xl tracking-wider shrink-0 ml-1 sm:ml-2 min-w-[55px] sm:min-w-[65px] text-right">
                  {displayStaminaScore}
                </div>
              </div>
            </div>

            {/* Baris 3: RESET DEFAULT & TOTAL SCORE JURI 1 */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-3 pt-0.5">
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-slate-400 hover:text-yellow-400 font-mono text-[10px] sm:text-xs font-bold underline cursor-pointer tracking-wider shrink-0"
              >
                RESET DEFAULT
              </button>

              <div className="text-yellow-400 font-mono font-black text-[11px] sm:text-sm tracking-widest uppercase text-center flex-1 truncate px-1">
                TOTAL SCORE JURI {selectedJuryNumber}
              </div>

              <div className="text-yellow-400 font-mono font-black text-xl sm:text-3xl md:text-4xl tracking-wider min-w-[70px] sm:min-w-[80px] text-right shrink-0">
                {displayTotalScore}
              </div>
            </div>

            {/* Baris 4: FOOTER BAR (KEMBALI KE MENU PERAN, FULLSCREEN, VERSI SISTEM) */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 text-[9px] sm:text-xs font-mono">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 flex-wrap">
                <button
                  type="button"
                  onClick={handleBack}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  ← KEMBALI
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>

                {/* Tombol Beralih Mode jika sedang aktif kategori Tanding */}
                {isTanding && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('TANDING')}
                      className="text-amber-400 hover:text-amber-300 cursor-pointer underline"
                    >
                      Panel Tanding
                    </button>
                  </>
                )}
              </div>

              <div className="text-cyan-400 font-bold tracking-wider text-right text-[8px] sm:text-[10px] md:text-xs truncate">
                JRZ SCORE TGR - IPSI 2026 & PERSILAT
              </div>
            </div>

          </div>

        </div>

        {/* Verifikasi Dewan Modal (Jika Dewan Mengaktifkan Verifikasi) */}
        {isVerificationActive && verification && (
          <div className="fixed inset-0 z-50 bg-[#040813]/98 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-fade-in font-sans border-4 border-amber-400 glow-gold shadow-2xl">
            <div className="border-b-2 border-amber-400/40 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 border-2 border-amber-400 text-amber-300 animate-pulse">
                    <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[11px] font-mono tracking-wider">
                        SESI VERIFIKASI RESMI DEWAN (IPSI 2026)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold">
                        JURI #{selectedJuryNumber}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide font-mono mt-1">
                      {verification.type === 'JATUHAN' ? 'VERIFIKASI JATUHAN (+3 POIN JATUHAN)' : 'VERIFIKASI PELANGGARAN'}
                    </h2>
                  </div>
                </div>

                {myVote && (
                  <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/60 rounded-xl px-4 py-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-300">STATUS SUARA ANDA:</span>
                    <span className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono uppercase ${
                      myVote === 'MERAH'
                        ? 'bg-red-600 text-white glow-red'
                        : myVote === 'BIRU'
                        ? 'bg-blue-600 text-white glow-blue'
                        : 'bg-amber-500 text-slate-950 glow-gold'
                    }`}>
                      {myVote}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="my-auto py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
              <button
                type="button"
                onClick={() => handleVerificationVote('MERAH')}
                className={`py-8 sm:py-12 px-4 rounded-3xl font-black text-lg sm:text-2xl uppercase font-mono transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xl ${
                  myVote === 'MERAH' ? 'bg-red-600 text-white border-4 border-rose-300 scale-105' : 'bg-red-950/80 hover:bg-red-900 border-2 border-red-500 text-red-100'
                }`}
              >
                <span className="text-3xl sm:text-4xl">🔴</span>
                <span>SAH MERAH</span>
              </button>
              <button
                type="button"
                onClick={() => handleVerificationVote('TIDAK SAH')}
                className={`py-8 sm:py-12 px-4 rounded-3xl font-black text-lg sm:text-2xl uppercase font-mono transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xl ${
                  myVote === 'TIDAK SAH' ? 'bg-amber-500 text-slate-950 border-4 border-amber-200 scale-105' : 'bg-[#1e1b18] hover:bg-amber-950/80 border-2 border-amber-500 text-amber-200'
                }`}
              >
                <span className="text-3xl sm:text-4xl">🟡</span>
                <span>TIDAK SAH</span>
              </button>
              <button
                type="button"
                onClick={() => handleVerificationVote('BIRU')}
                className={`py-8 sm:py-12 px-4 rounded-3xl font-black text-lg sm:text-2xl uppercase font-mono transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xl ${
                  myVote === 'BIRU' ? 'bg-blue-600 text-white border-4 border-cyan-300 scale-105' : 'bg-blue-950/80 hover:bg-blue-900 border-2 border-blue-500 text-blue-100'
                }`}
              >
                <span className="text-3xl sm:text-4xl">🔵</span>
                <span>SAH BIRU</span>
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-1.5 sm:px-3 md:px-4 py-1 sm:py-2 md:py-3 bg-gradient-to-br from-[#19072b] via-[#05040a] to-[#030d22] font-sans text-slate-100 h-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between select-none cyber-arena-bg touch-manipulation overflow-hidden">
      
      {/* ================= HEADER ATAS TANDING ================= */}
      <header className="cyber-glass border border-cyan-500/30 rounded-2xl p-2 sm:p-3 shadow-lg flex items-center justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 hud-bracket shrink-0">
        
        {/* Left: Tombol Kembali di Sudut Kiri Header & Badge Juri */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 sm:p-2.5 rounded-xl bg-[#070e1c]/90 hover:bg-[#091326] border border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 shadow-sm hover:glow-cyan transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
            title="Kembali ke Halaman Utama"
            aria-label="Kembali ke Halaman Utama"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-[#070e1c] border border-cyan-500/40 text-cyan-300 font-mono font-black text-xs sm:text-sm tracking-wider uppercase glow-cyan shrink-0">
            JURI MEJA #{selectedJuryNumber}
          </div>

          <div className="hidden sm:block">
            <div className="text-xs sm:text-sm font-black text-white uppercase truncate max-w-xs md:max-w-md font-sans">
              {config.tournamentName || 'KEJUARAAN PENCAK SILAT'}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-cyan-400/90 flex items-center gap-2 font-mono">
              <span>{activeMatch.arena} · Partai #{activeMatch.matchNumber}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="text-amber-400 font-black">
                BABAK {activeMatch.activeRound}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Timer, Tombol Switch ke Jurus, & Fullscreen Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tombol Cepat Beralih ke Juri Jurus (Seni) */}
          <button
            type="button"
            onClick={() => setViewMode('JURUS')}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-[11px] sm:text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
            title="Buka Antarmuka Juri Jurus Seni"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mode Juri Jurus</span>
          </button>

          {activeMatch.timer?.timeRemaining !== undefined && (
            <span className="font-mono bg-[#070e1c] text-cyan-400 text-glow-cyan px-2 sm:px-3 py-1 rounded-xl border border-cyan-500/40 font-bold flex items-center gap-1 text-xs sm:text-sm glow-cyan shrink-0">
              <TimerIcon className="w-3.5 h-3.5 text-cyan-400" />
              {Math.floor(activeMatch.timer.timeRemaining / 60).toString().padStart(2, '0')}:{(activeMatch.timer.timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2.5 rounded-xl bg-[#070e1c]/90 hover:bg-[#091326] active:scale-95 text-cyan-400 hover:text-white border border-cyan-500/40 shadow-sm transition-transform cursor-pointer shrink-0"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </header>

      {/* Alert Banner Konsensus Nilai Sah Tanding */}
      {consensusNotice && (
        <div className="mb-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-center gap-2 animate-bounce border-2 border-emerald-400 font-black text-xs sm:text-sm glow-emerald font-mono shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
          <span className="truncate">{consensusNotice}</span>
        </div>
      )}

      {/* Main 2 Columns Tanding: Presisi untuk Android/iOS/Tablet */}
      {tanding && (
        <div className="flex-1 min-h-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-5 flex-1 min-h-0 items-stretch">
            {/* Sudut Biru */}
            <div className="cyber-glass-deep border-2 border-[#2563eb] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-5 glow-blue flex flex-col justify-between space-y-2 sm:space-y-4 hud-bracket min-h-0">
              <div className="border-b-2 border-blue-500/30 pb-1.5 sm:pb-3 shrink-0">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                  <span className="bg-[#2563eb] text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs glow-blue font-mono">
                    SUDUT BIRU
                  </span>
                </div>
                <h2 className="text-sm sm:text-xl md:text-2xl font-black text-white uppercase truncate">
                  {tanding.blueAthlete.name}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-cyan-300 font-extrabold uppercase mt-0.5 truncate">
                  {tanding.blueAthlete.contingent}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 flex-1 min-h-0">
                <button
                  type="button"
                  onClick={() => handleVote('BLUE', 'PUKULAN')}
                  className={`w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] active:scale-95 text-white font-black glow-blue flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all cursor-pointer border-2 ${
                    hasPendingVote('BLUE', 'PUKULAN') ? 'border-amber-300 ring-4 ring-amber-300/50 glow-gold' : 'border-[#3b82f6]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
                    <FistOutlineIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white drop-shadow shrink-0" />
                    <div className="text-left min-w-0">
                      <span className="text-base sm:text-2xl md:text-4xl tracking-wider block font-black truncate">
                        PUKULAN
                      </span>
                      {hasPendingVote('BLUE', 'PUKULAN') && (
                        <span className="text-[9px] sm:text-xs text-amber-200 font-bold block animate-pulse font-mono truncate">
                          ● Menunggu Juri (2.0s)...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-[#040813]/60 border border-cyan-400/50 text-cyan-300 font-mono text-xl sm:text-3xl md:text-4xl font-black shadow-inner text-glow-cyan shrink-0">
                    +1
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote('BLUE', 'TENDANGAN')}
                  className={`w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] active:scale-95 text-white font-black glow-blue flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all cursor-pointer border-2 ${
                    hasPendingVote('BLUE', 'TENDANGAN') ? 'border-amber-300 ring-4 ring-amber-300/50 glow-gold' : 'border-[#3b82f6]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
                    <Footprints className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white drop-shadow shrink-0" />
                    <div className="text-left min-w-0">
                      <span className="text-base sm:text-2xl md:text-4xl tracking-wider block font-black truncate">
                        TENDANGAN
                      </span>
                      {hasPendingVote('BLUE', 'TENDANGAN') && (
                        <span className="text-[9px] sm:text-xs text-amber-200 font-bold block animate-pulse font-mono truncate">
                          ● Menunggu Juri (2.0s)...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-[#040813]/60 border border-cyan-400/50 text-cyan-300 font-mono text-xl sm:text-3xl md:text-4xl font-black shadow-inner text-glow-cyan shrink-0">
                    +2
                  </div>
                </button>
              </div>
            </div>

            {/* Sudut Merah */}
            <div className="cyber-glass-deep border-2 border-[#dc2626] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-5 glow-red flex flex-col justify-between space-y-2 sm:space-y-4 hud-bracket min-h-0">
              <div className="border-b-2 border-red-500/30 pb-1.5 sm:pb-3 shrink-0">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                  <span className="bg-[#dc2626] text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs glow-red font-mono">
                    SUDUT MERAH
                  </span>
                </div>
                <h2 className="text-sm sm:text-xl md:text-2xl font-black text-white uppercase truncate">
                  {tanding.redAthlete.name}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-red-300 font-extrabold uppercase mt-0.5 truncate">
                  {tanding.redAthlete.contingent}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 flex-1 min-h-0">
                <button
                  type="button"
                  onClick={() => handleVote('RED', 'PUKULAN')}
                  className={`w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#991b1b] to-[#dc2626] hover:from-[#dc2626] hover:to-[#ef4444] active:scale-95 text-white font-black glow-red flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all cursor-pointer border-2 ${
                    hasPendingVote('RED', 'PUKULAN') ? 'border-amber-300 ring-4 ring-amber-300/50 glow-gold' : 'border-[#ef4444]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
                    <FistOutlineIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white drop-shadow shrink-0" />
                    <div className="text-left min-w-0">
                      <span className="text-base sm:text-2xl md:text-4xl tracking-wider block font-black truncate">
                        PUKULAN
                      </span>
                      {hasPendingVote('RED', 'PUKULAN') && (
                        <span className="text-[9px] sm:text-xs text-amber-200 font-bold block animate-pulse font-mono truncate">
                          ● Menunggu Juri (2.0s)...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-[#040813]/60 border border-red-400/50 text-red-200 font-mono text-xl sm:text-3xl md:text-4xl font-black shadow-inner text-glow-red shrink-0">
                    +1
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote('RED', 'TENDANGAN')}
                  className={`w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#7f1d1d] to-[#dc2626] hover:from-[#dc2626] hover:to-[#ef4444] active:scale-95 text-white font-black glow-red flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all cursor-pointer border-2 ${
                    hasPendingVote('RED', 'TENDANGAN') ? 'border-amber-300 ring-4 ring-amber-300/50 glow-gold' : 'border-[#ef4444]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
                    <Footprints className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white drop-shadow shrink-0" />
                    <div className="text-left min-w-0">
                      <span className="text-base sm:text-2xl md:text-4xl tracking-wider block font-black truncate">
                        TENDANGAN
                      </span>
                      {hasPendingVote('RED', 'TENDANGAN') && (
                        <span className="text-[9px] sm:text-xs text-amber-200 font-bold block animate-pulse font-mono truncate">
                          ● Menunggu Juri (2.0s)...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-[#040813]/60 border border-red-400/50 text-red-200 font-mono text-xl sm:text-3xl md:text-4xl font-black shadow-inner text-glow-red shrink-0">
                    +2
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status confirmation */}
      {lastVoted && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#070e1c] text-white shadow-2xl flex items-center gap-2.5 animate-slide-up border-2 border-cyan-400 glow-cyan font-mono">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-black">
            Tombol {lastVoted.corner === 'RED' ? 'MERAH' : 'BIRU'} {lastVoted.tech} Terkirim! (Valid 2.0 Detik)
          </span>
        </div>
      )}

      {/* Verifikasi Dewan Modal (Tanding) - Menu Pop-up Juri */}
      {isVerificationActive && verification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-sm sm:max-w-md bg-[#0b1328] border-2 border-amber-400 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.85)] p-5 sm:p-6 text-center text-white relative">
            {/* Paling atas: Icon danger (tanda seru di dalam segitiga) */}
            <div className="flex justify-center mb-2.5">
              <div className="p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-amber-400 inline-flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse">
                <AlertTriangle className="w-10 h-10 sm:w-11 sm:h-11 text-amber-400 stroke-[2.5]" />
              </div>
            </div>

            {/* Tulisan: Verifikasi Dewan */}
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide font-mono">
              Verifikasi Dewan
            </h2>

            {/* Tipe : jenis verifikasi sesuai pilihan didewan (jatuhan/pelanggaran) */}
            <div className="text-sm sm:text-base font-bold text-amber-300 mt-1.5 flex items-center justify-center gap-1.5">
              <span className="text-slate-300 font-semibold">Tipe :</span>
              <span className="font-extrabold uppercase bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/40">
                {verification.type === 'JATUHAN' ? 'Jatuhan' : verification.type === 'PELANGGARAN' ? 'Pelanggaran' : verification.type}
              </span>
            </div>

            {/* Keterangan permintaan keputusan */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-3 px-1 leading-relaxed">
              Dewan Penilai meminta keputusan juri terkait keabsahan aksi baru-baru ini. Berikan keputusan Anda :
            </p>

            {/* 3 Kotak dialog pilihan: Urutan Grid BIRU - KUNING - MERAH */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mt-5">
              {/* Grid 1: Grid warna Biru dengan tulisan "BIRU" */}
              <button
                type="button"
                onClick={() => handleVerificationVote('BIRU')}
                className={`py-5 sm:py-6 px-2 rounded-xl font-black text-base sm:text-lg uppercase font-mono transition-all transform active:scale-95 flex items-center justify-center cursor-pointer shadow-lg ${
                  myVote === 'BIRU'
                    ? 'bg-blue-600 text-white border-2 border-white ring-4 ring-cyan-300 scale-105 shadow-[0_0_25px_rgba(37,99,235,0.9)]'
                    : 'bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                }`}
                title="Sah Sudut Biru"
                aria-label="Pilih Sah Sudut Biru"
              >
                <span>BIRU</span>
              </button>

              {/* Grid 2: Grid Warna Kuning Dengan Tulisan "TIDAK SAH" */}
              <button
                type="button"
                onClick={() => handleVerificationVote('TIDAK SAH')}
                className={`py-5 sm:py-6 px-2 rounded-xl font-black text-sm sm:text-base uppercase font-mono transition-all transform active:scale-95 flex items-center justify-center cursor-pointer shadow-lg leading-tight ${
                  myVote === 'TIDAK SAH'
                    ? 'bg-amber-400 text-slate-950 border-2 border-white ring-4 ring-amber-200 scale-105 shadow-[0_0_25px_rgba(245,158,11,0.9)]'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                }`}
                title="Tidak Sah"
                aria-label="Pilih Tidak Sah"
              >
                <span>TIDAK SAH</span>
              </button>

              {/* Grid 3: Grid Berwarna Merah dengan Tulisan "MERAH" */}
              <button
                type="button"
                onClick={() => handleVerificationVote('MERAH')}
                className={`py-5 sm:py-6 px-2 rounded-xl font-black text-base sm:text-lg uppercase font-mono transition-all transform active:scale-95 flex items-center justify-center cursor-pointer shadow-lg ${
                  myVote === 'MERAH'
                    ? 'bg-red-600 text-white border-2 border-white ring-4 ring-rose-300 scale-105 shadow-[0_0_25px_rgba(239,68,68,0.9)]'
                    : 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                }`}
                title="Sah Sudut Merah"
                aria-label="Pilih Sah Sudut Merah"
              >
                <span>MERAH</span>
              </button>
            </div>

            {/* Status Feedback Keputusan Suara */}
            {myVote ? (
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Keputusan Anda: <span className="underline uppercase">{myVote}</span> (Tercatat)</span>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 italic">
                Silakan tekan salah satu tombol di atas untuk mencatat keputusan Anda.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

