import React, { useState } from 'react';
import { useSilat } from '../../context/SilatContext';
import {
  Corner,
  TechniqueType,
  PenaltyType,
  WinType,
  ApprovedScore
} from '../../types/silat';
import {
  Undo2,
  Trophy,
  Scale,
  Ban,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Volume2,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Clock,
  Printer,
  Edit3,
  Award,
  Sparkles,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportPartaiPDF } from '../../services/pdfExport';
import {
  iconPeringatan1,
  iconPeringatan2,
  iconBinaan1,
  iconBinaan2,
  iconTeguran1,
  iconTeguran2,
} from '../../assets/penaltyIcons';

// Inline Web Audio synth helper for click sound effects
function playAudioFeedback(freq = 880, duration = 0.06) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore audio context restrictions
  }
}

interface DewanPanelProps {
  onBack?: () => void;
}

export const DewanPanel: React.FC<DewanPanelProps> = ({ onBack }) => {
  const {
    activeMatch,
    approveDirectScore,
    undoLastScore,
    undoJuryVote,
    applyPenalty,
    removePenalty,
    decideWinner,
    updateSeniPenalties,
    config,
    startVerification,
    voteVerification,
    applyVerificationDecision,
    resetVerification,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    setJurusScoreDirect,
    matches,
    selectActiveMatch,
    athletes
  } = useSilat();

  // Presets Verifikasi Dewan (IPSI 2026)
  const PRESETS_JATUHAN = [
    'Bantingan Murni Sah (Tanpa Pelanggaran)',
    'Sapuan / Guntingan Rebah Bersih',
    'Tangkapan & Serangan Balik 1 Langkah Sah',
    'Jatuhan Bersama: Sudut Ini Berada di Atas Sah',
    'Serangan Balik (Counter Attack) Merebahkan Lawan',
    'Kuncian Sah Merebahkan Lawan (5 Detik)'
  ];

  const PRESETS_PELANGGARAN = [
    'Pukulan / Tendangan Mengarah Kepala / Leher',
    'Menyerang Lawan Saat Posisi Rebah / Jatuh',
    'Menyerang Setelah Wasit Mengucap "TI" / "BERHENTI"',
    'Keluar Garis Batas Gelanggang (Keluar Arena)',
    'Menyerang Area Terlarang (Kemaluan / Tulang Belakang)',
    'Menahan / Menarik Baju Lawan Melebihi Toleransi'
  ];

  // State for Decision Pop-up Modal (Keputusan Kemenangan)
  const [showWinModal, setShowWinModal] = useState(false);
  const [selectedWinnerCorner, setSelectedWinnerCorner] = useState<Corner>('BLUE');
  const [selectedWinType, setSelectedWinType] = useState<WinType>('WMP');

  // State for Jurus Panel (IPSI 2026 & PERSILAT)
  const [viewMode, setViewMode] = useState<'AUTO' | 'TANDING' | 'JURUS'>('AUTO');
  const [selectedJurusCorner, setSelectedJurusCorner] = useState<'BLUE' | 'RED'>('BLUE');
  const [editingJuryNumber, setEditingJuryNumber] = useState<number | null>(null);
  const [editScoreForm, setEditScoreForm] = useState<{ kebenaran: number; kemantapan: number; salah: number }>({
    kebenaran: 9.90,
    kemantapan: 0.05,
    salah: 0
  });
  const [jurusToast, setJurusToast] = useState<string | null>(null);
  const [isJurusLocked, setIsJurusLocked] = useState<boolean>(false);
  const [juryOrderMode, setJuryOrderMode] = useState<'NUM' | 'RANK'>('NUM');
  const [jurusCornerResults, setJurusCornerResults] = useState<{
    BLUE?: { score: number; sd: number; penalties: number; time: number };
    RED?: { score: number; sd: number; penalties: number; time: number };
  }>({});

  // State for Verifikasi Dewan (IPSI 2026) 3-Step Form Modal
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [verifyStep, setVerifyStep] = useState<1 | 2 | 3>(1);
  const [verifyCorner, setVerifyCorner] = useState<Corner>('BLUE');
  const [verifyType, setVerifyType] = useState<'JATUHAN' | 'PELANGGARAN'>('JATUHAN');
  const [verifyReason, setVerifyReason] = useState<string>(PRESETS_JATUHAN[0]);
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [showDewanLiveModal, setShowDewanLiveModal] = useState<boolean>(true);

  // State for Fullscreen Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
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

  if (!activeMatch) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-800 font-sans">
        <div className="bg-white p-8 rounded-2xl border-2 border-slate-900 shadow-xl max-w-lg mx-auto">
          <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-black uppercase text-slate-950">Belum Ada Partai Aktif</h2>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            Silakan pilih partai pertandingan yang sedang berlangsung melalui Panel Sekretaris.
          </p>
        </div>
      </div>
    );
  }

  // Sistem otomatis mengubah tampilan dewan sesuai partai yang dipilih sekretaris (Tanding vs Jurus/Seni)
  const isTandingMatch = activeMatch.category === 'TANDING';
  const isJurusView = !isTandingMatch;
  const isTanding = isTandingMatch;
  const tanding = activeMatch.tanding;
  const jurus = activeMatch.jurus;

  // Data Atlet Penampil Jurus/Seni langsung dari Panel Sekretaris
  const jurusPerformer = jurus?.performer || activeMatch.jurus?.performer || tanding?.blueAthlete || {
    id: 'ath-performer',
    name: 'PESILAT SENI',
    contingent: 'KONTINGEN',
    category: activeMatch.category,
    gender: activeMatch.gender,
    classGroup: activeMatch.classGroup || 'Tunggal Putri Baku'
  };

  // Nama Event Mengikuti Data Input dari Panel Sekretaris
  const eventName = (config.tournamentName && config.tournamentName.trim() !== '')
    ? config.tournamentName.toUpperCase()
    : 'KEJUARAAN PENCAK SILAT NASIONAL';

  // Data Partai yang Sedang Berlangsung dari Panel Sekretaris
  const matchInfoText = `PARTAI ${String(activeMatch.matchNumber).padStart(2, '0')} • ${
    activeMatch.classGroup ? activeMatch.classGroup.toUpperCase() : `TANDING ${activeMatch.category}`
  }${activeMatch.gender ? ` (${activeMatch.gender})` : ''}`;

  // Helper untuk format timer MM:SS
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Submit Finalize Winner
  const handleFinalizeWinner = () => {
    playAudioFeedback(950, 0.1);
    const winnerName = selectedWinnerCorner === 'BLUE' ? tanding?.blueAthlete?.name : tanding?.redAthlete?.name;
    const cornerLabel = selectedWinnerCorner === 'BLUE' ? 'SUDUT BIRU' : 'SUDUT MERAH';

    decideWinner(selectedWinnerCorner, selectedWinType, config.leadRefereeName || 'Dewan Wasit');
    setShowWinModal(false);
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
  };

  // Handlers for Verifikasi Dewan (IPSI 2026)
  const handleOpenVerificationPrompt = async (type: 'JATUHAN' | 'PELANGGARAN') => {
    playAudioFeedback(900, 0.1);
    setVerifyType(type);
    setVerifyCorner('BLUE');
    const defaultReason = type === 'JATUHAN' ? 'Tinjauan Jatuhan' : 'Tinjauan Pelanggaran';
    setVerifyReason(defaultReason);
    setVerifyNotes('');
    setShowVerifyPrompt(false);
    await startVerification(type, 'BLUE', defaultReason, '');
    setShowDewanLiveModal(true);
  };

  const handleStartOfficialVerification = async () => {
    playAudioFeedback(1000, 0.12);
    await startVerification(verifyType, verifyCorner, verifyReason, verifyNotes);
    setShowVerifyPrompt(false);
    setShowDewanLiveModal(true);
  };

  // Get current active verification on match
  const currentVerification = activeMatch.verification;

  // Dewan Execution: Putusan Akhir
  // 1. PROSES KEPUTUSAN (Berdasarkan Konsensus Minimal 2 Juri Sepakat)
  const handleDewanSahkanKeputusan = async () => {
    playAudioFeedback(1000, 0.12);
    if (!currentVerification) return;
    const consensus = currentVerification.consensusResult;
    const decision: 'MERAH' | 'BIRU' | 'TIDAK SAH' = consensus || 'TIDAK SAH';
    await applyVerificationDecision(decision);
    setShowDewanLiveModal(false);
  };

  // 2. TETAPKAN TIDAK SAH
  const handleDewanTetapkanTidakSah = async () => {
    playAudioFeedback(750, 0.08);
    await applyVerificationDecision('TIDAK SAH');
    setShowDewanLiveModal(false);
  };

  // 3. TUTUP SESI / BATALKAN
  const handleDewanBatalVerifikasi = async () => {
    playAudioFeedback(600, 0.08);
    await resetVerification();
    setShowDewanLiveModal(false);
  };

  // Helper to check if a penalty is active on a corner
  const isPenaltyActive = (corner: Corner, type: PenaltyType) => {
    if (!tanding) return false;
    const scores = corner === 'BLUE' ? tanding.blueScores : tanding.redScores;
    return scores?.penalties?.some(p => p.type === type) || false;
  };

  // Toggle penalty (if already active, click again will cancel/remove it)
  const handleTogglePenalty = (corner: Corner, type: PenaltyType, deduction: number, note: string) => {
    if (!tanding) return;
    const scores = corner === 'BLUE' ? tanding.blueScores : tanding.redScores;
    const existing = scores?.penalties?.find(p => p.type === type);
    if (existing) {
      playAudioFeedback(400, 0.06);
      removePenalty(existing.id);
    } else {
      playAudioFeedback(600, 0.06);
      applyPenalty(corner, type, deduction, note);
    }
  };

  // Hitung jumlah pukulan dan tendangan masing-masing juri (Live Monitor Juri)
  const getJuryActionStats = (juryId: number) => {
    if (!tanding) return { blueP: 0, redP: 0, blueT: 0, redT: 0 };

    const blueP = tanding.blueScores.approvedHits.filter(
      h => h.technique === 'PUKULAN' && h.juryConfirmed.includes(juryId)
    ).length;
    const redP = tanding.redScores.approvedHits.filter(
      h => h.technique === 'PUKULAN' && h.juryConfirmed.includes(juryId)
    ).length;

    const blueT = tanding.blueScores.approvedHits.filter(
      h => h.technique === 'TENDANGAN' && h.juryConfirmed.includes(juryId)
    ).length;
    const redT = tanding.redScores.approvedHits.filter(
      h => h.technique === 'TENDANGAN' && h.juryConfirmed.includes(juryId)
    ).length;

    return { blueP, redP, blueT, redT };
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-3 py-1 sm:py-1.5 font-sans text-slate-100 bg-gradient-to-br from-[#19072b] via-[#05040a] to-[#030d22] cyber-arena-bg min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between overflow-hidden select-none">
      
      {/* ================= HEADER ATAS: NAMA EVENT, ATLET JURUS, DATA PARTAI, DAN TIMER ================= */}
      <header className="cyber-glass border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-lg text-center relative overflow-hidden shrink-0">
        {/* Garis indikator sudut biru di kiri dan sudut merah di kanan */}
        <div className="absolute top-0 left-0 w-2.5 h-full bg-[#3b82f6]" />
        <div className="absolute top-0 right-0 w-2.5 h-full bg-[#ef4444]" />

        <div className="flex items-center justify-between gap-2 pl-2 pr-2">
          {/* Sudut Kiri Grid Header: Tombol Kembali (Hanya Icon) */}
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 sm:p-2 rounded-lg bg-[#070e1c]/90 hover:bg-[#091326] border border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 shadow-sm hover:glow-cyan transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Tengah Grid Header: Nama Event & Data Atlet Jurus di Sebelah Kiri Grid Partai */}
          <div className="flex-1 min-w-0 text-center px-1">
            <h1 className="text-xs sm:text-sm lg:text-base font-black text-white uppercase tracking-wider font-sans leading-tight truncate drop-shadow-sm">
              {eventName}
            </h1>
            <div className="mt-0.5 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Nama Atlet dan Kontingen di Sebelah Kiri Grid Partai (Kategori Jurus) */}
              {isJurusView && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wide truncate max-w-[200px] sm:max-w-[340px]">
                    {jurusPerformer.name}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-200 uppercase bg-[#09152e] border border-cyan-500/40 px-2 py-0.5 rounded shadow-xs">
                    {jurusPerformer.contingent}
                  </span>
                  <span className="text-cyan-500/80 font-bold hidden sm:inline">•</span>
                </div>
              )}
              {/* Grid Partai */}
              <span className="inline-block bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded uppercase tracking-wider glow-gold border border-amber-300 font-mono">
                {matchInfoText}
              </span>
              <span className="text-[11px] font-bold text-cyan-400/90 font-mono">
                • {activeMatch.arena || 'GELANGGANG 1'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Timer Pertandingan Menggantikan Menu Switch ke Tanding */}
            <div className="bg-[#030814] border border-cyan-500/50 rounded-lg px-2.5 sm:px-3 py-1 shadow-inner flex items-center justify-center">
              <span className="font-mono font-black text-lg sm:text-xl text-cyan-300 tracking-wider">
                {formatTime(activeMatch.timer?.timeRemaining ?? 180)}
              </span>
            </div>

            {/* Sudut Kanan Atas Grid Header: Tombol Full Screen (Hanya Icon) */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg bg-[#070e1c]/90 hover:bg-[#091326] border border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 shadow-sm hover:glow-cyan transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              aria-label="Layar Penuh"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= KATEGORI TANDING: 3 KOLOM UTAMA ================= */}
      {isTanding && tanding ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 min-h-0 items-stretch mt-2">
          
          {/* ================= KOLOM KIRI: SUDUT BIRU (#2563eb, #3b82f6) ================= */}
          <div className="lg:col-span-5 h-full flex flex-col justify-between gap-2 min-h-0">
            
            {/* KOTAK UTAMA SUDUT BIRU: Electric Royal Blue LED glow */}
            <div className="bg-gradient-to-b from-[#1d4ed8] to-[#1e40af] border-2 border-[#3b82f6] rounded-xl p-2.5 sm:p-3 glow-blue relative overflow-hidden text-white flex-1 flex flex-col justify-between min-h-0">
              {/* Watermark BIRU */}
              <div className="absolute right-2 top-1 text-white/10 font-black text-6xl sm:text-7xl select-none pointer-events-none tracking-tighter">
                BIRU
              </div>

              {/* Header Atlet & Skor Utama */}
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-[#0000FF] text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                      SUDUT BIRU
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight mt-0.5 truncate max-w-[200px] sm:max-w-[260px] drop-shadow-sm">
                    {tanding.blueAthlete?.name || 'PESILAT BIRU'}
                  </h2>
                  <p className="text-[11px] sm:text-xs font-bold text-blue-100 uppercase tracking-wider truncate max-w-[200px] sm:max-w-[260px]">
                    {tanding.blueAthlete?.contingent || 'KONTINGEN BIRU'}
                  </p>
                </div>

                {/* Skor Utama Sudut Biru */}
                <div className="text-right pl-2 shrink-0">
                  <span className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none block drop-shadow-sm">
                    {tanding.blueScores.totalPoints}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-blue-100 uppercase tracking-widest">
                    TOTAL SKOR
                  </span>
                </div>
              </div>

              {/* GRID 3x3 MENU AKSI HUKUMAN & JATUHAN SUDUT BIRU */}
              <div className="grid grid-cols-3 gap-1.5 relative z-10 pt-2 border-t border-blue-400/30">
                
                {/* 1. BINAAN 1 */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'BINAAN_1', 0, 'Binaan 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'BINAAN_1')
                      ? 'bg-[#FFFF00] border-yellow-200 text-black shadow-[0_0_12px_rgba(255,255,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Binaan 1 (Poin: 0)"
                >
                  <img src={iconBinaan1} alt="Binaan 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">BINAAN 1</span>
                </button>

                {/* 2. BINAAN 2 */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'BINAAN_2', 0, 'Binaan 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'BINAAN_2')
                      ? 'bg-[#FFFF00] border-yellow-200 text-black shadow-[0_0_12px_rgba(255,255,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Binaan 2 (Poin: 0)"
                >
                  <img src={iconBinaan2} alt="Binaan 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">BINAAN 2</span>
                </button>

                {/* 3. JATUHAN +3 (HIJAU #008000) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(1000, 0.09);
                    approveDirectScore('BLUE', 'JATUHAN', 3);
                  }}
                  className="bg-[#008000] hover:bg-[#009900] border-2 border-green-300 text-white rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer glow-emerald"
                  title="Jatuhan Sah Dewan (+3)"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="2.5" />
                    <path d="M5 19l4-4 3 3 5-7" />
                    <path d="M17 11l4 2-3 5" />
                  </svg>
                  <span className="uppercase leading-tight font-mono">JATUHAN +3</span>
                </button>

                {/* 4. TEGURAN 1 (-1) (ORANGE #FF7F00) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'TEGURAN_1', 1, 'Teguran 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'TEGURAN_1')
                      ? 'bg-[#FF7F00] border-amber-200 text-white shadow-[0_0_12px_rgba(255,127,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Teguran 1 (-1 Poin)"
                >
                  <img src={iconTeguran1} alt="Teguran 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">TEGURAN 1</span>
                </button>

                {/* 5. TEGURAN 2 (-2) (ORANGE #FF7F00) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'TEGURAN_2', 2, 'Teguran 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'TEGURAN_2')
                      ? 'bg-[#FF7F00] border-amber-200 text-white shadow-[0_0_12px_rgba(255,127,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Teguran 2 (-2 Poin)"
                >
                  <img src={iconTeguran2} alt="Teguran 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">TEGURAN 2</span>
                </button>

                {/* 6. JAT. BATAL (UNGU) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(700, 0.08);
                    undoLastScore('BLUE');
                  }}
                  className="bg-[#800080] hover:bg-[#990099] border-2 border-purple-300 text-white rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer"
                  title="Batalkan Jatuhan Terakhir (-3 Poin)"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span className="uppercase leading-tight font-mono">JAT. BATAL</span>
                </button>

                {/* 7. PERINGATAN 1 (-5) (MERAH #FF0000) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'PERINGATAN_1', 5, 'Peringatan 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'PERINGATAN_1')
                      ? 'bg-[#FF0000] border-red-200 text-white shadow-[0_0_12px_rgba(255,0,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Peringatan 1 (-5 Poin)"
                >
                  <img src={iconPeringatan1} alt="Peringatan 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">PERINGATAN 1</span>
                </button>

                {/* 8. PERINGATAN 2 (-10) (MERAH #FF0000) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('BLUE', 'PERINGATAN_2', 10, 'Peringatan 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('BLUE', 'PERINGATAN_2')
                      ? 'bg-[#FF0000] border-red-200 text-white shadow-[0_0_12px_rgba(255,0,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Peringatan 2 (-10 Poin)"
                >
                  <img src={iconPeringatan2} alt="Peringatan 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">PERINGATAN 2</span>
                </button>

                {/* 9. DISKUALIFIKASI (MERAH TERANG) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(300, 0.12);
                    if (confirm('DISKUALIFIKASI PESILAT SUDUT BIRU? Pertandingan akan langsung diselesaikan.')) {
                      applyPenalty('BLUE', 'DISKUALIFIKASI', 0, 'Diskualifikasi');
                    }
                  }}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer ${
                    isPenaltyActive('BLUE', 'DISKUALIFIKASI')
                      ? 'bg-[#FF0000] border-white text-white animate-pulse'
                      : 'bg-[#FF0033] hover:bg-[#FF1744] border-red-300 text-white'
                  }`}
                  title="Diskualifikasi Sudut Biru"
                >
                  <Ban className="w-4 h-4 text-white" />
                  <span className="uppercase leading-tight">DISKUALIFIKASI</span>
                </button>

              </div>
            </div>

            {/* TABEL LOG NILAI MASUK (BIRU): FULL WARNA #0000FF */}
            <div className="bg-[#0000FF] border-2 border-[#0000FF] rounded-xl p-2 sm:p-2.5 shadow-md text-white shrink-0 space-y-1.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-blue-400/40">
                <FileText className="w-3.5 h-3.5 text-white" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">
                  LOG NILAI MASUK (BIRU)
                </h3>
              </div>

              <div className="bg-[#070e1c]/90 border border-cyan-500/30 rounded-lg p-1 text-slate-100 shadow-inner overflow-x-auto">
                <table className="w-full text-center border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-[#1e40af] text-white font-black text-[10px] border-b border-cyan-500/30">
                      <th className="py-1 px-1.5 rounded-l text-cyan-300">RD</th>
                      <th className="py-1 px-1.5 text-cyan-200">J1</th>
                      <th className="py-1 px-1.5 text-cyan-200">J2</th>
                      <th className="py-1 px-1.5 text-cyan-200">J3</th>
                      <th className="py-1 px-1.5 rounded-r text-amber-300">DWN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {[1, 2, 3].map((roundNum) => {
                      // Ambil hit sah yang dikonfirmasi juri 1, 2, 3 di ronde ini
                      const getJuryCell = (jId: number) => {
                        const approvedHits = tanding.blueScores.approvedHits.filter(
                          h => h.round === roundNum && h.juryConfirmed.includes(jId)
                        );

                        if (approvedHits.length > 0) {
                          const totalPts = approvedHits.reduce((acc, h) => acc + h.points, 0);
                          return (
                            <span className="text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded font-black border border-emerald-500/50 glow-emerald inline-block">
                              +{totalPts}
                            </span>
                          );
                        }

                        // Cek apakah ada vote juri yang expired / unconfirmed / tidak sah
                        const unconfirmed = tanding.currentVotes.find(
                          v => v.corner === 'BLUE' && v.round === roundNum && v.juryNumber === jId
                        );
                        if (unconfirmed) {
                          return (
                            <span className="text-slate-500 line-through font-bold">
                              {unconfirmed.technique === 'PUKULAN' ? '+1' : '+2'}
                            </span>
                          );
                        }

                        return <span className="text-slate-500 font-bold">-</span>;
                      };

                      // Ambil aksi Dewan di ronde ini (Jatuhan Sah / Hukuman Minus)
                      const getDewanCell = () => {
                        const dewanHits = tanding.blueScores.approvedHits.filter(
                          h => h.round === roundNum && (h.juryConfirmed.includes(0) || h.technique === 'JATUHAN')
                        );
                        const dewanPenalties = tanding.blueScores.penalties.filter(
                          p => p.round === roundNum
                        );

                        const elements: React.ReactNode[] = [];

                        // Jatuhan Sah Dewan (Hijau Emerald)
                        if (dewanHits.length > 0) {
                          const points = dewanHits.reduce((acc, h) => acc + h.points, 0);
                          elements.push(
                            <span key="hit" className="text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded font-black border border-emerald-500/50 glow-emerald inline-block">
                              +{points}
                            </span>
                          );
                        }

                        // Hukuman Minus Dewan (Merah Crimson)
                        if (dewanPenalties.length > 0) {
                          dewanPenalties.forEach((p, idx) => {
                            if (p.pointDeduction > 0) {
                              elements.push(
                                <span key={`pen-${idx}`} className="text-red-300 bg-red-950/80 px-1 py-0.2 rounded font-black border border-red-500/50 glow-red inline-block ml-0.5">
                                  -{p.pointDeduction}
                                </span>
                              );
                            } else if (p.type === 'BINAAN_1' || p.type === 'BINAAN_2') {
                              elements.push(
                                <span key={`pen-${idx}`} className="text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded font-bold border border-amber-500/50 glow-gold inline-block ml-0.5 text-[9px]">
                                  {p.type === 'BINAAN_1' ? 'B1' : 'B2'}
                                </span>
                              );
                            }
                          });
                        }

                        if (elements.length > 0) {
                          return <div className="flex items-center justify-center flex-wrap gap-0.5">{elements}</div>;
                        }

                        return <span className="text-slate-500 font-bold">-</span>;
                      };

                      return (
                        <tr key={roundNum} className="hover:bg-cyan-950/30 transition-colors">
                          <td className="py-1 px-1 font-black text-cyan-300">Rd {roundNum}</td>
                          <td className="py-1 px-1">{getJuryCell(1)}</td>
                          <td className="py-1 px-1">{getJuryCell(2)}</td>
                          <td className="py-1 px-1">{getJuryCell(3)}</td>
                          <td className="py-1 px-1">{getDewanCell()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ================= KOLOM TENGAH: SATU GRID TERPADU (BABAK 1 S/D VERIFIKASI PELANGGARAN) ================= */}
          <div className="lg:col-span-2 h-full flex flex-col justify-between min-h-0">
            <div className="cyber-glass border border-cyan-500/30 rounded-xl p-2 sm:p-2.5 shadow-md text-center h-full flex flex-col justify-between gap-1.5 min-h-0">
              
              {/* 1. BABAK AKTIF (HANYA MENAMPILKAN, TANPA KLIK) */}
              <div>
                <div 
                  className="select-none pointer-events-none cursor-default bg-amber-400 border border-amber-300 text-slate-950 font-black text-xs sm:text-sm py-1 px-3 rounded-lg uppercase tracking-wider font-mono inline-block glow-gold"
                  aria-label="Babak Pertandingan Aktif"
                >
                  BABAK {activeMatch.activeRound || 1}
                </div>
              </div>

              {/* 2. TIMER PERTANDINGAN (READ-ONLY, TANPA KLIK) */}
              <div 
                className="select-none pointer-events-none cursor-default py-0.5"
                aria-label="Timer Pertandingan Digital"
              >
                <span className="font-mono text-3xl sm:text-4xl lg:text-[42px] font-black text-cyan-400 text-glow-cyan tracking-tight leading-none block">
                  {formatTime(activeMatch.timer?.timeRemaining ?? 120)}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest mt-0.5 block">
                  WAKTU TANDING
                </span>
              </div>

              <div className="border-t border-cyan-500/20" />

              {/* 3. MONITOR AKSI JURI 1, 2, 3 DENGAN BACKSPACE */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-center min-h-0">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-cyan-300 uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/30 py-0.5 px-2 rounded inline-block">
                    MONITOR JURI
                  </span>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  {[1, 2, 3].map((jId) => {
                    const stats = getJuryActionStats(jId);

                    return (
                      <div key={jId} className="bg-[#070e1c]/90 border border-cyan-500/25 rounded-lg p-1 sm:p-1.5 space-y-1 text-center shadow-2xs">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] sm:text-[11px] font-mono font-black text-cyan-300 uppercase">
                            JURI {jId}
                          </span>
                          {/* TOMBOL BACKSPACE UNTUK MENGHAPUS NILAI TERAKHIR JURI */}
                          <button
                            type="button"
                            onClick={() => undoJuryVote(jId)}
                            className="bg-[#091326] hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-cyan-500/30 hover:border-red-500 font-mono font-bold text-[8px] sm:text-[9px] py-0.5 px-1.5 rounded transition-colors flex items-center gap-0.5 active:scale-95 cursor-pointer shadow-2xs"
                            title={`Hapus nilai/input terakhir dari Juri ${jId}`}
                          >
                            <span>⌫</span>
                            <span>BACKSPACE</span>
                          </button>
                        </div>

                        {/* Display Pukulan (P) dan Tendangan (T) dengan warna biru #3b82f6 & merah #ef4444 */}
                        <div className="grid grid-cols-2 gap-1 font-mono text-[10px] sm:text-[11px] font-black py-0.5 bg-[#040813] border border-cyan-500/20 rounded px-1">
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="text-[#3b82f6] text-glow-blue">P:{stats.blueP}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-[#ef4444] text-glow-red">{stats.redP}:P</span>
                          </div>
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="text-[#3b82f6] text-glow-blue">T:{stats.blueT}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-[#ef4444] text-glow-red">{stats.redT}:T</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-cyan-500/20" />

              {/* 4. MENU KEPUTUSAN KEMENANGAN (POP-UP MODAL) */}
              <button
                type="button"
                onClick={() => {
                  playAudioFeedback(800, 0.08);
                  setShowWinModal(true);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 border-2 border-amber-300 text-slate-950 font-black text-[10px] sm:text-[11px] py-2 px-1 rounded-xl transition-all glow-gold active:scale-95 uppercase tracking-wide cursor-pointer font-sans"
              >
                KEPUTUSAN KEMENANGAN (WMP/MUTLAK/TEKNIK)
              </button>

              {/* 5 & 6. MENU VERIFIKASI DEWAN (IPSI 2026): VERIFIKASI JATUHAN & VERIFIKASI PELANGGARAN */}
              {currentVerification?.active ? (
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(880, 0.05);
                    setShowDewanLiveModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-[#1e1b4b] via-[#3b0764] to-[#450a0a] border-2 border-amber-400 text-amber-300 font-black text-[10px] sm:text-[11px] py-2 px-1 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-tight cursor-pointer font-sans leading-tight animate-pulse flex items-center justify-center gap-1.5 glow-gold"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>VERIFIKASI SEDANG BERLANGSUNG • BUKA SESI</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenVerificationPrompt('JATUHAN')}
                    className="w-full bg-[#1e1b4b] hover:bg-[#312e81] border-2 border-indigo-500 text-indigo-100 hover:text-white font-black text-[10px] sm:text-[11px] py-2 px-1 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-tight cursor-pointer font-sans leading-tight shadow-indigo-950/60"
                  >
                    VERIFIKASI JATUHAN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenVerificationPrompt('PELANGGARAN')}
                    className="w-full bg-[#450a0a] hover:bg-[#7f1d1d] border-2 border-rose-600 text-rose-100 hover:text-white font-black text-[10px] sm:text-[11px] py-2 px-1 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-tight cursor-pointer font-sans leading-tight shadow-red-950/60"
                  >
                    VERIFIKASI PELANGGARAN
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ================= KOLOM KANAN: SUDUT MERAH (#dc2626, #ef4444) ================= */}
          <div className="lg:col-span-5 h-full flex flex-col justify-between gap-2 min-h-0">
            
            {/* KOTAK UTAMA SUDUT MERAH: Crimson Scarlet LED glow */}
            <div className="bg-gradient-to-b from-[#b91c1c] to-[#991b1b] border-2 border-[#ef4444] rounded-xl p-2.5 sm:p-3 glow-red relative overflow-hidden text-white flex-1 flex flex-col justify-between min-h-0">
              {/* Watermark MERAH */}
              <div className="absolute right-2 top-1 text-white/10 font-black text-6xl sm:text-7xl select-none pointer-events-none tracking-tighter">
                MERAH
              </div>

              {/* Header Atlet & Skor Utama */}
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-[#FF0000] text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                      SUDUT MERAH
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight mt-0.5 truncate max-w-[200px] sm:max-w-[260px] drop-shadow-sm">
                    {tanding.redAthlete?.name || 'PESILAT MERAH'}
                  </h2>
                  <p className="text-[11px] sm:text-xs font-bold text-red-100 uppercase tracking-wider truncate max-w-[200px] sm:max-w-[260px]">
                    {tanding.redAthlete?.contingent || 'KONTINGEN MERAH'}
                  </p>
                </div>

                {/* Skor Utama Sudut Merah */}
                <div className="text-right pl-2 shrink-0">
                  <span className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none block drop-shadow-sm">
                    {tanding.redScores.totalPoints}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-red-100 uppercase tracking-widest">
                    TOTAL SKOR
                  </span>
                </div>
              </div>

              {/* GRID 3x3 MENU AKSI HUKUMAN & JATUHAN SUDUT MERAH */}
              <div className="grid grid-cols-3 gap-1.5 relative z-10 pt-2 border-t border-red-400/30">
                
                {/* 1. BINAAN 1 */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'BINAAN_1', 0, 'Binaan 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'BINAAN_1')
                      ? 'bg-[#FFFF00] border-yellow-200 text-black shadow-[0_0_12px_rgba(255,255,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Binaan 1 (Poin: 0)"
                >
                  <img src={iconBinaan1} alt="Binaan 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">BINAAN 1</span>
                </button>

                {/* 2. BINAAN 2 */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'BINAAN_2', 0, 'Binaan 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'BINAAN_2')
                      ? 'bg-[#FFFF00] border-yellow-200 text-black shadow-[0_0_12px_rgba(255,255,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Binaan 2 (Poin: 0)"
                >
                  <img src={iconBinaan2} alt="Binaan 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">BINAAN 2</span>
                </button>

                {/* 3. JATUHAN +3 (HIJAU #008000) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(1000, 0.09);
                    approveDirectScore('RED', 'JATUHAN', 3);
                  }}
                  className="bg-[#008000] hover:bg-[#009900] border-2 border-green-300 text-white rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer glow-emerald"
                  title="Jatuhan Sah Dewan (+3)"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="2.5" />
                    <path d="M5 19l4-4 3 3 5-7" />
                    <path d="M17 11l4 2-3 5" />
                  </svg>
                  <span className="uppercase leading-tight font-mono">JATUHAN +3</span>
                </button>

                {/* 4. TEGURAN 1 (-1) (ORANGE #FF7F00) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'TEGURAN_1', 1, 'Teguran 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'TEGURAN_1')
                      ? 'bg-[#FF7F00] border-amber-200 text-white shadow-[0_0_12px_rgba(255,127,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Teguran 1 (-1 Poin)"
                >
                  <img src={iconTeguran1} alt="Teguran 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">TEGURAN 1</span>
                </button>

                {/* 5. TEGURAN 2 (-2) (ORANGE #FF7F00) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'TEGURAN_2', 2, 'Teguran 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'TEGURAN_2')
                      ? 'bg-[#FF7F00] border-amber-200 text-white shadow-[0_0_12px_rgba(255,127,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Teguran 2 (-2 Poin)"
                >
                  <img src={iconTeguran2} alt="Teguran 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">TEGURAN 2</span>
                </button>

                {/* 6. JAT. BATAL (UNGU) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(700, 0.08);
                    undoLastScore('RED');
                  }}
                  className="bg-[#800080] hover:bg-[#990099] border-2 border-purple-300 text-white rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer"
                  title="Batalkan Jatuhan Terakhir (-3 Poin)"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span className="uppercase leading-tight font-mono">JAT. BATAL</span>
                </button>

                {/* 7. PERINGATAN 1 (-5) (MERAH #FF0000) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'PERINGATAN_1', 5, 'Peringatan 1 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'PERINGATAN_1')
                      ? 'bg-[#FF0000] border-red-200 text-white shadow-[0_0_12px_rgba(255,0,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Peringatan 1 (-5 Poin)"
                >
                  <img src={iconPeringatan1} alt="Peringatan 1" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">PERINGATAN 1</span>
                </button>

                {/* 8. PERINGATAN 2 (-10) (MERAH #FF0000) */}
                <button
                  type="button"
                  onClick={() => handleTogglePenalty('RED', 'PERINGATAN_2', 10, 'Peringatan 2 Wasit')}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer ${
                    isPenaltyActive('RED', 'PERINGATAN_2')
                      ? 'bg-[#FF0000] border-red-200 text-white shadow-[0_0_12px_rgba(255,0,0,0.85)] scale-102 font-black'
                      : 'bg-[#4B5563] hover:bg-[#6B7280] border-gray-400 text-gray-100 hover:text-white'
                  }`}
                  title="Peringatan 2 (-10 Poin)"
                >
                  <img src={iconPeringatan2} alt="Peringatan 2" className="w-5 h-5 object-contain" />
                  <span className="uppercase leading-tight font-mono">PERINGATAN 2</span>
                </button>

                {/* 9. DISKUALIFIKASI (MERAH TERANG) */}
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback(300, 0.12);
                    if (confirm('DISKUALIFIKASI PESILAT SUDUT MERAH? Pertandingan akan langsung diselesaikan.')) {
                      applyPenalty('RED', 'DISKUALIFIKASI', 0, 'Diskualifikasi');
                    }
                  }}
                  className={`border-2 rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 font-black text-[10px] sm:text-[11px] transition-all active:scale-95 shadow-md cursor-pointer ${
                    isPenaltyActive('RED', 'DISKUALIFIKASI')
                      ? 'bg-[#FF0000] border-white text-white animate-pulse'
                      : 'bg-[#FF0033] hover:bg-[#FF1744] border-red-300 text-white'
                  }`}
                  title="Diskualifikasi Sudut Merah"
                >
                  <Ban className="w-4 h-4 text-white" />
                  <span className="uppercase leading-tight">DISKUALIFIKASI</span>
                </button>

              </div>
            </div>

            {/* TABEL LOG NILAI MASUK (MERAH): FULL WARNA #FF0000 */}
            <div className="bg-[#FF0000] border-2 border-[#FF0000] rounded-xl p-2 sm:p-2.5 shadow-md text-white shrink-0 space-y-1.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-red-400/40">
                <FileText className="w-3.5 h-3.5 text-white" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">
                  LOG NILAI MASUK (MERAH)
                </h3>
              </div>

              <div className="bg-[#070e1c]/90 border border-cyan-500/30 rounded-lg p-1 text-slate-100 shadow-inner overflow-x-auto">
                <table className="w-full text-center border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-[#991b1b] text-white font-black text-[10px] border-b border-cyan-500/30">
                      <th className="py-1 px-1.5 rounded-l text-red-300">RD</th>
                      <th className="py-1 px-1.5 text-red-200">J1</th>
                      <th className="py-1 px-1.5 text-red-200">J2</th>
                      <th className="py-1 px-1.5 text-red-200">J3</th>
                      <th className="py-1 px-1.5 rounded-r text-amber-300">DWN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-950/60">
                    {[1, 2, 3].map((roundNum) => {
                      // Ambil hit sah yang dikonfirmasi juri 1, 2, 3 di ronde ini
                      const getJuryCell = (jId: number) => {
                        const approvedHits = tanding.redScores.approvedHits.filter(
                          h => h.round === roundNum && h.juryConfirmed.includes(jId)
                        );

                        if (approvedHits.length > 0) {
                          const totalPts = approvedHits.reduce((acc, h) => acc + h.points, 0);
                          return (
                            <span className="text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded font-black border border-emerald-500/50 glow-emerald inline-block">
                              +{totalPts}
                            </span>
                          );
                        }

                        // Cek apakah ada vote juri yang expired / unconfirmed / tidak sah
                        const unconfirmed = tanding.currentVotes.find(
                          v => v.corner === 'RED' && v.round === roundNum && v.juryNumber === jId
                        );
                        if (unconfirmed) {
                          return (
                            <span className="text-slate-500 line-through font-bold">
                              {unconfirmed.technique === 'PUKULAN' ? '+1' : '+2'}
                            </span>
                          );
                        }

                        return <span className="text-slate-500 font-bold">-</span>;
                      };

                      // Ambil aksi Dewan di ronde ini (Jatuhan Sah / Hukuman Minus)
                      const getDewanCell = () => {
                        const dewanHits = tanding.redScores.approvedHits.filter(
                          h => h.round === roundNum && (h.juryConfirmed.includes(0) || h.technique === 'JATUHAN')
                        );
                        const dewanPenalties = tanding.redScores.penalties.filter(
                          p => p.round === roundNum
                        );

                        const elements: React.ReactNode[] = [];

                        // Jatuhan Sah Dewan (Hijau Emerald)
                        if (dewanHits.length > 0) {
                          const points = dewanHits.reduce((acc, h) => acc + h.points, 0);
                          elements.push(
                            <span key="hit" className="text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded font-black border border-emerald-500/50 glow-emerald inline-block">
                              +{points}
                            </span>
                          );
                        }

                        // Hukuman Minus Dewan (Merah Crimson)
                        if (dewanPenalties.length > 0) {
                          dewanPenalties.forEach((p, idx) => {
                            if (p.pointDeduction > 0) {
                              elements.push(
                                <span key={`pen-${idx}`} className="text-red-300 bg-red-950/80 px-1 py-0.2 rounded font-black border border-red-500/50 glow-red inline-block ml-0.5">
                                  -{p.pointDeduction}
                                </span>
                              );
                            } else if (p.type === 'BINAAN_1' || p.type === 'BINAAN_2') {
                              elements.push(
                                <span key={`pen-${idx}`} className="text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded font-bold border border-amber-500/50 glow-gold inline-block ml-0.5 text-[9px]">
                                  {p.type === 'BINAAN_1' ? 'B1' : 'B2'}
                                </span>
                              );
                            }
                          });
                        }

                        if (elements.length > 0) {
                          return <div className="flex items-center justify-center flex-wrap gap-0.5">{elements}</div>;
                        }

                        return <span className="text-slate-500 font-bold">-</span>;
                      };

                      return (
                        <tr key={roundNum} className="hover:bg-red-950/30 transition-colors">
                          <td className="py-1 px-1 font-black text-red-300">Rd {roundNum}</td>
                          <td className="py-1 px-1">{getJuryCell(1)}</td>
                          <td className="py-1 px-1">{getJuryCell(2)}</td>
                          <td className="py-1 px-1">{getJuryCell(3)}</td>
                          <td className="py-1 px-1">{getDewanCell()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ================= JURUS / SENI KONTROL DEWAN (100% SAMA SEPERTI CONTOH IPSI 2026 & PERSILAT) ================= */
        (() => {
          // Default data skor 10 juri untuk kategori Jurus / Seni
          const fallbackJuryScores: Record<number, { kebenaran: number; kemantapan: number; salah: number; final: number }> = {
            1: { kebenaran: 9.90, kemantapan: 0.05, salah: 0, final: 9.950 },
            2: { kebenaran: 9.89, kemantapan: 0.04, salah: 1, final: 9.930 },
            3: { kebenaran: 9.90, kemantapan: 0.06, salah: 0, final: 9.960 },
            4: { kebenaran: 9.88, kemantapan: 0.04, salah: 2, final: 9.920 },
            5: { kebenaran: 9.90, kemantapan: 0.05, salah: 0, final: 9.950 },
            6: { kebenaran: 9.90, kemantapan: 0.05, salah: 0, final: 9.950 },
            7: { kebenaran: 9.89, kemantapan: 0.05, salah: 1, final: 9.940 },
            8: { kebenaran: 9.87, kemantapan: 0.03, salah: 3, final: 9.900 },
            9: { kebenaran: 9.90, kemantapan: 0.07, salah: 0, final: 9.970 },
            10: { kebenaran: 9.88, kemantapan: 0.05, salah: 2, final: 9.930 }
          };

          // Data atlet penampil dari panel sekretaris (hanya nama dan asal kontingen)
          const currentPerformer = jurusPerformer;
          const blueAthlete = jurusPerformer;
          const redAthlete = tanding?.redAthlete || jurus?.opponent || (
            athletes?.find(a => a.name !== jurusPerformer.name) || {
              id: 'ath-red',
              name: 'REZA KURNIAWAN',
              contingent: 'BANTEN',
              category: activeMatch.category,
              gender: activeMatch.gender,
              classGroup: activeMatch.classGroup || 'Tunggal Putri Baku'
            }
          );
          const selectedJurusCorner: Corner = (jurus?.performerCorner as Corner) || 'BLUE';

          // Jumlah Juri Bertugas Sesuai Konfigurasi Sekretaris (3 Juri, 5 Juri, atau 10 Juri)
          const activeJuryCount = config.jurorsCountSeni || 5;
          const juryIds = Array.from({ length: activeJuryCount }, (_, i) => i + 1);

          const juriesData = juryIds.map((num) => {
            const live = jurus?.juryScores?.[num];
            const fallback = fallbackJuryScores[num] || { kebenaran: 9.90, kemantapan: 0.05, salah: 0, final: 9.950 };
            const finalScore = live ? live.finalScore : fallback.final;
            const kebenaranFinal = live ? live.kebenaranFinal : fallback.kebenaran;
            const kemantapanScore = live ? live.kemantapanScore : fallback.kemantapan;
            const kesalahanCount = live ? live.kesalahanCount : fallback.salah;
            const isSubmitted = live ? live.isSubmitted : true;

            return {
              num,
              finalScore,
              kebenaranFinal,
              kemantapanScore,
              kesalahanCount,
              isSubmitted
            };
          });

          // Urutkan nilai dari terendah ke tertinggi untuk penentuan eliminasi dan median
          const sortedJuries = [...juriesData].sort((a, b) => a.finalScore - b.finalScore);

          // Peta Peringkat Nilai Juri (Rank 1: Terendah s/d Rank N: Tertinggi)
          const juryRankMap = new Map<number, number>();
          sortedJuries.forEach((item, index) => {
            juryRankMap.set(item.num, index + 1);
          });

          // Sesuai Peraturan Resmi IPSI 2026 & PERSILAT:
          // 1. Sistem 10 Juri: Buang 2 Terendah (Index 0, 1) & 2 Tertinggi (Index 8, 9). Median: Rank 5 & 6 (Index 4, 5).
          // 2. Sistem 5 Juri: Buang 1 Terendah (Index 0) & 1 Tertinggi (Index 4). Median: Rank 3 (Index 2).
          // 3. Sistem 3 Juri: Tanpa eliminasi! Median: Rank 2 (Index 1).
          let discardedLowNums = new Set<number>();
          let discardedHighNums = new Set<number>();
          let medianNums = new Set<number>();
          let baseMedian = 9.90;
          let trimmedMean6 = 9.90;

          if (activeJuryCount === 10) {
            discardedLowNums = new Set([sortedJuries[0]?.num, sortedJuries[1]?.num].filter(Boolean));
            discardedHighNums = new Set([sortedJuries[8]?.num, sortedJuries[9]?.num].filter(Boolean));
            medianNums = new Set([sortedJuries[4]?.num, sortedJuries[5]?.num].filter(Boolean));
            if (sortedJuries.length >= 6) {
              const middle6 = sortedJuries.slice(2, 8);
              trimmedMean6 = Number((middle6.reduce((acc, curr) => acc + curr.finalScore, 0) / middle6.length).toFixed(3));
              baseMedian = Number(((sortedJuries[4].finalScore + sortedJuries[5].finalScore) / 2).toFixed(3));
            } else {
              baseMedian = Number((sortedJuries.reduce((acc, curr) => acc + curr.finalScore, 0) / (sortedJuries.length || 1)).toFixed(3));
              trimmedMean6 = baseMedian;
            }
          } else if (activeJuryCount === 5) {
            discardedLowNums = new Set([sortedJuries[0]?.num].filter(Boolean));
            discardedHighNums = new Set([sortedJuries[4]?.num].filter(Boolean));
            medianNums = new Set([sortedJuries[2]?.num].filter(Boolean));
            if (sortedJuries.length >= 3) {
              const middle3 = sortedJuries.slice(1, 4);
              trimmedMean6 = Number((middle3.reduce((acc, curr) => acc + curr.finalScore, 0) / middle3.length).toFixed(3));
              baseMedian = sortedJuries[2] ? sortedJuries[2].finalScore : trimmedMean6;
            } else {
              baseMedian = Number((sortedJuries.reduce((acc, curr) => acc + curr.finalScore, 0) / (sortedJuries.length || 1)).toFixed(3));
              trimmedMean6 = baseMedian;
            }
          } else {
            // 3 Juri: Tanpa eliminasi
            discardedLowNums = new Set<number>();
            discardedHighNums = new Set<number>();
            medianNums = new Set([sortedJuries[1]?.num].filter(Boolean));
            baseMedian = sortedJuries[1] ? sortedJuries[1].finalScore : Number((sortedJuries.reduce((acc, curr) => acc + curr.finalScore, 0) / (sortedJuries.length || 1)).toFixed(3));
            trimmedMean6 = Number((sortedJuries.reduce((acc, curr) => acc + curr.finalScore, 0) / (sortedJuries.length || 1)).toFixed(3));
          }

          const discardedNums = new Set([...discardedLowNums, ...discardedHighNums]);

          // Data Juri yang ditampilkan sesuai mode urutan yang dipilih Dewan
          const displayJuries = juryOrderMode === 'RANK' ? sortedJuries : juriesData;

          // Hitung Standar Deviasi (SD) sebagai kriteria penentu jika nilai seri (Tie-Breaker IPSI 2026)
          const mean = sortedJuries.reduce((acc, curr) => acc + curr.finalScore, 0) / (sortedJuries.length || 1);
          const variance = sortedJuries.reduce((acc, curr) => acc + Math.pow(curr.finalScore - mean, 2), 0) / (sortedJuries.length || 1);
          const standardDeviation = Math.sqrt(variance);

          // Total Hukuman Dewan
          const penalties = jurus?.penalties || {
            timeToleranceViolation: 0,
            weaponDropped: 0,
            weaponBroken: 0,
            outOfArena: 0,
            attireViolation: 0,
            unauthorizedSound: 0,
            totalPenalties: 0
          };
          const totalPenalties = penalties.totalPenalties || 0;

          // Nilai Akhir Resmi Bersih (Setelah Hukuman Dewan)
          const finalOfficialScore = Math.max(0, Number((baseMedian - totalPenalties).toFixed(3)));

          // Data skor tersimpan untuk Sudut Biru dan Sudut Merah
          const currentDuration = (activeMatch.timer?.durationTotal || 180) - (activeMatch.timer?.timeRemaining ?? 180);
          const effectiveBlue = selectedJurusCorner === 'BLUE'
            ? { score: finalOfficialScore, sd: standardDeviation, time: currentDuration > 0 ? currentDuration : 180 }
            : (jurusCornerResults.BLUE || { score: 9.920, sd: 0.0150, time: 180 });

          const effectiveRed = selectedJurusCorner === 'RED'
            ? { score: finalOfficialScore, sd: standardDeviation, time: currentDuration > 0 ? currentDuration : 179 }
            : (jurusCornerResults.RED || { score: 9.890, sd: 0.0210, time: 179 });

          const blueScore = effectiveBlue.score;
          const redScore = effectiveRed.score;
          const scoreDifference = Number((blueScore - redScore).toFixed(3));

          // Evaluasi Otomatis Pemenang Sesuai Regulasi IPSI 2026 & PERSILAT
          let autoWinnerCorner: 'BLUE' | 'RED' = 'BLUE';
          let autoWinnerReason = '';
          if (blueScore > redScore) {
            autoWinnerCorner = 'BLUE';
            autoWinnerReason = `Sudut Biru Unggul Nilai Akhir (${blueScore.toFixed(3)} vs ${redScore.toFixed(3)})`;
          } else if (redScore > blueScore) {
            autoWinnerCorner = 'RED';
            autoWinnerReason = `Sudut Merah Unggul Nilai Akhir (${redScore.toFixed(3)} vs ${blueScore.toFixed(3)})`;
          } else {
            // Nilai Imbang -> Standar Deviasi Lebih Rendah Unggul
            if (effectiveBlue.sd < effectiveRed.sd) {
              autoWinnerCorner = 'BLUE';
              autoWinnerReason = `Nilai Seri (${blueScore.toFixed(3)}), Sudut Biru Unggul Standar Deviasi Lebih Rendah (${effectiveBlue.sd.toFixed(4)})`;
            } else if (effectiveRed.sd < effectiveBlue.sd) {
              autoWinnerCorner = 'RED';
              autoWinnerReason = `Nilai Seri (${redScore.toFixed(3)}), Sudut Merah Unggul Standar Deviasi Lebih Rendah (${effectiveRed.sd.toFixed(4)})`;
            } else {
              autoWinnerCorner = 'BLUE';
              autoWinnerReason = `Nilai Seri & SD Seimbang (${blueScore.toFixed(3)})`;
            }
          }

          // Handlers untuk Penalti Dewan
          const handlePenaltyChange = (key: keyof typeof penalties, delta: number) => {
            playAudioFeedback(600, 0.06);
            const currentVal = (penalties[key] as number) || 0;
            const updatedVal = Math.max(0, Number((currentVal + delta).toFixed(2)));
            updateSeniPenalties({ [key]: updatedVal });
          };

          const handleResetAllPenalties = () => {
            playAudioFeedback(400, 0.1);
            updateSeniPenalties({
              timeToleranceViolation: 0,
              weaponDropped: 0,
              weaponBroken: 0,
              outOfArena: 0,
              attireViolation: 0,
              unauthorizedSound: 0
            });
            setJurusToast('Seluruh hukuman dewan berhasil di-reset ke 0.00');
            setTimeout(() => setJurusToast(null), 2500);
          };

          // Handler Sahkan Nilai Penampilan & Tetapkan Pemenang Otomatis Sesuai Nilai Unggul
          const handleSahkanNilai = () => {
            playAudioFeedback(1000, 0.15);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            setIsJurusLocked(true);

            // Simpan skor sudut yang sedang aktif
            const updatedResults = {
              ...jurusCornerResults,
              [selectedJurusCorner]: {
                score: finalOfficialScore,
                sd: standardDeviation,
                penalties: totalPenalties,
                time: currentDuration > 0 ? currentDuration : 180
              }
            };
            setJurusCornerResults(updatedResults);

            // Hitung otomatis pemenang
            const bScore = selectedJurusCorner === 'BLUE' ? finalOfficialScore : (updatedResults.BLUE?.score ?? 9.920);
            const rScore = selectedJurusCorner === 'RED' ? finalOfficialScore : (updatedResults.RED?.score ?? 9.890);
            const bSD = selectedJurusCorner === 'BLUE' ? standardDeviation : (updatedResults.BLUE?.sd ?? 0.0150);
            const rSD = selectedJurusCorner === 'RED' ? standardDeviation : (updatedResults.RED?.sd ?? 0.0210);

            let winner: Corner = 'BLUE';
            if (bScore > rScore) {
              winner = 'BLUE';
            } else if (rScore > bScore) {
              winner = 'RED';
            } else {
              winner = bSD <= rSD ? 'BLUE' : 'RED';
            }

            // Otomatis putuskan pemenang di sistem
            try {
              decideWinner(winner, 'MUTLAK', 'SISTEM OTOMATIS TGRS IPSI 2026');
            } catch (err) {
              console.log('decideWinner auto:', err);
            }

            setJurusToast(`NILAI ${finalOfficialScore.toFixed(3)} DISAHKAN! PEMENANG OTOMATIS: SUDUT ${winner === 'BLUE' ? 'BIRU' : 'MERAH'}`);
            setTimeout(() => setJurusToast(null), 4000);
          };

          // Handler Print Formulir Dewan
          const handlePrintFormulirDewan = () => {
            playAudioFeedback(700, 0.05);
            try {
              const nilaiJuriMapped: Record<number, any> = {};
              juriesData.forEach(j => {
                nilaiJuriMapped[j.num] = {
                  juriId: j.num,
                  kebenaranSkor: j.kebenaranFinal,
                  kesalahanGerak: j.kesalahanCount,
                  kemantapanSkor: j.kemantapanScore,
                  totalSkorJuri: j.finalScore,
                  status: discardedLowNums.has(j.num) ? 'DIBUANG_TERENDAH' : discardedHighNums.has(j.num) ? 'DIBUANG_TERTINGGI' : 'VALID'
                };
              });

              const durasiTampil = currentDuration > 0 ? currentDuration : 180;
              const partaiData: any = {
                id: activeMatch.id || 'partai-jurus-1',
                nomorPartai: activeMatch.matchNumber || 1,
                gelanggang: activeMatch.arena || 'Gelanggang 1',
                kategori: activeMatch.classGroup || 'Tunggal',
                golongan: activeMatch.category || 'DEWASA',
                gender: activeMatch.gender || 'PUTRA',
                sudut: selectedJurusCorner === 'BLUE' ? 'BIRU' : 'MERAH',
                pool: 'Pool A',
                nomorUndian: 1,
                status: isJurusLocked ? 'DISAHKAN' : 'BERJALAN',
                durasiBerjalanDetik: durasiTampil,
                durasiStandarDetik: 180,
                pesilat: {
                  id: currentPerformer.id || 'ath-1',
                  nama: currentPerformer.name,
                  kontingen: currentPerformer.contingent,
                  kategori: activeMatch.classGroup || 'Tunggal',
                  golongan: activeMatch.category || 'DEWASA',
                  gender: activeMatch.gender || 'PUTRA',
                  nomorUndian: 1
                },
                nilaiJuri: nilaiJuriMapped,
                penaltiDewan: {
                  toleransiWaktu: penalties.timeToleranceViolation || 0,
                  senjataJatuh: penalties.weaponDropped || 0,
                  senjataPatah: penalties.weaponBroken || 0,
                  keluarArena: penalties.outOfArena || 0,
                  pakaianAksesoris: penalties.attireViolation || 0,
                  suaraTidakSah: penalties.unauthorizedSound || 0,
                  totalPenalti: totalPenalties,
                  waktuTampilDetik: durasiTampil
                },
                hasilAkhir: {
                  skorMedian: baseMedian,
                  rataRataJuri: trimmedMean6,
                  totalHukuman: totalPenalties,
                  skorAkhir: finalOfficialScore,
                  standarDeviasi: standardDeviation,
                  skorTertinggiDibuang: [sortedJuries[8]?.finalScore, sortedJuries[9]?.finalScore].filter(Boolean),
                  skorTerendahDibuang: [sortedJuries[0]?.finalScore, sortedJuries[1]?.finalScore].filter(Boolean)
                }
              };

              exportPartaiPDF(partaiData);
              setJurusToast('Formulir Resmi Dewan Berhasil Digenerate & Diunduh!');
              setTimeout(() => setJurusToast(null), 3000);
            } catch (err) {
              console.error('PDF Export, fallback to window.print():', err);
              window.print();
            }
          };

          // Handler Buka Modal Edit Juri
          const handleOpenEditJury = (juryNum: number) => {
            playAudioFeedback(800, 0.05);
            const target = juriesData.find(j => j.num === juryNum);
            if (target) {
              setEditScoreForm({
                kebenaran: target.kebenaranFinal,
                kemantapan: target.kemantapanScore,
                salah: target.kesalahanCount
              });
              setEditingJuryNumber(juryNum);
            }
          };

          const handleSaveJuryScore = () => {
            if (editingJuryNumber === null) return;
            playAudioFeedback(950, 0.08);
            setJurusScoreDirect(editingJuryNumber, {
              kesalahanCount: editScoreForm.salah,
              kebenaranBase: 9.90,
              kemantapanScore: editScoreForm.kemantapan,
              isSubmitted: true
            });
            setEditingJuryNumber(null);
            setJurusToast(`Nilai Juri #${editingJuryNumber} berhasil diperbarui!`);
            setTimeout(() => setJurusToast(null), 2500);
          };

          return (
            <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 mt-1 min-h-0 overflow-hidden">
              
              {/* Toast Notifikasi Dewan */}
              {jurusToast && (
                <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-6 py-2 rounded-2xl bg-[#09152e] text-yellow-300 border-2 border-yellow-400 font-mono font-black text-xs sm:text-sm shadow-2xl animate-bounce flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>{jurusToast}</span>
                </div>
              )}

              {/* ================= 1. GRID 10 JURI BERTUGAS ================= */}
              <div className="bg-[#050c1b]/95 border-2 border-cyan-500/40 rounded-xl p-2 sm:p-2.5 shadow-lg space-y-1.5">
                
                {/* Header Section: Title, Mode Urutan & Legend Info */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 border-b border-cyan-500/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs sm:text-sm font-black font-mono uppercase text-white tracking-wider flex items-center gap-1.5">
                      <span>Nilai Juri Bertugas</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px]">
                        ({activeJuryCount} Juri)
                      </span>
                    </h2>
                    {isJurusLocked && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                        TERKUNCI
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Toggle Mode Urutan: Nomor Juri vs Peringkat Nilai */}
                    <div className="inline-flex rounded-lg bg-[#040914] p-1 border border-slate-700/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          playAudioFeedback(750, 0.04);
                          setJuryOrderMode('NUM');
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          juryOrderMode === 'NUM'
                            ? 'bg-cyan-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={`Tampilkan Berdasarkan Nomor Meja Juri (1 s/d ${activeJuryCount})`}
                      >
                        NO. JURI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playAudioFeedback(850, 0.04);
                          setJuryOrderMode('RANK');
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          juryOrderMode === 'RANK'
                            ? 'bg-cyan-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={`Urutkan Dari Nilai Terendah (Rank 1) ke Tertinggi (Rank ${activeJuryCount})`}
                      >
                        RANKING NILAI
                      </button>
                    </div>

                    {/* Legend / Status Indikator */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
                      {activeJuryCount === 10 && (
                        <span className="flex items-center gap-1.5 text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/40">
                          <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/50"></span>
                          <span>DIBUANG (2 TERENDAH & 2 TERTINGGI)</span>
                        </span>
                      )}
                      {activeJuryCount === 5 && (
                        <span className="flex items-center gap-1.5 text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/40">
                          <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/50"></span>
                          <span>DIBUANG (1 TERENDAH & 1 TERTINGGI)</span>
                        </span>
                      )}
                      {activeJuryCount === 3 && (
                        <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span>TANPA ELIMINASI (3 JURI SAH)</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/60 animate-ping"></span>
                        <span>{activeJuryCount === 10 ? 'MEDIAN (RANK 5 & 6)' : activeJuryCount === 5 ? 'MEDIAN (RANK 3)' : 'MEDIAN (RANK 2)'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/40">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40"></span>
                        <span>TERHITUNG</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jury Cards Grid (Sesuai Jumlah Juri Bertugas: 3, 5, atau 10 Juri) */}
                <div className={`grid gap-2 sm:gap-2.5 ${
                  activeJuryCount === 3
                    ? 'grid-cols-3'
                    : activeJuryCount === 5
                    ? 'grid-cols-2 sm:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-5 xl:grid-cols-10'
                }`}>
                  {displayJuries.map((j) => {
                    const rank = juryRankMap.get(j.num) || 0;
                    const isDiscardedLow = discardedLowNums.has(j.num);
                    const isDiscardedHigh = discardedHighNums.has(j.num);
                    const isDiscarded = isDiscardedLow || isDiscardedHigh;
                    const isMedian = medianNums.has(j.num);

                    return (
                      <div
                        key={j.num}
                        onClick={() => handleOpenEditJury(j.num)}
                        className={`rounded-xl border-2 p-2.5 text-center transition-all cursor-pointer relative group select-none shadow-lg flex flex-col justify-between ${
                          isDiscarded
                            ? 'bg-gradient-to-b from-[#220a10] to-[#120508] border-red-500/80 hover:border-red-400 hover:bg-red-950/70 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                            : isMedian
                            ? 'bg-gradient-to-b from-[#052317] to-[#02130c] border-emerald-400 ring-2 ring-emerald-400/60 hover:bg-emerald-950/70 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                            : 'bg-gradient-to-b from-[#061933] to-[#040e1d] border-cyan-500/50 hover:border-cyan-400 hover:bg-[#081a38] shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        }`}
                        title={`Klik untuk Koreksi / Edit Nilai Juri ${j.num} (Rank ${rank})`}
                      >
                        {/* Header Bar Juri: Nomor Juri & Peringkat */}
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            JURI {j.num}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded ${
                              isDiscarded
                                ? 'bg-red-900/80 text-red-200 border border-red-500/50'
                                : isMedian
                                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/60 font-extrabold'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            R-{rank}
                          </span>
                        </div>

                        {/* Status Ribbon Badge */}
                        <div className="my-1">
                          <span
                            className={`block text-[9px] font-mono font-black py-0.5 px-1 rounded uppercase tracking-wider text-center ${
                              isDiscardedLow
                                ? 'bg-red-600 text-white shadow'
                                : isDiscardedHigh
                                ? 'bg-red-700 text-white shadow'
                                : isMedian
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse'
                                : 'bg-cyan-900/90 text-cyan-200 border border-cyan-500/40'
                            }`}
                          >
                            {isDiscardedLow
                              ? 'DIBUANG (TERENDAH)'
                              : isDiscardedHigh
                              ? 'DIBUANG (TERTINGGI)'
                              : isMedian
                              ? 'MEDIAN SAH'
                              : 'TERHITUNG'}
                          </span>
                        </div>

                        {/* Nilai Utama Juri */}
                        <div
                          className={`font-mono text-2xl sm:text-2xl xl:text-3xl font-black tracking-tight leading-none my-1.5 ${
                            isDiscarded
                              ? 'text-red-400 line-through opacity-85'
                              : isMedian
                              ? 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                              : 'text-cyan-300'
                          }`}
                        >
                          {j.finalScore.toFixed(3)}
                        </div>

                        {/* Rincian Komponen Nilai: Baku & Mantap & Salah */}
                        <div className="border-t border-slate-700/70 pt-1.5 space-y-0.5 text-[9px] font-mono text-slate-400 bg-slate-950/40 rounded px-1 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Baku:</span>
                            <span className="text-slate-100 font-bold">{j.kebenaranFinal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Mantap:</span>
                            <span className="text-cyan-200 font-bold">+{j.kemantapanScore.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Salah:</span>
                            <span className={j.kesalahanCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400 font-bold'}>
                              {j.kesalahanCount}x
                            </span>
                          </div>
                        </div>

                        {/* Status Juri Tablet */}
                        <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>TERKIRIM</span>
                          </span>
                          <span className="text-yellow-400 font-bold group-hover:underline flex items-center gap-0.5">
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>KOREKSI</span>
                          </span>
                        </div>

                        {/* Hover Overlay Tombol Koreksi */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-[#040914]/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-black text-yellow-300 border-2 border-yellow-400/80 z-10">
                          <Edit3 className="w-5 h-5 text-yellow-400 animate-bounce" />
                          <span>KOREKSI NILAI</span>
                          <span className="text-[9px] text-slate-300 font-normal">Klik untuk ubah</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= 3. AREA REKAP METRIK UTAMA: 4 HUD CARDS ================= */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                
                {/* 1. NILAI MEDIAN JURI */}
                <div className="bg-[#061226] border border-cyan-500/50 rounded-xl p-2 text-center shadow-md relative overflow-hidden flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                    NILAI MEDIAN JURI (BASE)
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-300 tracking-wider">
                    {baseMedian.toFixed(3)}
                  </div>
                </div>

                {/* 2. TOTAL PENGURANGAN DEWAN */}
                <div className="bg-[#18090d] border border-red-500/50 rounded-xl p-2 text-center shadow-md relative overflow-hidden flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block mb-0.5">
                    TOTAL HUKUMAN DEWAN
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-red-400 tracking-wider">
                    -{totalPenalties.toFixed(2)}
                  </div>
                </div>

                {/* 3. NILAI AKHIR RESMI */}
                <div className="bg-gradient-to-br from-[#06241a] to-[#041712] border-2 border-emerald-400 rounded-xl p-2 text-center shadow-[0_0_15px_rgba(52,211,153,0.25)] relative overflow-hidden ring-1 ring-emerald-300/50 flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest block mb-0.5">
                    NILAI AKHIR RESMI
                  </span>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                    {finalOfficialScore.toFixed(3)}
                  </div>
                </div>

                {/* 4. STANDAR DEVIASI (TIE-BREAKER) */}
                <div className="bg-[#09152e] border border-yellow-500/50 rounded-xl p-2 text-center shadow-md relative overflow-hidden flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-yellow-300 uppercase tracking-widest block mb-0.5">
                    STANDAR DEVIASI (SD)
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-yellow-400 tracking-wider">
                    {standardDeviation.toFixed(4)}
                  </div>
                </div>

              </div>

              {/* ================= 3. PENGURANGAN HUKUMAN RESMI DEWAN ================= */}
              <div className="bg-[#071328]/95 border border-cyan-500/40 rounded-xl p-2 sm:p-2.5 shadow-lg space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cyan-500/30 pb-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black font-mono uppercase text-white tracking-wider">
                      PENGURANGAN HUKUMAN RESMI DEWAN
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAllPenalties}
                    className="px-2.5 py-0.5 rounded-lg border border-red-500/60 bg-red-950/60 hover:bg-red-900 text-red-200 font-mono text-[9px] sm:text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-red-400" />
                    <span>RESET SEMUA HUKUMAN</span>
                  </button>
                </div>

                {/* 6 Kategori Hukuman Dewan dengan Tombol Cepat */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-xs font-mono">
                  
                  {/* 1. Hukuman Toleransi Waktu */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">HUKUMAN WAKTU</div>
                      <div className="text-[9px] text-slate-500">Toleransi 2:55 - 3:05</div>
                      <div className="text-xl font-black text-amber-400 my-1">
                        -{(penalties.timeToleranceViolation || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('timeToleranceViolation', -0.05)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                        title="Kurangi Hukuman Waktu"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('timeToleranceViolation', 0.05)}
                        className="py-1 rounded bg-amber-900/70 hover:bg-amber-800 border border-amber-600 text-amber-200 font-black active:scale-95 cursor-pointer"
                        title="Tambah Hukuman Waktu (-0.05)"
                      >
                        -0.05
                      </button>
                    </div>
                  </div>

                  {/* 2. Senjata Jatuh (-0.50) */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">SENJATA JATUH</div>
                      <div className="text-[9px] text-slate-500">-0.50 per kejadian</div>
                      <div className="text-xl font-black text-red-400 my-1">
                        -{(penalties.weaponDropped || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('weaponDropped', -0.50)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('weaponDropped', 0.50)}
                        className="py-1 rounded bg-red-900/70 hover:bg-red-800 border border-red-600 text-red-200 font-black active:scale-95 cursor-pointer"
                      >
                        -0.50
                      </button>
                    </div>
                  </div>

                  {/* 3. Senjata Rusak / Patah (-0.50) */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">SENJATA RUSAK</div>
                      <div className="text-[9px] text-slate-500">Patah / Tidak Sesuai</div>
                      <div className="text-xl font-black text-red-400 my-1">
                        -{(penalties.weaponBroken || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('weaponBroken', -0.50)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('weaponBroken', 0.50)}
                        className="py-1 rounded bg-red-900/70 hover:bg-red-800 border border-red-600 text-red-200 font-black active:scale-95 cursor-pointer"
                      >
                        -0.50
                      </button>
                    </div>
                  </div>

                  {/* 4. Keluar Arena (-0.05) */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">KELUAR ARENA</div>
                      <div className="text-[9px] text-slate-500">Melewati Garis 10x10</div>
                      <div className="text-xl font-black text-amber-400 my-1">
                        -{(penalties.outOfArena || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('outOfArena', -0.05)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('outOfArena', 0.05)}
                        className="py-1 rounded bg-amber-900/70 hover:bg-amber-800 border border-amber-600 text-amber-200 font-black active:scale-95 cursor-pointer"
                      >
                        -0.05
                      </button>
                    </div>
                  </div>

                  {/* 5. Pelanggaran Pakaian / Aksesoris (-0.05) */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">PAKAIAN / AKSESORIS</div>
                      <div className="text-[9px] text-slate-500">Kain / Sabuk Terlepas</div>
                      <div className="text-xl font-black text-amber-400 my-1">
                        -{(penalties.attireViolation || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('attireViolation', -0.05)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('attireViolation', 0.05)}
                        className="py-1 rounded bg-amber-900/70 hover:bg-amber-800 border border-amber-600 text-amber-200 font-black active:scale-95 cursor-pointer"
                      >
                        -0.05
                      </button>
                    </div>
                  </div>

                  {/* 6. Suara Tidak Sah (-0.05) */}
                  <div className="bg-[#050c18] border border-slate-700 rounded-xl p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">SUARA TIDAK SAH</div>
                      <div className="text-[9px] text-slate-500">Bersuara Saat TGRS</div>
                      <div className="text-xl font-black text-amber-400 my-1">
                        -{(penalties.unauthorizedSound || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('unauthorizedSound', -0.05)}
                        className="py-1 rounded bg-[#09152b] hover:bg-[#0c1f40] border border-slate-600 text-slate-200 font-bold active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePenaltyChange('unauthorizedSound', 0.05)}
                        className="py-1 rounded bg-amber-900/70 hover:bg-amber-800 border border-amber-600 text-amber-200 font-black active:scale-95 cursor-pointer"
                      >
                        -0.05
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* ================= 4. DEWAN ACTION CONTROLS & SAHKAN KEPUTUSAN ================= */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 bg-[#071328]/90 border border-cyan-500/30 rounded-xl p-2 shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSahkanNilai}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs uppercase transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer glow-emerald"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SAHKAN NILAI PENAMPILAN</span>
                  </button>

                  {/* Status Otomatis Pemenang Sesuai Nilai Unggul */}
                  <div className="px-2.5 py-1 rounded-lg bg-[#040c1c] border border-cyan-500/40 text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5">
                    <span className="text-yellow-400 font-black">HASIL OTOMATIS:</span>
                    <span className={autoWinnerCorner === 'BLUE' ? 'text-blue-300 font-black' : 'text-red-300 font-black'}>
                      {autoWinnerReason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={handlePrintFormulirDewan}
                    className="px-3 py-1.5 rounded-lg bg-[#070e1c] hover:bg-[#091326] border border-cyan-500/40 text-cyan-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow hover:border-cyan-400 text-xs"
                    title="Cetak Lembar Rekapitulasi Penilaian Dewan (PB IPSI / PERSILAT)"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>PRINT FORMULIR DEWAN</span>
                  </button>
                </div>
              </div>

              {/* ================= 5. BANNER BAWAH: KOMPARASI ATLET / TIM SUDUT BIRU & MERAH ================= */}
              <div className="bg-[#050d1e] border-2 border-cyan-500/40 rounded-xl p-1.5 sm:p-2 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 items-center">
                  
                  {/* Sisi Biru */}
                  <div className={`md:col-span-5 bg-gradient-to-r from-[#173a80] to-[#0f2450] border rounded-lg p-2 flex items-center justify-between text-white transition-all ${
                    autoWinnerCorner === 'BLUE' ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'border-blue-400/60'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"></span>
                        <span className="text-[9px] font-mono font-black uppercase text-blue-200">SUDUT BIRU</span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-600 text-[8px] font-bold font-mono">
                          {blueAthlete.contingent}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-black font-mono uppercase mt-0.5 truncate">
                        {blueAthlete.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black font-mono text-cyan-300">
                        {blueScore.toFixed(3)}
                      </div>
                      <span className={`text-[8px] font-mono font-bold uppercase ${
                        autoWinnerCorner === 'BLUE' ? 'text-emerald-400 font-black' : 'text-slate-400'
                      }`}>
                        {autoWinnerCorner === 'BLUE' ? 'UNGGUL' : 'SELESAI'}
                      </span>
                    </div>
                  </div>

                  {/* Tengah: Badge VS & Selisih Nilai */}
                  <div className="md:col-span-2 text-center py-0.5">
                    <div className="flex items-center justify-center">
                      <img src="./vs.png" alt="VS" className="h-5 w-auto object-contain select-none drop-shadow" draggable={false} />
                    </div>
                    <div className="text-[9px] font-mono font-bold text-cyan-400 mt-0.5">
                      SELISIH: {Math.abs(scoreDifference).toFixed(3)}
                    </div>
                  </div>

                  {/* Sisi Merah */}
                  <div className={`md:col-span-5 bg-gradient-to-l from-[#731919] to-[#450e0e] border rounded-lg p-2 flex items-center justify-between text-white transition-all ${
                    autoWinnerCorner === 'RED' ? 'border-red-400 ring-2 ring-red-400/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-red-400/60'
                  }`}>
                    <div className="text-left">
                      <div className="text-lg sm:text-xl font-black font-mono text-red-300">
                        {redScore.toFixed(3)}
                      </div>
                      <span className={`text-[8px] font-mono font-bold uppercase ${
                        autoWinnerCorner === 'RED' ? 'text-amber-300 font-black' : 'text-slate-400'
                      }`}>
                        {autoWinnerCorner === 'RED' ? 'UNGGUL' : 'SELESAI'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-[8px] font-bold font-mono">
                          {redAthlete.contingent}
                        </span>
                        <span className="text-[9px] font-mono font-black uppercase text-red-200">SUDUT MERAH</span>
                        <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444]"></span>
                      </div>
                      <div className="text-xs sm:text-sm font-black font-mono uppercase mt-0.5 truncate">
                        {redAthlete.name}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ================= MODAL KOREKSI / EDIT NILAI JURI SPESIFIK ================= */}
              {editingJuryNumber !== null && (
                <div className="fixed inset-0 z-50 bg-[#040813]/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
                  <div className="cyber-glass-deep border-2 border-cyan-500/70 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-100 relative">
                    
                    <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-yellow-400" />
                        <h4 className="text-sm sm:text-base font-black uppercase text-white font-mono">
                          KOREKSI NILAI JURI #{editingJuryNumber}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingJuryNumber(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#070e1c] cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      {/* Input Kesalahan Gerak */}
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          JUMLAH KESALAHAN GERAK (-0.01 per kesalahan):
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditScoreForm(prev => ({ ...prev, salah: Math.max(0, prev.salah - 1) }))}
                            className="px-3 py-1.5 rounded-lg bg-[#070e1c] border border-slate-700 text-slate-200 font-black cursor-pointer hover:bg-[#0a152d]"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editScoreForm.salah}
                            onChange={(e) => setEditScoreForm(prev => ({ ...prev, salah: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-[#030814] text-center text-yellow-400 font-black text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setEditScoreForm(prev => ({ ...prev, salah: prev.salah + 1 }))}
                            className="px-3 py-1.5 rounded-lg bg-[#070e1c] border border-slate-700 text-slate-200 font-black cursor-pointer hover:bg-[#0a152d]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Input Kemantapan / Stamina */}
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          NILAI KEMANTAPAN / STAMINA (0.01 - 0.10):
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setEditScoreForm(prev => ({ ...prev, kemantapan: val }))}
                              className={`py-1 rounded text-center font-bold cursor-pointer transition-all ${
                                Math.abs(editScoreForm.kemantapan - val) < 0.005
                                  ? 'bg-cyan-600 border border-cyan-400 text-white font-black ring-1 ring-cyan-300'
                                  : 'bg-[#061022] border border-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              {val.toFixed(2)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview Nilai Hasil Koreksi */}
                      <div className="p-3 bg-[#030814] border border-cyan-500/40 rounded-xl text-center space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">HASIL KALKULASI JURI #{editingJuryNumber}:</div>
                        <div className="text-3xl font-black text-cyan-300">
                          {(9.90 - (editScoreForm.salah * 0.01) + editScoreForm.kemantapan).toFixed(3)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Baku: {(9.90 - (editScoreForm.salah * 0.01)).toFixed(2)} | Mantap: {editScoreForm.kemantapan.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingJuryNumber(null)}
                        className="w-1/3 py-2 rounded-xl border border-slate-700 bg-[#070e1c] text-slate-300 font-bold text-xs cursor-pointer hover:bg-[#0a152d]"
                      >
                        BATAL
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveJuryScore}
                        className="w-2/3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs font-mono uppercase shadow-md active:scale-95 cursor-pointer glow-cyan"
                      >
                        SIMPAN KOREKSI NILAI
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          );
        })()
      )}

      {/* ================= MODAL KEPUTUSAN KEMENANGAN (POP-UP) ================= */}
      {/* ================= MODAL KEPUTUSAN KEMENANGAN (POP-UP MODAL) ================= */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-[#040813]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="cyber-glass-deep border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative hud-bracket">
            
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-black uppercase text-white tracking-wider font-mono">
                  KEPUTUSAN PEMENANG PERTANDINGAN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#070e1c] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PILIH SUDUT PEMENANG */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-300 block font-mono">
                PILIH SUDUT PEMENANG:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerCorner('BLUE')}
                  className={`p-3 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedWinnerCorner === 'BLUE'
                      ? 'bg-[#2563eb] text-white border-blue-400 glow-blue scale-[1.02]'
                      : 'bg-[#070e1c] text-blue-200 border-blue-900/60 hover:bg-[#091326]'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"></span>
                  <span>SUDUT BIRU</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinnerCorner('RED')}
                  className={`p-3 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedWinnerCorner === 'RED'
                      ? 'bg-[#dc2626] text-white border-red-400 glow-red scale-[1.02]'
                      : 'bg-[#070e1c] text-red-200 border-red-900/60 hover:bg-[#091326]'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444]"></span>
                  <span>SUDUT MERAH</span>
                </button>
              </div>

              {/* Preview Nama Pesilat Terpilih */}
              <div className="p-2.5 bg-[#070e1c]/90 border border-cyan-500/30 rounded-xl text-center">
                <span className="text-[10px] font-mono text-cyan-400 uppercase block font-bold">ATLET TERPILIH:</span>
                <span className="text-sm font-black text-white uppercase">
                  {selectedWinnerCorner === 'BLUE' ? tanding?.blueAthlete?.name : tanding?.redAthlete?.name}
                </span>
                <span className="text-xs text-slate-300 font-semibold block">
                  {selectedWinnerCorner === 'BLUE' ? tanding?.blueAthlete?.contingent : tanding?.redAthlete?.contingent}
                </span>
              </div>
            </div>

            {/* PILIH JENIS KEMENANGAN (SESUAI ATURAN IPSI 2026 & PERSILAT) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-300 block font-mono">
                JENIS KEMENANGAN (IPSI 2026 / PERSILAT):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold font-sans">
                {[
                  { key: 'WMP', title: 'MENANG WMP', desc: 'Wasit Menghentikan Pertandingan (TKO/Kalah Mutlak)' },
                  { key: 'MUTLAK', title: 'MENANG MUTLAK', desc: 'Keunggulan mutlak dari seluruh juri' },
                  { key: 'ANGKA', title: 'MENANG ANGKA', desc: 'Keunggulan selisih angka akhir 3 babak' },
                  { key: 'WASIT', title: 'MENANG TEKNIK', desc: 'Lawan cedera / tidak dapat melanjutkan' },
                  { key: 'UNDUR_DIRI', title: 'UNDUR DIRI (UD)', desc: 'Lawan mengundurkan diri / walkover' },
                  { key: 'DISKUALIFIKASI', title: 'DISKUALIFIKASI', desc: 'Lawan terkena sanksi diskualifikasi' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedWinType(item.key as WinType)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedWinType === item.key
                        ? 'bg-amber-400 border-amber-300 text-slate-950 glow-gold scale-[1.02]'
                        : 'bg-[#070e1c] border-cyan-500/25 text-slate-200 hover:bg-[#091326]'
                    }`}
                  >
                    <div className="font-black text-xs uppercase font-mono">{item.title}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${selectedWinType === item.key ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* TOMBOL SAHKAN & BATAL */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                className="w-1/3 py-2.5 rounded-xl border border-cyan-500/30 bg-[#070e1c] hover:bg-[#091326] text-slate-300 font-black text-xs uppercase transition-colors cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleFinalizeWinner}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer glow-emerald"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAHKAN KEPUTUSAN</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL PROMPT VERIFIKASI DEWAN (IPSI 2026) ================= */}
      {showVerifyPrompt && (
        <div className="fixed inset-0 z-50 bg-[#040813]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
          <div className="cyber-glass-deep border-2 border-cyan-500/60 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative hud-bracket max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider font-mono">
                    PROMPT VERIFIKASI DEWAN (IPSI 2026)
                  </h3>
                  <p className="text-[11px] font-semibold text-cyan-300/80">
                    Formulir Resmi Tinjauan Video & Keputusan Juri Pertandingan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyPrompt(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#070e1c] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indikator 3 Langkah */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs font-black uppercase font-mono">
              <button
                type="button"
                onClick={() => setVerifyStep(1)}
                className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  verifyStep === 1
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-[#070e1c] border-slate-700 text-slate-400'
                }`}
              >
                1. PILIH SUDUT
              </button>
              <button
                type="button"
                onClick={() => setVerifyStep(2)}
                className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  verifyStep === 2
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-[#070e1c] border-slate-700 text-slate-400'
                }`}
              >
                2. KATEGORI TINJAUAN
              </button>
              <button
                type="button"
                onClick={() => setVerifyStep(3)}
                className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  verifyStep === 3
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-[#070e1c] border-slate-700 text-slate-400'
                }`}
              >
                3. DETAIL ALASAN / KASUS
              </button>
            </div>

            {/* LANGKAH 1: PILIH SUDUT PESILAT */}
            {verifyStep === 1 && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-black uppercase tracking-wider text-cyan-300 block font-mono">
                  LANGKAH 1: PILIH SUDUT PESILAT YANG DIEVALUASI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback(700, 0.05);
                      setVerifyCorner('BLUE');
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                      verifyCorner === 'BLUE'
                        ? 'bg-gradient-to-br from-blue-900 to-blue-950 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-[1.02]'
                        : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white font-mono inline-block mb-1.5">
                      SUDUT BIRU
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      {tanding?.blueAthlete?.name || 'PESILAT BIRU'}
                    </h4>
                    <p className="text-xs font-bold text-blue-200 uppercase mt-0.5">
                      {tanding?.blueAthlete?.contingent || 'KONTINGEN BIRU'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback(700, 0.05);
                      setVerifyCorner('RED');
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                      verifyCorner === 'RED'
                        ? 'bg-gradient-to-br from-red-900 to-red-950 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-[1.02]'
                        : 'bg-[#070e1c] border-red-900/40 text-slate-300 hover:border-red-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white font-mono inline-block mb-1.5">
                      SUDUT MERAH
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      {tanding?.redAthlete?.name || 'PESILAT MERAH'}
                    </h4>
                    <p className="text-xs font-bold text-red-200 uppercase mt-0.5">
                      {tanding?.redAthlete?.contingent || 'KONTINGEN MERAH'}
                    </p>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer glow-cyan"
                  >
                    <span>Lanjut ke Kategori Tinjauan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* LANGKAH 2: KATEGORI TINJAUAN */}
            {verifyStep === 2 && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-black uppercase tracking-wider text-cyan-300 block font-mono">
                  LANGKAH 2: PILIH KATEGORI TINJAUAN VERIFIKASI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback(750, 0.05);
                      setVerifyType('JATUHAN');
                      setVerifyReason(PRESETS_JATUHAN[0]);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      verifyType === 'JATUHAN'
                        ? 'bg-gradient-to-br from-indigo-900 to-indigo-950 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-[1.02]'
                        : 'bg-[#070e1c] border-indigo-900/40 text-slate-300 hover:border-indigo-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white font-mono inline-block mb-1.5">
                      AKSEN BIRU / INDIGO
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      VERIFIKASI JATUHAN
                    </h4>
                    <p className="text-xs font-semibold text-indigo-200 mt-1">
                      Meninjau keabsahan jatuhan (+3 Poin Jatuhan jika sah).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback(750, 0.05);
                      setVerifyType('PELANGGARAN');
                      setVerifyReason(PRESETS_PELANGGARAN[0]);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      verifyType === 'PELANGGARAN'
                        ? 'bg-gradient-to-br from-rose-950 to-red-950 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-[1.02]'
                        : 'bg-[#070e1c] border-rose-900/40 text-slate-300 hover:border-rose-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-700 text-white font-mono inline-block mb-1.5">
                      AKSEN MERAH MARUN
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      VERIFIKASI PELANGGARAN
                    </h4>
                    <p className="text-xs font-semibold text-rose-200 mt-1">
                      Meninjau sanksi / hukuman wasit atas tindakan terlarang.
                    </p>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-[#070e1c] text-slate-300 font-bold text-xs uppercase cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer glow-cyan"
                  >
                    <span>Lanjut ke Alasan / Presets</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* LANGKAH 3: DETAIL ALASAN / PRESETS KASUS */}
            {verifyStep === 3 && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-black uppercase tracking-wider text-cyan-300 block font-mono">
                  LANGKAH 3: DETAIL ALASAN / KASUS PRESETS ({verifyType})
                </label>

                {/* Preset Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {(verifyType === 'JATUHAN' ? PRESETS_JATUHAN : PRESETS_PELANGGARAN).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        playAudioFeedback(800, 0.04);
                        setVerifyReason(preset);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        verifyReason === preset
                          ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                          : 'bg-[#070e1c] border-cyan-500/25 text-slate-200 hover:border-cyan-400 hover:bg-[#091326]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Kolom Catatan Tambahan Kasus */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-black uppercase text-cyan-400 font-mono block">
                    KOLOM TAMBAHAN: CATATAN KASUS KHUSUS LAINNYA (OPSIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="Contoh: Terjadi benturan simultan di sudut gelanggang detik 45..."
                    className="w-full bg-[#070e1c] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Ringkasan Prompt Sebelum Mulai */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-400/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">RINGKASAN SESI:</span>
                    <span className="font-bold text-white uppercase">
                      {verifyType} • SUDUT {verifyCorner === 'BLUE' ? 'BIRU' : 'MERAH'}
                    </span>
                    <p className="text-[11px] text-slate-300 truncate max-w-sm mt-0.5">
                      {verifyReason}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-400/20 text-amber-300 font-black shrink-0">
                    SIAP BROADCAST
                  </span>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-[#070e1c] text-slate-300 font-bold text-xs uppercase cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOfficialVerification}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer glow-emerald"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>MULAI VERIFIKASI RESMI (IPSI 2026)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= MODAL MENU POP UP VERIFIKASI DEWAN ================= */}
      {currentVerification?.active && showDewanLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
          <div className="cyber-glass-deep border-2 border-amber-400 rounded-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.85)] text-slate-100 relative">
            
            {/* Paling atas: Tulisan kecil "Menunggu Vote Juri...." */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Menunggu Vote Juri....</span>
            </div>

            {/* Tulisan: VERIFIKASI JATUHAN / PELANGGARAN sesuai pilihan dewan */}
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide font-mono mt-1 text-center">
              {currentVerification.type === 'JATUHAN' ? 'VERIFIKASI JATUHAN' : 'VERIFIKASI PELANGGARAN'}
            </h2>

            {/* Deskripsi: Memonitor respon voting langsungdari seluruh juri secara real time */}
            <p className="text-xs text-slate-300 text-center mt-1 leading-snug">
              Memonitor respon voting langsungdari seluruh juri secara real time
            </p>

            {/* 3 Grid Kolom Juri (Juri 1, Juri 2, Juri 3) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-4">
              {[1, 2, 3].map((jId) => {
                const vote = currentVerification.votes?.[jId];
                return (
                  <div
                    key={jId}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all flex flex-col justify-center items-center min-h-[80px] ${
                      vote === 'BIRU'
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                        : vote === 'MERAH'
                        ? 'bg-red-600/30 border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : vote === 'TIDAK SAH'
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'bg-[#070e1c] border-slate-700/80 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-300">
                      Juri {jId}
                    </span>
                    <div className="mt-1">
                      {vote ? (
                        <span
                          className={`font-mono font-black text-xs sm:text-sm uppercase tracking-wide px-2 py-0.5 rounded shadow-sm ${
                            vote === 'BIRU'
                              ? 'bg-blue-600 text-white'
                              : vote === 'MERAH'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {vote}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total masuk & Keputusan Konsensus Juri */}
            {(() => {
              const votes = currentVerification.votes || {};
              const totalMasuk = [1, 2, 3].filter((id) => Boolean(votes[id])).length;
              const consensus = currentVerification.consensusResult;

              let keputusanText = 'Menunggu...';
              let keputusanColor = 'text-slate-400 italic';

              if (consensus === 'BIRU') {
                keputusanText = 'Sah Sudut Biru';
                keputusanColor = 'text-blue-400 font-black';
              } else if (consensus === 'MERAH') {
                keputusanText = 'Sah Sudut Merah';
                keputusanColor = 'text-red-400 font-black';
              } else if (consensus === 'TIDAK SAH') {
                keputusanText = 'Tidak Sah';
                keputusanColor = 'text-amber-400 font-black';
              } else if (totalMasuk >= 2 && !consensus) {
                keputusanText = 'Belum Sepakat';
                keputusanColor = 'text-amber-300 font-bold';
              }

              return (
                <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <div className="text-slate-300">
                      Total masuk : <span className="font-mono font-bold text-cyan-300">{totalMasuk}/3 Juri</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-300">Keputusan : </span>
                      <span className={`uppercase ${keputusanColor}`}>
                        {keputusanText}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right italic">
                    (hasil dari konsensus suara juri (minimal 2 juri sepakat))
                  </p>
                </div>
              );
            })()}

            {/* Kotak dialog / Tombol: batalkan dan Proses keputusan */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-2">
              <button
                type="button"
                onClick={handleDewanBatalVerifikasi}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-all active:scale-95 text-center font-sans"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleDewanSahkanKeputusan}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase cursor-pointer transition-all shadow-lg active:scale-95 text-center font-sans glow-emerald"
              >
                Proses Keputusan
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
