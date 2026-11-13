import React, { useState, useEffect, useRef } from 'react';
import { JURUS_TUNGGAL_LIST, GerakanJurus } from '../data/silatData';
import { Play, Pause, SkipBack, SkipForward, Volume2, Compass, Clock, Award, Shield } from 'lucide-react';
import { silatAudio } from '../utils/audio';

export const JurusPlayer: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const [kategoriPilihan, setKategoriPilihan] = useState<'Semua' | 'Tangan Kosong' | 'Golok' | 'Toya'>('Tangan Kosong');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(8);

  const filteredJurus = kategoriPilihan === 'Semua'
    ? JURUS_TUNGGAL_LIST
    : JURUS_TUNGGAL_LIST.filter(j => j.kategori === kategoriPilihan);

  const currentGerakan: GerakanJurus = filteredJurus[currentIndex] || filteredJurus[0];

  const timerRef = useRef<number | null>(null);

  // Set initial countdown when gerakan changes
  useEffect(() => {
    if (currentGerakan) {
      setCountdown(Math.round(currentGerakan.durasiDetik / playbackSpeed));
    }
  }, [currentIndex, kategoriPilihan, playbackSpeed, currentGerakan]);

  // Autoplay countdown handler
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Advance to next movement
            if (soundEnabled) {
              silatAudio.playWoodClap(880);
            }
            if (currentIndex < filteredJurus.length - 1) {
              setCurrentIndex(curr => curr + 1);
            } else {
              setIsPlaying(false);
              if (soundEnabled) {
                silatAudio.playGong();
              }
              return 0;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex, filteredJurus.length, soundEnabled]);

  const handleNext = () => {
    if (currentIndex < filteredJurus.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (soundEnabled) silatAudio.playWoodClap(600);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (soundEnabled) silatAudio.playWoodClap(450);
    }
  };

  const togglePlay = () => {
    if (!isPlaying) {
      if (soundEnabled) silatAudio.playGong();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {(['Tangan Kosong', 'Golok', 'Toya', 'Semua'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => {
                setKategoriPilihan(cat);
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                kategoriPilihan === cat
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'bg-stone-950 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400">Kecepatan:</span>
          {[0.75, 1.0, 1.25].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 rounded text-xs ${
                playbackSpeed === speed
                  ? 'bg-stone-800 text-amber-400 font-bold border border-amber-500/40'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Silhouette Visualizer & Timeline Player */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-700/50">
                  GERAKAN {currentGerakan.nomor}
                </span>
                <span className="text-xs text-stone-400">
                  {currentGerakan.kategori}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-400 font-mono-numbers">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Hitungan: <strong className="text-amber-400 text-sm">{countdown}s</strong></span>
              </div>
            </div>

            {/* Visual Martial Arts Canvas */}
            <div className="my-6 bg-stone-950 rounded-xl border border-stone-800 p-6 flex flex-col items-center justify-center relative min-h-[220px]">
              {/* Dynamic Silat Silhouette */}
              <svg viewBox="0 0 200 200" className="w-48 h-48">
                {/* Martial Arts Energy Halo */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="#eab308" strokeWidth="0.5" opacity="0.2" />

                {/* Head with traditional Blangkon/Udeng headband */}
                <circle cx="100" cy="45" r="14" fill="#fbbf24" />
                <path d="M 88 43 Q 100 35 112 43" stroke="#78350f" strokeWidth="3" fill="none" />
                <polygon points="112,41 122,37 114,46" fill="#b45309" />

                {/* Body / Pangsi Uniform */}
                <path d="M 82 62 L 118 62 L 110 110 L 90 110 Z" fill="#292524" stroke="#d97706" strokeWidth="1.5" />
                {/* Golden Songket Belt */}
                <rect x="88" y="94" width="24" height="7" fill="#f59e0b" rx="2" />

                {/* Arms dynamic pose depending on move category */}
                {currentGerakan.kategori === 'Tangan Kosong' ? (
                  <>
                    {/* Guard & Strike Hands */}
                    <path d="M 84 65 L 60 85 L 45 75" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <circle cx="45" cy="75" r="5" fill="#f59e0b" />
                    <path d="M 116 65 L 145 75 L 175 75" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <circle cx="175" cy="75" r="5" fill="#f59e0b" />
                  </>
                ) : currentGerakan.kategori === 'Golok' ? (
                  <>
                    {/* Golok Machete Blade in Hand */}
                    <path d="M 84 65 L 65 90 L 55 105" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <path d="M 116 65 L 140 80 L 160 65" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    {/* Golok blade */}
                    <path d="M 160 65 Q 185 45 195 20 Q 185 30 165 58 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                  </>
                ) : (
                  <>
                    {/* Toya Long Staff */}
                    <path d="M 84 65 L 70 85 L 60 100" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <path d="M 116 65 L 135 85 L 145 70" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
                    {/* Toya staff passing across */}
                    <line x1="20" y1="170" x2="180" y2="20" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                  </>
                )}

                {/* Legs based on Kuda-kuda */}
                <path d="M 92 110 L 70 145 L 50 175" stroke="#1c1917" strokeWidth="8" strokeLinecap="round" fill="none" />
                <path d="M 108 110 L 130 145 L 155 175" stroke="#1c1917" strokeWidth="8" strokeLinecap="round" fill="none" />
                {/* Feet */}
                <rect x="42" y="172" width="16" height="6" rx="3" fill="#fbbf24" />
                <rect x="150" y="172" width="16" height="6" rx="3" fill="#fbbf24" />
              </svg>

              <div className="text-center mt-2">
                <h4 className="text-lg font-bold font-display text-stone-100">
                  {currentGerakan.nama}
                </h4>
                <div className="text-xs text-amber-400 mt-1 flex items-center justify-center gap-2">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Arah: {currentGerakan.arah}</span>
                  <span aria-hidden="true">·</span>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{currentGerakan.kudaKuda}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Playback Bar */}
          <div className="pt-4 border-t border-stone-800">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 rounded-lg transition-colors"
                title="Gerakan Sebelumnya"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Jeda Latihan</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Mulai Gerak Otomatis</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredJurus.length - 1}
                className="p-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 rounded-lg transition-colors"
                title="Gerakan Berikutnya"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className="text-[11px] text-stone-400 font-mono-numbers">
                {currentIndex + 1} / {filteredJurus.length}
              </div>
              <div className="flex-1 bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredJurus.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Movement Breakdown & Focus Points */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                Panduan Eksekusi Resmi IPSI
              </span>
              <button
                onClick={() => {
                  if (soundEnabled) silatAudio.speak(`${currentGerakan.nama}. ${currentGerakan.deskripsi}`);
                }}
                className="p-1 text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-xs"
                title="Dengarkan Uraian"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Dengar</span>
              </button>
            </div>

            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
              <div className="text-xs text-amber-400 font-semibold mb-1.5">
                Uraian Gerakan
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {currentGerakan.deskripsi}
              </p>
            </div>

            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
              <div className="text-xs text-emerald-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Kriteria Penilaian & Fokus Poin</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {currentGerakan.fokusPoin}
              </p>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Pondasi Kuda-Kuda:</span>
              <span className="text-stone-200 font-semibold">{currentGerakan.kudaKuda}</span>
            </div>
          </div>

          {/* List of all movements in category */}
          <div className="mt-4 pt-4 border-t border-stone-800">
            <div className="text-xs font-semibold text-stone-400 mb-2">
              Daftar Urutan Rangkaian
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {filteredJurus.map((j, idx) => (
                <button
                  key={j.nomor}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(false);
                    if (soundEnabled) silatAudio.playWoodClap(700);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    currentIndex === idx
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/30 font-semibold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-950'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-mono-numbers mr-2">{j.nomor}.</span>
                    <span>{j.nama}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 shrink-0 font-mono-numbers">
                    {j.durasiDetik}s
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
