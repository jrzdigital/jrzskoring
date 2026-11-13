import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  MatchState, 
  Corner, 
  TandingScoreType, 
  SCORE_VALUES, 
  SCORE_LABELS,
  HukumanType, 
  HUKUMAN_POINTS, 
  HUKUMAN_LABELS,
  WinDecision, 
  JudgeVote, 
  ScoreLogItem,
  SeniPerformance
} from '../types/silat';
import { silatSound } from '../utils/audio';

const STORAGE_KEY = 'silatscore_pro_match_state';
const HISTORY_KEY = 'silatscore_pro_history';
const SENI_STORAGE_KEY = 'silatscore_pro_seni_state';

const INITIAL_MATCH_STATE: MatchState = {
  id: 'PARTAI-01-' + Date.now().toString(36),
  metadata: {
    arena: 'Gelanggang A',
    matchNumber: 14,
    roundPhase: 'Semifinal',
    championshipName: 'Kejuaraan Nasional Pencak Silat IPSI 2026',
    date: new Date().toISOString().split('T')[0],
    refereeName: 'Drs. Bambang Wijaya (Wasit Nasional)',
    juryNames: ['Siti Rahma (DKI)', 'Agus Santoso (Jabar)', 'I Made Suartana (Bali)'],
    chairmanName: 'H. Suryadi, M.Pd (Dewan Wasit Juri)',
  },
  category: 'TANDING',
  currentRound: 1,
  status: 'IDLE',
  roundTimeLeft: 120,
  roundDuration: 120,
  restTimeLeft: 60,
  blue: {
    fighter: {
      id: 'f-blue',
      name: 'Satria Pratama',
      contingent: 'DKI Jakarta',
      corner: 'BLUE',
      gender: 'PUTRA',
      weightClass: 'Kelas C Putra (55 - 60 kg)',
    },
    roundPoints: { round1: 0, round2: 0, round3: 0 },
    penalties: {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false,
    },
    totalPenaltyPoints: 0,
    totalScore: 0,
    takedownsCount: 0,
    strikesCount: 0,
  },
  red: {
    fighter: {
      id: 'f-red',
      name: 'Bayu Wisesa',
      contingent: 'Jawa Barat',
      corner: 'RED',
      gender: 'PUTRA',
      weightClass: 'Kelas C Putra (55 - 60 kg)',
    },
    roundPoints: { round1: 0, round2: 0, round3: 0 },
    penalties: {
      binaan1: false,
      binaan2: false,
      teguran1: false,
      teguran2: false,
      peringatan1: false,
      peringatan2: false,
      disqualified: false,
    },
    totalPenaltyPoints: 0,
    totalScore: 0,
    takedownsCount: 0,
    strikesCount: 0,
  },
  winner: null,
  winDecision: null,
  logs: [],
  activeVotes: [],
  activeJudgeIndicators: {
    judge1: { blue: null, red: null, time: 0 },
    judge2: { blue: null, red: null, time: 0 },
    judge3: { blue: null, red: null, time: 0 },
  },
};

const INITIAL_SENI_STATE: SeniPerformance = {
  id: 'SENI-01-' + Date.now().toString(36),
  metadata: {
    arena: 'Gelanggang A',
    matchNumber: 5,
    roundPhase: 'Babak Final',
    championshipName: 'Kejuaraan Nasional Pencak Silat IPSI 2026',
    date: new Date().toISOString().split('T')[0],
    refereeName: 'Drs. Bambang Wijaya',
    juryNames: ['Juri 1 (Kebenaran)', 'Juri 2 (Kebenaran)', 'Juri 3 (Kemantapan)'],
    chairmanName: 'H. Suryadi, M.Pd',
  },
  category: 'SENI_TUNGGAL',
  participantName: 'Arya Senopati',
  contingent: 'DI Yogyakarta',
  gender: 'PUTRA',
  ageGroup: 'DEWASA',
  targetDurationSeconds: 180, // 3:00
  elapsedSeconds: 0,
  status: 'IDLE',
  judgeScores: [
    { judgeId: 1, movementAccuracy: 9.90, staminaSoul: 0.08, totalScore: 9.98 },
    { judgeId: 2, movementAccuracy: 9.89, staminaSoul: 0.07, totalScore: 9.96 },
    { judgeId: 3, movementAccuracy: 9.90, staminaSoul: 0.08, totalScore: 9.98 },
  ],
  penalties: {
    timePenalty: 0,
    outOfArena: 0,
    droppedWeapon: 0,
    attireViolation: 0,
    disqualified: false,
  },
  finalScore: 9.97,
};

