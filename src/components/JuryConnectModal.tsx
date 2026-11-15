/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { isStaticHosting } from "../utils/networkHost";
import QRCode from "qrcode";
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Wifi, 
  ShieldCheck, 
  Tv, 
  User,
  Globe,
  Radio,
  Flame,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Router,
  Signal,
  Settings2
} from "lucide-react";
import { getActiveArena, setActiveArena } from "../services/firebase";

interface JuryConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: "JURI1" | "JURI2" | "JURI3" | "SCOREBOARD" | "DEWAN";
}

interface NetworkInterfaceItem {
  address: string;
  name: string;
  type: "hotspot" | "wifi" | "ethernet" | "virtual" | "other";
  label: string;
  priority: number;
}

export const JuryConnectModal: React.FC<JuryConnectModalProps> = ({
  isOpen,
  onClose,
  initialRole = "JURI1"
}) => {
  const [selectedRole, setSelectedRole] = useState<"JURI1" | "JURI2" | "JURI3" | "SCOREBOARD" | "DEWAN">(initialRole);
  const [arena, setArena] = useState<string>(() => getActiveArena());
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [serverIps, setServerIps] = useState<string[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterfaceItem[]>([]);
  const [cloudSyncUrl, setCloudSyncUrl] = useState<string>("");
  
  // Connection Mode:
  // - "AUTO": Smart resolve (uses Hotspot/LAN IP if on localhost, or cloud if online)
  // - "HOTSPOT": Windows Mobile Hotspot 2.4 GHz (192.168.137.1)
  // - "LOCAL_IP": Wi-Fi Router LAN IP
  // - "CLOUD": Cloud / Firebase Relay (bypasses 5G vs 2.4G router AP isolation)
  // - "CUSTOM": Custom IP & port manual input
  const [selectedHostType, setSelectedHostType] = useState<"AUTO" | "HOTSPOT" | "LOCAL_IP" | "CLOUD" | "CUSTOM">("AUTO");
  const [selectedIp, setSelectedIp] = useState<string>("");
  const [customIp, setCustomIp] = useState<string>("");
  const [customPort, setCustomPort] = useState<string>("3000");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Fetch local server network IPs & interface classification
  useEffect(() => {
    if (!isOpen || isStaticHosting()) return;
    fetch("/api/server-info")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.port) {
            setCustomPort(String(data.port));
          }
          if (data.cloudSyncUrl) {
            setCloudSyncUrl(data.cloudSyncUrl);
          }
          if (Array.isArray(data.interfaces) && data.interfaces.length > 0) {
            setInterfaces(data.interfaces);
          }
          if (Array.isArray(data.ips) && data.ips.length > 0) {
            const nonLocal = data.ips.filter((ip: string) => ip !== "127.0.0.1" && !ip.startsWith("127."));
            if (nonLocal.length > 0) {
              setServerIps(nonLocal);
              // Prioritize hotspot IP (192.168.137.1) or first valid IP
              const hotspotIp = nonLocal.find((ip: string) => ip === "192.168.137.1");
              setSelectedIp(hotspotIp || nonLocal[0]);
              setCustomIp(hotspotIp || nonLocal[0]);
            } else {
              setServerIps(data.ips);
              setSelectedIp(data.ips[0]);
              setCustomIp(data.ips[0]);
            }
          }
        }
      })
      .catch(() => {
        // Fallback when static / cloud-only
        if (typeof window !== "undefined") {
          setCloudSyncUrl(window.location.origin);
        }
      });
  }, [isOpen]);

  // Construct target link based on selected host type & arena
  const getDeviceUrl = (role: string, currentArena: string) => {
    if (typeof window === "undefined") return "";

    const path = window.location.pathname || "/";
    const port = customPort ? `:${customPort}` : (window.location.port ? `:${window.location.port}` : "");
    const protocol = window.location.protocol || "http:";

    let baseOrigin = window.location.origin;

    // 1. Mode CLOUD: Gunakan Cloud URL untuk menembus isolasi 5G vs 2.4G
    if (selectedHostType === "CLOUD") {
      baseOrigin = cloudSyncUrl || (
        window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
          ? "https://ais-dev-legswfxz7rmsep3ltab7tz-1038569148029.asia-southeast1.run.app"
          : window.location.origin
      );
      return `${baseOrigin}${path}?mode=${role}&arena=${currentArena}`;
    }

    // 2. Mode HOTSPOT: Khusus Hotspot Laptop 2.4 GHz (192.168.137.1)
    if (selectedHostType === "HOTSPOT") {
      const hp = selectedIp === "192.168.137.1" ? "192.168.137.1" : (selectedIp || "192.168.137.1");
      return `http://${hp}${port}${path}?mode=${role}&arena=${currentArena}`;
    }

    // 3. Mode CUSTOM IP: Input IP manual
    if (selectedHostType === "CUSTOM" && customIp.trim()) {
      return `http://${customIp.trim()}${port}${path}?mode=${role}&arena=${currentArena}`;
    }

    // 4. Mode LOCAL_IP: Wi-Fi LAN IP terpilih
    if (selectedHostType === "LOCAL_IP" && selectedIp) {
      return `http://${selectedIp}${port}${path}?mode=${role}&arena=${currentArena}`;
    }

    // 5. Mode AUTO: Cerdas selesaikan localhost -> LAN IP agar gawai luar bisa connect
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      if (selectedIp) {
        return `http://${selectedIp}${port}${path}?mode=${role}&arena=${currentArena}`;
      }
      if (cloudSyncUrl) {
        return `${cloudSyncUrl}${path}?mode=${role}&arena=${currentArena}`;
      }
    }

    // Jika sudah diakses melalui domain atau IP langsung di browser
    return `${baseOrigin}${path}?mode=${role}&arena=${currentArena}`;
  };

  const currentUrl = getDeviceUrl(selectedRole, arena);

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || !currentUrl) return;

    let isMounted = true;
    QRCode.toDataURL(currentUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: "#030712",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn("QR generation failed:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleArenaChange = (newArena: string) => {
    setArena(newArena);
    setActiveArena(newArena);
  };

  const roleLabels = {
    JURI1: { title: "Juri 1 (Gawai Depan)", icon: User, color: "text-red-400", border: "border-red-500/40" },
    JURI2: { title: "Juri 2 (Gawai Kanan)", icon: User, color: "text-blue-400", border: "border-blue-500/40" },
    JURI3: { title: "Juri 3 (Gawai Kiri)", icon: User, color: "text-amber-400", border: "border-amber-500/40" },
    DEWAN: { title: "Ketua Dewan", icon: ShieldCheck, color: "text-purple-400", border: "border-purple-500/40" },
    SCOREBOARD: { title: "Monitor / Layar Skor", icon: Tv, color: "text-emerald-400", border: "border-emerald-500/40" }
  };

  const activeRoleInfo = roleLabels[selectedRole];
  const IconComp = activeRoleInfo.icon;

  const hasHotspotDetected = serverIps.includes("192.168.137.1") || interfaces.some(i => i.type === "hotspot");

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[9999] animate-fadeIn select-none">
      <div className="bg-[#0b1329] border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 max-w-xl w-full text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-cyan-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-md">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm sm:text-base tracking-wider uppercase text-white leading-tight">
                Hubungkan Gawai Android Juri
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  Dukungan Lintas Sinyal 5 GHz & 2.4 GHz Aktif
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DUAL-BAND (5G SERVER vs 2.4G JURI) QUICK SELECTOR                          */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#07132e] via-[#091b3d] to-[#07132e] border border-cyan-500/40 rounded-2xl p-2.5 mb-2.5 shrink-0 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10.5px] font-black text-cyan-300 uppercase font-mono">
              <Signal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mode Jaringan (Solusi 5G Server & 2.4G Juri):</span>
            </div>
            <button
              onClick={() => setShowAdvancedSettings(prev => !prev)}
              className="text-[9px] font-mono text-cyan-400 hover:text-cyan-200 underline flex items-center gap-0.5 cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              {showAdvancedSettings ? "Tutup Opsi IP" : "Opsi IP Manual"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Opsi 1: Cloud Relay (Solusi terbaik jika router mengisolasi 5G & 2.4G) */}
            <button
              onClick={() => setSelectedHostType("CLOUD")}
              className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                selectedHostType === "CLOUD"
                  ? "bg-purple-950/80 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1">
                <Globe className={`w-3.5 h-3.5 ${selectedHostType === "CLOUD" ? "text-purple-400" : "text-slate-500"}`} />
                <span className="text-[10px] font-black uppercase tracking-tight">Cloud Relay</span>
              </div>
              <span className="text-[8.5px] leading-tight text-slate-400">
                Tembus beda sinyal 5G & 2.4G (Anti Isolasi Router)
              </span>
            </button>

            {/* Opsi 2: Hotspot Laptop 2.4 GHz */}
            <button
              onClick={() => {
                setSelectedHostType("HOTSPOT");
                if (serverIps.includes("192.168.137.1")) {
                  setSelectedIp("192.168.137.1");
                }
              }}
              className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                selectedHostType === "HOTSPOT"
                  ? "bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1">
                <Radio className={`w-3.5 h-3.5 ${selectedHostType === "HOTSPOT" ? "text-emerald-400" : "text-slate-500"}`} />
                <span className="text-[10px] font-black uppercase tracking-tight">Hotspot 2.4G</span>
              </div>
              <span className="text-[8.5px] leading-tight text-slate-400">
                Hotspot Internet 2.4G untuk Tablet/HP Juri via Firebase
              </span>
            </button>

            {/* Opsi 3: Wi-Fi LAN Lokal */}
            <button
              onClick={() => setSelectedHostType("LOCAL_IP")}
              className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                selectedHostType === "LOCAL_IP" || selectedHostType === "AUTO"
                  ? "bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1">
                <Wifi className={`w-3.5 h-3.5 ${selectedHostType === "LOCAL_IP" || selectedHostType === "AUTO" ? "text-cyan-400" : "text-slate-500"}`} />
                <span className="text-[10px] font-black uppercase tracking-tight">Wi-Fi LAN</span>
              </div>
              <span className="text-[8.5px] leading-tight text-slate-400">
                IP Router Wi-Fi ({selectedIp || "192.168.x.x"})
              </span>
            </button>
          </div>

          {/* Advanced IP selection / Custom Input (Muncul jika tombol Opsi IP diklik atau mode LOCAL_IP/CUSTOM) */}
          {showAdvancedSettings && (
            <div className="mt-2 pt-2 border-t border-cyan-900/40 text-[9.5px] font-mono space-y-1.5">
              <div className="flex items-center gap-1 text-slate-300">
                <span>Pilih IP Server Laptop:</span>
                <div className="flex flex-wrap gap-1">
                  {serverIps.map((ip) => (
                    <button
                      key={ip}
                      onClick={() => {
                        setSelectedIp(ip);
                        setSelectedHostType("LOCAL_IP");
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                        selectedIp === ip && selectedHostType === "LOCAL_IP"
                          ? "bg-cyan-500 text-slate-950 font-black shadow"
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {ip === "192.168.137.1" ? "Hotspot: 192.168.137.1" : ip}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedHostType("CUSTOM")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                      selectedHostType === "CUSTOM"
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    Ketik IP Manual
                  </button>
                </div>
              </div>

              {selectedHostType === "CUSTOM" && (
                <div className="flex items-center gap-1.5 bg-[#030712] p-1.5 rounded-lg border border-amber-500/40">
                  <span className="text-amber-400 text-[9px] font-bold">IP:</span>
                  <input
                    type="text"
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="bg-transparent border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-[10px] w-32 focus:border-cyan-400 outline-none"
                  />
                  <span className="text-amber-400 text-[9px] font-bold">Port:</span>
                  <input
                    type="text"
                    value={customPort}
                    onChange={(e) => setCustomPort(e.target.value)}
                    placeholder="3000"
                    className="bg-transparent border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-[10px] w-14 focus:border-cyan-400 outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gelanggang Selector */}
        <div className="flex items-center justify-between mb-2 shrink-0 bg-[#060c1d] border border-cyan-900/30 rounded-xl px-3 py-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
            Pilih Gelanggang Pertandingan:
          </span>
          <div className="flex gap-1.5">
            {["A", "B", "C", "D"].map((a) => (
              <button
                key={a}
                onClick={() => handleArenaChange(a)}
                className={`w-7 h-7 rounded-lg font-mono font-black text-xs transition-all cursor-pointer ${
                  arena === a
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] scale-105"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-5 gap-1.5 mb-2 shrink-0">
          {(["JURI1", "JURI2", "JURI3", "DEWAN", "SCOREBOARD"] as const).map((r) => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`py-1.5 px-1 rounded-xl text-center font-sans font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === "JURI1" && "Juri 1"}
                {r === "JURI2" && "Juri 2"}
                {r === "JURI3" && "Juri 3"}
                {r === "DEWAN" && "Dewan"}
                {r === "SCOREBOARD" && "Monitor"}
              </button>
            );
          })}
        </div>

        {/* QR Code and Active Role Card */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col items-center justify-center">
          <div className="bg-white p-2.5 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.15)] mb-2 flex items-center justify-center border-4 border-slate-900">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Link Juri" className="w-40 h-40 sm:w-44 sm:h-44 object-contain" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-slate-400 font-mono text-xs">
                Memuat QR...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-black uppercase tracking-wider ${activeRoleInfo.color} flex items-center gap-1.5`}>
              <IconComp className="w-4 h-4" />
              {activeRoleInfo.title} • Gelanggang {arena}
            </span>
          </div>

          {/* Copy URL bar & Direct Test Link */}
          <div className="w-full flex items-center gap-2 bg-[#060c1d] border border-cyan-900/40 rounded-xl p-1.5 pl-3 mb-2">
            <span className="text-[9.5px] font-mono text-cyan-300 truncate flex-1 select-all" title={currentUrl}>
              {currentUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs uppercase flex items-center gap-1 transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black shadow-md"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Tersalin!" : "Salin"}
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-all text-[10px] font-mono font-bold flex items-center gap-1"
              title="Buka panel ini di tab peramban baru untuk uji coba langsung"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Tes Tab Baru</span>
            </a>
          </div>

          {/* Panduan Khusus 5G & 2.4 GHz */}
          <div className="w-full bg-[#071026] border border-blue-900/40 rounded-xl p-2.5 text-left space-y-1">
            <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Panduan Mengatasi Server Laptop 5G & HP Juri 2.4 GHz:</span>
            </div>
            <div className="text-[9.5px] text-slate-300 space-y-1 leading-relaxed">
              <p>
                <strong>1. Jika Router Wi-Fi Memblokir Komunikasi (AP Isolation):</strong><br />
                Pilih tab <strong>"Cloud Relay"</strong> di atas. Kedua perangkat akan tersinkron otomatis seketika melalui Firebase Cloud Realtime Database tanpa perlu berada di frekuensi Wi-Fi yang sama.
              </p>
              <p>
                <strong>2. Pastikan Koneksi Internet Stabil (Firebase RTDB Online):</strong><br />
                Seluruh perangkat Dewan, Sekretaris, Timer, Juri, dan Monitor wajib terhubung ke internet agar data tersinkron real-time melalui Firebase Realtime Database (<code>jrz-score</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-cyan-900/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Sinkronisasi Real-Time Multi-Perangkat Aktif</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
