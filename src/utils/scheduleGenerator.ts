import { SilatAthlete, MatchState, TournamentConfig, MatchCategory, Gender, MatchStage } from '../types/silat';
import { separateAthletesByContingent } from './baganGenerator';

/**
 * Urutan Penyusunan Partai Pertandingan Sesuai Regulasi IPSI:
 * 1. Urutan teratas: Semua partai Kategori Tanding
 * 2. Dilanjutkan: Jurus Tunggal
 * 3. Lalu: Jurus Ganda
 * 4. Lalu: Jurus Regu
 * 5. Terakhir: Tunggal Bebas / Solo Kreatif
 */
export function getCategoryOrderRank(cat: MatchCategory | string): number {
  const c = String(cat || '').toUpperCase().trim();
  // 1. Urutan teratas semua partai kategori tanding
  if (c === 'TANDING' || c.includes('TANDING')) return 1;
  // 2. Dilanjutkan jurus tunggal
  if ((c.includes('TUNGGAL') || c === 'JURUS_TUNGGAL') && !c.includes('BEBAS') && !c.includes('SOLO')) return 2;
  // 3. Lalu ganda
  if (c.includes('GANDA') || c === 'JURUS_GANDA') return 3;
  // 4. Lalu regu
  if (c.includes('REGU') || c === 'JURUS_REGU') return 4;
  // 5. Terakhir tunggal bebas (Solo Kreatif / Tunggal Bebas)
  if (c.includes('SOLO') || c.includes('KREATIF') || c.includes('BEBAS') || c.includes('TUNGGAL_BEBAS')) return 5;
  return 99;
}

export function getStageRank(stage?: MatchStage | string): number {
  const s = String(stage || '').toUpperCase();
  if (s.includes('FINAL') && !s.includes('SEMI') && !s.includes('PEREMPAT') && !s.includes('QUARTER')) return 4;
  if (s.includes('SEMI') || s.includes('SF')) return 3;
  if (s.includes('PEREMPAT') || s.includes('QUARTER') || s.includes('QF')) return 2;
  return 1;
}

export function sortMatchesByCategory(matches: MatchState[]): MatchState[] {
  return [...matches].sort((a, b) => {
    // 1. Selesaikan seluruh babak semifinal terlebih dahulu di urutan atas sebelum babak final
    const stageRankA = getStageRank(a.stage);
    const stageRankB = getStageRank(b.stage);
    if (stageRankA !== stageRankB) return stageRankA - stageRankB;

    // 2. Urutan hierarki kategori (Tanding -> Tunggal -> Ganda -> Regu -> Tunggal Bebas)
    const rankA = getCategoryOrderRank(a.category);
    const rankB = getCategoryOrderRank(b.category);
    if (rankA !== rankB) return rankA - rankB;

    if (a.gender !== b.gender) return a.gender === 'PUTRA' ? -1 : 1;
    if (a.classGroup && b.classGroup && a.classGroup !== b.classGroup) {
      return a.classGroup.localeCompare(b.classGroup);
    }
    return (a.matchNumber || 0) - (b.matchNumber || 0);
  });
}

export function sortAndRenumberMatches(matches: MatchState[]): MatchState[] {
  const sorted = sortMatchesByCategory(matches);
  sorted.forEach((m, idx) => {
    m.matchNumber = idx + 1;
  });
  return sorted;
}

/**
 * Otomatis menghasilkan dan menyinkronkan jadwal partai pertandingan dari daftar atlet terdaftar.
 * Memastikan partai terbagi secara ketat sesuai Kategori, Kelas Tanding/Jurus, dan Gender (Putra vs Putra, Putri vs Putri).
 * Partai yang dihasilkan langsung memiliki data lengkap dan siap dipertandingkan di seluruh panel.
 */
