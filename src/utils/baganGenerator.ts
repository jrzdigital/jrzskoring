/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bagan Generator & Tournament Schedule Management Helper
 * Menangani normalisasi data atlet, pengundian loting yang adil, penyusunan bagan,
 * dan sinkronisasi otomatis jadwal pertandingan turnamen Pencak Silat (IPSI 2026 & PERSILAT).
 */

export interface AthleteRecord {
  id: string;
  name: string;
  contingent: string;
  club: string;
  ageCategory: string;
  division: string;
  gender: "PUTRA" | "PUTRI";
  category: string;
  weightClass: string;
  className: string;
  categoryClassId: string;
  weight: number;
  seed: number;
  arena: string;
  gelanggang: string;
  status: string;
  [key: string]: any;
}

export function isDummyAthleteObj(p: any): boolean {
  if (!p) return false;
  const name = p.name ? String(p.name).toUpperCase() : "";
  const club = p.club || p.contingent ? String(p.club || p.contingent).toUpperCase() : "";
  const id = p.id ? String(p.id) : "";
  if (name.startsWith("PESILAT ") && club.startsWith("KONTINGEN ")) return true;
  if (id.includes("-cat-") || id.startsWith("p-cat-") || id.startsWith("p-manual-dummy")) return true;
  return false;
}

export function normalizeAgeCategory(raw?: any): string {
  if (!raw) return "Dewasa";
  const str = String(raw).trim().toUpperCase();
  if (str.includes("USIA DINI 1") || str.includes("DINI 1")) return "Usia Dini 1";
  if (str.includes("USIA DINI 2") || str.includes("DINI 2")) return "Usia Dini 2";
  if (str.includes("USIA DINI") || str.includes("DINI") || str.includes("ANAK") || str.includes("SD")) return "Usia Dini";
  if (str.includes("PRA REMAJA") || str.includes("PRA-REMAJA") || str.includes("PRAREMAJA") || str.includes("SMP")) return "Pra Remaja";
  if (str.includes("REMAJA") || str.includes("SMA")) return "Remaja";
  if (str.includes("MASTER") || str.includes("VETERAN")) return "Master";
  return "Dewasa";
}

export function normalizeDivision(div?: string): string {
  if (!div) return "DEWASA";
  const up = String(div).toUpperCase().trim();
  if (up.includes("DINI 1") || up.includes("USIA DINI 1")) return "USIA DINI 1";
  if (up.includes("DINI 2") || up.includes("USIA DINI 2")) return "USIA DINI 2";
  if (up.includes("DINI") || up.includes("SD")) return "USIA DINI";
  if (up.includes("PRA")) return "PRA REMAJA";
  if (up.includes("REMAJA")) return "REMAJA";
  if (up.includes("MASTER")) return "MASTER";
  return "DEWASA";
}

export function normalizeWeightClass(raw?: any): string {
  if (!raw) return "Kelas A";
  const str = String(raw).trim().toUpperCase();
  if (str.includes("TUNGGAL") && (str.includes("BEBAS") || str.includes("SOLO") || str.includes("KREATIF"))) return "Tunggal Bebas";
  if (str.includes("TUNGGAL") || str.includes("BAKU")) return "Tunggal Baku";
  if (str.includes("GANDA")) return "Ganda";
  if (str.includes("REGU")) return "Regu";
  if (str.includes("SOLO") || str.includes("KREATIF")) return "Tunggal Bebas";
  if (str.includes("UNDER") || str === "UNDER") return "Under";
  if (str.includes("BEBAS") || str.includes("OPEN")) return "Kelas Bebas";
  const match = str.match(/KELAS\s*([A-Z])/i) || str.match(/\b([A-Z])\b/);
  if (match) {
    return `Kelas ${match[1].toUpperCase()}`;
  }
  return "Kelas A";
}

export function getCanonicalCategoryClassId(ageCat?: any, weightClass?: any): string {
  const normAge = normalizeAgeCategory(ageCat).toLowerCase().replace(/\s+/g, "-");
  const normClass = normalizeWeightClass(weightClass).toLowerCase().replace(/\s+/g, "-");
  return `${normAge}_${normClass}`;
}

export function normalizeAthleteRecord(raw: any, idx = 0): AthleteRecord {
  const normAge = normalizeAgeCategory(raw?.ageCategory || raw?.division || raw?.golongan || raw?.usia);
  const normClass = normalizeWeightClass(raw?.weightClass || raw?.className || raw?.kelas || raw?.weightClassRange);
  const gender: "PUTRA" | "PUTRI" = String(raw?.gender || "PUTRA").toUpperCase() === "PUTRI" ? "PUTRI" : "PUTRA";
  const name = String(raw?.name || raw?.athleteName || raw?.nama || `PESILAT ${idx + 1}`).trim().toUpperCase();
  const contingent = String(raw?.contingent || raw?.club || raw?.kontingen || raw?.perguruan || "KONTINGEN").trim().toUpperCase();
  const id = raw?.id || `atlet-${Date.now()}-${idx}-${Math.random().toString(36).substring(7)}`;

  return {
    id,
    name,
    contingent,
    club: contingent,
    ageCategory: normAge,
    division: normAge.toUpperCase(),
    gender,
    category: raw?.category || raw?.kategori || "TANDING",
    weightClass: normClass,
    className: normClass.toUpperCase(),
    categoryClassId: raw?.categoryClassId || getCanonicalCategoryClassId(normAge, normClass),
    weight: typeof raw?.weight === "number" ? raw.weight : parseFloat(raw?.weight || "0") || 0,
    seed: typeof raw?.seed === "number" && raw.seed > 0 ? raw.seed : (idx + 1),
    arena: raw?.arena || raw?.gelanggang || "GELANGGANG A",
    gelanggang: raw?.arena || raw?.gelanggang || "GELANGGANG A",
    status: raw?.status || "BELUM"
  };
}

