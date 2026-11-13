/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TOURNAMENT BRACKET VIEW (POHON BAGAN PRESTASI HORIZONTAL)
 * Menampilkan bagan turnamen sistem gugur secara horizontal standar resmi PB IPSI.
 * Dilengkapi 2 kotak tiap partai (Sudut Biru & Merah), nama atlet, asal kontingen,
 * skor, status, dan garis penghubung visual (bracket connector tree) antar babak.
 */

import React, { useMemo } from "react";
import { Trophy, Award, Users, Swords, CheckCircle2, Crown, Medal } from "lucide-react";

export interface BracketParticipant {
  id: string;
  name: string;
  contingent?: string;
  club?: string;
  seed?: number;
  gender?: string;
  categoryClassId?: string;
}

export interface BracketMatch {
  id: string;
  round?: number;
  matchNumber?: number | string;
  stage?: string;
  participant1?: BracketParticipant | null;
  participant2?: BracketParticipant | null;
  fighterBlueName?: string;
  fighterBlueClub?: string;
  fighterRedName?: string;
  fighterRedClub?: string;
  score1?: number;
  score2?: number;
  scoreBlue?: number;
  scoreRed?: number;
  winner?: any;
  status?: string;
  arena?: string;
  [key: string]: any;
}

export interface TournamentBracketViewProps {
  participants?: BracketParticipant[];
  matches?: BracketMatch[];
  title?: string;
  category?: string;
  categoryName?: string;
  categoryClassId?: string;
  gender?: string;
  poolScheme?: string;
  arenaName?: string;
  onSelectMatch?: (match: any) => void;
  className?: string;
}

