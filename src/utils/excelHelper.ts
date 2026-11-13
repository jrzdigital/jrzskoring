import * as XLSX from 'xlsx';
import { SilatAthlete, MatchCategory, Gender, AgeGroup } from '../types/silat';

/**
 * Unduh Template File Excel untuk Registrasi Data Atlet
 */
export function downloadAthleteTemplateExcel() {
  const templateData = [
    // 1. Tanding Putra & Putri
    {
      'No': 1,
      'Nama atlet': 'Muhammad Fadli Pratama',
      'asal kontingen': 'Jawa Barat',
      'kategori usia': 'DEWASA',
      'Disiplin': 'TANDING',
      'Jenis kelamin': 'PUTRA',
      'kelas (khusus tanding)': 'Kelas C (55-60 kg)',
      'gelanggang': 'GELANGGANG 1',
      'berat badan': 58.2,
    },
    {
      'No': 2,
      'Nama atlet': 'Dewi Anggraini',
      'asal kontingen': 'Sumatera Utara',
      'kategori usia': 'DEWASA',
      'Disiplin': 'TANDING',
      'Jenis kelamin': 'PUTRI',
      'kelas (khusus tanding)': 'Kelas C (55-60 kg)',
      'gelanggang': 'GELANGGANG 1',
      'berat badan': 56.4,
    },
    // 2. Jurus Tunggal Putra & Putri
    {
      'No': 3,
      'Nama atlet': 'Ilham Ramadhan',
      'asal kontingen': 'Sumatera Barat',
      'kategori usia': 'DEWASA',
      'Disiplin': 'JURUS',
      'Jenis kelamin': 'PUTRA',
      'kelas (khusus tanding)': 'Tunggal Putra Baku',
      'gelanggang': 'GELANGGANG 2',
      'berat badan': 60.0,
    },
    {
      'No': 4,
      'Nama atlet': 'Siti Nurhaliza Rahayu',
      'asal kontingen': 'DKI Jakarta',
      'kategori usia': 'DEWASA',
      'Disiplin': 'JURUS',
      'Jenis kelamin': 'PUTRI',
      'kelas (khusus tanding)': 'Tunggal Putri Baku',
      'gelanggang': 'GELANGGANG 2',
      'berat badan': 52.0,
    },
    // 3. Jurus Ganda & Regu
    {
      'No': 5,
      'Nama atlet': 'Rian Ardiansyah & Dimas Bayu',
      'asal kontingen': 'Bali',
      'kategori usia': 'DEWASA',
      'Disiplin': 'JURUS',
      'Jenis kelamin': 'PUTRA',
      'kelas (khusus tanding)': 'Ganda Putra Senjata',
      'gelanggang': 'GELANGGANG 2',
      'berat badan': 65.0,
    },
    {
      'No': 6,
      'Nama atlet': 'Tim Regu Srikandi Nusantara',
      'asal kontingen': 'DKI Jakarta',
      'kategori usia': 'DEWASA',
      'Disiplin': 'JURUS',
      'Jenis kelamin': 'PUTRI',
      'kelas (khusus tanding)': 'Regu Baku Putri',
      'gelanggang': 'GELANGGANG 2',
      'berat badan': 53.0,
    },
    // 4. Solo Kreatif
    {
      'No': 7,
      'Nama atlet': 'Arya Bima Perkasa',
      'asal kontingen': 'Kalimantan Timur',
      'kategori usia': 'DEWASA',
      'Disiplin': 'JURUS',
      'Jenis kelamin': 'PUTRA',
      'kelas (khusus tanding)': 'Solo Kreatif Putra',
      'gelanggang': 'GELANGGANG 2',
      'berat badan': 61.0,
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Atlet');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Nama atlet
    { wch: 22 }, // asal kontingen
    { wch: 16 }, // kategori usia
    { wch: 14 }, // Disiplin
    { wch: 14 }, // Jenis kelamin
    { wch: 22 }, // kelas (khusus tanding)
    { wch: 16 }, // gelanggang
    { wch: 14 }, // berat badan
  ];

  XLSX.writeFile(workbook, 'Template_Import_Atlet_IPSI_2026.xlsx');
}

/**
 * Ekspor Seluruh Data Atlet Terdaftar ke Berkas Excel
 */
export function exportAthletesToExcel(athletes: SilatAthlete[]) {
  if (athletes.length === 0) {
    alert('Tidak ada data atlet untuk diunduh!');
    return;
  }

  const exportData = athletes.map((a, idx) => ({
    'No': idx + 1,
    'Nama Lengkap': a.name,
    'Kontingen': a.contingent,
    'Kategori': a.category,
    'Jenis Kelamin': a.gender,
    'Golongan Usia': a.ageGroup,
    'Kelas Tanding': a.classGroup,
    'Gelanggang': a.arena || a.gelanggang || 'GELANGGANG A',
    'Berat Badan (kg)': a.weight || '-',
    'Anggota Tim': a.teamMembers ? a.teamMembers.join(', ') : '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Atlet');

  XLSX.writeFile(workbook, `Data_Atlet_Pencak_Silat_${Date.now()}.xlsx`);
}

/**
 * Impor Data Atlet secara Massal dari File Excel / CSV
 */
export async function importAthletesFromExcel(file: File): Promise<SilatAthlete[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('Berkas Excel kosong atau format tidak sesuai!');
        }

        const validAthletes: SilatAthlete[] = jsonRows.map((row, index) => {
          const name =
            row['Nama atlet'] ||
            row['NAMA ATLET'] ||
            row['Nama Atlet'] ||
            row['Nama Lengkap'] ||
            row['Nama'] ||
            row['Name'] ||
            row['Atlet'] ||
            `Pesilat ${index + 1}`;
          const contingent =
            row['asal kontingen'] ||
            row['ASAL KONTINGEN'] ||
            row['Asal Kontingen'] ||
            row['Kontingen'] ||
            row['Daerah'] ||
            row['Perguruan'] ||
            'Kontingen';
          
          let category: MatchCategory = 'TANDING';
          const disRaw = (row['Disiplin'] || row['DISIPLIN'] || row['disiplin'] || '').toString().toUpperCase();
          const catRaw = (row['Kategori'] || row['Category'] || '').toString().toUpperCase();
          const classRaw = (row['kelas (khusus tanding)'] || row['KELAS (KHUSUS TANDING)'] || row['Kelas Tanding'] || row['Kelas'] || '').toString().toUpperCase();
          
          if (disRaw.includes('JURUS') || disRaw.includes('SENI') || catRaw.includes('JURUS') || catRaw.includes('SENI')) {
            if (classRaw.includes('TUNGGAL') || catRaw.includes('TUNGGAL')) category = 'JURUS_TUNGGAL';
            else if (classRaw.includes('GANDA') || catRaw.includes('GANDA')) category = 'JURUS_GANDA';
            else if (classRaw.includes('REGU') || catRaw.includes('REGU')) category = 'JURUS_REGU';
            else if (classRaw.includes('KREATIF') || classRaw.includes('SOLO') || catRaw.includes('KREATIF') || catRaw.includes('SOLO')) category = 'SOLO_KREATIF';
            else category = 'JURUS_TUNGGAL';
          } else if (catRaw.includes('TUNGGAL') || classRaw.includes('TUNGGAL')) category = 'JURUS_TUNGGAL';
          else if (catRaw.includes('GANDA') || classRaw.includes('GANDA')) category = 'JURUS_GANDA';
          else if (catRaw.includes('REGU') || classRaw.includes('REGU')) category = 'JURUS_REGU';
          else if (catRaw.includes('KREATIF') || catRaw.includes('SOLO') || classRaw.includes('KREATIF') || classRaw.includes('SOLO')) category = 'SOLO_KREATIF';

          const genderRaw = (row['Jenis kelamin'] || row['JENIS KELAMIN'] || row['Jenis Kelamin'] || row['Gender'] || '').toString().toUpperCase();
          let gender: Gender = 'PUTRA';
          if (genderRaw.includes('PUTRI') || genderRaw === 'P' || catRaw.includes('PUTRI') || classRaw.includes('PUTRI')) {
            gender = 'PUTRI';
          }

          const ageRaw = (row['kategori usia'] || row['KATEGORI USIA'] || row['Kategori Usia'] || row['Golongan Usia'] || row['Golongan'] || row['Usia'] || '').toString().toUpperCase();
          let ageGroup: AgeGroup = 'DEWASA';
          if (ageRaw.includes('DINI')) ageGroup = 'USIA_DINI';
          else if (ageRaw.includes('PRA')) ageGroup = 'PRA_REMAJA';
          else if (ageRaw.includes('REMAJA')) ageGroup = 'REMAJA';
          else if (ageRaw.includes('MASTER')) ageGroup = 'MASTER';

          const classGroup = (row['kelas (khusus tanding)'] || row['KELAS (KHUSUS TANDING)'] || row['Kelas Tanding'] || row['Kelas'] || 'Kelas Bebas').toString();
          const weightNum = parseFloat(row['berat badan'] || row['BERAT BADAN'] || row['Berat Badan'] || row['Berat Badan (kg)'] || row['Weight'] || 0) || undefined;
          
          const rawArena = row['gelanggang'] || row['GELANGGANG'] || row['Gelanggang'] || row['Arena'] || row['ARENA'] || row['Ring'] || row['Matras'] || row['MAT'];
          let arena = 'GELANGGANG 1';
          if (rawArena) {
            const s = String(rawArena).trim().toUpperCase();
            arena = s.startsWith('GELANGGANG') ? s : `GELANGGANG ${s}`;
          }

          const teamMembersRaw = (row['Anggota Tim (khusus Ganda/Regu)'] || row['Anggota Tim'] || '').toString();
          const teamMembers = teamMembersRaw.trim()
            ? teamMembersRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined;

          return {
            id: `ath-${Date.now()}-${index}`,
            name: name.toString().trim(),
            contingent: contingent.toString().trim(),
            category,
            gender,
            ageGroup,
            classGroup,
            weight: weightNum,
            arena,
            gelanggang: arena,
            teamMembers
          };
        });

        resolve(validAthletes);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
