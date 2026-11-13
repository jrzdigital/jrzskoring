/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Validasi State Kategori Pertandingan Pencak Silat IPSI 2026.
 * Memisahkan secara eksplisit antara Kategori TANDING (Laga) dan TGRS (Seni)
 * menggunakan enum dan const objek ketat untuk mencegah tumpang tindih data
 * (data overlap / state contamination) saat pergantian kategori.
 */

/**
 * Disiplin Pertandingan Utama Pencak Silat
 */
export enum MatchDiscipline {
  TANDING = "TANDING",
  TGRS = "TGRS"
}

/**
 * Sub-kategori resmi Seni Jurus TGRS
 */
export enum TgrsSubCategoryType {
  TUNGGAL = "TUNGGAL",
  GANDA = "GANDA",
  REGU = "REGU",
  SOLO_KREATIF = "SOLO_KREATIF"
}

/**
 * Kamus Kelas Tanding Resmi IPSI (Const Objek Eksplisit)
 */
export const TANDING_CLASSES = {
  A: { id: "A", name: "KELAS A", code: "A", minWeight: 45, maxWeight: 50, label: "Kelas A (45 - 50 kg)" },
  B: { id: "B", name: "KELAS B", code: "B", minWeight: 50, maxWeight: 55, label: "Kelas B (50 - 55 kg)" },
  C: { id: "C", name: "KELAS C", code: "C", minWeight: 55, maxWeight: 60, label: "Kelas C (55 - 60 kg)" },
  D: { id: "D", name: "KELAS D", code: "D", minWeight: 60, maxWeight: 65, label: "Kelas D (60 - 65 kg)" },
  E: { id: "E", name: "KELAS E", code: "E", minWeight: 65, maxWeight: 70, label: "Kelas E (65 - 70 kg)" },
  F: { id: "F", name: "KELAS F", code: "F", minWeight: 70, maxWeight: 75, label: "Kelas F (70 - 75 kg)" },
  G: { id: "G", name: "KELAS G", code: "G", minWeight: 75, maxWeight: 80, label: "Kelas G (75 - 80 kg)" },
  H: { id: "H", name: "KELAS H", code: "H", minWeight: 80, maxWeight: 85, label: "Kelas H (80 - 85 kg)" },
  I: { id: "I", name: "KELAS I", code: "I", minWeight: 85, maxWeight: 90, label: "Kelas I (85 - 90 kg)" },
  J: { id: "J", name: "KELAS J", code: "J", minWeight: 90, maxWeight: 100, label: "Kelas J (90 - 100 kg)" },
  BEBAS: { id: "BEBAS", name: "KELAS BEBAS", code: "BEBAS", minWeight: 100, maxWeight: 155, label: "Kelas Bebas (Open Weight)" },
  UNDER: { id: "UNDER", name: "KELAS UNDER", code: "UNDER", minWeight: 35, maxWeight: 45, label: "Kelas Under (Pra-Remaja/Dini)" }
} as const;

export type TandingClassKey = keyof typeof TANDING_CLASSES;

/**
 * Kamus Kategori Seni Jurus TGRS Resmi IPSI 2026 (Const Objek Eksplisit)
 */
export const TGRS_CATEGORIES = {
  TUNGGAL: {
    id: "TUNGGAL",
    subType: TgrsSubCategoryType.TUNGGAL,
    canonicalName: "SENI TUNGGAL BAKU IPSI",
    shortLabel: "Tunggal Baku",
    defaultDuration: 180, // 3 menit standar IPSI / PERSILAT 3.1.1
    defaultRounds: 1,
    description: "100 Rangkaian Jurus Tunggal Baku IPSI"
  },
  GANDA: {
    id: "GANDA",
    subType: TgrsSubCategoryType.GANDA,
    canonicalName: "SENI GANDA IPSI",
    shortLabel: "Ganda Senjata",
    defaultDuration: 180, // 3 menit
    defaultRounds: 1,
    description: "Koreografi Serang Bela Pasangan Tangan Kosong & Senjata"
  },
  REGU: {
    id: "REGU",
    subType: TgrsSubCategoryType.REGU,
    canonicalName: "SENI REGU IPSI",
    shortLabel: "Regu Baku",
    defaultDuration: 180, // 3 menit
    defaultRounds: 1,
    description: "100 Gerakan Jurus Regu Baku Trio Kompak & Serempak"
  },
  SOLO_KREATIF: {
    id: "SOLO_KREATIF",
    subType: TgrsSubCategoryType.SOLO_KREATIF,
    canonicalName: "SOLO KREATIF IPSI",
    shortLabel: "Solo Kreatif",
    defaultDuration: 180, // 3 menit
    defaultRounds: 1,
    description: "Peragaan Solo Koreografi Silat Bebas Senjata Nusantara"
  }
} as const;

export type TgrsCategoryKey = keyof typeof TGRS_CATEGORIES;

/**
 * Objek State Kategori yang Sudah Tervalidasi & Bersih Tanpa Overlap
 */
export interface ValidatedCategoryState {
  discipline: MatchDiscipline;
  selectedKey: string;           // 'C' atau 'SENI TUNGGAL BAKU IPSI'
  canonicalName: string;         // 'Tanding Kelas C Putra' atau 'Seni Tunggal Baku IPSI Putra'
  kategori: "TANDING" | TgrsSubCategoryType;
  tgrsSubType?: TgrsSubCategoryType;
  tandingClassKey?: TandingClassKey;
  roundDuration: number;         // 120 (Tanding) atau 180 (TGRS)
  roundCount: number;            // 3 (Tanding) atau 1 (TGRS)
  gender: "PUTRA" | "PUTRI";
  isTgr: boolean;
  isTanding: boolean;
}

