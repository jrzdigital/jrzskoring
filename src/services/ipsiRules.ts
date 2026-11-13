/**
 * Modul Perhitungan Skor Resmi Standar IPSI 2026 & PERSILAT Kategori Seni/Jurus
 */

import { DewanPenalty, HasilKalkulasiIPSI, NilaiJuri } from '../types/silat';

export const SKOR_DASAR_PERSILAT = 9.90;
export const PENALTI_KESALAHAN_GERAK = 0.01;
export const DURASI_STANDAR_DETIK = 180; // 3:00 menit

/**
 * Hitung penalti waktu otomatis berdasarkan standar deviasi IPSI 2026
 * Toleransi: 3:00 (180 detik)
 * Setiap kelebihan / kekurangan waktu dikenakan pengurangan:
 * 1 s.d 5 detik: -0.05
 * 6 s.d 10 detik: -0.10
 * 11 s.d 15 detik: -0.15
 * 16 s.d 20 detik: -0.20
 * > 20 detik: -0.25 (atau diskualifikasi dewan)
 */
export function hitungPenaltiWaktuOtomatis(durasiDetik: number = 0, targetDetik: number = DURASI_STANDAR_DETIK): number {
  if (!durasiDetik || durasiDetik <= 0) return 0;
  
  const deviasi = Math.abs(durasiDetik - (targetDetik || DURASI_STANDAR_DETIK));
  
  if (deviasi === 0) return 0.00;
  if (deviasi <= 5) return 0.05;
  if (deviasi <= 10) return 0.10;
  if (deviasi <= 15) return 0.15;
  if (deviasi <= 20) return 0.20;
  return 0.30;
}

/**
 * Hitung total nilai seorang juri
 */
export function hitungSkorJuri(kesalahanGerak: number, kemantapan: number): number {
  const deduksi = kesalahanGerak * PENALTI_KESALAHAN_GERAK;
  const total = SKOR_DASAR_PERSILAT - deduksi + kemantapan;
  return Number(Math.max(0, total).toFixed(4));
}

/**
 * Kalkulasi Rekapitulasi Nilai Seluruh Juri Berdasarkan Aturan Persilat 2026
 * - Jika juri >= 8 (misal 10 Juri): buang 2 tertinggi dan 2 terendah, rata-ratakan sisa juri.
 * - Jika juri 5 - 7: buang 1 tertinggi dan 1 terendah, rata-ratakan sisa juri.
 * - Jika juri < 5: rata-ratakan seluruh juri yang aktif.
 */
