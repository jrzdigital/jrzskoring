import React, { useState } from 'react';
import { CornerColor, TechniqueType } from '../types/silat';
import { TECHNIQUE_CONFIG } from '../utils/rules';
import { playScoreChime } from '../utils/audio';
import {
  Users,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Swords,
  CheckCircle,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';

interface JuriPanelProps {
  onBackToHome: () => void;
  redName: string;
  blueName: string;
  audioEnabled: boolean;
  onSendJudgePoint: (corner: CornerColor, technique: TechniqueType, judgeId: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const JuriPanel: React.FC<JuriPanelProps> = ({
  onBackToHome,
  redName,
  blueName,
  audioEnabled,
  onSendJudgePoint,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [activeJudgeId, setActiveJudgeId] = useState<number>(1);
  const [recentInputs, setRecentInputs] = useState<
    { id: string; time: string; corner: CornerColor; technique: TechniqueType; points: number }[]
  >([]);

  const handlePressPoint = (corner: CornerColor, technique: TechniqueType) => {
    const config = TECHNIQUE_CONFIG[technique];
    if (audioEnabled) {
      playScoreChime(config.points);
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);

    const inputItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: timeStr,
      corner,
      technique,
      points: config.points,
    };

    setRecentInputs((prev) => [inputItem, ...prev.slice(0, 7)]);
    onSendJudgePoint(corner, technique, activeJudgeId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Judge Selector */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Kembali ke Halaman Utama"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">
                Layar Sentuh Juri (Jury Digital Pad)
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                PERSILAT 2026
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Konsol penilaian sentuh individual. Konsensus 2 dari 3 juri dalam 1,5 detik otomatis disahkan ke papan skor.
            </p>
          </div>
        </div>

        {/* Right side: Judge 1 / 2 / 3 Selector & Fullscreen Icon */}
        <div className="flex items-center gap-2">
          {/* Judge Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setActiveJudgeId(num)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeJudgeId === num
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                JURI {num}
              </button>
            ))}
          </div>

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
        </div>
      </div>

      {/* Main Touch Scoring Board: Red vs Blue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RED CORNER JURY PAD */}
        <div className="rounded-3xl border-4 border-red-500 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-red-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600" />
              <span className="text-xs font-black uppercase text-red-700 tracking-wider">
                SUDUT MERAH
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
              Input Juri {activeJudgeId}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-neutral-900 truncate">{redName}</h2>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">DKI JAKARTA</p>
          </div>

          {/* Big Touch Buttons */}
          <div className="grid grid-cols-3 gap-3 my-2">
            {/* Pukulan +1 */}
            <button
              onClick={() => handlePressPoint('red', 'pukulan')}
              className="py-8 px-2 rounded-2xl border-2 border-red-200 bg-white hover:border-red-600 hover:bg-red-50 active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-xs"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-red-600 leading-none">
                +1
              </span>
              <span className="text-xs font-extrabold uppercase text-neutral-800 mt-2">
                Pukulan
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Tangan Sah</span>
            </button>

            {/* Tendangan +2 */}
            <button
              onClick={() => handlePressPoint('red', 'tendangan')}
              className="py-8 px-2 rounded-2xl border-2 border-red-300 bg-red-50/50 hover:border-red-600 hover:bg-red-100 active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-xs"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-red-600 leading-none">
                +2
              </span>
              <span className="text-xs font-extrabold uppercase text-neutral-800 mt-2">
                Tendangan
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Kaki Sah</span>
            </button>

            {/* Jatuhan +3 */}
            <button
              onClick={() => handlePressPoint('red', 'jatuhan')}
              className="py-8 px-2 rounded-2xl border-2 border-red-600 bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-sm"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-white leading-none">
                +3
              </span>
              <span className="text-xs font-extrabold uppercase text-white mt-2">
                Jatuhan
              </span>
              <span className="text-[10px] text-red-100 mt-0.5">Bantingan Sah</span>
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Tangkis + Balas Pukulan</span>
            <button
              onClick={() => handlePressPoint('red', 'tangkis_pukulan')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold"
            >
              +1 Elak/Tangkis
            </button>
          </div>
        </div>

        {/* BLUE CORNER JURY PAD */}
        <div className="rounded-3xl border-4 border-blue-500 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-blue-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600" />
              <span className="text-xs font-black uppercase text-blue-700 tracking-wider">
                SUDUT BIRU
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Input Juri {activeJudgeId}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-neutral-900 truncate">{blueName}</h2>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">JAWA BARAT</p>
          </div>

          {/* Big Touch Buttons */}
          <div className="grid grid-cols-3 gap-3 my-2">
            {/* Pukulan +1 */}
            <button
              onClick={() => handlePressPoint('blue', 'pukulan')}
              className="py-8 px-2 rounded-2xl border-2 border-blue-200 bg-white hover:border-blue-600 hover:bg-blue-50 active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-xs"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-blue-600 leading-none">
                +1
              </span>
              <span className="text-xs font-extrabold uppercase text-neutral-800 mt-2">
                Pukulan
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Tangan Sah</span>
            </button>

            {/* Tendangan +2 */}
            <button
              onClick={() => handlePressPoint('blue', 'tendangan')}
              className="py-8 px-2 rounded-2xl border-2 border-blue-300 bg-blue-50/50 hover:border-blue-600 hover:bg-blue-100 active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-xs"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-blue-600 leading-none">
                +2
              </span>
              <span className="text-xs font-extrabold uppercase text-neutral-800 mt-2">
                Tendangan
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5">Kaki Sah</span>
            </button>

            {/* Jatuhan +3 */}
            <button
              onClick={() => handlePressPoint('blue', 'jatuhan')}
              className="py-8 px-2 rounded-2xl border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-all text-center flex flex-col items-center justify-center shadow-sm"
            >
              <span className="font-mono text-4xl sm:text-5xl font-black text-white leading-none">
                +3
              </span>
              <span className="text-xs font-extrabold uppercase text-white mt-2">
                Jatuhan
              </span>
              <span className="text-[10px] text-blue-100 mt-0.5">Bantingan Sah</span>
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Tangkis + Balas Pukulan</span>
            <button
              onClick={() => handlePressPoint('blue', 'tangkis_pukulan')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold"
            >
              +1 Elak/Tangkis
            </button>
          </div>
        </div>
      </div>

      {/* Jury Recent Inputs History */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Riwayat Sentuhan Terakhir Juri {activeJudgeId}</span>
          </h3>
          <span className="text-[11px] text-neutral-400">Toleransi konsensus: 1,5 detik</span>
        </div>

        {recentInputs.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            Belum ada sentuhan tombol pada sesi ini. Tekan tombol +1, +2, atau +3 di atas.
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {recentInputs.map((item, idx) => {
              const isRed = item.corner === 'red';
              return (
                <div
                  key={item.id ? `${item.id}-${idx}` : `input-${idx}`}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-2 ${
                    isRed
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{item.time}</span>
                  <span>{isRed ? 'Merah' : 'Biru'}</span>
                  <span className="font-black text-sm">+{item.points}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
