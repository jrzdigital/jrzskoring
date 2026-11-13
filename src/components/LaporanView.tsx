import React, { useState } from 'react';
import { 
  FileText, 
  FileDown, 
  Download, 
  Trophy, 
  CheckCircle, 
  Printer, 
  Search, 
  Medal,
  Award,
  ShieldCheck
} from 'lucide-react';
import { Partai } from '../types/silat';
import { formatWaktu, kalkulasiHasilIPSI } from '../services/ipsiRules';
import { exportPartaiPDF, exportSemuaPartaiPDF } from '../services/pdfExport';

interface LaporanViewProps {
  partaiList: Partai[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({ partaiList }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate medals per kontingen
  const medalTable: Record<string, { emas: number; perak: number; perunggu: number; total: number }> = {
    'Pengprov IPSI Jawa Barat': { emas: 2, perak: 1, perunggu: 0, total: 3 },
    'Pengprov IPSI Jawa Timur': { emas: 1, perak: 2, perunggu: 1, total: 4 },
    'Pengprov IPSI Bali': { emas: 1, perak: 0, perunggu: 2, total: 3 },
    'Pengprov IPSI DKI Jakarta': { emas: 1, perak: 1, perunggu: 0, total: 2 },
    'Pengprov IPSI D.I. Yogyakarta': { emas: 0, perak: 1, perunggu: 1, total: 2 },
    'Pengprov IPSI Jawa Tengah': { emas: 0, perak: 0, perunggu: 2, total: 2 },
  };

  const filteredPartai = partaiList.filter(p => 
    p.pesilat.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pesilat.kontingen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.nomorPartai).includes(searchTerm)
  );

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ['Nomor Partai', 'Gelanggang', 'Sudut', 'Nama Pesilat', 'Kontingen', 'Kategori', 'Durasi Waktu', 'Rata-rata Juri', 'Total Hukuman', 'Skor Akhir', 'Status'];
    const rows = partaiList.map(p => {
      const hasil = p.hasilAkhir || kalkulasiHasilIPSI(p.nilaiJuri, p.penaltiDewan);
      return [
        `#${p.nomorPartai}`,
        p.gelanggang,
        p.sudut,
        `"${p.pesilat.nama}"`,
        `"${p.pesilat.kontingen}"`,
        `${p.kategori} ${p.gender}`,
        formatWaktu(p.durasiBerjalanDetik),
        hasil.rataRataJuri.toFixed(3),
        hasil.totalHukuman.toFixed(3),
        hasil.skorAkhir.toFixed(3),
        p.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Laporan_Rekap_Pencak_Silat_IPSI_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center border-2 border-zinc-950 font-black">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded">
                REKAPITULASI HASIL & EKSPOR PDF
              </span>
              <span className="text-xs font-bold text-zinc-500">
                PB IPSI & PERSILAT 2026
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
              Laporan Resmi Hasil Pertandingan Kategori Seni
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportSemuaPartaiPDF(partaiList)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-zinc-950 cursor-pointer flex items-center gap-2 shadow-sm transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor Semua Rekap (PDF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border-2 border-zinc-950 cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Medal Standings (Klasemen Perolehan Medali) */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-zinc-950">
              Klasemen Perolehan Medali Kategori Seni / Jurus
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-500">
            KONTINGEN TERBAIK
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-950 text-white font-bold">
                <th className="py-2.5 px-3 rounded-l-lg">Peringkat</th>
                <th className="py-2.5 px-3">Kontingen / Pengprov</th>
                <th className="py-2.5 px-3 text-center">🥇 Emas</th>
                <th className="py-2.5 px-3 text-center">🥈 Perak</th>
                <th className="py-2.5 px-3 text-center">🥉 Perunggu</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Total Medali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {Object.entries(medalTable).map(([kontingen, medali], idx) => (
                <tr key={kontingen} className="hover:bg-zinc-50 font-medium">
                  <td className="py-3 px-3 font-mono font-black text-sm text-zinc-950">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-zinc-900">
                    {kontingen}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-amber-600">
                    {medali.emas}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-zinc-500">
                    {medali.perak}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-amber-700">
                    {medali.perunggu}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-base text-zinc-950">
                    {medali.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Match Scores Table */}
      <div className="bg-white border-3 border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-zinc-950">
              Daftar Rekapitulasi Nilai Seluruh Partai
            </h3>
            <p className="text-xs text-zinc-500">
              Klik "Unduh PDF" untuk mencetak lembar penilaian resmi berkop PB IPSI
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari atlet / partai..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border-2 border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-950 text-white font-bold">
                <th className="py-3 px-3">Partai</th>
                <th className="py-3 px-3">Pesilat & Kontingen</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Durasi</th>
                <th className="py-3 px-3">Rata Juri</th>
                <th className="py-3 px-3">Penalti</th>
                <th className="py-3 px-3 font-mono">Skor Akhir</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Cetak PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredPartai.map((p) => {
                const hasil = p.hasilAkhir || kalkulasiHasilIPSI(p.nilaiJuri, p.penaltiDewan);

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 font-medium">
                    <td className="py-3 px-3 font-mono font-black text-zinc-950">
                      #{p.nomorPartai}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-zinc-950">{p.pesilat.nama}</div>
                      <div className="text-[11px] text-zinc-500 font-medium">{p.pesilat.kontingen}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-800">{p.kategori}</span>
                      <span className="text-[10px] text-zinc-500 block">{p.gender}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {p.durasiBerjalanDetik > 0 ? formatWaktu(p.durasiBerjalanDetik) : '00:00.0'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {hasil.rataRataJuri.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono text-red-600 font-bold">
                      -{hasil.totalHukuman.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-sm text-zinc-950">
                      {hasil.skorAkhir.toFixed(3)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'DISAHKAN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => exportPartaiPDF(p)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Unduh Berita Acara PDF Resmi"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
