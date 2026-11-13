import React from 'react';
import { AppView } from '../types/tournament';
import {
  Gavel,
  FileSpreadsheet,
  Users,
  Tv,
  Shuffle,
  CalendarDays,
  GitFork,
  Timer,
  FileCheck2,
  Home,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface NavigationHeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  onNavigate,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const navItems: { id: AppView; label: string; icon: React.ElementType }[] = [
    { id: 'landing', label: 'Portal', icon: Home },
    { id: 'dewan', label: 'Dewan', icon: Gavel },
    { id: 'sekretaris', label: 'Sekretaris', icon: FileSpreadsheet },
    { id: 'juri', label: 'Juri', icon: Users },
    { id: 'monitor', label: 'Monitor', icon: Tv },
    { id: 'loting', label: 'Loting', icon: Shuffle },
    { id: 'jadwal', label: 'Jadwal', icon: CalendarDays },
    { id: 'bracket', label: 'Bracket', icon: GitFork },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'laporan', label: 'Laporan', icon: FileCheck2 },
  ];

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: Kembali Button (Only Icon) & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('landing')}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Kembali ke Halaman Utama"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-2xs">
                IPSI
              </div>
              <span className="font-extrabold text-sm text-neutral-900 tracking-tight hidden sm:inline">
                SIMPERSILAT
              </span>
            </div>
          </div>

          {/* Center: Navigation Tabs (Scrollable) */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Fullscreen Button (Only Icon) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
