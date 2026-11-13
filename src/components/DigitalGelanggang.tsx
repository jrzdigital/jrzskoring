import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Award, Volume2, History, ChevronRight, FileDown, AlertTriangle } from 'lucide-react';
import { silatAudio } from '../utils/audio';

interface ActionLog {
  id: string;
  waktu: string;
  babak: number;
  sudut: 'merah' | 'biru';
  deskripsi: string;
  poin: number;
}

interface CornerState {
  nama: string;
  kontingen: string;
  skorTotal: number;
  skorBabak: { [round: number]: number };
  pukulan: number;
  tendangan: number;
  bantingan: number;
  teguran: number; // 0, 1, 2
  peringatan: number; // 0, 1, 2
}

export const DigitalGelanggang: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  // Match setup
  const [kelasTanding, setKelasTanding] = useState('Kelas C Putra (55 - 60 kg)');
  const [babakAktif, setBabakAktif] = useState<number>(1);
  const [waktuDetik, setWaktuDetik] = useState<number>(120); // 2:00
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Sudut Merah & Sudut Biru states
  const [merah, setMerah] = useState<CornerState>({
    nama: 'Bima Satria',
    kontingen: 'Jawa Tengah (Tapak Suci)',
    skorTotal: 0,
    skorBabak: { 1: 0, 2: 0, 3: 0 },
    pukulan: 0,
    tendangan: 0,
    bantingan: 0,
    teguran: 0,
    peringatan: 0
  });

  const [biru, setBiru] = useState<CornerState>({
    nama: 'Arya Senopati',
    kontingen: 'Jawa Timur (PSHT)',
    skorTotal: 0,
    skorBabak: { 1: 0, 2: 0, 3: 0 },
    pukulan: 0,
    tendangan: 0,
    bantingan: 0,
    teguran: 0,
    peringatan: 0
  });

  const timerRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setWaktuDetik(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) {
              silatAudio.playBuzzer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const toggleTimer = () => {
    if (!isRunning) {
      // Sound buzzer hanya pada saat mulai babak (BUKAN saat lanjutkan/resume dari jeda)
      if (soundEnabled && waktuDetik === 120) {
        silatAudio.playBuzzer();
      }
      setIsRunning(true);
    } else {
      // Jeda / pause: TANPA SUARA SOUND (SILENT)
      setIsRunning(false);
    }
  };

  const resetRoundTime = () => {
    setIsRunning(false);
    setWaktuDetik(120);
  };

  const nextRound = () => {
    if (babakAktif < 3) {
      setBabakAktif(prev => prev + 1);
      setWaktuDetik(120);
      setIsRunning(false);
    } else {
      setShowSummary(true);
      if (soundEnabled) {
        silatAudio.playBuzzer();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Add Score or Penalty
  const tambahPoin = (
    sudut: 'merah' | 'biru',
    tipe: 'pukulan' | 'tendangan' | 'bantingan' | 'kombinasi_pukul' | 'kombinasi_tendang' | 'kombinasi_banting',
    nilai: number,
    label: string
  ) => {
    if (soundEnabled) {
      if (tipe === 'pukulan' || tipe === 'kombinasi_pukul') silatAudio.playStrike('hit');
      else if (tipe === 'tendangan' || tipe === 'kombinasi_tendang') silatAudio.playStrike('kick');
      else silatAudio.playStrike('throw');
    }

    const updater = sudut === 'merah' ? setMerah : setBiru;

    updater(prev => {
      const babakSkor = (prev.skorBabak[babakAktif] || 0) + nilai;
      return {
        ...prev,
        skorTotal: prev.skorTotal + nilai,
        skorBabak: { ...prev.skorBabak, [babakAktif]: babakSkor },
        pukulan: tipe === 'pukulan' || tipe === 'kombinasi_pukul' ? prev.pukulan + 1 : prev.pukulan,
        tendangan: tipe === 'tendangan' || tipe === 'kombinasi_tendang' ? prev.tendangan + 1 : prev.tendangan,
        bantingan: tipe === 'bantingan' || tipe === 'kombinasi_banting' ? prev.bantingan + 1 : prev.bantingan
      };
    });

    const newLog: ActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      waktu: formatTime(waktuDetik),
      babak: babakAktif,
      sudut,
      deskripsi: `${label} (+${nilai})`,
      poin: nilai
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Penalty handler
  const beriHukuman = (
    sudut: 'merah' | 'biru',
    jenis: 'teguran_1' | 'teguran_2' | 'peringatan_1' | 'peringatan_2' | 'jatuh_sendiri',
    potongan: number,
    label: string
  ) => {
    if (soundEnabled) {
      silatAudio.playWhistle();
    }

    const updater = sudut === 'merah' ? setMerah : setBiru;

    updater(prev => {
      const babakSkor = (prev.skorBabak[babakAktif] || 0) - potongan;
      return {
        ...prev,
        skorTotal: prev.skorTotal - potongan,
        skorBabak: { ...prev.skorBabak, [babakAktif]: babakSkor },
        teguran: jenis.startsWith('teguran') ? prev.teguran + 1 : prev.teguran,
        peringatan: jenis.startsWith('peringatan') ? prev.peringatan + 1 : prev.peringatan
      };
    });

    const newLog: ActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      waktu: formatTime(waktuDetik),
      babak: babakAktif,
      sudut,
      deskripsi: `Hukuman: ${label} (-${potongan})`,
      poin: -potongan
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Reset match completely
  const resetPertandingan = () => {
    setIsRunning(false);
    setBabakAktif(1);
    setWaktuDetik(120);
    setLogs([]);
    setShowSummary(false);
    setMerah({
      nama: 'Bima Satria',
      kontingen: 'Jawa Tengah (Tapak Suci)',
      skorTotal: 0,
      skorBabak: { 1: 0, 2: 0, 3: 0 },
      pukulan: 0,
      tendangan: 0,
      bantingan: 0,
      teguran: 0,
      peringatan: 0
    });
    setBiru({
      nama: 'Arya Senopati',
      kontingen: 'Jawa Timur (PSHT)',
      skorTotal: 0,
      skorBabak: { 1: 0, 2: 0, 3: 0 },
      pukulan: 0,
      tendangan: 0,
      bantingan: 0,
      teguran: 0,
      peringatan: 0
    });
  };

  const getPemenang = () => {
    if (merah.skorTotal > biru.skorTotal) return { sudut: 'MERAH', nama: merah.nama, kontingen: merah.kontingen };
    if (biru.skorTotal > merah.skorTotal) return { sudut: 'BIRU', nama: biru.nama, kontingen: biru.kontingen };
    return { sudut: 'SERI', nama: 'Kedua Pesilat Seri', kontingen: '-' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Sistem Penilaian Resmi IPSI (Peraturan Pertandingan 2024/2026)
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-stone-100 mt-1">
              Papan Skor Pertandingan Digital Gelanggang
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
              <span>Matras A</span>
              <span aria-hidden="true">·</span>
              <span>Kategori Tanding</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-300 font-medium">{kelasTanding}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <select
              value={kelasTanding}
              onChange={e => setKelasTanding(e.target.value)}
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-md px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option>Kelas A Putra (45 - 50 kg)</option>
              <option>Kelas B Putra (50 - 55 kg)</option>
              <option>Kelas C Putra (55 - 60 kg)</option>
              <option>Kelas D Putra (60 - 65 kg)</option>
              <option>Kelas Bebas Putra (&gt; 65 kg)</option>
              <option>Kelas C Putri (55 - 60 kg)</option>
            </select>

            <button
              onClick={() => setShowSummary(true)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Lembar Skor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Arena Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sudut Merah Column (Right) */}
        <div className="lg:col-span-5 lg:order-3 bg-gradient-to-b from-red-950/40 via-stone-900 to-stone-900 border-2 border-red-600/60 rounded-xl p-5 shadow-lg shadow-red-950/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-red-800/40 pb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-red-400 bg-red-950/70 px-2 py-0.5 rounded border border-red-700/50">
                  SUDUT MERAH
                </span>
                <input
                  type="text"
                  value={merah.nama}
                  onChange={e => setMerah({ ...merah, nama: e.target.value })}
                  className="mt-2 block text-lg font-bold text-stone-100 bg-transparent border-b border-red-800/30 focus:border-red-500 focus:outline-none w-full"
                  placeholder="Nama Pesilat"
                />
                <input
                  type="text"
                  value={merah.kontingen}
                  onChange={e => setMerah({ ...merah, kontingen: e.target.value })}
                  className="text-xs text-stone-400 bg-transparent border-none focus:outline-none w-full mt-0.5"
                  placeholder="Kontingen / Perguruan"
                />
              </div>

              {/* Total Score Merah */}
              <div className="text-right pl-4">
                <div className="text-xs text-red-300 font-medium">SKOR TOTAL</div>
                <div className="text-5xl md:text-6xl font-black text-red-400 font-mono-numbers tracking-tight">
                  {merah.skorTotal}
                </div>
              </div>
            </div>

            {/* Babak Breakdown Merah */}
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-stone-800 text-center">
              {[1, 2, 3].map(rnd => (
                <div
                  key={rnd}
                  className={`p-1.5 rounded ${
                    babakAktif === rnd ? 'bg-red-900/30 border border-red-700/40' : 'bg-stone-900/60'
                  }`}
                >
                  <div className="text-[11px] text-stone-400">Babak {rnd}</div>
                  <div className="text-sm font-bold font-mono-numbers text-stone-200">
                    {merah.skorBabak[rnd] || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center justify-between text-xs text-stone-400 py-2.5 border-b border-stone-800">
              <div>Pukulan: <span className="font-semibold text-stone-200">{merah.pukulan}</span></div>
              <span aria-hidden="true">·</span>
              <div>Tendangan: <span className="font-semibold text-stone-200">{merah.tendangan}</span></div>
              <span aria-hidden="true">·</span>
              <div>Bantingan: <span className="font-semibold text-stone-200">{merah.bantingan}</span></div>
            </div>
          </div>

          {/* Action Scoring Buttons Merah */}
          <div className="pt-4 space-y-2.5">
            <div className="text-xs font-semibold text-red-300 uppercase tracking-wider">
              Serangan Masuk Sah
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => tambahPoin('merah', 'pukulan', 1, 'Pukulan Masuk')}
                className="py-2.5 px-2 bg-red-900/50 hover:bg-red-800/70 border border-red-700/60 text-red-100 rounded-md text-xs font-semibold transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <span>Pukulan</span>
                <span className="text-[10px] font-mono-numbers text-red-300">+1 Poin</span>
              </button>

              <button
                onClick={() => tambahPoin('merah', 'tendangan', 2, 'Tendangan Masuk')}
                className="py-2.5 px-2 bg-red-900/50 hover:bg-red-800/70 border border-red-700/60 text-red-100 rounded-md text-xs font-semibold transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <span>Tendangan</span>
                <span className="text-[10px] font-mono-numbers text-red-300">+2 Poin</span>
              </button>

              <button
                onClick={() => tambahPoin('merah', 'bantingan', 3, 'Bantingan Sah')}
                className="py-2.5 px-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-xs font-bold transition-all active:scale-95 shadow-md flex flex-col items-center justify-center"
              >
                <span>Bantingan Sah</span>
                <span className="text-[10px] font-mono-numbers text-red-100">+3 Poin</span>
              </button>
            </div>

            {/* Tangkisan + Balas Combo */}
            <div className="text-xs font-semibold text-stone-400 mt-2">
              Rangkaian Pembelaan & Serangan
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => tambahPoin('merah', 'kombinasi_pukul', 2, 'Tangkis + Balas Pukul')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Pukul (+2)
              </button>
              <button
                onClick={() => tambahPoin('merah', 'kombinasi_tendang', 3, 'Tangkis + Balas Tendang')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Tendang (+3)
              </button>
              <button
                onClick={() => tambahPoin('merah', 'kombinasi_banting', 4, 'Tangkis + Balas Banting')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Banting (+4)
              </button>
            </div>

            {/* Hukuman Merah */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-amber-500 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Pelanggaran & Hukuman</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  onClick={() => beriHukuman('merah', 'teguran_1', 1, 'Teguran I')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-red-950/60 border border-stone-800 hover:border-red-800 text-[11px] text-stone-300 rounded"
                >
                  Teguran I (-1)
                </button>
                <button
                  onClick={() => beriHukuman('merah', 'teguran_2', 2, 'Teguran II')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-red-950/60 border border-stone-800 hover:border-red-800 text-[11px] text-stone-300 rounded"
                >
                  Teguran II (-2)
                </button>
                <button
                  onClick={() => beriHukuman('merah', 'peringatan_1', 5, 'Peringatan I')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-red-950/60 border border-stone-800 hover:border-red-800 text-[11px] text-stone-300 rounded"
                >
                  Peringatan I (-5)
                </button>
                <button
                  onClick={() => beriHukuman('merah', 'jatuh_sendiri', 1, 'Jatuh Sendiri')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-red-950/60 border border-stone-800 hover:border-red-800 text-[11px] text-stone-300 rounded"
                >
                  Jatuh Sendiri (-1)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Arena Control Column */}
        <div className="lg:col-span-2 lg:order-2 bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col items-center justify-between">
          <div className="w-full text-center">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              BABAK {babakAktif} DARI 3
            </span>

            {/* Timer Clock */}
            <div className="my-4 py-3 px-2 bg-stone-950 rounded-lg border border-stone-800 text-center">
              <div className="text-3xl md:text-4xl font-black font-mono-numbers text-amber-400 tracking-wider">
                {formatTime(waktuDetik)}
              </div>
              <div className="text-[10px] text-stone-500 mt-1 uppercase font-medium">
                {isRunning ? 'Waktu Berjalan' : 'Waktu Berhenti'}
              </div>
            </div>

            {/* Main Timer Action */}
            <button
              onClick={toggleTimer}
              className={`w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-stone-100'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Waktu</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Mulai Pertandingan</span>
                </>
              )}
            </button>

            {/* Sound Signal Gong Trigger */}
            <button
              onClick={() => {
                if (soundEnabled) silatAudio.playGong();
              }}
              className="w-full mt-2 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded border border-stone-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Bunyikan Gong</span>
            </button>
          </div>

          {/* Round Navigation */}
          <div className="w-full space-y-2 mt-4 pt-4 border-t border-stone-800 text-center">
            <div className="text-xs text-stone-400">Kontrol Wasit</div>

            <button
              onClick={nextRound}
              className="w-full py-2 px-3 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-semibold rounded border border-stone-700 transition-colors flex items-center justify-center gap-1"
            >
              <span>{babakAktif === 3 ? 'Selesaikan Laga' : 'Lanjut Babak Berikutnya'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetRoundTime}
              className="w-full py-1.5 px-2 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs rounded border border-stone-800 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Waktu Babak</span>
            </button>

            <button
              onClick={resetPertandingan}
              className="w-full py-1.5 px-2 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              Reset Seluruh Laga
            </button>
          </div>
        </div>

        {/* Sudut Biru Column (Left) */}
        <div className="lg:col-span-5 lg:order-1 bg-gradient-to-b from-blue-950/40 via-stone-900 to-stone-900 border-2 border-blue-600/60 rounded-xl p-5 shadow-lg shadow-blue-950/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-blue-800/40 pb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-700/50">
                  SUDUT BIRU
                </span>
                <input
                  type="text"
                  value={biru.nama}
                  onChange={e => setBiru({ ...biru, nama: e.target.value })}
                  className="mt-2 block text-lg font-bold text-stone-100 bg-transparent border-b border-blue-800/30 focus:border-blue-500 focus:outline-none w-full"
                  placeholder="Nama Pesilat"
                />
                <input
                  type="text"
                  value={biru.kontingen}
                  onChange={e => setBiru({ ...biru, kontingen: e.target.value })}
                  className="text-xs text-stone-400 bg-transparent border-none focus:outline-none w-full mt-0.5"
                  placeholder="Kontingen / Perguruan"
                />
              </div>

              {/* Total Score Biru */}
              <div className="text-right pl-4">
                <div className="text-xs text-blue-300 font-medium">SKOR TOTAL</div>
                <div className="text-5xl md:text-6xl font-black text-blue-400 font-mono-numbers tracking-tight">
                  {biru.skorTotal}
                </div>
              </div>
            </div>

            {/* Babak Breakdown Biru */}
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-stone-800 text-center">
              {[1, 2, 3].map(rnd => (
                <div
                  key={rnd}
                  className={`p-1.5 rounded ${
                    babakAktif === rnd ? 'bg-blue-900/30 border border-blue-700/40' : 'bg-stone-900/60'
                  }`}
                >
                  <div className="text-[11px] text-stone-400">Babak {rnd}</div>
                  <div className="text-sm font-bold font-mono-numbers text-stone-200">
                    {biru.skorBabak[rnd] || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center justify-between text-xs text-stone-400 py-2.5 border-b border-stone-800">
              <div>Pukulan: <span className="font-semibold text-stone-200">{biru.pukulan}</span></div>
              <span aria-hidden="true">·</span>
              <div>Tendangan: <span className="font-semibold text-stone-200">{biru.tendangan}</span></div>
              <span aria-hidden="true">·</span>
              <div>Bantingan: <span className="font-semibold text-stone-200">{biru.bantingan}</span></div>
            </div>
          </div>

          {/* Action Scoring Buttons Biru */}
          <div className="pt-4 space-y-2.5">
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Serangan Masuk Sah
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => tambahPoin('biru', 'pukulan', 1, 'Pukulan Masuk')}
                className="py-2.5 px-2 bg-blue-900/50 hover:bg-blue-800/70 border border-blue-700/60 text-blue-100 rounded-md text-xs font-semibold transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <span>Pukulan</span>
                <span className="text-[10px] font-mono-numbers text-blue-300">+1 Poin</span>
              </button>

              <button
                onClick={() => tambahPoin('biru', 'tendangan', 2, 'Tendangan Masuk')}
                className="py-2.5 px-2 bg-blue-900/50 hover:bg-blue-800/70 border border-blue-700/60 text-blue-100 rounded-md text-xs font-semibold transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <span>Tendangan</span>
                <span className="text-[10px] font-mono-numbers text-blue-300">+2 Poin</span>
              </button>

              <button
                onClick={() => tambahPoin('biru', 'bantingan', 3, 'Bantingan Sah')}
                className="py-2.5 px-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-xs font-bold transition-all active:scale-95 shadow-md flex flex-col items-center justify-center"
              >
                <span>Bantingan Sah</span>
                <span className="text-[10px] font-mono-numbers text-blue-100">+3 Poin</span>
              </button>
            </div>

            {/* Tangkisan + Balas Combo */}
            <div className="text-xs font-semibold text-stone-400 mt-2">
              Rangkaian Pembelaan & Serangan
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => tambahPoin('biru', 'kombinasi_pukul', 2, 'Tangkis + Balas Pukul')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Pukul (+2)
              </button>
              <button
                onClick={() => tambahPoin('biru', 'kombinasi_tendang', 3, 'Tangkis + Balas Tendang')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Tendang (+3)
              </button>
              <button
                onClick={() => tambahPoin('biru', 'kombinasi_banting', 4, 'Tangkis + Balas Banting')}
                className="py-2 px-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[11px] transition-colors"
              >
                Tangkis + Banting (+4)
              </button>
            </div>

            {/* Hukuman Biru */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-amber-500 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Pelanggaran & Hukuman</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  onClick={() => beriHukuman('biru', 'teguran_1', 1, 'Teguran I')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-blue-950/60 border border-stone-800 hover:border-blue-800 text-[11px] text-stone-300 rounded"
                >
                  Teguran I (-1)
                </button>
                <button
                  onClick={() => beriHukuman('biru', 'teguran_2', 2, 'Teguran II')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-blue-950/60 border border-stone-800 hover:border-blue-800 text-[11px] text-stone-300 rounded"
                >
                  Teguran II (-2)
                </button>
                <button
                  onClick={() => beriHukuman('biru', 'peringatan_1', 5, 'Peringatan I')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-blue-950/60 border border-stone-800 hover:border-blue-800 text-[11px] text-stone-300 rounded"
                >
                  Peringatan I (-5)
                </button>
                <button
                  onClick={() => beriHukuman('biru', 'jatuh_sendiri', 1, 'Jatuh Sendiri')}
                  className="py-1.5 px-1 bg-stone-900 hover:bg-blue-950/60 border border-stone-800 hover:border-blue-800 text-[11px] text-stone-300 rounded"
                >
                  Jatuh Sendiri (-1)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Action Feed */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
            <History className="w-4 h-4 text-amber-400" />
            <span>Riwayat Aksi & Putusan Juri Gelanggang</span>
          </div>
          <div className="text-xs text-stone-500">
            {logs.length} catatan aksi
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            Belum ada catatan aksi. Tekan tombol serangan atau hukuman untuk merekam poin.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2 pt-3 pr-1">
            {logs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs p-2 rounded bg-stone-950 border border-stone-800/80"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.sudut === 'merah'
                        ? 'bg-red-950 text-red-300 border border-red-800/60'
                        : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                    }`}
                  >
                    {log.sudut}
                  </span>
                  <span className="text-stone-300">{log.deskripsi}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-400">
                  <span>Babak {log.babak}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-numbers">{log.waktu}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Scorecard Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/40 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="text-center border-b border-stone-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-stone-100">
                Lembar Hasil Pertandingan IPSI
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Kategori {kelasTanding} · 3 Babak Resmi
              </p>
            </div>

            {/* Winner Announcement Banner */}
            <div className="my-5 p-4 rounded-lg bg-stone-950 border border-stone-800 text-center">
              <div className="text-xs text-stone-400 uppercase font-semibold">
                Keputusan Pemenang
              </div>
              <div
                className={`text-2xl font-bold font-display mt-1 ${
                  getPemenang().sudut === 'MERAH'
                    ? 'text-red-400'
                    : getPemenang().sudut === 'BIRU'
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                {getPemenang().sudut === 'SERI'
                  ? 'HASIL SERI'
                  : `PEMENANG SUDUT ${getPemenang().sudut}`}
              </div>
              <div className="text-sm text-stone-200 mt-0.5">
                {getPemenang().nama} ({getPemenang().kontingen})
              </div>
            </div>

            {/* Comparison Table */}
            <div className="border border-stone-800 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-stone-800/80 p-2.5 font-bold text-center text-stone-300">
                <div>Sudut Merah</div>
                <div>Rincian Nilai</div>
                <div>Sudut Biru</div>
              </div>

              <div className="divide-y divide-stone-800 bg-stone-950">
                <div className="grid grid-cols-3 p-2.5 text-center">
                  <div className="font-bold text-red-400">{merah.skorBabak[1] || 0}</div>
                  <div className="text-stone-400">Babak 1</div>
                  <div className="font-bold text-blue-400">{biru.skorBabak[1] || 0}</div>
                </div>

                <div className="grid grid-cols-3 p-2.5 text-center">
                  <div className="font-bold text-red-400">{merah.skorBabak[2] || 0}</div>
                  <div className="text-stone-400">Babak 2</div>
                  <div className="font-bold text-blue-400">{biru.skorBabak[2] || 0}</div>
                </div>

                <div className="grid grid-cols-3 p-2.5 text-center">
                  <div className="font-bold text-red-400">{merah.skorBabak[3] || 0}</div>
                  <div className="text-stone-400">Babak 3</div>
                  <div className="font-bold text-blue-400">{biru.skorBabak[3] || 0}</div>
                </div>

                <div className="grid grid-cols-3 p-3 text-center bg-stone-900/60 font-bold">
                  <div className="text-xl font-mono-numbers text-red-400">{merah.skorTotal}</div>
                  <div className="text-stone-200 self-center">TOTAL AKHIR</div>
                  <div className="text-xl font-mono-numbers text-blue-400">{biru.skorTotal}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold rounded-md transition-colors"
              >
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
