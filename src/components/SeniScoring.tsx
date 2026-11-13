import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  Clock, 
  AlertCircle, 
  User, 
  Plus, 
  Minus,
  Save,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { SeniPerformance, SeniScoreItem, Gender, AgeCategory } from '../types/silat';
import { formatTime } from '../utils/rules';
import { silatAudio } from '../utils/audio';
import { SilatStorage } from '../utils/storage';

export const SeniScoring: React.FC = () => {
  // Timer State
  const [elapsed, setElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Performer Data
  const [participantName, setParticipantName] = useState<string>('FAJAR NUGROHO');
  const [contingent, setContingent] = useState<string>('JAWA BARAT');
  const [category, setCategory] = useState<'SENI_TUNGGAL' | 'SENI_GANDA' | 'SENI_REGU' | 'SOLO_KREATIF'>('SENI_TUNGGAL');
  const [gender, setGender] = useState<Gender>('PUTRA');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('DEWASA');
  const [partaiNumber, setPartaiNumber] = useState<number>(1);
  const [gelanggang, setGelanggang] = useState<string>('Gelanggang 1');

  // Multi-Judge Scores (Default 3 Judges)
  const [judgeScores, setJudgeScores] = useState<SeniScoreItem[]>([
    {
      id: 'j1',
      judgeId: 1,
      kebenaranScore: 9.90,
      kemantapanScore: 0.85,
      hukumanTime: 0,
      hukumanArena: 0,
      hukumanSenjata: 0,
      hukumanLain: 0,
      totalScore: 10.75,
    },
    {
      id: 'j2',
      judgeId: 2,
      kebenaranScore: 9.88,
      kemantapanScore: 0.88,
      hukumanTime: 0,
      hukumanArena: 0,
      hukumanSenjata: 0,
      hukumanLain: 0,
      totalScore: 10.76,
    },
    {
      id: 'j3',
      judgeId: 3,
      kebenaranScore: 9.90,
      kemantapanScore: 0.84,
      hukumanTime: 0,
      hukumanArena: 0,
      hukumanSenjata: 0,
      hukumanLain: 0,
      totalScore: 10.74,
    },
  ]);

  const [savedPerformances, setSavedPerformances] = useState<SeniPerformance[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    setSavedPerformances(SilatStorage.loadSeniPerformances());
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Timer status evaluation (Target 180s = 3:00, tolerance 175s - 185s)
  const isUnderTime = elapsed > 0 && elapsed < 175;
  const isTargetZone = elapsed >= 175 && elapsed <= 185;
  const isOverTime = elapsed > 185;

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      // Jeda/Pause TANPA SUARA
    } else {
      const isResuming = elapsed > 0;
      setIsRunning(true);
      // Sound buzzer hanya saat MULAI babak pertama kali
      if (!isResuming) {
        silatAudio.playBuzzer();
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsed(0);
  };

  // Recalculate single judge score
  const updateJudge = (idx: number, updates: Partial<SeniScoreItem>) => {
    const updated = [...judgeScores];
    const item = { ...updated[idx], ...updates };
    
    // total = kebenaran + kemantapan - (all hukuman)
    const totalPenalties = item.hukumanTime + item.hukumanArena + item.hukumanSenjata + item.hukumanLain;
    const finalScore = Number((item.kebenaranScore + item.kemantapanScore - totalPenalties).toFixed(3));
    
    item.totalScore = Math.max(0, finalScore);
    updated[idx] = item;
    setJudgeScores(updated);
  };

  // Deduct/Add kebenaran mistakes
  const adjustKebenaran = (idx: number, delta: number) => {
    const current = judgeScores[idx].kebenaranScore;
    const nextVal = Number((current + delta).toFixed(2));
    if (nextVal >= 0 && nextVal <= 9.90) {
      updateJudge(idx, { kebenaranScore: nextVal });
    }
  };

  // Calculate final performance score (Average of judges)
  const averageFinalScore = Number(
    (judgeScores.reduce((acc, curr) => acc + curr.totalScore, 0) / judgeScores.length).toFixed(3)
  );

  const handleSavePerformance = () => {
    const perf: SeniPerformance = {
      id: `seni-${Date.now()}`,
      partaiNumber,
      gelanggang,
      tournamentName: 'KEJUARAAN PENCAK SILAT NASIONAL 2026',
      category,
      participantName,
      contingent,
      gender,
      ageCategory,
      elapsedSeconds: elapsed,
      targetSeconds: 180,
      timerStatus: 'FINISHED',
      judgeScores,
      finalScore: averageFinalScore,
      completedAt: Date.now(),
    };

    const nextList = [perf, ...savedPerformances];
    setSavedPerformances(nextList);
    SilatStorage.saveSeniPerformances(nextList);

    setSaveSuccessMsg(`Hasil penampilan ${participantName} berhasil disimpan (${averageFinalScore})`);
    silatAudio.playBuzzer();
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="w-full flex flex-col gap-5 py-2">
      {/* Top Banner: Seni Title & Category */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Penilaian Kategori Seni (TGR & Solo Kreatif)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peraturan IPSI / PERSILAT: Waktu baku 3 menit (toleransi 2:55 - 3:05), Jurus Baku, dan Kemantapan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePerformance}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Penilaian</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Left Performer & Timer | Right Score Calculation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Identity & Stopwatch */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Identity Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-3.5 h-3.5" />
              <span>Data Pesilat Seni</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Kategori Seni
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'SENI_TUNGGAL', label: 'Tunggal' },
                  { id: 'SENI_GANDA', label: 'Ganda' },
                  { id: 'SENI_REGU', label: 'Regu' },
                  { id: 'SOLO_KREATIF', label: 'Solo Kreatif' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCategory(item.id as typeof category)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                      category === item.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nama Pesilat / Tim
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Kontingen / Daerah
                </label>
                <input
                  type="text"
                  value={contingent}
                  onChange={(e) => setContingent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Golongan Usia
                </label>
                <select
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value as AgeCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="USIA_DINI">Usia Dini</option>
                  <option value="PRA_REMAJA">Pra-Remaja</option>
                  <option value="REMAJA">Remaja</option>
                  <option value="DEWASA">Dewasa</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setGender('PUTRA')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border ${
                      gender === 'PUTRA'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Putra
                  </button>
                  <button
                    onClick={() => setGender('PUTRI')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border ${
                      gender === 'PUTRI'
                        ? 'bg-pink-600 text-white border-pink-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Putri
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stopwatch & Tolerance Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>STOPWATCH WAKTU PERAGAAN</span>
            </div>

            <div className={`font-score text-6xl sm:text-7xl font-bold tracking-tight select-none my-2 ${
              isTargetZone 
                ? 'text-emerald-400' 
                : isOverTime 
                ? 'text-red-500 animate-pulse' 
                : 'text-white'
            }`}>
              {formatTime(elapsed)}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs mb-4">
              <span className="text-slate-400">Target Waktu: 03:00</span>
              <span className="text-slate-600">·</span>
              <span className={`font-medium ${
                isTargetZone ? 'text-emerald-400' : isOverTime ? 'text-red-400' : 'text-slate-400'
              }`}>
                {isTargetZone 
                  ? 'Toleransi Sah (2:55 - 3:05)' 
                  : isOverTime 
                  ? 'Lebih Waktu (Kena Penalti)' 
                  : 'Kurang Waktu'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Jeda Stopwatch' : 'Mulai Stopwatch'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Multi-Judge Scoring Sheet */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Header Score summary */}
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/80 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                NILAI AKHIR PERAGAAN SENI
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Rata-rata {judgeScores.length} Juri Resmi
              </div>
            </div>
            <div className="text-right">
              <div className="font-score text-5xl font-black text-amber-300">
                {averageFinalScore}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">SKOR KELUAR</div>
            </div>
          </div>

          {/* Individual Judge Scoring Rows */}
          <div className="space-y-4">
            {judgeScores.map((j, idx) => (
              <div key={j.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center font-mono">
                      J{j.judgeId}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Lembar Penilaian Juri {j.judgeId}
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    Total Juri: <strong className="text-amber-300 text-sm">{j.totalScore}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nilai Kebenaran */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300">Nilai Kebenaran</span>
                      <span className="font-mono font-bold text-amber-400">{j.kebenaranScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      Standar 9.90 (Minus 0.01 per salah jurus / arah)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustKebenaran(idx, -0.01)}
                        className="flex-1 py-1 px-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Minus className="w-3 h-3" />
                        <span>Salah (-0.01)</span>
                      </button>
                      <button
                        onClick={() => adjustKebenaran(idx, 0.01)}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-semibold"
                        title="Tambah kembali 0.01"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Nilai Kemantapan */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300">Kemantapan / Irama</span>
                      <span className="font-mono font-bold text-blue-400">{j.kemantapanScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      Penjiwaan, tenaga & stamina (0.01 - 1.00)
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="1.00"
                      step="0.01"
                      value={j.kemantapanScore}
                      onChange={(e) => updateJudge(idx, { kemantapanScore: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hukuman Quick Toggles */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
                  <span className="text-[11px] text-slate-400 py-1">Hukuman:</span>
                  <button
                    onClick={() => updateJudge(idx, { hukumanTime: j.hukumanTime === 0 ? 0.50 : 0 })}
                    className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                      j.hukumanTime > 0
                        ? 'bg-red-900/70 border-red-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Waktu (-0.50)
                  </button>

                  <button
                    onClick={() => updateJudge(idx, { hukumanArena: j.hukumanArena === 0 ? 0.50 : 0 })}
                    className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                      j.hukumanArena > 0
                        ? 'bg-red-900/70 border-red-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Keluar Gelanggang (-0.50)
                  </button>

                  <button
                    onClick={() => updateJudge(idx, { hukumanSenjata: j.hukumanSenjata === 0 ? 0.50 : 0 })}
                    className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                      j.hukumanSenjata > 0
                        ? 'bg-red-900/70 border-red-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Senjata Jatuh (-0.50)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
