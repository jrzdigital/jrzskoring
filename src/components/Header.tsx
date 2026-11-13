import React from 'react';
import { useMatch, AppView } from '../context/MatchContext';
import { 
  Trophy, 
  Tv, 
  SlidersHorizontal, 
  Gamepad2, 
  Sparkles, 
  FileText, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenProtocol: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onOpenProtocol }) => {
  const { activeView, setActiveView, soundEnabled, toggleSound, match } = useMatch();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'SCOREBOARD', label: 'Layar Arena', icon: <Tv className="w-4 h-4" /> },
    { id: 'OPERATOR', label: 'Konsol Ketua', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'JUDGE_PAD', label: 'Juri Touch Pad', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'SENI', label: 'Kategori Seni', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'HISTORY', label: 'Arsip Partai', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark (Display Face) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-slate-800 to-blue-600 flex items-center justify-center p-0.5 shadow-md shadow-red-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-scoreboard tracking-wider text-xl font-bold uppercase text-white whitespace-nowrap">
                SilatScore <span className="text-amber-400">Pro</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                IPSI / PERSILAT
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm shadow-black/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Rules Guide Trigger */}
          <button
            onClick={onOpenRules}
            title="Panduan Aturan Silat"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Aturan</span>
          </button>

          {/* Official Protocol Trigger */}
          <button
            onClick={onOpenProtocol}
            title="Cetak Berita Acara Pertandingan"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Berita Acara</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Matikan Suara (Gong/Peluit)' : 'Aktifkan Suara (Gong/Peluit)'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Layar Penuh Arena"
            className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Quick Arena Badge */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs text-slate-400">
            <span>{match.metadata.arena}</span>
            <span>·</span>
            <span>Partai #{match.metadata.matchNumber}</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar for smaller viewports */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-900 bg-slate-950 gap-1.5 no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
