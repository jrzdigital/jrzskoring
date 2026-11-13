import React, { useState, useEffect, useRef } from 'react';
import {
  TandingMatch,
  Corner,
  ActiveJuriVote,
} from '../types/silat';
import { playPointSound } from '../utils/audio';
import { CheckCircle2, Users, Radio, ThumbsUp, Sparkles } from 'lucide-react';

interface JuriPadViewProps {
  match: TandingMatch;
  onUpdateMatch: (updater: (prev: TandingMatch) => TandingMatch) => void;
}

export const JuriPadView: React.FC<JuriPadViewProps> = ({
  match,
  onUpdateMatch,
}) => {
  const [selectedJuri, setSelectedJuri] = useState<1 | 2 | 3>(1);
  const [votes, setVotes] = useState<ActiveJuriVote[]>([]);
  const [lastValidated, setLastValidated] = useState<{
    corner: Corner;
    action: 'PUKULAN' | 'TENDANGAN';
    points: number;
    juries: number[];
  } | null>(null);

  // Clear expired votes after 2.0 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setVotes((prev) => prev.filter((v) => now - v.timestamp < 2000));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Consensus validation checker
  const registerJuriVote = (
    juryId: 1 | 2 | 3,
    corner: Corner,
    action: 'PUKULAN' | 'TENDANGAN'
  ) => {
    const now = Date.now();
    const newVote: ActiveJuriVote = {
      juryId,
      corner,
      action,
      timestamp: now,
    };

    // Filter active recent votes from OTHER juries with same corner & action within 2 seconds
    const matchingVotes = votes.filter(
      (v) =>
        v.corner === corner &&
        v.action === action &&
        v.juryId !== juryId &&
        now - v.timestamp < 2000
    );

    if (matchingVotes.length >= 1) {
      // CONSENSUS ACHIEVED! (At least 2 juries agreed)
      const points = action === 'PUKULAN' ? 1 : 2;
      const agreeingJuries = [juryId, ...matchingVotes.map((v) => v.juryId)];

      playPointSound(points > 1);

      // Award points to match
      const round = match.currentRound;
      onUpdateMatch((prev) => {
        const fighterKey = corner === 'MERAH' ? 'merah' : 'biru';
        const roundDetail = { ...prev[fighterKey].roundScores[round] };
        if (action === 'PUKULAN') roundDetail.pukulan += 1;
        if (action === 'TENDANGAN') roundDetail.tendangan += 1;

        const log = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString('id-ID'),
          round,
          corner,
          action,
          pointsDelta: points,
          label: `Konsensus Juri: ${action} (+${points}) [Juri ${agreeingJuries.join(', ')}]`,
          juryVoters: agreeingJuries,
        };

        return {
          ...prev,
          [fighterKey]: {
            ...prev[fighterKey],
            roundScores: {
              ...prev[fighterKey].roundScores,
              [round]: roundDetail,
            },
          },
          actionLogs: [...prev.actionLogs, log],
          updatedAt: new Date().toISOString(),
        };
      });

      // Show validated banner
      setLastValidated({
        corner,
        action,
        points,
        juries: agreeingJuries,
      });
      setTimeout(() => setLastValidated(null), 3000);

      // Clear matching votes
      setVotes((prev) =>
        prev.filter((v) => !(v.corner === corner && v.action === action))
      );
    } else {
      // Just record vote waiting for partner jury within 2s
      setVotes((prev) => [
        ...prev.filter(
          (v) => !(v.juryId === juryId && v.corner === corner && v.action === action)
        ),
        newVote,
      ]);
    }
  };

  const getVoteStatus = (juryId: 1 | 2 | 3, corner: Corner, action: 'PUKULAN' | 'TENDANGAN') => {
    return votes.some(
      (v) =>
        v.juryId === juryId &&
        v.corner === corner &&
        v.action === action &&
        Date.now() - v.timestamp < 2000
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 select-none">
      {/* Juri Mode Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-athletic text-2xl font-bold text-amber-400">
              TERMINAL WASIT JURI
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              SISTEM KONSENSUS PERSILAT 2022
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Poin serangan (Pukulan +1, Tendangan +2) otomatis sah jika minimal 2 dari 3 Juri menekan tombol dalam rentang 2 detik.
          </p>
        </div>

        {/* Active Jury Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Posisi Anda:
          </span>
          {[1, 2, 3].map((jId) => (
            <button
              key={jId}
              onClick={() => setSelectedJuri(jId as 1 | 2 | 3)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedJuri === jId
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Juri {jId}
            </button>
          ))}
        </div>
      </div>

      {/* Consensus Live Monitor & Status Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Lampu Indikator Sinyal Juri Gelanggang (Realtime)
          </span>
          <span className="text-xs text-slate-500">
            Babak {match.currentRound} · Jeda Konsensus: 2.0 Detik
          </span>
        </div>

        {/* 3-Jury Signal Lights Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((jId) => {
            const isSelf = selectedJuri === jId;
            const hasMerahPukulan = getVoteStatus(jId as 1 | 2 | 3, 'MERAH', 'PUKULAN');
            const hasMerahTendangan = getVoteStatus(jId as 1 | 2 | 3, 'MERAH', 'TENDANGAN');
            const hasBiruPukulan = getVoteStatus(jId as 1 | 2 | 3, 'BIRU', 'PUKULAN');
            const hasBiruTendangan = getVoteStatus(jId as 1 | 2 | 3, 'BIRU', 'TENDANGAN');

            return (
              <div
                key={jId}
                className={`bg-slate-900/90 border rounded-xl p-3.5 transition-all ${
                  isSelf
                    ? 'border-amber-500/80 shadow-lg shadow-amber-950/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-athletic font-bold text-sm text-slate-200">
                    JURI {jId} {isSelf && '(Perangkat Ini)'}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      hasMerahPukulan || hasMerahTendangan || hasBiruPukulan || hasBiruTendangan
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {/* Merah status for this judge */}
                  <div className="bg-red-950/50 border border-red-900/40 rounded p-1.5">
                    <span className="text-[10px] text-red-300 block font-semibold">Merah</span>
                    <span className="font-bold text-white text-[11px]">
                      {hasMerahPukulan ? 'Pukulan (1)' : hasMerahTendangan ? 'Tendangan (2)' : '-'}
                    </span>
                  </div>

                  {/* Biru status for this judge */}
                  <div className="bg-blue-950/50 border border-blue-900/40 rounded p-1.5">
                    <span className="text-[10px] text-blue-300 block font-semibold">Biru</span>
                    <span className="font-bold text-white text-[11px]">
                      {hasBiruPukulan ? 'Pukulan (1)' : hasBiruTendangan ? 'Tendangan (2)' : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validated Consensus Flash Toast */}
        {lastValidated && (
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950 via-emerald-900/80 to-slate-900 border border-emerald-500 rounded-xl flex items-center justify-between animate-fade-in shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  POIN SAH MASUK! (KONSENSUS JURI)
                </div>
                <div className="text-sm font-bold text-white">
                  Sudut {lastValidated.corner === 'MERAH' ? 'Merah' : 'Biru'}: {lastValidated.action} (+{lastValidated.points})
                </div>
              </div>
            </div>
            <div className="text-xs text-emerald-200 font-semibold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-700">
              Disepakati Juri {lastValidated.juries.join(' & ')}
            </div>
          </div>
        )}
      </div>

      {/* TACTILE JUDGE CONTROLLER PADS (OPTIMIZED FOR TOUCH & TABLET) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SUDUT MERAH JUDGE PAD */}
        <div className="bg-gradient-to-br from-red-950 via-slate-950 to-slate-950 border-2 border-red-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-red-800/60 pb-3">
              <span className="font-athletic text-2xl font-black text-red-300 uppercase tracking-wide">
                SUDUT MERAH
              </span>
              <span className="text-xs font-bold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-md border border-red-800">
                Juri {selectedJuri}
              </span>
            </div>
            <h3 className="font-bold text-xl text-white mt-2 truncate">
              {match.merah.name}
            </h3>
            <p className="text-xs text-red-200/80 truncate">
              {match.merah.kontingen}
            </p>
          </div>

          {/* Big Tap Buttons */}
          <div className="space-y-4">
            {/* Pukulan Merah */}
            <button
              onClick={() => registerJuriVote(selectedJuri, 'MERAH', 'PUKULAN')}
              className={`w-full py-6 px-4 rounded-2xl font-athletic font-extrabold text-white text-xl sm:text-2xl border-2 transition-all active:scale-[0.97] flex items-center justify-between shadow-xl ${
                getVoteStatus(selectedJuri, 'MERAH', 'PUKULAN')
                  ? 'bg-red-500 border-white shadow-red-500/50'
                  : 'bg-red-700 hover:bg-red-600 border-red-500'
              }`}
            >
              <div className="text-left">
                <span className="block text-xs uppercase tracking-widest text-red-200 font-semibold">
                  Serangan Pukulan
                </span>
                <span>PUKULAN SAH</span>
              </div>
              <span className="font-led text-4xl font-black text-white">+1</span>
            </button>

            {/* Tendangan Merah */}
            <button
              onClick={() => registerJuriVote(selectedJuri, 'MERAH', 'TENDANGAN')}
              className={`w-full py-6 px-4 rounded-2xl font-athletic font-extrabold text-white text-xl sm:text-2xl border-2 transition-all active:scale-[0.97] flex items-center justify-between shadow-xl ${
                getVoteStatus(selectedJuri, 'MERAH', 'TENDANGAN')
                  ? 'bg-red-500 border-white shadow-red-500/50'
                  : 'bg-red-800 hover:bg-red-700 border-red-500'
              }`}
            >
              <div className="text-left">
                <span className="block text-xs uppercase tracking-widest text-red-200 font-semibold">
                  Serangan Tendangan
                </span>
                <span>TENDANGAN SAH</span>
              </div>
              <span className="font-led text-4xl font-black text-white">+2</span>
            </button>
          </div>

          <div className="text-center text-xs text-red-400/80">
            Tekan saat serangan Merah masuk sah dan bertenaga tanpa terhalang.
          </div>
        </div>

        {/* SUDUT BIRU JUDGE PAD */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950 border-2 border-blue-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-3">
              <span className="font-athletic text-2xl font-black text-blue-300 uppercase tracking-wide">
                SUDUT BIRU
              </span>
              <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800">
                Juri {selectedJuri}
              </span>
            </div>
            <h3 className="font-bold text-xl text-white mt-2 truncate">
              {match.biru.name}
            </h3>
            <p className="text-xs text-blue-200/80 truncate">
              {match.biru.kontingen}
            </p>
          </div>

          {/* Big Tap Buttons */}
          <div className="space-y-4">
            {/* Pukulan Biru */}
            <button
              onClick={() => registerJuriVote(selectedJuri, 'BIRU', 'PUKULAN')}
              className={`w-full py-6 px-4 rounded-2xl font-athletic font-extrabold text-white text-xl sm:text-2xl border-2 transition-all active:scale-[0.97] flex items-center justify-between shadow-xl ${
                getVoteStatus(selectedJuri, 'BIRU', 'PUKULAN')
                  ? 'bg-blue-500 border-white shadow-blue-500/50'
                  : 'bg-blue-700 hover:bg-blue-600 border-blue-500'
              }`}
            >
              <div className="text-left">
                <span className="block text-xs uppercase tracking-widest text-blue-200 font-semibold">
                  Serangan Pukulan
                </span>
                <span>PUKULAN SAH</span>
              </div>
              <span className="font-led text-4xl font-black text-white">+1</span>
            </button>

            {/* Tendangan Biru */}
            <button
              onClick={() => registerJuriVote(selectedJuri, 'BIRU', 'TENDANGAN')}
              className={`w-full py-6 px-4 rounded-2xl font-athletic font-extrabold text-white text-xl sm:text-2xl border-2 transition-all active:scale-[0.97] flex items-center justify-between shadow-xl ${
                getVoteStatus(selectedJuri, 'BIRU', 'TENDANGAN')
                  ? 'bg-blue-500 border-white shadow-blue-500/50'
                  : 'bg-blue-800 hover:bg-blue-700 border-blue-500'
              }`}
            >
              <div className="text-left">
                <span className="block text-xs uppercase tracking-widest text-blue-200 font-semibold">
                  Serangan Tendangan
                </span>
                <span>TENDANGAN SAH</span>
              </div>
              <span className="font-led text-4xl font-black text-white">+2</span>
            </button>
          </div>

          <div className="text-center text-xs text-blue-400/80">
            Tekan saat serangan Biru masuk sah dan bertenaga tanpa terhalang.
          </div>
        </div>
      </div>

      {/* Simulator Shortcut for Testing Multiple Juries */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
        <span className="font-bold text-amber-400 mr-2">Simulasi Cepat 2 Juri:</span>
        <span className="text-slate-400">
          Untuk menguji sistem konsensus tanpa perlu 2 perangkat terpisah, klik tombol di bawah untuk menyimulasikan Juri 2 & Juri 3 menekan bersamaan:
        </span>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => {
              registerJuriVote(2, 'MERAH', 'PUKULAN');
              setTimeout(() => registerJuriVote(3, 'MERAH', 'PUKULAN'), 200);
            }}
            className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 rounded font-semibold"
          >
            Simulasi Konsensus: Pukulan Merah
          </button>
          <button
            onClick={() => {
              registerJuriVote(2, 'MERAH', 'TENDANGAN');
              setTimeout(() => registerJuriVote(3, 'MERAH', 'TENDANGAN'), 200);
            }}
            className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 rounded font-semibold"
          >
            Simulasi Konsensus: Tendangan Merah
          </button>
          <button
            onClick={() => {
              registerJuriVote(2, 'BIRU', 'PUKULAN');
              setTimeout(() => registerJuriVote(3, 'BIRU', 'PUKULAN'), 200);
            }}
            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 rounded font-semibold"
          >
            Simulasi Konsensus: Pukulan Biru
          </button>
          <button
            onClick={() => {
              registerJuriVote(2, 'BIRU', 'TENDANGAN');
              setTimeout(() => registerJuriVote(3, 'BIRU', 'TENDANGAN'), 200);
            }}
            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 rounded font-semibold"
          >
            Simulasi Konsensus: Tendangan Biru
          </button>
        </div>
      </div>
    </div>
  );
};
