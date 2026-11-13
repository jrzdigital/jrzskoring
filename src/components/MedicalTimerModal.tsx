import React, { useState, useEffect } from 'react';
import { CornerColor } from '../types/silat';
import { formatTime } from '../utils/rules';
import { playWhistleSound } from '../utils/audio';
import { HeartPulse, Play, Pause, CheckCircle2, X } from 'lucide-react';

interface MedicalTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  corner: CornerColor;
  fighterName: string;
  currentUsedSeconds: number;
  onSaveMedicalTime: (corner: CornerColor, additionalSeconds: number) => void;
  audioEnabled: boolean;
}

export const MedicalTimerModal: React.FC<MedicalTimerModalProps> = ({
  isOpen,
  onClose,
  corner,
  fighterName,
  currentUsedSeconds,
  onSaveMedicalTime,
  audioEnabled,
}) => {
  const MAX_MEDICAL_SECONDS = 180; // 3 minutes total allowed
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setSessionSeconds(0);
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && isRunning) {
      timer = setInterval(() => {
        setSessionSeconds((prev) => {
          const totalAfter = currentUsedSeconds + prev + 1;
          if (totalAfter >= MAX_MEDICAL_SECONDS) {
            setIsRunning(false);
            if (audioEnabled) playWhistleSound();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isRunning, currentUsedSeconds, audioEnabled]);

  if (!isOpen) return null;

  const totalUsed = currentUsedSeconds + sessionSeconds;
  const remaining = Math.max(0, MAX_MEDICAL_SECONDS - totalUsed);
  const isRed = corner === 'red';

  const handleFinish = () => {
    onSaveMedicalTime(corner, sessionSeconds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-rose-50 text-rose-600 mb-1">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">
            Waktu Medis / Dokter Pertandingan
          </h2>
          <p className="text-xs text-neutral-500">
            Sesuai peraturan IPSI/PERSILAT: maksimal akumulasi 3 menit (180 detik) dalam satu partai.
          </p>
          <div
            className={`inline-block font-extrabold text-sm px-3 py-1 rounded-full ${
              isRed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isRed ? 'Sudut Merah' : 'Sudut Biru'} : {fighterName}
          </div>
        </div>

        {/* Stopwatch display */}
        <div className="py-6 flex flex-col items-center justify-center bg-neutral-50 rounded-2xl border border-neutral-100 my-4">
          <div className="font-mono text-7xl font-black text-rose-600 tabular-nums">
            {formatTime(sessionSeconds)}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mt-2">
            Sesi Perawatan Ini
          </p>

          {/* Progress bar */}
          <div className="w-full px-8 mt-4">
            <div className="flex justify-between text-[11px] font-bold text-neutral-500 mb-1">
              <span>Total Terpakai: {formatTime(totalUsed)}</span>
              <span>Sisa Kuota: {formatTime(remaining)}</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalUsed > 150 ? 'bg-red-600' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (totalUsed / MAX_MEDICAL_SECONDS) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Jeda Stopwatch</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Lanjutkan Stopwatch</span>
              </>
            )}
          </button>

          <button
            onClick={handleFinish}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Selesai & Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
