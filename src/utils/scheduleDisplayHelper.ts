/**
 * Helper pemformat kolom "Tanding/Jurus" pada Cetak & Unduh Jadwal Pertandingan PDF A4
 * Sesuai Standar Resmi IPSI & PERSILAT:
 * 
 * Baris 1: Nama Kelas (contoh: "KELAS B")
 * Baris 2: Rentang Berat & Gender (contoh: "(> 28 – 30 KG) / Pa")
 * Baris 3: Kategori Usia & Babak Pertandingan (contoh: "(USIA DINI 2 - FINAL B1)")
 */

export interface TandingJurusDisplay {
  line1: string; // e.g. "KELAS B"
  line2: string; // e.g. "(> 28 – 30 KG) / Pa"
  line3: string; // e.g. "(USIA DINI 2 - FINAL B1)"
  fullText: string; // Multi-line text with newlines
}

/**
 * Lookup rentang berat resmi IPSI berdasarkan Golongan Usia dan Kelas
 */
export function getIpsiWeightRange(division: string, classLetter: string): string {
  const divUpper = (division || "").toUpperCase();
  const clsUpper = (classLetter || "").toUpperCase().replace(/^KELAS\s*/i, "").trim();

  // 1. Usia Dini (Pra Usia Dini, Usia Dini 1, Usia Dini 2)
  if (divUpper.includes("USIA DINI") || divUpper.includes("DINI") || divUpper.includes("UD")) {
    switch (clsUpper) {
      case "UNDER": return "(< 26 KG)";
      case "A": return "(> 26 – 28 KG)";
      case "B": return "(> 28 – 30 KG)";
      case "C": return "(> 30 – 32 KG)";
      case "D": return "(> 32 – 34 KG)";
      case "E": return "(> 34 – 36 KG)";
      case "F": return "(> 36 – 38 KG)";
      case "BEBAS": return "(> 38 KG)";
      default: break;
    }
  }

  // 2. Pra Remaja
  if (divUpper.includes("PRA REMAJA") || divUpper.includes("PRA-REMAJA")) {
    switch (clsUpper) {
      case "UNDER": return "(< 30 KG)";
      case "A": return "(> 30 – 33 KG)";
      case "B": return "(> 33 – 36 KG)";
      case "C": return "(> 36 – 39 KG)";
      case "D": return "(> 39 – 42 KG)";
      case "E": return "(> 42 – 45 KG)";
      case "F": return "(> 45 – 48 KG)";
      case "G": return "(> 48 – 51 KG)";
      case "H": return "(> 51 – 54 KG)";
      case "I": return "(> 54 – 57 KG)";
      case "J": return "(> 57 – 60 KG)";
      case "BEBAS": return "(> 60 KG)";
      default: break;
    }
  }

  // 3. Remaja
  if (divUpper.includes("REMAJA")) {
    switch (clsUpper) {
      case "UNDER": return "(< 39 KG)";
      case "A": return "(> 39 – 43 KG)";
      case "B": return "(> 43 – 47 KG)";
      case "C": return "(> 47 – 51 KG)";
      case "D": return "(> 51 – 55 KG)";
      case "E": return "(> 55 – 59 KG)";
      case "F": return "(> 59 – 63 KG)";
      case "G": return "(> 63 – 67 KG)";
      case "H": return "(> 67 – 71 KG)";
      case "I": return "(> 71 – 75 KG)";
      case "J": return "(> 75 – 79 KG)";
      case "BEBAS": return "(> 79 KG)";
      default: break;
    }
  }

  // 4. Dewasa / Master
  if (divUpper.includes("DEWASA") || divUpper.includes("MASTER")) {
    switch (clsUpper) {
      case "UNDER": return "(< 45 KG)";
      case "A": return "(> 45 – 50 KG)";
      case "B": return "(> 50 – 55 KG)";
      case "C": return "(> 55 – 60 KG)";
      case "D": return "(> 60 – 65 KG)";
      case "E": return "(> 65 – 70 KG)";
      case "F": return "(> 70 – 75 KG)";
      case "G": return "(> 75 – 80 KG)";
      case "H": return "(> 80 – 85 KG)";
      case "I": return "(> 85 – 90 KG)";
      case "J": return "(> 90 – 95 KG)";
      case "BEBAS": return "(> 95 KG)";
      default: break;
    }
  }

  // Default fallback jika divisi umum / tidak terdefinisi
  switch (clsUpper) {
    case "A": return "(> 26 – 28 KG)";
    case "B": return "(> 28 – 30 KG)";
    case "C": return "(> 30 – 32 KG)";
    case "D": return "(> 32 – 34 KG)";
    case "E": return "(> 34 – 36 KG)";
    case "F": return "(> 36 – 38 KG)";
    case "BEBAS": return "(> 38 KG)";
    default: return "";
  }
}

