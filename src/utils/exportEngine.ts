import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { MatchPartai } from '../types';
import { calculateTandingScore, calculateSeniJurusScore } from './rules';

export function exportMatchToPDF(match: MatchPartai, tournamentName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header IPSI
  doc.setFillColor(36, 18, 66); // Dark purple
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI)', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(tournamentName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  doc.text('LEMBAR HASIL PERTANDINGAN RESMI (OFFICIAL SCORE SHEET)', pageWidth / 2, 24, { align: 'center' });

  // Match Information Meta Box
  let y = 36;
  doc.setDrawColor(200, 200, 210);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`PARTAI: ${match.partaiNumber}`, 18, y + 7);
  doc.text(`GELANGGANG: ${match.gelanggang}`, 75, y + 7);
  doc.text(`KATEGORI: ${match.category.toUpperCase().replace('_', ' ')}`, 140, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(`Babak: ${match.roundStage}`, 18, y + 14);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 75, y + 14);
  doc.text(`Status: ${match.status.toUpperCase()}`, 140, y + 14);

  if (match.winner) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(match.winner === 'red' ? 180 : 20, match.winner === 'red' ? 20 : 60, match.winner === 'red' ? 20 : 180);
    const winStr = match.winner === 'draw' ? 'HASIL: IMBANG (DRAW)' : `PEMENANG: SUDUT ${match.winner === 'red' ? 'MERAH' : 'BIRU'} (${match.winReason || 'Menang Angka'})`;
    doc.text(winStr, 18, y + 21);
  }

  y += 34;

  if (match.category === 'tanding') {
    const redScore = calculateTandingScore('red', match.actions, match.penalties, match.maxRounds);
    const blueScore = calculateTandingScore('blue', match.actions, match.penalties, match.maxRounds);

    // Box Sudut Merah & Biru side-by-side
    const colWidth = (pageWidth - 34) / 2;

    // Sudut Merah
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, y, colWidth, 42, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text('SUDUT MERAH', 18, y + 8);

    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(match.redCorner.name, 18, y + 15);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(match.redCorner.contingent, 18, y + 21);
    doc.text(`Kelas: ${match.redCorner.weightClass}`, 18, y + 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text(`SKOR AKHIR: ${redScore.totalScore}`, 18, y + 36);

    // Sudut Biru
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(20 + colWidth, y, colWidth, 42, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text('SUDUT BIRU', 24 + colWidth, y + 8);

    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(match.blueCorner.name, 24 + colWidth, y + 15);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(match.blueCorner.contingent, 24 + colWidth, y + 21);
    doc.text(`Kelas: ${match.blueCorner.weightClass}`, 24 + colWidth, y + 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`SKOR AKHIR: ${blueScore.totalScore}`, 24 + colWidth, y + 36);

    y += 50;

    // Rincian Babak Tabel
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 40);
    doc.text('RINCIAN POIN PER BABAK', 14, y);

    y += 5;
    // Table Header
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFontSize(8);
    doc.text('BABAK', 18, y + 5.5);
    doc.text('MERAH (Poin)', 50, y + 5.5);
    doc.text('MERAH (Hukuman)', 80, y + 5.5);
    doc.text('BIRU (Poin)', 125, y + 5.5);
    doc.text('BIRU (Hukuman)', 155, y + 5.5);

    y += 8;
    for (let r = 1; r <= match.maxRounds; r++) {
      const rRed = redScore.roundScores.find((rs) => rs.round === r) || { points: 0, deductions: 0 };
      const rBlue = blueScore.roundScores.find((rs) => rs.round === r) || { points: 0, deductions: 0 };

      doc.setFont('helvetica', 'normal');
      doc.text(`Babak ${r}`, 18, y + 5.5);
      doc.text(`+${rRed.points}`, 55, y + 5.5);
      doc.text(`-${rRed.deductions}`, 85, y + 5.5);
      doc.text(`+${rBlue.points}`, 130, y + 5.5);
      doc.text(`-${rBlue.deductions}`, 160, y + 5.5);
      doc.line(14, y + 8, pageWidth - 14, y + 8);
      y += 8;
    }

    // Statistik Teknik
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIK TEKNIK & HUKUMAN', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Merah - Pukulan: ${redScore.punchesCount} | Tendangan: ${redScore.kicksCount} | Jatuhan: ${redScore.takedownsCount} | Teguran: ${redScore.teguranCount} | Peringatan: ${redScore.peringatanCount}`, 14, y + 4);
    doc.text(`Biru  - Pukulan: ${blueScore.punchesCount} | Tendangan: ${blueScore.kicksCount} | Jatuhan: ${blueScore.takedownsCount} | Teguran: ${blueScore.teguranCount} | Peringatan: ${blueScore.peringatanCount}`, 14, y + 10);
    y += 18;
  } else {
    // Seni / Jurus
    const jurorScoresArray = Object.values(match.seniJurorScores || {});
    const seniResult = calculateSeniJurusScore(jurorScoresArray, match.seniCouncilPenalties || [], match.seniDurationSeconds || 180);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 40);
    doc.text(`Pesilat: ${match.seniCompetitor?.name || match.redCorner.name} (${match.seniCompetitor?.contingent || match.redCorner.contingent})`, 14, y);
    doc.text(`Waktu Penampilan: ${Math.floor((match.seniDurationSeconds || 0) / 60)}m ${Math.floor((match.seniDurationSeconds || 0) % 60)}s (Status: ${seniResult.timeStatus.toUpperCase()})`, 14, y + 7);
    doc.text(`SKOR AKHIR RESMI: ${seniResult.finalScore.toFixed(3)}`, 14, y + 15);

    y += 24;

    // Tabel Nilai 5 Juri
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('NILAI MASING-MASING JURI', 14, y);
    y += 5;

    doc.setFillColor(240, 240, 245);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(8);
    doc.text('JURI', 18, y + 5);
    doc.text('NAMA JURI', 45, y + 5);
    doc.text('KEBENARAN (9.90 - Salah)', 95, y + 5);
    doc.text('KEMANTAPAN', 145, y + 5);
    doc.text('TOTAL', 175, y + 5);

    y += 7;
    jurorScoresArray.forEach((j) => {
      const isHigh = j.juriId === seniResult.trimmedHighJuriId;
      const isLow = j.juriId === seniResult.trimmedLowJuriId;
      const suffix = isHigh ? ' [Dibuang: Tertinggi]' : isLow ? ' [Dibuang: Terendah]' : '';

      doc.setFont('helvetica', isHigh || isLow ? 'italic' : 'normal');
      doc.text(j.juriId.toUpperCase(), 18, y + 5);
      doc.text(j.juriName + suffix, 45, y + 5);
      doc.text(`${j.correctnessScore.toFixed(2)} (${j.mistakeCount} salah)`, 95, y + 5);
      doc.text(j.firmnessScore.toFixed(2), 145, y + 5);
      doc.text(j.totalScore.toFixed(2), 175, y + 5);
      doc.line(14, y + 7, pageWidth - 14, y + 7);
      y += 7;
    });

    y += 8;
  }

  // Tanda Tangan Resmi
  const sigY = 240;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text('Sekretaris Pertandingan,', 20, sigY);
  doc.line(20, sigY + 22, 65, sigY + 22);
  doc.text('( ........................................ )', 20, sigY + 26);

  doc.text('Ketua Dewan Wasit Juri,', 80, sigY);
  doc.line(80, sigY + 22, 125, sigY + 22);
  doc.text('( ........................................ )', 80, sigY + 26);

  doc.text('Wasit Pertandingan,', 145, sigY);
  doc.line(145, sigY + 22, 185, sigY + 22);
  doc.text('( ........................................ )', 145, sigY + 26);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 150);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh Sistem Skoring Digital Pencak Silat IPSI 2026. Sah tanpa rekayasa.', pageWidth / 2, 285, { align: 'center' });

  // Download PDF
  doc.save(`Skor_Silat_Partai_${match.partaiNumber}_${match.category}.pdf`);
}

