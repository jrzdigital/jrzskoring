import React, { useState, useRef } from 'react';
import { useSilat } from '../context/SilatContext';
import {
  Download,
  Upload,
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Swords,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import {
  exportTournamentBackupJSON,
  parseAndValidateBackupJSON,
  SilatBackupPackage,
  BackupValidationResult
} from '../utils/backupHelper';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    athletes,
    matches,
    config,
    activeMatchId,
    importBackupData
  } = useSilat();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SilatBackupPackage | null>(null);
  const [previewStats, setPreviewStats] = useState<BackupValidationResult['stats'] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const res = exportTournamentBackupJSON(athletes, matches, config, activeMatchId);
      const msg = `Cadangan berhasil diunduh (${res.filename}): ${res.athletesCount} atlet dan ${res.matchesCount} partai pertandingan tersimpan.`;
      setSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(`Gagal mengekspor data cadangan: ${err.message || 'Kesalahan sistem'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsImporting(true);

    try {
      const result = await parseAndValidateBackupJSON(file);
      if (!result.isValid || !result.package) {
        setErrorMsg(result.errorMessage || 'File cadangan JSON tidak valid atau rusak.');
        setSelectedPackage(null);
        setPreviewStats(null);
      } else {
        setSelectedPackage(result.package);
        setPreviewStats(result.stats || null);
      }
    } catch (err: any) {
      setErrorMsg(`Gagal memproses file: ${err.message || 'Format tidak valid'}`);
      setSelectedPackage(null);
      setPreviewStats(null);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (!selectedPackage) return;

    setErrorMsg(null);
    try {
      const result = importBackupData(selectedPackage);
      if (result.success) {
        const msg = `Berhasil memulihkan ${result.athletesCount} atlet dan ${result.matchesCount} partai pertandingan dari berkas cadangan!`;
        setSuccessMsg(msg);
        setSelectedPackage(null);
        setPreviewStats(null);
        if (onSuccess) onSuccess(msg);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Gagal memulihkan data dari berkas cadangan. Periksa kembali struktur file.');
      }
    } catch (err: any) {
      setErrorMsg(`Terjadi kesalahan saat pemulihan: ${err.message || 'Error'}`);
    }
  };

  const handleCancelPreview = () => {
    setSelectedPackage(null);
    setPreviewStats(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-[#090f1e] border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/30 bg-[#050914]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <span>CADANGAN & PEMULIHAN DATA TURNAMEN (JSON)</span>
              </h2>
              <p className="text-xs text-cyan-300/80 font-medium">
                Ekspor & impor seluruh data atlet, bagan braket, dan jadwal pertandingan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-cyan-500/20 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-inner-scrollbar text-xs">
          
          {/* Notification Messages */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 flex items-start gap-2.5 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="font-semibold text-xs leading-relaxed">{successMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/70 text-red-300 flex items-start gap-2.5 shadow-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="font-semibold text-xs leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Ringkasan Data Saat Ini */}
          <div className="bg-[#050b18] border border-cyan-500/25 rounded-xl p-4 space-y-2.5">
            <div className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Status Data Sistem Saat Ini (Penyimpanan Lokal Komputer)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-[#091326] border border-cyan-500/20 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 font-medium">Total Atlet</div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {athletes.length}
                </div>
              </div>

              <div className="bg-[#091326] border border-cyan-500/20 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 font-medium">Total Partai</div>
                <div className="text-base sm:text-lg font-mono font-black text-amber-400 mt-0.5">
                  {matches.length}
                </div>
              </div>

              <div className="bg-[#091326] border border-cyan-500/20 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 font-medium">Partai Selesai</div>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-400 mt-0.5">
                  {matches.filter((m) => m.status === 'FINISHED' || m.result).length}
                </div>
              </div>

              <div className="bg-[#091326] border border-cyan-500/20 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 font-medium">Gelanggang</div>
                <div className="text-xs sm:text-sm font-mono font-bold text-cyan-300 mt-1 truncate">
                  {config.arenaName || 'Gelanggang 1'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono truncate pt-1">
              Kejuaraan: <span className="text-white font-semibold">{config.tournamentName || 'Kejuaraan Pencak Silat'}</span>
            </div>
          </div>

          {/* Opsi 1: Ekspor File Cadangan (JSON) */}
          <div className="bg-[#060c1c] border border-blue-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-600/40">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-mono font-black text-white uppercase">
                    1. Ekspor Cadangan Data (.JSON)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Simpan salinan cadangan seluruh data atlet & pertandingan ke harddisk/flashdisk
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Berkas yang diunduh mencakup seluruh informasi registrasi atlet, bagan braket, jadwal pertandingan, dan konfigurasi turnamen dalam format <strong className="text-blue-300">JSON</strong> lokal yang dapat disimpan dan dibuka kapan saja tanpa koneksi internet.
            </p>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || athletes.length === 0}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-black bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border border-blue-400"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Sedang Mengunduh...' : 'Unduh Cadangan Data (.JSON)'}</span>
            </button>
          </div>

          {/* Opsi 2: Impor & Pulihkan Cadangan (JSON) */}
          <div className="bg-[#060c1c] border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-600/40">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-mono font-black text-white uppercase">
                    2. Impor & Pulihkan Cadangan Data (.JSON)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Muat ulang data pertandingan dan atlet dari berkas cadangan JSON yang pernah disimpan
                  </p>
                </div>
              </div>
            </div>

            {/* Jika belum ada file terpilih untuk pratinjau */}
            {!selectedPackage ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pilih file cadangan JSON dari komputer Anda untuk memeriksa isi data sebelum dilakukan pemulihan ke sistem.
                </p>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl text-xs font-mono font-black bg-purple-700 hover:bg-purple-600 active:scale-95 text-white shadow-md cursor-pointer transition-transform flex items-center justify-center gap-2 border border-purple-400">
                    <Upload className="w-4 h-4" />
                    <span>{isImporting ? 'Memeriksa File...' : 'Pilih File Cadangan JSON'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Format yang didukung: *.json</span>
                </div>
              </div>
            ) : (
              /* Pratinjau Data Sebelum Pemulihan */
              <div className="bg-[#0c081c] border-2 border-amber-500/50 rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Konfirmasi Pemulihan Cadangan Data</span>
                  </div>
                  <button
                    onClick={handleCancelPreview}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Batal Pilih
                  </button>
                </div>

                <div className="bg-[#140b2a] rounded-lg p-3 space-y-1.5 border border-amber-500/30 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kejuaraan:</span>
                    <span className="text-white font-bold">{previewStats?.tournamentName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gelanggang:</span>
                    <span className="text-cyan-300 font-mono">{previewStats?.arenaName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Atlet:</span>
                    <span className="text-emerald-400 font-mono font-bold">{previewStats?.totalAthletes || 0} Atlet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Partai Pertandingan:</span>
                    <span className="text-amber-400 font-mono font-bold">{previewStats?.totalMatches || 0} Partai</span>
                  </div>
                  {previewStats?.exportedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Waktu Cadangan Dibuat:</span>
                      <span className="text-slate-300 font-mono">
                        {new Date(previewStats.exportedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300">
                  ⚠️ <strong>Perhatian:</strong> Memulihkan cadangan ini akan mengganti data atlet dan partai saat ini dengan data dari file cadangan.
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pulihkan Data Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all cursor-pointer border border-slate-600"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-cyan-500/30 bg-[#050914] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Sistem Skoring Pencak Silat IPSI 2026 • Firebase Realtime Database
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer border border-slate-600"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