/**
 * Format sel tabel kolom "Tanding/Jurus" menjadi 3 baris terstruktur:
 * Baris 1: KELAS B
 * Baris 2: (> 28 – 30 KG) / Pa
 * Baris 3: (USIA DINI 2 - FINAL B1)
 */
export function formatTandingJurusColumn(match: any, categories?: any[]): TandingJurusDisplay {
  if (!match) {
    return {
      line1: "KELAS B",
      line2: "(> 28 – 30 KG) / Pa",
      line3: "(USIA DINI 2 - FINAL B1)",
      fullText: "KELAS B\n(> 28 – 30 KG) / Pa\n(USIA DINI 2 - FINAL B1)"
    };
  }

  const matchObj = typeof match === "string" ? { rawString: match } : match;

  // Kumpulkan seluruh string yang relevan untuk parsing tangguh
  const rawClassCat = String(
    matchObj.classCategory || 
    matchObj.categoryClass || 
    matchObj.categoryClassId || 
    matchObj.kelas || 
    matchObj.weightClass || 
    matchObj.rawString || 
    ""
  ).trim();

  const combinedRaw = [
    rawClassCat,
    String(matchObj.stage || ""),
    String(matchObj.babak || ""),
    String(matchObj.tahap || ""),
    String(matchObj.name || "")
  ].join(" ").trim();

  // 1. Ekstraksi Divisi / Golongan Usia
  let division = "";
  if (matchObj.division && typeof matchObj.division === "string" && matchObj.division.trim()) {
    division = matchObj.division.trim().toUpperCase();
  } else if (matchObj.ageCategory && typeof matchObj.ageCategory === "string" && matchObj.ageCategory.trim()) {
    division = matchObj.ageCategory.trim().toUpperCase();
  } else if (matchObj.ageGroup && typeof matchObj.ageGroup === "string" && matchObj.ageGroup.trim()) {
    division = matchObj.ageGroup.trim().toUpperCase();
  }

  if (!division) {
    if (/PRA\s*USIA\s*DINI/i.test(combinedRaw)) division = "PRA USIA DINI";
    else if (/USIA\s*DINI\s*2/i.test(combinedRaw)) division = "USIA DINI 2";
    else if (/USIA\s*DINI\s*1/i.test(combinedRaw)) division = "USIA DINI 1";
    else if (/USIA\s*DINI/i.test(combinedRaw)) division = "USIA DINI 2";
    else if (/PRA\s*REMAJA/i.test(combinedRaw)) division = "PRA REMAJA";
    else if (/REMAJA/i.test(combinedRaw)) division = "REMAJA";
    else if (/DEWASA/i.test(combinedRaw)) division = "DEWASA";
    else if (/MASTER/i.test(combinedRaw)) division = "MASTER";
  }

  if (!division && categories && categories.length > 0 && matchObj.categoryClassId) {
    const catFound = categories.find((c: any) => c.id === matchObj.categoryClassId);
    if (catFound?.division) {
      division = String(catFound.division).toUpperCase();
    }
  }

  if (!division) {
    division = "USIA DINI 2";
  }

  // 2. Ekstraksi Nama Kelas (Line 1: e.g. "KELAS B", "KELAS A", "KELAS BEBAS")
  let line1 = "";
  let classLetter = "";

  // Cek weightClass langsung jika ada
  if (matchObj.weightClass && typeof matchObj.weightClass === "string") {
    const wc = matchObj.weightClass.trim();
    const wcMatch = wc.match(/Kelas\s+([A-Za-z0-9\-\+]+)/i);
    if (wcMatch && wcMatch[1]) {
      classLetter = wcMatch[1].toUpperCase();
      line1 = `KELAS ${classLetter}`;
    } else if (/^[A-Za-z]$/i.test(wc)) {
      classLetter = wc.toUpperCase();
      line1 = `KELAS ${classLetter}`;
    } else if (/bebas/i.test(wc)) {
      classLetter = "BEBAS";
      line1 = "KELAS BEBAS";
    } else if (/under/i.test(wc)) {
      classLetter = "UNDER";
      line1 = "UNDER";
    } else {
      line1 = wc.toUpperCase();
      classLetter = line1.replace(/^KELAS\s*/i, "").trim();
    }
  }

  // Jika line 1 belum terbentuk, cari di combinedRaw
  if (!line1) {
    const matchedClass = combinedRaw.match(/(?:Kelas|Class)\s+([A-Za-z0-9\-\+]+)/i);
    if (matchedClass && matchedClass[1]) {
      const clsPart = matchedClass[1].toUpperCase().trim();
      if (clsPart.includes("BEBAS")) {
        classLetter = "BEBAS";
        line1 = "KELAS BEBAS";
      } else {
        classLetter = clsPart;
        line1 = `KELAS ${classLetter}`;
      }
    } else if (/\bKelas\s*([A-Za-z])\b/i.test(combinedRaw)) {
      const singleMatch = combinedRaw.match(/\bKelas\s*([A-Za-z])\b/i);
      classLetter = singleMatch ? singleMatch[1].toUpperCase() : "B";
      line1 = `KELAS ${classLetter}`;
    } else if (/\bbebas\b/i.test(combinedRaw)) {
      classLetter = "BEBAS";
      line1 = "KELAS BEBAS";
    } else if (/\bunder\b/i.test(combinedRaw)) {
      classLetter = "UNDER";
      line1 = "UNDER";
    } else if (/tunggal/i.test(combinedRaw)) {
      line1 = "SENI TUNGGAL";
    } else if (/ganda/i.test(combinedRaw)) {
      line1 = "SENI GANDA";
    } else if (/regu/i.test(combinedRaw)) {
      line1 = "SENI REGU";
    } else if (/solo/i.test(combinedRaw)) {
      line1 = "SOLO KREATIF";
    }
  }

  // Jika masih belum ada, cari di daftar categories
  if (!line1 && categories && categories.length > 0 && matchObj.categoryClassId) {
    const catObj = categories.find((c: any) => c.id === matchObj.categoryClassId);
    if (catObj?.name) {
      const matched = catObj.name.match(/Kelas\s+([A-Za-z0-9\-\+]+)/i);
      if (matched && matched[1]) {
        classLetter = matched[1].toUpperCase();
        line1 = `KELAS ${classLetter}`;
      }
    }
  }

  if (!line1) {
    line1 = "KELAS B";
    classLetter = "B";
  }

  // 3. Ekstraksi Rentang Berat & Gender (Line 2: e.g. "(> 28 – 30 KG) / Pa")
  let weightRange = "";

  // Periksa apakah classCategory sudah mencantumkan rentang berat dalam tanda kurung
  const bracketMatch = combinedRaw.match(/\(([^)]*(?:>|<|\d+\s*[-–—]\s*\d+|kg|Kg|KG)[^)]*)\)/);
  if (bracketMatch && bracketMatch[1]) {
    const inner = bracketMatch[1].trim();
    // Normalisasi angka rentang
    const rangeNumMatch = inner.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
    if (rangeNumMatch) {
      const minW = Math.round(parseFloat(rangeNumMatch[1]));
      const maxW = Math.round(parseFloat(rangeNumMatch[2]));
      weightRange = `(> ${minW} – ${maxW} KG)`;
    } else if (/<|\bunder\b/i.test(inner)) {
      const underNum = inner.match(/\d+/);
      weightRange = underNum ? `(< ${underNum[0]} KG)` : "(< 26 KG)";
    } else if (/>|\bbebas\b/i.test(inner)) {
      const overNum = inner.match(/\d+/);
      weightRange = overNum ? `(> ${overNum[0]} KG)` : "(> 38 KG)";
    }
  }

  // Jika tidak ada di string, ambil dari lookup IPSI
  if (!weightRange) {
    weightRange = getIpsiWeightRange(division, classLetter);
  }

  // Fallback standar jika masih kosong
  if (!weightRange) {
    weightRange = "(> 28 – 30 KG)";
  }

  // Gender (Pa / Pi)
  const gRaw = String(matchObj.gender || matchObj.jenisKelamin || "").toUpperCase();
  const isPutri = gRaw.includes("PI") || gRaw.includes("PUTRI") || gRaw === "P" || /putri|\bpi\b/i.test(combinedRaw);
  const genderCode = isPutri ? "Pi" : "Pa";

  const line2 = `${weightRange} / ${genderCode}`;

  // 4. Ekstraksi Babak & Divisi (Line 3: e.g. "(USIA DINI 2 - FINAL B1)")
  let stageCandidate = String(matchObj.stage || matchObj.babak || matchObj.tahap || "").trim();

  // Jika stageCandidate kosong atau mengandung substring mentah seperti "Tanding Pra Remaja Kelas B PARTAI 1: SEMI FINAL 1 (POOL A)"
  if (!stageCandidate || /PARTAI\s+\d+/i.test(stageCandidate) || /(?:TANDING|SENI)/i.test(stageCandidate)) {
    const textToSearch = stageCandidate || combinedRaw;
    const afterPartai = textToSearch.replace(/^.*?\bPARTAI\s+\d+\s*:?\s*/i, "");
    if (afterPartai && afterPartai !== textToSearch) {
      stageCandidate = afterPartai.trim();
    } else {
      const stagePattern = /(?:SEMI\s*FINAL|FINAL|PEREMPAT\s*FINAL|BABAK\s*\d+|PENYISIHAN).*/i;
      const foundStage = textToSearch.match(stagePattern);
      if (foundStage && foundStage[0]) {
        stageCandidate = foundStage[0].trim();
      }
    }
  }

  // Bersihkan semua prefix redundan (TANDING, Divisi, Kelas, PARTAI 1:)
  let cleanStage = stageCandidate
    .replace(/^\s*(?:TANDING|SENI)\b\s*/i, "")
    .replace(/\b(?:PRA\s*USIA\s*DINI|USIA\s*DINI\s*[12]?|PRA\s*REMAJA|REMAJA|DEWASA|MASTER)\b\s*/gi, "")
    .replace(/\b(?:KELAS|CLASS)\s+[A-Za-z0-9\-\+]+\b\s*/gi, "")
    .replace(/\b(?:PARTAI|MATCH)\s*\d+\s*:?\s*/gi, "")
    .replace(/^[:\-\s]+/, "")
    .trim();

  // Hapus tanda kurung luar jika seluruh teks sudah dibungkus kurung tunggal
  if (cleanStage.startsWith("(") && cleanStage.endsWith(")") && !cleanStage.slice(1, -1).includes("(")) {
    cleanStage = cleanStage.slice(1, -1).trim();
  }

  // Pastikan kurung seimbang di dalam cleanStage
  const openParens = (cleanStage.match(/\(/g) || []).length;
  const closeParens = (cleanStage.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    cleanStage += ")".repeat(openParens - closeParens);
  }

  cleanStage = cleanStage.trim().toUpperCase();

  if (!cleanStage) {
    cleanStage = "FINAL B1";
  }

  // Susun line 3
  let line3 = "";
  if (cleanStage.includes(division)) {
    line3 = `(${cleanStage})`;
  } else {
    line3 = `(${division} - ${cleanStage})`;
  }

  return {
    line1,
    line2,
    line3,
    fullText: `${line1}\n${line2}\n${line3}`
  };
}