export function exportMatchToExcel(match: MatchPartai, tournamentName: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Partai
  const summaryData = [
    ['SISTEM SKORING PENCAK SILAT IPSI / PERSILAT 2026'],
    [tournamentName],
    [''],
    ['Partai', match.partaiNumber],
    ['Gelanggang', match.gelanggang],
    ['Kategori', match.category],
    ['Babak', match.roundStage],
    ['Status', match.status],
    ['Waktu Pertandingan', match.finishedAt || 'Berlangsung'],
    ['Pemenang', match.winner ? `Sudut ${match.winner.toUpperCase()} (${match.winReason})` : '-'],
    [''],
    ['SUDUT MERAH', ''],
    ['Nama Pesilat', match.redCorner.name],
    ['Kontingen', match.redCorner.contingent],
    ['Kelas', match.redCorner.weightClass],
    [''],
    ['SUDUT BIRU', ''],
    ['Nama Pesilat', match.blueCorner.name],
    ['Kontingen', match.blueCorner.contingent],
    ['Kelas', match.blueCorner.weightClass],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Log Aksi & Poin
  if (match.category === 'tanding') {
    const actionsData = [
      ['Timestamp', 'Babak', 'Sudut', 'Jenis Teknik', 'Poin Masuk', 'Juri'],
      ...match.actions.map((a) => [
        new Date(a.timestamp).toLocaleTimeString(),
        `Babak ${a.round}`,
        a.corner.toUpperCase(),
        a.type.toUpperCase(),
        a.points,
        a.juriId,
      ]),
    ];
    const wsActions = XLSX.utils.aoa_to_sheet(actionsData);
    XLSX.utils.book_append_sheet(wb, wsActions, 'Log Serangan');

    const penaltiesData = [
      ['Timestamp', 'Babak', 'Sudut', 'Jenis Hukuman', 'Poin Pengurangan'],
      ...match.penalties.map((p) => [
        new Date(p.timestamp).toLocaleTimeString(),
        `Babak ${p.round}`,
        p.corner.toUpperCase(),
        p.type.toUpperCase(),
        p.pointsDeducted,
      ]),
    ];
    const wsPenalties = XLSX.utils.aoa_to_sheet(penaltiesData);
    XLSX.utils.book_append_sheet(wb, wsPenalties, 'Hukuman');
  } else {
    // Sheet Seni
    const seniData = [
      ['Juri ID', 'Nama Juri', 'Skor Kebenaran Dasar', 'Jumlah Salah', 'Skor Kebenaran', 'Skor Kemantapan', 'Total Juri'],
      ...Object.values(match.seniJurorScores || {}).map((j) => [
        j.juriId,
        j.juriName,
        j.correctnessBase,
        j.mistakeCount,
        j.correctnessScore,
        j.firmnessScore,
        j.totalScore,
      ]),
    ];
    const wsSeni = XLSX.utils.aoa_to_sheet(seniData);
    XLSX.utils.book_append_sheet(wb, wsSeni, 'Penilaian Seni Juri');
  }

  XLSX.writeFile(wb, `Rekap_Partai_${match.partaiNumber}_${match.category}.xlsx`);
}

export function exportArchiveToExcel(archive: MatchPartai[], tournamentName: string) {
  const wb = XLSX.utils.book_new();

  const data = [
    ['REKAP ARSIP PERTANDINGAN PENCAK SILAT'],
    [tournamentName],
    ['Diekspor pada:', new Date().toLocaleString('id-ID')],
    [''],
    ['No Partai', 'Gelanggang', 'Kategori', 'Babak', 'Sudut Merah', 'Kontingen Merah', 'Sudut Biru', 'Kontingen Biru', 'Pemenang', 'Keterangan Kemenangan', 'Waktu Selesai'],
    ...archive.map((m) => [
      m.partaiNumber,
      m.gelanggang,
      m.category.toUpperCase(),
      m.roundStage,
      m.redCorner.name,
      m.redCorner.contingent,
      m.blueCorner.name,
      m.blueCorner.contingent,
      m.winner ? m.winner.toUpperCase() : '-',
      m.winReason || '-',
      m.finishedAt || '-',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Arsip Pertandingan');
  XLSX.writeFile(wb, `Arsip_Lengkap_Pencak_Silat_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToJSON(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