export function separateAthletesByContingent(athletes: any[]): any[] {
  if (!athletes || athletes.length <= 2) return athletes ? [...athletes] : [];
  const list = [...athletes];
  const contingentMap = new Map<string, any[]>();
  list.forEach(a => {
    const c = String(a.contingent || a.club || "").toUpperCase();
    if (!contingentMap.has(c)) contingentMap.set(c, []);
    contingentMap.get(c)!.push(a);
  });

  const sortedGroups = Array.from(contingentMap.values()).sort((a, b) => b.length - a.length);
  const result: any[] = [];
  let added = true;
  let roundIdx = 0;

  while (added) {
    added = false;
    for (const group of sortedGroups) {
      if (roundIdx < group.length) {
        result.push(group[roundIdx]);
        added = true;
      }
    }
    roundIdx++;
  }
  return result;
}

export function distributeAthletesAcrossPools(athletes: any[], targetPoolSize = 4): any[] {
  if (!athletes || athletes.length === 0) return [];
  return separateAthletesByContingent(athletes);
}

export function fairShuffleTournamentAthletes(athletes: any[]): any[] {
  if (!athletes || athletes.length <= 1) return athletes ? [...athletes] : [];
  const shuffled = [...athletes].sort(() => Math.random() - 0.5);
  return separateAthletesByContingent(shuffled);
}

export function getCategoryMethodsFromStorage(): Record<string, "PRESTASI" | "PEMASALAN"> {
  try {
    if (typeof window !== "undefined") {
      const raw1 = localStorage.getItem("jrz_category_methods");
      if (raw1) return JSON.parse(raw1);
      const raw2 = localStorage.getItem("jrz_category_competition_methods");
      if (raw2) return JSON.parse(raw2);
      const raw3 = localStorage.getItem("jrz_division_pemasalan_modes");
      if (raw3) {
        const parsed = JSON.parse(raw3);
        const res: Record<string, "PRESTASI" | "PEMASALAN"> = {};
        for (const k of Object.keys(parsed)) {
          const val = parsed[k] ? "PEMASALAN" : "PRESTASI";
          res[k] = val;
          const titleK = k.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          res[titleK] = val;
        }
        return res;
      }
    }
  } catch {}
  return {
    "Usia Dini": "PEMASALAN",
    "Usia Dini 1": "PEMASALAN",
    "Usia Dini 2": "PEMASALAN",
    "Pra Remaja": "PRESTASI",
    "Remaja": "PRESTASI",
    "Dewasa": "PRESTASI"
  };
}

export function getMethodForCategory(discipline: "TANDING" | "JURUS" | string = "TANDING", ageCategory: string): "PRESTASI" | "PEMASALAN" {
  const normAge = normalizeAgeCategory(ageCategory);
  const methods = getCategoryMethodsFromStorage();
  const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
  
  const discKey = `${disc}___${ageCategory}`;
  const discNormKey = `${disc}___${normAge}`;
  
  if (methods[discKey] === "PRESTASI" || methods[discKey] === "PEMASALAN") return methods[discKey];
  if (methods[discNormKey] === "PRESTASI" || methods[discNormKey] === "PEMASALAN") return methods[discNormKey];

  // Specific discipline defaults if not set
  if (normAge.includes("Usia Dini") || normAge.includes("Dini")) {
    return "PEMASALAN";
  }
  return "PRESTASI";
}

export function saveCategoryMethodToStorage(
  ageKey: string,
  method: "PRESTASI" | "PEMASALAN",
  discipline?: "TANDING" | "JURUS" | string
): void {
  try {
    if (typeof window !== "undefined") {
      const current = getCategoryMethodsFromStorage();
      const norm = normalizeAgeCategory(ageKey);
      const updated = { ...current };

      if (discipline) {
        const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
        updated[`${disc}___${ageKey}`] = method;
        updated[`${disc}___${norm}`] = method;

        // Ensure the opposite discipline's setting is preserved or given its default
        const otherDisc = disc === "JURUS" ? "TANDING" : "JURUS";
        const otherNormKey = `${otherDisc}___${norm}`;
        if (!updated[otherNormKey]) {
          const defaultOther = (norm.includes("Usia Dini") || norm.includes("Dini")) ? "PEMASALAN" : "PRESTASI";
          updated[otherNormKey] = defaultOther;
          updated[`${otherDisc}___${ageKey}`] = defaultOther;
        }
      } else {
        updated[ageKey] = method;
        updated[norm] = method;
      }

      localStorage.setItem("jrz_category_methods", JSON.stringify(updated));
      localStorage.setItem("jrz_category_competition_methods", JSON.stringify(updated));
      
      const divModesRaw = localStorage.getItem("jrz_division_pemasalan_modes");
      const divModes = divModesRaw ? JSON.parse(divModesRaw) : {};
      if (discipline) {
        const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
        divModes[`${disc}___${ageKey.toUpperCase()}`] = method === "PEMASALAN";
        divModes[`${disc}___${normalizeDivision(ageKey)}`] = method === "PEMASALAN";
      } else {
        divModes[ageKey.toUpperCase()] = method === "PEMASALAN";
        divModes[normalizeDivision(ageKey)] = method === "PEMASALAN";
      }
      localStorage.setItem("jrz_division_pemasalan_modes", JSON.stringify(divModes));
    }
  } catch {}
}