export type AppView = 'SCOREBOARD' | 'OPERATOR' | 'JUDGE_PAD' | 'SENI' | 'HISTORY' | 'RULES';

interface MatchContextType {
  match: MatchState;
  seniMatch: SeniPerformance;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  activeJudgeId: 1 | 2 | 3;
  setActiveJudgeId: (id: 1 | 2 | 3) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  adjustTimer: (secondsDelta: number) => void;
  setRoundDuration: (seconds: number) => void;
  setRound: (round: number) => void;
  nextRound: () => void;
  
  // Scoring Actions
  submitJudgeVote: (judgeId: 1 | 2 | 3, corner: Corner, scoreType: TandingScoreType) => void;
  submitOperatorScore: (corner: Corner, scoreType: TandingScoreType) => void;
  applyPenalty: (corner: Corner, penaltyType: HukumanType) => void;
  removePenalty: (corner: Corner, penaltyType: HukumanType) => void;
  undoLastAction: () => void;
  
  // Match Management
  declareWinner: (winner: Corner | 'DRAW', decision: WinDecision) => void;
  resetMatch: () => void;
  updateMatchMetadata: (metadata: Partial<MatchState['metadata']>) => void;
  updateFighters: (blueData: Partial<MatchState['blue']['fighter']>, redData: Partial<MatchState['red']['fighter']>) => void;
  loadMatchFromHistory: (savedMatch: MatchState) => void;
  
  // Seni Management
  updateSeniState: (updates: Partial<SeniPerformance>) => void;
  startSeniTimer: () => void;
  pauseSeniTimer: () => void;
  resetSeniTimer: () => void;
  calculateSeniScore: () => void;
  
