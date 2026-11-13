import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

interface ScoresheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoresheetPrintModal: React.FC<ScoresheetPrintModalProps> = ({ isOpen, onClose }) => {
  const { match } = useTournament();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-5 my-8">
        {/* Modal Controls (No print) */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4 no-print">
          <div>
            <h3 className="font-chakra text-lg font-black text-amber-300 uppercase tracking-wider">
              BERITA ACARA & LEMBAR HASIL SKOR RESMI PERSILAT / IPSI 2026
            </h3>
            <p className="text-xs text-gray-400">
              Dokumen resmi hasil pertandingan siap cetak atau simpan ke format PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/50 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Sheet */}
        <div className="printable-area bg-white text-black p-8 rounded-2xl shadow-xl font-sans text-xs">
          {/* Header IPSI / PERSILAT */}
          <div className="border-b-2 border-black pb-4 text-center">
            <h2 className="font-bold text-lg uppercase tracking-wider">
              PERSEKUTUAN PENCAK SILAT ANTARABANGSA (PERSILAT)
            </h2>
            <h3 className="font-bold text-base uppercase text-gray-800">
              IKATAN PENCAK SILAT INDONESIA (IPSI)
            </h3>
            <p className="font-semibold text-xs uppercase tracking-widest text-gray-700 mt-1">
              BERITA ACARA RESMI HASIL PERTANDINGAN DIGITAL SCORING 2026
            </p>
          </div>