export function getCategoryPemasalanSchemesFromStorage(): Record<string, "SEMIFINAL" | "FINAL"> {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("jrz_category_pemasalan_schemes");
      if (raw) return JSON.parse(raw);
      const globalScheme = localStorage.getItem("jrz_pemasalan_scheme") as "SEMIFINAL" | "FINAL";
      if (globalScheme) {
        return {
          "Usia Dini": globalScheme,
          "Usia Dini 1": globalScheme,
          "Usia Dini 2": globalScheme,
          "Pra Remaja": globalScheme,
          "Remaja": globalScheme,
          "Dewasa": globalScheme
        };
      }
    }
  } catch {}
  return {
    "Usia Dini": "SEMIFINAL",
    "Usia Dini 1": "SEMIFINAL",
    "Usia Dini 2": "SEMIFINAL",
    "Pra Remaja": "SEMIFINAL",
    "Remaja": "SEMIFINAL",
    "Dewasa": "SEMIFINAL"
  };
}

export function getPemasalanSchemeForCategory(discipline: "TANDING" | "JURUS" | string = "TANDING", ageCategory: string): "SEMIFINAL" | "FINAL" {
  const normAge = normalizeAgeCategory(ageCategory);
  const schemes = getCategoryPemasalanSchemesFromStorage();
  const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
  
  const discKey = `${disc}___${ageCategory}`;
  const discNormKey = `${disc}___${normAge}`;

  if (schemes[discKey] === "SEMIFINAL" || schemes[discKey] === "FINAL") return schemes[discKey];
  if (schemes[discNormKey] === "SEMIFINAL" || schemes[discNormKey] === "FINAL") return schemes[discNormKey];
  return "SEMIFINAL";
}

export function saveCategoryPemasalanSchemeToStorage(
  ageKey: string,
  scheme: "SEMIFINAL" | "FINAL",
  discipline?: "TANDING" | "JURUS" | string
): void {
  try {
    if (typeof window !== "undefined") {
      const current = getCategoryPemasalanSchemesFromStorage();
      const norm = normalizeAgeCategory(ageKey);
      const updated = { ...current };

      if (discipline) {
        const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
        updated[`${disc}___${ageKey}`] = scheme;
        updated[`${disc}___${norm}`] = scheme;
        const otherDisc = disc === "JURUS" ? "TANDING" : "JURUS";
        const otherKey = `${otherDisc}___${norm}`;
        if (!updated[otherKey]) {
          updated[otherKey] = "SEMIFINAL";
          updated[`${otherDisc}___${ageKey}`] = "SEMIFINAL";
        }
      } else {
        updated[ageKey] = scheme;
        updated[norm] = scheme;
      }

      localStorage.setItem("jrz_category_pemasalan_schemes", JSON.stringify(updated));
      localStorage.setItem("jrz_pemasalan_scheme", scheme);
    }
  } catch {}
}

export function getCategoryPrestasiSchemesFromStorage(): Record<string, string> {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("jrz_category_prestasi_schemes");
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {
    "Usia Dini": "SINGLE_NO_POOL",
    "Usia Dini 1": "SINGLE_NO_POOL",
    "Usia Dini 2": "SINGLE_NO_POOL",
    "Pra Remaja": "SINGLE_NO_POOL",
    "Remaja": "SINGLE_NO_POOL",
    "Dewasa": "SINGLE_NO_POOL"
  };
}

export function getPrestasiSchemeForCategory(discipline: "TANDING" | "JURUS" | string = "TANDING", ageCategory: string): string {
  const normAge = normalizeAgeCategory(ageCategory);
  const schemes = getCategoryPrestasiSchemesFromStorage();
  const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
  
  const discKey = `${disc}___${ageCategory}`;
  const discNormKey = `${disc}___${normAge}`;

  if (schemes[discKey]) return schemes[discKey];
  if (schemes[discNormKey]) return schemes[discNormKey];
  return "SINGLE_NO_POOL";
}

