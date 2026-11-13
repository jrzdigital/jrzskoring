/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Helper deteksi & konversi Kategori Pertandingan Pencak Silat IPSI 2026:
 * - Kategori TANDING (Laga / Tarung Kelas A, B, C, D, Bebas, dll.)
 * - Kategori JURUS / SENI TGRS:
 *   - T: TUNGGAL BAKU (100 Jurus Baku IPSI)
 *   - G: GANDA (Teknik Serang Bela Koreografi Pasangan)
 *   - R: REGU (100 Gerak Baku Trio Serempak)
 *   - S: SOLO KREATIF (Koreografi Senjata Bebas & Musik)
 */

export type TgrsSubCategory = "TUNGGAL" | "GANDA" | "REGU" | "SOLO_KREATIF";
export type MatchGeneralCategory = "TANDING" | TgrsSubCategory;

export interface CategoryDetectionResult {
  isTgr: boolean;
  isJurus: boolean;
  isJurusCategory: boolean;
  isTanding: boolean;
  category: MatchGeneralCategory;
  tgrSubCategory?: TgrsSubCategory;
  categoryLabel: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextCol: string;
}

/**
 * Cek apakah string atau objek pertandingan termasuk kategori Jurus TGRS (Tunggal, Ganda, Regu, Solo Kreatif).
 * Mendukung objek pertandingan maupun string.
 */
export function isJurusCategory(raw?: any): boolean {
  if (raw === null || raw === undefined) return false;
  if (typeof raw === "boolean") return raw;

  let combined = "";
  if (typeof raw === "object") {
    // 1. Direct subcategory check
    if (raw.tgrSubCategory && ["TUNGGAL", "GANDA", "REGU", "SOLO_KREATIF"].includes(raw.tgrSubCategory)) {
      return true;
    }

    combined = [
      raw.tgrSubCategory,
      raw.classCategory,
      raw.categoryName,
      raw.category,
      raw.kategori,
      raw.weightClass,
      raw.className,
      raw.classNumber,
      raw.categoryClass,
      raw.categoryClassId,
      raw.kelas,
      raw.matchCategory,
      raw.discipline,
      raw.division,
      raw.stage
    ]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();
  } else {
    combined = String(raw).toUpperCase().trim();
  }

  // 2. KATA KUNCI PASTI JURUS / SENI (TGRS):
  // Di Pencak Silat IPSI: GANDA, REGU, dan SOLO KREATIF HANYA ada di Jurus/Seni.
  const hasGanda = combined.includes("GANDA");
  const cleanRegu = combined.replace(/REGULER/g, "");
  const hasRegu = /\bREGU\b/i.test(cleanRegu) || cleanRegu.includes(" REGU") || cleanRegu.includes("REGU ");
  const hasSolo = combined.includes("SOLO") || combined.includes("KREATIF");
  const hasTunggal = combined.includes("TUNGGAL") || combined.includes("BAKU");
  const hasSeniOrJurus = combined.includes("SENI") || combined.includes("JURUS") || combined.includes("TGR");

  if (hasGanda || hasRegu || hasSolo) {
    return true; // 100% Kategori Jurus TGRS
  }

  if (hasTunggal || hasSeniOrJurus) {
    // Periksa apakah ini pure laga tanding tanpa konteks seni
    if (
      (combined.includes("TANDING") || combined.startsWith("KELAS ") || combined.includes("KELAS BEBAS") || combined.includes("BEBAS")) &&
      !combined.includes("SENI") &&
      !combined.includes("JURUS") &&
      !combined.includes("TGR") &&
      !combined.includes("BAKU")
    ) {
      return false;
    }
    return true;
  }

  // 3. Explicit boolean flags jika teks tidak spesifik
  if (typeof raw === "object") {
    if (raw.isJurusCategory === true || raw.isJurus === true || raw.isTgr === true || raw.isSeni === true) {
      return true;
    }
    if (raw.isTanding === true || raw.isJurusCategory === false || raw.isJurus === false || raw.isTgr === false || raw.isSeni === false) {
      return false;
    }
    if (raw.discipline === "TANDING" || raw.category === "TANDING" || raw.kategori === "TANDING") {
      return false;
    }
  }

  // 4. Cek fallback kata kunci TANDING murni
  if (
    combined.includes("TANDING") ||
    combined.startsWith("KELAS ") ||
    combined.includes("KELAS BEBAS") ||
    combined === "BEBAS" ||
    combined.startsWith("UNDER")
  ) {
    return false;
  }

  return false;
}

