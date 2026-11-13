import React from 'react';
import { Printer, X } from 'lucide-react';
import { MatchData } from '../types/silat';
import { calculateMatchSummary } from '../utils/rules';

interface ScoreSheetPrintProps {
  match: MatchData;
  onClose: () => void;
}

export const ScoreSheetPrint: React.FC<ScoreSheetPrintProps> = ({ match, onClose }) => {
  const summary = calculateMatchSummary(match);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black w-full max-w-4xl rounded-xl shadow-2xl p-6 sm:p-8 my-8 relative print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none">
        {/* Floating Print & Close Action Buttons (Hidden when printing) */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
          <div className="text-sm font-bold text-slate-800">
            Pratinjau Lembar Penilaian Pertandingan Resmi (IPSI)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SCORE SHEET CONTENT */}
        <div className="text-black">
          {/* Header Kop Resmi */}
          <div className="text-center border-b-2 border-black pb-3 mb-4">
            <h1 className="text-lg font-black tracking-wider uppercase">
              IKATAN PENCAK SILAT INDONESIA (IPSI)
            </h1>
            <h2 className="text-sm font-extrabold uppercase text-slate-900">
              FORMULIR PENILAIAN PERTANDINGAN TANDING
            </h2>
            <p className="text-xs text-slate-600 uppercase font-medium">
              {match.tournamentName}
            </p>
          </div>

          {/* Partai Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-black p-2.5 mb-4 bg-slate-50 font-mono">
            <div>
              <span className="text-slate-600">Gelanggang:</span>{' '}
              <strong>{match.gelanggang.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-slate-600">Partai Ke:</span>{' '}
              <strong>{match.partaiNumber}</strong>
            </div>
            <div>
              <span className="text-slate-600">Babak:</span>{' '}
              <strong>{match.babakPenyisihan}</strong>
            </div>
            <div>
              <span className="text-slate-600">Kategori / Kelas:</span>{' '}
              <strong>{match.weightClass} ({match.gender})</strong>
            </div>
          </div>

          {/* Fighters Identity */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-red-600 p-3 rounded bg-red-50/50">
              <div className="text-xs font-black text-red-700 uppercase">SUDUT MERAH</div>
              <div className="text-base font-bold text-red-950 uppercase">{match.redFighter.name}</div>
              <div className="text-xs text-slate-700">
                Kontingen: {match.redFighter.contingent} {match.redFighter.school ? `(${match.redFighter.school})` : ''}
              </div>
            </div>

            <div className="border border-blue-600 p-3 rounded bg-blue-50/50">
              <div className="text-xs font-black text-blue-700 uppercase">SUDUT BIRU</div>
              <div className="text-base font-bold text-blue-950 uppercase">{match.blueFighter.name}</div>
              <div className="text-xs text-slate-700">
                Kontingen: {match.blueFighter.contingent} {match.blueFighter.school ? `(${match.blueFighter.school})` : ''}
              </div>
            </div>
          </div>

          {/* Table Breakdown per Babak */}
          <table className="w-full text-xs border-collapse border border-black text-center mb-4">
            <thead>
              <tr className="bg-slate-200 text-black">
                <th className="border border-black p-1.5" rowSpan={2}>Babak</th>
                <th className="border border-black p-1.5 bg-red-100" colSpan={4}>SUDUT MERAH</th>
                <th className="border border-black p-1.5 bg-blue-100" colSpan={4}>SUDUT BIRU</th>
              </tr>
              <tr className="bg-slate-100">
                <th className="border border-black p-1">Pukulan (1)</th>
                <th className="border border-black p-1">Tendangan (2)</th>
                <th className="border border-black p-1">Jatuhan (3)</th>
                <th className="border border-black p-1 font-bold">Total Nilai</th>
                <th className="border border-black p-1">Pukulan (1)</th>
                <th className="border border-black p-1">Tendangan (2)</th>
                <th className="border border-black p-1">Jatuhan (3)</th>
                <th className="border border-black p-1 font-bold">Total Nilai</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((r) => {
                const redR = summary.redByRound[r];
                const blueR = summary.blueByRound[r];
                return (
                  <tr key={r} className="hover:bg-slate-50 font-mono">
                    <td className="border border-black p-1.5 font-bold">Babak {r}</td>
                    <td className="border border-black p-1.5">{redR?.pukulanCount ?? 0}</td>
                    <td className="border border-black p-1.5">{redR?.tendanganCount ?? 0}</td>
                    <td className="border border-black p-1.5">{redR?.jatuhanCount ?? 0}</td>
                    <td className="border border-black p-1.5 font-bold bg-red-50 text-red-950">
                      {redR?.totalRoundPoints ?? 0}
                    </td>
                    <td className="border border-black p-1.5">{blueR?.pukulanCount ?? 0}</td>
                    <td className="border border-black p-1.5">{blueR?.tendanganCount ?? 0}</td>
                    <td className="border border-black p-1.5">{blueR?.jatuhanCount ?? 0}</td>
                    <td className="border border-black p-1.5 font-bold bg-blue-50 text-blue-950">
                      {blueR?.totalRoundPoints ?? 0}
                    </td>
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className="bg-slate-200 font-bold text-sm">
                <td className="border border-black p-2 uppercase">TOTAL SKOR AKHIR</td>
                <td className="border border-black p-2 text-center text-red-900 bg-red-100" colSpan={4}>
                  {summary.redTotal} POIN
                </td>
                <td className="border border-black p-2 text-center text-blue-900 bg-blue-100" colSpan={4}>
                  {summary.blueTotal} POIN
                </td>
              </tr>
            </tbody>
          </table>

          {/* Penalties Summary Strip */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-black p-2.5 mb-4 font-mono">
            <div>
              <div className="font-bold text-red-800">Hukuman Sudut Merah:</div>
              <div>Binaan: {summary.redPenalties.binaan} · Teguran: {summary.redPenalties.teguran2 ? 'II (-2)' : summary.redPenalties.teguran1 ? 'I (-1)' : '0'} · Peringatan: {summary.redPenalties.peringatan2 ? 'II (-10)' : summary.redPenalties.peringatan1 ? 'I (-5)' : '0'}</div>
            </div>
            <div>
              <div className="font-bold text-blue-800">Hukuman Sudut Biru:</div>
              <div>Binaan: {summary.bluePenalties.binaan} · Teguran: {summary.bluePenalties.teguran2 ? 'II (-2)' : summary.bluePenalties.teguran1 ? 'I (-1)' : '0'} · Peringatan: {summary.bluePenalties.peringatan2 ? 'II (-10)' : summary.bluePenalties.peringatan1 ? 'I (-5)' : '0'}</div>
            </div>
          </div>

          {/* Decision Box */}
          <div className="border-2 border-black p-3 mb-6 bg-slate-50 text-xs">
            <div className="font-bold uppercase tracking-wider mb-1">
              KEPUTUSAN PEMENANG:
            </div>
            <div className="text-sm font-black">
              {match.winner ? (
                <span>
                  PEMENANG: SUDUT {match.winner.toUpperCase()} ({match.winner === 'merah' ? match.redFighter.name : match.blueFighter.name})
                  {' '}— Menang {match.winType || 'Angka'} {match.winReason ? `(${match.winReason})` : ''}
                </span>
              ) : (
                <span className="text-slate-600 italic">Pertandingan masih berlangsung / belum disahkan</span>
              )}
            </div>
          </div>

          {/* Official Signatures Row */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-black">
            <div>
              <div className="h-16"></div>
              <div className="border-t border-black pt-1 font-semibold">Juri 1</div>
            </div>
            <div>
              <div className="h-16"></div>
              <div className="border-t border-black pt-1 font-semibold">Juri 2</div>
            </div>
            <div>
              <div className="h-16"></div>
              <div className="border-t border-black pt-1 font-semibold">Juri 3</div>
            </div>
            <div>
              <div className="h-16"></div>
              <div className="border-t border-black pt-1 font-semibold">Ketua Pertandingan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
