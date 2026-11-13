import React, { useState } from 'react';
import { TournamentState, Competitor, RefereeOfficial, MatchCategory } from '../types';
import { syncBus } from '../utils/syncBus';
import { exportToJSON } from '../utils/exportEngine';
import {
  Settings,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Scale,
  Download,
  RotateCcw,
  Search,
} from 'lucide-react';

interface AdminPanelProps {
  state: TournamentState;
  onSelectRole?: (role: any) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'peserta' | 'wasit' | 'turnamen'>('peserta');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for new competitor
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [compName, setCompName] = useState('');
  const [compContingent, setCompContingent] = useState('');
  const [compClass, setCompClass] = useState('Kelas C Putra (55-60 Kg)');
  const [compGender, setCompGender] = useState<'male' | 'female'>('male');
  const [compCategory, setCompCategory] = useState<MatchCategory>('tanding');

  // Form states for official referee
  const [showAddOfficial, setShowAddOfficial] = useState(false);
  const [offName, setOffName] = useState('');
  const [offLicense, setOffLicense] = useState('IPSI-JURI-2026-');
  const [offLevel, setOffLevel] = useState<RefereeOfficial['licenseLevel']>('Nasional 1');
  const [offOrigin, setOffOrigin] = useState('');
  const [offRole, setOffRole] = useState<RefereeOfficial['assignedRole']>('Juri 1');
  const [offPin, setOffPin] = useState('1234');

  // Competitor operations
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp: Competitor = {
      id: 'c-' + Date.now(),
      name: compName,
      contingent: compContingent,
      weightClass: compClass,
      gender: compGender,
      category: compCategory,
      verified: false,
    };

    syncBus.updateState((prev) => ({
      ...prev,
      competitors: [newComp, ...prev.competitors],
    }));

