/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { MatchSimHub } from "./components/MatchSimHub";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { authService, DEFAULT_USERS } from "./services/authService";
import {
  subscribeToConnectionStatus,
  subscribeToPendingSync,
  flushPendingCloudSync,
  PendingSyncSummary
} from "./services/firebase";
import { UserAccount } from "./types";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload, X } from "lucide-react";

import { MobileViewportScaler } from "./components/MobileViewportScaler";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return authService.getCurrentUser() || DEFAULT_USERS[0];
  });

  const [browserOnline, setBrowserOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine !== false : true
  );
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [hasCheckedFirebase, setHasCheckedFirebase] = useState<boolean>(false);
  const [syncSummary, setSyncSummary] = useState<PendingSyncSummary>({
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: 0,
    connected: true
  });
  const [justSyncedCount, setJustSyncedCount] = useState<number>(0);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const [themeMode, setThemeMode] = React.useState<"LED_ARENA" | "LIGHT_CONTRAST">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jrz_theme_mode");
      if (saved === "LIGHT_CONTRAST") return "LIGHT_CONTRAST";
    }
    return "LED_ARENA";
  });

  useEffect(() => {
    const handleAuthChange = () => {
      const u = authService.getCurrentUser() || DEFAULT_USERS[0];
      setCurrentUser(u);
    };
    window.addEventListener("ipsi_auth_user_changed", handleAuthChange);
    return () => window.removeEventListener("ipsi_auth_user_changed", handleAuthChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => {
      setBrowserOnline(false);
      setBannerDismissed(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const unsubFb = subscribeToConnectionStatus((connected) => {
      setFirebaseConnected(connected);
      setHasCheckedFirebase(true);
      if (!connected) {
        setBannerDismissed(false);
      }
    });

    const unsubPending = subscribeToPendingSync((summary) => {
      setSyncSummary(summary);
    });

    let syncedClearTimer: ReturnType<typeof setTimeout> | null = null;
    const handleSyncedEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const flushed = Number(detail?.flushed) || 0;
      if (flushed > 0) {
        setJustSyncedCount(flushed);
        if (syncedClearTimer) clearTimeout(syncedClearTimer);
        syncedClearTimer = setTimeout(() => setJustSyncedCount(0), 5000);
      }
    };
    window.addEventListener("jrz_firebase_synced", handleSyncedEvent);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("jrz_firebase_synced", handleSyncedEvent);
      if (syncedClearTimer) clearTimeout(syncedClearTimer);
      unsubFb();
      unsubPending();
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const saved = localStorage.getItem("jrz_theme_mode");
      setThemeMode(saved === "LIGHT_CONTRAST" ? "LIGHT_CONTRAST" : "LED_ARENA");
    };
    window.addEventListener("jrz_theme_changed", handleThemeChange);
    return () => window.removeEventListener("jrz_theme_changed", handleThemeChange);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (themeMode === "LIGHT_CONTRAST") {
        document.documentElement.classList.remove("dark", "theme-dark");
        document.documentElement.classList.add("light", "theme-light");
        document.documentElement.setAttribute("data-theme", "light");
        document.body.style.backgroundColor = "#ffffff";
        document.body.style.color = "#0f172a";
      } else {
        document.documentElement.classList.remove("light", "theme-light");
        document.documentElement.classList.add("dark", "theme-dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.style.backgroundColor = "#070d1e";
        document.body.style.color = "#f8fafc";
      }
    }
  }, [themeMode]);

  const isDisconnected = !browserOnline || (hasCheckedFirebase && !firebaseConnected);
  const showSyncingBanner = !isDisconnected && (syncSummary.isSyncing || syncSummary.pendingCount > 0);
  const showDisconnectedBanner = isDisconnected && !bannerDismissed;
  const showRecoveredBanner = !isDisconnected && !showSyncingBanner && justSyncedCount > 0;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
        themeMode === "LIGHT_CONTRAST"
          ? "bg-white text-slate-900 theme-light"
          : "bg-[#070d1e] text-slate-100 theme-dark"
      }`}
    >
      {showDisconnectedBanner && (
        <div className="sticky top-0 z-[9990] w-full bg-amber-950/95 border-b border-amber-500/60 backdrop-blur-md px-4 py-2 text-amber-100 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <span className="font-bold text-amber-200">
                  Koneksi Internet / Firebase Terputus
                </span>
                <span className="hidden sm:inline text-amber-100/80 ml-1.5">
                  — Aplikasi tetap berjalan normal. Seluruh data &amp; skor disimpan aman di perangkat dan otomatis disinkronkan ke Firebase RTDB saat koneksi stabil.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {syncSummary.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 font-mono font-bold text-[11px] text-amber-200">
                  Antrean Sync: {syncSummary.pendingCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => flushPendingCloudSync().catch(() => {})}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Sinkronkan</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Tutup pemberitahuan koneksi"
                className="p-1 rounded hover:bg-amber-800/60 text-amber-200/80 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showSyncingBanner && (
        <div className="sticky top-0 z-[9990] w-full bg-cyan-950/95 border-b border-cyan-500/50 backdrop-blur-md px-4 py-2 text-cyan-100 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-cyan-300 animate-bounce" />
              <span className="font-bold">
                Koneksi Pulih — Menyinkronkan {syncSummary.pendingCount} perubahan tertunda ke Firebase Realtime Database (jrz-score)...
              </span>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
          </div>
        </div>
      )}

      {showRecoveredBanner && (
        <div className="sticky top-0 z-[9990] w-full bg-emerald-950/95 border-b border-emerald-500/50 backdrop-blur-md px-4 py-2 text-emerald-100 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">
                Koneksi Stabil — {justSyncedCount} data pertandingan telah tersinkron &amp; tersimpan real-time di Firebase RTDB.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setJustSyncedCount(0)}
              aria-label="Tutup pemberitahuan sinkronisasi"
              className="p-1 rounded hover:bg-emerald-800/60 text-emerald-200/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col w-full">
        <ErrorBoundary>
          <MobileViewportScaler>
            <MatchSimHub />
          </MobileViewportScaler>
        </ErrorBoundary>
      </main>
    </div>
  );
}
