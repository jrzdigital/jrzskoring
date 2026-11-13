import React, { useState, useEffect } from 'react';
import { 
  Tablet, 
  Minus, 
  Plus, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  AlertCircle, 
  Award, 
  ListOrdered,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { Partai, NilaiJuri } from '../types/silat';
import { 
  SKOR_DASAR_PERSILAT, 
  PENALTI_KESALAHAN_GERAK, 
  formatWaktu, 
  hitungSkorJuri,
  RINCIAN_JURUS_TUNGGAL 
} from '../services/ipsiRules';
import { notificationService } from '../services/notificationService';
import { subscribeToConnectionStatus, isCloudConnectionReady } from '../services/firebase';

interface JuriTabletViewProps {
  partai: Partai | null;
  juriId: number;
  onSelectJuriId: (id: number) => void;
  onSubmitJuriScore: (score: NilaiJuri) => void;
}

export const JuriTabletView: React.FC<JuriTabletViewProps> = ({
  partai,
  juriId,
  onSelectJuriId,
  onSubmitJuriScore,
}) => {
  // Local tablet state
  const [kesalahanGerak, setKesalahanGerak] = useState<number>(0);
  const [kesalahanRincian, setKesalahanRincian] = useState<Record<number, number>>({});
  const [kemantapan, setKemantapan] = useState<number>(0.080);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPendingSync, setIsPendingSync] = useState<boolean>(false);
  const [showRincianJurus, setShowRincianJurus] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [isOnline, setIsOnline] = useState<boolean>(() => isCloudConnectionReady());

  useEffect(() => {
    const unsub = subscribeToConnectionStatus((connected) => {
      setIsOnline(connected);
    });
    return () => unsub();
  }, []);

  // Pulihkan antrean nilai tablet lokal & otomatis kirim ulang saat koneksi pulih
  useEffect(() => {
    if (!partai?.id) return;
    const draftKey = `jrz_juri_tablet_pending_${partai.id}_${juriId}`;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const draft: NilaiJuri = JSON.parse(rawDraft);
        if (isOnline) {
          onSubmitJuriScore({ ...draft, updatedAt: Date.now() });
          localStorage.removeItem(draftKey);
          setIsPendingSync(false);
          setToastMessage(`Koneksi pulih — Nilai Juri #${juriId} tersinkron real-time ke Firebase!`);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        } else {
          setIsPendingSync(true);
        }
      }
    } catch {}
  }, [isOnline, partai?.id, juriId]);

  // Load existing score for this juri if available
  useEffect(() => {
    if (partai && partai.nilaiJuri && partai.nilaiJuri[juriId]) {
      const existing = partai.nilaiJuri[juriId];
      setKesalahanGerak(existing.kesalahanGerak || 0);
      setKemantapan(existing.kemantapanSkor || 0.080);
      setIsLocked(existing.isLocked || false);
      if (existing.kesalahanRincian) {
        setKesalahanRincian(existing.kesalahanRincian);
      }
    } else {
      const draftKey = partai?.id ? `jrz_juri_tablet_pending_${partai.id}_${juriId}` : '';
      let restored = false;
      if (draftKey) {
        try {
          const rawDraft = localStorage.getItem(draftKey);
          if (rawDraft) {
            const draft: NilaiJuri = JSON.parse(rawDraft);
            setKesalahanGerak(draft.kesalahanGerak || 0);
            setKemantapan(draft.kemantapanSkor || 0.080);
            setKesalahanRincian(draft.kesalahanRincian || {});
            setIsLocked(Boolean(draft.isLocked));
            setIsPendingSync(true);
            restored = true;
          }
        } catch {}
      }
      if (!restored) {
        setKesalahanGerak(0);
        setKesalahanRincian({});
        setKemantapan(0.080);
        setIsLocked(false);
        setIsPendingSync(false);
      }
    }
  }, [partai?.id, juriId]);

  if (!partai) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border-3 border-zinc-900 rounded-2xl text-center shadow-md">
        <Tablet className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
        <h3 className="text-xl font-bold text-zinc-900">Menunggu Partai Aktif dari Operator</h3>
        <p className="text-xs text-zinc-500 mt-2">
          Layar tablet ini akan otomatis aktif begitu Operator memulai pertandingan di gelanggang.
        </p>
      </div>
    );
  }

  // Calculate live score
  const totalSkor = hitungSkorJuri(kesalahanGerak, kemantapan);
  const kebenaranSkor = Number((SKOR_DASAR_PERSILAT - kesalahanGerak * PENALTI_KESALAHAN_GERAK).toFixed(3));

  // Add mistake
  const handleTambahKesalahan = (jurusNo?: number) => {
    if (isLocked) return;
    const nextErr = kesalahanGerak + 1;
    setKesalahanGerak(nextErr);

    if (jurusNo) {
      setKesalahanRincian((prev) => ({
        ...prev,
        [jurusNo]: (prev[jurusNo] || 0) + 1,
      }));
    }
  };

  // Undo mistake
  const handleUndoKesalahan = (jurusNo?: number) => {
    if (isLocked || kesalahanGerak <= 0) return;
    setKesalahanGerak(prev => Math.max(0, prev - 1));

    if (jurusNo && kesalahanRincian[jurusNo]) {
      setKesalahanRincian((prev) => ({
        ...prev,
        [jurusNo]: Math.max(0, (prev[jurusNo] || 0) - 1),
      }));
    }
  };

  // Submit score with connection resilience (immediate cloud sync when online, safe local queue when offline)
  const handleSubmitScore = () => {
    const payload: NilaiJuri = {
      juriId,
      juriNama: `Juri ${juriId}`,
      kebenaranSkor,
      kesalahanGerak,
      kesalahanRincian,
      kemantapanSkor: kemantapan,
      totalSkorJuri: totalSkor,
      isLocked: true,
      updatedAt: Date.now(),
    };

    const draftKey = `jrz_juri_tablet_pending_${partai.id}_${juriId}`;
    if (!isOnline) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(payload));
      } catch {}
      setIsPendingSync(true);
    } else {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setIsPendingSync(false);
    }

    onSubmitJuriScore(payload);
    setIsLocked(true);
    setToastMessage(
      isOnline
        ? `Nilai Juri #${juriId} (${totalSkor.toFixed(3)}) Berhasil Diunggah ke Firebase!`
        : `Nilai Juri #${juriId} (${totalSkor.toFixed(3)}) Disimpan Lokal — Otomatis Sinkron saat Koneksi Pulih!`
    );
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    notificationService.addNotification(
      'score',
      `Nilai Juri #${juriId} Masuk`,
      `Juri ${juriId} telah mengirimkan nilai ${totalSkor.toFixed(3)} untuk partai #${partai.nomorPartai} (${partai.pesilat.nama})`,
      { partaiId: partai.id, nomorPartai: partai.nomorPartai }
    );
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      
      {/* Online Firebase Status Banner */}
      <div className={`p-3 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        !isOnline 
          ? 'bg-amber-50 border-amber-500 text-amber-950' 
          : 'bg-emerald-50 border-emerald-500 text-emerald-950'
      }`}>
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-extrabold text-sm flex items-center gap-2">
              <span>{isOnline ? 'Online (Terhubung ke Firebase Realtime Database)' : 'Koneksi Terputus (Mode Penyangga Lokal Aktif)'}</span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {!isOnline 
                ? 'Anda tetap dapat menilai & mengirim nilai. Skor tersimpan aman di perangkat dan otomatis disinkronkan ke Firebase saat koneksi pulih.' 
                : 'Skor yang dimasukkan langsung tersimpan dan tersinkronkan secara real-time melalui Firebase.'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Tablet Header with Juri Switcher & Status */}
      <div className="bg-white border-3 border-zinc-950 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 text-white font-black text-xl rounded-xl border-2 border-zinc-950 flex items-center justify-center">
            J-{juriId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase bg-zinc-900 text-white px-2 py-0.5 rounded">
                TABLET PENILAIAN JURI
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isOnline ? 'Localhost Sync' : 'Memori Lokal'}</span>
              </div>
            </div>
            <h2 className="text-lg font-black text-zinc-950">
              Juri #{juriId} - Gelanggang Terpadu
            </h2>
          </div>
        </div>

        {/* Change Juri Number on this tablet */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-600 hidden sm:inline">Pilih Juri:</label>
          <select
            value={juriId}
            onChange={(e) => onSelectJuriId(Number(e.target.value))}
            aria-label="Pilih identitas juri tablet"
            className="bg-zinc-100 border-2 border-zinc-950 text-zinc-950 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Juri {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pesilat Card with Corner Color */}
      <div className={`border-4 rounded-2xl p-4 transition-colors ${
        partai.sudut === 'MERAH' ? 'bg-red-50 border-red-600' : 'bg-blue-50 border-blue-600'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-black text-white rounded ${
                partai.sudut === 'MERAH' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                SUDUT {partai.sudut} • PARTAI #{partai.nomorPartai}
              </span>
              <span className="text-xs font-mono font-bold text-zinc-700">
                {partai.kategori} ({partai.gender})
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 mt-1">
              {partai.pesilat.nama}
            </h3>
            <p className="text-xs font-bold text-zinc-700">
              {partai.pesilat.kontingen}
            </p>
          </div>

          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase">Waktu Berjalan</span>
            <div className="text-2xl font-mono font-black text-zinc-950">
              {formatWaktu(partai.durasiBerjalanDetik)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Touch Area: 1. Kebenaran Gerak */}
      <div className="bg-white border-3 border-zinc-950 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-zinc-950">
              1. Kebenaran Gerak (Dasar 9.90)
            </h3>
            <p className="text-xs text-zinc-500">
              Setiap kesalahan gerak, urutan gerak tertukar, atau tertinggal dikenakan pengurangan <strong>-0.01</strong>
            </p>
          </div>
          <span className="text-xs font-mono font-black text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
            -0.01 / Klik
          </span>
        </div>

        {/* Big Touch Buttons for Tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Main Huge Mistake Trigger */}
          <div className="sm:col-span-8">
            <button
              onClick={() => handleTambahKesalahan()}
              disabled={isLocked}
              className={`w-full py-8 px-6 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                isLocked 
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed border-zinc-400' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Minus className="w-8 h-8 stroke-[3]" />
              <div className="text-center">
                <div>KESALAHAN GERAK</div>
                <div className="text-xs font-normal opacity-90">Klik tiap kali ada kesalahan (-0.01)</div>
              </div>
            </button>
          </div>

          {/* Counter & Undo */}
          <div className="sm:col-span-4 bg-zinc-50 border-3 border-zinc-900 rounded-2xl p-4 text-center space-y-2">
            <div className="text-[11px] font-bold uppercase text-zinc-500">
              Jumlah Kesalahan
            </div>
            <div className="text-4xl font-mono font-black text-red-600">
              {kesalahanGerak}x
            </div>
            <div className="text-xs font-mono font-bold text-zinc-700">
              Potongan: -{(kesalahanGerak * 0.01).toFixed(2)}
            </div>

            <button
              onClick={() => handleUndoKesalahan()}
              disabled={isLocked || kesalahanGerak <= 0}
              className="w-full py-2 bg-zinc-200 hover:bg-zinc-300 disabled:opacity-40 text-zinc-900 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-zinc-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batalkan (Undo)</span>
            </button>
          </div>

        </div>

        {/* Toggle Rincian 14 Jurus Baku Seni Tunggal */}
        <div className="pt-2">
          <button
            onClick={() => setShowRincianJurus(!showRincianJurus)}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4 text-blue-600" />
            <span>{showRincianJurus ? 'Sembunyikan' : 'Buka'} Rincian 14 Jurus Baku Tunggal IPSI (100 Gerakan)</span>
            {showRincianJurus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRincianJurus && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-zinc-200 pt-3">
              {RINCIAN_JURUS_TUNGGAL.map((item) => {
                const count = kesalahanRincian[item.no] || 0;
                return (
                  <div key={item.no} className="p-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-zinc-900 truncate" title={item.nama}>
                      #{item.no} {item.nama.split('-')[1] || item.nama}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">{item.gerakan} grk</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUndoKesalahan(item.no)}
                          disabled={isLocked || count <= 0}
                          className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-300 font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-red-600 px-1">{count}</span>
                        <button
                          onClick={() => handleTambahKesalahan(item.no)}
                          disabled={isLocked}
                          className="w-6 h-6 rounded bg-red-600 text-white font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Main Touch Area: 2. Kemantapan & Penghayatan */}
      <div className="bg-white border-3 border-zinc-950 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-zinc-950">
              2. Kemantapan, Penghayatan, Stamina & Ekspresi
            </h3>
            <p className="text-xs text-zinc-500">
              Rentang nilai <strong>0.010 s/d 0.100</strong> (Standar nilai tambah juri)
            </p>
          </div>
          <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
            +{kemantapan.toFixed(3)}
          </span>
        </div>

        {/* Stepper & Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => !isLocked && setKemantapan(prev => Math.max(0.010, Number((prev - 0.005).toFixed(3))))}
              disabled={isLocked || kemantapan <= 0.010}
              className="p-3 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 border-2 border-zinc-900 rounded-xl font-black text-sm cursor-pointer flex items-center gap-1"
            >
              <Minus className="w-4 h-4" />
              <span>-0.005</span>
            </button>

            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-mono font-black text-blue-700">
                +{kemantapan.toFixed(3)}
              </span>
              <div className="text-[11px] font-bold text-zinc-500">
                {kemantapan >= 0.090 ? 'Kualitas: ISTIMEWA' : kemantapan >= 0.080 ? 'Kualitas: SANGAT BAIK' : kemantapan >= 0.070 ? 'Kualitas: BAIK' : 'Kualitas: CUKUP'}
              </div>
            </div>

            <button
              onClick={() => !isLocked && setKemantapan(prev => Math.min(0.100, Number((prev + 0.005).toFixed(3))))}
              disabled={isLocked || kemantapan >= 0.100}
              className="p-3 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 border-2 border-zinc-900 rounded-xl font-black text-sm cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>+0.005</span>
            </button>
          </div>

          {/* Slider for smooth tablet swipe */}
          <input
            type="range"
            min="0.010"
            max="0.100"
            step="0.001"
            value={kemantapan}
            disabled={isLocked}
            onChange={(e) => setKemantapan(Number(parseFloat(e.target.value).toFixed(3)))}
            aria-label="Slider kemantapan dan penghayatan jurus"
            className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[0.060, 0.075, 0.085, 0.095].map((val) => (
              <button
                key={val}
                onClick={() => !isLocked && setKemantapan(val)}
                disabled={isLocked}
                className={`py-2 rounded-lg text-xs font-bold border-2 cursor-pointer transition-all ${
                  kemantapan === val 
                    ? 'bg-blue-600 text-white border-zinc-950' 
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-300'
                }`}
              >
                +{val.toFixed(3)}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Total Score & Submit Strip */}
      <div className="bg-zinc-950 text-white border-4 border-zinc-950 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              TOTAL NILAI JURI #{juriId}
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-black text-amber-400">
              {totalSkor.toFixed(3)}
            </div>
            <div className="text-xs text-zinc-300 mt-1">
              Kebenaran: <strong>{kebenaranSkor.toFixed(3)}</strong> | Kemantapan: <strong>+{kemantapan.toFixed(3)}</strong>
            </div>
          </div>

          <div className="flex gap-2">
            {!isLocked ? (
              <button
                onClick={handleSubmitScore}
                className={`w-full sm:w-auto px-8 py-4 font-black text-base uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform cursor-pointer active:scale-95 ${
                  !isOnline
                    ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                }`}
              >
                <Send className="w-5 h-5 fill-current" />
                <span>{isOnline ? 'Kirim Nilai ke Firebase' : 'Simpan Lokal (Auto-Sync Firebase)'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`px-4 py-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${
                    isPendingSync || !isOnline
                      ? 'bg-amber-950 border-amber-500 text-amber-200'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {isPendingSync || !isOnline
                      ? 'Tersimpan Lokal & Terkunci (Menunggu Auto-Sync)'
                      : 'Nilai Terkirim ke Firebase & Terkunci'}
                  </span>
                </div>
                <button
                  onClick={handleUnlock}
                  className="px-3 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  title="Buka kunci untuk mengedit"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Popup */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 border-2 border-white text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
