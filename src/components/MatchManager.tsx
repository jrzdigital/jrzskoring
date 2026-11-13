import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Play, 
  Printer, 
  CheckCircle2, 
  Trash2, 
  Trophy, 
  User, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { MatchData, Gender, AgeCategory, WeightClass } from '../types/silat';
import { PRESET_MATCHES, SilatStorage } from '../utils/storage';
import { silatAudio } from '../utils/audio';

interface MatchManagerProps {
  currentMatch: MatchData;
  onSelectMatch: (match: MatchData) => void;
  onOpenPrintForMatch: (match: MatchData) => void;
}

export const MatchManager: React.FC<MatchManagerProps> = ({
  currentMatch,
  onSelectMatch,
  onOpenPrintForMatch,
}) => {
  const [matchQueue, setMatchQueue] = useState<MatchData[]>(() => SilatStorage.loadMatchQueue());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Match Form State
  const [newPartaiNumber, setNewPartaiNumber] = useState<number>(matchQueue.length + 1);
  const [newGelanggang, setNewGelanggang] = useState<string>('Gelanggang 1');
  const [newTournamentName, setNewTournamentName] = useState<string>('KEJUARAAN PENCAK SILAT NASIONAL 2026');
  const [newAgeCategory, setNewAgeCategory] = useState<AgeCategory>('DEWASA');
  const [newWeightClass, setNewWeightClass] = useState<string>('Kelas C (55 - 60 kg)');
  const [newGender, setNewGender] = useState<Gender>('PUTRA');
  const [newBabak, setNewBabak] = useState<string>('Babak Penyisihan');

  // Fighters
  const [redName, setRedName] = useState<string>('');
  const [redContingent, setRedContingent] = useState<string>('');
  const [redSchool, setRedSchool] = useState<string>('Tapak Suci');

  const [blueName, setBlueName] = useState<string>('');
  const [blueContingent, setBlueContingent] = useState<string>('');
  const [blueSchool, setBlueSchool] = useState<string>('PSHT');

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redName || !blueName) {
      alert('Mohon isi nama kedua pesilat (Sudut Merah & Biru)!');
      return;
    }

    const newMatch: MatchData = {
      id: `match-${Date.now()}`,
      partaiNumber: Number(newPartaiNumber),
      gelanggang: newGelanggang,
      tournamentName: newTournamentName,
      category: 'TANDING',
      ageCategory: newAgeCategory,
      weightClass: newWeightClass,
      gender: newGender,
      babakPenyisihan: newBabak,
      redFighter: {
        name: redName.toUpperCase(),
        contingent: redContingent.toUpperCase() || 'KONTINGEN A',
        school: redSchool,
      },
      blueFighter: {
        name: blueName.toUpperCase(),
        contingent: blueContingent.toUpperCase() || 'KONTINGEN B',
        school: blueSchool,
      },
      currentRound: 1,
      maxRounds: 3,
      roundDurationSeconds: 120,
      restDurationSeconds: 60,
      timeRemaining: 120,
      timerStatus: 'STOPPED',
      scores: [],
      winner: null,
      winType: null,
      videoChallenge: null,
      redCardsRemaining: 2,
      blueCardsRemaining: 2,
      createdAt: Date.now(),
    };

    const updated = [...matchQueue, newMatch];
    setMatchQueue(updated);
    SilatStorage.saveMatchQueue(updated);

    // Reset Form
    setRedName('');
    setBlueName('');
    setShowAddModal(false);
    onSelectMatch(newMatch);
    silatAudio.playGong();
  };

  const handleResetToPresets = () => {
    if (window.confirm('Muat ulang contoh daftar partai kejuaraan?')) {
      setMatchQueue(PRESET_MATCHES);
      SilatStorage.saveMatchQueue(PRESET_MATCHES);
      onSelectMatch(PRESET_MATCHES[0]);
      silatAudio.playWhistle();
    }
  };

  const handleDeleteMatch = (id: string) => {
    if (matchQueue.length <= 1) {
      alert('Minimal harus ada 1 partai dalam daftar!');
      return;
    }
    const updated = matchQueue.filter((m) => m.id !== id);
    setMatchQueue(updated);
    SilatStorage.saveMatchQueue(updated);
    if (currentMatch.id === id) {
      onSelectMatch(updated[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 py-2">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Jadwal & Manajemen Partai Pertandingan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar antrean partai gelanggang, buat partai baru, dan cetak formulir rekap nilai resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Partai Baru</span>
          </button>
          <button
            onClick={handleResetToPresets}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="Muat Ulang Contoh Data Partai"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Preset</span>
          </button>
        </div>
      </div>

      {/* Match Queue List */}
      <div className="space-y-3">
        {matchQueue.map((m) => {
          const isCurrent = m.id === currentMatch.id;
          const isFinished = !!m.winner;

          return (
            <div
              key={m.id}
              className={`bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all ${
                isCurrent
                  ? 'border-amber-500 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Info Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold font-mono ${
                    isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    <span className="text-[10px] uppercase font-semibold leading-none">Partai</span>
                    <span className="text-lg leading-none mt-0.5">{m.partaiNumber}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-400 font-bold uppercase">{m.gelanggang}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-medium">{m.weightClass}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{m.gender}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{m.babakPenyisihan}</span>
                    </div>

                    {/* Fighters Line */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm">
                      <span className="font-bold text-red-400">{m.redFighter.name}</span>
                      <span className="text-xs text-red-300/80">({m.redFighter.contingent})</span>
                      <span className="text-xs text-slate-500 font-mono font-bold px-1.5">VS</span>
                      <span className="font-bold text-blue-400">{m.blueFighter.name}</span>
                      <span className="text-xs text-blue-300/80">({m.blueFighter.contingent})</span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {isFinished && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pemenang: Sudut {m.winner?.toUpperCase()}</span>
                    </span>
                  )}

                  <button
                    onClick={() => onSelectMatch(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isCurrent ? 'Aktif di Gelanggang' : 'Muat ke Layar'}</span>
                  </button>

                  <button
                    onClick={() => onOpenPrintForMatch(m)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-colors"
                    title="Cetak Formulir Penilaian Resmi"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    className="p-2 hover:bg-red-950/60 text-slate-500 hover:text-red-400 rounded-lg text-xs transition-colors"
                    title="Hapus Partai"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Tambah Partai Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Tambah Partai Pertandingan Baru</span>
            </h3>

            <form onSubmit={handleCreateMatch} className="space-y-4 text-xs">
              {/* Meta Rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nomor Partai</label>
                  <input
                    type="number"
                    value={newPartaiNumber}
                    onChange={(e) => setNewPartaiNumber(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Gelanggang</label>
                  <input
                    type="text"
                    value={newGelanggang}
                    onChange={(e) => setNewGelanggang(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Babak Kejuaraan</label>
                  <input
                    type="text"
                    value={newBabak}
                    onChange={(e) => setNewBabak(e.target.value)}
                    placeholder="Penyisihan / Semifinal / Final"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Golongan Usia</label>
                  <select
                    value={newAgeCategory}
                    onChange={(e) => setNewAgeCategory(e.target.value as AgeCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="USIA_DINI">Usia Dini</option>
                    <option value="PRA_REMAJA">Pra-Remaja</option>
                    <option value="REMAJA">Remaja</option>
                    <option value="DEWASA">Dewasa</option>
                    <option value="MASTER">Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Kelas Tanding</label>
                  <select
                    value={newWeightClass}
                    onChange={(e) => setNewWeightClass(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Kelas A (45 - 50 kg)">Kelas A (45 - 50 kg)</option>
                    <option value="Kelas B (50 - 55 kg)">Kelas B (50 - 55 kg)</option>
                    <option value="Kelas C (55 - 60 kg)">Kelas C (55 - 60 kg)</option>
                    <option value="Kelas D (60 - 65 kg)">Kelas D (60 - 65 kg)</option>
                    <option value="Kelas E (65 - 70 kg)">Kelas E (65 - 70 kg)</option>
                    <option value="Kelas F (70 - 75 kg)">Kelas F (70 - 75 kg)</option>
                    <option value="Kelas G (75 - 80 kg)">Kelas G (75 - 80 kg)</option>
                    <option value="Kelas H (80 - 85 kg)">Kelas H (80 - 85 kg)</option>
                    <option value="Kelas Bebas">Kelas Bebas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Jenis Kelamin</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as Gender)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="PUTRA">Putra</option>
                    <option value="PUTRI">Putri</option>
                  </select>
                </div>
              </div>

              {/* Sudut Merah Inputs */}
              <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-bold text-red-400 uppercase">
                  Data Pesilat Sudut Merah
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Nama Pesilat"
                      value={redName}
                      onChange={(e) => setRedName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Kontingen / Daerah</label>
                    <input
                      type="text"
                      placeholder="e.g. Jawa Barat"
                      value={redContingent}
                      onChange={(e) => setRedContingent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Perguruan</label>
                    <input
                      type="text"
                      placeholder="e.g. Tapak Suci"
                      value={redSchool}
                      onChange={(e) => setRedSchool(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sudut Biru Inputs */}
              <div className="bg-blue-950/40 border border-blue-900/60 p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-bold text-blue-400 uppercase">
                  Data Pesilat Sudut Biru
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Nama Pesilat"
                      value={blueName}
                      onChange={(e) => setBlueName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Kontingen / Daerah</label>
                    <input
                      type="text"
                      placeholder="e.g. Jawa Timur"
                      value={blueContingent}
                      onChange={(e) => setBlueContingent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Perguruan</label>
                    <input
                      type="text"
                      placeholder="e.g. PSHT"
                      value={blueSchool}
                      onChange={(e) => setBlueSchool(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Simpan & Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
