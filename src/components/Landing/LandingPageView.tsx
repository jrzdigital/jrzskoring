import React from 'react';
import { 
  Trophy, 
  Settings2, 
  ShieldCheck, 
  Radio, 
  Users, 
  Monitor, 
  Clock, 
  Layers, 
  ArrowRight, 
  Printer, 
  Github, 
  Sparkles, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Maximize2,
  Swords,
  Award,
  Flame,
  Volume2
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { AppRole } from '../../types/scoring';

interface LandingPageViewProps {
  onOpenPrintModal: () => void;
  onOpenDeployModal: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenPrintModal,
  onOpenDeployModal,
}) => {
  const {
    match,
    setRole,
    setActiveJudgeId,
    isOnline,
    language,
    setLanguage,
  } = useTournament();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const panels: {
    id: AppRole;
    number: string;
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    gradientClass: string;
    borderClass: string;
    glowClass: string;
    accentColor: string;
    features: string[];
  }[] = [
    {
      id: 'sekretaris',
      number: '01',
      badge: 'ADMINISTRASI & PARTAI',
      title: 'Sekretaris Pertandingan',
      subtitle: 'Match Secretary & Administration',
      description: 'Pusat pengaturan partai, pemilihan kategori tanding vs seni, kelas berat, registrasi pesilat, dan ekspor berita acara resmi.',
      icon: <Settings2 className="w-8 h-8 text-purple-300" />,
      gradientClass: 'from-purple-950/90 via-indigo-950/70 to-black',
      borderClass: 'border-purple-500/50 hover:border-purple-400',
      glowClass: 'glow-purple',
      accentColor: 'text-purple-400',
      features: ['Atur Gelanggang & Nomor Partai', 'Pilihan Kategori Tanding / Seni', 'Manajemen Kelas & Kontingen', 'Cetak Berita Acara PDF'],
    },
    {
      id: 'dewan',
      number: '02',
      badge: 'KEPUTUSAN & KONSENSUS',
      title: 'Dewan Pertandingan',
      subtitle: 'Match Council & Jury President',
      description: 'Pengawasan konsensus juri realtime, validasi sah jatuhan (+3 poin), penjatuhan hukuman wasit, manajemen Video Replay, dan pengesahan pemenang.',
      icon: <ShieldCheck className="w-8 h-8 text-blue-300" />,
      gradientClass: 'from-blue-950/90 via-indigo-950/70 to-black',
      borderClass: 'border-blue-500/50 hover:border-blue-400',
      glowClass: 'glow-blue',
      accentColor: 'text-blue-400',
      features: ['Lampu Konsensus Juri Realtime', 'Validasi Pengesahan Jatuhan', 'Hukuman Teguran & Peringatan', 'Video Replay (VR Challenge)'],
    },
    {
      id: 'operator',
      number: '03',
      badge: 'PENGATUR WAKTU & SOUND',
      title: 'Operator Gelanggang',
      subtitle: 'Timekeeper & Arena Controller',
      description: 'Kontrol master countdown waktu babak, synthesizer audio Gong perunggu dan Buzzer arena, timer medis cedera dokter (3 menit), dan status matras.',
      icon: <Radio className="w-8 h-8 text-cyan-300" />,
      gradientClass: 'from-cyan-950/90 via-blue-950/70 to-black',
      borderClass: 'border-cyan-500/50 hover:border-cyan-400',
      glowClass: 'glow-blue',
      accentColor: 'text-cyan-400',
      features: ['Master Timer Babak & Jeda', 'Gong Babak & Buzzer Horn', 'Timer Medis Dokter (3 Menit)', 'Status Kondisi Gelanggang'],
    },
    {
      id: 'juri',
      number: '04',
      badge: 'SCORING PAD SENTUH',
      title: 'Juri Pertandingan',
      subtitle: 'Judge Scoring Pad (Juri 1 - 5)',
      description: 'Pad penilaian sentuh landscape ergonomis untuk iOS dan Android. Pukulan (1), Tendangan (2), Jatuhan (3), deviasi gerak seni (-0.01), serta haptic vibration feedback.',
      icon: <Users className="w-8 h-8 text-fuchsia-300" />,
      gradientClass: 'from-purple-950/90 via-fuchsia-950/60 to-black',
      borderClass: 'border-fuchsia-500/50 hover:border-fuchsia-400',
      glowClass: 'glow-purple',
      accentColor: 'text-fuchsia-400',
      features: ['Tombol Taktil Ekstra Besar', 'Haptic & Audio Click Beep', 'Tombol Pembatalan (Undo)', 'Kalkulator Deviasi Seni'],
    },
    {
      id: 'monitor',
      number: '05',
      badge: 'LAYAR UTAMA TV ARENA',
      title: 'Monitor Gelanggang',
      subtitle: 'Big Screen Arena & Live Broadcast',
      description: 'Tampilan megah resolusi tinggi untuk layar TV panggung, monitor penonton, dan live streaming. Jam LED raksasa, skor glowing, dan selebrasi juara spektakuler.',
      icon: <Monitor className="w-8 h-8 text-amber-300" />,
      gradientClass: 'from-purple-950/90 via-blue-950/80 to-black',
      borderClass: 'border-amber-500/50 hover:border-amber-400',
      glowClass: 'glow-purple-blue',
      accentColor: 'text-amber-400',
      features: ['Jam LED Raksasa Bercahaya', 'Papan Skor Glowing Merah vs Biru', 'Lampu Indikator Juri 1-5', 'Animasi Selebrasi Pemenang'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14022c] via-[#090b24] to-[#020008] text-white p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Dynamic Ambient Background Glows: Ungu, Biru, Hitam */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-blue-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Portal Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/30 pb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-700 border-2 border-purple-400/50 flex items-center justify-center text-amber-300 shadow-xl glow-purple">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chakra font-black text-lg sm:text-2xl tracking-wider bg-gradient-to-r from-amber-300 via-purple-200 to-blue-300 bg-clip-text text-transparent uppercase">
                  PERSILAT & IPSI 2026
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest hidden sm:inline-block">
                  Official Digital System
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Sistem Digital Scoring Resmi Pencak Silat Kategori Tanding & Seni / Jurus
              </p>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-purple-950/50 border-purple-500/40 text-purple-300'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-purple-400" />}
              <span>{isOnline ? 'Firebase Cloud Sync' : 'Koneksi Terputus'}</span>
            </div>

            <button
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-bold text-gray-200 hover:text-white hover:border-purple-400 transition-all"
            >
              {language.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Live Match Summary Bar */}
        <div className="bg-gradient-to-r from-purple-950/80 via-blue-950/70 to-black border-2 border-purple-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                Pertandingan Sedang Aktif:
              </span>
              <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-white">
                <span className="text-amber-400">{match.arena}</span>
                <span className="text-gray-500">•</span>
                <span className="text-cyan-300">{match.matchNumber}</span>
                <span className="text-gray-500">•</span>
                <span className="uppercase text-purple-300">{match.category}</span>
                <span className="text-gray-500 hidden sm:inline">•</span>
                <span className="text-gray-300 text-xs font-normal hidden sm:inline">{match.classPool}</span>
              </div>
            </div>
          </div>

          {/* Quick Score Preview */}
          <div className="flex items-center gap-4">
            {match.category === 'tanding' ? (
              <div className="flex items-center gap-3 font-chakra font-black text-lg sm:text-xl">
                <span className="px-3 py-1 rounded-xl bg-red-950/70 border border-red-500/50 text-red-400">
                  MERAH: {match.redCorner.score}
                </span>
                <span className="text-gray-500">:</span>
                <span className="px-3 py-1 rounded-xl bg-blue-950/70 border border-blue-500/50 text-blue-400">
                  BIRU: {match.blueCorner.score}
                </span>
              </div>
            ) : (
              <div className="font-chakra font-black text-lg text-amber-300 px-3 py-1 rounded-xl bg-purple-950/70 border border-purple-500/50">
                SKOR SENI: {match.seniCompetitor.finalScore.toFixed(3)}
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs font-chakra font-bold text-white">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{formatTime(match.timerSeconds)}</span>
              {match.category === 'tanding' && (
                <span className="text-amber-400 text-[11px] ml-1">B{match.currentRound}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-400/40 text-xs font-bold text-purple-200 uppercase tracking-widest shadow">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            5 Panel Menu Utama Gelanggang
          </div>
          <h2 className="font-chakra text-2xl sm:text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-purple-100 to-blue-200 bg-clip-text text-transparent">
            Pilih Peran & Tampilan Meja Pertandingan
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
            Aplikasi terintegrasi untuk perangkat sekretariat, dewan pendekar, operator audio/timer, tablet juri landscape, dan monitor arena.
          </p>
        </div>

        {/* ================= THE 5 MAIN MENU PANELS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.slice(0, 3).map((panel) => (
            <div
              key={panel.id}
              className={`bg-gradient-to-b ${panel.gradientClass} border-2 ${panel.borderClass} rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02] ${panel.glowClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black/50 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                    {panel.icon}
                  </div>
                  <div className="text-right">
                    <span className="font-chakra font-black text-2xl text-white/20 block leading-none">
                      {panel.number}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300/90">
                      {panel.badge}
                    </span>
                  </div>
                </div>

                <h3 className="font-chakra text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                  {panel.title}
                </h3>
                <p className="text-xs font-semibold text-gray-400 mb-3">
                  {panel.subtitle}
                </p>

                <p className="text-xs text-gray-300 leading-relaxed mb-5">
                  {panel.description}
                </p>

                <div className="space-y-1.5 mb-6 border-t border-white/10 pt-4">
                  {panel.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${panel.accentColor} shrink-0`} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setRole(panel.id)}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-chakra font-black text-sm tracking-wider uppercase rounded-2xl text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all group-hover:shadow-purple-500/25"
              >
                <span>Buka Panel {panel.title.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}

          {/* Panel 4: Juri with Quick Judge 1-5 Selectors */}
          <div
            className={`bg-gradient-to-b ${panels[3].gradientClass} border-2 ${panels[3].borderClass} rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02] ${panels[3].glowClass}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black/50 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                  {panels[3].icon}
                </div>
                <div className="text-right">
                  <span className="font-chakra font-black text-2xl text-white/20 block leading-none">
                    {panels[3].number}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300/90">
                    {panels[3].badge}
                  </span>
                </div>
              </div>

              <h3 className="font-chakra text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-fuchsia-300 transition-colors">
                {panels[3].title}
              </h3>
              <p className="text-xs font-semibold text-gray-400 mb-3">
                {panels[3].subtitle}
              </p>

              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                {panels[3].description}
              </p>

              {/* Direct Quick Judge Selectors */}
              <div className="bg-black/60 border border-fuchsia-500/30 rounded-2xl p-3 mb-5">
                <span className="text-[10px] font-extrabold text-fuchsia-300 uppercase tracking-widest block mb-2">
                  Pilih Nomor Juri yang Digunakan:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((jId) => (
                    <button
                      key={jId}
                      onClick={() => {
                        setActiveJudgeId(jId);
                        setRole('juri');
                      }}
                      className="py-2 rounded-xl bg-purple-950/60 hover:bg-fuchsia-600 border border-purple-500/30 hover:border-fuchsia-400 text-xs font-chakra font-black text-white transition-all active:scale-95 text-center shadow"
                    >
                      Juri {jId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setRole('juri')}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 font-chakra font-black text-sm tracking-wider uppercase rounded-2xl text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Masuk Pad Juri Utama</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Panel 5: Monitor Gelanggang (Big Screen TV) - 2 cols on desktop for grandeur */}
          <div
            className={`md:col-span-2 lg:col-span-2 bg-gradient-to-r ${panels[4].gradientClass} border-2 ${panels[4].borderClass} rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] ${panels[4].glowClass}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-black/60 rounded-2xl border border-amber-400/30">
                    {panels[4].icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                      {panels[4].badge}
                    </span>
                    <h3 className="font-chakra text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {panels[4].title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Tampilan layar penuh khusus proyektor arena, TV monitor gelanggang, dan overlay siaran langsung (live streaming broadcast). Dirancang dengan kontras warna maksimal untuk terlihat jelas dari kejauhan gelanggang.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {panels[4].features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TV Monitor Mini Preview Card */}
              <div className="md:col-span-5 bg-black/80 border-2 border-purple-500/40 rounded-2xl p-4 text-center shadow-inner space-y-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Preview Arena Big Screen
                </div>

                <div className="font-chakra text-4xl sm:text-5xl font-black text-white led-score">
                  {formatTime(match.timerSeconds)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-chakra font-black">
                  <div className="py-2 bg-red-950/80 rounded-xl border border-red-500/50 text-red-400">
                    MERAH: {match.redCorner.score}
                  </div>
                  <div className="py-2 bg-blue-950/80 rounded-xl border border-blue-500/50 text-blue-400">
                    BIRU: {match.blueCorner.score}
                  </div>
                </div>

                <button
                  onClick={() => setRole('monitor')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 font-chakra font-black text-sm tracking-wider uppercase text-black rounded-xl shadow-lg glow-gold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Buka Layar Monitor TV Arena
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Utility Ribbon */}
        <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Sesuai Regulasi Resmi PERSILAT & IPSI 2026 (Tanding, Tunggal, Ganda, Regu, Solo Kreatif)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPrintModal}
              className="px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-200 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berita Acara</span>
            </button>

            <button
              onClick={onOpenDeployModal}
              className="px-3 py-1.5 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Panduan Web & GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
