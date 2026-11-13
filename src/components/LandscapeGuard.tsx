import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

import { requestSafeFullscreen } from '../utils/fullscreen';

export const LandscapeGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If mobile width < 768 and height > width -> Portrait mobile
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in no-print">
      <div className="relative max-w-sm w-full bg-gradient-to-b from-purple-950/80 to-black border border-purple-500/40 rounded-2xl p-6 shadow-2xl glow-purple">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-lg"
          title="Tutup peringatan"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 bg-purple-900/50 rounded-2xl flex items-center justify-center border border-purple-400/30 text-purple-300">
          <RotateCw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        <h3 className="font-chakra text-xl font-bold tracking-wider text-purple-200 uppercase mb-2">
          Mode Landscape Direkomendasikan
        </h3>

        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          Sistem Digital Scoring IPSI & PERSILAT dioptimalkan untuk perangkat iOS / Android dalam posisi <strong>Mendatar (Landscape)</strong> untuk jangkauan tombol juri dan tampilan monitor maksimal.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={async () => {
              await requestSafeFullscreen();
              setDismissed(true);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold rounded-xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Smartphone className="w-5 h-5 rotate-90" />
            Lanjutkan / Masuk Layar Penuh
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-purple-400 hover:text-purple-300 underline py-1"
          >
            Tetap gunakan mode potret
          </button>
        </div>
      </div>
    </div>
  );
};
