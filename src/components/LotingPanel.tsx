/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Shuffle,
  Plus,
  ArrowLeft,
  Upload,
  Download,
  Search,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  Edit,
  Scale,
  ShieldCheck,
  ArrowLeftRight,
  Check,
  X,
  Sliders,
  Trophy,
  Calendar,
  AlertTriangle,
  GripVertical,
  LayoutGrid,
  ListFilter,
  Move,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { sound } from "../utils/sound";
import * as XLSX from "xlsx";
import {
  normalizeAthleteRecord,
  normalizeAgeCategory,
  normalizeWeightClass,
  getCanonicalCategoryClassId,
  syncAndGenerateSchedulesFromParticipants,
  clearAllSchedulesAndBrackets,
  fairShuffleTournamentAthletes,
  buildAutoSchedulesAndCategories,
  saveManualSchedulesOverride
} from "../utils/baganGenerator";

const USIA_DINI_WEIGHT_CLASSES = [
  { label: "Under", range: "< 26 Kg", min: 0, max: 25.9 },
  { label: "Kelas A", range: "26 - 28 Kg", min: 26, max: 28 },
  { label: "Kelas B", range: "28 - 30 Kg", min: 28, max: 30 },
  { label: "Kelas C", range: "30 - 32 Kg", min: 30, max: 32 },
  { label: "Kelas D", range: "32 - 34 Kg", min: 32, max: 34 },
  { label: "Kelas E", range: "34 - 36 Kg", min: 34, max: 36 },
  { label: "Kelas F", range: "36 - 38 Kg", min: 36, max: 38 },
  { label: "Kelas Bebas", range: "> 38 Kg", min: 38.1, max: 60 }
];

// Standar Resmi Kelas Tanding & Rentang Berat Badan PERSILAT & PB IPSI 2026
export const IPSI_WEIGHT_CLASSES_2026: Record<string, { label: string; range: string; min: number; max: number }[]> = {
  "Pra Usia Dini": USIA_DINI_WEIGHT_CLASSES,
  "Usia Dini 1": USIA_DINI_WEIGHT_CLASSES,
  "Usia Dini 2": USIA_DINI_WEIGHT_CLASSES,
  "Usia Dini": USIA_DINI_WEIGHT_CLASSES,
  "Pra Remaja": [
    { label: "Under", range: "< 30 Kg", min: 0, max: 29.9 },
    { label: "Kelas A", range: "30 - 33 Kg", min: 30, max: 33 },
    { label: "Kelas B", range: "33 - 36 Kg", min: 33, max: 36 },
    { label: "Kelas C", range: "36 - 39 Kg", min: 36, max: 39 },
    { label: "Kelas D", range: "39 - 42 Kg", min: 39, max: 42 },
    { label: "Kelas E", range: "42 - 45 Kg", min: 42, max: 45 },
    { label: "Kelas F", range: "45 - 48 Kg", min: 45, max: 48 },
    { label: "Kelas G", range: "48 - 51 Kg", min: 48, max: 51 },
    { label: "Kelas H", range: "51 - 54 Kg", min: 51, max: 54 },
    { label: "Kelas I", range: "54 - 57 Kg", min: 54, max: 57 },
    { label: "Kelas J", range: "57 - 60 Kg", min: 57, max: 60 },
    { label: "Kelas Bebas", range: "> 60 Kg", min: 60.1, max: 80 }
  ],
  "Remaja": [
    { label: "Under", range: "< 39 Kg", min: 0, max: 38.9 },
    { label: "Kelas A", range: "39 - 43 Kg", min: 39, max: 43 },
    { label: "Kelas B", range: "43 - 47 Kg", min: 43, max: 47 },
    { label: "Kelas C", range: "47 - 51 Kg", min: 47, max: 51 },
    { label: "Kelas D", range: "51 - 55 Kg", min: 51, max: 55 },
    { label: "Kelas E", range: "55 - 59 Kg", min: 55, max: 59 },
    { label: "Kelas F", range: "59 - 63 Kg", min: 59, max: 63 },
    { label: "Kelas G", range: "63 - 67 Kg", min: 63, max: 67 },
    { label: "Kelas H", range: "67 - 71 Kg", min: 67, max: 71 },
    { label: "Kelas I", range: "71 - 75 Kg", min: 71, max: 75 },
    { label: "Kelas J", range: "75 - 79 Kg", min: 75, max: 79 },
    { label: "Kelas Bebas", range: "> 79 Kg", min: 79.1, max: 100 }
  ],
  "Dewasa": [
    { label: "Under", range: "< 45 Kg", min: 0, max: 44.9 },
    { label: "Kelas A", range: "45 - 50 Kg", min: 45, max: 50 },
    { label: "Kelas B", range: "50 - 55 Kg", min: 50, max: 55 },
    { label: "Kelas C", range: "55 - 60 Kg", min: 55, max: 60 },
    { label: "Kelas D", range: "60 - 65 Kg", min: 60, max: 65 },
    { label: "Kelas E", range: "65 - 70 Kg", min: 65, max: 70 },
    { label: "Kelas F", range: "70 - 75 Kg", min: 70, max: 75 },
    { label: "Kelas G", range: "75 - 80 Kg", min: 75, max: 80 },
    { label: "Kelas H", range: "80 - 85 Kg", min: 80, max: 85 },
    { label: "Kelas I", range: "85 - 90 Kg", min: 85, max: 90 },
    { label: "Kelas J", range: "90 - 95 Kg", min: 90, max: 95 },
    { label: "Kelas Bebas", range: "> 95 Kg s/d 110 Kg", min: 95.1, max: 110 }
  ],
  "Master 1": [
    { label: "Kelas Bebas", range: "Terbuka (> 35 s.d. 45 Thn)", min: 0, max: 120 }
  ],
  "Master 2": [
    { label: "Kelas Bebas", range: "Terbuka (≥ 45 Thn)", min: 0, max: 120 }
  ],
  "Master": [
    { label: "Kelas Bebas", range: "Terbuka (≥ 45 Thn)", min: 0, max: 120 }
  ]
};

interface LotingPanelProps {
  onBack: () => void;
  onOpenBracket?: () => void;
  onOpenJadwal?: () => void;
  onOpenLoting?: () => void;
  onOpenInput?: () => void;
  hideBackHeader?: boolean;
  initialSubView?: "PENDATAAN" | "LOTING";
}

