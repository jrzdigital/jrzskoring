export type AthleteAgeCategory = "USIA_DINI" | "PRA_REMAJA" | "REMAJA" | "DEWASA" | "MASTER";

export type SeniSubCategory = "TUNGGAL_BAKU" | "TUNGGAL_BEBAS" | "GANDA" | "REGU";

export interface PortalAthlete {
  id: string;
  name: string;
  contingent: string;
  category: "TANDING" | "SENI";
  ageCategory: AthleteAgeCategory;
  seniSubCategory?: SeniSubCategory;
  gender: "PUTRA" | "PUTRI";
  weight?: number;
  weightClass?: string;
}
