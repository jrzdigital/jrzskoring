import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Volume2, 
  Bell, 
  SlidersHorizontal, 
  Clock, 
  Zap, 
  Tv, 
  Shield, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { Partai } from '../types/silat';
import { formatWaktu, hitungPenaltiWaktuOtomatis } from '../services/ipsiRules';
import { soundFx } from '../services/soundEffects';
import { notificationService, AppNotification } from '../services/notificationService';

interface OperatorViewProps {
  partai: Partai | null;
  partaiList: Partai[];
  onSelectPartai: (id: string) => void;
  onUpdateTimer: (detik: number, isRunning: boolean) => void;
  onUpdateStatusPartai: (status: Partai['status']) => void;
  onSimulateAllJuri: () => void;
}

export const OperatorView: React.FC<OperatorViewProps> = ({
  partai,
  partaiList,
  onSelectPartai,
  onUpdateTimer,
  onUpdateStatusPartai,
  onSimulateAllJuri,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number>(partai?.durasiBerjalanDetik ?? 0);
  const [autoSoundTriggered30s, setAutoSoundTriggered30s] = useState(false);
  const [autoSoundTriggeredFinish, setAutoSoundTriggeredFinish] = useState(false);

  // Sync internal timer if active partai changes
  useEffect(() => {
    if (partai) {
      setElapsed(partai.durasiBerjalanDetik ?? 0);
      if (partai.status === 'TAMPIL') {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  }, [partai?.id]);

  // Main high-precision interval clock
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && partai) {
      const startTime = Date.now() - elapsed * 1000;

      interval = setInterval(() => {
        const currentSeconds = Number(((Date.now() - startTime) / 1000).toFixed(1));
        setElapsed(currentSeconds);
        onUpdateTimer(currentSeconds, true);

        // Auto audio: 30 detik sebelum selesai (pada 150 detik jika target 180s)
        const target = partai.durasiStandarDetik || 180;
        if (currentSeconds >= (target - 30) && currentSeconds < (target - 28) && !autoSoundTriggered30s) {
          soundFx.playWarningBeeps();
          setAutoSoundTriggered30s(true);
        }

        // Auto audio: Tepat pada 180 detik (Buzzer Penutup Otomatis)
        if (currentSeconds >= target && currentSeconds < (target + 1.5) && !autoSoundTriggeredFinish) {
          soundFx.playBuzzer();
          setAutoSoundTriggeredFinish(true);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, partai?.durasiStandarDetik, autoSoundTriggered30s, autoSoundTriggeredFinish]);

  if (!partai) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border-2 border-zinc-900 rounded-2xl text-center">
        <SlidersHorizontal className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
        <h3 className="text-xl font-bold text-zinc-900">Pilih Partai Pertandingan</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Gunakan daftar jadwal di bawah untuk memilih partai yang akan dikontrol oleh Operator.
        </p>
      </div>
    );
  }

  const targetDetik = partai.durasiStandarDetik || 180;
  const progressPercent = Math.min(100, (elapsed / targetDetik) * 100);
  const penaltiSaran = hitungPenaltiWaktuOtomatis(elapsed, targetDetik);
  const isOvertime = elapsed > targetDetik;
  const sisaDetik = Math.max(0, targetDetik - elapsed);

  const handleStart = () => {
    setIsRunning(true);
    setAutoSoundTriggered30s(false);
    setAutoSoundTriggeredFinish(false);
    onUpdateStatusPartai('TAMPIL');
    soundFx.playBuzzer();
    notificationService.addNotification(
      'start',
      'Ronde / Partai Dimulai',
      `Partai #${partai.nomorPartai} (${partai.pesilat.nama} - ${partai.pesilat.kontingen}) telah dimulai. Timer berjalan.`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  const handlePause = () => {
    // Jeda / Pause: TANPA SUARA (SILENT)
    setIsRunning(false);
    onUpdateTimer(elapsed, false);
    notificationService.addNotification(
      'pause',
      'Pertandingan Dijeda (Pause)',
      `Operator menjeda pertandingan partai #${partai.nomorPartai} pada waktu ${formatWaktu(elapsed)}.`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  const handleResume = () => {
    // Lanjutkan / Resume: TANPA SUARA (SILENT)
    setIsRunning(true);
    onUpdateStatusPartai('TAMPIL');
    notificationService.addNotification(
      'start',
      'Pertandingan Dilanjutkan',
      `Timer partai #${partai.nomorPartai} dilanjutkan kembali dari waktu ${formatWaktu(elapsed)}.`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  const handleFinish = () => {
    setIsRunning(false);
    onUpdateTimer(elapsed, false);
    onUpdateStatusPartai('SELESAI');
    soundFx.playBuzzer();
    notificationService.addNotification(
      'finish',
      'Pertandingan Selesai',
      `Penampilan partai #${partai.nomorPartai} (${partai.pesilat.nama}) telah selesai dengan durasi ${formatWaktu(elapsed)}. Menunggu penilaian & pengesahan Dewan.`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setAutoSoundTriggered30s(false);
    setAutoSoundTriggeredFinish(false);
    onUpdateTimer(0, false);
    onUpdateStatusPartai('SIAP');
    notificationService.addNotification(
      'info',
      'Timer Direset',
      `Waktu partai #${partai.nomorPartai} telah direset kembali ke 00:00.0.`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Bar Operator */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center border-2 border-zinc-950 font-black">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded">
                KONSOL OPERATOR & SOUND MASTER
              </span>
              <span className="text-xs font-bold text-zinc-500">
                PENGATURAN WAKTU OTOMATIS PERSILAT 2026
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
              Kontrol Timer, Partai & Sinkronisasi Suara
            </h2>
          </div>
        </div>

        {/* Quick Simulator Tool */}
        <button
          onClick={onSimulateAllJuri}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-zinc-950 cursor-pointer shadow-sm transition-all flex items-center gap-2"
          title="Isi nilai 10 juri acak untuk pengujian instan"
        >
          <Zap className="w-4 h-4 fill-zinc-950" />
          <span>Simulasi 10 Juri (Test)</span>
        </button>
      </div>

      {/* Main Grid: Digital Clock Console & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Giant Timer Console (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white border-4 border-zinc-950 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
            
            {/* Active Pesilat Info Strip */}
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-4">
              <div>
                <span className={`px-2.5 py-0.5 text-xs font-black rounded text-white ${
                  partai.sudut === 'MERAH' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  SUDUT {partai.sudut} • PARTAI #{partai.nomorPartai}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 mt-1">
                  {partai.pesilat.nama}
                </h3>
                <p className="text-xs font-bold text-zinc-600">
                  {partai.pesilat.kontingen} • {partai.kategori} ({partai.gender})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-zinc-500">Status Partai</span>
                <div className={`text-xs font-black px-2.5 py-1 rounded-md mt-0.5 ${
                  partai.status === 'TAMPIL' 
                    ? 'bg-emerald-500 text-white animate-pulse' 
                    : partai.status === 'SELESAI'
                    ? 'bg-blue-600 text-white'
                    : partai.status === 'DISAHKAN'
                    ? 'bg-zinc-950 text-amber-400'
                    : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {partai.status}
                </div>
              </div>
            </div>

            {/* Giant Digital Clock Display */}
            <div className={`p-6 sm:p-8 rounded-2xl border-4 text-center transition-colors ${
              isOvertime 
                ? 'bg-red-50 border-red-600' 
                : isRunning 
                ? 'bg-zinc-950 border-zinc-950 text-white' 
                : 'bg-zinc-100 border-zinc-900 text-zinc-950'
            }`}>
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-2 opacity-80">
                <span>DURASI STANDAR: 03:00.0</span>
                <span>{isRunning ? 'SEDANG BERJALAN...' : 'TIMER BERHENTI'}</span>
              </div>

              {/* Digital Time Font */}
              <div className={`text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight select-none ${
                isOvertime ? 'text-red-600 animate-pulse' : isRunning ? 'text-amber-400' : 'text-zinc-950'
              }`}>
                {formatWaktu(elapsed)}
              </div>

              {/* Progress bar towards 3 minutes */}
              <div className="w-full bg-zinc-300 h-3 rounded-full overflow-hidden mt-4 border border-zinc-400">
                <div 
                  className={`h-full transition-all duration-100 ${
                    isOvertime ? 'bg-red-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Deviation info */}
              <div className="flex justify-between items-center text-xs font-mono font-bold mt-3">
                <span className={isRunning ? 'text-zinc-300' : 'text-zinc-600'}>
                  Sisa Waktu Normal: {formatWaktu(sisaDetik)}
                </span>
                <span className={penaltiSaran > 0 ? 'text-red-500 font-black' : isRunning ? 'text-zinc-300' : 'text-zinc-600'}>
                  Deviasi: {Math.abs(Math.round(elapsed - targetDetik))}s (Penalti: -{penaltiSaran.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Tactile Timer Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {!isRunning ? (
                <button
                  onClick={elapsed === 0 ? handleStart : handleResume}
                  className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-xl border-3 border-zinc-950 cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{elapsed === 0 ? 'Mulai (Buzzer)' : 'Lanjutkan'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="py-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-xl border-3 border-zinc-950 cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Pause className="w-5 h-5 fill-zinc-950" />
                  <span>Jeda (Pause)</span>
                </button>
              )}

              <button
                onClick={handleFinish}
                disabled={elapsed === 0}
                className="py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-black text-sm uppercase tracking-wider rounded-xl border-3 border-zinc-950 cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Flag className="w-5 h-5" />
                <span>Selesai (Buzzer)</span>
              </button>

              <button
                onClick={handleReset}
                className="py-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-black text-sm uppercase tracking-wider rounded-xl border-3 border-zinc-950 cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset (00:00)</span>
              </button>

              <button
                onClick={() => soundFx.playBuzzer()}
                className="py-4 bg-zinc-950 hover:bg-zinc-800 text-amber-400 font-black text-sm uppercase tracking-wider rounded-xl border-3 border-zinc-950 cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Volume2 className="w-5 h-5" />
                <span>Bunyi Buzzer</span>
              </button>
            </div>

          </div>

          {/* Sound Synthesizer Audio Trigger Board */}
          <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-zinc-950">
                  Konsol Bunyi Sinyal Gelanggang (Web Audio API)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-500">
                0ms Latency
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => soundFx.playBuzzer()}
                className="p-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-600 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-black text-amber-900 text-sm flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  <span>Buzzer Arena</span>
                </div>
                <div className="text-[11px] text-amber-700 mt-1">
                  Mulai & Akhir Penampilan
                </div>
              </button>

              <button
                onClick={() => soundFx.playWarningBeeps()}
                className="p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-600 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-black text-blue-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Peringatan 30 Detik</span>
                </div>
                <div className="text-[11px] text-blue-700 mt-1">
                  2x Nada Bell Pendek
                </div>
              </button>

              <button
                onClick={() => soundFx.playBuzzer()}
                className="p-4 bg-red-50 hover:bg-red-100 border-2 border-red-600 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-black text-red-900 text-sm flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  <span>Buzzer Wasit/Dewan</span>
                </div>
                <div className="text-[11px] text-red-700 mt-1">
                  Pemberhentian Darurat
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Pemilih Partai Pertandingan & Status Gelanggang (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Status Alur Pertandingan */}
          <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-zinc-950 border-b-2 border-zinc-200 pb-3">
              Ubah Status Pertandingan Secara Manual
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {(['MENUNGGU', 'SIAP', 'TAMPIL', 'SELESAI', 'DISAHKAN'] as Partai['status'][]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatusPartai(st)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border-2 cursor-pointer transition-all ${
                    partai.status === st
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Card: Daftar Antrean Partai Gelanggang */}
          <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <h3 className="font-extrabold text-base text-zinc-950">
                Pilih Partai di Gelanggang
              </h3>
              <span className="text-xs font-bold text-zinc-500">
                {partaiList.length} Partai Terjadwal
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {partaiList.map((p) => {
                const isSelected = p.id === partai.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPartai(p.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded text-white ${
                          p.sudut === 'MERAH' ? 'bg-red-600' : 'bg-blue-600'
                        }`}>
                          #{p.nomorPartai}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-600">
                          {p.gelanggang}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'DISAHKAN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'TAMPIL'
                          ? 'bg-red-100 text-red-800 font-black'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-1 font-extrabold text-xs text-zinc-950 truncate">
                      {p.pesilat.nama}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-medium">
                      {p.pesilat.kontingen} • {p.kategori}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
