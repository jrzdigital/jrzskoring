import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  MatchData, 
  AppRole, 
  Corner, 
  WinType, 
  MatchCategory, 
  CompetitionLevel, 
  JudgeVote,
  TandingCornerData,
  SeniCompetitorData
} from '../types/scoring';
import { audioEngine } from '../utils/audioEngine';
import { testConnection, subscribeToMatch, syncMatchToDb } from '../services/firebase';

const DEFAULT_MATCH_ID = 'gelanggang-a-live';

const INITIAL_RED_CORNER: TandingCornerData = {
  athleteName: 'KHOIRUDIN MUSTAKIM',
  contingent: 'JAWA TENGAH',
  countryOrCity: 'INDONESIA',
  score: 0,
  roundScores: { round1: 0, round2: 0, round3: 0 },
  strikes: { pukulan: 0, tendangan: 0, jatuhan: 0 },
  fouls: {
    binaan: 0,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    diskualifikasi: false,
  },
  vrQuota: 2,
  vrActiveRequest: 'none',
};

const INITIAL_BLUE_CORNER: TandingCornerData = {
  athleteName: 'MUHAMMAD HAZIM',
  contingent: 'SINGAPORE SILAT FEDERATION',
  countryOrCity: 'SINGAPURA',
  score: 0,
  roundScores: { round1: 0, round2: 0, round3: 0 },
  strikes: { pukulan: 0, tendangan: 0, jatuhan: 0 },
  fouls: {
    binaan: 0,
    teguran1: false,
    teguran2: false,
    peringatan1: false,
    peringatan2: false,
    diskualifikasi: false,
  },
  vrQuota: 2,
  vrActiveRequest: 'none',
};

const INITIAL_SENI: SeniCompetitorData = {
  athleteName: 'ASEP YULDAN SANI',
  contingent: 'DKI JAKARTA',
  countryOrCity: 'INDONESIA',
  category: 'tunggal',
  weaponUsed: 'Golok & Toya Nusantara',
  baseScore: 9.90,
  movementMistakes: 0,
  staminaHarmonyScore: 0.08,
  penalties: {
    weaponDrop: false,
    outOfArena: false,
    costumeViolation: false,
    timeViolationSeconds: 0,
  },
  finalScore: 9.98,
};

const INITIAL_MATCH: MatchData = {
  id: DEFAULT_MATCH_ID,
  tournamentName: 'PERSILAT WORLD CHAMPIONSHIP 2026',
  competitionLevel: 'internasional',
  arena: 'GELANGGANG A',
  matchNumber: 'Partai 104',
  category: 'tanding',
  gender: 'putra',
  classPool: 'Kelas E (65 - 70 Kg) Dewasa',
  roundStage: 'Babak Final',
  status: 'persiapan',
  currentRound: 1,
  totalRounds: 3,
  roundDurationSeconds: 120, // 2 minutes
  timerSeconds: 120,
  isTimerRunning: false,
  activeJudgeCount: 3,
  redCorner: INITIAL_RED_CORNER,
  blueCorner: INITIAL_BLUE_CORNER,
  seniCompetitor: INITIAL_SENI,
  winner: 'none',
  winType: null,
  recentJudgeVotes: [],
  updatedAt: new Date().toISOString(),
};

