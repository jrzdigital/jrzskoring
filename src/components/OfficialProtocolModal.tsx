import React from 'react';
import { useMatch } from '../context/MatchContext';
import { Printer, Download, X, Award, CheckCircle } from 'lucide-react';

interface OfficialProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialProtocolModal: React.FC<OfficialProtocolModalProps> = ({ isOpen, onClose }) => {
  const { match } = useMatch();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(match, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `berita_acara_partai_${match.metadata.matchNumber}_${match.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:max-w-none">
        
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm uppercase tracking-wider text-slate-700">
              Pratinjau Dokumen Berita Acara Resmi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= OFFICIAL PRINTABLE SHEET ================= */}
        <div className="space-y-6 text-slate-900 font-sans print:space-y-4">
          
          {/* Official Letterhead (Kop Surat IPSI) */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600">
              PENGURUS BESAR IKATAN PENCAK SILAT INDONESIA (PB IPSI)
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight mt-1">
              BERITA ACARA PERTANDINGAN PENCAK SILAT
            </h1>
            <div className="text-xs font-semibold uppercase text-slate-700 mt-0.5">
              {match.metadata.championshipName}
            </div>
          </div>

          {/* Match Metadata Table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs print:bg-transparent">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Gelanggang</span>
              <span className="font-bold">{match.metadata.arena}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Partai / Babak</span>
              <span className="font-bold">Partai #{match.metadata.matchNumber} ({match.metadata.roundPhase})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Kategori & Kelas</span>
              <span className="font-bold">{match.blue.fighter.weightClass}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Tanggal & Waktu</span>
              <span className="font-bold">{match.metadata.date}</span>
            </div>
          </div>

          {/* Score Summary Comparison Table */}
          <div>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-1/3">Rincian Penilaian</th>
                  <th className="border border-slate-300 p-2 text-center text-blue-700 font-black">
                    SUDUT BIRU
                  </th>
                  <th className="border border-slate-300 p-2 text-center text-red-700 font-black">
                    SUDUT MERAH
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold">Nama Pesilat</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-sm">
                    {match.blue.fighter.name}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-sm">
                    {match.red.fighter.name}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-slate-600">Kontingen / Daerah</td>
                  <td className="border border-slate-300 p-2 text-center font-medium">
                    {match.blue.fighter.contingent}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-medium">
                    {match.red.fighter.contingent}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-2">Poin Babak I</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.blue.roundPoints.round1}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.red.roundPoints.round1}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Poin Babak II</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.blue.roundPoints.round2}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.red.roundPoints.round2}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-2">Poin Babak III</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.blue.roundPoints.round3}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {match.red.roundPoints.round3}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Pengurangan Poin Hukuman</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold text-red-600">
                    {match.blue.totalPenaltyPoints}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold text-red-600">
                    {match.red.totalPenaltyPoints}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold text-sm">
                  <td className="border border-slate-300 p-2">TOTAL SKOR AKHIR</td>
                  <td className="border border-slate-300 p-2 text-center text-lg text-blue-700 font-mono">
                    {match.blue.totalScore}
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-lg text-red-700 font-mono">
                    {match.red.totalScore}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Winner Decision Statement */}
          <div className="p-4 rounded-xl border-2 border-slate-900 text-center bg-slate-50 print:bg-transparent">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              KEPUTUSAN DEWAN PERTANDINGAN
            </span>
            <div className="text-base font-extrabold mt-1">
              {match.winner === 'BLUE' ? (
                <span className="text-blue-700">PEMENANG: SUDUT BIRU ({match.blue.fighter.name})</span>
              ) : match.winner === 'RED' ? (
                <span className="text-red-700">PEMENANG: SUDUT MERAH ({match.red.fighter.name})</span>
              ) : (
                <span>PERTANDINGAN BERAKHIR SERI (DRAW)</span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">
              Kategori Kemenangan: {match.winDecision ? match.winDecision.replace(/_/g, ' ') : 'MENANG ANGKA'}
            </div>
          </div>

          {/* Signatures Block (Ketua Pertandingan, Wasit Utama, Juri 1, 2, 3) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-12">Ketua Pertandingan</span>
                <span className="font-bold underline block">{match.metadata.chairmanName}</span>
                <span className="text-[10px] text-slate-500">Dewan Wasit Juri</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-12">Wasit Utama</span>
                <span className="font-bold underline block">{match.metadata.refereeName}</span>
                <span className="text-[10px] text-slate-500">Wasit Gelanggang</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-12">Sekretaris Pertandingan</span>
                <span className="font-bold underline block">(.......................................)</span>
                <span className="text-[10px] text-slate-500">Operator Sistem Skoring</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 block mb-8">Wasit Juri I</span>
                <span className="font-semibold block">{match.metadata.juryNames[0]}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-8">Wasit Juri II</span>
                <span className="font-semibold block">{match.metadata.juryNames[1]}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-8">Wasit Juri III</span>
                <span className="font-semibold block">{match.metadata.juryNames[2]}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
