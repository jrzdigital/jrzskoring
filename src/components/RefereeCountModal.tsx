import React, { useState, useEffect } from 'react';
import { CornerColor } from '../types/silat';
import { playWhistleSound } from '../utils/audio';
import { TimerReset, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface RefereeCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  corner: CornerColor;
  fighterName: string;
  onFighterCannotContinue: (corner: CornerColor, count: number) => void;
  onFighterReady: (corner: CornerColor) => void;
  audioEnabled: boolean;
}

export const RefereeCountModal: React.FC<RefereeCountModalProps> = ({
  isOpen,
  onClose,
  corner,
  fighterName,
  onFighterCannotContinue,
  onFighterReady,
  audioEnabled,
}) => {
  const [count, setCount] = useState<number>(1);
  const [isCounting, setIsCounting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCount(1);
      setIsCounting(true);
    } else {
      setIsCounting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && isCounting) {
      timer = setInterval(() => {
        setCount((prev) => {
          if (prev >= 10) {
            setIsCounting(false);
            if (audioEnabled) playWhistleSound();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isCounting, audioEnabled]);

  if (!isOpen) return null;

  const isRed = corner === 'red';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 mb-1">
            <TimerReset className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">
            Hitungan Wasit (Referee 10-Count)
          </h2>
          <p className="text-xs text-neutral-500">
            Diberikan kepada pesilat yang terjatuh atau tidak siap bertanding akibat serangan sah.
          </p>
          <div
            className={`inline-block font-extrabold text-sm px-3 py-1 rounded-full ${
              isRed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isRed ? 'Sudut Merah' : 'Sudut Biru'} : {fighterName}
          </div>
        </div>

        {/* Jumbo Digital Count */}
        <div className="py-6 flex flex-col items-center justify-center bg-neutral-50 rounded-2xl border border-neutral-100 my-4">
          <span className="font-mono text-8xl font-black text-neutral-900 tabular-nums animate-pulse">
            {count}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mt-2">
            {count >= 8 && count < 10
              ? 'Mencapai Batas Hitungan 8'
              : count === 10
              ? 'Hitungan 10 (WMP / TKO)'
              : 'Menghitung...'}
          </span>
        </div>

        {/* Count Numbers Quick Selector */}
        <div className="grid grid-cols-5 gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => {
                setCount(num);
                if (num === 10) setIsCounting(false);
              }}
              className={`py-2 rounded-lg font-mono font-bold text-sm transition-all ${
                count === num
                  ? 'bg-neutral-900 text-white scale-105 shadow-sm'
                  : count > num
                  ? 'bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Referee Decision Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onFighterReady(corner);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Pesilat Siap Melanjutkan Pertandingan</span>
          </button>

          <button
            onClick={() => {
              onFighterCannotContinue(corner, count);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Pesilat Tak Mampu / Hitungan 10 (Menang W.M.P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
