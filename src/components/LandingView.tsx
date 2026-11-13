import React, { useState, useEffect } from "react";
import discorsLogo from "../assets/images/discors_logo_1783846121716.jpg";
import sekretarisBadge from "../assets/images/sekretaris_badge_1783846136554.jpg";
import dewanBadge from "../assets/images/dewan_badge_1783846149263.jpg";
import juriBadge from "../assets/images/juri_badge_1783846164584.jpg";
import monitorBadge from "../assets/images/monitor_badge_1783846180604.jpg";
import { Sparkles, HelpCircle, Maximize2, Minimize2 } from "lucide-react";

interface LandingViewProps {
  onSelectRole: (role: "sekretaris" | "dewan" | "juri" | "monitor") => void;
}

export default function LandingView({ onSelectRole }: LandingViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Gagal masuk mode layar penuh:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Gagal keluar mode layar penuh:", err);
        });
      }
    }
  };

  const roles = [
    {
      id: "sekretaris" as const,
      name: "SEKRETARIS",
      image: sekretarisBadge,
      color: "from-amber-500/20 to-orange-600/10 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]",
      textColor: "text-amber-400"
    },
    {
      id: "dewan" as const,
      name: "DEWAN",
      image: dewanBadge,
      color: "from-yellow-600/20 to-amber-700/10 hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]",
      textColor: "text-yellow-400"
    },
    {
      id: "juri" as const,
      name: "JURI",
      image: juriBadge,
      color: "from-blue-500/20 to-cyan-600/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]",
      textColor: "text-cyan-400"
    },
    {
      id: "monitor" as const,
      name: "MONITOR",
      image: monitorBadge,
      color: "from-purple-500/20 to-indigo-600/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]",
      textColor: "text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-slate-950 to-[#030308] text-slate-100 flex flex-col justify-between p-4 md:p-8 relative selection:bg-purple-600/50 select-none">
      
      {/* Floating Top-Right Full Screen Controls */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-[#0d0d26]/80 backdrop-blur-md border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/40 text-purple-400 hover:text-purple-300 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-purple-950/50 hover:scale-105 active:scale-95 uppercase tracking-wider"
          id="btn-fullscreen-landing"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-purple-400" />
              Layar Normal
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-purple-400 animate-pulse" />
              Layar Penuh
            </>
          )}
        </button>
      </div>

      {/* 1. Header / Brand Title Block */}
      <div className="flex flex-col items-center text-center mt-6 md:mt-10 space-y-4">
        {/* DISCORS Logo */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 transition-transform duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-purple-600/20 blur-2xl rounded-full"></div>
          <img
            src={discorsLogo}
            alt="DISCORS Logo"
            className="w-full h-full object-contain rounded-full border border-purple-500/20 bg-black/40 p-2 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Master Heading */}
        <div className="space-y-1 md:space-y-2 max-w-4xl px-4">
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-wider text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] uppercase">
            PENCAK SILAT
          </h1>
          <h2 className="text-sm md:text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 uppercase">
            PLATFORM DIGITAL SKORING PENCAK SILAT KATEGORI JURUS
          </h2>
          <p className="text-xxs md:text-xs font-mono font-medium text-gray-500 uppercase tracking-widest">
            DENGAN SINKRONISASI INSTAN MULTI LAYAR SECARA ONLINE MAUPUN OFFLINE
          </p>
        </div>
      </div>

      {/* 2. Responsive Role Navigation Grid */}
      <div className="max-w-6xl w-full mx-auto my-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className={`group relative bg-[#0a0a1a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 bg-gradient-to-b ${role.color}`}
          >
            {/* Top Card Ring Glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Badge Image */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-black/40 border border-white/5 p-2 flex items-center justify-center">
              <img
                src={role.image}
                alt={`${role.name} Badge`}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Label Button Area */}
            <div className="w-full text-center">
              <span className={`block font-mono font-black tracking-widest text-sm md:text-base border-t border-white/10 pt-3 group-hover:text-white transition-colors uppercase ${role.textColor}`}>
                {role.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom Information Panel (Tips Setup) */}
      <div className="max-w-4xl w-full mx-auto px-4 mb-6">
        <div className="bg-[#0b0b1a]/80 backdrop-blur-md p-5 rounded-2xl border border-purple-500/20 shadow-lg text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-purple-400 tracking-wider uppercase font-mono">
            <span className="text-yellow-400">💡</span> TIPS PENYIAPAN MULTI-LAYAR OFFLINE
          </div>
          <p className="text-xxs md:text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
            Aplikasi ini mendukung sinkronisasi data instan tanpa internet! Buka aplikasi ini di beberapa tab browser baru (atau layar monitor kedua) di komputer yang sama. Atur satu tab menjadi <strong className="text-white font-semibold">Sekretaris</strong> untuk mengontrol, tab lainnya menjadi <strong className="text-white font-semibold">Juri 1, 2, 3, Dewan</strong>, dan <strong className="text-white font-semibold">Monitor</strong>. Data akan tersinkron otomatis dalam milidetik!
          </p>
        </div>
      </div>

      {/* 4. Small Footer Accent */}
      <footer className="text-center pb-4 text-[10px] md:text-xs font-mono text-gray-600 tracking-wider">
        Developed by : <span className="text-gray-400 font-bold">IRFAN, S.Pd.</span>
      </footer>

    </div>
  );
}
