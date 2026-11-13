import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatchState, TournamentConfig } from '../types/silat';
import { formatTandingJurusColumn } from './scheduleDisplayHelper';

/**
 * Ekspor Berita Acara Pertandingan Pencak Silat Resmi IPSI 2026 / PERSILAT ke format PDF
 */
export function exportMatchToPdf(match: MatchState, config: TournamentConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header IPSI / PERSILAT
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) & PERSILAT', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('LEMBAR BERITA ACARA DAN HASIL PENILAIAN PERTANDINGAN', pageWidth / 2, 16, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${config.tournamentName.toUpperCase()} | ${match.arena.toUpperCase()}`, pageWidth / 2, 22, { align: 'center' });

  // Info Pertandingan Bar
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let currentY = 35;
  
  // Box Info Umum
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.text(`Nomor Partai: ${match.matchNumber}`, 18, currentY + 7);
  doc.text(`Kategori: ${match.category.replace('_', ' ')} (${match.gender})`, 18, currentY + 14);
  doc.text(`Kelas / Kategori: ${match.classGroup} - ${match.ageGroup.replace('_', ' ')}`, 18, currentY + 20);

  doc.text(`Gelanggang: ${match.arena}`, 110, currentY + 7);
  doc.text(`Babak: ${match.stage.replace('_', ' ')}`, 110, currentY + 14);
  doc.text(`Tanggal: ${config.date || new Date().toLocaleDateString('id-ID')}`, 110, currentY + 20);

  currentY += 30;

  if (match.category === 'TANDING') {
    // --- KATEGORI TANDING ---
    const red = match.tanding.redAthlete;
    const blue = match.tanding.blueAthlete;
    const redScores = match.tanding.redScores;
    const blueScores = match.tanding.blueScores;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DATA PESILAT & REKAPITULASI NILAI TANDING', 14, currentY);
    currentY += 4;

    const athleteData = [
      ['Keterangan', 'SUDUT MERAH (RED)', 'SUDUT BIRU (BLUE)'],
      ['Nama Pesilat', red.name, blue.name],
      ['Kontingen / Daerah', red.contingent, blue.contingent],
      ['Berat Badan', red.weight ? `${red.weight} kg` : '-', blue.weight ? `${blue.weight} kg` : '-'],
      ['Nilai Babak 1', `${redScores.round1}`, `${blueScores.round1}`],
      ['Nilai Babak 2', `${redScores.round2}`, `${blueScores.round2}`],
      ['Nilai Babak 3', `${redScores.round3}`, `${blueScores.round3}`],
      ['Total Pukulan Masuk (+1)', `${redScores.approvedHits.filter(h => h.technique === 'PUKULAN').length}`, `${blueScores.approvedHits.filter(h => h.technique === 'PUKULAN').length}`],
      ['Total Tendangan Masuk (+2)', `${redScores.approvedHits.filter(h => h.technique === 'TENDANGAN').length}`, `${blueScores.approvedHits.filter(h => h.technique === 'TENDANGAN').length}`],
      ['Total Jatuhan Sah (+3)', `${redScores.approvedHits.filter(h => h.technique === 'JATUHAN').length}`, `${blueScores.approvedHits.filter(h => h.technique === 'JATUHAN').length}`],
      ['Total Hukuman (Poin)', `-${redScores.penalties.reduce((acc, p) => acc + p.pointDeduction, 0)}`, `-${blueScores.penalties.reduce((acc, p) => acc + p.pointDeduction, 0)}`],
      ['TOTAL NILAI AKHIR', `${redScores.totalPoints}`, `${blueScores.totalPoints}`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [athleteData[0]],
      body: athleteData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 65, textColor: [185, 28, 28] }, // Red
        2: { halign: 'center', cellWidth: 65, textColor: [29, 78, 216] }, // Blue
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },
      didParseCell: (data) => {
        // Highlight total row
        if (data.row.index === 10) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontSize = 10;
        }
      }
    });

    // @ts-ignore - autoTable injects lastAutoTable
    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Riwayat Hukuman Tabel
    if (redScores.penalties.length > 0 || blueScores.penalties.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('CATATAN PELANGGARAN & HUKUMAN DEWAN WASIT', 14, currentY);
      currentY += 3;

      const penaltyRows: string[][] = [];
      [...redScores.penalties, ...blueScores.penalties].forEach((p) => {
        penaltyRows.push([
          `Babak ${p.round}`,
          p.corner === 'RED' ? 'MERAH' : 'BIRU',
          p.type.replace('_', ' '),
          `-${p.pointDeduction}`,
          p.timestamp
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Babak', 'Sudut', 'Jenis Hukuman', 'Potongan Poin', 'Waktu']],
        body: penaltyRows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      // @ts-ignore
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

  } else {
    // --- KATEGORI JURUS (TUNGGAL / GANDA / REGU / SOLO KREATIF) ---
    const performer = match.jurus.performer;
    const jurus = match.jurus;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`PENILAIAN JURUS / SENI (${match.category.replace('_', ' ')})`, 14, currentY);
    currentY += 4;

    const memberText = performer.teamMembers && performer.teamMembers.length > 0 
      ? ` (${performer.teamMembers.join(', ')})` 
      : '';

    const seniData = [
      ['Pesilat / Tim', `${performer.name}${memberText}`],
      ['Kontingen', performer.contingent],
      ['Durasi Waktu Tampil', `${Math.floor(match.timer.elapsedTime / 60)}m ${match.timer.elapsedTime % 60}d (Target: ${Math.floor(match.timer.durationTotal / 60)}m)`],
      ['Hukuman Waktu', `-${jurus.penalties.timeToleranceViolation.toFixed(2)}`],
      ['Hukuman Senjata Jatuh/Patah', `-${(jurus.penalties.weaponDropped + jurus.penalties.weaponBroken).toFixed(2)}`],
      ['Hukuman Keluar Arena / Pakaian', `-${(jurus.penalties.outOfArena + jurus.penalties.attireViolation).toFixed(2)}`],
      ['Total Pengurangan Dewan', `-${jurus.penalties.totalPenalties.toFixed(2)}`],
      ['NILAI AKHIR PERSILAT/IPSI', `${jurus.finalMedianScore.toFixed(3)}`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Parameter', 'Rincian Penilaian']],
      body: seniData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 110 },
      }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Rincian Nilai per Juri
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RINCIAN PENILAIAN JURI SENI', 14, currentY);
    currentY += 3;

    const juryRows = Object.values(jurus.juryScores).map((js) => [
      `Juri ${js.juryNumber}`,
      `${js.kebenaranBase.toFixed(2)}`,
      `${js.kesalahanCount} (-${(js.kesalahanCount * 0.01).toFixed(2)})`,
      `${js.kebenaranFinal.toFixed(3)}`,
      `${js.kemantapanScore.toFixed(3)}`,
      `${js.finalScore.toFixed(3)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Juri', 'Nilai Dasar', 'Kesalahan Gerak', 'Nilai Kebenaran', 'Kemantapan', 'Total Nilai Juri']],
      body: juryRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 8, halign: 'center', cellPadding: 2 },
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Box Hasil Keputusan Pemenang
  doc.setDrawColor(180, 83, 9);
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text('KEPUTUSAN AKHIR PERTANDINGAN', 18, currentY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  if (match.category === 'TANDING') {
    const winnerName = match.result?.winnerCorner === 'RED' 
      ? `${match.tanding.redAthlete.name} (${match.tanding.redAthlete.contingent})` 
      : match.result?.winnerCorner === 'BLUE' 
        ? `${match.tanding.blueAthlete.name} (${match.tanding.blueAthlete.contingent})`
        : 'Belum diputuskan / Imbang';
    
    doc.text(`Pemenang: ${winnerName}`, 18, currentY + 12);
    doc.text(`Sudut: ${match.result?.winnerCorner || '-'} | Jenis Kemenangan: Menang ${match.result?.winType || 'Angka'}`, 18, currentY + 17);
  } else {
    doc.text(`Pesilat: ${match.jurus.performer.name} (${match.jurus.performer.contingent})`, 18, currentY + 12);
    doc.text(`Nilai Akhir: ${match.jurus.finalMedianScore.toFixed(3)} | Status: Sah Terverifikasi`, 18, currentY + 17);
  }

  currentY += 30;

  // Tanda Tangan
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const ttdY = currentY;

  // Dewan
  doc.text('Ketua Pertandingan (Dewan),', 25, ttdY);
  doc.line(20, ttdY + 22, 65, ttdY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.leadRefereeName || 'Dewan Pertandingan'} )`, 25, ttdY + 26);

  // Sekretaris
  doc.setFont('helvetica', 'normal');
  doc.text('Sekretaris Pertandingan,', pageWidth - 70, ttdY);
  doc.line(pageWidth - 75, ttdY + 22, pageWidth - 25, ttdY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.secretaryName || 'Sekretaris'} )`, pageWidth - 65, ttdY + 26);

  // Footer
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak secara digital melalui Aplikasi SILAT-SKOR (IPSI 2026/PERSILAT) - ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 288, { align: 'center' });

  // Unduh dokumen
  const fileName = `Berita_Acara_Partai_${match.matchNumber}_${match.category}_Gelanggang_${match.arena.replace(' ', '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Ekspor Rekapitulasi Seluruh Partai Yang Telah Selesai ke Satu Dokumen PDF Master
 */
export function exportAllFinishedMatchesToPdf(finishedMatches: MatchState[], config: TournamentConfig) {
  if (finishedMatches.length === 0) {
    alert('Belum ada partai yang selesai untuk diekspor!');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Cover
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) & PERSILAT', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('BUKU REKAPITULASI HASIL RESMI SELURUH PARTAI PERTANDINGAN', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${config.tournamentName.toUpperCase()} | ${config.arenaName.toUpperCase()} | ${config.dateCreated || config.date}`, pageWidth / 2, 25, { align: 'center' });

  let currentY = 38;

  // Overview Table
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DAFTAR REKAPITULASI PARTAI SELESAI', 14, currentY);
  currentY += 4;

  const tableRows = finishedMatches.map((m) => {
    const isTanding = m.category === 'TANDING';
    const participants = isTanding
      ? `[M] ${m.tanding?.redAthlete?.name || '-'} (${m.tanding?.redAthlete?.contingent || '-'})\nvs\n[B] ${m.tanding?.blueAthlete?.name || '-'} (${m.tanding?.blueAthlete?.contingent || '-'})`
      : `${m.jurus?.performer?.name || '-'} (${m.jurus?.performer?.contingent || '-'})`;

    const score = isTanding
      ? `${m.tanding?.redScores?.totalPoints || 0} : ${m.tanding?.blueScores?.totalPoints || 0}`
      : `Nilai: ${m.jurus?.finalMedianScore?.toFixed(3) || '0.000'}`;

    const winner = m.result?.winnerCorner === 'RED'
      ? `[MERAH] ${m.tanding?.redAthlete?.name || '-'}`
      : m.result?.winnerCorner === 'BLUE'
        ? `[BIRU] ${m.tanding?.blueAthlete?.name || '-'}`
        : m.category !== 'TANDING'
          ? `${m.jurus?.performer?.name || '-'}`
          : 'Selesai';

    return [
      `Partai #${m.matchNumber}`,
      m.category.replace('_', ' '),
      m.classGroup,
      participants,
      score,
      `${winner}\n(${m.result?.winType || 'Resmi'})`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Partai', 'Kategori', 'Kelas', 'Pesilat / Kontingen', 'Skor Akhir', 'Pemenang']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 54 },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 35 }
    }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 14;

  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // Tanda Tangan Resmi
  const city = config.cityCreated || 'Jakarta';
  const dateStr = config.dateCreated || new Date().toLocaleDateString('id-ID');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Dibuat di: ${city}, ${dateStr}`, pageWidth - 70, currentY);
  currentY += 8;

  const ttdY = currentY;
  // Dewan
  doc.text('Ketua Pertandingan (Dewan),', 25, ttdY);
  doc.line(20, ttdY + 20, 65, ttdY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.leadRefereeSignature || config.leadRefereeName || 'Dewan Pertandingan'} )`, 25, ttdY + 24);

  // Sekretaris
  doc.setFont('helvetica', 'normal');
  doc.text('Sekretaris Pertandingan,', pageWidth - 70, ttdY);
  doc.line(pageWidth - 75, ttdY + 20, pageWidth - 25, ttdY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.secretarySignature || config.secretaryName || 'Sekretaris'} )`, pageWidth - 65, ttdY + 24);

  // Save
  doc.save(`Rekapitulasi_Semua_Partai_${config.arenaName.replace(' ', '_')}_${Date.now()}.pdf`);
}

/**
 * Ekspor Jadwal Resmi Pertandingan ke Format PDF A4
 */
export function exportScheduleToPdf(matches: MatchState[], config: TournamentConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) & PERSILAT', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('JADWAL RESMI PERTANDINGAN GELANGGANG', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${config.tournamentName.toUpperCase()} | ${config.arenaName.toUpperCase()} | ${config.dateCreated || config.date}`, pageWidth / 2, 22, { align: 'center' });

  let currentY = 36;

  const tableRows = matches.map((m) => {
    const isTanding = m.category === 'TANDING';
    const matchup = isTanding
      ? `[MERAH] ${m.tanding?.redAthlete?.name || '-'} (${m.tanding?.redAthlete?.contingent || '-'})\nVS\n[BIRU] ${m.tanding?.blueAthlete?.name || '-'} (${m.tanding?.blueAthlete?.contingent || '-'})`
      : `[PESILAT] ${m.jurus?.performer?.name || '-'} (${m.jurus?.performer?.contingent || '-'})`;

    return [
      `Partai #${m.matchNumber}`,
      m.category.replace('_', ' '),
      m.stage.replace('_', ' '),
      formatTandingJurusColumn({
        classCategory: m.classGroup,
        division: m.classGroup,
        weightClass: m.classGroup,
        gender: m.gender,
        stage: m.stage
      }).fullText,
      matchup,
      m.status === 'FINISHED' ? 'SELESAI' : m.status === 'ONGOING' ? 'BERJALAN' : 'MENUNGGU'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Partai', 'Kategori', 'Babak', 'Tanding/Jurus', 'Pesilat / Kontingen', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 28 },
      4: { cellWidth: 64 },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
    }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 12;

  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // Tanda Tangan
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const ttdY = currentY;

  doc.text('Ketua Pertandingan,', 25, ttdY);
  doc.line(20, ttdY + 20, 65, ttdY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.leadRefereeSignature || config.leadRefereeName || 'Ketua Dewan'} )`, 25, ttdY + 24);

  doc.setFont('helvetica', 'normal');
  doc.text('Sekretaris Pertandingan,', pageWidth - 70, ttdY);
  doc.line(pageWidth - 75, ttdY + 20, pageWidth - 25, ttdY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.secretarySignature || config.secretaryName || 'Sekretaris'} )`, pageWidth - 65, ttdY + 24);

  doc.save(`Jadwal_Pertandingan_${config.arenaName.replace(' ', '_')}.pdf`);
}

/**
 * Ekspor Bagan Braket Turnamen ke Format PDF A4
 */
export function exportBracketToPdf(
  bracketTitle: string,
  categoryClass: string,
  bracketType: string,
  matchesData: any[],
  config: TournamentConfig,
  formatSummary?: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) & PERSILAT', pageWidth / 2, 8.5, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`BAGAN PERTANDINGAN: ${bracketTitle.toUpperCase()} - ${categoryClass.toUpperCase()}`, pageWidth / 2, 15, { align: 'center' });

  if (formatSummary) {
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Ketentuan Juara: ${formatSummary}`, pageWidth / 2, 21, { align: 'center' });
  }

  let currentY = 32;

  // Render Bracket Rows Table
  const rows = matchesData.map((m, idx) => [
    `Partai #${m.matchNumber || idx + 1}`,
    m.roundName || `Babak ${m.round || 1}`,
    m.athlete1 ? `${m.athlete1.name} (${m.athlete1.contingent || '-'})` : 'BYE / Menunggu',
    'VS',
    m.athlete2 ? `${m.athlete2.name} (${m.athlete2.contingent || '-'})` : 'BYE / Menunggu',
    m.awardNote || (m.winner ? `Pemenang: ${m.winner.name}` : 'Sesuai Bagan')
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Babak', 'Pesilat Sudut Merah', 'vs', 'Pesilat Sudut Biru', 'Hasil / Pemenang']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 80, textColor: [185, 28, 28] },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 80, textColor: [29, 78, 216] },
      5: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
    }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Signatures
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  doc.text('Ketua Pertandingan,', 40, currentY);
  doc.line(35, currentY + 16, 80, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.leadRefereeSignature || config.leadRefereeName || 'Ketua Dewan'} )`, 40, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.text('Sekretaris Pertandingan,', pageWidth - 80, currentY);
  doc.line(pageWidth - 85, currentY + 16, pageWidth - 35, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.secretarySignature || config.secretaryName || 'Sekretaris'} )`, pageWidth - 75, currentY + 20);

  doc.save(`Bagan_Braket_${categoryClass.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

