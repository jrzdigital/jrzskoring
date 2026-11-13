import React, { useState, useMemo } from 'react';
import {
  Trophy,
  GitBranch,
  Award,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Shield,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  X
} from 'lucide-react';

interface AthleteSlot {
  name: string;
  contingent?: string;
  teamMembers?: string[];
  gender?: string;
  category?: string;
}

export interface BracketMatchItem {
  id: string;
  matchNumber: number;
  round: number;
  stage: string;
  roundName: string;
  category: string;
  isJurus?: boolean;
  athlete1: AthleteSlot | null;
  athlete2: AthleteSlot | null;
  awardNote?: string;
  winner?: any;
}

interface BracketTreeVisualizerProps {
  matches: BracketMatchItem[];
  bracketCategory: 'PEMASALAN' | 'PRESTASI';
  pemasalanFormat: 'SEMIFINAL' | 'FINAL';
  prestasiFormat: 'SINGLE_POOL' | 'POOL_AB';
  selectedClass?: string;
  onSelectMatch?: (match: BracketMatchItem) => void;
}

export const BracketTreeVisualizer: React.FC<BracketTreeVisualizerProps> = ({
  matches,
  bracketCategory,
  pemasalanFormat,
  prestasiFormat,
  selectedClass,
  onSelectMatch
}) => {
  const [viewMode, setViewMode] = useState<'cyber' | 'tree' | 'cards'>('cyber');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeSelectedMatch, setActiveSelectedMatch] = useState<BracketMatchItem | null>(null);

  // Filter matches by stage
  const penyisihanMatches = useMemo(() => matches.filter((m) => m.stage === 'PENYISIHAN'), [matches]);
  const semifinalMatches = useMemo(() => matches.filter((m) => m.stage === 'SEMI_FINAL'), [matches]);
  const finalMatch = useMemo(() => matches.find((m) => m.stage === 'FINAL') || (matches.length === 1 ? matches[0] : null), [matches]);
  const playoff3rdMatch = useMemo(() => matches.find((m) => m.stage === 'PEREBUTAN_JUARA_3'), [matches]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.7, prev + delta), 1.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <GitBranch className="w-8 h-8 mx-auto" />
        </div>
        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Bagan Pertandingan Kosong</p>
        <p className="text-[11px] max-w-md text-slate-500 leading-relaxed">
          Data atlet pada kategori ini belum tersedia. Silakan tambahkan atlet pada menu <strong>Tambah Atlet</strong> untuk otomatis menyusun pohon bagan braket pertandingan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 bg-[#070b19] border border-cyan-500/30 rounded-2xl shadow-xl overflow-hidden text-slate-100 select-none">
      
      {/* ================= TOP CONTROLS BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0a1126]/90 border-b border-cyan-500/20 shrink-0">
        
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#040814] border border-cyan-500/30">
          <button
            type="button"
            onClick={() => setViewMode('cyber')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'cyber'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Tampilan Pohon Bagan 3D Cyber sesuai contoh lampiran resmi"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pohon Cyber 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Tampilan Pohon Diagram Standar"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Pohon Diagram</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Tampilan Daftar Kartu Detail Partai"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Daftar Partai</span>
          </button>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-2">
          {viewMode !== 'cards' && (
            <div className="flex items-center gap-1 bg-[#040814] border border-cyan-500/30 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleZoom(-0.1)}
                className="p-1 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Perkecil Bagan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer"
                title="Reset Ukuran Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.1)}
                className="p-1 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Perbesar Bagan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-[#040814] border border-amber-500/40 text-amber-300 text-[11px] font-mono font-black flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{matches.length} PARTAI</span>
          </div>
        </div>

      </div>

      {/* ================= MAIN ARENA BODY ================= */}
      <div className="flex-1 overflow-auto relative custom-inner-scrollbar bg-[#050915] p-4 sm:p-6 flex flex-col items-center justify-start">
        
        {/* Subtle Cyber Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(to right, rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,233,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px, 48px 48px, 48px 48px'
          }}
        />

        {/* View Mode: CYBER 3D POHON BAGAN (MATCHING ATTACHED IMAGE) */}
        {viewMode === 'cyber' && (
          <div
            className="w-full max-w-5xl flex flex-col items-center relative transition-transform duration-200 z-10"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          >
            {/* ================= 1. THE GOLDEN CHAMPIONSHIP TROPHY & PEDESTAL (APEX) ================= */}
            <div className="flex flex-col items-center mb-6 relative">
              {/* Radiant Glow Behind Trophy */}
              <div className="absolute -top-6 w-56 h-56 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />
              
              {/* Floating Sparkles & Light Ray */}
              <div className="relative flex flex-col items-center">
                {/* Trophy Graphic / SVG Emblem */}
                <div className="relative group cursor-pointer animate-pulse-slow">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-0.5 shadow-[0_0_35px_rgba(245,158,11,0.65)] flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-[#120a02] flex flex-col items-center justify-center border border-amber-300/60 relative overflow-hidden">
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                      <Sparkles className="w-4 h-4 text-yellow-200 absolute top-2 right-2 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Pedestal with "CHAMPIONSHIP" Plaque */}
                <div className="mt-2.5 px-6 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300 text-slate-950 font-black font-mono text-xs sm:text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(245,158,11,0.5)] flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>CHAMPIONSHIP</span>
                  <Award className="w-4 h-4 text-slate-950" />
                </div>
                
                <div className="text-[10px] font-mono text-amber-300/80 font-bold mt-1 tracking-wider">
                  JUARA 1 · MEDALI EMAS &amp; JUARA 2 · PERAK
                </div>
              </div>

              {/* Central Glowing Golden Conduit running straight down to Finals */}
              <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)] rounded-full mt-2" />
            </div>

            {/* ================= 2. THE GRAND FINAL MATCH ARENA ================= */}
            {finalMatch && (
              <div className="flex flex-col items-center mb-8 relative z-20">
                <div
                  onClick={() => {
                    setActiveSelectedMatch(finalMatch);
                    if (onSelectMatch) onSelectMatch(finalMatch);
                  }}
                  className="w-[300px] sm:w-[360px] rounded-2xl bg-gradient-to-b from-[#141b36] to-[#0a0f24] border-2 border-amber-400 p-3.5 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] transition-all cursor-pointer relative group"
                >
                  {/* Top Badge: BABAK FINAL & PARTAI # */}
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black font-mono text-[10px] tracking-wider uppercase">
                        FINAL · PARTAI #{finalMatch.matchNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase">
                      PEREBUTAN EMAS
                    </span>
                  </div>

                  {/* Competitor 1: Sudut Biru (Pool Atas / Semifinal 1) */}
                  <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/50 flex items-center justify-between mb-1.5">
                    <div className="min-w-0 pr-2">
                      <span className="text-[8px] font-black uppercase text-cyan-400 font-mono block">
                        SUDUT BIRU
                      </span>
                      <div className="text-xs sm:text-sm font-black text-cyan-200 uppercase truncate">
                        {finalMatch.athlete1?.name || (semifinalMatches.length > 0 ? 'Pemenang Semifinal 1' : 'Pesilat Biru')}
                      </div>
                      <div className="text-[9px] text-cyan-400/80 font-mono truncate">
                        {finalMatch.athlete1?.contingent || '-'}
                      </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] shrink-0" />
                  </div>

                  {/* Competitor 2: Sudut Merah (Pool Bawah / Semifinal 2) */}
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[8px] font-black uppercase text-rose-400 font-mono block">
                        SUDUT MERAH
                      </span>
                      <div className="text-xs sm:text-sm font-black text-rose-200 uppercase truncate">
                        {finalMatch.athlete2?.name || (semifinalMatches.length > 1 ? 'Pemenang Semifinal 2' : 'Pesilat Merah')}
                      </div>
                      <div className="text-[9px] text-rose-400/80 font-mono truncate">
                        {finalMatch.athlete2?.contingent || '-'}
                      </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. BILATERAL WING ARRAYS: LEFT (BLUE) & RIGHT (RED) ================= */}
            {semifinalMatches.length > 0 && (
              <div className="w-full flex flex-col items-center relative">
                
                {/* SVG Glowing Circuit Branches connecting Semifinals to Finals */}
                <div className="w-full max-w-3xl h-16 sm:h-20 relative pointer-events-none">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 80">
                    <defs>
                      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Left Wing Connector (Cyan Circuit) from Left Semifinal (X: 150, Y: 80) to Final (X: 300, Y: 0) */}
                    <path
                      d="M 150,80 L 150,40 L 300,40 L 300,0"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow-cyan)"
                    />
                    <circle cx="150" cy="80" r="4.5" fill="#06b6d4" filter="url(#glow-cyan)" />

                    {/* Right Wing Connector (Amber/Red Circuit) from Right Semifinal (X: 450, Y: 80) to Final (X: 300, Y: 0) */}
                    <path
                      d="M 450,80 L 450,40 L 300,40 L 300,0"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow-amber)"
                    />
                    <circle cx="450" cy="80" r="4.5" fill="#f59e0b" filter="url(#glow-amber)" />

                    {/* Apex Junction Dot */}
                    <circle cx="300" cy="40" r="5" fill="#fbbf24" />
                  </svg>
                </div>

                {/* Semifinals Dual Column (Left Wing & Right Wing) */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  
                  {/* LEFT WING: SEMIFINAL 1 (SUDUT BIRU / POOL ATAS) */}
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-[320px] rounded-xl bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border border-cyan-500/50 py-1 px-3 text-center mb-3 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                      <span className="font-mono font-black text-xs text-cyan-300 uppercase tracking-widest">
                        SEMIFINAL 1 · POOL ATAS
                      </span>
                    </div>

                    {semifinalMatches[0] && (
                      <div
                        onClick={() => {
                          setActiveSelectedMatch(semifinalMatches[0]);
                          if (onSelectMatch) onSelectMatch(semifinalMatches[0]);
                        }}
                        className="w-full max-w-[320px] rounded-2xl bg-[#081024] border-2 border-cyan-500/60 p-3 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all cursor-pointer relative"
                      >
                        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-black text-[10px] border border-cyan-500/40">
                            PARTAI #{semifinalMatches[0].matchNumber}
                          </span>
                          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">
                            PEMENANG KE FINAL
                          </span>
                        </div>

                        {/* Biru Competitor */}
                        <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 mb-1 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[8px] font-bold text-blue-400 block font-mono">SUDUT BIRU</span>
                            <div className="text-xs font-black text-cyan-200 truncate uppercase">
                              {semifinalMatches[0].athlete1?.name || 'Pesilat Biru'}
                            </div>
                            <div className="text-[9px] text-cyan-400/70 truncate">
                              {semifinalMatches[0].athlete1?.contingent || '-'}
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                        </div>

                        {/* Merah Competitor */}
                        <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[8px] font-bold text-rose-400 block font-mono">SUDUT MERAH</span>
                            <div className="text-xs font-black text-rose-200 truncate uppercase">
                              {semifinalMatches[0].athlete2?.name || 'Pesilat Merah'}
                            </div>
                            <div className="text-[9px] text-rose-400/70 truncate">
                              {semifinalMatches[0].athlete2?.contingent || '-'}
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT WING: SEMIFINAL 2 (SUDUT MERAH / POOL BAWAH) */}
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-[320px] rounded-xl bg-gradient-to-r from-amber-900/60 to-red-900/60 border border-amber-500/50 py-1 px-3 text-center mb-3 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                      <span className="font-mono font-black text-xs text-amber-300 uppercase tracking-widest">
                        SEMIFINAL 2 · POOL BAWAH
                      </span>
                    </div>

                    {semifinalMatches[1] && (
                      <div
                        onClick={() => {
                          setActiveSelectedMatch(semifinalMatches[1]);
                          if (onSelectMatch) onSelectMatch(semifinalMatches[1]);
                        }}
                        className="w-full max-w-[320px] rounded-2xl bg-[#140a16] border-2 border-amber-500/60 p-3 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer relative"
                      >
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-black text-[10px] border border-amber-500/40">
                            PARTAI #{semifinalMatches[1].matchNumber}
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">
                            PEMENANG KE FINAL
                          </span>
                        </div>

                        {/* Biru Competitor */}
                        <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 mb-1 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[8px] font-bold text-blue-400 block font-mono">SUDUT BIRU</span>
                            <div className="text-xs font-black text-cyan-200 truncate uppercase">
                              {semifinalMatches[1].athlete1?.name || 'Pesilat Biru'}
                            </div>
                            <div className="text-[9px] text-cyan-400/70 truncate">
                              {semifinalMatches[1].athlete1?.contingent || '-'}
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                        </div>

                        {/* Merah Competitor */}
                        <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[8px] font-bold text-rose-400 block font-mono">SUDUT MERAH</span>
                            <div className="text-xs font-black text-rose-200 truncate uppercase">
                              {semifinalMatches[1].athlete2?.name || 'Pesilat Merah'}
                            </div>
                            <div className="text-[9px] text-rose-400/70 truncate">
                              {semifinalMatches[1].athlete2?.contingent || '-'}
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* ================= 4. BABAK PENYISIHAN (IF 8 ATLETS / PRESTASI) ================= */}
            {penyisihanMatches.length > 0 && (
              <div className="w-full mt-10 pt-6 border-t border-cyan-500/20 flex flex-col items-center">
                <div className="mb-4">
                  <span className="px-4 py-1.5 rounded-xl bg-[#09142b] border border-cyan-500/40 text-cyan-300 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>BABAK PENYISIHAN (8 PESILAT ELIMINASI)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {penyisihanMatches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setActiveSelectedMatch(m);
                        if (onSelectMatch) onSelectMatch(m);
                      }}
                      className="rounded-xl bg-[#091122] border border-cyan-500/30 p-2.5 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                        <span className="text-[9px] font-mono font-black text-cyan-300">
                          PARTAI #{m.matchNumber}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          PENYISIHAN
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-cyan-300 truncate">
                        {m.athlete1?.name || 'Pesilat Biru'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate mb-1">
                        {m.athlete1?.contingent || '-'}
                      </div>
                      <div className="h-px bg-slate-800 my-1" />
                      <div className="text-[11px] font-bold text-rose-300 truncate">
                        {m.athlete2?.name || 'Pesilat Merah'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {m.athlete2?.contingent || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= 5. PEREBUTAN JUARA 3 (BRONZE PODIUM) ================= */}
            {playoff3rdMatch && (
              <div className="w-full mt-10 pt-6 border-t border-amber-500/30 flex flex-col items-center">
                <div className="mb-3">
                  <div className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#211504] to-[#120a02] border border-amber-500/60 text-amber-300 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>PEREBUTAN JUARA 3 (MEDALI PERUNGGU TUNGGAL)</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setActiveSelectedMatch(playoff3rdMatch);
                    if (onSelectMatch) onSelectMatch(playoff3rdMatch);
                  }}
                  className="w-full max-w-[340px] rounded-2xl bg-[#140d04] border-2 border-amber-500/50 p-3 shadow-lg hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-black text-[10px] border border-amber-500/40">
                      PARTAI #{playoff3rdMatch.matchNumber}
                    </span>
                    <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase">
                      MEDALI PERUNGGU
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 mb-1 flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-[8px] font-bold text-cyan-400 block font-mono">SUDUT BIRU</span>
                      <div className="text-xs font-black text-cyan-200 truncate uppercase">
                        {playoff3rdMatch.athlete1?.name || 'Pesilat Biru'}
                      </div>
                      <div className="text-[9px] text-cyan-400/70 truncate">
                        {playoff3rdMatch.athlete1?.contingent || '-'}
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                  </div>

                  <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-[8px] font-bold text-rose-400 block font-mono">SUDUT MERAH</span>
                      <div className="text-xs font-black text-rose-200 truncate uppercase">
                        {playoff3rdMatch.athlete2?.name || 'Pesilat Merah'}
                      </div>
                      <div className="text-[9px] text-rose-400/70 truncate">
                        {playoff3rdMatch.athlete2?.contingent || '-'}
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* View Mode: TREE (POHON DIAGRAM STANDAR) */}
        {viewMode === 'tree' && (
          <div
            className="w-full max-w-4xl flex flex-col items-center py-4 z-10"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          >
            <div className="w-full grid grid-cols-2 gap-8 mb-6">
              <div className="text-center font-mono font-black text-sm uppercase text-cyan-400 bg-cyan-950/40 py-2 rounded-xl border border-cyan-500/30">
                BABAK SEMIFINAL
              </div>
              <div className="text-center font-mono font-black text-sm uppercase text-amber-400 bg-amber-950/40 py-2 rounded-xl border border-amber-500/30">
                BABAK FINAL
              </div>
            </div>

            <div className="w-full flex items-center justify-center gap-0">
              {/* Semifinal Column */}
              <div className="flex flex-col gap-8 z-10">
                {semifinalMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setActiveSelectedMatch(m)}
                    className="w-[280px] bg-[#0c142b] border border-cyan-500/50 rounded-xl p-3 shadow-md hover:border-cyan-400 cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300 mb-2">
                      <span>PARTAI #{m.matchNumber}</span>
                      <span className="text-slate-400">SEMIFINAL</span>
                    </div>
                    <div className="text-xs font-black text-cyan-200 truncate">{m.athlete1?.name || 'Pesilat Biru'}</div>
                    <div className="text-[9px] text-slate-400 mb-1">{m.athlete1?.contingent || '-'}</div>
                    <div className="border-b border-slate-800 my-1" />
                    <div className="text-xs font-black text-rose-300 truncate">{m.athlete2?.name || 'Pesilat Merah'}</div>
                    <div className="text-[9px] text-slate-400">{m.athlete2?.contingent || '-'}</div>
                  </div>
                ))}
              </div>

              {/* Connecting Tree Lines */}
              <div className="w-16 h-[260px] relative pointer-events-none">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 60 260">
                  <path
                    d="M 0,55 L 30,55 L 30,130 L 60,130"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 0,205 L 30,205 L 30,130"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <circle cx="30" cy="130" r="4" fill="#f59e0b" />
                </svg>
              </div>

              {/* Final Match */}
              {finalMatch && (
                <div
                  onClick={() => setActiveSelectedMatch(finalMatch)}
                  className="w-[280px] bg-[#1a1205] border-2 border-amber-500 rounded-xl p-3.5 shadow-lg hover:border-amber-400 cursor-pointer z-10"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-amber-300 mb-2">
                    <span className="font-black">PARTAI #{finalMatch.matchNumber}</span>
                    <span className="text-amber-400">GRAND FINAL</span>
                  </div>
                  <div className="text-xs font-black text-cyan-200 truncate">{finalMatch.athlete1?.name || 'Pemenang SF 1'}</div>
                  <div className="text-[9px] text-slate-400 mb-1">{finalMatch.athlete1?.contingent || '-'}</div>
                  <div className="border-b border-slate-800 my-1" />
                  <div className="text-xs font-black text-rose-300 truncate">{finalMatch.athlete2?.name || 'Pemenang SF 2'}</div>
                  <div className="text-[9px] text-slate-400">{finalMatch.athlete2?.contingent || '-'}</div>
                </div>
              )}
            </div>

            {/* Playoff 3rd */}
            {playoff3rdMatch && (
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center">
                <div className="text-xs font-mono font-bold text-amber-400 mb-2">PEREBUTAN JUARA 3</div>
                <div
                  onClick={() => setActiveSelectedMatch(playoff3rdMatch)}
                  className="w-[300px] bg-[#120a02] border border-amber-500/60 rounded-xl p-3 shadow-md hover:border-amber-400 cursor-pointer"
                >
                  <div className="flex justify-between text-[10px] font-mono text-amber-300 mb-1">
                    <span>PARTAI #{playoff3rdMatch.matchNumber}</span>
                    <span>MEDALI PERUNGGU</span>
                  </div>
                  <div className="text-xs font-black text-cyan-200 truncate">{playoff3rdMatch.athlete1?.name || 'Pesilat Biru'}</div>
                  <div className="text-xs font-black text-rose-300 truncate mt-1">{playoff3rdMatch.athlete2?.name || 'Pesilat Merah'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode: CARDS (DAFTAR KARTU PARTAI) */}
        {viewMode === 'cards' && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 z-10">
            {matches.map((bm, index) => {
              const isJurus = bm.isJurus;

              return (
                <div
                  key={bm.id}
                  onClick={() => setActiveSelectedMatch(bm)}
                  className="rounded-xl border border-cyan-500/30 p-3.5 bg-[#091024] space-y-2.5 relative hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase border-b border-cyan-500/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-300">
                        Partai #{bm.matchNumber || index + 1}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${
                        isJurus ? 'bg-emerald-600' : 'bg-red-600'
                      }`}>
                        {isJurus ? 'Jurus Seni' : 'Tanding'}
                      </span>
                    </div>
                    <span className="text-amber-400 font-extrabold text-[9px]">
                      {bm.stage?.replace('_', ' ') || 'BAGAN'}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-200 leading-tight">
                    {bm.roundName}
                  </div>

                  {/* Athlete 1 (Biru) */}
                  <div className="p-2.5 rounded-lg bg-blue-950/50 border border-blue-500/40 text-xs space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-cyan-400 block font-mono">
                      {isJurus ? 'PENAMPIL SUDUT BIRU' : 'SUDUT BIRU'}
                    </span>
                    <div className="font-black text-cyan-100 text-xs truncate">
                      {bm.athlete1 ? bm.athlete1.name : 'BYE / Menunggu'}
                    </div>
                    <div className="text-[9px] text-cyan-400/80 font-medium truncate">
                      {bm.athlete1?.contingent ? `Kontingen: ${bm.athlete1.contingent}` : '-'}
                    </div>
                  </div>

                  {/* Athlete 2 (Merah) */}
                  <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-xs space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-rose-400 block font-mono">
                      {isJurus ? 'PENAMPIL SUDUT MERAH' : 'SUDUT MERAH'}
                    </span>
                    <div className="font-black text-rose-100 text-xs truncate">
                      {bm.athlete2 ? bm.athlete2.name : 'BYE / Menunggu'}
                    </div>
                    <div className="text-[9px] text-rose-400/80 font-medium truncate">
                      {bm.athlete2?.contingent ? `Kontingen: ${bm.athlete2.contingent}` : '-'}
                    </div>
                  </div>

                  {bm.awardNote && (
                    <div className="pt-1.5 border-t border-cyan-500/20 text-[9px] font-bold text-amber-400 flex items-start gap-1">
                      <Award className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="leading-tight line-clamp-2">{bm.awardNote}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= MODAL DETAIL PARTAI INTERAKTIF ================= */}
      {activeSelectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#091126] border-2 border-cyan-400 p-5 shadow-[0_0_30px_rgba(6,182,212,0.5)] text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black font-mono text-xs uppercase">
                  PARTAI #{activeSelectedMatch.matchNumber}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  {activeSelectedMatch.stage?.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSelectedMatch(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                {activeSelectedMatch.roundName}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Kategori: {activeSelectedMatch.category || selectedClass || 'Silat'}
              </p>
            </div>

            <div className="space-y-2">
              {/* Sudut Biru */}
              <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-500/60">
                <span className="text-[9px] font-black uppercase text-cyan-400 font-mono block">
                  SUDUT BIRU
                </span>
                <div className="text-sm font-black text-cyan-200 uppercase truncate">
                  {activeSelectedMatch.athlete1?.name || 'Pesilat Biru'}
                </div>
                <div className="text-xs text-cyan-400/80 font-mono truncate">
                  Kontingen: {activeSelectedMatch.athlete1?.contingent || '-'}
                </div>
              </div>

              {/* Sudut Merah */}
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60">
                <span className="text-[9px] font-black uppercase text-rose-400 font-mono block">
                  SUDUT MERAH
                </span>
                <div className="text-sm font-black text-rose-200 uppercase truncate">
                  {activeSelectedMatch.athlete2?.name || 'Pesilat Merah'}
                </div>
                <div className="text-xs text-rose-400/80 font-mono truncate">
                  Kontingen: {activeSelectedMatch.athlete2?.contingent || '-'}
                </div>
              </div>
            </div>

            {activeSelectedMatch.awardNote && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-[11px] font-medium leading-tight">{activeSelectedMatch.awardNote}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveSelectedMatch(null)}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Tutup Rincian Partai
            </button>
          </div>
        </div>
      )}

      {/* ================= FOOTER BAR ================= */}
      <div className="px-4 py-2.5 bg-[#0a1126] border-t border-cyan-500/20 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300">Pohon Bagan Dinamis PERSILAT &amp; IPSI 2026</span>
        </div>
        <div className="text-amber-400/90 font-bold">
          Sesuai Spesifikasi Arena Digital JRZ SCORE
        </div>
      </div>

    </div>
  );
};

export default BracketTreeVisualizer;