  // Match History
  history: MatchState[];
  clearHistory: () => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [match, setMatch] = useState<MatchState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MATCH_STATE;
    } catch {
      return INITIAL_MATCH_STATE;
    }
  });

  const [seniMatch, setSeniMatch] = useState<SeniPerformance>(() => {
    try {
      const saved = localStorage.getItem(SENI_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SENI_STATE;
    } catch {
      return INITIAL_SENI_STATE;
    }
  });

  const [history, setHistory] = useState<MatchState[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeView, setActiveView] = useState<AppView>('SCOREBOARD');
  const [activeJudgeId, setActiveJudgeId] = useState<1 | 2 | 3>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync sound state
  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      silatSound.setEnabled(next);
      return next;
    });
  };

  // Save state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch {
      // ignore
    }
  }, [match]);

  useEffect(() => {
    try {
      localStorage.setItem(SENI_STORAGE_KEY, JSON.stringify(seniMatch));
    } catch {
      // ignore
    }
  }, [seniMatch]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Recalculate totals
  const recalculateMatchTotals = useCallback((m: MatchState): MatchState => {
    const calcCorner = (cornerStats: MatchState['blue']): typeof cornerStats => {
      const roundSum = cornerStats.roundPoints.round1 + cornerStats.roundPoints.round2 + cornerStats.roundPoints.round3;
      let penaltyTotal = 0;
      if (cornerStats.penalties.teguran1) penaltyTotal += HUKUMAN_POINTS.TEGURAN_1;
      if (cornerStats.penalties.teguran2) penaltyTotal += HUKUMAN_POINTS.TEGURAN_2;
      if (cornerStats.penalties.peringatan1) penaltyTotal += HUKUMAN_POINTS.PERINGATAN_1;
      if (cornerStats.penalties.peringatan2) penaltyTotal += HUKUMAN_POINTS.PERINGATAN_2;

      const total = roundSum + penaltyTotal;
      return {
        ...cornerStats,
        totalPenaltyPoints: penaltyTotal,
        totalScore: total,
      };
    };

    return {
      ...m,
      blue: calcCorner(m.blue),
      red: calcCorner(m.red),
    };
  }, []);

  // Tanding Timer Interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (match.status === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setMatch(prev => {
          if (prev.roundTimeLeft <= 1) {
            // Round finished
            silatSound.playBuzzer();
            silatSound.playGong();
            return {
              ...prev,
              roundTimeLeft: 0,
              status: prev.currentRound < 3 ? 'REST' : 'FINISHED',
              restTimeLeft: 60,
            };
          }
          return {
            ...prev,
            roundTimeLeft: prev.roundTimeLeft - 1,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match.status]);

  // Seni Timer Interval
  const seniTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (seniMatch.status === 'RUNNING') {
      seniTimerRef.current = setInterval(() => {
        setSeniMatch(prev => {
          const nextElapsed = prev.elapsedSeconds + 1;
          // Buzzer at 3 minutes exactly (180s)
          if (nextElapsed === 180) {
            silatSound.playWhistle();
          }
          return {
            ...prev,
            elapsedSeconds: nextElapsed,
          };
        });
      }, 1000);
    } else {
      if (seniTimerRef.current) clearInterval(seniTimerRef.current);
    }

    return () => {
      if (seniTimerRef.current) clearInterval(seniTimerRef.current);
    };
  }, [seniMatch.status]);

  // Clean stale active judge visual indicators after 1.8 seconds
  useEffect(() => {
    const indicatorInterval = setInterval(() => {
      const now = Date.now();
      setMatch(prev => {
        let changed = false;
        const newIndicators = { ...prev.activeJudgeIndicators };

        (['judge1', 'judge2', 'judge3'] as const).forEach(j => {
          if (newIndicators[j].time > 0 && now - newIndicators[j].time > 1800) {
            newIndicators[j] = { blue: null, red: null, time: 0 };
            changed = true;
          }
        });

        if (!changed) return prev;
        return {
          ...prev,
          activeJudgeIndicators: newIndicators,
        };
      });
    }, 500);

    return () => clearInterval(indicatorInterval);
  }, []);

  // Timer controls
  const startTimer = () => {
    silatSound.playWhistle();
    setMatch(prev => ({ ...prev, status: 'RUNNING' }));
  };

  const pauseTimer = () => {
    silatSound.playWhistle();
    setMatch(prev => ({ ...prev, status: 'PAUSED' }));
  };

  const resetTimer = () => {
    setMatch(prev => ({
      ...prev,
      status: 'IDLE',
      roundTimeLeft: prev.roundDuration,
      restTimeLeft: 60,
    }));
  };

  const adjustTimer = (secondsDelta: number) => {
    setMatch(prev => ({
      ...prev,
      roundTimeLeft: Math.max(0, prev.roundTimeLeft + secondsDelta),
    }));
  };

  const setRoundDuration = (seconds: number) => {
    setMatch(prev => ({
      ...prev,
      roundDuration: seconds,
      roundTimeLeft: prev.status === 'IDLE' ? seconds : prev.roundTimeLeft,
    }));
  };

  const setRound = (roundNumber: number) => {
    silatSound.playGong();
    setMatch(prev => ({
      ...prev,
      currentRound: roundNumber,
      status: 'IDLE',
      roundTimeLeft: prev.roundDuration,
    }));
  };

  const nextRound = () => {
    silatSound.playGong();
    setMatch(prev => {
      const nextR = Math.min(3, prev.currentRound + 1);
      return {
        ...prev,
        currentRound: nextR,
        status: 'IDLE',
        roundTimeLeft: prev.roundDuration,
      };
    });
  };

  // PERSILAT / IPSI 2-out-of-3 Judge Consensus Rule
  const submitJudgeVote = (judgeId: 1 | 2 | 3, corner: Corner, scoreType: TandingScoreType) => {
    silatSound.playTap(corner === 'BLUE');
    const now = Date.now();
    const vote: JudgeVote = {
      judgeId,
      corner,
      scoreType,
      timestamp: now,
      applied: false,
    };

    setMatch(prev => {
      // Update visual indicator for this judge
      const key = `judge${judgeId}` as 'judge1' | 'judge2' | 'judge3';
      const updatedIndicators = {
        ...prev.activeJudgeIndicators,
        [key]: {
          blue: corner === 'BLUE' ? scoreType : null,
          red: corner === 'RED' ? scoreType : null,
          time: now,
        },
      };

      // Filter recent votes within 1.5 seconds window for consensus
      const toleranceWindowMs = 1500;
      const recentVotes = [...prev.activeVotes.filter(v => now - v.timestamp <= toleranceWindowMs && !v.applied), vote];

      // Check if another judge voted for the same corner and same score type
      const matchingVotes = recentVotes.filter(
        v => v.corner === corner && v.scoreType === scoreType && v.judgeId !== judgeId
      );

      let updatedMatch: MatchState = {
        ...prev,
        activeVotes: recentVotes,
        activeJudgeIndicators: updatedIndicators,
      };

      if (matchingVotes.length >= 1) {
        // Consensus achieved (2 of 3 judges agree)!
        silatSound.playScoreValidation();
        const agreeingJudges = [judgeId, matchingVotes[0].judgeId].sort();
        const points = SCORE_VALUES[scoreType];
        const roundKey = `round${prev.currentRound}` as keyof MatchState['blue']['roundPoints'];

        // Mark matching votes as applied
        const appliedVotes = recentVotes.map(v => 
          (v.judgeId === judgeId || v.judgeId === matchingVotes[0].judgeId) ? { ...v, applied: true } : v
        );

        const targetCorner = corner === 'BLUE' ? 'blue' : 'red';
        const updatedCornerStats = {
          ...prev[targetCorner],
          roundPoints: {
            ...prev[targetCorner].roundPoints,
            [roundKey]: prev[targetCorner].roundPoints[roundKey] + points,
          },
          strikesCount: prev[targetCorner].strikesCount + 1,
        };

        const logEntry: ScoreLogItem = {
          id: 'log-' + now,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          round: prev.currentRound,
          corner,
          description: `${SCORE_LABELS[scoreType]} (Sah Juri ${agreeingJudges.join(' & ')})`,
          pointsDelta: points,
          source: 'JUDGE_CONSENSUS',
          judgeVotes: agreeingJudges,
        };

        updatedMatch = {
          ...updatedMatch,
          [targetCorner]: updatedCornerStats,
          logs: [logEntry, ...prev.logs],
          activeVotes: appliedVotes,
        };

        return recalculateMatchTotals(updatedMatch);
      }

      return updatedMatch;
    });
  };

  // Direct Operator / Dewan Score (Used for Jatuhan Sah +3 or referee manual entry)
  const submitOperatorScore = (corner: Corner, scoreType: TandingScoreType) => {
    silatSound.playScoreValidation();
    const now = Date.now();
    const points = SCORE_VALUES[scoreType];
    const roundKey = `round${match.currentRound}` as keyof MatchState['blue']['roundPoints'];
    const targetCorner = corner === 'BLUE' ? 'blue' : 'red';

    setMatch(prev => {
      const updatedCornerStats = {
        ...prev[targetCorner],
        roundPoints: {
          ...prev[targetCorner].roundPoints,
          [roundKey]: prev[targetCorner].roundPoints[roundKey] + points,
        },
        takedownsCount: scoreType === 'JATUHAN' ? prev[targetCorner].takedownsCount + 1 : prev[targetCorner].takedownsCount,
        strikesCount: prev[targetCorner].strikesCount + 1,
      };

      const logEntry: ScoreLogItem = {
        id: 'op-' + now,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: prev.currentRound,
        corner,
        description: `${SCORE_LABELS[scoreType]} (Dewan / Wasit)`,
        pointsDelta: points,
        source: 'DEWAN_OPERATOR',
      };

      return recalculateMatchTotals({
        ...prev,
        [targetCorner]: updatedCornerStats,
        logs: [logEntry, ...prev.logs],
      });
    });
  };

  // Penalty / Hukuman Management
  const applyPenalty = (corner: Corner, penaltyType: HukumanType) => {
    silatSound.playWhistle();
    const now = Date.now();
    const pointsDelta = HUKUMAN_POINTS[penaltyType];
    const targetCorner = corner === 'BLUE' ? 'blue' : 'red';

    setMatch(prev => {
      const newPenalties = { ...prev[targetCorner].penalties };

      if (penaltyType === 'BINAAN_1') newPenalties.binaan1 = true;
      if (penaltyType === 'BINAAN_2') newPenalties.binaan2 = true;
      if (penaltyType === 'TEGURAN_1') newPenalties.teguran1 = true;
      if (penaltyType === 'TEGURAN_2') newPenalties.teguran2 = true;
      if (penaltyType === 'PERINGATAN_1') newPenalties.peringatan1 = true;
      if (penaltyType === 'PERINGATAN_2') newPenalties.peringatan2 = true;
      if (penaltyType === 'DISKUALIFIKASI') newPenalties.disqualified = true;

      const logEntry: ScoreLogItem = {
        id: 'pen-' + now,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: prev.currentRound,
        corner,
        description: `Hukuman: ${HUKUMAN_LABELS[penaltyType]}`,
        pointsDelta,
        source: 'HUKUMAN',
      };

      const updated = {
        ...prev,
        [targetCorner]: {
          ...prev[targetCorner],
          penalties: newPenalties,
        },
        logs: [logEntry, ...prev.logs],
      };

      // Auto declare winner if disqualified
      if (penaltyType === 'DISKUALIFIKASI') {
        const opposingCorner: Corner = corner === 'BLUE' ? 'RED' : 'BLUE';
        updated.winner = opposingCorner;
        updated.winDecision = 'MENANG_DISKUALIFIKASI';
        updated.status = 'FINISHED';
      }

      return recalculateMatchTotals(updated);
    });
  };

  const removePenalty = (corner: Corner, penaltyType: HukumanType) => {
    const targetCorner = corner === 'BLUE' ? 'blue' : 'red';
    setMatch(prev => {
      const newPenalties = { ...prev[targetCorner].penalties };

      if (penaltyType === 'BINAAN_1') newPenalties.binaan1 = false;
      if (penaltyType === 'BINAAN_2') newPenalties.binaan2 = false;
      if (penaltyType === 'TEGURAN_1') newPenalties.teguran1 = false;
      if (penaltyType === 'TEGURAN_2') newPenalties.teguran2 = false;
      if (penaltyType === 'PERINGATAN_1') newPenalties.peringatan1 = false;
      if (penaltyType === 'PERINGATAN_2') newPenalties.peringatan2 = false;
      if (penaltyType === 'DISKUALIFIKASI') newPenalties.disqualified = false;

      return recalculateMatchTotals({
        ...prev,
        [targetCorner]: {
          ...prev[targetCorner],
          penalties: newPenalties,
        },
      });
    });
  };

  // Undo last action (Mistake correction)
  const undoLastAction = () => {
    setMatch(prev => {
      if (prev.logs.length === 0) return prev;
      const [lastLog, ...remainingLogs] = prev.logs;
      const targetCorner = lastLog.corner === 'BLUE' ? 'blue' : 'red';
      const roundKey = `round${lastLog.round}` as keyof MatchState['blue']['roundPoints'];

      let updatedCornerStats = { ...prev[targetCorner] };

      if (lastLog.source === 'JUDGE_CONSENSUS' || lastLog.source === 'DEWAN_OPERATOR') {
        updatedCornerStats = {
          ...updatedCornerStats,
          roundPoints: {
            ...updatedCornerStats.roundPoints,
            [roundKey]: Math.max(0, updatedCornerStats.roundPoints[roundKey] - lastLog.pointsDelta),
          },
          strikesCount: Math.max(0, updatedCornerStats.strikesCount - 1),
        };
      } else if (lastLog.source === 'HUKUMAN') {
        // Revert penalty flag if possible
        const desc = lastLog.description;
        const newPenalties = { ...updatedCornerStats.penalties };
        if (desc.includes('Teguran 1')) newPenalties.teguran1 = false;
        else if (desc.includes('Teguran 2')) newPenalties.teguran2 = false;
        else if (desc.includes('Peringatan 1')) newPenalties.peringatan1 = false;
        else if (desc.includes('Peringatan 2')) newPenalties.peringatan2 = false;
        else if (desc.includes('Binaan 1')) newPenalties.binaan1 = false;
        else if (desc.includes('Binaan 2')) newPenalties.binaan2 = false;
        else if (desc.includes('Diskualifikasi')) newPenalties.disqualified = false;

        updatedCornerStats = {
          ...updatedCornerStats,
          penalties: newPenalties,
        };
      }

      return recalculateMatchTotals({
        ...prev,
        [targetCorner]: updatedCornerStats,
        logs: remainingLogs,
      });
    });
  };

  // Declare Winner
  const declareWinner = (winner: Corner | 'DRAW', decision: WinDecision) => {
    silatSound.playGong();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: winner === 'BLUE' ? ['#2563eb', '#60a5fa', '#ffffff'] : ['#dc2626', '#f87171', '#ffffff'],
      });
    } catch {
      // ignore
    }

    setMatch(prev => {
      const finishedMatch: MatchState = {
        ...prev,
        status: 'FINISHED',
        winner,
        winDecision: decision,
      };

      // Add to archive
      setHistory(h => [finishedMatch, ...h.filter(item => item.id !== finishedMatch.id)]);
      return finishedMatch;
    });
  };

  // Reset Match for next fight
  const resetMatch = () => {
    const nextMatchNumber = (match.metadata.matchNumber || 0) + 1;
    const freshState: MatchState = {
      ...INITIAL_MATCH_STATE,
      id: `PARTAI-${nextMatchNumber}-${Date.now().toString(36)}`,
      metadata: {
        ...match.metadata,
        matchNumber: nextMatchNumber,
      },
    };
    setMatch(freshState);
  };

  const updateMatchMetadata = (metadata: Partial<MatchState['metadata']>) => {
    setMatch(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata },
    }));
  };

  const updateFighters = (
    blueData: Partial<MatchState['blue']['fighter']>,
    redData: Partial<MatchState['red']['fighter']>
  ) => {
    setMatch(prev => ({
      ...prev,
      blue: {
        ...prev.blue,
        fighter: { ...prev.blue.fighter, ...blueData },
      },
      red: {
        ...prev.red,
        fighter: { ...prev.red.fighter, ...redData },
      },
    }));
  };

  const loadMatchFromHistory = (savedMatch: MatchState) => {
    setMatch(savedMatch);
    setActiveView('SCOREBOARD');
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  // Seni Methods
  const startSeniTimer = () => {
    silatSound.playWhistle();
    setSeniMatch(prev => ({ ...prev, status: 'RUNNING' }));
  };

  const pauseSeniTimer = () => {
    silatSound.playWhistle();
    setSeniMatch(prev => ({ ...prev, status: 'PAUSED' }));
  };

  const resetSeniTimer = () => {
    setSeniMatch(prev => ({
      ...prev,
      status: 'IDLE',
      elapsedSeconds: 0,
    }));
  };

  const calculateSeniScore = useCallback(() => {
    setSeniMatch(prev => {
      // Mean of judge scores
      const avgJudgeScore = prev.judgeScores.reduce((acc, curr) => acc + curr.totalScore, 0) / prev.judgeScores.length;
      
      // PERSILAT Time penalty rule:
      // Standard target is 3:00 (180s).
      // Toleransi adalah 2:55 (175s) s.d. 3:05 (185s).
      // Tiap 1 detik kurang atau lebih dari rentang toleransi dikurangi 0.01.
      let timePenalty = 0;
      if (prev.elapsedSeconds < 175 && prev.elapsedSeconds > 0) {
        timePenalty = (175 - prev.elapsedSeconds) * 0.01;
      } else if (prev.elapsedSeconds > 185) {
        timePenalty = (prev.elapsedSeconds - 185) * 0.01;
      }

      const otherPenalties = 
        (prev.penalties.outOfArena * 0.05) +
        (prev.penalties.droppedWeapon * 0.05) +
        (prev.penalties.attireViolation * 0.05);

      const totalPenalties = timePenalty + otherPenalties;
      const finalVal = Math.max(0, avgJudgeScore - totalPenalties);

      return {
        ...prev,
        penalties: {
          ...prev.penalties,
          timePenalty,
        },
        finalScore: parseFloat(finalVal.toFixed(2)),
      };
    });
  }, []);

  const updateSeniState = (updates: Partial<SeniPerformance>) => {
    setSeniMatch(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
  };

  return (
    <MatchContext.Provider
      value={{
        match,
        seniMatch,
        activeView,
        setActiveView,
        activeJudgeId,
        setActiveJudgeId,
        soundEnabled,
        toggleSound,
        startTimer,
        pauseTimer,
        resetTimer,
        adjustTimer,
        setRoundDuration,
        setRound,
        nextRound,
        submitJudgeVote,
        submitOperatorScore,
        applyPenalty,
        removePenalty,
        undoLastAction,
        declareWinner,
        resetMatch,
        updateMatchMetadata,
        updateFighters,
        loadMatchFromHistory,
        updateSeniState,
        startSeniTimer,
        pauseSeniTimer,
        resetSeniTimer,
        calculateSeniScore,
        history,
        clearHistory,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};