export function generateMatchesFromAthletes(
  athletes: SilatAthlete[],
  config: TournamentConfig,
  existingMatches: MatchState[] = []
): MatchState[] {
  if (!athletes || athletes.length === 0) {
    return [];
  }

  const newMatches: MatchState[] = [];
  let matchCounter = 1;

  // Group athletes by Category + ClassGroup + Gender
  const grouped: Record<string, SilatAthlete[]> = {};
  athletes.forEach((ath) => {
    const key = `${ath.category}__${ath.classGroup}__${ath.gender}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ath);
  });

  // Sort grouped keys strictly by Category Hierarchy: Tanding -> Tunggal -> Ganda -> Regu -> Tunggal Bebas
  const sortedKeys = Object.keys(grouped).sort((keyA, keyB) => {
    const [catA, classA, genderA] = keyA.split('__');
    const [catB, classB, genderB] = keyB.split('__');
    const rankA = getCategoryOrderRank(catA);
    const rankB = getCategoryOrderRank(catB);
    if (rankA !== rankB) return rankA - rankB;
    if (genderA !== genderB) return genderA === 'PUTRA' ? -1 : 1;
    return classA.localeCompare(classB);
  });

  sortedKeys.forEach((key) => {
    // Memastikan atlet dari kontingen / perguruan yang sama dipisahkan dan tidak langsung bertemu di babak awal
    const athList = separateAthletesByContingent(grouped[key]);
    const [cat, classGroup, gender] = key.split('__');
    const isTanding = cat === 'TANDING';
    const duration = isTanding ? (config.roundDurationTanding || 120) : (config.roundDurationSeni || 180);

    if (isTanding) {
      if (athList.length === 1) {
        const red = athList[0];
        const blue: SilatAthlete = {
          id: `sparring-${red.id}`,
          name: `Pesilat Biru (${classGroup} ${gender})`,
          contingent: 'Kontingen Mitra / Lawan',
          category: 'TANDING',
          gender: red.gender,
          ageGroup: red.ageGroup,
          classGroup,
          weight: red.weight
        };

        const existing = existingMatches.find((m) => m.matchNumber === matchCounter);
        const matchId = existing?.id || `match-${matchCounter}`;

        newMatches.push({
          id: matchId,
          matchNumber: matchCounter,
          arena: config.arenaName || 'Gelanggang 1',
          category: 'TANDING',
          gender: gender as Gender,
          ageGroup: red.ageGroup,
          classGroup,
          stage: 'FINAL',
          status: existing?.status || 'PENDING',
          activeRound: existing?.activeRound || 1,
          timer: existing?.timer || {
            timeRemaining: duration,
            durationTotal: duration,
            isRunning: false,
            isRest: false,
            restTimeRemaining: 60,
            elapsedTime: 0
          },
          tanding: existing?.tanding ? {
            ...existing.tanding,
            redAthlete: red,
            blueAthlete: blue
          } : {
            redAthlete: red,
            blueAthlete: blue,
            redScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
            blueScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
            currentVotes: [],
            lastActionLog: [`Partai Final #${matchCounter} (${gender} - ${classGroup}) siap dipertandingkan`]
          },
          jurus: {
            performer: red,
            juryScores: {
              1: { juryNumber: 1, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
              2: { juryNumber: 2, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
              3: { juryNumber: 3, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false }
            },
            penalties: { timeToleranceViolation: 0, weaponDropped: 0, weaponBroken: 0, outOfArena: 0, attireViolation: 0, unauthorizedSound: 0, totalPenalties: 0 },
            finalMedianScore: 9.95,
            isFinished: false
          },
          updatedAt: new Date().toISOString()
        });
        matchCounter++;
      } else {
        for (let i = 0; i < athList.length; i += 2) {
          const red = athList[i];
          const blue = athList[i + 1] || {
            id: `sparring-${red.id}`,
            name: `Pesilat Biru (${classGroup} ${gender})`,
            contingent: 'Kontingen Mitra / Lawan',
            category: 'TANDING',
            gender: red.gender,
            ageGroup: red.ageGroup,
            classGroup,
            weight: red.weight
          };
          const stage: MatchStage = athList.length <= 2 ? 'FINAL' : i < athList.length - 2 ? 'PENYISIHAN' : 'SEMI_FINAL';

          const existing = existingMatches.find((m) => m.matchNumber === matchCounter);
          const matchId = existing?.id || `match-${matchCounter}`;

          newMatches.push({
            id: matchId,
            matchNumber: matchCounter,
            arena: config.arenaName || 'Gelanggang 1',
            category: 'TANDING',
            gender: gender as Gender,
            ageGroup: red.ageGroup,
            classGroup,
            stage,
            status: existing?.status || 'PENDING',
            activeRound: existing?.activeRound || 1,
            timer: existing?.timer || {
              timeRemaining: duration,
              durationTotal: duration,
              isRunning: false,
              isRest: false,
              restTimeRemaining: 60,
              elapsedTime: 0
            },
            tanding: existing?.tanding ? {
              ...existing.tanding,
              redAthlete: red,
              blueAthlete: blue
            } : {
              redAthlete: red,
              blueAthlete: blue,
              redScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
              blueScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
              currentVotes: [],
              lastActionLog: [`Partai #${matchCounter} (${gender} - ${classGroup}) siap dipertandingkan`]
            },
            jurus: {
              performer: red,
              juryScores: {
                1: { juryNumber: 1, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
                2: { juryNumber: 2, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false },
                3: { juryNumber: 3, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false }
              },
              penalties: { timeToleranceViolation: 0, weaponDropped: 0, weaponBroken: 0, outOfArena: 0, attireViolation: 0, unauthorizedSound: 0, totalPenalties: 0 },
              finalMedianScore: 9.95,
              isFinished: false
            },
            updatedAt: new Date().toISOString()
          });
          matchCounter++;
        }
      }
    } else {
      // Jurus Seni
      for (let i = 0; i < athList.length; i += 2) {
        const red = athList[i];
        const blue = athList[i + 1] || {
          id: `sparring-${red.id}`,
          name: `Pesilat Biru (${cat.replace('JURUS_', '')} ${gender})`,
          contingent: 'Kontingen Pendamping',
          category: cat as MatchCategory,
          gender: gender as Gender,
          ageGroup: red.ageGroup,
          classGroup,
          teamMembers: red.teamMembers ? red.teamMembers.map((_, idx) => `Atlet ${idx + 1} Biru`) : undefined
        };
        const stage: MatchStage = athList.length <= 2 ? 'FINAL' : i < athList.length - 2 ? 'PENYISIHAN' : 'SEMI_FINAL';

        const existing = existingMatches.find((m) => m.matchNumber === matchCounter);
        const matchId = existing?.id || `match-${matchCounter}`;

        newMatches.push({
          id: matchId,
          matchNumber: matchCounter,
          arena: config.arenaName || 'Gelanggang 1',
          category: cat as MatchCategory,
          gender: gender as Gender,
          ageGroup: red.ageGroup,
          classGroup,
          stage,
          status: existing?.status || 'PENDING',
          activeRound: existing?.activeRound || 1,
          timer: existing?.timer || {
            timeRemaining: duration,
            durationTotal: duration,
            isRunning: false,
            isRest: false,
            restTimeRemaining: 0,
            elapsedTime: 0
          },
          tanding: {
            redAthlete: red,
            blueAthlete: blue,
            redScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
            blueScores: { round1: 0, round2: 0, round3: 0, totalPoints: 0, penalties: [], approvedHits: [] },
            currentVotes: [],
            lastActionLog: [`Partai Seni #${matchCounter} (${cat.replace('_', ' ')} ${gender}) siap tampil`]
          },
          jurus: existing?.jurus ? {
            ...existing.jurus,
            performer: red
          } : {
            performer: red,
            juryScores: (() => {
              const count = config.jurorsCountSeni || 5;
              const scores: Record<number, any> = {};
              for (let j = 1; j <= count; j++) {
                scores[j] = { juryNumber: j, kebenaranBase: 9.90, kesalahanCount: 0, kebenaranFinal: 9.90, kemantapanScore: 0.05, penaltyDeduction: 0, finalScore: 9.95, isSubmitted: false };
              }
              return scores;
            })(),
            penalties: { timeToleranceViolation: 0, weaponDropped: 0, weaponBroken: 0, outOfArena: 0, attireViolation: 0, unauthorizedSound: 0, totalPenalties: 0 },
            finalMedianScore: 9.95,
            isFinished: false
          },
          updatedAt: new Date().toISOString()
        });
        matchCounter++;
      }
    }
  });

  // Sort strictly by category: Tanding -> Jurus Tunggal -> Ganda -> Regu -> Tunggal Bebas
  const sortedMatches = sortMatchesByCategory(newMatches);

  // Renumber sequentially: Partai #1, #2, #3, ...
  sortedMatches.forEach((m, idx) => {
    m.matchNumber = idx + 1;
  });

  return sortedMatches;
}