export function LotingPanel({ 
  onBack, 
  onOpenBracket, 
  onOpenJadwal, 
  onOpenLoting,
  onOpenInput,
  hideBackHeader = false,
  initialSubView = "PENDATAAN"
}: LotingPanelProps) {
  // Sub-menu inside Input Data Panel Sekretaris:
  // "PENDATAAN" (Input & Tabel Atlet) vs "LOTING" (Menu Loting & Edit Manual Data Partai)
  const [activeSubView, setActiveSubView] = useState<"PENDATAAN" | "LOTING">(initialSubView);

  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  // Athlete participants state
  const [participants, setParticipants] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("jrz_cached_participants") || localStorage.getItem("registered_athletes");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.removeItem("jrz_bracket_cleared");
          localStorage.setItem("jrz_bracket_cleared", "false");
          return parsed.map((p, idx) => normalizeAthleteRecord(p, idx));
        }
      }
      const isCleared = localStorage.getItem("jrz_bracket_cleared") === "true";
      if (isCleared) return [];
    } catch (e) {
      console.warn("Gagal membaca cached participants:", e);
    }
    return [];
  });

  // Schedules (Partai Pertandingan Hasil Loting) state
  const [schedules, setSchedules] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("jrz_cached_schedules") || localStorage.getItem("match_schedules");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const isCleared = localStorage.getItem("jrz_bracket_cleared") === "true";
      if (isCleared) return [];
      const savedP = localStorage.getItem("jrz_cached_participants") || localStorage.getItem("registered_athletes");
      const rawP = savedP !== null ? JSON.parse(savedP) : [];
      if (Array.isArray(rawP) && rawP.length > 0) {
        return buildAutoSchedulesAndCategories(rawP).matches;
      }
    } catch {}
    return [];
  });

  // Ensure initial participants are synced and their brackets/schedules are generated if not cleared
  useEffect(() => {
    const isCleared = localStorage.getItem("jrz_bracket_cleared") === "true";
    const savedSchedules = localStorage.getItem("jrz_cached_schedules");
    let hasSchedules = false;
    try {
      if (savedSchedules) {
        const parsed = JSON.parse(savedSchedules);
        if (Array.isArray(parsed) && parsed.length > 0) hasSchedules = true;
      }
    } catch {}

    if (participants.length > 0 && !isCleared && !hasSchedules) {
      syncAndGenerateSchedulesFromParticipants(participants).then((res) => {
        if (res && Array.isArray(res.matches)) {
          setSchedules(res.matches);
        }
      });
    }

    const handleExternalSync = () => {
      try {
        const rawP = localStorage.getItem("jrz_cached_participants");
        if (rawP !== null) {
          const parsedP = JSON.parse(rawP);
          if (Array.isArray(parsedP)) {
            setParticipants(parsedP.map((p, idx) => normalizeAthleteRecord(p, idx)));
          }
        }
        const rawS = localStorage.getItem("jrz_cached_schedules");
        if (rawS !== null) {
          const parsedS = JSON.parse(rawS);
          if (Array.isArray(parsedS)) {
            setSchedules(parsedS);
          }
        }
      } catch {}
    };

    window.addEventListener("storage", handleExternalSync);
    window.addEventListener("jrz_tournament_synced", handleExternalSync);
    window.addEventListener("jrz_schedules_updated", handleExternalSync);

    return () => {
      window.removeEventListener("storage", handleExternalSync);
      window.removeEventListener("jrz_tournament_synced", handleExternalSync);
      window.removeEventListener("jrz_schedules_updated", handleExternalSync);
    };
  }, []);

  function isJurusCategory(cat?: string | null): boolean {
  if (!cat) return false;
  const upper = String(cat).toUpperCase();
  return (
    upper.includes("TUNGGAL") ||
    upper.includes("GANDA") ||
    upper.includes("REGU") ||
    upper.includes("BEBAS") ||
    upper.includes("SOLO") ||
    upper.includes("KREATIF") ||
    upper.includes("JURUS") ||
    upper.includes("SENI")
  );
}

  // New/Edit Athlete form state (Standar PERSILAT & PB IPSI 2026)
  const [newAthlete, setNewAthlete] = useState({
    id: "",
    name: "",
    contingent: "",
    ageCategory: "Remaja",
    gender: "PUTRA" as "PUTRA" | "PUTRI",
    category: "TANDING" as string,
    weightClass: "Kelas A",
    weight: "",
    seed: "",
    arena: "GELANGGANG A"
  });
  const [isEditingAthlete, setIsEditingAthlete] = useState(false);

  // Search & Filter in Input Data & Loting Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgeCategory, setFilterAgeCategory] = useState("ALL");
  const [filterGender, setFilterGender] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");

  // Search & Filter in Menu Loting & Edit Partai
  const [lotingSearchQuery, setLotingSearchQuery] = useState("");
  const [lotingAgeFilter, setLotingAgeFilter] = useState("ALL");
  const [lotingGenderFilter, setLotingGenderFilter] = useState("ALL");
  const [lotingClassFilter, setLotingClassFilter] = useState("ALL");
  const [lotingArenaFilter, setLotingArenaFilter] = useState("ALL");

  // Display Mode in Menu Loting: Table View vs Visual Bagan Pertemuan (Cards)
  const [lotingDisplayMode, setLotingDisplayMode] = useState<"TABLE" | "BAGAN">("TABLE");

  // Drag and Drop States for changing athlete pairings
  const [draggedAthlete, setDraggedAthlete] = useState<{
    sourceType: "MATCH_CORNER" | "POOL_ATHLETE";
    athleteId?: string;
    athleteName: string;
    athleteClub?: string;
    sourceMatchId?: string;
    sourceCorner?: "blue" | "red";
    sourceMatchNumber?: string;
    weightClass?: string;
    ageCategory?: string;
    gender?: string;
  } | null>(null);

  const [hoveredDropZone, setHoveredDropZone] = useState<{
    matchId: string;
    corner: "blue" | "red";
  } | null>(null);

  // Modal State for Editing or Creating a Partai Manually after Loting
  const [editingMatch, setEditingMatch] = useState<{
    isNew?: boolean;
    id: string;
    matchNumber: string;
    arena: string;
    stage: string;
    ageCategory: string;
    gender: "PUTRA" | "PUTRI";
    weightClass: string;
    fighterBlueId: string;
    fighterBlueName: string;
    fighterBlueClub: string;
    fighterRedId: string;
    fighterRedName: string;
    fighterRedClub: string;
    status: string;
    winner: string | null;
  } | null>(null);

  // Live Weight Class Object & Validation Status (IPSI 2026)
  const currentWeightClassObj = useMemo(() => {
    if (isJurusCategory(newAthlete.category)) return null;
    const list = IPSI_WEIGHT_CLASSES_2026[newAthlete.ageCategory] || [];
    return list.find(c => c.label === newAthlete.weightClass) || list[0];
  }, [newAthlete.ageCategory, newAthlete.weightClass, newAthlete.category]);

  const weightValidationStatus = useMemo(() => {
    if (isJurusCategory(newAthlete.category) || newAthlete.category !== "TANDING") return null;
    const w = parseFloat(newAthlete.weight);
    if (!w || isNaN(w)) return null;
    if (!currentWeightClassObj) return null;
    const isWithin = w >= currentWeightClassObj.min && w <= currentWeightClassObj.max;
    return {
      isValid: isWithin,
      message: isWithin
        ? `✓ Berat ${w} Kg SAH (Rentang ${currentWeightClassObj.label}: ${currentWeightClassObj.range})`
        : `⚠ Perhatian: Berat ${w} Kg di luar rentang resmi ${currentWeightClassObj.label} (${currentWeightClassObj.range})`
    };
  }, [newAthlete.weight, currentWeightClassObj, newAthlete.category]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    type: "DELETE_SINGLE" | "KOSONGKAN_ALL" | "DELETE_MATCH";
    athleteId?: string;
    athleteName?: string;
    athleteContingent?: string;
    matchId?: string;
    matchNumber?: string;
  } | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save to localStorage helper & trigger automatic Bagan & Jadwal generation
  const saveParticipants = async (
    updated: any[],
    activeFilter?: { ageCategory: string; weightClass: string; gender: string },
    options?: { ignoreManualOverrides?: boolean; resetCategoryClassId?: string; resetGender?: string }
  ) => {
    const normalized = updated.map((p, idx) => normalizeAthleteRecord(p, idx));
    setParticipants(normalized);
    try {
      if (normalized.length === 0) {
        await clearAllSchedulesAndBrackets({ clearAthletes: true });
        setSchedules([]);
      } else {
        const res = await syncAndGenerateSchedulesFromParticipants(normalized, {
          activeFilter,
          preserveExistingSchedules: schedules,
          ignoreManualOverrides: options?.ignoreManualOverrides,
          resetCategoryClassId: options?.resetCategoryClassId,
          resetGender: options?.resetGender
        });
        if (res && Array.isArray(res.matches)) {
          setSchedules(res.matches);
        }
      }
    } catch (e) {
      console.error("Gagal simpan & sinkronisasi participants:", e);
    }
  };

  // Add / Update athlete submit (Standar PERSILAT & IPSI 2026) -> Otomatis masuk Loting, Bagan & Jadwal
  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthlete.name.trim() || !newAthlete.contingent.trim()) {
      showNotification("⚠️ Nama Pesilat dan Asal Kontingen/Perguruan wajib diisi!");
      sound.playBuzzer();
      return;
    }

    const isJurus = isJurusCategory(newAthlete.category);
    const normAge = normalizeAgeCategory(newAthlete.ageCategory);
    const normClass = isJurus
      ? normalizeWeightClass(newAthlete.category)
      : normalizeWeightClass(newAthlete.weightClass);
    const catClassId = getCanonicalCategoryClassId(normAge, normClass);
    const weightVal = isJurus ? 0 : (parseFloat(newAthlete.weight) || 0);
    let seedVal = parseInt(newAthlete.seed, 10) || 0;

    if (!seedVal) {
      const sameClassCount = participants.filter(
        p =>
          normalizeAgeCategory(p.ageCategory) === normAge &&
          (isJurus ? (p.category === newAthlete.category || normalizeWeightClass(p.weightClass) === normClass) : normalizeWeightClass(p.weightClass) === normClass) &&
          p.gender === newAthlete.gender &&
          p.id !== newAthlete.id
      ).length;
      seedVal = sameClassCount + 1;
    }

    const targetFilter = {
      ageCategory: normAge,
      weightClass: normClass,
      gender: newAthlete.gender
    };

    if (isEditingAthlete && newAthlete.id) {
      const updated = participants.map(p => {
        if (p.id === newAthlete.id) {
          return normalizeAthleteRecord({
            ...p,
            name: newAthlete.name.trim().toUpperCase(),
            contingent: newAthlete.contingent.trim().toUpperCase(),
            club: newAthlete.contingent.trim().toUpperCase(),
            ageCategory: normAge,
            division: normAge.toUpperCase(),
            gender: newAthlete.gender,
            category: newAthlete.category,
            weightClass: normClass,
            className: normClass.toUpperCase(),
            categoryClassId: catClassId,
            weight: weightVal,
            seed: seedVal,
            arena: newAthlete.arena || p.arena || "GELANGGANG A",
            gelanggang: newAthlete.arena || p.arena || "GELANGGANG A"
          });
        }
        return p;
      });
      await saveParticipants(updated, targetFilter);
      sound.playClick();
      showNotification(`✅ Data atlet "${newAthlete.name.toUpperCase()}" diperbarui & Bagan/Jadwal otomatis disinkronkan!`);
      setIsEditingAthlete(false);
    } else {
      const created = normalizeAthleteRecord({
        id: `atlet-${Date.now()}`,
        name: newAthlete.name.trim().toUpperCase(),
        contingent: newAthlete.contingent.trim().toUpperCase(),
        club: newAthlete.contingent.trim().toUpperCase(),
        ageCategory: normAge,
        division: normAge.toUpperCase(),
        gender: newAthlete.gender,
        category: newAthlete.category,
        weightClass: normClass,
        className: normClass.toUpperCase(),
        categoryClassId: catClassId,
        weight: weightVal,
        seed: seedVal,
        arena: newAthlete.arena || "GELANGGANG A",
        gelanggang: newAthlete.arena || "GELANGGANG A"
      });
      const updated = [created, ...participants];
      await saveParticipants(updated, targetFilter);
      sound.playClick();
      showNotification(`✅ Pesilat ${created.name} terdaftar (Undian #${seedVal}) & otomatis masuk ke Bagan + Jadwal!`);
    }

    setNewAthlete({
      id: "",
      name: "",
      contingent: "",
      ageCategory: normAge,
      gender: newAthlete.gender,
      category: newAthlete.category,
      weightClass: isJurus ? newAthlete.category : normClass,
      weight: "",
      seed: "",
      arena: newAthlete.arena || "GELANGGANG A"
    });
  };

  // Start editing existing athlete
  const handleStartEditAthlete = (athlete: any) => {
    sound.playClick();
    setActiveSubView("PENDATAAN");
    setIsEditingAthlete(true);
    const isJurus = isJurusCategory(athlete.category) || isJurusCategory(athlete.weightClass);
    setNewAthlete({
      id: athlete.id,
      name: athlete.name || "",
      contingent: athlete.contingent || athlete.club || "",
      ageCategory: athlete.ageCategory || athlete.division || "Remaja",
      gender: (athlete.gender || "PUTRA").toUpperCase() === "PUTRI" ? "PUTRI" : "PUTRA",
      category: athlete.category || (isJurus ? athlete.weightClass : "TANDING"),
      weightClass: athlete.weightClass || athlete.className || "Kelas A",
      weight: athlete.weight && athlete.weight > 0 ? String(athlete.weight) : "",
      seed: athlete.seed ? String(athlete.seed) : "",
      arena: athlete.arena || athlete.gelanggang || "GELANGGANG A"
    });
    window.scrollTo({ top: 80, behavior: "smooth" });
    showNotification(`✏️ Mengedit data atlet: ${athlete.name}`);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    sound.playClick();
    setIsEditingAthlete(false);
    setNewAthlete({
      id: "",
      name: "",
      contingent: "",
      ageCategory: "Remaja",
      gender: "PUTRA",
      category: "TANDING",
      weightClass: "Kelas A",
      weight: "",
      seed: "",
      arena: "GELANGGANG A"
    });
  };

  const requestDeleteAthlete = (id: string, name: string, contingent?: string) => {
    sound.playClick();
    setConfirmModal({
      type: "DELETE_SINGLE",
      athleteId: id,
      athleteName: name,
      athleteContingent: contingent
    });
  };

  const requestResetAll = () => {
    sound.playClick();
    setConfirmModal({
      type: "KOSONGKAN_ALL"
    });
  };

  const requestDeleteMatch = (matchId: string, matchNumber: string) => {
    sound.playClick();
    setConfirmModal({
      type: "DELETE_MATCH",
      matchId,
      matchNumber
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    if (confirmModal.type === "DELETE_SINGLE" && confirmModal.athleteId) {
      const updated = participants.filter(p => p.id !== confirmModal.athleteId);
      await saveParticipants(updated);
      sound.playClick();
      showNotification(`🗑️ Atlet ${confirmModal.athleteName || ""} berhasil dihapus & Bagan/Jadwal diperbarui.`);
    } else if (confirmModal.type === "KOSONGKAN_ALL") {
      await saveParticipants([]);
      sound.playBuzzer();
      showNotification("🗑️ Seluruh data atlet, bagan, dan jadwal berhasil dikosongkan.");
    } else if (confirmModal.type === "DELETE_MATCH" && confirmModal.matchId) {
      const updatedMatches = schedules.filter(m => m.id !== confirmModal.matchId);
      setSchedules(updatedMatches);
      await saveManualSchedulesOverride(updatedMatches, participants);
      sound.playClick();
      showNotification(`🗑️ Partai #${confirmModal.matchNumber || "-"} berhasil dihapus dari daftar partai.`);
    }

    setConfirmModal(null);
  };

  // Restore starter sample athletes if empty
  const handleRestoreSampleAthletes = async () => {
    const starter = [
      { id: "atlet-1", name: "FAJAR NUGRAHA", contingent: "PERSILAT BEKASI", ageCategory: "Remaja", gender: "PUTRA", weightClass: "Kelas A", weight: 42, seed: 1 },
      { id: "atlet-2", name: "EKO WAHYUDI", contingent: "TAPAK SUCI ACEH", ageCategory: "Remaja", gender: "PUTRA", weightClass: "Kelas A", weight: 41.5, seed: 2 },
      { id: "atlet-3", name: "ANDI SETIAWAN", contingent: "PERISAI DIRI BANTEN", ageCategory: "Remaja", gender: "PUTRA", weightClass: "Kelas A", weight: 42.8, seed: 3 },
      { id: "atlet-4", name: "BAYU PRATAMA", contingent: "MERPATI PUTIH JABAR", ageCategory: "Remaja", gender: "PUTRA", weightClass: "Kelas A", weight: 40.2, seed: 4 },
      { id: "atlet-5", name: "RIAN HIDAYAT", contingent: "SETIA HATI TERATE", ageCategory: "Dewasa", gender: "PUTRA", weightClass: "Kelas C", weight: 58.5, seed: 1 },
      { id: "atlet-6", name: "DENI SAPUTRA", contingent: "PAGAR NUSA JATIM", ageCategory: "Dewasa", gender: "PUTRA", weightClass: "Kelas C", weight: 59.1, seed: 2 },
      { id: "atlet-7", name: "SITI NURHALIZA", contingent: "KPS NUSANTARA", ageCategory: "Dewasa", gender: "PUTRI", weightClass: "Kelas D", weight: 62.4, seed: 1 },
      { id: "atlet-8", name: "DEWI ANGGRAINI", contingent: "CIMANDE BOGOR", ageCategory: "Dewasa", gender: "PUTRI", weightClass: "Kelas D", weight: 63.0, seed: 2 }
    ];
    await saveParticipants(starter, { ageCategory: "Remaja", weightClass: "Kelas A", gender: "PUTRA" }, { ignoreManualOverrides: true });
    sound.playClick();
    showNotification("✨ Berhasil memuat kembali data atlet contoh beserta Bagan & Jadwalnya!");
  };

  // Filtered participants in Input Data tab
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (filterAgeCategory !== "ALL" && normalizeAgeCategory(p.ageCategory) !== normalizeAgeCategory(filterAgeCategory)) return false;
      if (filterGender !== "ALL" && p.gender !== filterGender) return false;
      if (filterClass !== "ALL" && normalizeWeightClass(p.weightClass) !== normalizeWeightClass(filterClass)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const n = String(p.name || "").toLowerCase();
        const c = String(p.contingent || "").toLowerCase();
        return n.includes(q) || c.includes(q);
      }
      return true;
    });
  }, [participants, filterAgeCategory, filterGender, filterClass, searchQuery]);

  // Filtered participants in Menu Loting
  const lotingFilteredParticipants = useMemo(() => {
    return participants
      .filter(p => {
        if (lotingAgeFilter !== "ALL" && normalizeAgeCategory(p.ageCategory) !== normalizeAgeCategory(lotingAgeFilter)) return false;
        if (lotingGenderFilter !== "ALL" && p.gender !== lotingGenderFilter) return false;
        if (lotingClassFilter !== "ALL" && normalizeWeightClass(p.weightClass) !== normalizeWeightClass(lotingClassFilter)) return false;
        if (lotingSearchQuery.trim()) {
          const q = lotingSearchQuery.toLowerCase();
          return (
            String(p.name || "").toLowerCase().includes(q) ||
            String(p.contingent || p.club || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.categoryClassId !== b.categoryClassId) return String(a.categoryClassId).localeCompare(String(b.categoryClassId));
        if (a.gender !== b.gender) return String(a.gender).localeCompare(String(b.gender));
        return (Number(a.seed) || 999) - (Number(b.seed) || 999);
      });
  }, [participants, lotingAgeFilter, lotingGenderFilter, lotingClassFilter, lotingSearchQuery]);

  // Filtered schedules (partai hasil loting) in Menu Loting
  const lotingFilteredSchedules = useMemo(() => {
    return schedules
      .filter(m => {
        if (lotingAgeFilter !== "ALL") {
          const mAge = normalizeAgeCategory(m.ageCategory || m.division || "");
          if (mAge !== normalizeAgeCategory(lotingAgeFilter)) return false;
        }
        if (lotingGenderFilter !== "ALL" && m.gender !== lotingGenderFilter) return false;
        if (lotingClassFilter !== "ALL") {
          const mCls = normalizeWeightClass(m.weightClass || m.classCategory || "");
          if (mCls !== normalizeWeightClass(lotingClassFilter)) return false;
        }
        if (lotingArenaFilter !== "ALL") {
          const mArena = String(m.arena || "GELANGGANG A").toUpperCase();
          if (mArena !== lotingArenaFilter.toUpperCase()) return false;
        }
        if (lotingSearchQuery.trim()) {
          const q = lotingSearchQuery.toLowerCase();
          const blueN = String(m.fighterBlueName || "").toLowerCase();
          const blueC = String(m.fighterBlueClub || "").toLowerCase();
          const redN = String(m.fighterRedName || "").toLowerCase();
          const redC = String(m.fighterRedClub || "").toLowerCase();
          const pNo = String(m.matchNumber || "").toLowerCase();
          const stg = String(m.stage || "").toLowerCase();
          return (
            blueN.includes(q) ||
            blueC.includes(q) ||
            redN.includes(q) ||
            redC.includes(q) ||
            pNo.includes(q) ||
            stg.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const nA = parseInt(String(a.matchNumber || "").replace(/\D/g, ""), 10);
        const nB = parseInt(String(b.matchNumber || "").replace(/\D/g, ""), 10);
        if (!isNaN(nA) && !isNaN(nB) && nA !== nB) return nA - nB;
        return 0;
      });
  }, [schedules, lotingAgeFilter, lotingGenderFilter, lotingClassFilter, lotingArenaFilter, lotingSearchQuery]);

  // Execute Loting / Shuffle for Filtered Athletes or All Athletes
  const handleRunLotingShuffle = async (mode: "FILTERED" | "ALL") => {
    sound.playClick();
    if (participants.length === 0) {
      showNotification("⚠️ Belum ada atlet terdaftar untuk diloting!");
      sound.playBuzzer();
      return;
    }

    // Group athletes by (categoryClassId + gender) and shuffle each group fairly
    const groups = new Map<string, any[]>();
    const untouched: any[] = [];

    participants.forEach(p => {
      const matchesFilter =
        mode === "ALL" ||
        ((lotingAgeFilter === "ALL" || normalizeAgeCategory(p.ageCategory) === normalizeAgeCategory(lotingAgeFilter)) &&
          (lotingGenderFilter === "ALL" || p.gender === lotingGenderFilter) &&
          (lotingClassFilter === "ALL" || normalizeWeightClass(p.weightClass) === normalizeWeightClass(lotingClassFilter)));

      if (matchesFilter) {
        const key = `${p.categoryClassId}___${p.gender}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
      } else {
        untouched.push(p);
      }
    });

    if (groups.size === 0) {
      showNotification("⚠️ Tidak ada atlet yang sesuai filter untuk diloting!");
      return;
    }

    const shuffledParticipants: any[] = [...untouched];
    groups.forEach((groupList) => {
      const shuffledGroup = fairShuffleTournamentAthletes(groupList).map((ath, idx) => ({
        ...ath,
        seed: idx + 1
      }));
      shuffledParticipants.push(...shuffledGroup);
    });

    const resetCatId =
      mode === "FILTERED" && lotingAgeFilter !== "ALL" && lotingClassFilter !== "ALL"
        ? getCanonicalCategoryClassId(lotingAgeFilter, lotingClassFilter)
        : undefined;
    const resetGender =
      mode === "FILTERED" && lotingGenderFilter !== "ALL" ? lotingGenderFilter : undefined;

    await saveParticipants(shuffledParticipants, undefined, {
      ignoreManualOverrides: true,
      resetCategoryClassId: resetCatId,
      resetGender
    });

    showNotification(
      mode === "ALL"
        ? `🎲 Loting otomatis selesai untuk seluruh ${groups.size} kelas tanding! Data partai telah diperbarui.`
        : `🎲 Loting undian selesai untuk ${groups.size} kelas tanding terpilih! Anda tetap dapat mengedit partai secara manual di bawah.`
    );
  };

  // Manual change of an athlete's seed number in Menu Loting
  const handleManualSeedChange = async (athleteId: string, newSeedVal: number) => {
    if (isNaN(newSeedVal) || newSeedVal < 1) return;
    const updated = participants.map(p => (p.id === athleteId ? { ...p, seed: newSeedVal } : p));
    await saveParticipants(updated);
    sound.playClick();
    showNotification(`🔢 Nomor undian atlet diperbarui menjadi #${newSeedVal}`);
  };

  // Quick 1-click swap between Blue & Red corner on a match
  const handleSwapMatchCorners = async (matchId: string) => {
    sound.playClick();
    const updatedMatches = schedules.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          fighterBlueId: m.fighterRedId,
          fighterBlueName: m.fighterRedName,
          fighterBlueClub: m.fighterRedClub,
          fighterRedId: m.fighterBlueId,
          fighterRedName: m.fighterBlueName,
          fighterRedClub: m.fighterBlueClub,
          isManualModified: true
        };
      }
      return m;
    });
    setSchedules(updatedMatches);
    await saveManualSchedulesOverride(updatedMatches, participants);
    showNotification("⇄ Posisi Sudut Biru dan Sudut Merah berhasil ditukar secara manual!");
  };

  // Quick inline update for matchNumber or arena on a match
  const handleQuickUpdateMatchField = async (matchId: string, field: "matchNumber" | "arena" | "stage", value: string) => {
    const updatedMatches = schedules.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          [field]: value,
          isManualModified: true
        };
      }
      return m;
    });
    setSchedules(updatedMatches);
    await saveManualSchedulesOverride(updatedMatches, participants);
  };

  // =========================================================================
  // FITUR DRAG & DROP: MERUBAH BAGAN PERTEMUAN KEDUA ATLET
  // Pengguna cukup menarik atlet dari satu partai / baki atlet dan melepaskannya
  // ke dalam sudut partai tujuan untuk langsung mengubah bagan pertemuannya.
  // =========================================================================

  const handleAthleteDragStart = (
    e: React.DragEvent,
    payload: {
      sourceType: "MATCH_CORNER" | "POOL_ATHLETE";
      athleteId?: string;
      athleteName: string;
      athleteClub?: string;
      sourceMatchId?: string;
      sourceCorner?: "blue" | "red";
      sourceMatchNumber?: string;
      weightClass?: string;
      ageCategory?: string;
      gender?: string;
    }
  ) => {
    if (!payload.athleteName || payload.athleteName === "BYE" || payload.athleteName === "-") {
      e.preventDefault();
      return;
    }
    setDraggedAthlete(payload);
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.setData("text/plain", payload.athleteName);
      e.dataTransfer.effectAllowed = "move";
    } catch {}
    sound.playClick();
  };

  const handleAthleteDragEnd = () => {
    setDraggedAthlete(null);
    setHoveredDropZone(null);
  };

  const handleAthleteDragOver = (
    e: React.DragEvent,
    targetMatchId: string,
    targetCorner: "blue" | "red"
  ) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
    if (!hoveredDropZone || hoveredDropZone.matchId !== targetMatchId || hoveredDropZone.corner !== targetCorner) {
      setHoveredDropZone({ matchId: targetMatchId, corner: targetCorner });
    }
  };

  const handleAthleteDragLeave = (
    e: React.DragEvent,
    targetMatchId: string,
    targetCorner: "blue" | "red"
  ) => {
    e.preventDefault();
    if (hoveredDropZone?.matchId === targetMatchId && hoveredDropZone?.corner === targetCorner) {
      setHoveredDropZone(null);
    }
  };

  const handleAthleteDrop = async (
    e: React.DragEvent,
    targetMatchId: string,
    targetCorner: "blue" | "red"
  ) => {
    e.preventDefault();
    setHoveredDropZone(null);

    let data = draggedAthlete;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) data = JSON.parse(raw);
      } catch {}
    }

    if (!data || !data.athleteName || data.athleteName === "BYE") {
      setDraggedAthlete(null);
      return;
    }

    const targetMatchIndex = schedules.findIndex(m => m.id === targetMatchId);
    if (targetMatchIndex === -1) {
      setDraggedAthlete(null);
      return;
    }

    const targetMatch = schedules[targetMatchIndex];

    // Jika dilepaskan di partai & sudut yang sama persis, abaikan
    if (data.sourceMatchId === targetMatchId && data.sourceCorner === targetCorner) {
      setDraggedAthlete(null);
      return;
    }

    // Identifikasi atlet yang saat ini ada di target slot
    const targetOccupant = {
      id: targetCorner === "blue" ? targetMatch.fighterBlueId : targetMatch.fighterRedId,
      name: targetCorner === "blue" ? targetMatch.fighterBlueName : targetMatch.fighterRedName,
      club: targetCorner === "blue" ? targetMatch.fighterBlueClub : targetMatch.fighterRedClub,
    };

    let updatedMatches = [...schedules];

    if (data.sourceType === "MATCH_CORNER" && data.sourceMatchId) {
      const sourceMatchIndex = schedules.findIndex(m => m.id === data.sourceMatchId);
      if (sourceMatchIndex !== -1) {
        // KASUS 1: Tukar sudut dalam partai yang SAMA
        if (data.sourceMatchId === targetMatchId) {
          const currentM = updatedMatches[targetMatchIndex];
          updatedMatches[targetMatchIndex] = {
            ...currentM,
            fighterBlueId: currentM.fighterRedId,
            fighterBlueName: currentM.fighterRedName,
            fighterBlueClub: currentM.fighterRedClub,
            fighterRedId: currentM.fighterBlueId,
            fighterRedName: currentM.fighterBlueName,
            fighterRedClub: currentM.fighterBlueClub,
            isManualModified: true
          };
        } else {
          // KASUS 2: Pertukaran atlet antara DUA PARTAI BERBEDA (Bagan Pertemuan)
          const srcMatch = { ...updatedMatches[sourceMatchIndex] };
          const tgtMatch = { ...updatedMatches[targetMatchIndex] };

          // Partai Target menerima atlet yang ditarik
          if (targetCorner === "blue") {
            tgtMatch.fighterBlueId = data.athleteId || `ath-${Date.now()}`;
            tgtMatch.fighterBlueName = data.athleteName;
            tgtMatch.fighterBlueClub = data.athleteClub || "-";
          } else {
            tgtMatch.fighterRedId = data.athleteId || `ath-${Date.now()}`;
            tgtMatch.fighterRedName = data.athleteName;
            tgtMatch.fighterRedClub = data.athleteClub || "-";
          }
          tgtMatch.isManualModified = true;

          // Partai Sumber menerima atlet lawan tukarnya dari Target (atau BYE jika target sebelumnya kosong)
          const repName = targetOccupant.name && targetOccupant.name !== "BYE" ? targetOccupant.name : "BYE";
          const repClub = repName === "BYE" ? "-" : (targetOccupant.club || "-");
          const repId = repName === "BYE" ? undefined : targetOccupant.id;

          if (data.sourceCorner === "blue") {
            srcMatch.fighterBlueId = repId;
            srcMatch.fighterBlueName = repName;
            srcMatch.fighterBlueClub = repClub;
          } else {
            srcMatch.fighterRedId = repId;
            srcMatch.fighterRedName = repName;
            srcMatch.fighterRedClub = repClub;
          }
          srcMatch.isManualModified = true;

          updatedMatches[sourceMatchIndex] = srcMatch;
          updatedMatches[targetMatchIndex] = tgtMatch;
        }
      }
    } else {
      // KASUS 3: Ditarik dari Baki / Tabel Atlet (POOL_ATHLETE)
      const existingMatchIdx = updatedMatches.findIndex(m => 
        (m.fighterBlueName && m.fighterBlueName.trim().toUpperCase() === data!.athleteName.trim().toUpperCase()) ||
        (m.fighterRedName && m.fighterRedName.trim().toUpperCase() === data!.athleteName.trim().toUpperCase())
      );

      const tgtMatch = { ...updatedMatches[targetMatchIndex] };

      if (existingMatchIdx !== -1 && existingMatchIdx !== targetMatchIndex) {
        // Tukar dengan posisi partai lama atlet tersebut agar tidak terjadi duplikasi
        const existingMatch = { ...updatedMatches[existingMatchIdx] };
        const isBlueInExisting = existingMatch.fighterBlueName?.trim().toUpperCase() === data.athleteName.trim().toUpperCase();

        if (targetCorner === "blue") {
          tgtMatch.fighterBlueId = data.athleteId || `ath-${Date.now()}`;
          tgtMatch.fighterBlueName = data.athleteName;
          tgtMatch.fighterBlueClub = data.athleteClub || "-";
        } else {
          tgtMatch.fighterRedId = data.athleteId || `ath-${Date.now()}`;
          tgtMatch.fighterRedName = data.athleteName;
          tgtMatch.fighterRedClub = data.athleteClub || "-";
        }
        tgtMatch.isManualModified = true;

        const repName = targetOccupant.name && targetOccupant.name !== "BYE" ? targetOccupant.name : "BYE";
        const repClub = repName === "BYE" ? "-" : (targetOccupant.club || "-");
        const repId = repName === "BYE" ? undefined : targetOccupant.id;

        if (isBlueInExisting) {
          existingMatch.fighterBlueId = repId;
          existingMatch.fighterBlueName = repName;
          existingMatch.fighterBlueClub = repClub;
        } else {
          existingMatch.fighterRedId = repId;
          existingMatch.fighterRedName = repName;
          existingMatch.fighterRedClub = repClub;
        }
        existingMatch.isManualModified = true;

        updatedMatches[existingMatchIdx] = existingMatch;
        updatedMatches[targetMatchIndex] = tgtMatch;
      } else {
        if (targetCorner === "blue") {
          tgtMatch.fighterBlueId = data.athleteId || `ath-${Date.now()}`;
          tgtMatch.fighterBlueName = data.athleteName;
          tgtMatch.fighterBlueClub = data.athleteClub || "-";
        } else {
          tgtMatch.fighterRedId = data.athleteId || `ath-${Date.now()}`;
          tgtMatch.fighterRedName = data.athleteName;
          tgtMatch.fighterRedClub = data.athleteClub || "-";
        }
        tgtMatch.isManualModified = true;
        updatedMatches[targetMatchIndex] = tgtMatch;
      }
    }

    setSchedules(updatedMatches);
    setDraggedAthlete(null);
    sound.playClick();

    await saveManualSchedulesOverride(updatedMatches, participants);

    const cornerLabel = targetCorner === "blue" ? "Sudut Biru" : "Sudut Merah";
    const targetMatchNumber = targetMatch.matchNumber || (targetMatchIndex + 1);

    if (data.sourceMatchNumber && data.sourceMatchId !== targetMatchId) {
      showNotification(
        `🔄 Pertemuan bagan berhasil diubah! Atlet "${data.athleteName}" ditukar dengan "${targetOccupant.name || 'BYE'}" antara Partai #${data.sourceMatchNumber} dan Partai #${targetMatchNumber} (${cornerLabel}).`
      );
    } else {
      showNotification(
        `🔄 Atlet "${data.athleteName}" berhasil ditarik & dipasangkan ke Partai #${targetMatchNumber} (${cornerLabel})!`
      );
    }
  };

  // Open manual edit modal for an existing partai
  const handleOpenEditMatchModal = (match: any) => {
    sound.playClick();
    setEditingMatch({
      isNew: false,
      id: match.id,
      matchNumber: String(match.matchNumber || "1"),
      arena: String(match.arena || "GELANGGANG A").toUpperCase(),
      stage: String(match.stage || "Penyisihan"),
      ageCategory: normalizeAgeCategory(match.ageCategory || match.division || "Remaja"),
      gender: String(match.gender || "PUTRA").toUpperCase() === "PUTRI" ? "PUTRI" : "PUTRA",
      weightClass: normalizeWeightClass(match.weightClass || match.classCategory || "Kelas A"),
      fighterBlueId: match.fighterBlueId || "",
      fighterBlueName: match.fighterBlueName || "",
      fighterBlueClub: match.fighterBlueClub || "",
      fighterRedId: match.fighterRedId || "",
      fighterRedName: match.fighterRedName || "",
      fighterRedClub: match.fighterRedClub || "",
      status: match.status || "BELUM",
      winner: match.winner || null
    });
  };

  // Open modal to create a brand-new manual partai
  const handleOpenCreateManualMatchModal = () => {
    sound.playClick();
    const maxPartai = schedules.reduce((max, m) => {
      const num = parseInt(String(m.matchNumber || "0").replace(/\D/g, ""), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    const defaultAge = lotingAgeFilter !== "ALL" ? lotingAgeFilter : "Remaja";
    const defaultGender = lotingGenderFilter !== "ALL" ? (lotingGenderFilter as "PUTRA" | "PUTRI") : "PUTRA";
    const defaultClass = lotingClassFilter !== "ALL" ? lotingClassFilter : "Kelas A";

    setEditingMatch({
      isNew: true,
      id: `m-manual-${Date.now()}`,
      matchNumber: String(maxPartai + 1),
      arena: lotingArenaFilter !== "ALL" ? lotingArenaFilter : "GELANGGANG A",
      stage: "Penyisihan",
      ageCategory: defaultAge,
      gender: defaultGender,
      weightClass: defaultClass,
      fighterBlueId: `manual-blue-${Date.now()}`,
      fighterBlueName: "",
      fighterBlueClub: "",
      fighterRedId: `manual-red-${Date.now()}`,
      fighterRedName: "",
      fighterRedClub: "",
      status: "BELUM",
      winner: null
    });
  };

  // Save manual partai edits (or newly created manual partai)
  const handleSaveManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    const cleanBlueName = (editingMatch.fighterBlueName || "BYE").trim().toUpperCase();
    const cleanBlueClub = (editingMatch.fighterBlueClub || "-").trim().toUpperCase();
    const cleanRedName = (editingMatch.fighterRedName || "BYE").trim().toUpperCase();
    const cleanRedClub = (editingMatch.fighterRedClub || "-").trim().toUpperCase();
    const normAge = normalizeAgeCategory(editingMatch.ageCategory);
    const normClass = normalizeWeightClass(editingMatch.weightClass);
    const catClassId = getCanonicalCategoryClassId(normAge, normClass);
    const classCategory = `Tanding ${normAge} ${normClass} ${editingMatch.gender}`;

    // Also update participant name/contingent in participants list if linked to a registered athlete ID
    let updatedParticipants = [...participants];
    let participantsChanged = false;
    updatedParticipants = updatedParticipants.map(p => {
      if (p.id === editingMatch.fighterBlueId && cleanBlueName !== "BYE" && !cleanBlueName.startsWith("PEMENANG")) {
        participantsChanged = true;
        return {
          ...p,
          name: cleanBlueName,
          contingent: cleanBlueClub,
          club: cleanBlueClub
        };
      }
      if (p.id === editingMatch.fighterRedId && cleanRedName !== "BYE" && !cleanRedName.startsWith("PEMENANG")) {
        participantsChanged = true;
        return {
          ...p,
          name: cleanRedName,
          contingent: cleanRedClub,
          club: cleanRedClub
        };
      }
      return p;
    });

    if (participantsChanged) {
      setParticipants(updatedParticipants);
      try {
        localStorage.setItem("jrz_cached_participants", JSON.stringify(updatedParticipants));
      } catch {}
    }

    let updatedMatches: any[];
    if (editingMatch.isNew) {
      const newMatchObj = {
        id: editingMatch.id,
        matchNumber: String(editingMatch.matchNumber || "1").trim(),
        arena: String(editingMatch.arena || "GELANGGANG A").trim().toUpperCase(),
        stage: String(editingMatch.stage || "Penyisihan").trim(),
        competitionMethod: "PRESTASI",
        categoryClassId: catClassId,
        ageCategory: normAge,
        division: normAge.toUpperCase(),
        weightClass: normClass,
        classCategory,
        gender: editingMatch.gender,
        fighterBlueId: editingMatch.fighterBlueId || `manual-blue-${Date.now()}`,
        fighterBlueName: cleanBlueName,
        fighterBlueClub: cleanBlueClub,
        fighterRedId: editingMatch.fighterRedId || `manual-red-${Date.now()}`,
        fighterRedName: cleanRedName,
        fighterRedClub: cleanRedClub,
        scoreBlue: 0,
        scoreRed: 0,
        winner: editingMatch.winner || null,
        status: editingMatch.status || "BELUM",
        roundDuration: 120,
        totalRounds: 3,
        isManualModified: true,
        isManualCreated: true
      };
      updatedMatches = [...schedules, newMatchObj];
    } else {
      updatedMatches = schedules.map(m => {
        if (m.id === editingMatch.id) {
          return {
            ...m,
            matchNumber: String(editingMatch.matchNumber || m.matchNumber || "1").trim(),
            arena: String(editingMatch.arena || m.arena || "GELANGGANG A").trim().toUpperCase(),
            stage: String(editingMatch.stage || m.stage || "Penyisihan").trim(),
            categoryClassId: catClassId,
            ageCategory: normAge,
            division: normAge.toUpperCase(),
            weightClass: normClass,
            classCategory,
            gender: editingMatch.gender,
            fighterBlueId: editingMatch.fighterBlueId || m.fighterBlueId,
            fighterBlueName: cleanBlueName,
            fighterBlueClub: cleanBlueClub,
            fighterRedId: editingMatch.fighterRedId || m.fighterRedId,
            fighterRedName: cleanRedName,
            fighterRedClub: cleanRedClub,
            status: editingMatch.status || m.status || "BELUM",
            winner: editingMatch.winner ?? m.winner ?? null,
            isManualModified: true
          };
        }
        return m;
      });
    }

    setSchedules(updatedMatches);
    await saveManualSchedulesOverride(updatedMatches, updatedParticipants);
    sound.playClick();
    showNotification(
      editingMatch.isNew
        ? `✅ Partai #${editingMatch.matchNumber} berhasil ditambahkan secara manual!`
        : `✅ Perubahan manual pada Partai #${editingMatch.matchNumber} berhasil disimpan & disinkronkan!`
    );
    setEditingMatch(null);
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "No": 1,
        "Nama atlet": "ADI WIJAYA",
        "asal kontingen": "JAWA TENGAH",
        "kategori usia": "Remaja",
        "Disiplin": "TANDING",
        "Jenis kelamin": "PUTRA",
        "kelas (khusus tanding)": "Kelas A",
        "gelanggang": "GELANGGANG 1",
        "berat badan": 52
      },
      {
        "No": 2,
        "Nama atlet": "CITRA LESTARI",
        "asal kontingen": "DKI JAKARTA",
        "kategori usia": "Remaja",
        "Disiplin": "TANDING",
        "Jenis kelamin": "PUTRI",
        "kelas (khusus tanding)": "Kelas A",
        "gelanggang": "GELANGGANG 1",
        "berat badan": 48
      },
      {
        "No": 3,
        "Nama atlet": "BAMBANG PAMUNGKAS",
        "asal kontingen": "JAWA TIMUR",
        "kategori usia": "Dewasa",
        "Disiplin": "JURUS",
        "Jenis kelamin": "PUTRA",
        "kelas (khusus tanding)": "Tunggal",
        "gelanggang": "GELANGGANG 2",
        "berat badan": 60
      },
      {
        "No": 4,
        "Nama atlet": "SITI RAHMAWATI",
        "asal kontingen": "JAWA BARAT",
        "kategori usia": "Dewasa",
        "Disiplin": "JURUS",
        "Jenis kelamin": "PUTRI",
        "kelas (khusus tanding)": "Ganda",
        "gelanggang": "GELANGGANG 2",
        "berat badan": 55
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Atlet");
    XLSX.writeFile(wb, "Template_Import_Atlet_IPSI.xlsx");
  };

  // Unduh Data Atlet Terdaftar ke Format Excel (.xlsx)
  const handleExportAthletesExcel = () => {
    sound.playClick();
    if (!participants || participants.length === 0) {
      showNotification("⚠️ Belum ada data atlet yang terdaftar untuk diunduh!");
      sound.playBuzzer();
      return;
    }
    const exportData = participants.map((p, idx) => {
      const isSeni =
        (p as any).discipline === "SENI" ||
        (p as any).discipline === "JURUS" ||
        p.category === "SENI" ||
        p.category === "JURUS" ||
        /TUNGGAL|GANDA|REGU|SOLO/i.test(p.categoryClassId || p.weightClass || "");
      return {
        "No": idx + 1,
        "Nama atlet": p.name,
        "asal kontingen": p.club || p.contingent,
        "kategori usia": p.ageCategory || "Remaja",
        "Disiplin": isSeni ? "JURUS" : "TANDING",
        "Jenis kelamin": p.gender,
        "kelas (khusus tanding)": p.weightClass || p.categoryClassId || "-",
        "gelanggang": p.arena || (p as any).gelanggang || "GELANGGANG 1",
        "berat badan": p.weight || (p as any).weightActualKg || "-"
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Atlet Terdaftar");
    XLSX.writeFile(wb, `Data_Atlet_Terdaftar_${Date.now()}.xlsx`);
    showNotification(`📥 Berhasil mengunduh data ${participants.length} atlet ke format Excel!`);
  };

  // Import Excel File -> Otomatis Loting & Generate Bagan + Jadwal
  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          showNotification("⚠️ File Excel kosong atau tidak terbaca!");
          sound.playBuzzer();
          return;
        }

        const imported = rows.map((r, idx) => {
          const rawArena =
            r["gelanggang"] ||
            r["Gelanggang"] ||
            r["GELANGGANG"] ||
            r["Arena"] ||
            r["ARENA"] ||
            r["Ring"] ||
            r["Matras"] ||
            r["MAT"] ||
            r["arena"];
          let parsedArena = "GELANGGANG 1";
          if (rawArena) {
            const strArena = String(rawArena).trim().toUpperCase();
            parsedArena = strArena.startsWith("GELANGGANG") ? strArena : `GELANGGANG ${strArena}`;
          }

          const rawDiscipline =
            r["Disiplin"] ||
            r["DISIPLIN"] ||
            r["disiplin"] ||
            r["Disiplin (Tanding/Jurus)"] ||
            "";

          const rawClass =
            r["kelas (khusus tanding)"] ||
            r["KELAS (KHUSUS TANDING)"] ||
            r["Kelas (Khusus Tanding)"] ||
            r["Kelas"] ||
            r["Kelas Tanding"] ||
            "Kelas A";

          const isJurus =
            String(rawDiscipline).toUpperCase().includes("JURUS") ||
            String(rawDiscipline).toUpperCase().includes("SENI") ||
            /TUNGGAL|GANDA|REGU|SOLO/i.test(String(rawClass));

          const discipline = isJurus ? "SENI" : "TANDING";
          const category = isJurus ? "JURUS" : "TANDING";

          return normalizeAthleteRecord(
            {
              id: `atlet-imp-${Date.now()}-${idx}`,
              name: String(
                r["Nama atlet"] ||
                r["NAMA ATLET"] ||
                r["Nama Lengkap"] ||
                r["Nama"] ||
                r["nama"] ||
                `ATLET ${idx + 1}`
              ).trim().toUpperCase(),
              contingent: String(
                r["asal kontingen"] ||
                r["ASAL KONTINGEN"] ||
                r["Kontingen"] ||
                r["Klub"] ||
                r["kontingen"] ||
                "KONTINGEN"
              ).trim().toUpperCase(),
              ageCategory:
                r["kategori usia"] ||
                r["KATEGORI USIA"] ||
                r["Kategori Usia"] ||
                r["Kategori"] ||
                "Remaja",
              gender: String(
                r["Jenis kelamin"] ||
                r["JENIS KELAMIN"] ||
                r["Jenis Kelamin"] ||
                r["Gender"] ||
                "PUTRA"
              ).toUpperCase().includes("PUTRI") ? "PUTRI" : "PUTRA",
              weightClass: String(rawClass).trim(),
              discipline,
              category,
              weight: parseFloat(
                String(
                  r["berat badan"] ||
                  r["BERAT BADAN"] ||
                  r["Berat Badan"] ||
                  r["BB"] ||
                  "0"
                ).replace(/[^\d.-]/g, "")
              ) || 0,
              seed: idx + 1,
              arena: parsedArena,
              gelanggang: parsedArena
            },
            idx
          );
        });

        const updated = [...imported, ...participants];
        await saveParticipants(updated, {
          ageCategory: imported[0]?.ageCategory || "Remaja",
          weightClass: imported[0]?.weightClass || "Kelas A",
          gender: imported[0]?.gender || "PUTRA"
        });
        showNotification(`📥 Berhasil mengimpor ${imported.length} atlet dari Excel & otomatis membentuk Bagan + Jadwal!`);
      } catch (err) {
        console.error("Gagal parse excel:", err);
        showNotification("❌ Gagal membaca file Excel. Pastikan format kolom sesuai template!");
        sound.playBuzzer();
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className={hideBackHeader ? "w-full flex flex-col font-sans select-none relative" : "min-h-screen bg-[#060c1d] text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden"}>
      {/* Background ambient lighting */}
      {!hideBackHeader && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d204a_1px,transparent_1px),linear-gradient(to_bottom,#0d204a_1px,transparent_1px)] bg-[size:48px_48px] opacity-10 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-600/10 via-fuchsia-500/5 to-transparent blur-3xl pointer-events-none" />
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-none bg-slate-900 border border-purple-500 text-white text-xs font-bold shadow-2xl animate-in fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / SUB-MENU TABS INSIDE INPUT DATA PANEL SEKRETARIS */}
      <header className={`relative z-20 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-2.5 bg-[#0a1329]/95 backdrop-blur-md border-b border-purple-500/20 shadow-lg ${hideBackHeader ? "rounded-none mb-3" : ""}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {!hideBackHeader && (
            <button
              onClick={() => {
                sound.playClick();
                onBack();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">BERANDA</span>
            </button>
          )}

          {/* Standalone navigation when header is not hidden */}
          {!hideBackHeader && (
            <div className="flex items-center gap-1 bg-[#050a18] p-1 border border-purple-500/30">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveSubView("PENDATAAN");
                  onOpenInput?.();
                }}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSubView === "PENDATAAN"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Input Data Atlet ({participants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveSubView("LOTING");
                  onOpenLoting?.();
                }}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSubView === "LOTING"
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md"
                    : "text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/40"
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>2. Menu Loting & Edit Partai ({schedules.length} Partai)</span>
              </button>
            </div>
          )}
        </div>

        {/* Registered Athlete & Partai Stats Summary */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-300">
          <span>
            ATLET: <strong className="text-cyan-300">{participants.length}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            PARTAI TERBENTUK: <strong className="text-amber-400">{schedules.length}</strong>
          </span>
        </div>
      </header>

      {/* =====================================================================
          SUB-VIEW 1: INPUT & PENDATAAN ATLET
          ===================================================================== */}
      {activeSubView === "PENDATAAN" && (
        <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            {/* Top Form & Excel Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Form Input Atlet Baru - Standar PERSILAT & IPSI 2026 */}
              <div className="lg:col-span-1 rounded-none bg-[#091124]/90 border border-purple-500/40 p-4 sm:p-5 shadow-2xl relative">
                <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-purple-900/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="font-sans font-black text-xs sm:text-sm text-white uppercase tracking-wider leading-tight">
                        {isEditingAthlete ? "EDIT DATA ATLET" : "FORMULIR PENDAFTARAN ATLET"}
                      </h3>
                      <p className="text-[8px] font-mono text-cyan-300/80 uppercase">REGULASI PERSILAT & IPSI 2026</p>
                    </div>
                  </div>
                  <span className="text-[8.5px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    IPSI 2026
                  </span>
                </div>

                <form onSubmit={handleAddAthlete} className="space-y-3 text-xs">
                  {/* 1. Nama Lengkap Atlet */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                      Nama Lengkap Atlet / Pesilat: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: MUHAMMAD RIZKY FIRMANSYAH"
                      value={newAthlete.name}
                      onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-none bg-slate-900/90 border border-slate-700 text-slate-100 uppercase font-bold text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  {/* 2. Asal Kontingen / Perguruan / Daerah */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                      Asal Daerah / Kontingen / Perguruan: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: TAPAK SUCI BEKASI / JAWA BARAT"
                      value={newAthlete.contingent}
                      onChange={(e) => setNewAthlete({ ...newAthlete, contingent: e.target.value })}
                      className="w-full px-3 py-2 rounded-none bg-slate-900/90 border border-slate-700 text-slate-100 uppercase font-bold text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  {/* 3. Kategori Usia & Jenis Kelamin */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                        Kategori Usia:
                      </label>
                      <select
                        value={newAthlete.ageCategory}
                        onChange={(e) => {
                          const age = e.target.value;
                          const availableClasses = IPSI_WEIGHT_CLASSES_2026[age] || [];
                          const defaultClass = availableClasses[1]?.label || availableClasses[0]?.label || "Kelas A";
                          setNewAthlete({ ...newAthlete, ageCategory: age, weightClass: defaultClass });
                        }}
                        className="w-full px-2.5 py-2 rounded-none bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer text-xs"
                      >
                        <option value="Pra Usia Dini">Pra Usia Dini (≤ 5 tahun)</option>
                        <option value="Usia Dini 1">Usia Dini 1 (&gt; 5 s.d. 8 tahun)</option>
                        <option value="Usia Dini 2">Usia Dini 2 (&gt; 8 s.d. 11 tahun)</option>
                        <option value="Pra Remaja">Pra Remaja (&gt; 11 s.d. 14 tahun)</option>
                        <option value="Remaja">Remaja (&gt; 14 s.d. 17 tahun)</option>
                        <option value="Dewasa">Dewasa (&gt; 17 s.d. 35 tahun)</option>
                        <option value="Master 1">Master 1 (&gt; 35 s.d. 45 tahun)</option>
                        <option value="Master 2">Master 2 (≥ 45 tahun)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                        Jenis Kelamin:
                      </label>
                      <select
                        value={newAthlete.gender}
                        onChange={(e) => setNewAthlete({ ...newAthlete, gender: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-none bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer text-xs"
                      >
                        <option value="PUTRA">PUTRA</option>
                        <option value="PUTRI">PUTRI</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Kategori Pertandingan */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                      Kategori Pertandingan:
                    </label>
                    <select
                      value={newAthlete.category}
                      onChange={(e) => {
                        const selectedCat = e.target.value;
                        const isJurus = isJurusCategory(selectedCat);
                        setNewAthlete({
                          ...newAthlete,
                          category: selectedCat,
                          weightClass: isJurus ? selectedCat : (isJurusCategory(newAthlete.weightClass) ? "Kelas A" : newAthlete.weightClass),
                          weight: isJurus ? "" : newAthlete.weight
                        });
                      }}
                      className="w-full px-2.5 py-2 rounded-none bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer text-xs"
                    >
                      <option value="TANDING">TANDING (Pertarungan)</option>
                      <option value="TUNGGAL BAKU">JURUS TUNGGAL BAKU (Tunggal Baku)</option>
                      <option value="GANDA">JURUS GANDA (Ganda)</option>
                      <option value="REGU">JURUS REGU (Regu)</option>
                      <option value="TUNGGAL BEBAS">JURUS TUNGGAL BEBAS (Tunggal Bebas)</option>
                    </select>
                  </div>

                  {/* 5. Kelas Tanding & Berat Badan (HANYA DITAMPILKAN JIKA BUKAN KATEGORI JURUS) */}
                  {!isJurusCategory(newAthlete.category) && (
                    <div className="space-y-2 bg-[#0c183d]/60 p-2.5 border border-cyan-500/25 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                            Kelas Tanding Resmi:
                          </label>
                          <select
                            value={newAthlete.weightClass}
                            onChange={(e) => setNewAthlete({ ...newAthlete, weightClass: e.target.value })}
                            className="w-full px-2 py-2 rounded-none bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer text-[11px]"
                          >
                            {(IPSI_WEIGHT_CLASSES_2026[newAthlete.ageCategory] || []).map((cls) => (
                              <option key={cls.label} value={cls.label}>
                                {cls.label} ({cls.range})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                            Berat Timbang (Kg):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Contoh: 53.5"
                            value={newAthlete.weight}
                            onChange={(e) => setNewAthlete({ ...newAthlete, weight: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-none bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      {weightValidationStatus && (
                        <div className={`p-2 rounded text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                          weightValidationStatus.isValid
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                            : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                        }`}>
                          <Scale className="w-3.5 h-3.5 shrink-0" />
                          <span>{weightValidationStatus.message}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 6. Nomor Undian / Seed Loting */}
                    <div>
                      <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                        Nomor Undian / Seed Loting (Opsional):
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 1 atau 2 (Biarkan kosong jika belum diundi)"
                        value={newAthlete.seed}
                        onChange={(e) => setNewAthlete({ ...newAthlete, seed: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* 7. Gelanggang Pertandingan */}
                    <div>
                      <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                        Gelanggang Pertandingan:
                      </label>
                      <select
                        value={newAthlete.arena || "GELANGGANG A"}
                        onChange={(e) => setNewAthlete({ ...newAthlete, arena: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        <option value="GELANGGANG A">GELANGGANG A</option>
                        <option value="GELANGGANG B">GELANGGANG B</option>
                        <option value="GELANGGANG C">GELANGGANG C</option>
                        <option value="GELANGGANG D">GELANGGANG D</option>
                        <option value="GELANGGANG 1">GELANGGANG 1</option>
                        <option value="GELANGGANG 2">GELANGGANG 2</option>
                        <option value="GELANGGANG 3">GELANGGANG 3</option>
                        <option value="GELANGGANG 4">GELANGGANG 4</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1.5 flex gap-2">
                    {isEditingAthlete && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="py-2.5 px-3 rounded-none bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    )}

                    <button
                      type="submit"
                      className={`flex-1 py-2.5 px-4 rounded-none font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                        isEditingAthlete
                          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
                          : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isEditingAthlete ? "SIMPAN PERUBAHAN ATLET" : "DAFTARKAN ATLET (IPSI 2026)"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Excel Batch Management & Table */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="rounded-none bg-[#091124]/90 border border-slate-700/60 p-3 sm:p-4 flex flex-wrap items-center justify-end gap-2 shadow-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>IMPORT EXCEL</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleUploadExcel}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>TEMPLATE EXCEL</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportAthletesExcel}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                      title="Unduh Seluruh Data Atlet Terdaftar ke Format Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
                      <span>UNDUH EXCEL</span>
                    </button>

                    <button
                      type="button"
                      onClick={requestResetAll}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                      title="Kosongkan Semua Data Atlet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>KOSONGKAN</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="rounded-none bg-[#091124]/90 border border-slate-700/60 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="relative flex-grow min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama atlet atau kontingen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      value={filterAgeCategory}
                      onChange={(e) => setFilterAgeCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="ALL">Semua Usia</option>
                      <option value="Usia Dini">Usia Dini</option>
                      <option value="Pra Remaja">Pra Remaja</option>
                      <option value="Remaja">Remaja</option>
                      <option value="Dewasa">Dewasa</option>
                      <option value="Master">Master</option>
                    </select>

                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="px-2.5 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="ALL">Semua Gender</option>
                      <option value="PUTRA">Putra</option>
                      <option value="PUTRI">Putri</option>
                    </select>

                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="px-2.5 py-1.5 rounded-none bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="ALL">Semua Kelas / Kategori</option>
                      <optgroup label="Kelas Tanding">
                        {["Under", "Kelas A", "Kelas B", "Kelas C", "Kelas D", "Kelas E", "Kelas F", "Kelas G", "Kelas H", "Kelas I", "Kelas J", "Kelas Bebas"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Kategori Jurus (Seni)">
                        {["Tunggal Baku", "Ganda", "Regu", "Tunggal Bebas"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Table Daftar Atlet Terdaftar */}
                <div className="rounded-none bg-[#091124]/90 border border-slate-700/60 overflow-hidden shadow-xl flex-grow">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 text-slate-400 uppercase font-mono font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">NO</th>
                          <th className="py-2.5 px-4">NAMA ATLET</th>
                          <th className="py-2.5 px-4">KONTINGEN / KLUB</th>
                          <th className="py-2.5 px-3 text-center">USIA & GENDER</th>
                          <th className="py-2.5 px-3 text-center">DISIPLIN</th>
                          <th className="py-2.5 px-3 text-center">KELAS</th>
                          <th className="py-2.5 px-3 text-center">BERAT</th>
                          <th className="py-2.5 px-3 text-center">UNDIAN</th>
                          <th className="py-2.5 px-3 text-center w-20">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2.5">
                                <p className="text-slate-400">Belum ada data atlet yang terdaftar atau sesuai kriteria pencarian.</p>
                                {participants.length === 0 && (
                                  <button
                                    type="button"
                                    onClick={handleRestoreSampleAthletes}
                                    className="mt-1 px-3.5 py-1.5 rounded-none bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                                    <span>MUAT CONTOH DATA ATLET</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredParticipants.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-4 font-bold text-white uppercase">{p.name}</td>
                              <td className="py-2 px-4 text-slate-300 uppercase">{p.contingent || p.club || "-"}</td>
                              <td className="py-2 px-3 text-center text-[11px] font-bold text-slate-300">
                                {p.ageCategory || p.division} · <span className={p.gender === "PUTRA" ? "text-blue-400" : "text-pink-400"}>{p.gender}</span>
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-[10.5px] text-purple-300">
                                {p.category || "TANDING"}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-cyan-300">{p.weightClass || p.className}</td>
                              <td className="py-2 px-3 text-center font-mono text-slate-200 font-bold">{p.weight ? `${p.weight} Kg` : "-"}</td>
                              <td className="py-2 px-3 text-center font-mono font-black text-amber-400">
                                {p.seed ? `#${p.seed}` : "-"}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditAthlete(p)}
                                    className="p-1 rounded hover:bg-cyan-950/90 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                                    title="Edit Data Pesilat"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestDeleteAthlete(p.id, p.name, p.contingent)}
                                    className="p-1 rounded hover:bg-rose-950/90 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                                    title="Hapus Atlet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          SUB-VIEW 2: MENU LOTING & EDIT MANUAL DATA PARTAI
          Ketika atlet sudah terloting, pengguna tetap dapat mengubah secara
          manual data partai yang telah dibuat.
          ===================================================================== */}
      {activeSubView === "LOTING" && (
        <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col gap-5">
          {/* PANEL KONTROL LOTING & FILTER KELAS */}
          <div className="bg-[#091124]/95 border border-amber-500/40 p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunLotingShuffle("FILTERED")}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  title="Acak undian atlet sesuai filter kategori/kelas yang dipilih"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunLotingShuffle("ALL")}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  title="Loting ulang seluruh kelas tanding"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateManualMatchModal}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>TAMBAH PARTAI MANUAL</span>
                </button>
              </div>
            </div>

            {/* FILTER BAR UNTUK LOTING & PARTAI */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-grow min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor partai, nama pesilat, kontingen, atau babak..."
                  value={lotingSearchQuery}
                  onChange={(e) => setLotingSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={lotingAgeFilter}
                  onChange={(e) => setLotingAgeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="ALL">Semua Usia</option>
                  <option value="Usia Dini">Usia Dini</option>
                  <option value="Pra Remaja">Pra Remaja</option>
                  <option value="Remaja">Remaja</option>
                  <option value="Dewasa">Dewasa</option>
                  <option value="Master">Master</option>
                </select>

                <select
                  value={lotingGenderFilter}
                  onChange={(e) => setLotingGenderFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="ALL">Semua Gender</option>
                  <option value="PUTRA">PUTRA</option>
                  <option value="PUTRI">PUTRI</option>
                </select>

                <select
                  value={lotingClassFilter}
                  onChange={(e) => setLotingClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="ALL">Semua Kelas / Kategori</option>
                  <optgroup label="Kelas Tanding">
                    {["Under", "Kelas A", "Kelas B", "Kelas C", "Kelas D", "Kelas E", "Kelas F", "Kelas G", "Kelas H", "Kelas I", "Kelas J", "Kelas Bebas"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kategori Jurus (Seni)">
                    {["Tunggal Baku", "Ganda", "Regu", "Tunggal Bebas"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                </select>

                <select
                  value={lotingArenaFilter}
                  onChange={(e) => setLotingArenaFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="ALL">Semua Gelanggang</option>
                  <option value="GELANGGANG A">GELANGGANG A</option>
                  <option value="GELANGGANG B">GELANGGANG B</option>
                  <option value="GELANGGANG C">GELANGGANG C</option>
                  <option value="GELANGGANG D">GELANGGANG D</option>
                </select>
              </div>
            </div>
          </div>

          {/* DAFTAR PARTAI HASIL LOTING & BAGAN PERTEMUAN INTERAKTIF */}
          <div className="bg-[#091124]/95 border border-slate-700/70 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-[#0d1836] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  BAGAN PERTEMUAN & DAFTAR PARTAI (TARIK ATLET KE PARTAI UNTUK UBAH LAWAN)
                </h3>
              </div>

              {/* Mode Tampilan: Tabel vs Bagan Visual */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 p-0.5 border border-slate-700 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setLotingDisplayMode("TABLE");
                    }}
                    className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      lotingDisplayMode === "TABLE"
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Tabel Partai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setLotingDisplayMode("BAGAN");
                    }}
                    className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      lotingDisplayMode === "BAGAN"
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Bagan Kartu Interaktif</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                  {lotingFilteredSchedules.length} / {schedules.length} partai
                </span>
              </div>
            </div>

            {/* Indikator Tarik & Lepas */}
            {draggedAthlete && (
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-[#091124] border-b border-indigo-900/40 flex items-center justify-end text-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 text-[11px] font-black uppercase shadow animate-pulse">
                  <GripVertical className="w-3 h-3" />
                  <span>Sedang Menarik: {draggedAthlete.athleteName} &rarr; Lepas di sudut partai tujuan</span>
                </div>
              </div>
            )}

            {/* BAKI ATLET TERDAFTAR KELAS INI (Bila Mode Bagan Aktif) */}
            {lotingDisplayMode === "BAGAN" && lotingFilteredParticipants.length > 0 && (
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Baki Atlet Siap Tanding (Tarik Langsung ke Kartu Partai di Bawah)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lotingFilteredParticipants.length} atlet siap dipasangkan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 max-h-28 overflow-y-auto custom-scrollbar p-1">
                  {lotingFilteredParticipants.map((p) => (
                    <div
                      key={p.id}
                      draggable={true}
                      onDragStart={(e) => handleAthleteDragStart(e, {
                        sourceType: "POOL_ATHLETE",
                        athleteId: p.id,
                        athleteName: p.name,
                        athleteClub: p.contingent || p.club,
                        weightClass: p.weightClass,
                        ageCategory: p.ageCategory,
                        gender: p.gender
                      })}
                      onDragEnd={handleAthleteDragEnd}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all shadow-sm select-none"
                      title={`Tarik ${p.name} (${p.contingent || "-"}) ke sudut partai di bawah`}
                    >
                      <GripVertical className="w-3 h-3 text-amber-400/70" />
                      <span className="font-mono text-amber-400 text-[10px]">#{p.seed || 1}</span>
                      <span className="uppercase">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({p.contingent || "-"})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. TAMPILAN TABEL PARTAI (DENGAN DRAG & DROP SUDUT) */}
            {lotingDisplayMode === "TABLE" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/95 border-b border-slate-800 text-slate-400 uppercase font-mono font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-20 text-center">PARTAI</th>
                      <th className="py-2.5 px-3 w-36">GELANGGANG</th>
                      <th className="py-2.5 px-3">KELAS & BABAK</th>
                      <th className="py-2.5 px-3 bg-blue-950/30 text-blue-300 border-l border-slate-800">
                        SUDUT BIRU (TARIK / LEPAS)
                      </th>
                      <th className="py-2.5 px-2 w-12 text-center border-x border-slate-800">TUKAR</th>
                      <th className="py-2.5 px-3 bg-rose-950/30 text-rose-300 border-r border-slate-800">
                        SUDUT MERAH (TARIK / LEPAS)
                      </th>
                      <th className="py-2.5 px-3 text-center w-36">UBAH MANUAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {lotingFilteredSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          Belum ada data partai hasil loting pada filter ini. Klik tombol <strong>"Shuffle"</strong> atau <strong>"TAMBAH PARTAI MANUAL"</strong> di atas.
                        </td>
                      </tr>
                    ) : (
                      lotingFilteredSchedules.map((m) => {
                        const isHoveredBlue = hoveredDropZone?.matchId === m.id && hoveredDropZone?.corner === "blue";
                        const isHoveredRed = hoveredDropZone?.matchId === m.id && hoveredDropZone?.corner === "red";

                        return (
                          <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Nomor Partai */}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="text"
                                value={m.matchNumber || ""}
                                onChange={(e) => handleQuickUpdateMatchField(m.id, "matchNumber", e.target.value)}
                                className="w-14 text-center py-1 px-1.5 bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none font-mono font-black text-amber-400 text-xs"
                                title="Ketik untuk mengubah Nomor Partai secara manual"
                              />
                            </td>

                            {/* Gelanggang */}
                            <td className="py-2.5 px-3">
                              <select
                                value={String(m.arena || "GELANGGANG A").toUpperCase()}
                                onChange={(e) => handleQuickUpdateMatchField(m.id, "arena", e.target.value)}
                                className="w-full py-1 px-2 bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[11px] focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                <option value="GELANGGANG A">GELANGGANG A</option>
                                <option value="GELANGGANG B">GELANGGANG B</option>
                                <option value="GELANGGANG C">GELANGGANG C</option>
                                <option value="GELANGGANG D">GELANGGANG D</option>
                              </select>
                            </td>

                            {/* Kelas & Babak */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white uppercase">
                                {m.weightClass || m.classCategory || "Kelas A"} ·{" "}
                                <span className={m.gender === "PUTRI" ? "text-pink-400" : "text-cyan-400"}>
                                  {m.gender || "PUTRA"}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span>{m.ageCategory || m.division || "Remaja"}</span>
                                <span aria-hidden="true">·</span>
                                <select
                                  value={m.stage || "Penyisihan"}
                                  onChange={(e) => handleQuickUpdateMatchField(m.id, "stage", e.target.value)}
                                  className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-[10px] px-1 py-0.5 cursor-pointer focus:outline-none focus:border-amber-400 rounded-none"
                                  title="Ubah babak / tahap partai secara manual"
                                >
                                  <option value="Penyisihan">Penyisihan</option>
                                  <option value="Perempat Final">Perempat Final</option>
                                  <option value="Semi Final">Semi Final</option>
                                  <option value="Final">Final</option>
                                  <option value="Perebutan Juara 3">Perebutan Juara 3</option>
                                </select>
                                {m.isManualModified && (
                                  <span className="text-emerald-400 text-[9.5px] px-1 bg-emerald-950/60 border border-emerald-500/30">
                                    Diedit Manual
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* SUDUT BIRU (DRAGGABLE & DROPPABLE) */}
                            <td
                              onDragOver={(e) => handleAthleteDragOver(e, m.id, "blue")}
                              onDragLeave={(e) => handleAthleteDragLeave(e, m.id, "blue")}
                              onDrop={(e) => handleAthleteDrop(e, m.id, "blue")}
                              className={`py-2 px-3 border-l border-slate-800 transition-all ${
                                isHoveredBlue
                                  ? "bg-blue-600/40 ring-2 ring-inset ring-blue-400 shadow-inner"
                                  : "bg-blue-950/15"
                              }`}
                            >
                              {isHoveredBlue && (
                                <div className="py-0.5 px-2 mb-1.5 rounded bg-blue-500 text-white text-[10px] font-black uppercase text-center flex items-center justify-center gap-1 animate-pulse">
                                  <Move className="w-3 h-3" />
                                  <span>Lepaskan di Sudut Biru</span>
                                </div>
                              )}
                              <div
                                draggable={Boolean(m.fighterBlueName && m.fighterBlueName !== "BYE")}
                                onDragStart={(e) => handleAthleteDragStart(e, {
                                  sourceType: "MATCH_CORNER",
                                  athleteId: m.fighterBlueId,
                                  athleteName: m.fighterBlueName,
                                  athleteClub: m.fighterBlueClub,
                                  sourceMatchId: m.id,
                                  sourceCorner: "blue",
                                  sourceMatchNumber: String(m.matchNumber || "")
                                })}
                                onDragEnd={handleAthleteDragEnd}
                                className={`p-1.5 rounded border flex items-center justify-between gap-1.5 group/blue transition-all ${
                                  m.fighterBlueName && m.fighterBlueName !== "BYE"
                                    ? "cursor-grab active:cursor-grabbing bg-blue-950/40 hover:bg-blue-900/60 border-blue-800/60 hover:border-blue-400 shadow-sm"
                                    : "bg-slate-900/40 border-dashed border-slate-700 text-slate-500"
                                }`}
                                title={
                                  m.fighterBlueName && m.fighterBlueName !== "BYE"
                                    ? "Klik & tarik atlet ini ke partai lain untuk menukar bagan pertemuan"
                                    : "Sudut Biru kosong. Tarik atlet ke sini untuk mengisi"
                                }
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {m.fighterBlueName && m.fighterBlueName !== "BYE" && (
                                    <GripVertical className="w-3.5 h-3.5 text-blue-400/80 group-hover/blue:text-blue-300 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-black text-blue-300 group-hover/blue:text-white uppercase truncate text-xs">
                                      {m.fighterBlueName || "BYE"}
                                    </div>
                                    <div className="text-[10.5px] text-slate-400 uppercase truncate">
                                      {m.fighterBlueClub || "-"}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMatchModal(m)}
                                  className="p-1 text-blue-400/50 hover:text-white hover:bg-blue-800/50 rounded transition-colors shrink-0"
                                  title="Ubah nama manual"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Tombol Tukar Sudut 1-Klik */}
                            <td className="py-2.5 px-2 text-center border-x border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleSwapMatchCorners(m.id)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                                title="Tukar Posisi Atlet Sudut Biru ⇄ Sudut Merah"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* SUDUT MERAH (DRAGGABLE & DROPPABLE) */}
                            <td
                              onDragOver={(e) => handleAthleteDragOver(e, m.id, "red")}
                              onDragLeave={(e) => handleAthleteDragLeave(e, m.id, "red")}
                              onDrop={(e) => handleAthleteDrop(e, m.id, "red")}
                              className={`py-2 px-3 border-r border-slate-800 transition-all ${
                                isHoveredRed
                                  ? "bg-rose-600/40 ring-2 ring-inset ring-rose-400 shadow-inner"
                                  : "bg-rose-950/15"
                              }`}
                            >
                              {isHoveredRed && (
                                <div className="py-0.5 px-2 mb-1.5 rounded bg-rose-500 text-white text-[10px] font-black uppercase text-center flex items-center justify-center gap-1 animate-pulse">
                                  <Move className="w-3 h-3" />
                                  <span>Lepaskan di Sudut Merah</span>
                                </div>
                              )}
                              <div
                                draggable={Boolean(m.fighterRedName && m.fighterRedName !== "BYE")}
                                onDragStart={(e) => handleAthleteDragStart(e, {
                                  sourceType: "MATCH_CORNER",
                                  athleteId: m.fighterRedId,
                                  athleteName: m.fighterRedName,
                                  athleteClub: m.fighterRedClub,
                                  sourceMatchId: m.id,
                                  sourceCorner: "red",
                                  sourceMatchNumber: String(m.matchNumber || "")
                                })}
                                onDragEnd={handleAthleteDragEnd}
                                className={`p-1.5 rounded border flex items-center justify-between gap-1.5 group/red transition-all ${
                                  m.fighterRedName && m.fighterRedName !== "BYE"
                                    ? "cursor-grab active:cursor-grabbing bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 hover:border-rose-400 shadow-sm"
                                    : "bg-slate-900/40 border-dashed border-slate-700 text-slate-500"
                                }`}
                                title={
                                  m.fighterRedName && m.fighterRedName !== "BYE"
                                    ? "Klik & tarik atlet ini ke partai lain untuk menukar bagan pertemuan"
                                    : "Sudut Merah kosong. Tarik atlet ke sini untuk mengisi"
                                }
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {m.fighterRedName && m.fighterRedName !== "BYE" && (
                                    <GripVertical className="w-3.5 h-3.5 text-rose-400/80 group-hover/red:text-rose-300 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-black text-rose-300 group-hover/red:text-white uppercase truncate text-xs">
                                      {m.fighterRedName || "BYE"}
                                    </div>
                                    <div className="text-[10.5px] text-slate-400 uppercase truncate">
                                      {m.fighterRedClub || "-"}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMatchModal(m)}
                                  className="p-1 text-rose-400/50 hover:text-white hover:bg-rose-800/50 rounded transition-colors shrink-0"
                                  title="Ubah nama manual"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Aksi Edit Manual Partai */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMatchModal(m)}
                                  className="px-2.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer shadow-sm transition-all active:scale-95"
                                  title="Ubah Manual Data Partai Ini"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>EDIT PARTAI</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestDeleteMatch(m.id, String(m.matchNumber || ""))}
                                  className="p-1.5 bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-500/30 cursor-pointer transition-all"
                                  title="Hapus Partai"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. TAMPILAN BAGAN KARTU INTERAKTIF (VISUAL DRAG & DROP) */}
            {lotingDisplayMode === "BAGAN" && (
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lotingFilteredSchedules.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    Belum ada partai hasil loting pada kategori ini. Klik "LOTING / KOCOK UNDIAN" di atas.
                  </div>
                ) : (
                  lotingFilteredSchedules.map((m) => {
                    const isHoveredBlue = hoveredDropZone?.matchId === m.id && hoveredDropZone?.corner === "blue";
                    const isHoveredRed = hoveredDropZone?.matchId === m.id && hoveredDropZone?.corner === "red";

                    return (
                      <div
                        key={m.id}
                        className="bg-slate-950/90 border-2 border-slate-800 hover:border-slate-700 rounded-none shadow-xl flex flex-col overflow-hidden transition-all"
                      >
                        {/* Header Kartu Partai */}
                        <div className="px-3.5 py-2 bg-gradient-to-r from-slate-900 to-[#0e172e] border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-sm">
                              PARTAI {m.matchNumber || "-"}
                            </span>
                            <span className="text-[11px] font-bold text-slate-300 font-mono">
                              {m.arena || "GELANGGANG A"}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-amber-300 font-bold uppercase">
                            {m.stage || "Penyisihan"}
                          </div>
                        </div>

                        {/* Sub Header Kelas */}
                        <div className="px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[10.5px]">
                          <span className="font-bold text-cyan-300 uppercase">
                            {m.weightClass || m.classCategory || "Kelas A"} ({m.gender || "PUTRA"})
                          </span>
                          <span className="text-slate-400">
                            {m.ageCategory || m.division || "Remaja"}
                          </span>
                        </div>

                        {/* Pertemuan Kedua Atlet: Sudut Biru vs Sudut Merah */}
                        <div className="p-3 space-y-2">
                          {/* Slot Sudut Biru */}
                          <div
                            onDragOver={(e) => handleAthleteDragOver(e, m.id, "blue")}
                            onDragLeave={(e) => handleAthleteDragLeave(e, m.id, "blue")}
                            onDrop={(e) => handleAthleteDrop(e, m.id, "blue")}
                            className={`p-2.5 border-2 transition-all ${
                              isHoveredBlue
                                ? "bg-blue-600/40 border-blue-400 ring-2 ring-blue-400 scale-[1.02]"
                                : "bg-blue-950/30 border-blue-800/60 hover:border-blue-500"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                SUDUT BIRU {isHoveredBlue ? "(Lepaskan di Sini)" : ""}
                              </span>
                              <span className="text-[9.5px] text-blue-300/80 font-mono">TARIK & LEPAS</span>
                            </div>

                            <div
                              draggable={Boolean(m.fighterBlueName && m.fighterBlueName !== "BYE")}
                              onDragStart={(e) => handleAthleteDragStart(e, {
                                sourceType: "MATCH_CORNER",
                                athleteId: m.fighterBlueId,
                                athleteName: m.fighterBlueName,
                                athleteClub: m.fighterBlueClub,
                                sourceMatchId: m.id,
                                sourceCorner: "blue",
                                sourceMatchNumber: String(m.matchNumber || "")
                              })}
                              onDragEnd={handleAthleteDragEnd}
                              className={`p-2 rounded bg-blue-950/70 border border-blue-700/50 flex items-center justify-between gap-2 ${
                                m.fighterBlueName && m.fighterBlueName !== "BYE"
                                  ? "cursor-grab active:cursor-grabbing hover:bg-blue-900/60"
                                  : "border-dashed opacity-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {m.fighterBlueName && m.fighterBlueName !== "BYE" && (
                                  <GripVertical className="w-4 h-4 text-blue-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-white uppercase truncate">
                                    {m.fighterBlueName || "BYE (KOSONG)"}
                                  </div>
                                  <div className="text-[10px] text-blue-300 uppercase truncate">
                                    {m.fighterBlueClub || "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tengah: Divider VS + Tombol Tukar 1-Klik */}
                          <div className="flex items-center justify-center gap-2 py-0.5">
                            <div className="h-px bg-slate-800 flex-1"></div>
                            <button
                              type="button"
                              onClick={() => handleSwapMatchCorners(m.id)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-slate-300 text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 rounded"
                              title="Tukar Posisi Sudut Biru & Sudut Merah"
                            >
                              <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                              <img src="./vs.png" alt="VS" className="h-3.5 w-auto object-contain inline-block drop-shadow-sm select-none" draggable={false} />
                              <span>· TUKAR SUDUT</span>
                            </button>
                            <div className="h-px bg-slate-800 flex-1"></div>
                          </div>

                          {/* Slot Sudut Merah */}
                          <div
                            onDragOver={(e) => handleAthleteDragOver(e, m.id, "red")}
                            onDragLeave={(e) => handleAthleteDragLeave(e, m.id, "red")}
                            onDrop={(e) => handleAthleteDrop(e, m.id, "red")}
                            className={`p-2.5 border-2 transition-all ${
                              isHoveredRed
                                ? "bg-rose-600/40 border-rose-400 ring-2 ring-rose-400 scale-[1.02]"
                                : "bg-rose-950/30 border-rose-800/60 hover:border-rose-500"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                                SUDUT MERAH {isHoveredRed ? "(Lepaskan di Sini)" : ""}
                              </span>
                              <span className="text-[9.5px] text-rose-300/80 font-mono">TARIK & LEPAS</span>
                            </div>

                            <div
                              draggable={Boolean(m.fighterRedName && m.fighterRedName !== "BYE")}
                              onDragStart={(e) => handleAthleteDragStart(e, {
                                sourceType: "MATCH_CORNER",
                                athleteId: m.fighterRedId,
                                athleteName: m.fighterRedName,
                                athleteClub: m.fighterRedClub,
                                sourceMatchId: m.id,
                                sourceCorner: "red",
                                sourceMatchNumber: String(m.matchNumber || "")
                              })}
                              onDragEnd={handleAthleteDragEnd}
                              className={`p-2 rounded bg-rose-950/70 border border-rose-700/50 flex items-center justify-between gap-2 ${
                                m.fighterRedName && m.fighterRedName !== "BYE"
                                  ? "cursor-grab active:cursor-grabbing hover:bg-rose-900/60"
                                  : "border-dashed opacity-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {m.fighterRedName && m.fighterRedName !== "BYE" && (
                                  <GripVertical className="w-4 h-4 text-rose-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-white uppercase truncate">
                                    {m.fighterRedName || "BYE (KOSONG)"}
                                  </div>
                                  <div className="text-[10px] text-rose-300 uppercase truncate">
                                    {m.fighterRedClub || "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Kartu Partai */}
                        <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMatchModal(m)}
                            className="text-cyan-400 hover:text-white font-bold text-[11px] flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Detail Partai</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteMatch(m.id, String(m.matchNumber || ""))}
                            className="text-rose-400 hover:text-rose-300 text-[11px]"
                            title="Hapus Partai"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* TABEL URUTAN NOMOR UNDIAN (SEED) ATLET TERLOTING (DAPAT DITARIK KE PARTAI) */}
          <div className="bg-[#091124]/95 border border-slate-700/70 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-[#0d1836] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  DAFTAR URUTAN NOMOR UNDIAN (SEED) ATLET TERLOTING
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10.5px]">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">TARIK</th>
                    <th className="py-2 px-3 w-24 text-center">UNDIAN (#)</th>
                    <th className="py-2 px-4">NAMA ATLET</th>
                    <th className="py-2 px-4">KONTINGEN</th>
                    <th className="py-2 px-3 text-center">KATEGORI USIA</th>
                    <th className="py-2 px-3 text-center">GENDER</th>
                    <th className="py-2 px-3 text-center">KELAS TANDING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {lotingFilteredParticipants.map((p) => (
                    <tr
                      key={p.id}
                      draggable={true}
                      onDragStart={(e) => handleAthleteDragStart(e, {
                        sourceType: "POOL_ATHLETE",
                        athleteId: p.id,
                        athleteName: p.name,
                        athleteClub: p.contingent || p.club,
                        weightClass: p.weightClass,
                        ageCategory: p.ageCategory,
                        gender: p.gender
                      })}
                      onDragEnd={handleAthleteDragEnd}
                      className="hover:bg-slate-800/60 cursor-grab active:cursor-grabbing group transition-colors"
                      title={`Tarik ${p.name} ke sudut partai mana pun di atas`}
                    >
                      <td className="py-1.5 px-3 text-center">
                        <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 mx-auto" />
                      </td>
                      <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={1}
                          value={p.seed || 1}
                          onChange={(e) => handleManualSeedChange(p.id, parseInt(e.target.value, 10))}
                          className="w-16 text-center py-1 px-1.5 bg-slate-900 border border-slate-700 focus:border-purple-400 focus:outline-none font-mono font-black text-amber-400 text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-4 font-bold text-white uppercase flex items-center gap-1.5">
                        <span>{p.name}</span>
                      </td>
                      <td className="py-1.5 px-4 text-slate-300 uppercase">{p.contingent || p.club || "-"}</td>
                      <td className="py-1.5 px-3 text-center text-slate-300">{p.ageCategory || p.division}</td>
                      <td className="py-1.5 px-3 text-center font-bold">
                        <span className={p.gender === "PUTRI" ? "text-pink-400" : "text-blue-400"}>{p.gender}</span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-cyan-300">{p.weightClass || p.className}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          MODAL EDIT MANUAL DATA PARTAI (KETIKA ATLET SUDAH TERLOTING)
          ===================================================================== */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b152d] border border-cyan-500/50 w-full max-w-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                    {editingMatch.isNew
                      ? "TAMBAH PARTAI PERTANDINGAN MANUAL"
                      : `UBAH MANUAL DATA PARTAI #${editingMatch.matchNumber}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ubah bebas Nomor Partai, Gelanggang, Babak, serta Pesilat Sudut Biru & Sudut Merah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualMatch} className="flex flex-col gap-4 text-xs">
              {/* Row 1: Nomor Partai, Gelanggang, Babak/Tahap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                    Nomor Partai: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMatch.matchNumber}
                    onChange={(e) => setEditingMatch({ ...editingMatch, matchNumber: e.target.value })}
                    placeholder="Contoh: 1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-amber-400 font-mono font-black text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                    Gelanggang / Arena:
                  </label>
                  <select
                    value={editingMatch.arena}
                    onChange={(e) => setEditingMatch({ ...editingMatch, arena: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="GELANGGANG A">GELANGGANG A</option>
                    <option value="GELANGGANG B">GELANGGANG B</option>
                    <option value="GELANGGANG C">GELANGGANG C</option>
                    <option value="GELANGGANG D">GELANGGANG D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                    Babak / Tahap Partai:
                  </label>
                  <input
                    type="text"
                    value={editingMatch.stage}
                    onChange={(e) => setEditingMatch({ ...editingMatch, stage: e.target.value })}
                    placeholder="Penyisihan / Semi Final / Final"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Row 2: Kategori Usia, Jenis Kelamin, Kelas Tanding */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                    Kategori Usia:
                  </label>
                  <select
                    value={editingMatch.ageCategory}
                    onChange={(e) => setEditingMatch({ ...editingMatch, ageCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Usia Dini">Usia Dini</option>
                    <option value="Pra Remaja">Pra Remaja</option>
                    <option value="Remaja">Remaja</option>
                    <option value="Dewasa">Dewasa</option>
                    <option value="Master">Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={editingMatch.gender}
                    onChange={(e) => setEditingMatch({ ...editingMatch, gender: e.target.value as "PUTRA" | "PUTRI" })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="PUTRA">PUTRA</option>
                    <option value="PUTRI">PUTRI</option>
                  </select>
                </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10.5px] uppercase">
                      Kelas / Kategori:
                    </label>
                    <select
                      value={editingMatch.weightClass}
                      onChange={(e) => setEditingMatch({ ...editingMatch, weightClass: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <optgroup label="Kelas Tanding">
                        {["Under", "Kelas A", "Kelas B", "Kelas C", "Kelas D", "Kelas E", "Kelas F", "Kelas G", "Kelas H", "Kelas I", "Kelas J", "Kelas Bebas"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Kategori Jurus (Seni)">
                        {["Tunggal Baku", "Ganda", "Regu", "Tunggal Bebas"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
              </div>

              {/* SUDUT BIRU & TOMBOL TUKAR & SUDUT MERAH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* SUDUT BIRU */}
                <div className="bg-blue-950/20 border border-blue-500/40 p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-blue-500/30 pb-1.5">
                    <span className="font-black text-blue-400 uppercase tracking-wider text-xs">
                      SUDUT BIRU
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingMatch({
                          ...editingMatch,
                          fighterBlueId: "BYE",
                          fighterBlueName: "BYE",
                          fighterBlueClub: "-"
                        })
                      }
                      className="text-[10px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
                    >
                      Set BYE
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold text-[10px] uppercase">
                      Pilih Cepat dari Atlet Terdaftar (Opsional):
                    </label>
                    <select
                      value={participants.some(p => p.id === editingMatch.fighterBlueId) ? editingMatch.fighterBlueId : ""}
                      onChange={(e) => {
                        const chosen = participants.find(p => p.id === e.target.value);
                        if (chosen) {
                          setEditingMatch({
                            ...editingMatch,
                            fighterBlueId: chosen.id,
                            fighterBlueName: chosen.name,
                            fighterBlueClub: chosen.contingent || chosen.club || "-"
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-400 cursor-pointer"
                    >
                      <option value="">-- Pilih Atlet atau Ketik Manual di Bawah --</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.contingent || p.club}) - {p.ageCategory} {p.weightClass} {p.gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                      Nama Atlet Sudut Biru (Ketik Manual): *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMatch.fighterBlueName}
                      onChange={(e) => setEditingMatch({ ...editingMatch, fighterBlueName: e.target.value })}
                      placeholder="Nama Pesilat Sudut Biru"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white uppercase font-bold text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                      Kontingen Sudut Biru (Ketik Manual):
                    </label>
                    <input
                      type="text"
                      value={editingMatch.fighterBlueClub}
                      onChange={(e) => setEditingMatch({ ...editingMatch, fighterBlueClub: e.target.value })}
                      placeholder="Kontingen Sudut Biru"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 uppercase font-bold text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* SUDUT MERAH */}
                <div className="bg-rose-950/20 border border-rose-500/40 p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-rose-500/30 pb-1.5">
                    <span className="font-black text-rose-400 uppercase tracking-wider text-xs">
                      SUDUT MERAH
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingMatch({
                          ...editingMatch,
                          fighterRedId: "BYE",
                          fighterRedName: "BYE",
                          fighterRedClub: "-"
                        })
                      }
                      className="text-[10px] font-bold text-rose-300 hover:text-white underline cursor-pointer"
                    >
                      Set BYE
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold text-[10px] uppercase">
                      Pilih Cepat dari Atlet Terdaftar (Opsional):
                    </label>
                    <select
                      value={participants.some(p => p.id === editingMatch.fighterRedId) ? editingMatch.fighterRedId : ""}
                      onChange={(e) => {
                        const chosen = participants.find(p => p.id === e.target.value);
                        if (chosen) {
                          setEditingMatch({
                            ...editingMatch,
                            fighterRedId: chosen.id,
                            fighterRedName: chosen.name,
                            fighterRedClub: chosen.contingent || chosen.club || "-"
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
                    >
                      <option value="">-- Pilih Atlet atau Ketik Manual di Bawah --</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.contingent || p.club}) - {p.ageCategory} {p.weightClass} {p.gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                      Nama Atlet Sudut Merah (Ketik Manual): *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMatch.fighterRedName}
                      onChange={(e) => setEditingMatch({ ...editingMatch, fighterRedName: e.target.value })}
                      placeholder="Nama Pesilat Sudut Merah"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white uppercase font-bold text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold text-[10px] uppercase">
                      Kontingen Sudut Merah (Ketik Manual):
                    </label>
                    <input
                      type="text"
                      value={editingMatch.fighterRedClub}
                      onChange={(e) => setEditingMatch({ ...editingMatch, fighterRedClub: e.target.value })}
                      placeholder="Kontingen Sudut Merah"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 uppercase font-bold text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Swap Button inside Modal */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setEditingMatch({
                      ...editingMatch,
                      fighterBlueId: editingMatch.fighterRedId,
                      fighterBlueName: editingMatch.fighterRedName,
                      fighterBlueClub: editingMatch.fighterRedClub,
                      fighterRedId: editingMatch.fighterBlueId,
                      fighterRedName: editingMatch.fighterBlueName,
                      fighterRedClub: editingMatch.fighterBlueClub
                    });
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>TUKAR POSISI SUDUT BIRU ⇄ SUDUT MERAH</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>SIMPAN DATA PARTAI MANUAL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI IN-APP (DELETE & KOSONGKAN) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b152d] border-2 border-rose-600/70 rounded-none w-full max-w-md p-5 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.35)] flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-md">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-sans font-black uppercase text-white tracking-wider">
                {confirmModal.type === "DELETE_SINGLE" && "HAPUS DATA ATLET"}
                {confirmModal.type === "KOSONGKAN_ALL" && "KOSONGKAN SELURUH DATA ATLET"}
                {confirmModal.type === "DELETE_MATCH" && "HAPUS PARTAI PERTANDINGAN"}
              </h3>
              <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                {confirmModal.type === "DELETE_SINGLE" && (
                  <>
                    Apakah Anda yakin ingin menghapus data atlet <strong className="text-white font-bold">{confirmModal.athleteName}</strong>
                    {confirmModal.athleteContingent ? ` (${confirmModal.athleteContingent})` : ""}?
                  </>
                )}
                {confirmModal.type === "KOSONGKAN_ALL" && (
                  <>
                    PERINGATAN: Tindakan ini akan mengosongkan dan menghapus permanen seluruh <strong className="text-rose-400 font-bold">{participants.length} data atlet</strong> yang tersimpan. Apakah Anda yakin?
                  </>
                )}
                {confirmModal.type === "DELETE_MATCH" && (
                  <>
                    Apakah Anda yakin ingin menghapus <strong className="text-white font-bold">Partai #{confirmModal.matchNumber}</strong> dari daftar jadwal pertandingan?
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setConfirmModal(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-none font-sans font-bold text-xs uppercase cursor-pointer transition-all active:scale-95"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white py-2.5 rounded-none font-sans font-black text-xs uppercase shadow-[0_0_20px_rgba(244,63,94,0.5)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {confirmModal.type === "DELETE_SINGLE" && "YA, HAPUS"}
                  {confirmModal.type === "KOSONGKAN_ALL" && "YA, KOSONGKAN SEMUA"}
                  {confirmModal.type === "DELETE_MATCH" && "YA, HAPUS PARTAI"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
