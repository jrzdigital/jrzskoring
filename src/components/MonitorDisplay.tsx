import React from 'react';
import { 
  Tv, 
  Clock, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  Maximize2, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Partai } from '../types/silat';
import { formatWaktu, kalkulasiHasilIPSI } from '../services/ipsiRules';

interface MonitorDisplayProps {
  partai: Partai | null;
}

export const MonitorDisplay: React.FC<MonitorDisplayProps> = ({ partai }) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!partai) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white p-6">
        <div className="text-center p-12 bg-zinc-50 border-4 border-zinc-950 rounded-3xl max-w-xl shadow-2xl">
          <Tv className="w-16 h-16 mx-auto text-zinc-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-zinc-950">PAPAN SKOR DIGITAL PERSILAT 2026</h2>
          <p className="text-sm font-semibold text-zinc-500 mt-2">
            Menunggu sinyal pertandingan dari Operator Gelanggang...
          </p>
        </div>
      </div>
    );
  }

  const hasil = partai.hasilAkhir || kalkulasiHasilIPSI(partai.nilaiJuri || {}, partai.penaltiDewan || {});
  const durasiTampil = partai.penaltiDewan?.waktuTampilDetik || partai.durasiBerjalanDetik || 0;
  const isOvertime = durasiTampil > (partai.durasiStandarDetik || 180);

  return (
    <div className="bg-white min-h-screen text-zinc-950 pb-12 select-none">
      
      {/* Stadium Top Bar */}
      <div className="bg-zinc-950 text-white px-4 sm:px-8 py-3 flex items-center justify-between border-b-4 border-zinc-950">
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-sm tracking-wider text-amber-400">
            PERSILAT • PB IPSI
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            PAPAN SKOR DIGITAL RESMI KATEGORI SENI / JURUS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-400">LIVE STADIUM FEED</span>
          </div>

          <button
            onClick={toggleFullScreen}
            aria-label="Layar Penuh Monitor Stadium"
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 cursor-pointer"
            title="Layar Penuh (F11)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Match Header with Corner Color & Pesilat Identity */}
        <div className={`border-4 rounded-3xl p-6 sm:p-8 shadow-md transition-all ${
          partai.sudut === 'MERAH' 
            ? 'bg-red-50 border-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]' 
            : 'bg-blue-50 border-blue-600 shadow-[8px_8px_0px_0px_rgba(37,99,235,1)]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-4 py-1 text-sm font-black text-white rounded-xl ${
                  partai.sudut === 'MERAH' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  SUDUT {partai.sudut}
                </span>
                <span className="px-3 py-1 bg-zinc-950 text-white font-mono font-black text-xs rounded-xl">
                  PARTAI #{partai.nomorPartai} • {partai.gelanggang}
                </span>
                <span className="px-3 py-1 bg-white border-2 border-zinc-950 text-zinc-950 font-bold text-xs rounded-xl">
                  {partai.kategori} - {partai.golongan} ({partai.gender})
                </span>
                {partai.pesilat.nomorUndian && (
                  <span className="px-3 py-1 bg-amber-400 text-zinc-950 font-mono font-black text-xs rounded-xl border border-amber-600">
                    LOT #{partai.pesilat.nomorUndian}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-tight">
                {partai.pesilat.nama}
              </h1>

              <div className="text-lg sm:text-xl font-extrabold text-zinc-800">
                {partai.pesilat.kontingen}
              </div>
            </div>

            {/* Stadium Big Timer Box */}
            <div className="bg-white border-4 border-zinc-950 rounded-3xl p-5 sm:p-6 text-center shadow-md min-w-[280px] shrink-0">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-500 mb-1">
                <span>WAKTU TAMPIL</span>
                <span>TARGET: 03:00.0</span>
              </div>

              <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                isOvertime ? 'text-red-600 animate-pulse' : 'text-zinc-950'
              }`}>
                {formatWaktu(durasiTampil)}
              </div>

              <div className="mt-2 pt-2 border-t-2 border-zinc-200 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-500">Status Waktu:</span>
                <span className={`px-2 py-0.5 rounded font-mono ${
                  durasiTampil === 0 
                    ? 'bg-zinc-100 text-zinc-600'
                    : isOvertime
                    ? 'bg-red-600 text-white font-black'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {durasiTampil === 0 ? 'MENUNGGU' : isOvertime ? 'OVERTIME' : 'NORMAL'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 10 Jury Score Matrix Grid */}
        <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-3 border-zinc-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
                Papan Nilai 10 Juri Pertandingan
              </h2>
              <p className="text-xs text-zinc-600 font-medium">
                Sistem Persilat: 2 Nilai Tertinggi dan 2 Nilai Terendah Dieliminasi otomatis.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span>6 Juri Dihitung</span>
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-3 h-3 bg-red-400 rounded-sm"></span>
                <span>4 Dieliminasi</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((juriNum) => {
              const juriData = partai.nilaiJuri?.[juriNum];
              const hasScore = juriData && (juriData.totalSkorJuri || 0) > 0;
              const total = hasScore ? (juriData.totalSkorJuri || 0) : 0;

              let isDropped = false;
              let dropReason = '';

              if (hasScore) {
                if (hasil.skorTertinggiDibuang?.includes(total)) {
                  isDropped = true;
                  dropReason = 'Tertinggi';
                } else if (hasil.skorTerendahDibuang?.includes(total)) {
                  isDropped = true;
                  dropReason = 'Terendah';
                }
              }

              return (
                <div
                  key={juriNum}
                  className={`border-3 rounded-2xl p-3 text-center transition-all ${
                    !hasScore
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-400'
                      : isDropped
                      ? 'bg-red-50/70 border-red-300 opacity-75'
                      : 'bg-emerald-50 border-emerald-600 shadow-sm'
                  }`}
                >
                  <div className="text-[11px] font-black uppercase text-zinc-600">
                    Juri {juriNum}
                  </div>

                  <div className={`text-2xl sm:text-3xl font-mono font-black my-1 ${
                    !hasScore ? 'text-zinc-300' : isDropped ? 'text-red-700 line-through' : 'text-zinc-950'
                  }`}>
                    {hasScore ? total.toFixed(3) : '---'}
                  </div>

                  <div className="text-[10px] font-bold">
                    {!hasScore ? (
                      <span className="text-zinc-400">Menunggu</span>
                    ) : isDropped ? (
                      <span className="text-red-600">Dibuang ({dropReason})</span>
                    ) : (
                      <span className="text-emerald-700 font-extrabold">Sah (Dihitung)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Panel & Giant Final Score Proclamation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Breakdown Stats (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-50 border-4 border-zinc-950 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-lg font-black text-zinc-950 border-b-2 border-zinc-300 pb-3">
                Rincian Kalkulasi Nilai Standar IPSI 2026
              </h3>

              <div className="grid grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
                <div className="p-3 bg-white border-2 border-zinc-300 rounded-xl space-y-1">
                  <div className="text-zinc-500 font-bold">Rata-rata Kebenaran Gerak:</div>
                  <div className="text-2xl font-mono font-black text-zinc-950">
                    {(hasil.rataRataKebenaran ?? 9.90).toFixed(3)}
                  </div>
                </div>

                <div className="p-3 bg-white border-2 border-zinc-300 rounded-xl space-y-1">
                  <div className="text-zinc-500 font-bold">Rata-rata Kemantapan:</div>
                  <div className="text-2xl font-mono font-black text-blue-700">
                    +{(hasil.rataRataKemantapan ?? 0).toFixed(3)}
                  </div>
                </div>

                <div className="p-3 bg-white border-2 border-zinc-300 rounded-xl space-y-1">
                  <div className="text-zinc-500 font-bold">Rata-rata 6 Juri Sah:</div>
                  <div className="text-2xl font-mono font-black text-zinc-950">
                    {(hasil.rataRataJuri ?? 9.90).toFixed(3)}
                  </div>
                </div>

                <div className="p-3 bg-white border-2 border-zinc-300 rounded-xl space-y-1">
                  <div className="text-zinc-500 font-bold">Total Hukuman (Waktu + Dewan):</div>
                  <div className="text-2xl font-mono font-black text-red-600">
                    -{(hasil.totalHukuman ?? 0).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tie-breaker criteria indicator */}
            <div className="text-[11px] text-zinc-600 font-medium p-3 bg-white border border-zinc-300 rounded-xl">
              * Kriteria Penentu Juara jika nilai imbang: 1. Kebenaran Gerak, 2. Kemantapan, 3. Deviasi Waktu Terkecil, 4. Standar Deviasi ({(hasil.standarDeviasi ?? 0).toFixed(4)}).
            </div>
          </div>

          {/* Giant FINAL SCORE Box (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-950 text-white border-4 border-zinc-950 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {partai.status === 'DISAHKAN' && (
              <div className="absolute top-0 right-0 bg-amber-400 text-zinc-950 font-black text-xs px-6 py-1.5 uppercase tracking-widest rotate-12 translate-x-4 translate-y-2 shadow-md">
                DISAHKAN RESMI
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                HASIL AKHIR PERTANDINGAN
              </span>
              <h3 className="text-2xl font-black">
                NILAI AKHIR RESMI
              </h3>
            </div>

            {/* Giant Score Digits */}
            <div className="my-6 text-center py-4 bg-zinc-900 border-2 border-zinc-800 rounded-2xl">
              <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight text-amber-400">
                {(hasil.skorAkhir ?? hasil.rataRataJuri ?? 9.95).toFixed(3)}
              </div>
              <div className="text-xs text-zinc-400 font-medium mt-1">
                {partai.status === 'DISAHKAN' ? 'Telah diverifikasi oleh Dewan Juri' : 'Skor Sementara'}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-300">Status: {partai.status}</span>
              </div>
              {partai.disahkanOleh && (
                <span className="text-zinc-400 text-[11px] truncate max-w-[180px]">
                  Disahkan: {partai.disahkanOleh.split('(')[0]}
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