    setShowAddCompetitor(false);
    setCompName('');
    setCompContingent('');
    syncBus.addNotification(
      'Pesilat Baru Ditambahkan',
      `${newComp.name} (${newComp.contingent}) terdaftar di ${newComp.weightClass}`,
      'announcement'
    );
  };

  const handleDeleteCompetitor = (id: string) => {
    syncBus.updateState((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c.id !== id),
    }));
  };

  const handleToggleVerifyWeight = (id: string, weightKg?: number) => {
    syncBus.updateState((prev) => ({
      ...prev,
      competitors: prev.competitors.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            verified: !c.verified,
            weightVerifiedKg: weightKg || c.weightVerifiedKg || 57.5,
          };
        }
        return c;
      }),
    }));
  };

  // Official referee operations
  const handleAddOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    const newOff: RefereeOfficial = {
      id: 'off-' + Date.now(),
      name: offName,
      licenseNumber: offLicense,
      licenseLevel: offLevel,
      contingentOrigin: offOrigin,
      assignedRole: offRole,
      pin: offPin,
      isActive: true,
    };

    syncBus.updateState((prev) => ({
      ...prev,
      officials: [...prev.officials, newOff],
    }));

    setShowAddOfficial(false);
    setOffName('');
    setOffOrigin('');
    syncBus.addNotification(
      'Petugas Wasit Juri Ditambahkan',
      `${newOff.name} ditugaskan sebagai ${newOff.assignedRole}`,
      'announcement'
    );
  };

  const handleDeleteOfficial = (id: string) => {
    syncBus.updateState((prev) => ({
      ...prev,
      officials: prev.officials.filter((o) => o.id !== id),
    }));
  };

  const handleBackupJSON = () => {
    exportToJSON(state, `Backup_SilatScore_${Date.now()}.json`);
  };

  const filteredCompetitors = state.competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contingent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.weightClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Settings className="h-4 w-4" />
              <span>DASHBOARD ADMINISTRATOR TURNAMEN</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-0.5">
              Manajemen Database Peserta & Wasit Juri
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupJSON}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-950 border border-purple-800/50 hover:bg-purple-900 text-purple-200 transition"
              title="Unduh seluruh data turnamen ke JSON"
            >
              <Download className="h-3.5 w-3.5" />
              Backup Database JSON
            </button>
            <button
              onClick={() => syncBus.resetToDefault()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900 text-rose-300 transition"
              title="Reset ke data simulasi default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset State
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-purple-900/40 pb-2">
          <button
            onClick={() => setActiveTab('peserta')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'peserta'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <Users className="h-4 w-4" />
            Daftar Peserta & Timbang Badan ({state.competitors.length})
          </button>
          <button
            onClick={() => setActiveTab('wasit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'wasit'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Data Wasit Juri & Lisensi ({state.officials.length})
          </button>
        </div>

        {/* TAB 1: PESERTA */}
        {activeTab === 'peserta' && (
          <div className="rounded-xl border border-purple-800/40 bg-[#130829] p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
                <input
                  type="text"
                  placeholder="Cari nama pesilat / kontingen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-purple-800/50 bg-purple-950/60 pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/50 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setShowAddCompetitor(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pesilat Baru
              </button>
            </div>

            {/* Tabel Peserta */}
            <div className="overflow-x-auto rounded-lg border border-purple-900/40">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180a33] text-purple-200 uppercase text-[10px] tracking-wider border-b border-purple-900/60">
                  <tr>
                    <th className="p-3">Nama Pesilat</th>
                    <th className="p-3">Kontingen / Perguruan</th>
                    <th className="p-3">Kategori & Kelas</th>
                    <th className="p-3">Verifikasi Timbang</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {filteredCompetitors.map((c) => (
                    <tr key={c.id} className="hover:bg-purple-900/20 transition">
                      <td className="p-3 font-bold text-white">{c.name}</td>
                      <td className="p-3">{c.contingent}</td>
                      <td className="p-3">
                        <span className="font-mono text-purple-300">{c.weightClass}</span>
                        <span className="block text-[10px] text-purple-400 uppercase">
                          {c.category.replace('_', ' ')} · {c.gender === 'male' ? 'Putra' : 'Putri'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleVerifyWeight(c.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                            c.verified
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                              : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                          }`}
                        >
                          <Scale className="h-3 w-3" />
                          {c.verified
                            ? `Sah (${c.weightVerifiedKg || 58.0} Kg)`
                            : 'Belum Timbang'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteCompetitor(c.id)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                          title="Hapus Peserta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: WASIT JURI */}
        {activeTab === 'wasit' && (
          <div className="rounded-xl border border-purple-800/40 bg-[#130829] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daftar Akreditasi Wasit Juri Gelanggang</h3>
                <p className="text-xs text-purple-300">
                  Pengaturan lisensi, nomor sertifikat, dan PIN login masing-masing meja penilaian.
                </p>
              </div>

              <button
                onClick={() => setShowAddOfficial(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Petugas Wasit Juri
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.officials.map((off) => (
                <div
                  key={off.id}
                  className="rounded-xl border border-purple-800/40 bg-purple-950/30 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/40">
                        {off.assignedRole}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">PIN: {off.pin}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{off.name}</h4>
                    <p className="text-xs text-purple-300 mt-0.5">{off.contingentOrigin}</p>

                    <div className="mt-3 pt-2 border-t border-purple-900/40 text-[11px] text-purple-300/80 space-y-0.5">
                      <p>Lisensi: <strong className="text-white">{off.licenseLevel}</strong></p>
                      <p className="font-mono text-[10px] text-purple-400">{off.licenseNumber}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-purple-900/40 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle className="h-3 w-3" />
                      Terverifikasi
                    </span>
                    <button
                      onClick={() => handleDeleteOfficial(off.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Hapus Petugas"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Tambah Peserta */}
        {showAddCompetitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-purple-700/60 bg-[#160a2c] p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-3">Pendaftaran Pesilat Baru</h3>
              <form onSubmit={handleAddCompetitor} className="space-y-3 text-xs">
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Nama Lengkap Atlet:</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Kontingen / Perguruan Asal:</label>
                  <input
                    type="text"
                    required
                    value={compContingent}
                    onChange={(e) => setCompContingent(e.target.value)}
                    placeholder="Contoh: Tapak Suci DKI / PSHT"
                    className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">Kategori:</label>
                    <select
                      value={compCategory}
                      onChange={(e) => setCompCategory(e.target.value as any)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none"
                    >
                      <option value="tanding">Tanding</option>
                      <option value="seni_tunggal">Seni Tunggal</option>
                      <option value="seni_ganda">Seni Ganda</option>
                      <option value="seni_regu">Seni Regu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">Jenis Kelamin:</label>
                    <select
                      value={compGender}
                      onChange={(e) => setCompGender(e.target.value as any)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none"
                    >
                      <option value="male">Putra</option>
                      <option value="female">Putri</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Kelas Tanding / Pool:</label>
                  <input
                    type="text"
                    value={compClass}
                    onChange={(e) => setCompClass(e.target.value)}
                    className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-purple-900/40">
                  <button
                    type="button"
                    onClick={() => setShowAddCompetitor(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold"
                  >
                    Simpan Atlet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tambah Wasit Juri */}
        {showAddOfficial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-purple-700/60 bg-[#160a2c] p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-3">Akreditasi Wasit Juri Baru</h3>
              <form onSubmit={handleAddOfficial} className="space-y-3 text-xs">
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Nama Lengkap & Gelar:</label>
                  <input
                    type="text"
                    required
                    value={offName}
                    onChange={(e) => setOffName(e.target.value)}
                    placeholder="Contoh: Drs. H. Bambang Suherman"
                    className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">Tingkat Lisensi:</label>
                    <select
                      value={offLevel}
                      onChange={(e) => setOffLevel(e.target.value as any)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none"
                    >
                      <option value="Internasional PERSILAT">Internasional PERSILAT</option>
                      <option value="Nasional 1">Nasional 1</option>
                      <option value="Nasional 2">Nasional 2</option>
                      <option value="Daerah">Daerah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">Penugasan:</label>
                    <select
                      value={offRole}
                      onChange={(e) => setOffRole(e.target.value as any)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none"
                    >
                      <option value="Dewan">Dewan Pertandingan</option>
                      <option value="Wasit">Wasit Gelanggang</option>
                      <option value="Juri 1">Juri 1</option>
                      <option value="Juri 2">Juri 2</option>
                      <option value="Juri 3">Juri 3</option>
                      <option value="Juri 4">Juri 4</option>
                      <option value="Juri 5">Juri 5</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Pengprov / Kontingen Asal:</label>
                  <input
                    type="text"
                    required
                    value={offOrigin}
                    onChange={(e) => setOffOrigin(e.target.value)}
                    placeholder="Contoh: Pengprov IPSI Jawa Tengah"
                    className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">Nomor Lisensi / SK:</label>
                    <input
                      type="text"
                      value={offLicense}
                      onChange={(e) => setOffLicense(e.target.value)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1 font-semibold">PIN Login Keamanan:</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={offPin}
                      onChange={(e) => setOffPin(e.target.value)}
                      className="w-full rounded-lg border border-purple-800/60 bg-purple-950/70 p-2 text-white focus:outline-none font-mono text-center tracking-widest"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-purple-900/40">
                  <button
                    type="button"
                    onClick={() => setShowAddOfficial(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold"
                  >
                    Simpan Petugas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
