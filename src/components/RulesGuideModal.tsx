import React from 'react';
import { X, Shield, BookOpen, AlertCircle, Award, Target, Clock } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-athletic text-xl font-bold uppercase text-white">
                Buku Saku Aturan Pertandingan Pencak Silat
              </h2>
              <p className="text-xs text-slate-400">
                Ringkasan Regulasi Resmi PERSILAT 2022 & PB IPSI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Section 1: Sasaran Sah & Poin */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-amber-400 uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              1. Sasaran Sah & Nilai Serangan (Tanding)
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Sasaran sah adalah <strong>Togok</strong> (dada, perut kanan/kiri, rusuk kanan/kiri, dan punggung). Leher dan kepala adalah sasaran terlarang.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Pukulan Sah (+1 Poin)</span>
                <span className="text-slate-400 text-[11px]">
                  Serangan tangan yang masuk mantap pada sasaran sah tanpa terhalang tangkisan.
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Tendangan Sah (+2 Poin)</span>
                <span className="text-slate-400 text-[11px]">
                  Serangan tungkai kaki (lurus, sabit, T, belakang) masuk mantap pada sasaran sah.
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Jatuhan Sah (+3 Poin)</span>
                <span className="text-slate-400 text-[11px]">
                  Berhasil menjatuhkan lawan secara sah (tangkapan, sapuan, guntingan) tanpa ikut terjatuh.
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">Kuncian Sah (+5 Poin)</span>
                <span className="text-slate-400 text-[11px]">
                  Kuncian sah yang berhasil melumpuhkan lawan selama 5 detik atau lawan menyerah.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Konsensus Juri 2 Detik */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm text-emerald-400 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              2. Sistem Konsensus Wasit Juri (PERSILAT 2022)
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Pada regulasi digital terbaru, poin serangan (pukulan/tendangan) hanya sah dicatat apabila <strong>minimal 2 dari 3 Juri</strong> menekan tombol pada sudut yang sama dalam rentang waktu toleransi <strong>2.0 detik</strong>.
            </p>
          </div>

          {/* Section 3: Hukuman & Sanksi */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-red-400 uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              3. Tingkatan Hukuman & Pengurangan Poin
            </h3>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <strong className="text-white">Binaan (Maksimal 2x):</strong> Peringatan lisan wasit tanpa pemotongan nilai atas pelanggaran ringan awal.
              </li>
              <li>
                <strong className="text-amber-400">Teguran I:</strong> Pemotongan <span className="font-bold text-red-400">-1 poin</span>.
              </li>
              <li>
                <strong className="text-amber-400">Teguran II:</strong> Pemotongan <span className="font-bold text-red-400">-2 poin</span>.
              </li>
              <li>
                <strong className="text-red-400">Peringatan I:</strong> Diberikan setelah teguran II atau pelanggaran sedang; pemotongan <span className="font-bold text-red-400">-5 poin</span>.
              </li>
              <li>
                <strong className="text-red-400">Peringatan II:</strong> Diberikan setelah peringatan I; pemotongan <span className="font-bold text-red-400">-10 poin</span>.
              </li>
              <li>
                <strong className="text-red-500">Diskualifikasi (DQ):</strong> Pelanggaran berat langsung, mencederai lawan secara sengaja ke area terlarang, atau akumulasi pelanggaran setelah peringatan II.
              </li>
            </ul>
          </div>

          {/* Section 4: Keputusan Kemenangan */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm text-amber-400 uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              4. Macam Keputusan Kemenangan
            </h3>
            <p className="text-slate-400">
              <strong>Menang Angka:</strong> Total skor lebih unggul.
              <br />
              <strong>Menang Mutlak:</strong> Lawan jatuh KO tidak bangun dalam 10 hitungan.
              <br />
              <strong>Menang WKO:</strong> Wasit menghentikan partai karena keselamatan pesilat.
              <br />
              <strong>Menang Teknik:</strong> Cedera akibat serangan sah.
              <br />
              <strong>Menang Diskualifikasi:</strong> Lawan melanggar aturan berat (DQ).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
