import { jsPDF } from "jspdf";

export interface ScheduleExportItem {
  partai?: string | number;
  gelanggang?: string;
  kelas?: string;
  usia?: string;
  gender?: string;
  tahapan?: string;
  blueName?: string;
  blueContingent?: string;
  redName?: string;
  redContingent?: string;
  status?: string;
}

/**
 * Generates an official, high-contrast, pure-white A4 PDF for match schedules.
 * Suitable for high-speed printing and clean distribution.
 */
export function exportScheduleToA4Pdf(
  items: ScheduleExportItem[],
  tournamentName: string = "TURNAMEN PENCAK SILAT",
  arena: string = "GELANGGANG A"
) {
  if (!items || items.length === 0) {
    alert("Belum ada jadwal pertandingan untuk diunduh!");
    return;
  }

  const doc = new jsPDF("landscape", "mm", "a4");
  doc.setFont("Helvetica");

  const truncate = (str: string | undefined | null, max: number) => {
    if (!str) return "-";
    return str.length > max ? str.substring(0, max) + "..." : str;
  };

  const rowsPerPage = 12;
  const totalPages = Math.ceil(items.length / rowsPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
    }

    // 1. Pure White Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, "F");

    // 2. Official IPSI Header Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.7);
    doc.roundedRect(12, 10, 273, 24, 2, 2, "FD");

    // Kop Texts
    doc.setTextColor(5, 150, 105); // Emerald Green
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("IKATAN PENCAK SILAT INDONESIA (IPSI)", 18, 17);

    doc.setTextColor(0, 0, 0); // Black
    doc.setFontSize(14);
    doc.text("DAFTAR RESMI JADWAL PARTAI PERTANDINGAN SENI JURUS TGRS", 18, 24);

    doc.setTextColor(51, 65, 85); // Slate
    doc.setFontSize(8.5);
    doc.setFont("Helvetica", "normal");
    doc.text(
      `${tournamentName}   •   ${arena}   •   KATEGORI JURUS TGRS (TUNGGAL • GANDA • REGU • SOLO KREATIF)   •   TOTAL ${items.length} PARTAI`,
      18,
      30.5
    );

    // Right Badge on Header Box
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.roundedRect(216, 14, 63, 16, 1.5, 1.5, "FD");

    doc.setTextColor(4, 120, 87);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.text("STANDAR IPSI 2026", 247.5, 21, { align: "center" });

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text(`HALAMAN ${page + 1} DARI ${totalPages}`, 247.5, 26.5, { align: "center" });

    // 3. Table Header
    const tableStartY = 38;
    const headerHeight = 9;

    doc.setFillColor(15, 23, 42); // Deep Navy
    doc.rect(12, tableStartY, 273, headerHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");

    doc.text("PARTAI", 20, tableStartY + 6, { align: "center" });
    doc.text("GELANGGANG", 42, tableStartY + 6, { align: "center" });
    doc.text("KATEGORI JURUS (TGRS)", 60, tableStartY + 6);
    doc.text("BABAK", 108, tableStartY + 6);
    doc.text("SUDUT BIRU (BLUE)", 140, tableStartY + 6);
    doc.text("SUDUT MERAH (RED)", 205, tableStartY + 6);
    doc.text("STATUS", 272, tableStartY + 6, { align: "right" });

    // 4. Table Rows
    const startIndex = page * rowsPerPage;
    const pageItems = items.slice(startIndex, startIndex + rowsPerPage);
    let currentY = tableStartY + headerHeight;
    const rowHeight = 12.5;

    pageItems.forEach((item, idx) => {
      const isEven = idx % 2 === 0;

      // Row Background (Zebra Striping)
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(12, currentY, 273, rowHeight, "F");

      // Bottom Row Border
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(12, currentY + rowHeight, 285, currentY + rowHeight);

      // Partai Number Box
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, currentY + 2.5, 10, 7.5, 1, 1, "FD");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "bold");
      const partaiLabel = String(item.partai || startIndex + idx + 1).replace(/^Partai\s*/i, "");
      doc.text(partaiLabel, 20, currentY + 7.5, { align: "center" });

      // Gelanggang
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(7.5);
      doc.setFont("Helvetica", "normal");
      doc.text(item.gelanggang || arena, 42, currentY + 7.5, { align: "center" });

      // Kategori Jurus & Usia
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "bold");
      const rawK = String(item.kelas || "TUNGGAL").toUpperCase();
      const catLabel = ["TUNGGAL", "GANDA", "REGU", "SOLO KREATIF"].includes(rawK)
        ? `JURUS ${rawK}`
        : (rawK.startsWith("KELAS") ? rawK.replace(/^KELAS\s*/i, "JURUS ") : `JURUS ${rawK}`);
      doc.text(truncate(catLabel, 22), 60, currentY + 5.5);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont("Helvetica", "normal");
      doc.text(truncate(`${item.usia || "-"} • ${item.gender || "-"}`, 24), 60, currentY + 10);

      // Babak / Tahapan
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("Helvetica", "bold");
      doc.text(truncate(item.tahapan || "-", 18), 108, currentY + 7.5);

      // Sudut Biru (Blue Corner)
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(138, currentY + 1.5, 62, rowHeight - 3, 1, 1, "F");

      doc.setTextColor(29, 78, 216); // Bold Blue
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "bold");
      doc.text(truncate(item.blueName || "TBD", 26), 142, currentY + 5.5);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("Helvetica", "normal");
      doc.text(truncate(item.blueContingent || "-", 30), 142, currentY + 9.5);

      // Sudut Merah (Red Corner)
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(203, currentY + 1.5, 62, rowHeight - 3, 1, 1, "F");

      doc.setTextColor(220, 38, 38); // Bold Red
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "bold");
      doc.text(truncate(item.redName || "TBD", 26), 207, currentY + 5.5);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("Helvetica", "normal");
      doc.text(truncate(item.redContingent || "-", 30), 207, currentY + 9.5);

      // Status
      const isSelesai = String(item.status || "").toUpperCase().includes("SELESAI");
      if (isSelesai) {
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(22, 163, 74);
        doc.roundedRect(268, currentY + 3.5, 16, 5.5, 1, 1, "FD");
        doc.setTextColor(21, 128, 61);
        doc.setFontSize(6.5);
        doc.setFont("Helvetica", "bold");
        doc.text("SELESAI", 276, currentY + 7.3, { align: "center" });
      } else {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(217, 119, 6);
        doc.roundedRect(268, currentY + 3.5, 16, 5.5, 1, 1, "FD");
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(6.5);
        doc.setFont("Helvetica", "bold");
        doc.text("BELUM", 276, currentY + 7.3, { align: "center" });
      }

      currentY += rowHeight;
    });

    // Outer Table Border
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(12, tableStartY, 273, headerHeight + pageItems.length * rowHeight);

    // 5. Page Footer
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text(
      `Dokumen Resmi Jadwal Pertandingan IPSI 2026 • Dicetak oleh JRZ SCORE TGR pada ${new Date().toLocaleString("id-ID")}`,
      12,
      202
    );
    doc.text(
      `Halaman ${page + 1} dari ${totalPages}`,
      285,
      202,
      { align: "right" }
    );
  }

  const cleanFilename = `Jadwal_Pertandingan_${tournamentName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(cleanFilename);
}
