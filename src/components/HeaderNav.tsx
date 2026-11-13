import React from 'react';
import { Volume2, VolumeX, Shield } from 'lucide-react';
import { silatAudio } from '../utils/audio';

interface HeaderNavProps {
  activeTab: 'beranda' | 'kamus' | 'jurus' | 'gelanggang' | 'latihan' | 'kuis' | 'pusaka';
  setActiveTab: (tab: 'beranda' | 'kamus' | 'jurus' | 'gelanggang' | 'latihan' | 'kuis' | 'pusaka') => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled
}) => {
  const handleGongTest = () => {
    if (soundEnabled) {
      silatAudio.playBuzzer();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand title, one line wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('beranda')}
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
            >
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-950/40 border border-amber-500/30">
                <Shield className="w-5 h-5 text-amber-100" />
              </div>
              <span className="font-display text-lg font-bold tracking-wider text-amber-100 whitespace-nowrap group-hover:text-amber-300 transition-colors">
                PUSAKA SILAT
              </span>
            </button>
          </div>

          {/* Zone 2: 4-6 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('kamus')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'kamus'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Kamus Teknik
            </button>

            <button
              onClick={() => setActiveTab('jurus')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'jurus'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Jurus Baku IPSI
            </button>

            <button
              onClick={() => setActiveTab('gelanggang')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'gelanggang'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Papan Skor Gelanggang
            </button>

            <button
              onClick={() => setActiveTab('latihan')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'latihan'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Dojo Latihan
            </button>

            <button
              onClick={() => setActiveTab('pusaka')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'pusaka'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Pusaka & Perguruan
            </button>

            <button
              onClick={() => setActiveTab('kuis')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'kuis'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              Uji Pendekar
            </button>
          </nav>

          {/* Zone 3: 1 primary action & sound trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              title={soundEnabled ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md transition-colors"
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                handleGongTest();
                setActiveTab('gelanggang');
              }}
              className="px-4 py-2 text-xs font-semibold tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-all shadow-sm shadow-amber-500/20 whitespace-nowrap shrink-0 active:scale-95"
            >
              Masuk Gelanggang
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto py-2.5 border-t border-stone-800/80 no-scrollbar text-xs">
          {[
            { id: 'beranda', label: 'Beranda' },
            { id: 'kamus', label: 'Kamus Teknik' },
            { id: 'jurus', label: 'Jurus Baku' },
            { id: 'gelanggang', label: 'Gelanggang' },
            { id: 'latihan', label: 'Dojo Latihan' },
            { id: 'pusaka', label: 'Pusaka' },
            { id: 'kuis', label: 'Uji Teori' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HeaderNavProps['activeTab'])}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-stone-950 font-semibold'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