/**
 * Alias untuk isJurusCategory demi kompatibilitas menyeluruh
 */
export const isTgrsCategory = isJurusCategory;

/**
 * Ambil sub-kategori TGRS secara spesifik (TUNGGAL, GANDA, REGU, atau SOLO_KREATIF)
 */
export function getTgrsSubCategory(raw?: any): TgrsSubCategory {
  if (!raw) return "TUNGGAL";
  let str = "";
  if (typeof raw === "object") {
    if (raw.tgrSubCategory && ["TUNGGAL", "GANDA", "REGU", "SOLO_KREATIF"].includes(raw.tgrSubCategory)) {
      return raw.tgrSubCategory;
    }
    str = [
      raw.tgrSubCategory,
      raw.kategori,
      raw.category,
      raw.matchCategory,
      raw.classCategory,
      raw.categoryName,
      raw.className,
      raw.classNumber,
      raw.categoryClass,
      raw.categoryClassId,
      raw.kelas,
      raw.weightClass
    ]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();
  } else {
    str = String(raw).toUpperCase().trim();
  }

  if (str.includes("GANDA")) {
    return "GANDA";
  }
  const cleanRegu = str.replace(/REGULER/g, "");
  if (/\bREGU\b/i.test(cleanRegu) || cleanRegu.includes(" REGU") || cleanRegu.includes("REGU ")) {
    return "REGU";
  }
  if (
    str.includes("SOLO") ||
    str.includes("KREATIF") ||
    str.includes("TUNGGAL_BEBAS") ||
    str.includes("TUNGGAL BEBAS")
  ) {
    return "SOLO_KREATIF";
  }
  return "TUNGGAL";
}

/**
 * Deteksi lengkap kategori pertandingan dari state atau objek jadwal
 */
export function detectMatchCategory(match?: any): CategoryDetectionResult {
  if (!match) {
    return {
      isTgr: false,
      isJurus: false,
      isJurusCategory: false,
      isTanding: true,
      category: "TANDING",
      categoryLabel: "TANDING (LAGA)",
      badgeText: "TANDING",
      badgeBg: "bg-blue-950/80",
      badgeBorder: "border-blue-500/50",
      badgeTextCol: "text-blue-300"
    };
  }

  const isTgr = isJurusCategory(match);

  if (isTgr) {
    const combined = typeof match === "object"
      ? [
          match.kategori,
          match.category,
          match.matchCategory,
          match.classCategory,
          match.kelas,
          match.weightClass,
          match.categoryClassId
        ]
          .filter(Boolean)
          .join(" ")
          .toUpperCase()
      : String(match).toUpperCase();

    const sub = getTgrsSubCategory(match);
    let label = "SENI TUNGGAL BAKU IPSI";
    let badge = "JURUS TUNGGAL (TGRS)";
    let badgeBg = "bg-amber-950/80";
    let badgeBorder = "border-amber-400/60";
    let badgeTextCol = "text-amber-300";

    if (sub === "GANDA") {
      label = "SENI GANDA IPSI";
      badge = "JURUS GANDA (TGRS)";
      badgeBg = "bg-emerald-950/80";
      badgeBorder = "border-emerald-400/60";
      badgeTextCol = "text-emerald-300";
    } else if (sub === "REGU") {
      label = "SENI REGU IPSI";
      badge = "JURUS REGU (TGRS)";
      badgeBg = "bg-purple-950/80";
      badgeBorder = "border-purple-400/60";
      badgeTextCol = "text-purple-300";
    } else if (sub === "SOLO_KREATIF") {
      label = "SOLO KREATIF IPSI";
      badge = "SOLO KREATIF (TGRS)";
      badgeBg = "bg-rose-950/80";
      badgeBorder = "border-rose-400/60";
      badgeTextCol = "text-rose-300";
    }

    return {
      isTgr: true,
      isJurus: true,
      isJurusCategory: true,
      isTanding: false,
      category: sub,
      tgrSubCategory: sub,
      categoryLabel: label,
      badgeText: badge,
      badgeBg,
      badgeBorder,
      badgeTextCol
    };
  }

  return {
    isTgr: false,
    isJurus: false,
    isJurusCategory: false,
    isTanding: true,
    category: "TANDING",
    categoryLabel: match.classCategory || match.kelas || "TANDING",
    badgeText: "TANDING (LAGA)",
    badgeBg: "bg-blue-950/80",
    badgeBorder: "border-blue-500/50",
    badgeTextCol: "text-blue-300"
  };
}