export function kalkulasiHasilIPSI(
  nilaiJuriMap: Record<number, NilaiJuri> = {},
  penaltiDewan: DewanPenalty = {}
): HasilKalkulasiIPSI {
  const juriArray = Object.values(nilaiJuriMap || {}).filter(j => j && j.totalSkorJuri > 0);
  
  if (juriArray.length === 0) {
    return {
      skorJuriValid: [],
      skorTertinggiDibuang: [],
      skorTerendahDibuang: [],
      rataRataJuri: 0,
      totalHukuman: 0,
      skorAkhir: 0,
      rataRataKebenaran: 0,
      rataRataKemantapan: 0,
      standarDeviasi: 0,
    };
  }

  // Sort scores ascending
  const sortedScores = [...juriArray.map(j => j.totalSkorJuri)].sort((a, b) => a - b);
  const totalJuri = sortedScores.length;

  let buangBawah = 0;
  let buangAtas = 0;

  if (totalJuri >= 8) {
    buangBawah = 2;
    buangAtas = 2;
  } else if (totalJuri >= 5) {
    buangBawah = 1;
    buangAtas = 1;
  }

  const skorTerendahDibuang = sortedScores.slice(0, buangBawah);
  const skorTertinggiDibuang = sortedScores.slice(totalJuri - buangAtas);
  const skorJuriValid = sortedScores.slice(buangBawah, totalJuri - buangAtas);

  const sumValid = skorJuriValid.reduce((acc, curr) => acc + curr, 0);
  const rataRataJuri = skorJuriValid.length > 0 ? sumValid / skorJuriValid.length : 0;

  // Rata-rata kebenaran gerak
  const avgKebenaran = juriArray.reduce((acc, curr) => acc + (SKOR_DASAR_PERSILAT - (curr.kesalahanGerak || 0) * PENALTI_KESALAHAN_GERAK), 0) / totalJuri;
  const avgKemantapan = juriArray.reduce((acc, curr) => acc + (curr.kemantapanSkor || 0), 0) / totalJuri;

  // Standar deviasi juri
  const meanAll = sortedScores.reduce((a, b) => a + b, 0) / totalJuri;
  const variance = sortedScores.reduce((acc, val) => acc + Math.pow(val - meanAll, 2), 0) / totalJuri;
  const standarDeviasi = Math.sqrt(variance);

  // Total Hukuman = Penalti Waktu Otomatis + Penalti Dewan Manual
  const totalPenaltiManual = 
    ((penaltiDewan.keluarGelanggangCount || 0) * 0.05) +
    ((penaltiDewan.senjataJatuhCount || 0) * 0.05) +
    ((penaltiDewan.atributLepasCount || 0) * 0.05) +
    ((penaltiDewan.melewatiBatasWaktuCount || 0) * 0.05);

  const totalHukuman = penaltiDewan.diskualifikasi 
    ? 9.99 
    : Number(((penaltiDewan.penaltiWaktuOtomatis || 0) + totalPenaltiManual).toFixed(3));

  const skorAkhir = penaltiDewan.diskualifikasi 
    ? 0.00 
    : Math.max(0, Number((rataRataJuri - totalHukuman).toFixed(3)));

  return {
    skorJuriValid,
    skorTertinggiDibuang,
    skorTerendahDibuang,
    rataRataJuri: Number(rataRataJuri.toFixed(3)),
    totalHukuman,
    skorAkhir,
    rataRataKebenaran: Number(avgKebenaran.toFixed(3)),
    rataRataKemantapan: Number(avgKemantapan.toFixed(3)),
    standarDeviasi: Number(standarDeviasi.toFixed(4)),
  };
}

/**
 * Format detik menjadi tampilan MM:SS.S
 */
export function formatWaktu(totalDetik: number = 0): string {
  if (!totalDetik || totalDetik <= 0) return '00:00.0';
  const minutes = Math.floor(totalDetik / 60);
  const seconds = Math.floor(totalDetik % 60);
  const fraction = Math.floor((totalDetik % 1) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${fraction}`;
}

/**
 * Data daftar 14 Rincian Jurus Baku Seni Tunggal IPSI (100 Gerakan)
 */
export const RINCIAN_JURUS_TUNGGAL = [
  { no: 1, nama: 'Tangan Kosong - Jurus 1', gerakan: 7, kategori: 'Tangan Kosong' },
  { no: 2, nama: 'Tangan Kosong - Jurus 2', gerakan: 6, kategori: 'Tangan Kosong' },
  { no: 3, nama: 'Tangan Kosong - Jurus 3', gerakan: 6, kategori: 'Tangan Kosong' },
  { no: 4, nama: 'Tangan Kosong - Jurus 4', gerakan: 7, kategori: 'Tangan Kosong' },
  { no: 5, nama: 'Tangan Kosong - Jurus 5', gerakan: 8, kategori: 'Tangan Kosong' },
  { no: 6, nama: 'Tangan Kosong - Jurus 6', gerakan: 9, kategori: 'Tangan Kosong' },
  { no: 7, nama: 'Tangan Kosong - Jurus 7', gerakan: 7, kategori: 'Tangan Kosong' },
  { no: 8, nama: 'Senjata Golok - Jurus 1', gerakan: 7, kategori: 'Golok/Parang' },
  { no: 9, nama: 'Senjata Golok - Jurus 2', gerakan: 7, kategori: 'Golok/Parang' },
  { no: 10, nama: 'Senjata Golok - Jurus 3', gerakan: 6, kategori: 'Golok/Parang' },
  { no: 11, nama: 'Senjata Golok - Jurus 4', gerakan: 5, kategori: 'Golok/Parang' },
  { no: 12, nama: 'Senjata Tongkat - Jurus 1', gerakan: 9, kategori: 'Tongkat/Toya' },
  { no: 13, nama: 'Senjata Tongkat - Jurus 2', gerakan: 8, kategori: 'Tongkat/Toya' },
  { no: 14, nama: 'Senjata Tongkat - Jurus 3', gerakan: 8, kategori: 'Tongkat/Toya' },
];
