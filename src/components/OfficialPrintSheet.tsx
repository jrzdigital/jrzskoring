import React from 'react';
import { TandingMatch } from '../types/silat';
import {
  calculateTotalScore,
  calculateRoundRawPoints,
  calculateRoundDeduction,
  calculateRoundNetScore,
  calculatePenaltyDeduction,
} from '../utils/silatCalculations';

interface OfficialPrintSheetProps {
  match: TandingMatch;
}

export const OfficialPrintSheet: React.FC<OfficialPrintSheetProps> = ({ match }) => {
  const merahTotal = calculateTotalScore(match.merah);
  const biruTotal = calculateTotalScore(match.biru);

  return (
    <div className="print-only text-black bg-white p-8 max-w-[210mm] mx-auto text-xs font-serif leading-relaxed">
      {/* Official Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-lg font-bold uppercase tracking-wider">
          PENGURUS BESAR IKATAN PENCAK SILAT INDONESIA (PB IPSI)
        </h1>
        <h2 className="text-base font-semibold uppercase tracking-wide">
          PERSEKUTUAN PENCAK SILAT ANTARABANGSA (PERSILAT)
        </h2>
        <div className="text-xs font-bold uppercase tracking-widest mt-1 text-slate-800">
          LEMBAR REKAPITULASI PENILAIAN PERTANDINGAN TANDING
        </div>
      </div>

      {/* Match Metadata Table */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-4 text-[11px]">
        <div>
          <div className="flex">
            <span className="w-28 font-bold">Gelanggang:</span>
            <span>{match.gelanggang}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold">Nomor Partai:</span>
            <span>{match.partai}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold">Babak Turnamen:</span>
            <span>{match.babakMatch}</span>
          </div>
        </div>
        <div>
          <div className="flex">
            <span className="w-28 font-bold">Kelas Tanding:</span>
            <span>{match.kelasTanding}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold">Kategori:</span>
            <span>
              {match.kategoriUsia} ({match.gender === 'PUTRA' ? 'Putra' : 'Putri'})
            </span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold">Waktu Cetak:</span>
            <span>{new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Athletes Banner */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
        <div className="border-2 border-black p-2 bg-slate-100">
          <div className="font-bold text-[10px] uppercase">SUDUT MERAH</div>
          <div className="font-bold text-sm uppercase">{match.merah.name}</div>
          <div className="text-[11px] text-slate-700">{match.merah.kontingen}</div>
        </div>
        <div className="border-2 border-black p-2 bg-slate-100">
          <div className="font-bold text-[10px] uppercase">SUDUT BIRU</div>
          <div className="font-bold text-sm uppercase">{match.biru.name}</div>
          <div className="text-[11px] text-slate-700">{match.biru.kontingen}</div>
        </div>
      </div>

      {/* Detailed Scoring Table */}
      <table className="w-full border-collapse border border-black text-center text-[10px] mb-4">
        <thead>
          <tr className="bg-slate-200 border-b border-black">
            <th rowSpan={2} className="border border-black p-1 w-12">Babak</th>
            <th colSpan={5} className="border border-black p-1 bg-red-100 font-bold">SUDUT MERAH</th>
            <th colSpan={5} className="border border-black p-1 bg-blue-100 font-bold">SUDUT BIRU</th>
          </tr>
          <tr className="bg-slate-100 border-b border-black">
            {/* Merah cols */}
            <th className="border border-black p-1">Puk (+1)</th>
            <th className="border border-black p-1">Ten (+2)</th>
            <th className="border border-black p-1">Jat (+3)</th>
            <th className="border border-black p-1">Kunc (+5)</th>
            <th className="border border-black p-1 font-bold">Nilai</th>

            {/* Biru cols */}
            <th className="border border-black p-1">Puk (+1)</th>
            <th className="border border-black p-1">Ten (+2)</th>
            <th className="border border-black p-1">Jat (+3)</th>
            <th className="border border-black p-1">Kunc (+5)</th>
            <th className="border border-black p-1 font-bold">Nilai</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((r) => {
            const rNum = r as 1 | 2 | 3;
            const m = match.merah.roundScores[rNum];
            const b = match.biru.roundScores[rNum];
            const mRaw = calculateRoundRawPoints(m);
            const bRaw = calculateRoundRawPoints(b);

            return (
              <tr key={r} className="border-b border-black">
                <td className="border border-black font-bold p-1">Babak {r}</td>
                {/* Merah */}
                <td className="border border-black p-1">{m.pukulan}</td>
                <td className="border border-black p-1">{m.tendangan}</td>
                <td className="border border-black p-1">{m.jatuhan}</td>
                <td className="border border-black p-1">{m.kuncian}</td>
                <td className="border border-black p-1 font-bold bg-red-50">{mRaw}</td>

                {/* Biru */}
                <td className="border border-black p-1">{b.pukulan}</td>
                <td className="border border-black p-1">{b.tendangan}</td>
                <td className="border border-black p-1">{b.jatuhan}</td>
                <td className="border border-black p-1">{b.kuncian}</td>
                <td className="border border-black p-1 font-bold bg-blue-50">{bRaw}</td>
              </tr>
            );
          })}

          {/* Subtotal Raw */}
          <tr className="border-b border-black font-bold bg-slate-100">
            <td className="border border-black p-1">Subtotal Nilai</td>
            <td colSpan={4} className="border border-black p-1 text-right pr-2">Jumlah Nilai Sah:</td>
            <td className="border border-black p-1 bg-red-100">
              {calculateRoundRawPoints(match.merah.roundScores[1]) +
                calculateRoundRawPoints(match.merah.roundScores[2]) +
                calculateRoundRawPoints(match.merah.roundScores[3])}
            </td>
            <td colSpan={4} className="border border-black p-1 text-right pr-2">Jumlah Nilai Sah:</td>
            <td className="border border-black p-1 bg-blue-100">
              {calculateRoundRawPoints(match.biru.roundScores[1]) +
                calculateRoundRawPoints(match.biru.roundScores[2]) +
                calculateRoundRawPoints(match.biru.roundScores[3])}
            </td>
          </tr>

          {/* Penalties Row */}
          <tr className="border-b border-black">
            <td className="border border-black font-bold p-1">Hukuman</td>
            <td colSpan={4} className="border border-black p-1 text-left pl-2 text-[9px]">
              Teg.I: {match.merah.penalties.teguran1 ? 'Ya (-1)' : 'Tidak'} | Teg.II:{' '}
              {match.merah.penalties.teguran2 ? 'Ya (-2)' : 'Tidak'} | Peringatan:{' '}
              {match.merah.penalties.peringatan1 ? 'I (-5)' : ''}{' '}
              {match.merah.penalties.peringatan2 ? 'II (-10)' : ''}
              {match.merah.penalties.disqualified ? ' | DISKUALIFIKASI' : ''}
            </td>
            <td className="border border-black p-1 font-bold text-red-600">
              -{calculatePenaltyDeduction(match.merah.penalties)}
            </td>

            <td colSpan={4} className="border border-black p-1 text-left pl-2 text-[9px]">
              Teg.I: {match.biru.penalties.teguran1 ? 'Ya (-1)' : 'Tidak'} | Teg.II:{' '}
              {match.biru.penalties.teguran2 ? 'Ya (-2)' : 'Tidak'} | Peringatan:{' '}
              {match.biru.penalties.peringatan1 ? 'I (-5)' : ''}{' '}
              {match.biru.penalties.peringatan2 ? 'II (-10)' : ''}
              {match.biru.penalties.disqualified ? ' | DISKUALIFIKASI' : ''}
            </td>
            <td className="border border-black p-1 font-bold text-red-600">
              -{calculatePenaltyDeduction(match.biru.penalties)}
            </td>
          </tr>

          {/* Final Total Score */}
          <tr className="border-2 border-black font-black text-xs bg-slate-200">
            <td className="border border-black p-2">TOTAL AKHIR</td>
            <td colSpan={4} className="border border-black p-2 text-right pr-2">
              SKOR AKHIR MERAH:
            </td>
            <td className="border border-black p-2 text-sm bg-red-100 font-black">
              {merahTotal}
            </td>
            <td colSpan={4} className="border border-black p-2 text-right pr-2">
              SKOR AKHIR BIRU:
            </td>
            <td className="border border-black p-2 text-sm bg-blue-100 font-black">
              {biruTotal}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Official Decision Section */}
      <div className="border border-black p-3 mb-6 bg-slate-50">
        <div className="font-bold uppercase text-[11px] mb-1">
          KEPUTUSAN DEWAN PERTANDINGAN:
        </div>
        <div className="text-sm">
          Pemenang adalah Pesilat:{' '}
          <span className="font-bold uppercase underline">
            {match.winner === 'MERAH'
              ? `${match.merah.name} (SUDUT MERAH)`
              : match.winner === 'BIRU'
              ? `${match.biru.name} (SUDUT BIRU)`
              : 'BELUM DITETAPKAN / SERI'}
          </span>
        </div>
        <div className="text-xs mt-0.5">
          Keputusan Kemenangan:{' '}
          <span className="font-semibold">
            {match.victoryType ? match.victoryType.replace(/_/g, ' ') : '-'}
          </span>
          {match.winnerNotes && <span> ({match.winnerNotes})</span>}
        </div>
      </div>

      {/* Signatures Grid */}
      <div className="grid grid-cols-4 gap-4 text-center text-[10px] mt-8 pt-4">
        <div>
          <div className="h-16 flex items-end justify-center">
            <span className="border-b border-black w-32 inline-block"></span>
          </div>
          <div className="font-bold mt-1">Ketua Pertandingan</div>
        </div>

        <div>
          <div className="h-16 flex items-end justify-center">
            <span className="border-b border-black w-32 inline-block"></span>
          </div>
          <div className="font-bold mt-1">Dewan Wasit Juri</div>
        </div>

        <div>
          <div className="h-16 flex items-end justify-center">
            <span className="border-b border-black w-32 inline-block"></span>
          </div>
          <div className="font-bold mt-1">Wasit Gelanggang</div>
        </div>

        <div>
          <div className="h-16 flex items-end justify-center">
            <span className="border-b border-black w-32 inline-block"></span>
          </div>
          <div className="font-bold mt-1">Perwakilan Juri (1-3)</div>
        </div>
      </div>
    </div>
  );
};
