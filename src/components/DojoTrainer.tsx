import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Dumbbell, Award, History } from 'lucide-react';
import { silatAudio } from '../utils/audio';

interface TrainingRecord {
  id: string;
  tanggal: string;
  kudaKuda: string;
  durasiDetik: number;
  sukses: boolean;
}

export const DojoTrainer: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const [activeMode, setActiveMode] = useState<'endurance' | 'metronome'>('endurance');

  // Endurance Trainer states
  const [targetStance, setTargetStance] = useState<string>('Kuda-Kuda Tengah (Paling Menantang)');
  const [targetDuration, setTargetDuration] = useState<number>(60); // seconds
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [isStanceRunning, setIsStanceRunning] = useState<boolean>(false);
  const [stanceFinished, setStanceFinished] = useState<boolean>(false);
  const [records, setRecords] = useState<TrainingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pusaka_silat_training_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const stanceTimerRef = useRef<number | null>(null);

  // Metronome states
  const [bpm, setBpm] = useState<number>(60);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState<boolean>(false);
  const [beatCount, setBeatCount] = useState<number>(1);
  const metronomeIntervalRef = useRef<number | null>(null);

  // Stance Timer logic
  useEffect(() => {
    if (isStanceRunning) {
      stanceTimerRef.current = window.setInterval(() => {
        setCurrentSeconds(prev => {
          if (prev + 1 >= targetDuration) {
            setIsStanceRunning(false);
            setStanceFinished(true);
            if (soundEnabled) {
              silatAudio.playGong();
            }
            saveRecord(targetStance, targetDuration, true);
            return targetDuration;
          }
          // Interval feedback clap every 15 seconds
          if ((prev + 1) % 15 === 0 && soundEnabled) {
            silatAudio.playWoodClap(800);
          }
          return prev + 1;
        });
      }, 1000);
    } else if (stanceTimerRef.current) {
      clearInterval(stanceTimerRef.current);
    }

    return () => {
      if (stanceTimerRef.current) clearInterval(stanceTimerRef.current);
    };
  }, [isStanceRunning, targetDuration, targetStance, soundEnabled]);

  const saveRecord = (kuda: string, durasi: number, sukses: boolean) => {
    const newRec: TrainingRecord = {
      id: Date.now().toString(),
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      kudaKuda: kuda,
      durasiDetik: durasi,
      sukses
    };
    const updated = [newRec, ...records.slice(0, 19)];
    setRecords(updated);
    try {
      localStorage.setItem('pusaka_silat_training_records', JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
  };

  const startStanceTraining = () => {
    setStanceFinished(false);
    setCurrentSeconds(0);
    setIsStanceRunning(true);
    if (soundEnabled) silatAudio.playGong();
  };

  const pauseStanceTraining = () => {
    setIsStanceRunning(false);
    if (soundEnabled) silatAudio.playWhistle();
  };

  const resetStanceTraining = () => {
    setIsStanceRunning(false);
    setCurrentSeconds(0);
    setStanceFinished(false);
  };

  // Metronome logic
  useEffect(() => {
    if (isMetronomeRunning) {
      const intervalMs = (60 / bpm) * 1000;
      metronomeIntervalRef.current = window.setInterval(() => {
        setBeatCount(prev => {
          const next = (prev % 4) + 1;
          if (soundEnabled) {
            if (next === 1) silatAudio.playWoodClap(880);
            else silatAudio.playWoodClap(520);
          }
          return next;
        });
      }, intervalMs);
    } else if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomeRunning, bpm, soundEnabled]);

  const progressPercent = Math.min(100, (currentSeconds / targetDuration) * 100);

  // Motivational cues during stance
  const getMotivationalCue = () => {
    if (stanceFinished) return 'Luar biasa! Ketahanan fisik dan batin Anda teruji tangguh!';
    if (progressPercent < 25) return 'Tarik nafas dalam melalui hidung, hembuskan perlahan ke perut...';
    if (progressPercent < 50) return 'Jaga punggung tegak lurus, jangan membungkuk!';
    if (progressPercent < 75) return 'Kuatkan paha! Api kesabaran membakar keraguan!';
    return 'Sedikit lagi! Kunci pikiran pada titik hening!';
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setActiveMode('endurance')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeMode === 'endurance'
              ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Uji Ketahanan Kuda-Kuda (Endurance Challenge)
        </button>

        <button
          onClick={() => setActiveMode('metronome')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeMode === 'metronome'
              ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
          }`}
        >
          Metronom Aba-Aba Irama Silat
        </button>
      </div>

      {/* 1. ENDURANCE CHALLENGE */}
      {activeMode === 'endurance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Challenge Stage */}
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-stone-100 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Latihan Ketahanan Kuda-Kuda Pesilat</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Membangun kekuatan paha, kestabilan lutut, dan ketenangan batin.
                </p>
              </div>

              {/* Target Duration Selector */}
              <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800">
                {[30, 60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    disabled={isStanceRunning}
                    onClick={() => {
                      setTargetDuration(sec);
                      setCurrentSeconds(0);
                      setStanceFinished(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${
                      targetDuration === sec
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Stance Choice */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Pilih Sikap Kuda-Kuda yang Dilatih:
              </label>
              <select
                disabled={isStanceRunning}
                value={targetStance}
                onChange={e => setTargetStance(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-md p-2.5 focus:border-amber-500 focus:outline-none"
              >
                <option>Kuda-Kuda Tengah (Paling Menantang)</option>
                <option>Kuda-Kuda Depan (Kekuatan Kaki Depan)</option>
                <option>Kuda-Kuda Belakang (Pegas Lutut Belakang)</option>
                <option>Kuda-Kuda Samping (Fleksibilitas Panggul)</option>
              </select>
            </div>

            {/* Circular Progress Gauge */}
            <div className="bg-stone-950 rounded-xl border border-stone-800 p-8 flex flex-col items-center justify-center relative">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#292524"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={stanceFinished ? '#10b981' : '#f59e0b'}
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-300"
                  />
                </svg>

                {/* Inner Text */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black font-mono-numbers text-stone-100">
                    {targetDuration - currentSeconds}
                  </span>
                  <span className="text-[11px] text-stone-400 uppercase mt-0.5 font-medium">
                    {stanceFinished ? 'Selesai!' : 'Detik Tersisa'}
                  </span>
                </div>
              </div>

              {/* Motivational Cue Box */}
              <div className="mt-6 text-center max-w-md">
                <div className="text-xs text-amber-400 font-medium">
                  {getMotivationalCue()}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              {!isStanceRunning ? (
                <button
                  onClick={startStanceTraining}
                  className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{currentSeconds > 0 ? 'Lanjutkan' : 'Mulai Tahan Kuda-Kuda'}</span>
                </button>
              ) : (
                <button
                  onClick={pauseStanceTraining}
                  className="px-8 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Istirahat Sekejap</span>
                </button>
              )}

              <button
                onClick={resetStanceTraining}
                className="p-3 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-800 transition-colors"
                title="Reset Latihan"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: History & Achievements */}
          <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
                <History className="w-4 h-4 text-amber-400" />
                <span>Catatan Riwayat Dojo</span>
              </div>
              <span className="text-xs text-stone-500 font-mono-numbers">
                {records.length} sesi
              </span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                Belum ada rekaman sesi latihan. Lakukan tantangan kuda-kuda pertama Anda!
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {records.map(rec => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded bg-stone-950 border border-stone-800/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-stone-200">{rec.kudaKuda}</div>
                      <div className="text-[10px] text-stone-400">{rec.tanggal}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400 font-mono-numbers">
                        {rec.durasiDetik}s
                      </span>
                      <div className="text-[10px] text-emerald-400 font-medium">Tuntas</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. METRONOME ABA-ABA IRAMA SILAT */}
      {activeMode === 'metronome' && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 max-w-2xl mx-auto space-y-6">
          <div className="text-center border-b border-stone-800 pb-4">
            <h3 className="text-xl font-bold font-display text-stone-100 flex items-center justify-center gap-2">
              <Dumbbell className="w-5 h-5 text-amber-400" />
              <span>Metronom Irama Latihan Silat</span>
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Melatih ketepatan tempo pukulan, tendangan kombinasi, dan transisi langkah.
            </p>
          </div>

          {/* 4 Beat Visualizer */}
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(b => (
              <div
                key={b}
                className={`py-6 rounded-xl border text-center transition-all ${
                  isMetronomeRunning && beatCount === b
                    ? 'bg-amber-400 border-amber-300 text-stone-950 scale-105 shadow-lg shadow-amber-500/30'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                <div className="text-3xl font-black font-mono-numbers">{b}</div>
                <div className="text-[10px] uppercase font-semibold mt-1">
                  {b === 1 ? 'Masuk' : b === 2 ? 'Tangkis' : b === 3 ? 'Balas' : 'Pasang'}
                </div>
              </div>
            ))}
          </div>

          {/* BPM Slider */}
          <div className="bg-stone-950 p-5 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">Tempo Kecepatan (BPM)</span>
              <span className="text-xl font-bold font-mono-numbers text-amber-400">{bpm} BPM</span>
            </div>

            <input
              type="range"
              min={40}
              max={120}
              step={5}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-stone-500">
              <span>40 BPM (Lambat / Penjiwaan Seni)</span>
              <span>80 BPM (Sedang)</span>
              <span>120 BPM (Cepat / Tanding Agresif)</span>
            </div>
          </div>

          {/* Metronome Controls */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (!isMetronomeRunning && soundEnabled) silatAudio.playGong();
                setIsMetronomeRunning(prev => !prev);
              }}
              className={`px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                isMetronomeRunning
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
              }`}
            >
              {isMetronomeRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Hentikan Irama</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Mulai Hitungan Irama</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