export function saveCategoryPrestasiSchemeToStorage(
  ageKey: string,
  scheme: string,
  discipline?: "TANDING" | "JURUS" | string
): void {
  try {
    if (typeof window !== "undefined") {
      const current = getCategoryPrestasiSchemesFromStorage();
      const norm = normalizeAgeCategory(ageKey);
      const updated = { ...current };

      if (discipline) {
        const disc = String(discipline).toUpperCase().includes("JURUS") || String(discipline).toUpperCase().includes("SENI") ? "JURUS" : "TANDING";
        updated[`${disc}___${ageKey}`] = scheme;
        updated[`${disc}___${norm}`] = scheme;
      } else {
        updated[ageKey] = scheme;
        updated[norm] = scheme;
      }

      localStorage.setItem("jrz_category_prestasi_schemes", JSON.stringify(updated));
    }
  } catch {}
}

const STAGE_ORDER_MAP: Record<string, number> = {
  "PENYISIHAN": 1,
  "BABAK 1": 1,
  "BABAK 2": 2,
  "PEREMPAT FINAL": 3,
  "PEREMPATFINAL": 3,
  "SEMI FINAL": 4,
  "SEMIFINAL": 4,
  "FINAL": 5
};

export function orderSchedulesByStages(matches: any[]): any[] {
  if (!matches || matches.length <= 1) return matches ? [...matches] : [];
  return [...matches].sort((a, b) => {
    const sA = STAGE_ORDER_MAP[String(a.stage || "").toUpperCase().trim()] || 1;
    const sB = STAGE_ORDER_MAP[String(b.stage || "").toUpperCase().trim()] || 1;
    if (sA !== sB) return sA - sB;
    const nA = parseInt(String(a.matchNumber || "").replace(/\D/g, ""), 10);
    const nB = parseInt(String(b.matchNumber || "").replace(/\D/g, ""), 10);
    if (!isNaN(nA) && !isNaN(nB) && nA !== nB) return nA - nB;
    return 0;
  });
}

export function ensureStagesOrdered(matches: any[]): any[] {
  return orderSchedulesByStages(matches);
}

export function generateMatchesForClass(params: {
  athletes: any[];
  categoryClassId?: string;
  categoryName?: string;
  division?: string;
  gender?: string;
  arena?: string;
  startPartaiNumber?: number;
}): any[] {
  const {
    athletes,
    categoryClassId = "",
    categoryName = "",
    division = "DEWASA",
    gender = "PUTRA",
    arena = "GELANGGANG A",
    startPartaiNumber = 1
  } = params;

  if (!athletes || athletes.length <= 1) return [];

  const matches: any[] = [];
  let pNum = startPartaiNumber;

  for (let i = 0; i < athletes.length; i += 2) {
    if (i + 1 < athletes.length) {
      const blue = athletes[i];
      const red = athletes[i + 1];
      const stage = athletes.length === 2 ? "FINAL" : athletes.length <= 4 ? "SEMI FINAL" : "PENYISIHAN";
      matches.push({
        id: `match-gen-${categoryClassId}-${pNum}-${Date.now()}`,
        matchNumber: pNum,
        stage,
        classCategory: categoryName || `TANDING ${division}`,
        categoryName,
        categoryClassId,
        division,
        gender,
        arena,
        fighterBlueId: blue.id,
        fighterBlueName: blue.name,
        fighterBlueClub: blue.contingent || blue.club || "KONTINGEN BIRU",
        fighterRedId: red.id,
        fighterRedName: red.name,
        fighterRedClub: red.contingent || red.club || "KONTINGEN MERAH",
        status: "BELUM",
        scoreBlue: 0,
        scoreRed: 0
      });
      pNum++;
    }
  }
  return matches;
}

export function generateRoundRobinMatchesForClass(params: {
  athletes: any[];
  categoryClassId?: string;
  categoryName?: string;
  division?: string;
  gender?: string;
  arena?: string;
  startPartaiNumber?: number;
}): any[] {
  return generateMatchesForClass(params);
}

export function isJurusClass(nameOrClass?: string): boolean {
  if (!nameOrClass) return false;
  const str = String(nameOrClass).toUpperCase();
  return (
    str.includes("JURUS") ||
    str.includes("SENI") ||
    str.includes("TUNGGAL") ||
    str.includes("GANDA") ||
    str.includes("REGU") ||
    str.includes("SOLO") ||
    str.includes("KREATIF")
  );
}

