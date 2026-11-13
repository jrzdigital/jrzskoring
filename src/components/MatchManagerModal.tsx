import React, { useState } from 'react';
import { TandingMatch } from '../types/silat';
import { X, Check, RotateCcw, Shield } from 'lucide-react';

interface MatchManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TandingMatch;
  onSave: (updated: Partial<TandingMatch>) => void;
  onResetMatchData: () => void;
}

const PERGURUAN_PRESETS = [
  'Tapak Suci Putera Muhammadiyah',
  'Persaudaraan Setia Hati Terate (PSHT)',
  'Merpati Putih',
  'Keluarga Silat Nasional Perisai Diri',
  'Pagar Nusa (Nahdlatul Ulama)',
  'IKSPI Kera Sakti',
  'Perguruan Silat Cimande',
  'Pencak Organisasi (PO)',
  'Persaudaraan Rasa Tunggal',
  'Perguruan Silat Tajimalela',
  'Bakti Negara Bali',
  'Satria Muda Indonesia (SMI)',
];

const KELAS_PRESETS = [
  'Kelas A (45 - 50 kg)',
  'Kelas B (50 - 55 kg)',
  'Kelas C (55 - 60 kg)',
  'Kelas D (60 - 65 kg)',
  'Kelas E (65 - 70 kg)',
  'Kelas F (70 - 75 kg)',
  'Kelas G (75 - 80 kg)',
  'Kelas Bebas (> 80 kg)',
];

export const MatchManagerModal: React.FC<MatchManagerModalProps> = ({
  isOpen,
  onClose,
  match,
  onSave,
  onResetMatchData,
}) => {
  const [partai, setPartai] = useState(match.partai);
  const [gelanggang, setGelanggang] = useState(match.gelanggang);
  const [babakMatch, setBabakMatch] = useState(match.babakMatch);
  const [kategoriUsia, setKategoriUsia] = useState(match.kategoriUsia);
  const [gender, setGender] = useState(match.gender);
  const [kelasTanding, setKelasTanding] = useState(match.kelasTanding);
  const [roundDuration, setRoundDuration] = useState(match.roundDurationSeconds);
  const [breakDuration, setBreakDuration] = useState(match.breakDurationSeconds);

  // Fighter Merah
  const [merahName, setMerahName] = useState(match.merah.name);
  const [merahKontingen, setMerahKontingen] = useState(match.merah.kontingen);

  // Fighter Biru
  const [biruName, setBiruName] = useState(match.biru.name);
  const [biruKontingen, setBiruKontingen] = useState(match.biru.kontingen);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      partai,
      gelanggang,
      babakMatch,
      kategoriUsia,
      gender,
      kelasTanding,
      roundDurationSeconds: roundDuration,
      breakDurationSeconds: breakDuration,
      merah: {
        ...match.merah,
        name: merahName,
        kontingen: merahKontingen,
      },
      biru: {
        ...match.biru,
        name: biruName,
        kontingen: biruKontingen,
      },
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="font-athletic text-xl font-bold uppercase text-white">
              Pengaturan Partai & Pesilat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Info Gelanggang & Partai */}
          <div>
            <h3 className="font-bold text-sm text-slate-200 uppercase mb-3 pb-1 border-b border-slate-800">
              1. Identitas Partai Pertandingan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Gelanggang</label>
                <select
                  value={gelanggang}
                  onChange={(e) => setGelanggang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value="Gelanggang A">Gelanggang A</option>
                  <option value="Gelanggang B">Gelanggang B</option>
                  <option value="Gelanggang C">Gelanggang C</option>
                  <option value="Gelanggang D">Gelanggang D</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Nomor Partai</label>
                <input
                  type="number"
                  min="1"
                  value={partai}
                  onChange={(e) => setPartai(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Babak Turnamen</label>
                <select
                  value={babakMatch}
                  onChange={(e) => setBabakMatch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value="Babak Penyisihan">Babak Penyisihan</option>
                  <option value="Babak Perempat Final">Babak Perempat Final</option>
                  <option value="Babak Semi Final">Babak Semi Final</option>
                  <option value="Babak Final">Babak Final</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kategori Usia</label>
                <select
                  value={kategoriUsia}
                  onChange={(e) => setKategoriUsia(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value="USIA_DINI">Usia Dini</option>
                  <option value="PRA_REMAJA">Pra-Remaja</option>
                  <option value="REMAJA">Remaja</option>
                  <option value="DEWASA">Dewasa</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value="PUTRA">Tanding Putra</option>
                  <option value="PUTRI">Tanding Putri</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kelas Tanding</label>
                <select
                  value={kelasTanding}
                  onChange={(e) => setKelasTanding(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  {KELAS_PRESETS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Durasi Babak</label>
                <select
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value={90}>1 Menit 30 Detik (Pra-Remaja)</option>
                  <option value={120}>2 Menit (Standar Dewasa)</option>
                  <option value={180}>3 Menit (Final Nasional)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Waktu Istirahat</label>
                <select
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value={60}>1 Menit (Standar)</option>
                  <option value={90}>1 Menit 30 Detik</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Data Sudut Merah */}
          <div className="bg-red-950/30 border border-red-900/60 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-red-200 uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              2. Sudut Merah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Pesilat</label>
                <input
                  type="text"
                  value={merahName}
                  onChange={(e) => setMerahName(e.target.value)}
                  placeholder="Nama Atlet Sudut Merah"
                  className="w-full bg-slate-950 border border-red-900/80 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kontingen / Perguruan</label>
                <input
                  type="text"
                  value={merahKontingen}
                  onChange={(e) => setMerahKontingen(e.target.value)}
                  placeholder="Perguruan / Daerah"
                  className="w-full bg-slate-950 border border-red-900/80 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>
            </div>

            {/* Quick Perguruan Preset Merah */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Pilih Cepat Perguruan Silat:</span>
              <div className="flex flex-wrap gap-1.5">
                {PERGURUAN_PRESETS.slice(0, 6).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMerahKontingen(p)}
                    className="px-2 py-0.5 bg-red-950 hover:bg-red-900 text-[10px] text-red-300 rounded border border-red-800"
                  >
                    {p.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Data Sudut Biru */}
          <div className="bg-blue-950/30 border border-blue-900/60 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-blue-200 uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              3. Sudut Biru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Pesilat</label>
                <input
                  type="text"
                  value={biruName}
                  onChange={(e) => setBiruName(e.target.value)}
                  placeholder="Nama Atlet Sudut Biru"
                  className="w-full bg-slate-950 border border-blue-900/80 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kontingen / Perguruan</label>
                <input
                  type="text"
                  value={biruKontingen}
                  onChange={(e) => setBiruKontingen(e.target.value)}
                  placeholder="Perguruan / Daerah"
                  className="w-full bg-slate-950 border border-blue-900/80 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>
            </div>

            {/* Quick Perguruan Preset Biru */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Pilih Cepat Perguruan Silat:</span>
              <div className="flex flex-wrap gap-1.5">
                {PERGURUAN_PRESETS.slice(0, 6).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBiruKontingen(p)}
                    className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-[10px] text-blue-300 rounded border border-blue-800"
                  >
                    {p.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onResetMatchData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl border border-red-900/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Skor & Partai Baru
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
