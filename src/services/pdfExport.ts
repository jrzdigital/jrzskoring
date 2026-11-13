/**
 * PDF Export Service untuk Laporan Rekapitulasi Nilai Seni Pencak Silat IPSI 2026 / PERSILAT
 * Menggunakan jsPDF untuk menghasilkan dokumen resmi berkop rapi dan profesional.
 */

import jsPDF from 'jspdf';
import { Partai } from '../types/silat';
import { formatWaktu, kalkulasiHasilIPSI } from './ipsiRules';

export function exportPartaiPDF(partai: Partai): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hasil = partai.hasilAkhir || kalkulasiHasilIPSI(partai.nilaiJuri, partai.penaltiDewan);

  // Set colors
  const primaryColor: [number, number, number] = [17, 24, 39]; // Slate 900
  const accentRed: [number, number, number] = [185, 28, 28]; // Red 700

  // Header Border / Top Line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.2);
  doc.line(15, 28, 195, 28);
  doc.setLineWidth(0.4);
  doc.line(15, 29.5, 195, 29.5);

  // Kop Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text('PENGURUS BESAR IKATAN PENCAK SILAT INDONESIA (PB IPSI)', 105, 14, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PERSEKUTUAN PENCAK SILAT ANTARABANGSA (PERSILAT) - PERATURAN PERTANDINGAN 2026', 105, 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...accentRed);
  doc.text('LEMBAR REKAPITULASI RESMI PENILAIAN SENI / JURUS', 105, 25, { align: 'center' });

  // Metadata Box
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  let y = 36;
  const col1 = 18;
  const col2 = 65;
  const col3 = 115;
  const col4 = 160;

  // Box background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y - 4, 180, 28, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(15, y - 4, 180, 28, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.text('Nomor Partai:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Partai ${partai.nomorPartai} (${partai.gelanggang})`, col2, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Kategori / Kelas:', col3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${partai.kategori} - ${partai.golongan} (${partai.gender})`, col4, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Pesilat:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(partai.pesilat.nama, col2, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Sudut / Undian:', col3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sudut ${partai.sudut} / Lot #${partai.pesilat.nomorUndian || '-'}`, col4, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Kontingen / Tim:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(partai.pesilat.kontingen, col2, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Babak Pertandingan:', col3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${partai.babak || 'Penyisihan'} (${partai.pool || 'Pool A'})`, col4, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Durasi Tampilan:', col1, y);
  doc.setFont('helvetica', 'normal');
  const durasiTampil = partai.penaltiDewan?.waktuTampilDetik ?? partai.durasiBerjalanDetik ?? 0;
  doc.text(`${formatWaktu(durasiTampil)} (Standar: 03:00)`, col2, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Partai:', col3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(partai.status === 'DISAHKAN' ? 'DISAHKAN (FINAL)' : (partai.status || 'PENDING'), col4, y);

  // Table of 10 Jury Scores
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. RINCIAN PEROLEHAN NILAI JURI (STANDAR 10 JURI PERSILAT)', 15, y);

  y += 4;
  // Table header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(15, y, 180, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  doc.text('Juri', 20, y + 4.8);
  doc.text('Kebenaran (-0.01/err)', 42, y + 4.8);
  doc.text('Kesalahan', 85, y + 4.8);
  doc.text('Kemantapan', 115, y + 4.8);
  doc.text('Total Juri', 145, y + 4.8);
  doc.text('Status Persilat', 170, y + 4.8);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const juriScoresList: any[] = Object.values(partai.nilaiJuri || {});
  for (let i = 1; i <= 10; i++) {
    const item: any = juriScoresList.find((j: any) => j.juriId === i);
    const isEven = i % 2 === 0;

    if (isEven) {
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 5.5, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(15, y + 5.5, 195, y + 5.5);

    const totalJuri = item ? item.totalSkorJuri : 0;
    let statusText = 'Valid (Dihitung)';
    let statusColor: [number, number, number] = [22, 101, 52]; // Green

    if (hasil.skorTertinggiDibuang?.includes(totalJuri)) {
      statusText = 'Dibuang (Tertinggi)';
      statusColor = [180, 83, 9]; // Amber
    } else if (hasil.skorTerendahDibuang?.includes(totalJuri)) {
      statusText = 'Dibuang (Terendah)';
      statusColor = [185, 28, 28]; // Red
    }

    doc.setTextColor(0, 0, 0);
    doc.text(`Juri ${i}`, 20, y + 4);
    doc.text(item ? item.kebenaranSkor.toFixed(3) : '-', 42, y + 4);
    doc.text(item ? `${item.kesalahanGerak}x` : '-', 88, y + 4);
    doc.text(item ? `+${item.kemantapanSkor.toFixed(3)}` : '-', 115, y + 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text(item ? totalJuri.toFixed(3) : '0.000', 145, y + 4);

    doc.setTextColor(...statusColor);
    doc.setFontSize(7.5);
    doc.text(statusText, 170, y + 4);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');

    y += 5.5;
  }

  // Section 2: Penalti Waktu & Dewan Juri
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. PENGURANGAN NILAI (PENALTI WAKTU & DEWAN JURI)', 15, y);

  y += 4;
  doc.setFillColor(254, 242, 242); // Red 50
  doc.rect(15, y, 180, 22, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.rect(15, y, 180, 22, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  const pDewan = partai.penaltiDewan || {
    penaltiWaktuOtomatis: 0,
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    atributLepasCount: 0,
    melewatiBatasWaktuCount: 0,
    waktuTampilDetik: 0
  };
  const totalHukuman = hasil?.totalHukuman ?? 0;
  const rataRataJuri = hasil?.rataRataJuri ?? 0;
  const skorAkhir = hasil?.skorAkhir ?? 0;

  doc.text(`• Penalti Waktu Otomatis (Deviasi Standar 03:00):`, 20, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`-${(pDewan.penaltiWaktuOtomatis ?? 0).toFixed(2)}`, 110, y + 5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Keluar Gelanggang (${pDewan.keluarGelanggangCount ?? 0}x @ -0.05):`, 20, y + 10);
  doc.text(`-${((pDewan.keluarGelanggangCount ?? 0) * 0.05).toFixed(2)}`, 110, y + 10);

  doc.text(`• Senjata Jatuh / Tak Sesuai (${pDewan.senjataJatuhCount ?? 0}x @ -0.05):`, 20, y + 15);
  doc.text(`-${((pDewan.senjataJatuhCount ?? 0) * 0.05).toFixed(2)}`, 110, y + 15);

  doc.text(`• Pakaian / Sabuk Lepas (${pDewan.atributLepasCount ?? 0}x @ -0.05):`, 130, y + 5);
  doc.text(`-${((pDewan.atributLepasCount ?? 0) * 0.05).toFixed(2)}`, 180, y + 5);

  doc.text(`• Melewati Batas Gong (${pDewan.melewatiBatasWaktuCount ?? 0}x @ -0.05):`, 130, y + 10);
  doc.text(`-${((pDewan.melewatiBatasWaktuCount ?? 0) * 0.05).toFixed(2)}`, 180, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Hukuman Dewan & Waktu:`, 130, y + 17);
  doc.setTextColor(185, 28, 28);
  doc.text(`-${totalHukuman.toFixed(3)}`, 180, y + 17);

  // Section 3: Ringkasan Nilai Akhir
  y += 27;
  doc.setFillColor(24, 24, 27); // Dark zinc 900
  doc.roundedRect(15, y, 180, 25, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Rata-rata 6 Juri Sah (Tengah):', 22, y + 8);
  doc.text('Total Seluruh Pengurangan Hukuman:', 22, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(rataRataJuri.toFixed(3), 85, y + 8);
  doc.text(`-${totalHukuman.toFixed(3)}`, 85, y + 15);

  doc.line(110, y + 4, 110, y + 21);

  doc.setFontSize(10);
  doc.text('NILAI AKHIR RESMI', 125, y + 8);
  doc.setFontSize(20);
  doc.setTextColor(250, 204, 21); // Gold yellow
  doc.text(skorAkhir.toFixed(3), 125, y + 18);

  // Section 4: Tanda Tangan Resmi
  y += 35;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const tanggalStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.text(`Ditetapkan di Tempat Pertandingan, ${tanggalStr}`, 130, y);

  y += 6;
  doc.text('Dewan Juri Pertandingan,', 25, y);
  doc.text('Ketua Pertandingan,', 140, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('( .................................................. )', 25, y);
  doc.text('( .................................................. )', 140, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sertifikasi Juri Internasional / Nasional IPSI', 25, y + 4);
  doc.text('Technical Delegate PERSILAT', 140, y + 4);

  // Save the PDF
  const filename = `Rekap_IPSI_Partai_${partai.nomorPartai}_${partai.pesilat.nama.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Export Semua Hasil Turnamen dalam bentuk PDF Rekap Lengkap
 */
export function exportSemuaPartaiPDF(partaiList: Partai[]): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REKAPITULASI HASIL PERTANDINGAN PENCAK SILAT KATEGORI JURUS / SENI', 148, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('STANDAR PERSILAT & PB IPSI 2026 - GELANGGANG TERPADU', 148, 20, { align: 'center' });

  // Table header
  let y = 28;
  doc.setFillColor(15, 23, 42);
  doc.rect(15, y, 267, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  doc.text('No', 18, y + 5.5);
  doc.text('Partai', 28, y + 5.5);
  doc.text('Nama Pesilat', 45, y + 5.5);
  doc.text('Kontingen', 95, y + 5.5);
  doc.text('Kategori', 140, y + 5.5);
  doc.text('Waktu', 170, y + 5.5);
  doc.text('Rata Juri', 190, y + 5.5);
  doc.text('Penalti', 210, y + 5.5);
  doc.text('Nilai Akhir', 230, y + 5.5);
  doc.text('Status', 255, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  partaiList.forEach((p, idx) => {
    const hasil = p.hasilAkhir || kalkulasiHasilIPSI(p.nilaiJuri, p.penaltiDewan);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 267, 6, 'F');
    }

    doc.setTextColor(0, 0, 0);
    doc.text(`${idx + 1}`, 18, y + 4.2);
    doc.text(`#${p.nomorPartai}`, 28, y + 4.2);
    doc.text(p.pesilat.nama.slice(0, 25), 45, y + 4.2);
    doc.text(p.pesilat.kontingen.slice(0, 22), 95, y + 4.2);
    const durasi = p.durasiBerjalanDetik ?? 0;
    const rataRata = hasil?.rataRataJuri ?? 0;
    const totalHukum = hasil?.totalHukuman ?? 0;
    const skorAkhir = hasil?.skorAkhir ?? 0;

    doc.text(formatWaktu(durasi), 170, y + 4.2);
    doc.text(rataRata.toFixed(3), 190, y + 4.2);
    doc.text(`-${totalHukum.toFixed(3)}`, 210, y + 4.2);
    
    doc.setFont('helvetica', 'bold');
    doc.text(skorAkhir.toFixed(3), 230, y + 4.2);
    doc.setFont('helvetica', 'normal');

    doc.text(p.status || 'PENDING', 255, y + 4.2);

    y += 6;
  });

  doc.save('Rekap_Kejuaraan_Pencak_Silat_IPSI_2026.pdf');
}
