/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DEWAN REKAPITULASI & MONITOR SCOREBOARD FOR TGR TUNGGAL
 * Kompilasi Nilai 3/5 Juri & Hukuman Dewan Standar PERSILAT & PB IPSI
 */

import React from "react";
import { 
  TgrTunggalMatchState, 
  calculateTgrFinalResult, 
  formatTgrPrecisionTime,
  formatTgrTime,
  SKOR_DASAR_TUNGGAL
} from "../../utils/tgrTunggalScoring";
import { soundEffects } from "../../utils/audio";

interface TgrDewanScoreboardProps {
  state: TgrTunggalMatchState;
  onUpdateDewanPenalties: (penalties: Partial<TgrTunggalMatchState["dewanPenalties"]>) => void;
  onToggleJudgesCount: (count: 3 | 5) => void;
  onAnnounceWinner: () => void;
  readOnly?: boolean;
}

export const TgrDewanScoreboard: React.FC<TgrDewanScoreboardProps> = ({
  state,
  onUpdateDewanPenalties,
  onToggleJudgesCount,
  onAnnounceWinner,
  readOnly = false,
}) => {
  const dewanPenalties = state.dewanPenalties || {
    toleransiWaktuCount: 0,
    keluarGelanggangCount: 0,
    senjataJatuhCount: 0,
    atributLepasCount: 0,
    menahanGerakanCount: 0,
    penaltiWaktuOtomatis: 0,
    diskualifikasi: false
  };
  const result = calculateTgrFinalResult(state.judges, dewanPenalties, state.judgesCount);
  const activeJudgesList = Object.values(state.judges).slice(0, state.judgesCount);

  const handleAdjustPenalty = (field: keyof TgrTunggalMatchState["dewanPenalties"], delta: number) => {
    try { soundEffects.playClick(); } catch {}
    const currentVal = Number(dewanPenalties[field]) || 0;
    const nextVal = Math.max(0, currentVal + delta);
    onUpdateDewanPenalties({ [field]: nextVal });
  };

  const handleToggleDq = () => {
    try { soundEffects.playBuzzer(); } catch {}
    onUpdateDewanPenalties({ diskualifikasi: !dewanPenalties.diskualifikasi });
  };

  return (
    <div className="bg-[#030614] border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl font-sans select-none space-y-4">
      
      {/* HEADER: RINGKASAN REKAPITULASI DEWAN & SKOR AKHIR */}
      <div className="bg-gradient-to-r from-[#0a163a] via-[#050f29] to-[#0a163a] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest">
              REKAPITULASI NILAI RESMI • TGR TUNGGAL BAKU IPSI 2026
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            {state.athleteName}
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-1">
            <span className="text-amber-400 font-bold">{state.contingent}</span>
            <span>•</span>
            <span>{state.gender}</span>
            <span>•</span>
            <span className="text-cyan-400">{state.ageCategory}</span>
            <span>•</span>
            <span>Partai {state.partai}</span>
          </div>
        </div>

        {/* Big Official Score Display */}
        <div className="flex items-center gap-4 bg-[#020512] border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0 text-center">
          <div>
            <span className="text-[9px] font-mono font-black text-amber-300 uppercase tracking-widest block">
              NILAI AKHIR RESMI
            </span>
            <span className="text-4xl sm:text-5xl font-mono font-black text-amber-400 leading-none">
              {dewanPenalties.diskualifikasi ? "DIS" : result.finalScore.toFixed(3)}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block mt-1">
              {state.judgesCount} Juri • Hukuman: -{result.totalPenaltiDewan.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* JURY SCORES BREAKDOWN (TABLE / CARDS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-widest">
            DAFTAR NILAI SELURUH JURI ({state.judgesCount} JURI AKTIF)
          </span>

          {!readOnly && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl">
              <span className="text-[9px] font-mono text-slate-400 px-1 font-bold">MODE JURI:</span>
              <button
                onClick={() => onToggleJudgesCount(3)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                  state.judgesCount === 3 
                    ? "bg-cyan-500 text-slate-950 font-black shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3 Juri
              </button>
              <button
                onClick={() => onToggleJudgesCount(5)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                  state.judgesCount === 5 
                    ? "bg-cyan-500 text-slate-950 font-black shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                5 Juri (Standar)
              </button>
            </div>
          )}
        </div>

        {/* 5 / 3 Judges Grid */}
        <div className={`grid gap-2.5 sm:gap-3 ${
          state.judgesCount === 5 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"
        }`}>
          {activeJudgesList.map((j) => {
            const isDiscardedHigh = state.judgesCount === 5 && result.discardedHigh.includes(j.totalScore);
            const isDiscardedLow = state.judgesCount === 5 && result.discardedLow.includes(j.totalScore);
            const isValid = !isDiscardedHigh && !isDiscardedLow;

            return (
              <div
                key={j.id}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center relative transition-all ${
                  isDiscardedHigh
                    ? "bg-rose-950/20 border-rose-500/40 text-slate-400 opacity-65"
                    : isDiscardedLow
                    ? "bg-blue-950/20 border-blue-500/40 text-slate-400 opacity-65"
                    : "bg-[#06112c] border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white"
                }`}
              >
                {/* Discard Badge */}
                {isDiscardedHigh && (
                  <span className="absolute -top-2 px-1.5 py-0.2 bg-rose-700 text-white font-mono text-[7.5px] font-black rounded uppercase">
                    Tertinggi Dibuang
                  </span>
                )}
                {isDiscardedLow && (
                  <span className="absolute -top-2 px-1.5 py-0.2 bg-blue-700 text-white font-mono text-[7.5px] font-black rounded uppercase">
                    Terendah Dibuang
                  </span>
                )}

                <span className="text-[10px] font-mono font-black text-cyan-300 uppercase">
                  {j.name}
                </span>

                <div className="my-1.5">
                  <span className={`text-2xl sm:text-3xl font-mono font-black ${
                    isValid ? "text-amber-400" : "text-slate-400 line-through"
                  }`}>
                    {j.totalScore.toFixed(2)}
                  </span>
                </div>

                <div className="w-full text-[9px] font-mono space-y-0.5 pt-1.5 border-t border-slate-700/50">
                  <div className="flex justify-between text-slate-400">
                    <span>Salah:</span>
                    <span className="text-rose-400 font-bold">{j.errorsCount}x</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Kebenaran:</span>
                    <span className="text-cyan-300 font-bold">{j.kebenaranScore.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Kemantapan:</span>
                    <span className="text-emerald-400 font-bold">+{j.kemantapanScore.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-2 text-[8px] font-mono">
                  {j.isSubmitted ? (
                    <span className="text-emerald-400 font-bold uppercase">✓ Terkirim</span>
                  ) : (
                    <span className="text-amber-400/80 italic">Draft</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEWAN PENALTIES & DEDUCTIONS CONTROL (ONLY IF NOT READONLY) */}
      {!readOnly && (
        <div className="bg-[#040c24] border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              MENU AKSI HUKUMAN DEWAN PERTANDINGAN
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              Total Pengurangan: -{result.totalPenaltiDewan.toFixed(3)} Poin
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                field: "toleransiWaktuCount" as keyof TgrTunggalMatchState["dewanPenalties"],
                label: "1. Penampilan melebihi / kurang dari toleransi waktu",
              },
              {
                field: "keluarGelanggangCount" as keyof TgrTunggalMatchState["dewanPenalties"],
                label: "2. Penampilan keluar gelanggang 10M x 10M",
              },
              {
                field: "senjataJatuhCount" as keyof TgrTunggalMatchState["dewanPenalties"],
                label: "3. Senjata Jatuh, Menyentuh matras",
              },
              {
                field: "atributLepasCount" as keyof TgrTunggalMatchState["dewanPenalties"],
                label: "4. Pakaian tidak sesuai aturan",
              },
              {
                field: "menahanGerakanCount" as keyof TgrTunggalMatchState["dewanPenalties"],
                label: "5. Menahan gerakan lebih dari 5 (lima) detik",
              },
            ].map((item) => {
              const count = Number(dewanPenalties[item.field]) || 0;
              return (
                <div
                  key={item.field}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#020614] border border-slate-800 gap-3"
                >
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold text-slate-200 block leading-snug">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAdjustPenalty(item.field, 1)}
                      disabled={readOnly}
                      title="Beri pengurangan nilai (-0.50)"
                      className="px-2.5 h-7 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-mono font-black text-xs cursor-pointer border border-rose-500/40 active:scale-95 transition-all shadow-sm disabled:opacity-40"
                    >
                      -0.50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPenalty(item.field, -1)}
                      disabled={readOnly || count <= 0}
                      title="Hapus 1 hukuman terakhir"
                      className="px-2.5 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs uppercase cursor-pointer border border-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      clr
                    </button>
                    <span className="min-w-8 h-7 px-2 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 font-mono font-black text-sm text-amber-400">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* DISKUALIFIKASI BUTTON */}
            <div className="pt-1">
              <button
                onClick={handleToggleDq}
                disabled={readOnly}
                className={`w-full py-2 rounded-xl text-xs font-mono font-black uppercase cursor-pointer active:scale-95 transition-all ${
                  dewanPenalties.diskualifikasi 
                    ? "bg-rose-600 text-white shadow-[0_0_12px_#ef4444]" 
                    : "bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-rose-900/60"
                }`}
                title="Diskualifikasi Pesilat"
              >
                {dewanPenalties.diskualifikasi ? "BATAL DISKUALIFIKASI" : "DISKUALIFIKASI PESILAT (DIS)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS: PENGUMUMAN HASIL & SAHKAN */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-cyan-500/20">
          <div className="text-xs font-mono text-slate-400">
            Kalkulasi: Rata-rata Skor ({result.medianScore.toFixed(3)}) - Hukuman ({result.totalPenaltiDewan.toFixed(3)}) = <strong className="text-amber-400 font-mono text-sm">{result.finalScore.toFixed(3)}</strong>
          </div>

          <button
            onClick={() => {
              try { soundEffects.playGong(); } catch {}
              onAnnounceWinner();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-sans font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95"
          >
            <span>SAHKAN & UMUMKAN NILAI AKHIR</span>
          </button>
        </div>
      )}
    </div>
  );
};