export const getTandingJurusLines = formatTandingJurusColumn;

/**
 * Menggambar teks ke dokumen PDF jsPDF dengan penyesuaian ukuran font dinamis (auto-fitting)
 * agar teks panjang (nama atlet atau kontingen) tidak terpotong (truncated) dan tidak melebar keluar batas kolom.
 */
export function drawAutoFittingText(
  doc: any,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  defaultFontSize: number = 8.5,
  minFontSize: number = 3.8,
  fontStyle: string = "bold"
): void {
  if (!text) return;
  let cleanText = String(text).trim();
  if (!cleanText) return;

  doc.setFont("Helvetica", fontStyle);
  let fontSize = defaultFontSize;
  doc.setFontSize(fontSize);

  // 1. Turunkan ukuran font bertahap (step 0.2pt) bila teks melebihi maxWidth
  if (typeof doc.getTextWidth === "function") {
    while (doc.getTextWidth(cleanText) > maxWidth && fontSize > minFontSize) {
      fontSize -= 0.2;
      doc.setFontSize(fontSize);
    }

    // 2. Jika pada batas minFontSize teks masih melebihi maxWidth,
    // potong secara cerdas dengan ellipsis (...) sehingga dijamin tidak pernah melebar keluar batas kolom
    if (doc.getTextWidth(cleanText) > maxWidth) {
      while (cleanText.length > 2 && doc.getTextWidth(cleanText + "...") > maxWidth) {
        cleanText = cleanText.slice(0, -1).trim();
      }
      cleanText = cleanText + "...";
    }
  }

  doc.text(cleanText, centerX, y, { align: "center" });
}

// Re-export textScalingHelper functions for convenience
export { getDynamicFontSizeClass, getDynamicTextStyle, getScaledTextProps } from './textScalingHelper';

