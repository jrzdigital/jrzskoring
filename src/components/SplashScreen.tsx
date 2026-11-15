/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * INITIAL SPLASH SCREEN COMPONENT
 * Tampilan Awal Sebelum Masuk ke Landing Page Aplikasi:
 * - Menampilkan Logo "JRZ SCORE" secara proporsional dan dinamis
 * - Tulisan warna kuning "PLAY" dengan tanda panah di sebelah kanan mengarah ke kanan
 * - Menggunakan aset gambar tanda panah arah kanan dari pengguna
 * - Efek denyut aura (*pulsing aura*) saat kursor didekatkan ke tulisan PLAY & panah
 * - Transisi layar penuh (*full-screen smooth transition*) menuju Landing Page saat ditekan
 */

import React, { useState, useEffect, useCallback } from "react";
import { soundEffects } from "../utils/audio";

interface SplashScreenProps {
  onEnter: () => void;
  themeMode?: "LED_ARENA" | "LIGHT_CONTRAST";
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnter,
  themeMode = "LED_ARENA"
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleStart = useCallback(() => {
    if (isExiting) return;

    // 1. Audio cue
    try {
      soundEffects.playChime();
    } catch {
      try {
        soundEffects.playClick();
      } catch {}
    }

    // 2. Full-screen request upon user gesture interaction
    if (typeof document !== "undefined" && document.documentElement) {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Gracefully continue if user/browser blocks fullscreen
        });
      }
    }

    // 3. Smooth exit transition to landing page
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 500);
  }, [isExiting, onEnter]);

  // Keyboard shortcut: Space or Enter to enter landing page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStart]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-[100dvh] overflow-hidden select-none transition-all duration-500 ease-in-out ${
        isExiting ? "opacity-0 scale-105 blur-sm pointer-events-none" : "opacity-100 scale-100 blur-0"
      }`}
      style={{
        background:
          themeMode === "LIGHT_CONTRAST"
            ? "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)"
            : "radial-gradient(ellipse at 50% 35%, #0d1e52 0%, #050a1d 55%, #02040b 100%)",
      }}
    >
      {/* BACKGROUND WATERMARK WITH VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <img
          src="./IMG_4754.JPG.jpeg"
          alt="Watermark Latar Belakang"
          loading="eager"
          className={`w-full h-full object-cover object-center transition-opacity duration-500 ${
            themeMode === "LIGHT_CONTRAST"
              ? "opacity-[0.05] brightness-105"
              : "opacity-20 sm:opacity-25 brightness-90 contrast-125"
          }`}
        />
        {/* Ambient Ring / Circular Arena Glow Behind Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[520px] md:w-[700px] h-[320px] sm:h-[520px] md:h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-yellow-500/15 to-rose-500/10 blur-3xl pointer-events-none animate-pulse duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* CENTER HERO: JRZ SCORE LOGO & PLAY BUTTON */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 w-full max-w-4xl my-auto">
        
        {/* LOGO JRZ SCORE (PROPORSIONAL & DINAMIS) */}
        <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 md:mb-10 group">
          <div className="relative">
            {/* Ambient Logo Golden Aura Glow */}
            <div className="absolute inset-0 rounded-full bg-yellow-400/25 blur-3xl transform scale-90 sm:scale-105 group-hover:scale-115 transition-transform duration-700 pointer-events-none" />
            
            <img
              src="./jrzscoreutama.png"
              alt="JRZ SCORE Logo"
              loading="eager"
              decoding="async"
              className="relative z-10 w-48 sm:w-64 md:w-80 lg:w-96 max-h-[38vh] h-auto object-contain drop-shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-500 transform group-hover:scale-105"
            />
          </div>
        </div>

        {/* TULISAN WARNA KUNING "PLAY" DENGAN TANDA PANAH DI KANAN MENGARAH KE KANAN & EFEK DENYUT AURA */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleStart}
            id="splash-play-btn"
            aria-label="Mulai Masuk ke Aplikasi JRZ Score"
            className="relative group p-4 sm:p-6 transition-all duration-300 active:scale-95 cursor-pointer flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-5 focus:outline-none bg-transparent border-none"
          >
            {/* Pulsing golden aura glow behind PLAY button - intensifies on hover */}
            <div className="absolute inset-0 rounded-full bg-yellow-400/0 group-hover:bg-yellow-400/30 blur-2xl group-hover:blur-3xl transition-all duration-500 scale-75 group-hover:scale-125 -z-10 group-hover:animate-pulse pointer-events-none" />

            {/* Tulisan Kuning "PLAY" dengan efek denyut aura saat kursor didekatkan */}
            <div className="relative flex items-center justify-center">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-[0.2em] text-yellow-400 group-hover:text-yellow-300 uppercase transition-all duration-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] group-hover:drop-shadow-[0_0_40px_rgba(250,204,21,1)] group-hover:scale-105">
                PLAY
              </span>
            </div>

            {/* Gambar Tanda Panah di Kanan Mengarah ke Kanan (Tanpa Kotak Hitam / 100% Transparan) */}
            <div className="relative flex items-center justify-center">
              <img
                src="./assets/aistudio/arrow_right_transparent.png"
                alt="Tanda Panah Kanan"
                className="h-7 sm:h-9 md:h-11 w-auto object-contain transition-all duration-300 group-hover:translate-x-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.7)] group-hover:drop-shadow-[0_0_35px_rgba(250,204,21,1)]"
              />
            </div>
          </button>
        </div>

        {/* TULISAN BERGERAK KANAN KE KIRI (RUNNING TEXT TICKER) DI BAWAH MENU PLAY */}
        <div 
          className="w-full max-w-4xl mx-auto mt-6 sm:mt-8 md:mt-12 overflow-hidden border border-yellow-500/40 relative shadow-[0_0_25px_rgba(234,179,8,0.25)] bg-black/70 backdrop-blur-md transition-all select-none"
          id="splash-running-text-ticker"
        >
          {/* Fade gradient di tepi kiri & kanan untuk transisi visual halus */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-14 z-10 bg-gradient-to-r from-black/95 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-14 z-10 bg-gradient-to-l from-black/95 to-transparent pointer-events-none" />

          <div className="py-2.5 sm:py-3 px-3 flex items-center overflow-hidden">
            <div className="animate-marquee-flow flex items-center gap-8 sm:gap-12 whitespace-nowrap text-xs sm:text-sm md:text-[14.5px] font-bold font-sans tracking-wide text-yellow-300">
              {[1, 2, 3, 4].map((idx) => (
                <span key={idx} className="flex items-center gap-3">
                  <span className="text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.75)] flex items-center gap-1.5">
                    <span>Selamat datang di aplikasi jrz score dan selamat bertanding | informasi aplikasi hubungi</span>
                    <a 
                      href="https://wa.me/6281379876424" 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-yellow-200 hover:text-white underline decoration-yellow-400 decoration-1 underline-offset-2 transition-colors cursor-pointer"
                      title="Hubungi via WhatsApp (0813 7987 6424)"
                    >
                      Whatsapp 0813 7987 6424
                    </a>
                  </span>
                  <span className="text-yellow-500/70 font-black px-1">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SplashScreen;