          {/* Tournament Parameters Table */}
          <div className="grid grid-cols-2 gap-4 my-4 border border-black p-3 bg-gray-50">
            <div>
              <p><strong>Kejuaraan:</strong> {match.tournamentName}</p>
              <p><strong>Skala:</strong> Tingkat {match.competitionLevel.toUpperCase()}</p>
              <p><strong>Gelanggang:</strong> {match.arena}</p>
              <p><strong>Nomor Partai:</strong> {match.matchNumber}</p>
            </div>
            <div>
              <p><strong>Kategori:</strong> {match.category.toUpperCase()} ({match.gender.toUpperCase()})</p>
              <p><strong>Kelas / Pool:</strong> {match.classPool}</p>
              <p><strong>Babak Pertandingan:</strong> {match.roundStage}</p>
              <p><strong>Tanggal & Waktu:</strong> {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            </div>
          </div>

          {/* Tanding Score Sheet Table */}
          {match.category === 'tanding' ? (
            <div className="my-6">
              <table className="w-full border-collapse border border-black text-center text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-2 font-bold w-1/2">SUDUT MERAH</th>
                    <th className="border border-black p-2 font-bold">RINCIAN PENILAIAN</th>
                    <th className="border border-black p-2 font-bold w-1/2">SUDUT BIRU</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold text-sm bg-red-50 text-red-900">
                      {match.redCorner.athleteName}
                      <span className="block text-xs font-normal text-gray-600">{match.redCorner.contingent}</span>
                    </td>
                    <td className="border border-black p-2 font-semibold">Nama Pesilat & Kontingen</td>
                    <td className="border border-black p-2 font-bold text-sm bg-blue-50 text-blue-900">
                      {match.blueCorner.athleteName}
                      <span className="block text-xs font-normal text-gray-600">{match.blueCorner.contingent}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold text-base">{match.redCorner.roundScores.round1}</td>
                    <td className="border border-black p-2">Nilai Babak 1</td>
                    <td className="border border-black p-2 font-bold text-base">{match.blueCorner.roundScores.round1}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold text-base">{match.redCorner.roundScores.round2}</td>
                    <td className="border border-black p-2">Nilai Babak 2</td>
                    <td className="border border-black p-2 font-bold text-base">{match.blueCorner.roundScores.round2}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold text-base">{match.redCorner.roundScores.round3}</td>
                    <td className="border border-black p-2">Nilai Babak 3</td>
                    <td className="border border-black p-2 font-bold text-base">{match.blueCorner.roundScores.round3}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      Pukulan: {match.redCorner.strikes.pukulan} | Tendangan: {match.redCorner.strikes.tendangan} | Jatuhan: {match.redCorner.strikes.jatuhan}
                    </td>
                    <td className="border border-black p-2">Statistik Serangan Masuk</td>
                    <td className="border border-black p-2">
                      Pukulan: {match.blueCorner.strikes.pukulan} | Tendangan: {match.blueCorner.strikes.tendangan} | Jatuhan: {match.blueCorner.strikes.jatuhan}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">
                      Binaan: {match.redCorner.fouls.binaan} | T1: {match.redCorner.fouls.teguran1 ? 'Ya' : '-'} | T2: {match.redCorner.fouls.teguran2 ? 'Ya' : '-'} | P1: {match.redCorner.fouls.peringatan1 ? 'Ya' : '-'} | P2: {match.redCorner.fouls.peringatan2 ? 'Ya' : '-'}
                    </td>
                    <td className="border border-black p-2 font-semibold">Hukuman / Pelanggaran</td>
                    <td className="border border-black p-2">
                      Binaan: {match.blueCorner.fouls.binaan} | T1: {match.blueCorner.fouls.teguran1 ? 'Ya' : '-'} | T2: {match.blueCorner.fouls.teguran2 ? 'Ya' : '-'} | P1: {match.blueCorner.fouls.peringatan1 ? 'Ya' : '-'} | P2: {match.blueCorner.fouls.peringatan2 ? 'Ya' : '-'}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 font-bold text-base">
                    <td className="border border-black p-3 text-red-900">{match.redCorner.score} Poin</td>
                    <td className="border border-black p-3 uppercase">TOTAL SKOR AKHIR</td>
                    <td className="border border-black p-3 text-blue-900">{match.blueCorner.score} Poin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Seni Score Sheet */
            <div className="my-6">
              <table className="w-full border-collapse border border-black text-center text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-2 font-bold">KOMPONEN PENILAIAN SENI</th>
                    <th className="border border-black p-2 font-bold">NILAI / PENGURANGAN</th>
                    <th className="border border-black p-2 font-bold">CATATAN REGULASI PERSILAT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Nama Pesilat / Regu</td>
                    <td className="border border-black p-2 font-bold">{match.seniCompetitor.athleteName}</td>
                    <td className="border border-black p-2">{match.seniCompetitor.contingent}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Nilai Standar Baku Kebenaran</td>
                    <td className="border border-black p-2 font-bold">9.90</td>
                    <td className="border border-black p-2">100 Gerakan Jurus Baku Standar</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Pengurangan Deviasi Gerakan (-0.01)</td>
                    <td className="border border-black p-2 font-bold text-red-700">
                      -{(match.seniCompetitor.movementMistakes * 0.01).toFixed(2)} ({match.seniCompetitor.movementMistakes} salah)
                    </td>
                    <td className="border border-black p-2">Diinput langsung oleh Juri</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Nilai Kemantapan & Penghayatan</td>
                    <td className="border border-black p-2 font-bold text-green-700">
                      +{match.seniCompetitor.staminaHarmonyScore.toFixed(2)}
                    </td>
                    <td className="border border-black p-2">Rentang 0.01 - 0.10</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Hukuman Dewan (Senjata/Arena/Baju)</td>
                    <td className="border border-black p-2 font-bold text-red-700">
                      {match.seniCompetitor.penalties.weaponDrop ? '-0.50 (Senjata Jatuh)' : '0.00'}
                    </td>
                    <td className="border border-black p-2">Waktu Tampil: {Math.floor(match.timerSeconds / 60)}:{(match.timerSeconds % 60).toString().padStart(2, '0')}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold text-base">
                    <td className="border border-black p-3">TOTAL SKOR AKHIR</td>
                    <td className="border border-black p-3 text-lg" colSpan={2}>
                      {match.seniCompetitor.finalScore.toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Official Decision Result */}
          <div className="border-2 border-black p-3 my-4 bg-gray-50">
            <p><strong>KEPUTUSAN RESMI DEWAN:</strong> Pemenang Sudut <strong>{match.winner.toUpperCase()}</strong></p>
            <p><strong>Jenis Kemenangan:</strong> {match.winType ? match.winType.toUpperCase() : 'MENANG ANGKA'}</p>
            {match.winDescription && <p><strong>Keterangan:</strong> {match.winDescription}</p>}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-black text-center text-[11px]">
            <div>
              <p className="font-semibold">Ketua Pertandingan (KP)</p>
              <div className="h-16" />
              <p className="border-t border-black pt-1">( ........................................ )</p>
            </div>
            <div>
              <p className="font-semibold">Dewan Pendekar</p>
              <div className="h-16" />
              <p className="border-t border-black pt-1">( ........................................ )</p>
            </div>
            <div>
              <p className="font-semibold">Sekretaris Pertandingan</p>
              <div className="h-16" />
              <p className="border-t border-black pt-1">( ........................................ )</p>
            </div>
            <div>
              <p className="font-semibold">Wasit Pertandingan</p>
              <div className="h-16" />
              <p className="border-t border-black pt-1">( ........................................ )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
