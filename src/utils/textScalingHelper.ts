/**
 * Helper function to dynamically scale the font size of athlete names and contingent text in the UI
 * based on the length of the string to prevent overflow in restricted layout spaces.
 * 
 * Standar IPSI & PERSILAT UI Display:
 * Mencegah nama atlet atau asal kontingen yang panjang terpotong (truncated)
 * atau melebar keluar dari batas kolom/kapsul kartu sudut merah dan biru.
 */

export type DynamicTextType = 'athlete' | 'contingent' | 'title' | 'general';
export type DynamicTextVariant = 'monitor' | 'scoreboard' | 'compact' | 'badge' | 'table';

export interface DynamicTextOptions {
  type?: DynamicTextType;
  variant?: DynamicTextVariant;
  maxLines?: number;
}

/**
 * Mendapatkan kombinasi kelas Tailwind CSS yang secara dinamis mengecilkan ukuran font
 * berdasarkan panjang teks (karakter).
 */
export function getDynamicFontSizeClass(
  text: string | null | undefined,
  type: DynamicTextType = 'athlete',
  options?: {
    variant?: DynamicTextVariant;
  }
): string {
  const clean = (text || '').trim();
  const len = clean.length;
  const variant = options?.variant || 'monitor';

  if (type === 'athlete') {
    if (variant === 'scoreboard') {
      // Papan Skor Utama (Ukuran Dasar Besar)
      if (len <= 12) return 'text-base sm:text-lg md:text-xl lg:text-2xl font-black';
      if (len <= 18) return 'text-sm sm:text-base md:text-lg lg:text-xl font-black leading-tight';
      if (len <= 26) return 'text-xs sm:text-sm md:text-base lg:text-lg font-black leading-tight';
      if (len <= 34) return 'text-[11px] sm:text-xs md:text-sm lg:text-base font-extrabold leading-tight break-words';
      return 'text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-bold leading-tight break-words';
    }

    if (variant === 'compact' || variant === 'table') {
      // Tampilan Kompak / Antrean / Tabel
      if (len <= 14) return 'text-xs sm:text-sm font-bold';
      if (len <= 22) return 'text-[11px] sm:text-xs font-bold leading-tight';
      if (len <= 30) return 'text-[10px] sm:text-[11px] font-semibold leading-tight';
      return 'text-[9px] sm:text-[10px] font-semibold leading-tight break-words';
    }

    // Monitor Panel Capsule (Default)
    if (len <= 14) {
      return 'text-base sm:text-lg lg:text-xl font-black';
    } else if (len <= 20) {
      return 'text-sm sm:text-base lg:text-lg font-black leading-tight';
    } else if (len <= 28) {
      return 'text-xs sm:text-sm lg:text-base font-extrabold leading-tight break-words';
    } else if (len <= 36) {
      return 'text-[11px] sm:text-xs lg:text-sm font-bold leading-tight break-words';
    } else {
      return 'text-[10px] sm:text-[11px] lg:text-xs font-bold leading-tight break-words';
    }
  }

  if (type === 'contingent') {
    if (variant === 'badge') {
      // Tab Badge Kontingen (Di atas kapsul sudut)
      if (len <= 12) return 'text-[10px] sm:text-xs font-black tracking-wider';
      if (len <= 20) return 'text-[9px] sm:text-[11px] font-black tracking-wide';
      if (len <= 30) return 'text-[8px] sm:text-[9.5px] font-bold tracking-normal';
      return 'text-[7.5px] sm:text-[8.5px] font-bold tracking-tight';
    }

    if (variant === 'compact' || variant === 'table') {
      if (len <= 15) return 'text-[10px] sm:text-xs font-semibold';
      if (len <= 25) return 'text-[9px] sm:text-[10px] font-semibold leading-tight';
      return 'text-[8px] sm:text-[9px] font-medium leading-tight';
    }

    // Default contingent text
    if (len <= 16) {
      return 'text-xs sm:text-sm md:text-base font-extrabold';
    } else if (len <= 26) {
      return 'text-[11px] sm:text-xs md:text-sm font-bold leading-tight';
    } else {
      return 'text-[10px] sm:text-[11px] md:text-xs font-semibold leading-tight break-words';
    }
  }

  // General or Title
  if (len <= 20) return 'text-sm sm:text-base md:text-lg font-black';
  if (len <= 35) return 'text-xs sm:text-sm md:text-base font-bold leading-tight';
  return 'text-[11px] sm:text-xs md:text-sm font-semibold leading-tight break-words';
}

/**
 * Menghasilkan objek style React (CSSProperties) untuk fleksibilitas ukuran font berbasis px/rem
 * dengan pencegahan overflow otomatis (line-height, break-word, word-break).
 */
export function getDynamicTextStyle(
  text: string | null | undefined,
  type: DynamicTextType = 'athlete',
  baseSizePx: number = 20,
  minSizePx: number = 10
): React.CSSProperties {
  const clean = (text || '').trim();
  const len = clean.length;
  if (!len) {
    return {
      fontSize: `${baseSizePx}px`,
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
    };
  }

  const threshold = type === 'athlete' ? 14 : 16;
  let scaledPx = baseSizePx;

  if (len > threshold) {
    const factor = type === 'athlete' ? 0.32 : 0.25;
    scaledPx = Math.max(minSizePx, baseSizePx - (len - threshold) * factor);
  }

  return {
    fontSize: `${scaledPx.toFixed(1)}px`,
    lineHeight: scaledPx < 14 ? '1.15' : '1.25',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    maxWidth: '100%',
  };
}

/**
 * Kombinasi praktis: Mengembalikan kelas CSS dan opsi style untuk elemen UI
 */
export function getScaledTextProps(
  text: string | null | undefined,
  type: DynamicTextType = 'athlete',
  options?: {
    variant?: DynamicTextVariant;
    baseSizePx?: number;
    minSizePx?: number;
  }
): { className: string; style: React.CSSProperties } {
  return {
    className: getDynamicFontSizeClass(text, type, { variant: options?.variant }),
    style: getDynamicTextStyle(
      text,
      type,
      options?.baseSizePx || (type === 'athlete' ? 18 : 13),
      options?.minSizePx || (type === 'athlete' ? 11 : 9)
    ),
  };
}
