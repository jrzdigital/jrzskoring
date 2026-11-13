import React, { useState, useEffect } from 'react';
import { CornerColor, TechniqueType } from '../types/silat';
import { TECHNIQUE_CONFIG } from '../utils/rules';
import { playScoreChime } from '../utils/audio';
import { Users, CheckCircle, Zap } from 'lucide-react';

interface JudgeVoteItem {
  judgeId: number; // 1, 2, 3
  corner: CornerColor;
  technique: TechniqueType;
  timestamp: number;
}

interface JudgeConsensusPanelProps {
  onValidatedPoint: (corner: CornerColor, technique: TechniqueType, judges: number[]) => void;
  redName: string;
  blueName: string;
  audioEnabled: boolean;
}

export const JudgeConsensusPanel: React.FC<JudgeConsensusPanelProps> = ({
  onValidatedPoint,
  redName,
  blueName,
  audioEnabled,
}) => {
  const [votes, setVotes] = useState<JudgeVoteItem[]>([]);
  const [lastConsensus, setLastConsensus] = useState<{
    corner: CornerColor;
    technique: TechniqueType;
    judges: number[];
    timestamp: number;
  } | null>(null);

  // Auto clean stale votes (> 1.8 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setVotes((prev) => prev.filter((v) => now - v.timestamp < 1800));
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // Handle a judge press
  const handleJudgeVote = (judgeId: number, corner: CornerColor, technique: TechniqueType) => {
    const now = Date.now();
    const newVote: JudgeVoteItem = { judgeId, corner, technique, timestamp: now };

    // Find other recent votes for same corner & technique within 1.5s
    const matchingVotes = votes.filter(
      (v) =>
        v.corner === corner &&
        v.technique === technique &&
        v.judgeId !== judgeId &&
        now - v.timestamp <= 1500
    );

    if (matchingVotes.length >= 1) {
      // Consensus Reached! (At least 2 judges)
      const participatingJudges = [
        ...matchingVotes.map((v) => v.judgeId),
        judgeId,
      ];
      const uniqueJudges = Array.from(new Set(participatingJudges));

      if (audioEnabled) {
        playScoreChime(TECHNIQUE_CONFIG[technique].points);
      }

      onValidatedPoint(corner, technique, uniqueJudges);
      setLastConsensus({
        corner,
        technique,
        judges: uniqueJudges,
        timestamp: now,
      });

      // Clear matching votes to prevent double trigger
      setVotes((prev) =>
        prev.filter(
          (v) =>
            !(
              v.corner === corner &&
              v.technique === technique &&
              now - v.timestamp <= 1500
            )
        )
      );
    } else {
      // Store single vote waiting for second judge
      setVotes((prev) => [
        ...prev.filter(
          (v) => !(v.judgeId === judgeId && v.corner === corner)
        ),
        newVote,
      ]);
    }
  };

  // Check if a judge currently has an active vote in the window
  const getJudgeActiveVote = (judgeId: number) => {
    const now = Date.now();
    return votes.find((v) => v.judgeId === judgeId && now - v.timestamp < 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Sistem Konsensus 3 Juri PERSILAT (Sistem Digital Resmi)
            </h3>
            <p className="text-xs text-neutral-500">
              Poin sah otomatis masuk jika minimal 2 dari 3 juri menekan teknik yang sama dalam 1,5 detik.
            </p>
          </div>
        </div>

        {lastConsensus && Date.now() - lastConsensus.timestamp < 3500 && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold animate-bounce ${
              lastConsensus.corner === 'red'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>
              Konsensus Sah! +{TECHNIQUE_CONFIG[lastConsensus.technique].points} {TECHNIQUE_CONFIG[lastConsensus.technique].label} (Juri {lastConsensus.judges.join(' & ')})
            </span>
          </div>
        )}
      </div>

      {/* 3 Judges Status Indicator Lamps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((judgeId) => {
          const activeVote = getJudgeActiveVote(judgeId);
          return (
            <div
              key={judgeId}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                activeVote
                  ? activeVote.corner === 'red'
                    ? 'border-red-400 bg-red-50/50 shadow-sm'
                    : 'border-blue-400 bg-blue-50/50 shadow-sm'
                  : 'border-neutral-200 bg-neutral-50/50'
              }`}
            >
              {/* Judge Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-700 uppercase tracking-wider">
                  JURI {judgeId}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    activeVote
                      ? activeVote.corner === 'red'
                        ? 'bg-red-600 animate-ping'
                        : 'bg-blue-600 animate-ping'
                      : 'bg-neutral-300'
                  }`}
                />
              </div>

              {/* Current Active Vote Status */}
              <div className="text-center py-1.5 my-1 rounded bg-white border border-neutral-100 min-h-[36px] flex items-center justify-center">
                {activeVote ? (
                  <span
                    className={`text-xs font-bold ${
                      activeVote.corner === 'red' ? 'text-red-700' : 'text-blue-700'
                    }`}
                  >
                    {activeVote.corner === 'red' ? 'Merah' : 'Biru'}:{' '}
                    {TECHNIQUE_CONFIG[activeVote.technique].label} (+{TECHNIQUE_CONFIG[activeVote.technique].points})
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400">Siap Input</span>
                )}
              </div>

              {/* Action Buttons for this Judge */}
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {/* Red Strikes */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-red-700 text-center">Merah</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'red', 'pukulan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                      title="Pukulan Merah (+1)"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'red', 'tendangan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                      title="Tendangan Merah (+2)"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'red', 'jatuhan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                      title="Jatuhan Merah (+3)"
                    >
                      +3
                    </button>
                  </div>
                </div>

                {/* Blue Strikes */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-blue-700 text-center">Biru</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'blue', 'pukulan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                      title="Pukulan Biru (+1)"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'blue', 'tendangan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                      title="Tendangan Biru (+2)"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => handleJudgeVote(judgeId, 'blue', 'jatuhan')}
                      className="py-1 px-1 rounded text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                      title="Jatuhan Biru (+3)"
                    >
                      +3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Test / Multi-Judge Consensus Shortcuts */}
      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Simulasi Cepat Konsensus 2 Juri:</span>
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              handleJudgeVote(1, 'red', 'tendangan');
              setTimeout(() => handleJudgeVote(2, 'red', 'tendangan'), 150);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-md bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
          >
            J1+J2: Tendangan Merah (+2)
          </button>
          <button
            onClick={() => {
              handleJudgeVote(1, 'red', 'jatuhan');
              setTimeout(() => handleJudgeVote(3, 'red', 'jatuhan'), 150);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-md bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
          >
            J1+J3: Jatuhan Merah (+3)
          </button>
          <button
            onClick={() => {
              handleJudgeVote(2, 'blue', 'tendangan');
              setTimeout(() => handleJudgeVote(3, 'blue', 'tendangan'), 150);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors"
          >
            J2+J3: Tendangan Biru (+2)
          </button>
          <button
            onClick={() => {
              handleJudgeVote(1, 'blue', 'jatuhan');
              setTimeout(() => handleJudgeVote(2, 'blue', 'jatuhan'), 150);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors"
          >
            J1+J2: Jatuhan Biru (+3)
          </button>
        </div>
      </div>
    </div>
  );
};
