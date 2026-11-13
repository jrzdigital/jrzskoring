/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { MatchSimHub } from "./components/MatchSimHub";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { authService, DEFAULT_USERS } from "./services/authService";
import { subscribeToConnectionStatus } from "./services/firebase";
import { UserAccount } from "./types";
import { WifiOff, RefreshCw, Database } from "lucide-react";

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
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const unsubFb = subscribeToConnectionStatus((connected) => {
      setFirebaseConnected(connected);
      setHasCheckedFirebase(true);
    });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsubFb();
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

  const isOfflineBlocked = !browserOnline || (hasCheckedFirebase && !firebaseConnected);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
        themeMode === "LIGHT_CONTRAST"
          ? "bg-white text-slate-900 theme-light"
          : "bg-[#070d1e] text-slate-100 theme-dark"
      }`}
    >
      {isOfflineBlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#091229] border-2 border-rose-500/80 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
              <WifiOff className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                <Database className="w-3 h-3" /> MODE ONLINE FIREBASE SAJA
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Koneksi Internet &amp; Firebase Diperlukan
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi JRZ SCORE tidak mendukung mode offline. Pastikan perangkat terhubung ke internet agar dapat berkomunikasi dengan <strong>Firebase Realtime Database (jrz-score)</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Hubungkan Ulang ke Firebase</span>
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
