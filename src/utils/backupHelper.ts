import { SilatAthlete, MatchState, TournamentConfig } from '../types/silat';

export interface SilatBackupPackage {
  format: 'JRZ_FIREBASE_BACKUP' | 'SILAT_OFFLINE_BACKUP';
  version: string;
  exportedAt: string;
  metadata: {
    tournamentName: string;
    arenaName: string;
    cityCreated?: string;
    dateCreated?: string;
    totalAthletes: number;
    totalMatches: number;
    totalFinishedMatches: number;
    description: string;
  };
  athletes: SilatAthlete[];
  matches: MatchState[];
  config: TournamentConfig;
  activeMatchId?: string;
}

export interface BackupValidationResult {
  isValid: boolean;
  errorMessage?: string;
  package?: SilatBackupPackage;
  stats?: {
    totalAthletes: number;
    totalMatches: number;
    tournamentName: string;
    arenaName: string;
    exportedAt: string;
  };
}

/**
 * Downloads data as a local JSON file to user's computer
 */
export function downloadJSONFile(data: any, defaultFilename: string) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports all athlete data, match schedules, brackets, and configuration to local JSON backup
 */
export function exportTournamentBackupJSON(
  athletes: SilatAthlete[],
  matches: MatchState[],
  config: TournamentConfig,
  activeMatchId?: string
): { filename: string; athletesCount: number; matchesCount: number } {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  
  const cleanTourneyName = (config.tournamentName || 'Kejuaraan_Silat')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/__+/g, '_')
    .slice(0, 30);

  const filename = `Backup_Silat_${cleanTourneyName}_${dateStr}_${timeStr}.json`;

  const finishedCount = matches.filter(
    (m) => m.status === 'FINISHED' || Boolean(m.result) || Boolean(m.jurus?.isFinished)
  ).length;

  const backupPackage: SilatBackupPackage = {
    format: 'JRZ_FIREBASE_BACKUP',
    version: '1.0.0',
    exportedAt: now.toISOString(),
    metadata: {
      tournamentName: config.tournamentName || 'Kejuaraan Pencak Silat',
      arenaName: config.arenaName || 'Gelanggang 1',
      cityCreated: config.cityCreated || 'Indonesia',
      dateCreated: config.dateCreated || config.date || dateStr,
      totalAthletes: athletes.length,
      totalMatches: matches.length,
      totalFinishedMatches: finishedCount,
      description: 'Cadangan data atlet, jadwal, dan pohon bagan pertandingan Pencak Silat IPSI 2026 (Firebase)'
    },
    athletes: athletes || [],
    matches: matches || [],
    config: config,
    activeMatchId: activeMatchId || (matches[0]?.id || '')
  };

  downloadJSONFile(backupPackage, filename);

  return {
    filename,
    athletesCount: athletes.length,
    matchesCount: matches.length
  };
}

/**
 * Parses and validates an uploaded JSON backup file
 */
export async function parseAndValidateBackupJSON(file: File): Promise<BackupValidationResult> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ isValid: false, errorMessage: 'Tidak ada berkas yang dipilih.' });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      resolve({ isValid: false, errorMessage: 'Format berkas tidak valid. Harap pilih berkas berekstensi .json.' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          resolve({ isValid: false, errorMessage: 'Berkas JSON kosong.' });
          return;
        }

        const parsed = JSON.parse(text);

        // Normalize data formats (supports both SILAT_OFFLINE_BACKUP and raw payload / local state)
        let athletesList: SilatAthlete[] = [];
        let matchesList: MatchState[] = [];
        let configObj: TournamentConfig | undefined;
        let activeId: string | undefined;
        let exportedAtStr = new Date().toISOString();
        let tourneyName = 'Kejuaraan Pencak Silat';
        let arena = 'Gelanggang 1';

        if (Array.isArray(parsed.athletes)) {
          athletesList = parsed.athletes;
        } else if (Array.isArray(parsed)) {
          // If the JSON is directly an array of athletes or matches
          if (parsed.length > 0 && ('contingent' in parsed[0] || 'category' in parsed[0])) {
            athletesList = parsed;
          }
        }

        if (Array.isArray(parsed.matches)) {
          matchesList = parsed.matches;
        }

        if (parsed.config && typeof parsed.config === 'object') {
          configObj = parsed.config;
          if (configObj.tournamentName) tourneyName = configObj.tournamentName;
          if (configObj.arenaName) arena = configObj.arenaName;
        }

        if (parsed.activeMatchId) {
          activeId = parsed.activeMatchId;
        }

        if (parsed.exportedAt) {
          exportedAtStr = parsed.exportedAt;
        } else if (parsed.metadata?.exportedAt) {
          exportedAtStr = parsed.metadata.exportedAt;
        }

        if (parsed.metadata?.tournamentName) {
          tourneyName = parsed.metadata.tournamentName;
        }

        if (parsed.metadata?.arenaName) {
          arena = parsed.metadata.arenaName;
        }

        // Validate that there is at least some athlete or match data
        if (athletesList.length === 0 && matchesList.length === 0) {
          resolve({
            isValid: false,
            errorMessage: 'Berkas JSON tidak memuat data atlet maupun pertandingan yang dapat dipulihkan.'
          });
          return;
        }

        // Build valid package
        const validatedPackage: SilatBackupPackage = {
          format: 'JRZ_FIREBASE_BACKUP',
          version: parsed.version || '1.0.0',
          exportedAt: exportedAtStr,
          metadata: {
            tournamentName: tourneyName,
            arenaName: arena,
            totalAthletes: athletesList.length,
            totalMatches: matchesList.length,
            totalFinishedMatches: matchesList.filter((m) => m.status === 'FINISHED' || m.result).length,
            description: parsed.metadata?.description || 'Cadangan data dipulihkan'
          },
          athletes: athletesList,
          matches: matchesList,
          config: configObj || ({} as TournamentConfig),
          activeMatchId: activeId || (matchesList[0]?.id || '')
        };

        resolve({
          isValid: true,
          package: validatedPackage,
          stats: {
            totalAthletes: athletesList.length,
            totalMatches: matchesList.length,
            tournamentName: tourneyName,
            arenaName: arena,
            exportedAt: exportedAtStr
          }
        });
      } catch (err: any) {
        resolve({
          isValid: false,
          errorMessage: `Gagal membaca isi berkas JSON: ${err.message || 'Format JSON rusak/korup'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({ isValid: false, errorMessage: 'Terjadi kesalahan saat membaca berkas dari disk lokal.' });
    };

    reader.readAsText(file);
  });
}
