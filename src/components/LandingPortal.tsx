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
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

interface LandingPortalProps {
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const LandingPortal: React.FC<LandingPortalProps> = ({
  onNavigate,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const menuPanels: {
    id: AppView;
    title: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'dewan',
      title: 'Dewan',
      icon: Gavel,
    },
    {
      id: 'sekretaris',
      title: 'Sekretaris',
      icon: FileSpreadsheet,
    },
    {
      id: 'juri',
      title: 'Juri',
      icon: Users,
    },
    {
      id: 'monitor',
      title: 'Monitor',
      icon: Tv,
    },
    {
      id: 'loting',
      title: 'Loting',
      icon: Shuffle,
    },
    {
      id: 'jadwal',
      title: 'Jadwal',
      icon: CalendarDays,
    },
    {
      id: 'bracket',
      title: 'Bracket',
      icon: GitFork,
    },
    {
      id: 'timer',
      title: 'Timer',
      icon: Timer,
    },
  ];

  return (
    <div className="relative py-4 sm:py-6 animate-in fade-in duration-300">
      {/* Top-Right Action Icons: Fullscreen and Settings */}
      <div className="flex justify-end items-center gap-2 mb-4 sm:mb-6">
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full Screen)'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          title="Pengaturan"
          aria-label="Pengaturan"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 9 Main Menu Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuPanels.map((panel) => {
          const Icon = panel.icon;
          return (
            <div
              key={panel.id}
              onClick={() => onNavigate(panel.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onNavigate(panel.id);
                }
              }}
              className="group rounded-3xl bg-white border-2 border-neutral-200 hover:border-neutral-900 p-8 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center space-y-4 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-200 flex items-center justify-center text-neutral-800 shadow-2xs">
                <Icon className="w-8 h-8 transition-transform group-hover:scale-110" />
              </div>

              <div className="flex items-center gap-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 group-hover:text-neutral-950 tracking-tight">
                  {panel.title}
                </h3>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