interface StageColumn {
  key: string;
  name: string;
  matches: BracketMatch[];
  yPositions: number[];
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  participants = [],
  matches = [],
  title = "BAGAN PRESTASI PERTANDINGAN (SISTEM GUGUR)",
  category = "TANDING",
  categoryName,
  gender,
  onSelectMatch,
  className = ""
}) => {
  const displayTitle = categoryName ? `${categoryName.toUpperCase()} - SISTEM GUGUR PRESTASI` : title;

  // 1. Kelompokkan matches berdasarkan tahapan babak (Penyisihan -> Perempat Final -> Semifinal -> Final)
  const stageGroups = useMemo(() => {
    const penyisihan: BracketMatch[] = [];
    const perempatFinal: BracketMatch[] = [];
    const semifinal: BracketMatch[] = [];
    const finalMatches: BracketMatch[] = [];
    const others: BracketMatch[] = [];

    (matches || []).forEach((m) => {
      const s = String(m.stage || "").toUpperCase();
      if (s.includes("PENYISIHAN") || s.includes("BABAK 1") || s.includes("BABAK UTAMA") || s.includes("R1")) {
        penyisihan.push(m);
      } else if (s.includes("PEREMPAT") || s.includes("QUARTER") || s.includes("QF")) {
        perempatFinal.push(m);
      } else if (s.includes("SEMI") || s.includes("SF")) {
        semifinal.push(m);
      } else if (s.includes("FINAL")) {
        finalMatches.push(m);
      } else {
        others.push(m);
      }
    });

    const groups: { name: string; key: string; matches: BracketMatch[] }[] = [];
    if (penyisihan.length > 0) groups.push({ name: "BABAK PENYISIHAN", key: "penyisihan", matches: penyisihan });
    if (perempatFinal.length > 0) groups.push({ name: "PEREMPAT FINAL", key: "qf", matches: perempatFinal });
    if (semifinal.length > 0) groups.push({ name: "BABAK SEMIFINAL", key: "sf", matches: semifinal });
    if (finalMatches.length > 0) groups.push({ name: "PARTAI FINAL", key: "final", matches: finalMatches });
    if (others.length > 0 && groups.length === 0) groups.push({ name: "PERTANDINGAN", key: "others", matches: others });

    // Fallback: jika pola penamaan belum terdeteksi
    if (groups.length === 0 && matches.length > 0) {
      groups.push({ name: "PERTANDINGAN PRESTASI", key: "all", matches });
    }

    return groups;
  }, [matches]);

  // 2. Geometri Bagan Pohon Horizontal
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 142;
  const CONN_WIDTH = 64;

  const baseCount = Math.max(1, stageGroups[0]?.matches.length || 1);
  const rowHeight = Math.max(170, Math.min(230, 700 / Math.max(1, baseCount)));
  const totalHeight = Math.max(560, baseCount * rowHeight);

  // 3. Hitung koordinat Y (tengah) tiap kartu secara seimbang
  const layoutColumns = useMemo<StageColumn[]>(() => {
    if (stageGroups.length === 0) return [];

    const cols: StageColumn[] = [];

    stageGroups.forEach((group, colIdx) => {
      const matchCount = group.matches.length;
      const yPositions: number[] = [];

      if (colIdx === 0) {
        // Kolom pertama: posisikan terdistribusi vertikal merata
        const step = totalHeight / matchCount;
        for (let i = 0; i < matchCount; i++) {
          yPositions.push((i + 0.5) * step);
        }
      } else {
        // Kolom berikutnya: posisikan di tengah-tengah pasangan pengumpannya dari kolom sebelumnya
        const prevCol = cols[colIdx - 1];
        for (let i = 0; i < matchCount; i++) {
          const parentIdx1 = i * 2;
          const parentIdx2 = i * 2 + 1;
          const y1 = prevCol.yPositions[parentIdx1];
          const y2 = prevCol.yPositions[parentIdx2];

          if (y1 !== undefined && y2 !== undefined) {
            yPositions.push((y1 + y2) / 2);
          } else if (y1 !== undefined) {
            yPositions.push(y1);
          } else {
            // Default center jika tidak memiliki parent langsung
            const step = totalHeight / matchCount;
            yPositions.push((i + 0.5) * step);
          }
        }
      }

      cols.push({
        key: group.key,
        name: group.name,
        matches: group.matches,
        yPositions
      });
    });

    return cols;
  }, [stageGroups, totalHeight]);

  // Cek apakah babak Final sudah ada pemenang
  const finalMatch = stageGroups.find((g) => g.key === "final")?.matches[0];
  const finalWinnerCorner = finalMatch?.winner === "BIRU" || finalMatch?.winner === "BLUE" ? "BLUE" : finalMatch?.winner === "MERAH" || finalMatch?.winner === "RED" ? "RED" : null;
  const championName = finalWinnerCorner === "BLUE"
    ? finalMatch?.fighterBlueName
    : finalWinnerCorner === "RED"
    ? finalMatch?.fighterRedName
    : null;
  const championClub = finalWinnerCorner === "BLUE"
    ? finalMatch?.fighterBlueClub
    : finalWinnerCorner === "RED"
    ? finalMatch?.fighterRedClub
    : null;

  const finalCol = layoutColumns[layoutColumns.length - 1];
  const finalY = finalCol && finalCol.yPositions.length > 0 ? finalCol.yPositions[0] : totalHeight / 2;

  return (
    <div className={`bg-[#050e24] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 overflow-x-auto ${className}`}>
      {/* HEADER BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              {displayTitle}
            </h3>
            <p className="text-xs font-mono text-cyan-300 mt-0.5">
              Pohon Bagan Turnamen Horizontal &bull; {matches.length} Partai &bull; {participants.length} Pesilat Terdaftar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase shadow-sm">
            STANDAR PB IPSI 2026
          </span>
        </div>
      </div>

      {/* MAIN HORIZONTAL BRACKET TREE */}
      {matches.length === 0 ? (
        <div className="w-full text-center py-20 text-slate-400 space-y-2">
          <Users className="w-12 h-12 mx-auto opacity-30 text-cyan-300" />
          <p className="text-sm font-bold text-white uppercase">Belum ada bagan pertandingan yang dibentuk</p>
          <p className="text-xs text-slate-500">
            Atlet yang diloting di kelas ini akan otomatis tersusun ke dalam struktur pohon bagan prestasi horizontal.
          </p>
        </div>
      ) : (
        <div className="relative overflow-x-auto overflow-y-hidden pb-4 pt-1">
          <div className="flex items-start min-w-max">
            {layoutColumns.map((col, colIdx) => {
              const isLastStage = colIdx === layoutColumns.length - 1;
              const nextCol = !isLastStage ? layoutColumns[colIdx + 1] : null;

              return (
                <React.Fragment key={col.key}>
                  {/* KOLOM BABAK */}
                  <div className="flex flex-col" style={{ width: `${CARD_WIDTH}px` }}>
                    {/* Header Babak */}
                    <div className="mb-4 px-3 py-2 rounded-xl bg-gradient-to-r from-[#091f44] to-[#07132e] border border-cyan-500/40 text-center shadow-lg">
                      <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider block">
                        {col.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {col.matches.length} Partai
                      </span>
                    </div>

                    {/* Area Pertandingan */}
                    <div className="relative" style={{ height: `${totalHeight}px` }}>
                      {col.matches.map((m, mIdx) => {
                        const yCenter = col.yPositions[mIdx] ?? (mIdx + 0.5) * (totalHeight / col.matches.length);
                        const topPos = yCenter - CARD_HEIGHT / 2;

                        const blueName = m.fighterBlueName || m.participant1?.name || "SUDUT BIRU / TBD";
                        const blueClub = m.fighterBlueClub || m.participant1?.contingent || m.participant1?.club || "-";
                        const redName = m.fighterRedName || m.participant2?.name || "SUDUT MERAH / TBD";
                        const redClub = m.fighterRedClub || m.participant2?.contingent || m.participant2?.club || "-";
                        const scoreBlue = m.scoreBlue ?? m.score1 ?? 0;
                        const scoreRed = m.scoreRed ?? m.score2 ?? 0;

                        const isFinished = m.status === "SELESAI";
                        const isBlueWinner = m.winner === "BIRU" || m.winner === "BLUE" || (m.winner && (m.winner.id === m.participant1?.id || m.winner.name === blueName));
                        const isRedWinner = m.winner === "MERAH" || m.winner === "RED" || (m.winner && (m.winner.id === m.participant2?.id || m.winner.name === redName));

                        return (
                          <div
                            key={m.id || `m-${col.key}-${mIdx}`}
                            onClick={() => onSelectMatch?.(m)}
                            style={{
                              position: "absolute",
                              top: `${topPos}px`,
                              left: 0,
                              width: `${CARD_WIDTH}px`,
                              height: `${CARD_HEIGHT}px`
                            }}
                            className="bg-[#081432] hover:bg-[#0c1d47] border-2 border-cyan-500/40 hover:border-amber-400/80 rounded-2xl p-2.5 shadow-xl cursor-pointer transition-all transform hover:-translate-y-0.5 active:scale-98 flex flex-col justify-between group"
                          >
                            {/* Header Kartu Partai */}
                            <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20 text-[9.5px] font-mono">
                              <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                <Swords className="w-3 h-3 text-amber-400" />
                                PARTAI {m.matchNumber || mIdx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 uppercase text-[9px]">GEL {m.arena || "A"}</span>
                                <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] ${
                                  isFinished
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : "bg-slate-800 text-slate-400"
                                }`}>
                                  {m.status || "BELUM"}
                                </span>
                              </div>
                            </div>

                            {/* 2 KOTAK TIAP PARTAI */}
                            <div className="flex flex-col gap-1.5 my-1">
                              {/* KOTAK 1: SUDUT BIRU */}
                              <div className={`p-1.5 rounded-xl border transition-all flex items-center justify-between ${
                                isBlueWinner
                                  ? "bg-blue-600/35 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)] ring-1 ring-blue-400"
                                  : "bg-blue-950/50 border-blue-900/60 text-slate-200"
                              }`}>
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-mono text-blue-400 font-black uppercase">
                                      [BIRU]
                                    </span>
                                    <span className="text-xs font-black truncate block text-white">
                                      {blueName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-cyan-300 truncate block mt-0.5">
                                    {blueClub}
                                  </span>
                                </div>
                                <span className={`text-sm font-mono font-black pl-1 shrink-0 ${
                                  isBlueWinner ? "text-amber-300" : "text-blue-300"
                                }`}>
                                  {scoreBlue}
                                </span>
                              </div>

                              {/* KOTAK 2: SUDUT MERAH */}
                              <div className={`p-1.5 rounded-xl border transition-all flex items-center justify-between ${
                                isRedWinner
                                  ? "bg-red-600/35 border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.35)] ring-1 ring-red-400"
                                  : "bg-red-950/50 border-red-900/60 text-slate-200"
                              }`}>
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-mono text-rose-400 font-black uppercase">
                                      [MERAH]
                                    </span>
                                    <span className="text-xs font-black truncate block text-white">
                                      {redName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-rose-300 truncate block mt-0.5">
                                    {redClub}
                                  </span>
                                </div>
                                <span className={`text-sm font-mono font-black pl-1 shrink-0 ${
                                  isRedWinner ? "text-amber-300" : "text-rose-300"
                                }`}>
                                  {scoreRed}
                                </span>
                              </div>
                            </div>

                            {/* Footer Kartu */}
                            <div className="pt-0.5 text-[8.5px] font-mono text-slate-400 flex items-center justify-between">
                              <span className="truncate">{m.stage || col.name}</span>
                              {isFinished && (
                                <span className="text-emerald-400 font-bold uppercase">
                                  Pemenang: Sudut {isBlueWinner ? "Biru" : isRedWinner ? "Merah" : "-"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* GARIS PENGHUBUNG (CONNECTOR TREE) KE BABAK SELANJUTNYA */}
                  {!isLastStage && nextCol && (
                    <div
                      className="relative shrink-0"
                      style={{ width: `${CONN_WIDTH}px`, height: `${totalHeight + 60}px` }}
                    >
                      <svg
                        width={CONN_WIDTH}
                        height={totalHeight}
                        className="overflow-visible"
                        style={{ marginTop: "58px" }}
                      >
                        {col.matches.map((_, mIdx) => {
                          const nextIdx = Math.floor(mIdx / 2);
                          const yFrom = col.yPositions[mIdx];
                          const yTo = nextCol.yPositions[nextIdx];

                          if (yFrom === undefined || yTo === undefined) return null;

                          const isEven = mIdx % 2 === 0;
                          const siblingIdx = isEven ? mIdx + 1 : mIdx - 1;
                          const hasSibling = siblingIdx < col.matches.length;
                          const midX = CONN_WIDTH / 2;

                          if (hasSibling && isEven) {
                            // Pasangan genap: gambarkan cabang atas dan cabang bawah yang menyatu ke target
                            const ySibling = col.yPositions[siblingIdx];
                            return (
                              <g key={`conn-${col.key}-${mIdx}`}>
                                {/* Cabang atas (dari match genap) */}
                                <path
                                  d={`M 0 ${yFrom} H ${midX} V ${yTo} H ${CONN_WIDTH}`}
                                  fill="none"
                                  stroke="#06b6d4"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  filter="drop-shadow(0 0 3px rgba(6,182,212,0.6))"
                                />
                                {/* Cabang bawah (dari match ganjil) */}
                                <path
                                  d={`M 0 ${ySibling} H ${midX} V ${yTo}`}
                                  fill="none"
                                  stroke="#06b6d4"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  filter="drop-shadow(0 0 3px rgba(6,182,212,0.6))"
                                />
                              </g>
                            );
                          } else if (!hasSibling) {
                            // Pertandingan tunggal tanpa pasangan (BYE / lanjut langsung)
                            return (
                              <path
                                key={`conn-single-${col.key}-${mIdx}`}
                                d={`M 0 ${yFrom} H ${CONN_WIDTH}`}
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                filter="drop-shadow(0 0 3px rgba(6,182,212,0.6))"
                              />
                            );
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* GARIS PENGHUBUNG DARI FINAL KE KOTAK JUARA 1 */}
            <div
              className="relative shrink-0"
              style={{ width: `${CONN_WIDTH}px`, height: `${totalHeight + 60}px` }}
            >
              <svg
                width={CONN_WIDTH}
                height={totalHeight}
                className="overflow-visible"
                style={{ marginTop: "58px" }}
              >
                <path
                  d={`M 0 ${finalY} H ${CONN_WIDTH}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray={championName ? "none" : "4 4"}
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 5px rgba(245,158,11,0.8))"
                />
              </svg>
            </div>

            {/* KOLOM PODIUM JUARA 1 (EMAS) */}
            <div className="flex flex-col" style={{ width: "240px" }}>
              {/* Header Juara */}
              <div className="mb-4 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600/40 via-yellow-500/20 to-amber-600/40 border border-amber-400 text-center shadow-lg">
                <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider block">
                  PODIUM JUARA 1
                </span>
                <span className="text-[10px] font-mono text-yellow-200">
                  Medali Emas Prestasi
                </span>
              </div>

              {/* Kartu Juara 1 */}
              <div className="relative" style={{ height: `${totalHeight}px` }}>
                <div
                  style={{
                    position: "absolute",
                    top: `${finalY - 75}px`,
                    left: 0,
                    width: "240px",
                    height: "150px"
                  }}
                  className="bg-gradient-to-b from-[#181305] via-[#0f172a] to-[#040816] border-2 border-amber-400 rounded-3xl p-3.5 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex flex-col justify-between text-center relative overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-xs font-black uppercase">
                    <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                    <span>JUARA 1 (EMAS)</span>
                  </div>

                  <div className="my-1">
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider truncate">
                      {championName || "MENUNGGU FINAL"}
                    </h4>
                    <span className="text-xs font-mono text-amber-300 font-bold block truncate mt-0.5">
                      {championClub || "Pemenang Partai Final"}
                    </span>
                  </div>

                  <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[9.5px] font-mono text-amber-200 font-bold uppercase">
                    {championName ? `🏆 JUARA SUDUT ${finalWinnerCorner === "BLUE" ? "BIRU" : "MERAH"}` : "PERTANDINGAN FINAL"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracketView;
