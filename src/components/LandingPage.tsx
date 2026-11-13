import React, { useState, useEffect } from 'react';
import { useSilat } from '../context/SilatContext';
import { UserRole } from '../types/silat';
import {
  FileSpreadsheet,
  Shield,
  User,
  Monitor,
  Clock,
  FileText,
  Maximize2,
  Minimize2,
  Smartphone,
  Tablet
} from 'lucide-react';
import { RoleAuthModal } from './RoleAuthModal';
import { useScreenAnalyzer } from '../hooks/useScreenAnalyzer';
import { soundFx } from '../utils/soundEffects';

interface LandingPageProps {
  onSelectPanel: (panel: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectPanel }) => {
  const screen = useScreenAnalyzer();
  const {
    currentRole,
    isAuthenticated,
  } = useSilat();

  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      soundFx.playClick(2);
    } catch {
      // Ignore audio error
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const playClickSound = (tone = 1) => {
    try {
      soundFx.playClick(tone);
    } catch {
      // Ignore audio error
    }
  };

  const panels = [
    {
      role: 'secretary' as UserRole,
      title: 'SEKRETARIS',
      desc: 'INPUT DATA ATLIT, KELOLA DURASI TANDING, EXPORT/IMPORT DATA EXCEL, KENDALIKAN TIMER & BABAK PERTANDINGAN',
      icon: FileSpreadsheet,
      requiresPin: true,
      defaultPin: '211096'
    },
    {
      role: 'dewan' as UserRole,
      title: 'DEWAN',
      desc: 'KELOLA PELANGGARAN, TEGURAN, PERINGATAN, JATUHAN SERTA INSTRUKSI VERIFIKASI PENILAIAN JURI',
      icon: Shield,
      requiresPin: true,
      defaultPin: '211096'
    },
    {
      role: 'juri' as UserRole,
      title: 'JURI',
      desc: 'BERIKAN PENILAIAN LANGSUNG PUKULAN & TENDANGAN PADA SUDUT MERAH & BIRU SECARA REAL-TIME',
      icon: User,
      requiresPin: true,
      defaultPin: '211096'
    },
    {
      role: 'monitor' as UserRole,
      title: 'MONITOR',
      desc: 'DISPLAY LAYAR UTAMA PENONTON MENAMPILKAN SKOR REAL-TIME AKUMULATIF SECARA MIRRORED & MEGAH',
      icon: Monitor,
      requiresPin: false,
      defaultPin: 'Bebas Akses'
    },
    {
      role: 'timer' as UserRole,
      title: 'TIMER',
      desc: 'PENGATUR WAKTU RESMI PERTANDINGAN, HITUNG MUNDUR RONDE, JEDA MEDIS, DAN TANDA BEL GONG',
      icon: Clock,
      requiresPin: true,
      defaultPin: '211096'
    }
  ];

  const handleCardClick = (role: UserRole) => {
    playClickSound(role === 'juri' ? 3 : 1);

    if (currentRole === role && isAuthenticated && role !== 'juri') {
      onSelectPanel(role);
      return;
    }

    if (role === 'monitor' || role === 'laporan') {
      onSelectPanel(role);
      return;
    }

    setAuthRole(role);
  };

  return (
    <div className="flex-grow flex flex-col justify-between w-full bg-gradient-to-br from-[#19072b] via-[#05040a] to-[#030d22] font-sans select-none min-h-screen relative overflow-hidden animate-fade-in text-slate-100 cyber-arena-bg">
      
      {/* TOP BAR: HANYA KONTROL LAYAR PENUH & INDIKATOR LUAS LAYAR OTOMATIS */}
      <header className="w-full bg-[#030106]/70 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-end font-mono text-xs text-slate-300 shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge Analisis Luas Layar Otomatis */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-[10.5px] font-mono font-bold text-purple-300 shadow-sm"
            title={`Luas Layar: ${screen.width} × ${screen.height} px (${screen.areaMegaPixels} MP)\nRasio: ${screen.aspectRatioFormatted}\nOrientasi: ${screen.orientation}\nKategori: ${screen.deviceCategoryLabel}`}
          >
            {screen.isMobile ? (
              <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : screen.isTablet ? (
              <Tablet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            )}
            <span className="font-mono">{screen.width}×{screen.height}</span>
            <span className="hidden lg:inline text-purple-400/80 font-normal">({screen.deviceCategoryLabel})</span>
          </div>

          {/* Fullscreen Button (Icon Only) */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/50 border border-purple-900/45 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center justify-center h-8 w-8 active:scale-95 shadow-sm"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* MAIN HERO & 6 MENU PANELS (1 BARIS HORIZONTAL, FIT LAYAR SEMUA PERANGKAT) */}
      <main className="flex-grow flex flex-col items-center justify-center py-2 sm:py-4 md:py-6 px-2 sm:px-4 max-w-7xl mx-auto w-full z-10 animate-fade-in overflow-hidden">
        
        {/* LOGO JRZ SCORE UTAMA */}
        <div className="relative group mb-3 sm:mb-5 md:mb-6 flex justify-center items-center shrink-0">
          <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-purple-600/25 via-amber-500/15 to-indigo-600/25 rounded-full blur-xl sm:blur-2xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
          <img
            src="/jrzscoreutama.png"
            alt="Logo JRZ Score Utama"
            className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-[0_12px_40px_rgba(168,85,247,0.4)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* 6 MENU PANELS - 1 BARIS HORIZONTAL TANPA GRID */}
        <div className="flex flex-row items-stretch justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 lg:gap-4 w-full max-w-7xl mx-auto">
          {panels.map((p) => {
            const Icon = p.icon;
            const isCurrent = currentRole === p.role;

            return (
              <div
                key={p.role}
                onClick={() => handleCardClick(p.role)}
                className={`flex-1 min-w-0 bg-[#170a2a]/45 backdrop-blur-md border border-[#3c176e]/55 hover:bg-[#220f3c]/70 hover:border-purple-400/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 transition-all duration-300 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 md:p-4 lg:p-5 flex flex-col items-center justify-between text-center cursor-pointer group relative select-none ${
                  isCurrent ? 'ring-2 ring-amber-400 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.35)]' : ''
                }`}
                id={`landing-card-${p.role}`}
              >
                {/* Active Indicator Pin */}
                {isCurrent && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[7px] sm:text-[8px] md:text-[9px] font-black tracking-widest uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] font-mono">
                    AKTIF
                  </span>
                )}

                {/* Top Section: Circular Amber Icon Badge, Title & Description */}
                <div className="flex flex-col items-center w-full">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 lg:w-15 lg:h-15 rounded-full border sm:border-2 border-amber-500/90 bg-amber-500/5 flex items-center justify-center text-amber-500 mb-1.5 sm:mb-3 md:mb-4 group-hover:scale-105 group-hover:border-amber-400 group-hover:bg-amber-500/10 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                  </div>
                  
                  <h3 className="font-sans font-black tracking-wider sm:tracking-[0.15em] lg:tracking-[0.2em] text-[#f8fafc] text-[9.5px] sm:text-xs md:text-sm lg:text-[15px] uppercase group-hover:text-amber-300 transition-colors w-full text-center truncate">
                    {p.title}
                  </h3>
                  
                  {/* Divider line */}
                  <div className="w-3/4 border-t border-purple-900/40 my-1.5 sm:my-2.5 md:my-3 group-hover:border-purple-500/40 transition-colors"></div>
                  
                  {/* Subtitle / Description text */}
                  <p className="text-[7px] sm:text-[8.5px] md:text-[10px] lg:text-[11px] text-purple-200/60 leading-tight sm:leading-snug md:leading-normal font-sans uppercase line-clamp-3 sm:line-clamp-4 md:line-clamp-none max-w-full text-center">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ROLE AUTH MODAL WITH PIN VERIFICATION */}
      {authRole && (
        <RoleAuthModal
          targetRole={authRole}
          onSuccess={() => {
            const role = authRole;
            setAuthRole(null);
            onSelectPanel(role);
          }}
          onClose={() => setAuthRole(null)}
        />
      )}

    </div>
  );
};