export function buildAutoSchedulesAndCategories(participants: any[]): { matches: any[]; categories: any[] } {
  if (!participants || participants.length === 0) {
    return { matches: [], categories: [] };
  }

  const normalized = participants.map((p, idx) => normalizeAthleteRecord(p, idx));

  const categoryGroups = new Map<string, AthleteRecord[]>();
  normalized.forEach(p => {
    const isJurus = p.category === "JURUS" || p.category === "SENI" || isJurusClass(p.weightClass);
    const catType = isJurus ? "JURUS" : "TANDING";
    const key = `${catType}___${p.ageCategory}___${p.weightClass}___${p.gender}`;
    if (!categoryGroups.has(key)) categoryGroups.set(key, []);
    categoryGroups.get(key)!.push(p);
  });

  const categories: any[] = [];
  const matches: any[] = [];
  let matchCounter = 1;

  categoryGroups.forEach((groupAthletes, catKey) => {
    const [catType, ageCategory, weightClass, gender] = catKey.split("___");
    const isJurus = catType === "JURUS";
    const discipline = isJurus ? "JURUS" : "TANDING";
    const categoryName = isJurus 
      ? `Seni / Jurus ${weightClass} ${ageCategory} ${gender}`
      : `Tanding ${ageCategory} ${weightClass} ${gender}`;
    
    // Check method and scheme strictly per discipline (TANDING vs JURUS)
    const isPem = getMethodForCategory(discipline, ageCategory) === "PEMASALAN";
    const pemScheme: "SEMIFINAL" | "FINAL" = getPemasalanSchemeForCategory(discipline, ageCategory);
    const poolCapacity = pemScheme === "SEMIFINAL" ? 4 : 2;

    const categoryClassId = getCanonicalCategoryClassId(ageCategory, weightClass);

    categories.push({
      id: `cat-${categoryClassId}-${gender}`,
      categoryClassId,
      name: categoryName,
      category: isJurus ? "JURUS" : "TANDING",
      ageCategory,
      weightClass,
      gender,
      participantsCount: groupAthletes.length,
      isPemasalan: isPem,
      pemasalanScheme: pemScheme
    });

    const sortedBySeed = [...groupAthletes].sort((a, b) => (a.seed || 999) - (b.seed || 999));

    if (isPem) {
      // MODE PEMASALAN (IPSI 2026): Pembagian ke dalam Pool/Bagan (Maksimal 4 atlet untuk SEMIFINAL, atau 2 atlet untuk FINAL)
      const numPools = Math.max(1, Math.ceil(sortedBySeed.length / poolCapacity));
      for (let pIdx = 0; pIdx < numPools; pIdx++) {
        const poolLetter = String.fromCharCode(65 + pIdx);
        const poolAthletes = sortedBySeed.slice(pIdx * poolCapacity, (pIdx + 1) * poolCapacity);
        const poolName = `Pool ${poolLetter}`;
        const pNum = pIdx + 1;

        if (pemScheme === "FINAL" || poolAthletes.length <= 2) {
          // FORMAT FINAL LANGSUNG (2 ATLET / BAGAN)
          const blue = poolAthletes[0];
          const red = poolAthletes.length > 1 ? poolAthletes[1] : null;
          matches.push({
            id: `match-${isJurus ? "jurus" : "tanding"}-${categoryClassId}-${gender.toLowerCase()}-pem-${poolLetter}-fn-${matchCounter}`,
            matchNumber: matchCounter,
            stage: `Partai Final (${poolName})`,
            category: isJurus ? "JURUS" : "TANDING",
            classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
            categoryName,
            categoryClassId,
            division: ageCategory.toUpperCase(),
            ageCategory,
            weightClass,
            gender,
            poolName,
            poolLetter,
            pemasalanPool: pNum,
            pemasalanScheme: pemScheme,
            arena: blue?.arena || blue?.gelanggang || "GELANGGANG A",
            fighterBlueId: blue?.id || `ath-b-${pIdx}`,
            fighterBlueName: blue?.name || "PESILAT BIRU",
            fighterBlueClub: blue?.contingent || blue?.club || "KONTINGEN BIRU",
            fighterRedId: red ? red.id : "BYE",
            fighterRedName: red ? red.name : "MENUNGGU LAWAN / BYE",
            fighterRedClub: red ? (red.contingent || red.club || "KONTINGEN MERAH") : "-",
            participant1: {
              id: blue?.id || `ath-b-${pIdx}`,
              name: blue?.name || "PESILAT BIRU",
              contingent: blue?.contingent || blue?.club || "KONTINGEN BIRU"
            },
            participant2: red ? {
              id: red.id,
              name: red.name,
              contingent: red.contingent || red.club || "KONTINGEN MERAH"
            } : null,
            status: red ? "BELUM" : "SELESAI",
            winner: red ? null : "BIRU",
            scoreBlue: 0,
            scoreRed: 0
          });
          matchCounter++;
        } else {
          // FORMAT SEMIFINAL (4 ATLET / BAGAN)
          const a1 = poolAthletes[0];
          const a2 = poolAthletes[1];
          const a3 = poolAthletes[2];
          const a4 = poolAthletes.length > 3 ? poolAthletes[3] : null;

          // Semifinal 1
          matches.push({
            id: `match-${isJurus ? "jurus" : "tanding"}-${categoryClassId}-${gender.toLowerCase()}-pem-${poolLetter}-sf1-${matchCounter}`,
            matchNumber: matchCounter,
            stage: `Semifinal 1 (${poolName})`,
            category: isJurus ? "JURUS" : "TANDING",
            classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
            categoryName,
            categoryClassId,
            division: ageCategory.toUpperCase(),
            ageCategory,
            weightClass,
            gender,
            poolName,
            poolLetter,
            pemasalanPool: pNum,
            pemasalanScheme: "SEMIFINAL",
            arena: a1?.arena || "GELANGGANG A",
            fighterBlueId: a1?.id,
            fighterBlueName: a1?.name,
            fighterBlueClub: a1?.contingent || a1?.club || "KONTINGEN BIRU",
            fighterRedId: a2?.id,
            fighterRedName: a2?.name,
            fighterRedClub: a2?.contingent || a2?.club || "KONTINGEN MERAH",
            participant1: a1 ? { id: a1.id, name: a1.name, contingent: a1.contingent || a1.club || "KONTINGEN BIRU" } : null,
            participant2: a2 ? { id: a2.id, name: a2.name, contingent: a2.contingent || a2.club || "KONTINGEN MERAH" } : null,
            status: "BELUM",
            scoreBlue: 0,
            scoreRed: 0
          });
          matchCounter++;

          // Semifinal 2
          matches.push({
            id: `match-${isJurus ? "jurus" : "tanding"}-${categoryClassId}-${gender.toLowerCase()}-pem-${poolLetter}-sf2-${matchCounter}`,
            matchNumber: matchCounter,
            stage: `Semifinal 2 (${poolName})`,
            category: isJurus ? "JURUS" : "TANDING",
            classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
            categoryName,
            categoryClassId,
            division: ageCategory.toUpperCase(),
            ageCategory,
            weightClass,
            gender,
            poolName,
            poolLetter,
            pemasalanPool: pNum,
            pemasalanScheme: "SEMIFINAL",
            arena: a3?.arena || "GELANGGANG A",
            fighterBlueId: a3?.id,
            fighterBlueName: a3?.name,
            fighterBlueClub: a3?.contingent || a3?.club || "KONTINGEN BIRU",
            fighterRedId: a4 ? a4.id : "BYE",
            fighterRedName: a4 ? a4.name : "MENUNGGU LAWAN / BYE",
            fighterRedClub: a4 ? (a4.contingent || a4.club || "KONTINGEN MERAH") : "-",
            participant1: a3 ? { id: a3.id, name: a3.name, contingent: a3.contingent || a3.club || "KONTINGEN BIRU" } : null,
            participant2: a4 ? { id: a4.id, name: a4.name, contingent: a4.contingent || a4.club || "KONTINGEN MERAH" } : null,
            status: a4 ? "BELUM" : "SELESAI",
            winner: a4 ? null : "BIRU",
            scoreBlue: 0,
            scoreRed: 0
          });
          matchCounter++;

          // Final (Pool ${poolLetter})
          matches.push({
            id: `match-${isJurus ? "jurus" : "tanding"}-${categoryClassId}-${gender.toLowerCase()}-pem-${poolLetter}-fn-${matchCounter}`,
            matchNumber: matchCounter,
            stage: `Partai Final (${poolName})`,
            category: isJurus ? "JURUS" : "TANDING",
            classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
            categoryName,
            categoryClassId,
            division: ageCategory.toUpperCase(),
            ageCategory,
            weightClass,
            gender,
            poolName,
            poolLetter,
            pemasalanPool: pNum,
            pemasalanScheme: "SEMIFINAL",
            arena: a1?.arena || "GELANGGANG A",
            fighterBlueId: `winner-sf1-${poolLetter}`,
            fighterBlueName: `PEMENANG SF 1 (${poolName})`,
            fighterBlueClub: "-",
            fighterRedId: `winner-sf2-${poolLetter}`,
            fighterRedName: `PEMENANG SF 2 (${poolName})`,
            fighterRedClub: "-",
            participant1: { id: `winner-sf1-${poolLetter}`, name: `PEMENANG SF 1 (${poolName})`, contingent: "-" },
            participant2: { id: `winner-sf2-${poolLetter}`, name: `PEMENANG SF 2 (${poolName})`, contingent: "-" },
            status: "BELUM",
            scoreBlue: 0,
            scoreRed: 0
          });
          matchCounter++;
        }
      }
    } else {
      // PRESTASI MODE: Sistem Gugur Lengkap (Single Elimination Tournament)
      const count = sortedBySeed.length;
      if (count <= 1) {
        const blue = sortedBySeed[0];
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: blue?.arena || blue?.gelanggang || "GELANGGANG A",
          fighterBlueId: blue?.id || "BLUE",
          fighterBlueName: blue?.name || "PESILAT BIRU",
          fighterBlueClub: blue?.contingent || blue?.club || "KONTINGEN BIRU",
          fighterRedId: "BYE",
          fighterRedName: "MENUNGGU LAWAN / BYE",
          fighterRedClub: "-",
          participant1: blue ? { id: blue.id, name: blue.name, contingent: blue.contingent || blue.club || "KONTINGEN BIRU" } : null,
          participant2: null,
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;
      } else if (count === 2) {
        const blue = sortedBySeed[0];
        const red = sortedBySeed[1];
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: blue?.arena || blue?.gelanggang || "GELANGGANG A",
          fighterBlueId: blue.id,
          fighterBlueName: blue.name,
          fighterBlueClub: blue.contingent || blue.club || "KONTINGEN BIRU",
          fighterRedId: red.id,
          fighterRedName: red.name,
          fighterRedClub: red.contingent || red.club || "KONTINGEN MERAH",
          participant1: { id: blue.id, name: blue.name, contingent: blue.contingent || blue.club || "KONTINGEN BIRU" },
          participant2: { id: red.id, name: red.name, contingent: red.contingent || red.club || "KONTINGEN MERAH" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;
      } else if (count <= 4) {
        // Semifinal 1
        const a1 = sortedBySeed[0];
        const a2 = sortedBySeed[1];
        const a3 = sortedBySeed[2];
        const a4 = count > 3 ? sortedBySeed[3] : null;

        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-sf1-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "SEMI FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: a1?.arena || "GELANGGANG A",
          fighterBlueId: a1.id,
          fighterBlueName: a1.name,
          fighterBlueClub: a1.contingent || a1.club || "KONTINGEN BIRU",
          fighterRedId: a2.id,
          fighterRedName: a2.name,
          fighterRedClub: a2.contingent || a2.club || "KONTINGEN MERAH",
          participant1: { id: a1.id, name: a1.name, contingent: a1.contingent || a1.club || "KONTINGEN BIRU" },
          participant2: { id: a2.id, name: a2.name, contingent: a2.contingent || a2.club || "KONTINGEN MERAH" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;

        // Semifinal 2
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-sf2-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "SEMI FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: a3?.arena || "GELANGGANG A",
          fighterBlueId: a3.id,
          fighterBlueName: a3.name,
          fighterBlueClub: a3.contingent || a3.club || "KONTINGEN BIRU",
          fighterRedId: a4 ? a4.id : "BYE",
          fighterRedName: a4 ? a4.name : "MENUNGGU LAWAN / BYE",
          fighterRedClub: a4 ? (a4.contingent || a4.club || "KONTINGEN MERAH") : "-",
          participant1: { id: a3.id, name: a3.name, contingent: a3.contingent || a3.club || "KONTINGEN BIRU" },
          participant2: a4 ? { id: a4.id, name: a4.name, contingent: a4.contingent || a4.club || "KONTINGEN MERAH" } : null,
          status: a4 ? "BELUM" : "SELESAI",
          winner: a4 ? null : "BIRU",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;

        // Final
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-final-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: a1?.arena || "GELANGGANG A",
          fighterBlueId: "winner-sf1",
          fighterBlueName: "PEMENANG SEMIFINAL 1",
          fighterBlueClub: "-",
          fighterRedId: "winner-sf2",
          fighterRedName: "PEMENANG SEMIFINAL 2",
          fighterRedClub: "-",
          participant1: { id: "winner-sf1", name: "PEMENANG SEMIFINAL 1", contingent: "-" },
          participant2: { id: "winner-sf2", name: "PEMENANG SEMIFINAL 2", contingent: "-" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;
      } else {
        // 5 to 8 or more athletes: Penyisihan -> Semifinal -> Final
        const firstRoundPairs: any[] = [];
        for (let i = 0; i < sortedBySeed.length; i += 2) {
          const blue = sortedBySeed[i];
          const red = i + 1 < sortedBySeed.length ? sortedBySeed[i + 1] : null;
          firstRoundPairs.push({ blue, red });
        }

        const stageLabel = firstRoundPairs.length <= 2 ? "SEMI FINAL" : firstRoundPairs.length <= 4 ? "PEREMPAT FINAL" : "PENYISIHAN";
        const qfMatches: any[] = [];

        firstRoundPairs.forEach((pair, pIdx) => {
          const m = {
            id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-r1-${pIdx + 1}-${matchCounter}`,
            matchNumber: matchCounter,
            stage: stageLabel,
            category: discipline,
            classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
            categoryName,
            categoryClassId,
            division: ageCategory.toUpperCase(),
            ageCategory,
            weightClass,
            gender,
            arena: pair.blue?.arena || "GELANGGANG A",
            fighterBlueId: pair.blue.id,
            fighterBlueName: pair.blue.name,
            fighterBlueClub: pair.blue.contingent || pair.blue.club || "KONTINGEN BIRU",
            fighterRedId: pair.red ? pair.red.id : "BYE",
            fighterRedName: pair.red ? pair.red.name : "MENUNGGU LAWAN / BYE",
            fighterRedClub: pair.red ? (pair.red.contingent || pair.red.club || "KONTINGEN MERAH") : "-",
            participant1: { id: pair.blue.id, name: pair.blue.name, contingent: pair.blue.contingent || pair.blue.club || "KONTINGEN BIRU" },
            participant2: pair.red ? { id: pair.red.id, name: pair.red.name, contingent: pair.red.contingent || pair.red.club || "KONTINGEN MERAH" } : null,
            status: pair.red ? "BELUM" : "SELESAI",
            winner: pair.red ? null : "BIRU",
            scoreBlue: 0,
            scoreRed: 0
          };
          matches.push(m);
          qfMatches.push(m);
          matchCounter++;
        });

        // Semifinals
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-sf1-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "SEMI FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: "GELANGGANG A",
          fighterBlueId: `winner-r1-1`,
          fighterBlueName: `PEMENANG PARTAI ${qfMatches[0]?.matchNumber || 1}`,
          fighterBlueClub: "-",
          fighterRedId: `winner-r1-2`,
          fighterRedName: `PEMENANG PARTAI ${qfMatches[1]?.matchNumber || 2}`,
          fighterRedClub: "-",
          participant1: { id: "winner-r1-1", name: `PEMENANG PARTAI ${qfMatches[0]?.matchNumber || 1}`, contingent: "-" },
          participant2: { id: "winner-r1-2", name: `PEMENANG PARTAI ${qfMatches[1]?.matchNumber || 2}`, contingent: "-" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;

        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-sf2-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "SEMI FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: "GELANGGANG A",
          fighterBlueId: `winner-r1-3`,
          fighterBlueName: qfMatches[2] ? `PEMENANG PARTAI ${qfMatches[2].matchNumber}` : "MENUNGGU HASIL",
          fighterBlueClub: "-",
          fighterRedId: `winner-r1-4`,
          fighterRedName: qfMatches[3] ? `PEMENANG PARTAI ${qfMatches[3].matchNumber}` : "MENUNGGU HASIL",
          fighterRedClub: "-",
          participant1: { id: "winner-r1-3", name: qfMatches[2] ? `PEMENANG PARTAI ${qfMatches[2].matchNumber}` : "MENUNGGU HASIL", contingent: "-" },
          participant2: { id: "winner-r1-4", name: qfMatches[3] ? `PEMENANG PARTAI ${qfMatches[3].matchNumber}` : "MENUNGGU HASIL", contingent: "-" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;

        // Final
        matches.push({
          id: `match-${discipline.toLowerCase()}-${categoryClassId}-${gender.toLowerCase()}-final-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "FINAL",
          category: discipline,
          classCategory: isJurus ? `JURUS ${weightClass.toUpperCase()}` : `TANDING ${weightClass.toUpperCase()}`,
          categoryName,
          categoryClassId,
          division: ageCategory.toUpperCase(),
          ageCategory,
          weightClass,
          gender,
          arena: "GELANGGANG A",
          fighterBlueId: "winner-sf1",
          fighterBlueName: "PEMENANG SEMIFINAL 1",
          fighterBlueClub: "-",
          fighterRedId: "winner-sf2",
          fighterRedName: "PEMENANG SEMIFINAL 2",
          fighterRedClub: "-",
          participant1: { id: "winner-sf1", name: "PEMENANG SEMIFINAL 1", contingent: "-" },
          participant2: { id: "winner-sf2", name: "PEMENANG SEMIFINAL 2", contingent: "-" },
          status: "BELUM",
          scoreBlue: 0,
          scoreRed: 0
        });
        matchCounter++;
      }
    }
  });

  return { matches: orderSchedulesByStages(matches), categories };
}

export async function syncAndGenerateSchedulesFromParticipants(
  participants: any[],
  options?: any
): Promise<{ matches: any[]; categories: any[]; participants: any[] }> {
  const safeParticipants = Array.isArray(participants) ? participants : [];
  const result = buildAutoSchedulesAndCategories(safeParticipants);
  if (typeof window !== "undefined") {
    try {
      if (safeParticipants.length > 0) {
        localStorage.removeItem("jrz_bracket_cleared");
        localStorage.setItem("jrz_bracket_cleared", "false");
      }
      localStorage.setItem("jrz_cached_participants", JSON.stringify(safeParticipants));
      localStorage.setItem("registered_athletes", JSON.stringify(safeParticipants));
      localStorage.setItem("jrz_cached_schedules", JSON.stringify(result.matches));
      localStorage.setItem("match_schedules", JSON.stringify(result.matches));
      localStorage.setItem("jrz_cached_categories", JSON.stringify(result.categories));

      window.dispatchEvent(
        new CustomEvent("jrz_athletes_updated", {
          detail: { participants: safeParticipants, athletes: safeParticipants }
        })
      );
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: result.matches }));

      // Asynchronous background sync to backend
      fetch("/api/tournament/import-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCategories: result.categories,
          newParticipants: safeParticipants,
          newMatches: result.matches
        })
      }).catch(() => {});

      // Asynchronous background sync to Firebase
      import("../services/firebase")
        .then(fb => {
          if (fb && typeof fb.syncTournamentToFirebase === "function") {
            fb.syncTournamentToFirebase(result.matches, safeParticipants, result.categories).catch(() => {});
          }
        })
        .catch(() => {});
    } catch {}
  }
  return { ...result, participants: safeParticipants };
}

export async function saveManualSchedulesOverride(schedules: any[], participants?: any[]): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("jrz_cached_schedules", JSON.stringify(schedules));
      localStorage.setItem("match_schedules", JSON.stringify(schedules));
      if (participants) {
        localStorage.setItem("jrz_cached_participants", JSON.stringify(participants));
        localStorage.setItem("registered_athletes", JSON.stringify(participants));
        localStorage.removeItem("jrz_bracket_cleared");
        localStorage.setItem("jrz_bracket_cleared", "false");
      }
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated"));
    } catch {}
  }
}

export async function clearAllSchedulesAndBrackets(options?: { clearAthletes?: boolean }): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("jrz_cached_schedules");
      localStorage.removeItem("match_schedules");
      localStorage.removeItem("jrz_cached_categories");
      if (options?.clearAthletes) {
        localStorage.removeItem("jrz_cached_participants");
        localStorage.removeItem("registered_athletes");
      }
      localStorage.setItem("jrz_bracket_cleared", "true");
      window.dispatchEvent(new CustomEvent("jrz_schedules_updated"));
    } catch {}
  }
}

export function autoSyncAndGenerateAllBrackets(schedules?: any[], participants?: any[]): any[] {
  return [];
}
