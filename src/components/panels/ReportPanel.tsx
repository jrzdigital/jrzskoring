import React, { useState } from 'react';
import { useSilat } from '../../context/SilatContext';
import { exportMatchToPdf } from '../../utils/pdfExport';
import {
  FileText,
  Download,
  Printer,
  Trophy,
  Calendar,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const ReportPanel: React.FC = () => {
  const { matches, config, activeMatchId, selectActiveMatch } = useSilat();
  const [selectedReportMatchId, setSelectedReportMatchId] = useState<string>(activeMatchId || matches[0]?.id || '');

  const currentMatch = matches.find((m) => m.id === selectedReportMatchId) || matches[0];

  if (!currentMatch) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500">
        Belum ada data partai untuk dilaporkan.
      </div>
    );
  }

  const isTanding = currentMatch.category === 'TANDING';
  const tanding = currentMatch.tanding;
  const jurus = currentMatch.jurus;

  const handleDownloadPdf = () => {
    exportMatchToPdf(currentMatch, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in font-sans">
      
      {/* Top Banner & PDF Export Button */}
      <div className="cyber-glass border border-cyan-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-bracket">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-purple-600/90 text-white shadow-md border border-purple-400/50">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono uppercase tracking-wide">
              PANEL LAPORAN & BERITA ACARA PERTANDINGAN
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cyan-300 font-semibold font-mono">
            Format Resmi Berita Acara Pertandingan IPSI 2026 & PERSILAT.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-mono font-black shadow-lg glow-red border border-red-400 transition-transform cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Format PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#070e1c] hover:bg-[#091326] text-cyan-300 hover:text-white rounded-xl text-xs font-mono font-bold border border-cyan-500/40 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* MATCH SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-mono font-extrabold text-cyan-400 uppercase tracking-wider whitespace-nowrap">
          Pilih Partai:
        </span>
        {matches.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedReportMatchId(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedReportMatchId === m.id
                ? 'bg-amber-500 text-slate-950 glow-gold border border-amber-300 font-black shadow-md scale-105'
                : 'bg-[#070e1c] text-slate-300 hover:text-white hover:bg-[#091326] border border-cyan-500/30'
            }`}
          >
            Partai #{m.matchNumber} ({m.category.replace('_', ' ')})
          </button>
        ))}
      </div>

      {/* OFFICIAL PROTOCOL PAPER PREVIEW */}
      <div className="bg-[#070e1c]/95 border-2 border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 cyber-glass-deep hud-bracket">
        
        {/* Protocol Official Header */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4">
          <div className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-500">
            IKATAN PENCAK SILAT INDONESIA (IPSI) & PERSILAT
          </div>
          <h2 className="text-base sm:text-xl font-black uppercase mt-1">
            LEMBAR BERITA ACARA DAN HASIL PENILAIAN PERTANDINGAN
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            {config.tournamentName} | {currentMatch.arena} | {config.date}
          </p>
        </div>

        {/* Match Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 block font-semibold">Nomor Partai:</span>
            <span className="font-extrabold text-sm">Partai #{currentMatch.matchNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Kategori:</span>
            <span className="font-extrabold text-sm">{currentMatch.category.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Kelas & Golongan:</span>
            <span className="font-extrabold text-sm">{currentMatch.classGroup} ({currentMatch.gender})</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Babak Pertandingan:</span>
            <span className="font-extrabold text-sm">{currentMatch.stage.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Content Breakdown based on Category */}
        {isTanding ? (
          /* --- TANDING PROTOCOL --- */
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Rekapitulasi Nilai & Teknik Pertandingan:
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-black uppercase text-[11px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4">Parameter Penilaian</th>
                    <th className="py-2.5 px-4 text-center text-blue-600 dark:text-blue-400">
                      SUDUT BIRU ({tanding.blueAthlete.name})
                    </th>
                    <th className="py-2.5 px-4 text-center text-red-600 dark:text-red-400">
                      SUDUT MERAH ({tanding.redAthlete.name})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Kontingen / Daerah</td>
                    <td className="py-2.5 px-4 text-center">{tanding.blueAthlete.contingent}</td>
                    <td className="py-2.5 px-4 text-center">{tanding.redAthlete.contingent}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Poin Babak 1</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.blueScores.round1}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.redScores.round1}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Poin Babak 2</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.blueScores.round2}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.redScores.round2}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Poin Babak 3</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.blueScores.round3}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">{tanding.redScores.round3}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Total Pukulan Masuk (+1)</td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {tanding.blueScores.approvedHits.filter((h) => h.technique === 'PUKULAN').length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {tanding.redScores.approvedHits.filter((h) => h.technique === 'PUKULAN').length}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Total Tendangan Masuk (+2)</td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {tanding.blueScores.approvedHits.filter((h) => h.technique === 'TENDANGAN').length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {tanding.redScores.approvedHits.filter((h) => h.technique === 'TENDANGAN').length}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">Total Jatuhan Sah Masuk (+3)</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {tanding.blueScores.approvedHits.filter((h) => h.technique === 'JATUHAN').length}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {tanding.redScores.approvedHits.filter((h) => h.technique === 'JATUHAN').length}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-red-600">Total Hukuman (Poin)</td>
                    <td className="py-2.5 px-4 text-center font-mono text-red-600">
                      -{tanding.blueScores.penalties.reduce((a, b) => a + b.pointDeduction, 0)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-red-600">
                      -{tanding.redScores.penalties.reduce((a, b) => a + b.pointDeduction, 0)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black text-sm">
                    <td className="py-3 px-4 uppercase">TOTAL NILAI AKHIR</td>
                    <td className="py-3 px-4 text-center font-mono text-blue-600 dark:text-blue-400 text-lg">
                      {tanding.blueScores.totalPoints}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-red-600 dark:text-red-400 text-lg">
                      {tanding.redScores.totalPoints}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* --- JURUS / SENI PROTOCOL --- */
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Rincian Penilaian Juri Seni IPSI:
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-black uppercase text-[11px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 text-center">Juri</th>
                    <th className="py-2.5 px-4 text-center">Nilai Dasar</th>
                    <th className="py-2.5 px-4 text-center">Kesalahan Gerak (-0.01)</th>
                    <th className="py-2.5 px-4 text-center">Nilai Kebenaran</th>
                    <th className="py-2.5 px-4 text-center">Kemantapan</th>
                    <th className="py-2.5 px-4 text-center">Total Nilai Juri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-center">
                  {Object.values(jurus.juryScores).map((js) => (
                    <tr key={js.juryNumber}>
                      <td className="py-2.5 px-4 font-bold font-sans">Juri {js.juryNumber}</td>
                      <td className="py-2.5 px-4">{js.kebenaranBase.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-red-600">{js.kesalahanCount} (-{(js.kesalahanCount * 0.01).toFixed(2)})</td>
                      <td className="py-2.5 px-4">{js.kebenaranFinal.toFixed(3)}</td>
                      <td className="py-2.5 px-4 text-emerald-600">+{js.kemantapanScore.toFixed(3)}</td>
                      <td className="py-2.5 px-4 font-black text-sm text-slate-900 dark:text-white">{js.finalScore.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Seni Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold block">Durasi Waktu Tampil: {Math.floor(currentMatch.timer.elapsedTime / 60)}m {currentMatch.timer.elapsedTime % 60}d</span>
                <span className="text-red-600 font-bold block">Total Pengurangan Hukuman Dewan: -{jurus.penalties.totalPenalties.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">NILAI AKHIR PERSILAT / IPSI:</span>
                <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-300">
                  {jurus.finalMedianScore.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DECISION SUMMARY BOX */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs">
          <h4 className="font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
            KEPUTUSAN AKHIR PERTANDINGAN:
          </h4>
          {currentMatch.result ? (
            <div className="text-slate-900 dark:text-white font-medium">
              Pemenang: <strong>{currentMatch.result.winnerCorner === 'RED' ? tanding.redAthlete.name : currentMatch.result.winnerCorner === 'BLUE' ? tanding.blueAthlete.name : jurus.performer.name}</strong> · Jenis Kemenangan: <strong>Menang {currentMatch.result.winType}</strong>
            </div>
          ) : (
            <div className="text-slate-500">
              Pertandingan belum disahkan pemenangnya oleh Dewan Pertandingan.
            </div>
          )}
        </div>

        {/* SIGNATURES BLOCK */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
          <div>
            <div className="text-slate-600 dark:text-slate-400 mb-12">
              Ketua Pertandingan (Dewan),
            </div>
            <div className="font-bold underline text-slate-900 dark:text-white">
              ( {config.leadRefereeName} )
            </div>
          </div>

          <div>
            <div className="text-slate-600 dark:text-slate-400 mb-12">
              Sekretaris Pertandingan,
            </div>
            <div className="font-bold underline text-slate-900 dark:text-white">
              ( {config.secretaryName} )
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
