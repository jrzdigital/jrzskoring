import React, { useState } from 'react';
import { MatchSettings } from '../types/silat';
import { Settings, Save, RotateCcw, X } from 'lucide-react';

interface MatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MatchSettings;
  onSaveSettings: (newSettings: MatchSettings) => void;
  redName: string;
  redContingent: string;
  redSchool: string;
  blueName: string;
  blueContingent: string;
  blueSchool: string;
  onUpdateFighters: (
    red: { name: string; contingent: string; school: string },
    blue: { name: string; contingent: string; school: string }
  ) => void;
  onResetMatchData: () => void;
}

export const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  redName,
  redContingent,
  redSchool,
  blueName,
  blueContingent,
  blueSchool,
  onUpdateFighters,
  onResetMatchData,
}) => {
  const [formData, setFormData] = useState<MatchSettings>({ ...settings });
  const [red, setRed] = useState({ name: redName, contingent: redContingent, school: redSchool });
  const [blue, setBlue] = useState({ name: blueName, contingent: blueContingent, school: blueSchool });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onUpdateFighters(red, blue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-neutral-200 max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-neutral-100 pb-3">
          <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Pengaturan Pertandingan & Data Pesilat
            </h2>
            <p className="text-xs text-neutral-500">
              Konfigurasi gelanggang, partai, durasi ronde, dan nama atlet.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Match Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Gelanggang</label>
              <input
                type="text"
                value={formData.arena}
                onChange={(e) => setFormData({ ...formData, arena: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold"
                placeholder="Gelanggang 1 (A)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Nomor Partai</label>
              <input
                type="text"
                value={formData.matchNumber}
                onChange={(e) => setFormData({ ...formData, matchNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold"
                placeholder="Partai 14"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Kategori Usia</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold bg-white"
              >
                <option value="Tanding Usia Dini">Tanding Usia Dini</option>
                <option value="Tanding Pra-Remaja">Tanding Pra-Remaja</option>
                <option value="Tanding Remaja">Tanding Remaja</option>
                <option value="Tanding Dewasa">Tanding Dewasa</option>
                <option value="Tanding Master">Tanding Master</option>
              </select>
            </div>
          </div>

          {/* Gender & Weight Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Jenis Kelamin</label>
              <div className="flex gap-2">
                {(['Putra', 'Putri'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      formData.gender === g
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Kelas Tanding</label>
              <input
                type="text"
                value={formData.weightClass}
                onChange={(e) => setFormData({ ...formData, weightClass: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold"
                placeholder="Kelas F (70-75 kg)"
                required
              />
            </div>
          </div>

          {/* Durations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Durasi Waktu Babak (Detik)
              </label>
              <select
                value={formData.roundDurationSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, roundDurationSeconds: Number(e.target.value) })
                }
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold bg-white"
              >
                <option value={60}>1 Menit (60 detik) - Usia Dini</option>
                <option value={90}>1 Menit 30 Detik (90 detik) - Pra Remaja</option>
                <option value={120}>2 Menit (120 detik) - Standar IPSI/PERSILAT</option>
                <option value={180}>3 Menit (180 detik)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Durasi Istirahat Antar Babak (Detik)
              </label>
              <select
                value={formData.breakDurationSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, breakDurationSeconds: Number(e.target.value) })
                }
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900 font-semibold bg-white"
              >
                <option value={30}>30 Detik</option>
                <option value={60}>1 Menit (60 detik) - Standar Resmi</option>
                <option value={90}>1 Menit 30 Detik</option>
              </select>
            </div>
          </div>

          {/* Red Fighter Info */}
          <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 space-y-2">
            <h4 className="text-xs font-black uppercase text-red-700">Data Sudut Merah</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Nama Pesilat</label>
                <input
                  type="text"
                  value={red.name}
                  onChange={(e) => setRed({ ...red, name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Kontingen / Daerah</label>
                <input
                  type="text"
                  value={red.contingent}
                  onChange={(e) => setRed({ ...red, contingent: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Perguruan Silat</label>
                <input
                  type="text"
                  value={red.school}
                  onChange={(e) => setRed({ ...red, school: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Blue Fighter Info */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
            <h4 className="text-xs font-black uppercase text-blue-700">Data Sudut Biru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Nama Pesilat</label>
                <input
                  type="text"
                  value={blue.name}
                  onChange={(e) => setBlue({ ...blue, name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Kontingen / Daerah</label>
                <input
                  type="text"
                  value={blue.contingent}
                  onChange={(e) => setBlue({ ...blue, contingent: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Perguruan Silat</label>
                <input
                  type="text"
                  value={blue.school}
                  onChange={(e) => setBlue({ ...blue, school: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Officials Names */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Wasit Pertandingan</label>
              <input
                type="text"
                value={formData.refereeName}
                onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Ketua Pertandingan</label>
              <input
                type="text"
                value={formData.juryPresidentName}
                onChange={(e) => setFormData({ ...formData, juryPresidentName: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Sekretaris Pertandingan</label>
              <input
                type="text"
                value={formData.secretaryName}
                onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset seluruh skor pertandingan dan log ke awal partai baru?')) {
                  onResetMatchData();
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-lg font-bold text-xs text-red-700 hover:bg-red-50 border border-red-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span>Reset Partai Baru</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-semibold text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 transition-transform active:scale-98 shadow-sm"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
