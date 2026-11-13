import React from 'react';
import { CornerState, MatchSettings, MatchDecision } from '../types/silat';
import { calculateTotalScore, calculateAttackTotal, calculatePenaltyTotal, formatTime } from '../utils/rules';
import { Printer, X, Award, CheckCircle } from 'lucide-react';

interface OfficialScoreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  redState: CornerState;
  blueState: CornerState;
  settings: MatchSettings;
  decision: MatchDecision | null;
}

export const OfficialScoreSheetModal: React.FC<OfficialScoreSheetModalProps> = ({
  isOpen,
  onClose,
  redState,
  blueState,
  settings,
  decision,
}) => {
  if (!isOpen) return null;

  const redTotal = calculateTotalScore(redState);
  const blueTotal = calculateTotalScore(blueState);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl border border-neutral-300 max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-2 animate-in fade-in zoom-in-95 duration-150">
        {/* Screen Controls Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
              IPSI
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Formulir Hasil & Lembar Rekapitulasi Nilai Tanding
              </h2>
              <p className="text-xs text-neutral-500">
                Format Standar Peraturan Pertandingan IPSI / PERSILAT 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-sm transition-transform active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Score Sheet Body */}
        <div className="text-neutral-900 font-sans space-y-6">
          {/* Document Header */}
          <div className="text-center border-b-2 border-neutral-900 pb-4">
            <h1 className="text-lg font-black tracking-wider uppercase text-neutral-900">
              IKATAN PENCAK SILAT INDONESIA (IPSI)
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-800 mt-0.5">
              LEMBAR REKAPITULASI PENILAIAN DIGITAL KATEGORI TANDING
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Sesuai Regulasi dan Standar Peraturan Pertandingan PERSILAT & PB IPSI Terkini
            </p>
          </div>

          {/* Tournament Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-neutral-200 rounded-xl p-3 bg-neutral-50">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Gelanggang:</span>
              <strong className="text-neutral-900">{settings.arena}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Nomor Partai:</span>
              <strong className="text-neutral-900">{settings.matchNumber}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Kategori:</span>
              <strong className="text-neutral-900">{settings.category} ({settings.gender})</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Kelas:</span>
              <strong className="text-neutral-900">{settings.weightClass}</strong>
            </div>
          </div>

          {/* Corner Comparison Table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Blue Corner Sheet (Left) */}
            <div className="border-2 border-blue-300 rounded-2xl overflow-hidden">
              <div className="bg-blue-600 text-white p-3 text-center">
                <span className="text-[10px] font-black tracking-widest uppercase block">SUDUT BIRU</span>
                <h3 className="text-base font-extrabold truncate">{blueState.name}</h3>
                <p className="text-xs font-semibold text-blue-100">{blueState.contingent}</p>
                {blueState.school && <p className="text-[11px] text-blue-200">Perguruan: {blueState.school}</p>}
              </div>

              <div className="p-3 space-y-3 bg-white">
                {/* Round Scores Table */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 text-[10px] uppercase">
                      <th className="py-1">Babak</th>
                      <th className="py-1 text-right">Teknik Sah</th>
                      <th className="py-1 text-right">Hukuman</th>
                      <th className="py-1 text-right font-bold">Skor Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[0, 1, 2].map((idx) => (
                      <tr key={idx} className="font-mono">
                        <td className="py-1.5 font-sans font-semibold text-neutral-700">Babak {idx + 1}</td>
                        <td className="py-1.5 text-right text-neutral-700">+{blueState.roundAttackPoints[idx]}</td>
                        <td className="py-1.5 text-right text-red-600">{blueState.roundPenaltyPoints[idx]}</td>
                        <td className="py-1.5 text-right font-bold text-blue-700">{blueState.roundScores[idx]}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-neutral-300 font-bold bg-neutral-50">
                      <td className="py-2 font-sans">TOTAL NILAI</td>
                      <td className="py-2 text-right font-mono">+{calculateAttackTotal(blueState)}</td>
                      <td className="py-2 text-right font-mono text-red-600">{calculatePenaltyTotal(blueState)}</td>
                      <td className="py-2 text-right font-mono text-xl text-blue-700">{blueTotal}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Penalties Summary */}
                <div className="text-[11px] border-t border-neutral-100 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Binaan Wasit:</span>
                    <strong className="text-neutral-800">{blueState.binaanCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Teguran I & II:</span>
                    <strong className="text-neutral-800">{blueState.teguranCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Peringatan I & II (Kuning):</span>
                    <strong className="text-neutral-800">{blueState.peringatanCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Waktu Medis Terpakai:</span>
                    <strong className="font-mono text-neutral-800">{formatTime(blueState.medicalTimeUsedSeconds)} / 03:00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Sisa Kuota VAR Pelatih:</span>
                    <strong className="text-neutral-800">{blueState.varCards} Kartu</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Red Corner Sheet (Right) */}
            <div className="border-2 border-red-300 rounded-2xl overflow-hidden">
              <div className="bg-red-600 text-white p-3 text-center">
                <span className="text-[10px] font-black tracking-widest uppercase block">SUDUT MERAH</span>
                <h3 className="text-base font-extrabold truncate">{redState.name}</h3>
                <p className="text-xs font-semibold text-red-100">{redState.contingent}</p>
                {redState.school && <p className="text-[11px] text-red-200">Perguruan: {redState.school}</p>}
              </div>

              <div className="p-3 space-y-3 bg-white">
                {/* Round Scores Table */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 text-[10px] uppercase">
                      <th className="py-1">Babak</th>
                      <th className="py-1 text-right">Teknik Sah</th>
                      <th className="py-1 text-right">Hukuman</th>
                      <th className="py-1 text-right font-bold">Skor Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[0, 1, 2].map((idx) => (
                      <tr key={idx} className="font-mono">
                        <td className="py-1.5 font-sans font-semibold text-neutral-700">Babak {idx + 1}</td>
                        <td className="py-1.5 text-right text-neutral-700">+{redState.roundAttackPoints[idx]}</td>
                        <td className="py-1.5 text-right text-red-600">{redState.roundPenaltyPoints[idx]}</td>
                        <td className="py-1.5 text-right font-bold text-red-700">{redState.roundScores[idx]}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-neutral-300 font-bold bg-neutral-50">
                      <td className="py-2 font-sans">TOTAL NILAI</td>
                      <td className="py-2 text-right font-mono">+{calculateAttackTotal(redState)}</td>
                      <td className="py-2 text-right font-mono text-red-600">{calculatePenaltyTotal(redState)}</td>
                      <td className="py-2 text-right font-mono text-xl text-red-700">{redTotal}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Penalties Summary */}
                <div className="text-[11px] border-t border-neutral-100 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Binaan Wasit:</span>
                    <strong className="text-neutral-800">{redState.binaanCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Teguran I & II:</span>
                    <strong className="text-neutral-800">{redState.teguranCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Peringatan I & II (Kuning):</span>
                    <strong className="text-neutral-800">{redState.peringatanCount} kali</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Waktu Medis Terpakai:</span>
                    <strong className="font-mono text-neutral-800">{formatTime(redState.medicalTimeUsedSeconds)} / 03:00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Sisa Kuota VAR Pelatih:</span>
                    <strong className="text-neutral-800">{redState.varCards} Kartu</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Match Outcome Declaration Box */}
          <div className="p-4 rounded-2xl border-2 border-neutral-900 bg-neutral-50 text-center space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block">
              KEPUTUSAN RESMI DEWAN WASIT & JURI
            </span>
            <div className="text-base sm:text-lg font-black text-neutral-900">
              {decision ? (
                <>
                  MEMUTUSKAN PEMENANG ADALAH:{' '}
                  <span
                    className={
                      decision.winner === 'red'
                        ? 'text-red-600 underline'
                        : decision.winner === 'blue'
                        ? 'text-blue-600 underline'
                        : 'text-neutral-700'
                    }
                  >
                    {decision.winner === 'red'
                      ? `SUDUT MERAH (${redState.name} - ${redState.contingent})`
                      : decision.winner === 'blue'
                      ? `SUDUT BIRU (${blueState.name} - ${blueState.contingent})`
                      : 'BELUM ADA KEPUTUSAN'}
                  </span>
                </>
              ) : redTotal > blueTotal ? (
                <>
                  KEUNGGULAN SKOR SEMENTARA:{' '}
                  <span className="text-red-600 font-bold inline-flex items-center gap-1">
                    SUDUT MERAH ({redTotal} <img src="/vs.png" alt="VS" className="h-3 w-auto inline-block object-contain align-middle select-none" draggable={false} /> {blueTotal})
                  </span>
                </>
              ) : blueTotal > redTotal ? (
                <>
                  KEUNGGULAN SKOR SEMENTARA:{' '}
                  <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                    SUDUT BIRU ({blueTotal} <img src="/vs.png" alt="VS" className="h-3 w-auto inline-block object-contain align-middle select-none" draggable={false} /> {redTotal})
                  </span>
                </>
              ) : (
                <span>SKOR IMBANG ({redTotal} - {blueTotal})</span>
              )}
            </div>
            {decision && (
              <p className="text-xs font-semibold text-neutral-600">
                Alasan / Jenis Kemenangan: <span className="text-neutral-900">{decision.reason}</span>
              </p>
            )}
          </div>

          {/* Official Signatures Block */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs border-t border-neutral-200">
            <div className="space-y-12">
              <span className="text-neutral-500 block text-[11px]">Wasit Pertandingan</span>
              <div>
                <strong className="text-neutral-900 block">{settings.refereeName}</strong>
                <span className="text-[10px] text-neutral-400">Tanda Tangan</span>
              </div>
            </div>

            <div className="space-y-12">
              <span className="text-neutral-500 block text-[11px]">Sekretaris Pertandingan</span>
              <div>
                <strong className="text-neutral-900 block">{settings.secretaryName}</strong>
                <span className="text-[10px] text-neutral-400">Tanda Tangan</span>
              </div>
            </div>

            <div className="space-y-12">
              <span className="text-neutral-500 block text-[11px]">Ketua Pertandingan</span>
              <div>
                <strong className="text-neutral-900 block">{settings.juryPresidentName}</strong>
                <span className="text-[10px] text-neutral-400">Tanda Tangan & Cap Resmi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