interface TournamentContextType {
  match: MatchData;
  role: AppRole;
  activeJudgeId: number;
  isOnline: boolean;
  language: 'id' | 'en';
  soundMuted: boolean;
  history: MatchData[];
  setRole: (role: AppRole) => void;
  setActiveJudgeId: (id: number) => void;
  setLanguage: (lang: 'id' | 'en') => void;
  toggleSound: () => void;
  updateMatch: (updater: (prev: MatchData) => MatchData) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setRound: (round: number) => void;
  setCategory: (category: MatchCategory) => void;
  submitJudgeStrike: (judgeId: number, corner: Corner, type: 'pukulan' | 'tendangan' | 'jatuhan') => void;
  addCouncilPoints: (corner: Corner, points: number, type: 'pukulan' | 'tendangan' | 'jatuhan') => void;
  adjustScoreDirect: (corner: Corner, delta: number) => void;
  applyFoul: (corner: Corner, foul: 'binaan' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'diskualifikasi') => void;
  requestVideoReplay: (corner: Corner) => void;
  resolveVideoReplay: (corner: Corner, granted: boolean) => void;
  updateSeniMovementMistake: (delta: number) => void;
  updateSeniStamina: (score: number) => void;
  toggleSeniPenalty: (penaltyKey: keyof SeniCompetitorData['penalties'], value?: boolean | number) => void;
  declareWinner: (winner: 'red' | 'blue' | 'draw', winType: WinType, reason?: string) => void;
  resetMatchScores: () => void;
  createNewMatch: (customConfig?: Partial<MatchData>) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [match, setMatch] = useState<MatchData>(() => {
    try {
      const cached = localStorage.getItem('persilat_active_match');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return INITIAL_MATCH;
  });

  const [role, setRole] = useState<AppRole>('landing');
  const [activeJudgeId, setActiveJudgeId] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [history, setHistory] = useState<MatchData[]>(() => {
    try {
      const saved = localStorage.getItem('persilat_match_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to local storage whenever match changes
  useEffect(() => {
    try {
      localStorage.setItem('persilat_active_match', JSON.stringify(match));
    } catch {
      // ignore
    }
  }, [match]);

  // Firebase initial test connection & realtime listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    testConnection().then((connected) => {
      setIsOnline(connected);
      if (connected) {
        unsubscribe = subscribeToMatch(match.id, (incomingMatch) => {
          // If incoming match has newer timestamp, sync
          if (incomingMatch && incomingMatch.updatedAt !== match.updatedAt) {
            setMatch((prev) => ({
              ...incomingMatch,
              // Keep local timer if running locally
              timerSeconds: prev.isTimerRunning ? prev.timerSeconds : incomingMatch.timerSeconds,
              isTimerRunning: prev.isTimerRunning ? prev.isTimerRunning : incomingMatch.isTimerRunning,
            }));
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [match.id]);

  // Sync to Firestore helper (debounced)
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pushToFirebase = useCallback((updatedMatch: MatchData) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncMatchToDb(updatedMatch).catch(() => {});
    }, 400);
  }, []);

  // Timer interval handler
  useEffect(() => {
    if (match.isTimerRunning) {
      timerRef.current = setInterval(() => {
        setMatch((prev) => {
          if (prev.timerSeconds <= 1) {
            // End of round!
            audioEngine.playBuzzer();
            return {
              ...prev,
              timerSeconds: 0,
              isTimerRunning: false,
              status: prev.currentRound < prev.totalRounds ? 'istirahat' : 'selesai',
            };
          }
          return {
            ...prev,
            timerSeconds: prev.timerSeconds - 1,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match.isTimerRunning]);

  const updateMatch = useCallback((updater: (prev: MatchData) => MatchData) => {
    setMatch((prev) => {
      const next = updater(prev);
      const updated = { ...next, updatedAt: new Date().toISOString() };
      pushToFirebase(updated);
      return updated;
    });
  }, [pushToFirebase]);

  const toggleSound = () => {
    const isMuted = audioEngine.toggleMute();
    setSoundMuted(isMuted);
  };

  const startTimer = () => {
    audioEngine.playGong();
    updateMatch((prev) => ({
      ...prev,
      isTimerRunning: true,
      status: 'berlangsung',
    }));
  };

  const pauseTimer = () => {
    audioEngine.playWhistle();
    updateMatch((prev) => ({
      ...prev,
      isTimerRunning: false,
      status: 'persiapan',
    }));
  };

  const resetTimer = () => {
    updateMatch((prev) => ({
      ...prev,
      isTimerRunning: false,
      timerSeconds: prev.roundDurationSeconds,
    }));
  };

  const setRound = (round: number) => {
    audioEngine.playGong();
    updateMatch((prev) => ({
      ...prev,
      currentRound: round,
      timerSeconds: prev.roundDurationSeconds,
      isTimerRunning: false,
      status: 'persiapan',
    }));
  };

  const setCategory = (category: MatchCategory) => {
    updateMatch((prev) => ({
      ...prev,
      category,
      roundDurationSeconds: category === 'tanding' ? 120 : 180, // 3:00 min for Seni
      timerSeconds: category === 'tanding' ? 120 : 180,
      totalRounds: category === 'tanding' ? 3 : 1,
      currentRound: 1,
      isTimerRunning: false,
      status: 'persiapan',
    }));
  };

  // Persilat 2026 Judge Consensus System
  const submitJudgeStrike = (judgeId: number, corner: Corner, type: 'pukulan' | 'tendangan' | 'jatuhan') => {
    const points = type === 'pukulan' ? 1 : type === 'tendangan' ? 2 : 3;
    audioEngine.playJudgeClick(points);

    const now = Date.now();
    const newVote: JudgeVote = {
      judgeId,
      timestamp: now,
      corner,
      action: type,
      points,
    };

    updateMatch((prev) => {
      // Look for matching votes from other judges in the last 1.8 seconds (PERSILAT consensus window)
      const recentWindow = now - 1800;
      const matchingVotes = prev.recentJudgeVotes.filter(
        (v) => v.timestamp >= recentWindow && v.corner === corner && v.action === type && v.judgeId !== judgeId
      );

      // In single-device simulation or if 2 or more judges pressed the same action within the time window:
      const requiredQuorum = prev.activeJudgeCount === 5 ? 3 : 2;
      const isConsensusReached = matchingVotes.length + 1 >= requiredQuorum;

      let nextVotes = [...prev.recentJudgeVotes.filter((v) => v.timestamp >= now - 5000), newVote];

      // If consensus is reached (or for instant judge action in demonstration mode)
      if (isConsensusReached || prev.activeJudgeCount === 3) {
        // Award points to corner
        const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
        const targetCorner = { ...prev[cornerKey] };
        
        const roundKey = `round${prev.currentRound}` as 'round1' | 'round2' | 'round3';
        targetCorner.score += points;
        targetCorner.roundScores[roundKey] = (targetCorner.roundScores[roundKey] || 0) + points;
        targetCorner.strikes[type] = (targetCorner.strikes[type] || 0) + 1;

        return {
          ...prev,
          [cornerKey]: targetCorner,
          recentJudgeVotes: nextVotes,
        };
      }

      return {
        ...prev,
        recentJudgeVotes: nextVotes,
      };
    });
  };

  // Council / Dewan can directly validate Jatuhan or award points
  const addCouncilPoints = (corner: Corner, points: number, type: 'pukulan' | 'tendangan' | 'jatuhan') => {
    audioEngine.playJudgeClick(points);
    updateMatch((prev) => {
      const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
      const targetCorner = { ...prev[cornerKey] };
      const roundKey = `round${prev.currentRound}` as 'round1' | 'round2' | 'round3';

      targetCorner.score += points;
      targetCorner.roundScores[roundKey] = (targetCorner.roundScores[roundKey] || 0) + points;
      targetCorner.strikes[type] = (targetCorner.strikes[type] || 0) + 1;

      return {
        ...prev,
        [cornerKey]: targetCorner,
      };
    });
  };

  const adjustScoreDirect = (corner: Corner, delta: number) => {
    updateMatch((prev) => {
      const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
      const targetCorner = { ...prev[cornerKey] };
      targetCorner.score = Math.max(0, targetCorner.score + delta);
      const roundKey = `round${prev.currentRound}` as 'round1' | 'round2' | 'round3';
      targetCorner.roundScores[roundKey] = Math.max(0, (targetCorner.roundScores[roundKey] || 0) + delta);

      return {
        ...prev,
        [cornerKey]: targetCorner,
      };
    });
  };

  // Fouls and Penalties according to Persilat/IPSI 2026 rules
  const applyFoul = (corner: Corner, foul: 'binaan' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'diskualifikasi') => {
    audioEngine.playWhistle();
    updateMatch((prev) => {
      const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
      const opponentKey = corner === 'red' ? 'blueCorner' : 'redCorner';
      const target = { ...prev[cornerKey], fouls: { ...prev[cornerKey].fouls } };

      if (foul === 'binaan') {
        target.fouls.binaan += 1;
      } else if (foul === 'teguran1') {
        target.fouls.teguran1 = true;
        target.score = Math.max(0, target.score - 1);
      } else if (foul === 'teguran2') {
        target.fouls.teguran2 = true;
        target.score = Math.max(0, target.score - 2);
      } else if (foul === 'peringatan1') {
        target.fouls.peringatan1 = true;
        target.score = Math.max(0, target.score - 5);
      } else if (foul === 'peringatan2') {
        target.fouls.peringatan2 = true;
        target.score = Math.max(0, target.score - 10);
      } else if (foul === 'diskualifikasi') {
        target.fouls.diskualifikasi = true;
        // Opponent immediately wins by Disqualification
        const winningCorner = corner === 'red' ? 'blue' : 'red';
        return {
          ...prev,
          [cornerKey]: target,
          winner: winningCorner,
          winType: 'diskualifikasi',
          status: 'selesai',
          isTimerRunning: false,
          winDescription: `Kemenangan Diskualifikasi untuk Sudut ${winningCorner === 'red' ? 'MERAH' : 'BIRU'} karena pelanggaran berat sudut lawan.`,
        };
      }

      return {
        ...prev,
        [cornerKey]: target,
      };
    });
  };

  // Video Replay (VR Challenge)
  const requestVideoReplay = (corner: Corner) => {
    audioEngine.playWhistle();
    updateMatch((prev) => {
      const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
      const target = { ...prev[cornerKey] };
      if (target.vrQuota <= 0) return prev;

      target.vrActiveRequest = 'pending';
      return {
        ...prev,
        isTimerRunning: false, // Freeze timer during VR
        [cornerKey]: target,
      };
    });
  };

  const resolveVideoReplay = (corner: Corner, granted: boolean) => {
    updateMatch((prev) => {
      const cornerKey = corner === 'red' ? 'redCorner' : 'blueCorner';
      const target = { ...prev[cornerKey] };
      target.vrActiveRequest = granted ? 'accepted' : 'rejected';
      if (!granted) {
        target.vrQuota = Math.max(0, target.vrQuota - 1);
      }
      return {
        ...prev,
        [cornerKey]: target,
      };
    });
  };

  // Seni (Artistic) Calculations
  const updateSeniMovementMistake = (delta: number) => {
    updateMatch((prev) => {
      const seni = { ...prev.seniCompetitor };
      seni.movementMistakes = Math.max(0, seni.movementMistakes + delta);
      // Recalculate: 9.90 - (mistakes * 0.01) + stamina - penalties
      const penaltyDeduction = 
        (seni.penalties.weaponDrop ? 0.50 : 0) +
        (seni.penalties.outOfArena ? 0.50 : 0) +
        (seni.penalties.costumeViolation ? 0.50 : 0) +
        (Math.floor(seni.penalties.timeViolationSeconds / 5) * 0.05);

      seni.finalScore = Number(Math.max(0, seni.baseScore - (seni.movementMistakes * 0.01) + seni.staminaHarmonyScore - penaltyDeduction).toFixed(3));
      return {
        ...prev,
        seniCompetitor: seni,
      };
    });
  };

  const updateSeniStamina = (score: number) => {
    updateMatch((prev) => {
      const seni = { ...prev.seniCompetitor };
      seni.staminaHarmonyScore = score;
      const penaltyDeduction = 
        (seni.penalties.weaponDrop ? 0.50 : 0) +
        (seni.penalties.outOfArena ? 0.50 : 0) +
        (seni.penalties.costumeViolation ? 0.50 : 0) +
        (Math.floor(seni.penalties.timeViolationSeconds / 5) * 0.05);

      seni.finalScore = Number(Math.max(0, seni.baseScore - (seni.movementMistakes * 0.01) + seni.staminaHarmonyScore - penaltyDeduction).toFixed(3));
      return {
        ...prev,
        seniCompetitor: seni,
      };
    });
  };

  const toggleSeniPenalty = (penaltyKey: keyof SeniCompetitorData['penalties'], value?: boolean | number) => {
    updateMatch((prev) => {
      const seni = { ...prev.seniCompetitor, penalties: { ...prev.seniCompetitor.penalties } };
      if (typeof value === 'boolean') {
        (seni.penalties as Record<string, unknown>)[penaltyKey] = value;
      } else if (typeof value === 'number') {
        (seni.penalties as Record<string, unknown>)[penaltyKey] = value;
      } else {
        (seni.penalties as Record<string, unknown>)[penaltyKey] = !(seni.penalties as Record<string, unknown>)[penaltyKey];
      }

      const penaltyDeduction = 
        (seni.penalties.weaponDrop ? 0.50 : 0) +
        (seni.penalties.outOfArena ? 0.50 : 0) +
        (seni.penalties.costumeViolation ? 0.50 : 0) +
        (Math.floor(seni.penalties.timeViolationSeconds / 5) * 0.05);

      seni.finalScore = Number(Math.max(0, seni.baseScore - (seni.movementMistakes * 0.01) + seni.staminaHarmonyScore - penaltyDeduction).toFixed(3));
      return {
        ...prev,
        seniCompetitor: seni,
      };
    });
  };

  // Declare Official Winner
  const declareWinner = (winner: 'red' | 'blue' | 'draw', winType: WinType, reason?: string) => {
    audioEngine.playGong();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: winner === 'red' ? ['#EF4444', '#DC2626', '#F59E0B'] : ['#3B82F6', '#2563EB', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    updateMatch((prev) => {
      const finished: MatchData = {
        ...prev,
        winner,
        winType,
        winDescription: reason || `Kemenangan ${winType.toUpperCase()} diraih oleh Sudut ${winner === 'red' ? 'MERAH' : 'BIRU'}`,
        status: 'selesai',
        isTimerRunning: false,
      };

      // Add to history
      setHistory((old) => {
        const updated = [finished, ...old.filter((m) => m.id !== finished.id)].slice(0, 50);
        try {
          localStorage.setItem('persilat_match_history', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      return finished;
    });
  };

  const resetMatchScores = () => {
    updateMatch((prev) => ({
      ...prev,
      redCorner: { ...INITIAL_RED_CORNER, athleteName: prev.redCorner.athleteName, contingent: prev.redCorner.contingent },
      blueCorner: { ...INITIAL_BLUE_CORNER, athleteName: prev.blueCorner.athleteName, contingent: prev.blueCorner.contingent },
      seniCompetitor: { ...INITIAL_SENI, athleteName: prev.seniCompetitor.athleteName, contingent: prev.seniCompetitor.contingent },
      currentRound: 1,
      timerSeconds: prev.roundDurationSeconds,
      isTimerRunning: false,
      status: 'persiapan',
      winner: 'none',
      winType: null,
      recentJudgeVotes: [],
    }));
  };

  const createNewMatch = (customConfig?: Partial<MatchData>) => {
    const newId = `match-${Date.now()}`;
    const freshMatch: MatchData = {
      ...INITIAL_MATCH,
      id: newId,
      matchNumber: `Partai ${Math.floor(Math.random() * 90) + 10}`,
      ...customConfig,
    };
    setMatch(freshMatch);
    pushToFirebase(freshMatch);
  };

  return (
    <TournamentContext.Provider
      value={{
        match,
        role,
        activeJudgeId,
        isOnline,
        language,
        soundMuted,
        history,
        setRole,
        setActiveJudgeId,
        setLanguage,
        toggleSound,
        updateMatch,
        startTimer,
        pauseTimer,
        resetTimer,
        setRound,
        setCategory,
        submitJudgeStrike,
        addCouncilPoints,
        adjustScoreDirect,
        applyFoul,
        requestVideoReplay,
        resolveVideoReplay,
        updateSeniMovementMistake,
        updateSeniStamina,
        toggleSeniPenalty,
        declareWinner,
        resetMatchScores,
        createNewMatch,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
};