/**
 * Deteksi apakah string raw terindikasi kategori TGRS/Seni
 */
export function isTgrsString(raw?: string | null): boolean {
  if (!raw) return false;
  const str = String(raw).toUpperCase().trim();
  if (str.startsWith("TANDING") || str === "TANDING" || str.startsWith("KELAS ")) {
    return false;
  }
  const clean = str.replace(/REGULER/g, "");
  const hasSoloKreatif = clean.includes("SOLO KREATIF") || clean.includes("SOLO_KREATIF") || clean.includes("KREATIF") || clean.includes("SENI SOLO");
  const hasRegu = /\bREGU\b/i.test(clean) || clean.includes("SENI REGU");
  const hasTunggal = clean.includes("TUNGGAL");
  const hasGanda = clean.includes("GANDA");
  const hasTgr = /\bTGRS?\b/i.test(clean) || clean.includes("JURUS");
  const hasSeni = clean.includes("SENI") && !clean.includes("TANDING");

  return hasSoloKreatif || hasRegu || hasTunggal || hasGanda || hasTgr || hasSeni;
}

/**
 * Ekstrak kunci kelas tanding yang valid (fallback ke "C" jika tidak valid)
 */
export function extractValidTandingClass(raw?: string | null): TandingClassKey {
  if (!raw) return "C";
  const str = String(raw).toUpperCase().trim();
  const cleaned = str
    .replace(/^TANDING/i, "")
    .replace(/^KELAS/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/PUTRA|PUTRI/i, "")
    .trim();

  // Match direct keys
  if (cleaned in TANDING_CLASSES) {
    return cleaned as TandingClassKey;
  }

  // Regex check for single letter class A-J or BEBAS or UNDER
  const match = cleaned.match(/\b([A-J]|BEBAS|UNDER)\b/i);
  if (match && match[1]) {
    const candidate = match[1].toUpperCase() as TandingClassKey;
    if (candidate in TANDING_CLASSES) return candidate;
  }

  return "C";
}

/**
 * Ekstrak sub-kategori TGRS yang valid (fallback ke TUNGGAL)
 */
export function extractValidTgrsCategory(raw?: string | null): TgrsCategoryKey {
  if (!raw) return "TUNGGAL";
  const str = String(raw).toUpperCase().trim();
  if (str.includes("SOLO") || str.includes("KREATIF") || str.includes("TUNGGAL_BEBAS") || str.includes("TUNGGAL BEBAS")) {
    return "SOLO_KREATIF";
  }
  if (str.includes("REGU")) {
    return "REGU";
  }
  if (str.includes("GANDA")) {
    return "GANDA";
  }
  return "TUNGGAL";
}

/**
 * Validasi State Kategori Secara Ketat
 * Mencegah data overlap saat switching antara TANDING dan TGRS.
 */
export function validateAndSanitizeCategory(
  rawInput: string,
  gender: "PUTRA" | "PUTRI" = "PUTRA",
  customDiscipline?: MatchDiscipline,
  existingDuration?: number
): ValidatedCategoryState {
  const genderTitle = gender === "PUTRI" ? "Putri" : "Putra";

  // Tentukan disiplin pertandingan secara eksplisit
  let discipline = customDiscipline;
  if (!discipline) {
    discipline = isTgrsString(rawInput) ? MatchDiscipline.TGRS : MatchDiscipline.TANDING;
  }

  if (discipline === MatchDiscipline.TGRS) {
    const tgrsKey = extractValidTgrsCategory(rawInput);
    const tgrsConfig = TGRS_CATEGORIES[tgrsKey];

    return {
      discipline: MatchDiscipline.TGRS,
      selectedKey: tgrsConfig.canonicalName,
      canonicalName: `${tgrsConfig.canonicalName} ${genderTitle}`,
      kategori: tgrsConfig.subType,
      tgrsSubType: tgrsConfig.subType,
      roundDuration: existingDuration && existingDuration > 0 ? existingDuration : tgrsConfig.defaultDuration,
      roundCount: tgrsConfig.defaultRounds,
      gender,
      isTgr: true,
      isTanding: false
    };
  }

  // DISIPLIN: TANDING
  const tandingKey = extractValidTandingClass(rawInput);
  const tandingConfig = TANDING_CLASSES[tandingKey];

  return {
    discipline: MatchDiscipline.TANDING,
    selectedKey: tandingConfig.code,
    canonicalName: `Tanding Kelas ${tandingConfig.code} ${genderTitle}`,
    kategori: "TANDING",
    tandingClassKey: tandingKey,
    roundDuration: existingDuration && existingDuration > 0 ? existingDuration : 120,
    roundCount: 3,
    gender,
    isTgr: false,
    isTanding: true
  };
}

/**
 * Fungsi eksplisit untuk beralih disiplin (Switch Discipline Transition)
 * Membersihkan state lama dan menginisialisasi parameter standar disiplin tujuan.
 */
export function transitionMatchDiscipline(
  targetDiscipline: MatchDiscipline,
  currentGender: "PUTRA" | "PUTRI" = "PUTRA",
  preferredSelection?: string
): ValidatedCategoryState {
  if (targetDiscipline === MatchDiscipline.TGRS) {
    const initialKey = preferredSelection && isTgrsString(preferredSelection)
      ? preferredSelection
      : TGRS_CATEGORIES.TUNGGAL.canonicalName;
    return validateAndSanitizeCategory(initialKey, currentGender, MatchDiscipline.TGRS, 180);
  }

  // Beralih ke TANDING
  const initialClass = preferredSelection && !isTgrsString(preferredSelection)
    ? preferredSelection
    : "C";
  return validateAndSanitizeCategory(initialClass, currentGender, MatchDiscipline.TANDING, 120);
}
