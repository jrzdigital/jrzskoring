import { MatchArchiveItem } from '../types/silat';

/**
 * Generates and downloads a CSV spreadsheet of archived matches
 */
export function exportArchivesToCSV(archives: MatchArchiveItem[]) {
  if (!archives || archives.length === 0) {
    alert('Belum ada data arsip pertandingan untuk diunduh.');
    return;
  }

  const headers = [
    'ID Arsip',
    'Waktu Pertandingan',
    'Nomor Partai',
    'Kategori',
    'Gelanggang',
    'Kelas',
    'Pemenang',
    'Keputusan Kemenangan',
    'Ringkasan Skor',
    'Pesilat Sudut Merah',
    'Kontingen Merah',
    'Skor Akhir Merah',
    'Pesilat Sudut Biru',
    'Kontingen Biru',
    'Skor Akhir Biru',
  ];

  const rows = archives.map((item) => {
    const isTanding = item.category === 'tanding';
    const tandingData = item.fullData?.tanding;
    const seniData = item.fullData?.seni;

    return [
      `"${item.id}"`,
      `"${item.archivedAt}"`,
      `"${item.matchNumber}"`,
      `"${item.category.toUpperCase()}"`,
      `"${item.gelanggang}"`,
      `"${item.kelas}"`,
      `"${item.winnerName}"`,
      `"${item.winDecision}"`,
      `"${item.scoreSummary}"`,
      isTanding ? `"${tandingData?.red?.name || '-'}"` : `"${seniData?.pesilatName || '-'}"`,
      isTanding ? `"${tandingData?.red?.kontingen || '-'}"` : `"${seniData?.kontingen || '-'}"`,
      isTanding ? `"${tandingData?.red?.totalScore || 0}"` : `"${seniData?.finalScore || 0}"`,
      isTanding ? `"${tandingData?.blue?.name || '-'}"` : `"-"`,
      isTanding ? `"${tandingData?.blue?.kontingen || '-'}"` : `"-"`,
      isTanding ? `"${tandingData?.blue?.totalScore || 0}"` : `"-"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Arsip_Skoring_Silat_IPSI_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports full archive database as JSON backup
 */
export function exportDatabaseJSON(archives: MatchArchiveItem[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archives, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Backup_Database_Silat_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Triggers browser print dialog for printing official Berita Acara / Score sheet
 */
export function printMatchScoreSheet(item: MatchArchiveItem) {
  const isTanding = item.category === 'tanding';
  const data = item.fullData;
  const red = data?.tanding?.red;
  const blue = data?.tanding?.blue;
  const seni = data?.seni;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Berita Acara Pertandingan Pencak Silat - ${item.matchNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 30px;
          color: #111;
          font-size: 13px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #222;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18px;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 14px;
          margin: 0;
          font-weight: normal;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .meta-table td {
          padding: 4px 8px;
        }
        .score-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .score-table th, .score-table td {
          border: 1px solid #333;
          padding: 8px 10px;
          text-align: center;
        }
        .score-table th {
          background-color: #f2f2f2;
        }
        .red-header {
          background-color: #ffebee !important;
          color: #b71c1c;
          font-weight: bold;
        }
        .blue-header {
          background-color: #e3f2fd !important;
          color: #0d47a1;
          font-weight: bold;
        }
        .signatures {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .sig-box {
          text-align: center;
          width: 28%;
        }
        .sig-line {
          margin-top: 60px;
          border-bottom: 1px solid #333;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>IKATAN PENCAK SILAT INDONESIA (IPSI) / PERSILAT</h1>
        <h2>LEMBAR BERITA ACARA DAN HASIL PERTANDINGAN RESMI</h2>
        <p style="margin: 4px 0 0 0; font-size: 11px;">Standar Pertandingan Digital Sistem 2026</p>
      </div>

      <table class="meta-table">
        <tr>
          <td width="15%"><strong>Nomor Partai</strong></td>
          <td width="35%">: ${item.matchNumber}</td>
          <td width="15%"><strong>Gelanggang</strong></td>
          <td width="35%">: ${item.gelanggang}</td>
        </tr>
        <tr>
          <td><strong>Kategori</strong></td>
          <td>: ${item.category.toUpperCase()}</td>
          <td><strong>Kelas / Golongan</strong></td>
          <td>: ${item.kelas}</td>
        </tr>
        <tr>
          <td><strong>Tanggal / Jam</strong></td>
          <td>: ${item.archivedAt}</td>
          <td><strong>Status Hasil</strong></td>
          <td>: <strong>${item.winDecision}</strong></td>
        </tr>
      </table>

      ${
        isTanding
          ? `
        <table class="score-table">
          <thead>
            <tr>
              <th rowspan="2" width="20%">SUDUT</th>
              <th rowspan="2" width="25%">NAMA PESILAT / KONTINGEN</th>
              <th colspan="3">NILAI BABAK</th>
              <th rowspan="2" width="15%">TOTAL NILAI</th>
              <th rowspan="2" width="16%">STATUS AKHIR</th>
            </tr>
            <tr>
              <th width="8%">I</th>
              <th width="8%">II</th>
              <th width="8%">III</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="red-header">SUDUT MERAH</td>
              <td style="text-align: left;">
                <strong>${red?.name || '-'}</strong><br/>
                <span style="font-size: 11px;">${red?.kontingen || '-'} (${red?.perguruan || '-'})</span>
              </td>
              <td>${red?.roundScores[1] || 0}</td>
              <td>${red?.roundScores[2] || 0}</td>
              <td>${red?.roundScores[3] || 0}</td>
              <td style="font-size: 16px; font-weight: bold; color: #b71c1c;">${red?.totalScore || 0}</td>
              <td><strong>${item.winnerCorner === 'merah' ? 'PEMENANG' : '-'}</strong></td>
            </tr>
            <tr>
              <td class="blue-header">SUDUT BIRU</td>
              <td style="text-align: left;">
                <strong>${blue?.name || '-'}</strong><br/>
                <span style="font-size: 11px;">${blue?.kontingen || '-'} (${blue?.perguruan || '-'})</span>
              </td>
              <td>${blue?.roundScores[1] || 0}</td>
              <td>${blue?.roundScores[2] || 0}</td>
              <td>${blue?.roundScores[3] || 0}</td>
              <td style="font-size: 16px; font-weight: bold; color: #0d47a1;">${blue?.totalScore || 0}</td>
              <td><strong>${item.winnerCorner === 'biru' ? 'PEMENANG' : '-'}</strong></td>
            </tr>
          </tbody>
        </table>
        `
          : `
        <table class="score-table">
          <thead>
            <tr>
              <th>No. Undian</th>
              <th>Nama Pesilat / Regu</th>
              <th>Kontingen</th>
              <th>Kategori Seni</th>
              <th>Waktu Tampil</th>
              <th>Total Potongan Dewan</th>
              <th>NILAI AKHIR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${seni?.nomorUndian || '-'}</td>
              <td><strong>${seni?.pesilatName || '-'}</strong></td>
              <td>${seni?.kontingen || '-'}</td>
              <td>${seni?.subCategory?.toUpperCase() || '-'} (${seni?.gender?.toUpperCase() || '-'})</td>
              <td>${Math.floor((seni?.elapsedTimeSec || 0) / 60)}m ${(seni?.elapsedTimeSec || 0) % 60}s</td>
              <td>-${seni?.potonganDewan?.totalPotonganDewan || 0}</td>
              <td style="font-size: 18px; font-weight: bold; color: #2e7d32;">${seni?.finalScore || 0}</td>
            </tr>
          </tbody>
        </table>
        `
      }

      <div style="margin-top: 15px; padding: 10px; background-color: #fafafa; border: 1px solid #ddd;">
        <strong>KETERANGAN KEPUTUSAN:</strong><br/>
        Pemenang sah: <strong>${item.winnerName}</strong> dengan keputusan <strong>${item.winDecision}</strong>.
      </div>

      <div class="signatures">
        <div class="sig-box">
          <p>Sekretaris Pertandingan</p>
          <div class="sig-line"></div>
          <p>( ........................................ )</p>
        </div>
        <div class="sig-box">
          <p>Ketua Pertandingan / Dewan</p>
          <div class="sig-line"></div>
          <p>( ........................................ )</p>
        </div>
        <div class="sig-box">
          <p>Wasit / Juri Utama</p>
          <div class="sig-line"></div>
          <p>( ........................................ )</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <button onclick="window.print()" style="padding: 8px 20px; font-size: 14px; cursor: pointer;">Cetak Dokumen Ini</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printHtml);
  printWindow.document.close();
}
