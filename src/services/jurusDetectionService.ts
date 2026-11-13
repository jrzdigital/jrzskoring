/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CENTRAL JURUS DETECTION SERVICE
 * Layanan sistem pusat deteksi partai otomatis Pencak Silat IPSI 2026:
 * - Memantau status isJurusCategory secara reaktif di level sistem pusat.
 * - Secara otomatis mendeteksi apakah partai aktif merupakan Kategori Jurus (TGRS) atau Tanding (Laga).
 * - Menghilangkan kebutuhan admin untuk berpindah panel / layout secara manual.
 * - Menyinkronkan identitas pesilat, kontingen, sub-kategori, partai, dan gelanggang ke state Jurus TGRS.
 */

import { 
  isJurusCategory, 
  detectMatchCategory, 
  getTgrsSubCategory, 
  CategoryDetectionResult,
  TgrsSubCategory 
} from "../utils/categoryHelper";
import { 
  TgrsMatchState, 
  loadTgrsLiveState, 
  saveTgrsLiveState, 
  createDefaultPerformerState 
} from "../utils/tgrsScoringEngine";

export type JurusCategoryListener = (isJurus: boolean, matchCategoryInfo: CategoryDetectionResult, match: any) => void;

class JurusDetectionService {
  private listeners: Set<JurusCategoryListener> = new Set();
  private lastMatchId: string = "";
  private lastIsJurus: boolean = false;
  private lastMatchSig: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      // Dengarkan event aktivasi partai dari seluruh tab / panel (HANYA aktivasi & storage partai baru, BUKAN tap skor juri)
      window.addEventListener("jrz_activate_match", this.handleExternalMatchEvent);
      window.addEventListener("force_match_sync", this.handleExternalMatchEvent);
      window.addEventListener("storage", this.handleStorageEvent);
    }
  }

  private handleExternalMatchEvent = (event: Event) => {
    const customEvt = event as CustomEvent;
    if (customEvt && customEvt.detail) {
      this.evaluateAndSyncMatch(customEvt.detail);
    }
  };

  private handleStorageEvent = (event: StorageEvent) => {
    if ((event.key === "ipsi_match_state" || event.key === "jrz_silat_match_state") && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && (parsed.id || parsed.matchNumber)) {
          this.evaluateAndSyncMatch(parsed);
        }
      } catch {}
    }
  };

  /**
   * Cek apakah data partai aktif saat ini adalah Kategori Jurus (TGRS)
   */
  public isJurusMatch(match: any): boolean {
    return isJurusCategory(match);
  }

  /**
   * Evaluasi data partai secara mendalam dan sinkronkan state TGRS jika termasuk kategori Jurus
   */
  public evaluateAndSyncMatch(match: any): { isJurus: boolean; categoryInfo: CategoryDetectionResult } {
    if (!match) {
      return {
        isJurus: false,
        categoryInfo: detectMatchCategory(null)
      };
    }

    const categoryInfo = detectMatchCategory(match);
    const isJurus = categoryInfo.isJurusCategory || categoryInfo.isTgr;
    const matchId = match.id || match.matchNumber || "";
    const blueName = match.fighterBlueName || match.athleteBlue?.name || "";
    const redName = match.fighterRedName || match.athleteRed?.name || "";
    const classCat = match.classCategory || match.kategori || match.category || "";
    const subCat = categoryInfo.tgrSubCategory || "";
    const matchSig = `${matchId}_${match.matchNumber || ""}_${classCat}_${blueName}_${redName}_${subCat}_${isJurus}`;

    // Lewati jika evaluasi partai identik sudah pernah dilakukan
    if (matchSig === this.lastMatchSig) {
      return { isJurus, categoryInfo };
    }
    this.lastMatchSig = matchSig;

    // Sinkronkan ke TGRS Live State jika terdeteksi kategori Jurus
    if (isJurus) {
      try {
        const currentTgrs = loadTgrsLiveState();
        const nextSub: TgrsSubCategory = categoryInfo.tgrSubCategory || getTgrsSubCategory(match) || currentTgrs.category || "TUNGGAL";
        const cleanPartai = match.matchNumber
          ? String(match.matchNumber).replace(/[^0-9]/g, "") || currentTgrs.partai
          : currentTgrs.partai;
        
        const bName = blueName || currentTgrs.bluePerformer?.athleteName || "SUDUT BIRU";
        const blueClub = match.fighterBlueClub || match.athleteBlue?.contingent || currentTgrs.bluePerformer?.contingent || "KONTINGEN BIRU";
        const rName = redName || currentTgrs.redPerformer?.athleteName || "SUDUT MERAH";
        const redClub = match.fighterRedClub || match.athleteRed?.contingent || currentTgrs.redPerformer?.contingent || "KONTINGEN MERAH";

        const currentActive = currentTgrs.activeCorner || "BLUE";
        const activeName = currentActive === "BLUE" ? bName : rName;
        const activeClub = currentActive === "BLUE" ? blueClub : redClub;

        const isSubCatChanged = currentTgrs.category !== nextSub;
        const bluePerf = (isSubCatChanged || !currentTgrs.bluePerformer)
          ? createDefaultPerformerState("BLUE", nextSub, bName, blueClub)
          : { ...currentTgrs.bluePerformer, athleteName: bName, contingent: blueClub };
        const redPerf = (isSubCatChanged || !currentTgrs.redPerformer)
          ? createDefaultPerformerState("RED", nextSub, rName, redClub)
          : { ...currentTgrs.redPerformer, athleteName: rName, contingent: redClub };

        const updatedTgrs: TgrsMatchState = {
          ...currentTgrs,
          category: nextSub,
          categoryLabel: categoryInfo.categoryLabel,
          partai: cleanPartai,
          gelanggang: (match.arena ? String(match.arena).replace(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase() : currentTgrs.gelanggang) || "A",
          activeCorner: currentActive,
          bluePerformer: bluePerf,
          redPerformer: redPerf,
          athleteName: activeName,
          contingent: activeClub,
          gender: (match.gender as any) || currentTgrs.gender,
          ageCategory: match.division || match.ageCategory || currentTgrs.ageCategory,
          stage: match.stage || currentTgrs.stage,
          judgesCount: match.judgesCount || currentTgrs.judgesCount || 10
        };

        saveTgrsLiveState(updatedTgrs);
      } catch (err) {
        console.warn("Gagal sinkronisasi data TGRS di jurusDetectionService:", err);
      }
    }

    // Beritahukan listener setiap kali partai dievaluasi atau status kategori berubah
    this.lastMatchId = matchId;
    this.lastIsJurus = isJurus;
    this.notifyListeners(isJurus, categoryInfo, match);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jrz_jurus_category_detected", {
        detail: {
          isJurus,
          categoryInfo,
          match
        }
      }));
    }

    return { isJurus, categoryInfo };
  }

  /**
   * Langganan notifikasi deteksi kategori
   */
  public subscribe(listener: JurusCategoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(isJurus: boolean, categoryInfo: CategoryDetectionResult, match: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(isJurus, categoryInfo, match);
      } catch (err) {
        console.error("Error pada listener jurusDetectionService:", err);
      }
    });
  }
}

export const jurusDetectionService = new JurusDetectionService();
