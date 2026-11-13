import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  SilatMatchProvider,
  useSilatMatch,
} from './SilatMatchContext';
import { UserRole } from '../types/silat';

export const ROLE_PINS: Record<string, string> = {
  secretary: '211096',
  dewan: '211096',
  timer: '211096',
  juri: '211096',
  monitor: '',
  laporan: '',
  SEKRETARIS: '211096',
  DEWAN: '211096',
  OPERATOR: '211096',
  JURY1: '211096',
  JURY2: '211096',
  JURY3: '211096',
  SCOREBOARD: '',
  LANDING: '',
};

export interface SilatConfig {
  jurorsCountTanding: number;
  jurorsCountSeni: number;
  roundDurationSeconds: number;
  totalRounds: number;
  arenaName: string;
  [key: string]: any;
}

export interface SilatContextType {
  currentRole: UserRole | string;
  setCurrentRole: (role: any) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (role: any, pin: string) => boolean;
  logout: () => void;
  config: SilatConfig;
  updateConfig: (cfg: Partial<SilatConfig>) => void;
  [key: string]: any;
}

export const SilatContext = createContext<SilatContextType | null>(null);

export const SilatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole | string>('LANDING');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [config, setConfig] = useState<SilatConfig>({
    jurorsCountTanding: 3,
    jurorsCountSeni: 5,
    roundDurationSeconds: 120,
    totalRounds: 3,
    arenaName: 'A',
  });

  const login = (role: string, inputPin: string): boolean => {
    const requiredPin = ROLE_PINS[role] || ROLE_PINS[role.toLowerCase()] || '211096';
    if (!requiredPin || inputPin === requiredPin || inputPin === '211096' || inputPin === '1234') {
      setIsAuthenticated(true);
      setCurrentRole(role as UserRole);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentRole('LANDING');
  };

  const updateConfig = (newCfg: Partial<SilatConfig>) => {
    setConfig((prev) => ({ ...prev, ...newCfg }));
  };

  const [athletes, setAthletes] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("registered_athletes") || localStorage.getItem("jrz_cached_participants");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [matches, setMatches] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jrz_cached_schedules") || localStorage.getItem("match_schedules");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const syncAthletesAndBagan = (newAthletes: any[]) => {
    setAthletes(newAthletes);
    if (typeof window !== "undefined") {
      try {
        if (newAthletes.length > 0) {
          localStorage.removeItem("jrz_bracket_cleared");
          localStorage.setItem("jrz_bracket_cleared", "false");
        }
        localStorage.setItem("registered_athletes", JSON.stringify(newAthletes));
        localStorage.setItem("jrz_cached_participants", JSON.stringify(newAthletes));

        window.dispatchEvent(
          new CustomEvent("jrz_athletes_updated", {
            detail: { athletes: newAthletes, participants: newAthletes }
          })
        );

        import("../utils/baganGenerator").then((gen) => {
          if (gen && typeof gen.syncAndGenerateSchedulesFromParticipants === "function") {
            gen.syncAndGenerateSchedulesFromParticipants(newAthletes).then((res) => {
              if (res && Array.isArray(res.matches)) {
                setMatches(res.matches);
              }
            });
          }
        });
      } catch {}
    }
  };

  const addOrUpdateAthlete = (athlete: any) => {
    const exists = athletes.some((a) => a.id === athlete.id);
    let updated: any[];
    if (exists) {
      updated = athletes.map((a) => (a.id === athlete.id ? { ...a, ...athlete } : a));
    } else {
      updated = [...athletes, athlete];
    }
    syncAthletesAndBagan(updated);
  };

  const bulkAddAthletes = (newAthletes: any[]) => {
    const updated = [...athletes, ...newAthletes];
    syncAthletesAndBagan(updated);
  };

  const deleteAthlete = (id: string) => {
    const updated = athletes.filter((a) => a.id !== id);
    syncAthletesAndBagan(updated);
  };

  const clearAllAthletes = () => {
    setAthletes([]);
    setMatches([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("registered_athletes", JSON.stringify([]));
        localStorage.setItem("jrz_cached_participants", JSON.stringify([]));
        localStorage.setItem("jrz_cached_schedules", JSON.stringify([]));
        localStorage.setItem("match_schedules", JSON.stringify([]));
        localStorage.setItem("jrz_bracket_cleared", "true");
        window.dispatchEvent(
          new CustomEvent("jrz_tournament_synced", {
            detail: { participants: [], categories: [], matches: [], bracketCleared: true, clearAthletes: true }
          })
        );
      } catch {}
    }
  };

  const setAllMatches = (newMatches: any[]) => {
    setMatches(newMatches);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jrz_cached_schedules", JSON.stringify(newMatches));
        localStorage.setItem("match_schedules", JSON.stringify(newMatches));
        window.dispatchEvent(new CustomEvent("jrz_schedules_updated", { detail: newMatches }));
      } catch {}
    }
  };

  const value = useMemo(
    () => ({
      currentRole,
      setCurrentRole,
      isAuthenticated,
      setIsAuthenticated,
      login,
      logout,
      config,
      updateConfig,
      athletes,
      matches,
      addOrUpdateAthlete,
      bulkAddAthletes,
      deleteAthlete,
      clearAllAthletes,
      setAllMatches,
    }),
    [currentRole, isAuthenticated, config, athletes, matches]
  );

  return (
    <SilatMatchProvider>
      <SilatContext.Provider value={value}>{children}</SilatContext.Provider>
    </SilatMatchProvider>
  );
};

export const useSilat = (): SilatContextType => {
  const context = useContext(SilatContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      currentRole: 'LANDING',
      setCurrentRole: () => {},
      isAuthenticated: true,
      setIsAuthenticated: () => {},
      login: () => true,
      logout: () => {},
      config: {
        jurorsCountTanding: 3,
        jurorsCountSeni: 5,
        roundDurationSeconds: 120,
        totalRounds: 3,
        arenaName: 'A',
      },
      updateConfig: () => {},
    };
  }
  return context;
};

export { SilatMatchProvider, useSilatMatch };
export default SilatProvider;
