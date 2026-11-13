import React from 'react';
import { MatchSettings } from '../types/silat';
import { 
  Trophy, 
  Settings, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  ArrowLeft,
  Printer, 
  Users, 
  UserCheck
} from 'lucide-react';

interface ScoreBoardHeaderProps {
  settings: MatchSettings;
  onOpenSettings: () => void;
  onToggleAudio: () => void;
  onOpenScoreSheet: () => void;
  onToggleArenaView: () => void;
  onOpenWinnerDecision: () => void;
  onToggleScoringMode: () => void;
  onBackToHome?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ScoreBoardHeader: React.FC<ScoreBoardHeaderProps> = ({
  settings,
  onOpenSettings,
  onToggleAudio,
  onOpenScoreSheet,
  onToggleArenaView,
  onOpenWinnerDecision,
  onToggleScoringMode,
  onBackToHome,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Zone 1: Brand Title & Official Logo marker */}
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Kembali ke Halaman Utama"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-sm tracking-wider">
            IPSI
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-neutral-900 leading-none">
              PERSILAT Digital Scoring
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1 font-medium">
              <span>{settings.arena}</span>
              <span aria-hidden="true">·</span>
              <span>{settings.matchNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{settings.category} {settings.gender}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-neutral-700">{settings.weightClass}</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Mode Toggle & Status Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleScoringMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
              settings.scoringMode === 'multijudge'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
            title="Ubah antara Mode Operator Langsung dan Mode Konsensus 3 Juri PERSILAT"
          >
            {settings.scoringMode === 'multijudge' ? (
              <>
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Mode 3 Juri PERSILAT (Aktif)</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-neutral-600" />
                <span>Mode Operator Langsung</span>
              </>
            )}
          </button>
        </div>

        {/* Zone 3: Tournament Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAudio}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
            title={settings.audioEnabled ? 'Matikan Suara Gong/Peluit' : 'Nyalakan Suara Gong/Peluit'}
            aria-label="Toggle Audio"
          >
            {settings.audioEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          <button
            onClick={onOpenScoreSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors whitespace-nowrap"
            title="Cetak Formulir Penilaian Resmi IPSI"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Lembar Nilai</span>
          </button>

          <button
            onClick={onOpenWinnerDecision}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Keputusan Pemenang</span>
          </button>

          {onToggleFullscreen && (
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
          )}

          <button
            onClick={onToggleArenaView}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap"
            title="Mode Tampilan Layar Penuh Arena (Monitor Gelanggang)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Layar Arena</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
            title="Pengaturan Pertandingan & Pesilat"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
