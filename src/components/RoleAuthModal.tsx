import React, { useState, useEffect, useRef } from 'react';
import { useSilat, ROLE_PINS } from '../context/SilatContext';
import { UserRole } from '../types/silat';
import {
  Lock,
  ShieldCheck,
  X,
  AlertCircle,
  KeyRound,
  UserCheck,
  Keyboard,
  ArrowLeft,
  Hand
} from 'lucide-react';

interface RoleAuthModalProps {
  targetRole: UserRole;
  onSuccess: () => void;
  onClose: () => void;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  targetRole,
  onSuccess,
  onClose
}) => {
  const { login, config } = useSilat();
  const [pin, setPin] = useState('');
  const [selectedJuryNum, setSelectedJuryNum] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState('');

  const totalJuries = targetRole === 'juri' 
    ? Math.max(config?.jurorsCountTanding || 3, config?.jurorsCountSeni || 5)
    : 5;
  const juryList = Array.from({ length: totalJuries }, (_, i) => i + 1);

  // Untuk panel juri: step 'select' terlebih dahulu, baru setelah pilih juri melangkah ke step 'pin'
  const [juryStep, setJuryStep] = useState<'select' | 'pin'>(
    targetRole === 'juri' ? 'select' : 'pin'
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const roleMeta: Record<UserRole, { title: string; subtitle: string; iconColor: string; defaultPin: string }> = {
    secretary: {
      title: 'Panel Sekretaris Pertandingan',
      subtitle: 'Akses administrator untuk mengatur jadwal partai, kategori, data atlet, dan konfigurasi gelanggang.',
      iconColor: 'bg-indigo-600',
      defaultPin: '211096'
    },
    dewan: {
      title: 'Panel Dewan Pertandingan (Ketua Wasit)',
      subtitle: 'Akses dewan wasit untuk validasi konsensus juri, sah/batal jatuhan, koreksi nilai, dan hukuman resmi.',
      iconColor: 'bg-amber-600',
      defaultPin: '211096'
    },
    timer: {
      title: 'Panel Pencatat Waktu (Timer Operator)',
      subtitle: 'Akses operator stopwatch babak, jeda istirahat, bunyi gong resmi, dan sirene akhir ronde.',
      iconColor: 'bg-emerald-600',
      defaultPin: '211096'
    },
    juri: {
      title: `Panel Juri Penilai (Juri 1 - ${totalJuries})`,
      subtitle: 'Pilih nomor meja juri Anda dan masukkan PIN untuk membuka antarmuka penilaian touch-screen.',
      iconColor: 'bg-red-600',
      defaultPin: '211096'
    },
    monitor: {
      title: 'Panel Monitor (Scoreboard TV)',
      subtitle: 'Tampilan layar besar untuk penonton dan official. Mode publik tanpa proteksi PIN.',
      iconColor: 'bg-blue-600',
      defaultPin: ''
    },
    laporan: {
      title: 'Panel Laporan & Berita Acara',
      subtitle: 'Rekapitulasi hasil pertandingan, statistik, dan ekspor dokumen PDF resmi IPSI.',
      iconColor: 'bg-purple-600',
      defaultPin: ''
    }
  };

  const meta = roleMeta[targetRole];
  const requiredPin = ROLE_PINS[targetRole];

  // Auto-submit immediately when correct PIN is entered without requiring Enter key
  useEffect(() => {
    if (!requiredPin || (targetRole === 'juri' && juryStep !== 'pin')) {
      return;
    }

    if (pin.length === requiredPin.length) {
      if (pin === requiredPin) {
        const res = login(targetRole, pin, targetRole === 'juri' ? selectedJuryNum : undefined);
        if (res.success) {
          onSuccess();
        } else {
          setErrorMsg(res.error || 'PIN otorisasi tidak valid!');
          setPin('');
        }
      } else {
        setErrorMsg('PIN otorisasi tidak valid!');
        setPin('');
      }
    }
  }, [pin, requiredPin, targetRole, selectedJuryNum, juryStep, login, onSuccess]);

  // Auto focus input whenever PIN dialog is displayed
  useEffect(() => {
    if (requiredPin && (targetRole !== 'juri' || juryStep === 'pin')) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [juryStep, targetRole, requiredPin]);

  // Global Device Keyboard Listener (0-9, Backspace, Enter, Esc)
  // Prevents double-input by skipping hardware listener if inputRef is active
  useEffect(() => {
    // Only capture keyboard when in PIN entry view
    if (!requiredPin || (targetRole === 'juri' && juryStep !== 'pin')) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // If the input itself is active, the input's onChange handles digit typing!
      // Do NOT append digits here to avoid duplicate input on hardware/mobile keyboards.
      if (document.activeElement === inputRef.current || e.target === inputRef.current) {
        if (e.key === 'Escape') {
          if (targetRole === 'juri' && juryStep === 'pin') {
            setJuryStep('select');
            setPin('');
            setErrorMsg('');
          } else {
            onClose();
          }
        }
        return;
      }

      // If user clicked elsewhere outside input, capture keys here
      if (
        (e.key >= '0' && e.key <= '9') ||
        (e.code && e.code.startsWith('Numpad') && !isNaN(parseInt(e.key, 10)))
      ) {
        e.preventDefault();
        setPin((prev) => {
          if (prev.length < 6) {
            setErrorMsg('');
            return prev + e.key;
          }
          return prev;
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Escape') {
        if (targetRole === 'juri' && juryStep === 'pin') {
          setJuryStep('select');
          setPin('');
          setErrorMsg('');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [juryStep, targetRole, requiredPin, onClose]);

  const handleKeyClick = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => (prev + val).slice(0, 6));
      setErrorMsg('');
      inputRef.current?.focus();
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6); // Numbers only, max 6
    setPin(rawVal);
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!requiredPin) {
      login(targetRole);
      onSuccess();
      return;
    }

    const res = login(targetRole, pin, targetRole === 'juri' ? selectedJuryNum : undefined);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'PIN otorisasi tidak valid!');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleSelectJury = (num: number) => {
    setSelectedJuryNum(num);
    setPin('');
    setErrorMsg('');
    setJuryStep('pin'); // Baru dimunculkan dialog sandi login setelah juri dipilih!
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Hidden real input field for hardware / mobile software keyboards */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={pin}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
      />

      <div className="relative w-full max-w-md my-auto bg-[#070e1c] border-2 border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.85)] overflow-hidden p-5 sm:p-6 hud-bracket cyber-glass-deep text-slate-100 font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#091326] border border-cyan-500/20 transition-colors cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5 text-cyan-400" />
        </button>

        {/* ================= STEP 1 UNTUK PANEL JURI: PILIH JURI 1 - 5 TERLEBIH DAHULU ================= */}
        {targetRole === 'juri' && juryStep === 'select' ? (
          <div>
            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md glow-red border border-red-400 shrink-0">
                <Hand className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-black text-white leading-tight uppercase tracking-wide">
                  Pilih Meja Juri Penilai
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Panel Skoring Juri (IPSI 2026)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Silakan pilih nomor meja juri Anda terlebih dahulu. Dialog sandi login akan ditampilkan setelah meja juri dipilih.
            </p>

            {/* List Juri Sesuai Konfigurasi Turnamen */}
            <div className={`space-y-2 mb-4 ${totalJuries > 5 ? 'max-h-80 overflow-y-auto pr-1 custom-inner-scrollbar' : ''}`}>
              {juryList.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectJury(num)}
                  className="w-full py-3 px-4 rounded-xl font-mono font-extrabold text-sm transition-all flex items-center justify-between cursor-pointer bg-[#040813] text-slate-200 border border-cyan-500/30 hover:border-red-500 hover:bg-[#091326] group active:scale-98 shadow-sm hover:glow-red"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-black bg-[#070e1c] text-cyan-300 border border-cyan-500/30 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-400 transition-colors">
                      {num}
                    </span>
                    <span className="text-left font-bold text-white group-hover:text-red-400">
                      Juri Meja #{num}
                    </span>
                  </span>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#070e1c] text-cyan-400 border border-cyan-500/20 group-hover:bg-red-950/80 group-hover:text-red-200 transition-colors">
                    {num <= 3 ? 'Tanding & Seni' : 'Khusus Seni'} →
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-cyan-400/90 text-center font-mono bg-[#040813] p-2.5 rounded-xl border border-cyan-500/30">
              *Tanding menggunakan Juri 1, 2, 3. Kategori Seni menggunakan {config?.jurorsCountSeni || 5} Juri (Sesuai Konfigurasi Sekretaris).
            </p>
          </div>
        ) : (
          /* ================= STEP 2: DIALOG SANDI LOGIN (DITAMPILKAN SETELAH MEMILIH JURI ATAU ROLE LAIN) ================= */
          <div>
            {/* Tombol kembali ke pemilihan juri jika role adalah juri */}
            {targetRole === 'juri' && (
              <button
                type="button"
                onClick={() => {
                  setJuryStep('select');
                  setPin('');
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-white mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti Nomor Meja Juri</span>
              </button>
            )}

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${meta.iconColor} flex items-center justify-center text-white shadow-md border border-cyan-400/40 shrink-0`}>
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-black text-white leading-tight uppercase">
                  {targetRole === 'juri' ? `Login Juri Meja #${selectedJuryNum}` : meta.title}
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {targetRole === 'juri'
                    ? `Otentikasi Sandi Meja Juri #${selectedJuryNum}`
                    : 'Otentikasi Multi-Peran Terproteksi'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              {targetRole === 'juri'
                ? `Masukkan sandi otorisasi PIN untuk membuka antarmuka penilaian digital Juri Meja #${selectedJuryNum}.`
                : meta.subtitle}
            </p>

            {/* PIN Entry (Only if required) */}
            {requiredPin ? (
              <div>
                {/* PIN Display Dots & Input area */}
                <div
                  className="mb-4 cursor-pointer"
                  onClick={() => inputRef.current?.focus()}
                  title="Klik untuk mengetik dengan keyboard perangkat"
                >
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      Masukkan Sandi PIN
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold font-mono">
                      (Default: {meta.defaultPin})
                    </span>
                  </label>

                  <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-3.5 bg-[#040813] rounded-xl border border-cyan-500/40 focus-within:border-cyan-400 transition-colors shadow-inner">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 transition-all ${
                          pin.length > idx
                            ? 'bg-cyan-400 border-cyan-300 scale-125 glow-cyan'
                            : 'border-cyan-800 bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Keyboard indicator info */}
                  <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] font-mono font-semibold text-cyan-400/80">
                    <Keyboard className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Dapat diketik langsung dengan keyboard perangkat atau tombol layar</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono font-bold flex items-center gap-1.5 animate-shake glow-red">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Numeric Keypad for Touch Screen devices */}
                <div className="grid grid-cols-3 gap-2 mb-4 font-mono">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeyClick(digit)}
                      className="py-2.5 text-lg font-black rounded-xl bg-[#040813] hover:bg-[#091326] text-white border border-cyan-500/30 active:scale-95 transition-transform cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="py-2.5 text-xs font-bold rounded-xl bg-[#040813] text-slate-400 hover:text-white hover:bg-[#091326] border border-cyan-500/30 cursor-pointer"
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeyClick('0')}
                    className="py-2.5 text-lg font-black rounded-xl bg-[#040813] hover:bg-[#091326] text-white border border-cyan-500/30 active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2.5 text-xs font-bold rounded-xl bg-[#040813] text-slate-400 hover:text-white hover:bg-[#091326] border border-cyan-500/30 cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={pin.length < 6}
                  className={`w-full py-3 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    pin.length >= 6
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 glow-gold border border-amber-300 cursor-pointer active:scale-98'
                      : 'bg-[#040813] text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  {targetRole === 'juri'
                    ? `Verifikasi & Masuk Juri Meja #${selectedJuryNum}`
                    : 'Verifikasi & Buka Panel'}
                </button>
              </div>
            ) : (
              <div>
                <div className="p-4 bg-emerald-950/60 rounded-xl border border-emerald-500/50 mb-5 text-emerald-300 text-xs font-medium font-sans">
                  Panel ini dapat diakses secara langsung tanpa memerlukan PIN proteksi.
                </div>
                <button
                  onClick={() => handleSubmit()}
                  className="w-full py-3 rounded-xl font-mono font-extrabold text-sm bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg glow-blue border border-blue-400 transition-all active:scale-98 cursor-pointer"
                >
                  <UserCheck className="w-5 h-5" />
                  Masuk ke {meta.title}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
