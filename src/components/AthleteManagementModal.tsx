import React, { useState, useMemo } from 'react';
import { useSilat } from '../context/SilatContext';
import { SilatAthlete, MatchCategory, Gender, AgeGroup } from '../types/silat';
import { Users, Plus, Edit2, Trash2, Search, X, Check, Filter, UserPlus } from 'lucide-react';
import { getIpsiWeightClasses, getDefaultClassGroupForCategory } from '../utils/ipsiClasses';

interface AthleteManagementModalProps {
  onClose: () => void;
}

export const AthleteManagementModal: React.FC<AthleteManagementModalProps> = ({ onClose }) => {
  const { athletes, addOrUpdateAthlete, deleteAthlete } = useSilat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<SilatAthlete | null>(null);
  const [formName, setFormName] = useState('');
  const [formContingent, setFormContingent] = useState('');
  const [formGender, setFormGender] = useState<Gender>('PUTRA');
  const [formCategory, setFormCategory] = useState<MatchCategory>('TANDING');
  const [formClassGroup, setFormClassGroup] = useState('Kelas C (55-60 kg)');
  const [formWeight, setFormWeight] = useState<number>(58);
  const [formAgeGroup, setFormAgeGroup] = useState<AgeGroup>('DEWASA');
  const [formTeamMembers, setFormTeamMembers] = useState('');

  // IPSI 2026 & PERSILAT Dynamic Weight Classes
  const currentIpsiClasses = useMemo(() => {
    return getIpsiWeightClasses(formAgeGroup, formGender);
  }, [formAgeGroup, formGender]);

  const activeClassObj = useMemo(() => {
    return currentIpsiClasses.find((c) => c.label === formClassGroup) || currentIpsiClasses[0];
  }, [currentIpsiClasses, formClassGroup]);

  const handleCategoryChange = (cat: MatchCategory) => {
    setFormCategory(cat);
    if (cat === 'TANDING') {
      const classes = getIpsiWeightClasses(formAgeGroup, formGender);
      const matched = classes.find((c) => c.label === formClassGroup) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    } else {
      setFormClassGroup(getDefaultClassGroupForCategory(cat, formAgeGroup, formGender));
      setFormWeight(0);
    }
  };

  const handleGenderChange = (gen: Gender) => {
    setFormGender(gen);
    if (formCategory === 'TANDING') {
      const classes = getIpsiWeightClasses(formAgeGroup, gen);
      const code = formClassGroup.match(/Kelas ([A-L]|Bebas)/i)?.[1]?.toUpperCase();
      const matched = classes.find((c) => c.id === code) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    }
  };

  const handleAgeGroupChange = (age: AgeGroup) => {
    setFormAgeGroup(age);
    if (formCategory === 'TANDING') {
      const classes = getIpsiWeightClasses(age, formGender);
      const code = formClassGroup.match(/Kelas ([A-L]|Bebas)/i)?.[1]?.toUpperCase();
      const matched = classes.find((c) => c.id === code) || classes.find((c) => c.id === 'C') || classes[0];
      setFormClassGroup(matched.label);
      setFormWeight(matched.defaultWeight);
    }
  };

  const handleClassGroupChange = (newClassLabel: string) => {
    setFormClassGroup(newClassLabel);
    const classes = getIpsiWeightClasses(formAgeGroup, formGender);
    const matched = classes.find((c) => c.label === newClassLabel);
    if (matched) {
      setFormWeight(matched.defaultWeight);
    }
  };

  const filteredAthletes = athletes.filter((ath) => {
    const matchesSearch =
      ath.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ath.contingent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ath.classGroup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'ALL' || ath.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormContingent('');
    setFormGender('PUTRA');
    setFormCategory('TANDING');
    setFormAgeGroup('DEWASA');
    const classes = getIpsiWeightClasses('DEWASA', 'PUTRA');
    const defaultClass = classes.find((c) => c.id === 'C') || classes[0];
    setFormClassGroup(defaultClass.label);
    setFormWeight(defaultClass.defaultWeight);
    setFormTeamMembers('');
    setIsEditing(true);
  };

  const handleOpenEdit = (athlete: SilatAthlete) => {
    setEditingId(athlete.id);
    setFormName(athlete.name);
    setFormContingent(athlete.contingent);
    setFormGender(athlete.gender);
    setFormCategory(athlete.category);
    setFormAgeGroup(athlete.ageGroup);
    setFormClassGroup(athlete.classGroup);
    setFormWeight(athlete.weight || 0);
    setFormTeamMembers(athlete.teamMembers ? athlete.teamMembers.join(', ') : '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContingent.trim()) return;

    const finalClassGroup = formCategory === 'TANDING'
      ? formClassGroup.trim()
      : getDefaultClassGroupForCategory(formCategory, formAgeGroup, formGender);

    const athlete: SilatAthlete = {
      id: editingId || `ath-${Date.now()}`,
      name: formName.trim(),
      contingent: formContingent.trim(),
      gender: formGender,
      category: formCategory,
      classGroup: finalClassGroup,
      weight: formCategory === 'TANDING' && formWeight > 0 ? Number(formWeight) : undefined,
      ageGroup: formAgeGroup,
      teamMembers: (formCategory === 'JURUS_GANDA' || formCategory === 'JURUS_REGU') && formTeamMembers.trim()
        ? formTeamMembers.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
    };

    addOrUpdateAthlete(athlete);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-scroll overflow-x-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in custom-outer-scrollbar">
      <div className="min-h-full w-full flex items-start justify-center p-3 sm:p-5 py-4 sm:py-8">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-200 rounded-2xl shadow-2xl flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Database Atlet Terintegrasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pencak Silat IPSI 2026 | Manajemen Kontingen & Kategori Pertandingan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition-transform active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Atlet</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            /* Edit / Add Form */
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl mx-auto bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {editingId ? 'Edit Data Atlet' : 'Tambah Atlet Baru'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Pesilat / Regu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Muhammad Fadli Pratama"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kontingen / Perguruan / Daerah *
                  </label>
                  <input
                    type="text"
                    required
                    value={formContingent}
                    onChange={(e) => setFormContingent(e.target.value)}
                    placeholder="Contoh: Jawa Barat / Tapak Suci"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Pertandingan
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as MatchCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="TANDING">Tanding</option>
                    <option value="JURUS_TUNGGAL">Jurus Tunggal (Seni)</option>
                    <option value="JURUS_GANDA">Jurus Ganda (Seni)</option>
                    <option value="JURUS_REGU">Jurus Regu (Seni)</option>
                    <option value="SOLO_KREATIF">Solo Kreatif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => handleGenderChange(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="PUTRA">Putra</option>
                    <option value="PUTRI">Putri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Golongan Usia
                  </label>
                  <select
                    value={formAgeGroup}
                    onChange={(e) => handleAgeGroupChange(e.target.value as AgeGroup)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PRA_USIA_DINI">Pra Usia Dini (≤ 5 tahun)</option>
                    <option value="USIA_DINI_1">Usia Dini 1 (&gt; 5 s.d. 8 tahun)</option>
                    <option value="USIA_DINI_2">Usia Dini 2 (&gt; 8 s.d. 11 tahun)</option>
                    <option value="PRA_REMAJA">Pra Remaja (&gt; 11 s.d. 14 tahun)</option>
                    <option value="REMAJA">Remaja (&gt; 14 s.d. 17 tahun)</option>
                    <option value="DEWASA">Dewasa (&gt; 17 s.d. 35 tahun)</option>
                    <option value="MASTER_1">Master 1 (&gt; 35 s.d. 45 tahun)</option>
                    <option value="MASTER_2">Master 2 (≥ 45 tahun)</option>
                  </select>
                </div>

                {/* Sembunyikan kelas tanding jika Jurus Seni (TGRS). Tampilkan dropdown jika Tanding */}
                {formCategory === 'TANDING' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kelas Tanding (IPSI 2026 / PERSILAT)
                      </label>
                      <select
                        value={formClassGroup}
                        onChange={(e) => handleClassGroupChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        {currentIpsiClasses.map((cls) => (
                          <option key={cls.id} value={cls.label}>
                            {cls.name} ({cls.weightRange})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Berat Badan (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formWeight || ''}
                        onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                        placeholder="Contoh: 58.2"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                      />
                      {activeClassObj && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                          Rentang Sah: {activeClassObj.weightRange}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {(formCategory === 'JURUS_GANDA' || formCategory === 'JURUS_REGU') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Anggota Tim (Untuk Ganda/Regu, pisah koma)
                    </label>
                    <input
                      type="text"
                      value={formTeamMembers}
                      onChange={(e) => setFormTeamMembers(e.target.value)}
                      placeholder="Contoh: Andika, Fajar, Gilang"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Simpan Atlet
                </button>
              </div>
            </form>
          ) : (
            /* Athletes Table View */
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari atlet, kontingen, kelas..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {['ALL', 'TANDING', 'JURUS_TUNGGAL', 'JURUS_GANDA', 'JURUS_REGU', 'SOLO_KREATIF'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                        selectedCategoryFilter === cat
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Nama Pesilat</th>
                      <th className="py-3 px-4">Kontingen</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Gender & Golongan</th>
                      <th className="py-3 px-4">Kelas / Berat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredAthletes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada atlet yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredAthletes.map((ath) => (
                        <tr key={ath.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            <div>{ath.name}</div>
                            {ath.teamMembers && (
                              <div className="text-[10px] font-normal text-slate-500">
                                Anggota: {ath.teamMembers.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {ath.contingent}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              ath.category === 'TANDING'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {ath.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{ath.gender}</span> · {ath.ageGroup.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4">
                            {ath.classGroup} {ath.weight ? `(${ath.weight} kg)` : ''}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(ath)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                title="Edit Atlet"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setAthleteToDelete(ath)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                title="Hapus Atlet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs text-slate-500">
          <span>Total Terdaftar: {athletes.length} Pesilat</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold"
          >
            Tutup
          </button>
        </div>

      </div>

      </div>

      {athleteToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-600 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/80 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase font-mono">
                  Hapus Data Atlet?
                </h4>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan data peserta
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data atlet <strong>"{athleteToDelete.name}"</strong> ({athleteToDelete.contingent})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAthlete(athleteToDelete.id);
                  setAthleteToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Atlet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
