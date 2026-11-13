import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTandingScore,
  determineTandingWinner,
  evaluateConsensusAction,
  calculateTimeDeviationPenalty,
  calculateSeniJurusScore,
  ScoreAction,
  PenaltyAction,
  JurorSeniScore,
} from './rules.ts';

test('Tanding scoring computes points and round summaries correctly', () => {
  const actions: ScoreAction[] = [
    { id: '1', timestamp: 100, corner: 'red', round: 1, juriId: 'j1', type: 'punch', points: 1 },
    { id: '2', timestamp: 200, corner: 'red', round: 1, juriId: 'j2', type: 'kick', points: 2 },
    { id: '3', timestamp: 300, corner: 'red', round: 2, juriId: 'j1', type: 'takedown', points: 3 },
    { id: '4', timestamp: 400, corner: 'blue', round: 1, juriId: 'j1', type: 'kick', points: 2 },
  ];

  const penalties: PenaltyAction[] = [
    { id: 'p1', timestamp: 500, corner: 'red', round: 2, type: 'teguran1', pointsDeducted: 1 },
    { id: 'p2', timestamp: 600, corner: 'blue', round: 2, type: 'peringatan1', pointsDeducted: 5 },
  ];

  const redResult = calculateTandingScore('red', actions, penalties, 3);
  assert.equal(redResult.rawPoints, 6); // 1 + 2 + 3 = 6
  assert.equal(redResult.deductions, 1); // teguran1 = 1
  assert.equal(redResult.totalScore, 5); // 6 - 1 = 5
  assert.equal(redResult.punchesCount, 1);
  assert.equal(redResult.kicksCount, 1);
  assert.equal(redResult.takedownsCount, 1);

  const blueResult = calculateTandingScore('blue', actions, penalties, 3);
  assert.equal(blueResult.rawPoints, 2);
  assert.equal(blueResult.deductions, 5);
  assert.equal(blueResult.totalScore, -3); // 2 - 5 = -3
});

test('Tanding disqualification triggers on Peringatan 3', () => {
  const actions: ScoreAction[] = [
    { id: '1', timestamp: 100, corner: 'red', round: 1, juriId: 'j1', type: 'kick', points: 2 },
    { id: '2', timestamp: 200, corner: 'blue', round: 1, juriId: 'j1', type: 'kick', points: 2 },
  ];
  const penalties: PenaltyAction[] = [
    { id: 'p3', timestamp: 300, corner: 'red', round: 1, type: 'peringatan3', pointsDeducted: 999 },
  ];

  const red = calculateTandingScore('red', actions, penalties, 3);
  const blue = calculateTandingScore('blue', actions, penalties, 3);

  assert.equal(red.disqualified, true);
  assert.equal(red.totalScore, 0);

  const winnerResult = determineTandingWinner(red, blue);
  assert.equal(winnerResult.winner, 'blue');
  assert.match(winnerResult.reason, /Diskualifikasi/);
});

test('Tanding tie-breaker selects competitor with fewer deductions', () => {
  const red = {
    rawPoints: 10,
    deductions: 1,
    totalScore: 9,
    punchesCount: 4,
    kicksCount: 3,
    takedownsCount: 0,
    teguranCount: 1,
    peringatanCount: 0,
    disqualified: false,
    roundScores: [],
  };
  const blue = {
    rawPoints: 11,
    deductions: 2,
    totalScore: 9,
    punchesCount: 1,
    kicksCount: 5,
    takedownsCount: 0,
    teguranCount: 2,
    peringatanCount: 0,
    disqualified: false,
    roundScores: [],
  };

  const tieResult = determineTandingWinner(red, blue);
  assert.equal(tieResult.winner, 'red'); // red has fewer deductions (1 vs 2)
  assert.match(tieResult.reason, /Hukuman Lebih Sedikit/);
});

test('Consensus verification checks juror threshold', () => {
  const windowActions: ScoreAction[] = [
    { id: '1', timestamp: 1000, corner: 'red', round: 1, juriId: 'j1', type: 'punch', points: 1 },
    { id: '2', timestamp: 1200, corner: 'red', round: 1, juriId: 'j2', type: 'punch', points: 1 },
  ];
  assert.equal(evaluateConsensusAction(windowActions, 2), true);

  // Duplicate same juror should not count as 2 separate jurors
  const dupActions: ScoreAction[] = [
    { id: '1', timestamp: 1000, corner: 'red', round: 1, juriId: 'j1', type: 'punch', points: 1 },
    { id: '2', timestamp: 1200, corner: 'red', round: 1, juriId: 'j1', type: 'punch', points: 1 },
  ];
  assert.equal(evaluateConsensusAction(dupActions, 2), false);
});

test('Seni time deviation calculation follows IPSI 3-minute standard', () => {
  assert.equal(calculateTimeDeviationPenalty(178).penalty, 0); // between 2:55 and 3:05
  assert.equal(calculateTimeDeviationPenalty(172).penalty, 0.5); // between 2:50 and 2:54
  assert.equal(calculateTimeDeviationPenalty(195).penalty, 1.0); // > 3:10
});

test('Seni jurus score calculation trims high and low extremes with 5 jurors', () => {
  const jurors: JurorSeniScore[] = [
    { juriId: 'j1', juriName: 'Juri 1', correctnessBase: 9.9, mistakeCount: 2, correctnessScore: 9.88, firmnessScore: 0.05, totalScore: 9.93 },
    { juriId: 'j2', juriName: 'Juri 2', correctnessBase: 9.9, mistakeCount: 1, correctnessScore: 9.89, firmnessScore: 0.04, totalScore: 9.93 },
    { juriId: 'j3', juriName: 'Juri 3', correctnessBase: 9.9, mistakeCount: 0, correctnessScore: 9.9, firmnessScore: 0.09, totalScore: 9.99 }, // highest
    { juriId: 'j4', juriName: 'Juri 4', correctnessBase: 9.9, mistakeCount: 3, correctnessScore: 9.87, firmnessScore: 0.01, totalScore: 9.88 }, // lowest
    { juriId: 'j5', juriName: 'Juri 5', correctnessBase: 9.9, mistakeCount: 1, correctnessScore: 9.89, firmnessScore: 0.05, totalScore: 9.94 },
  ];

  const result = calculateSeniJurusScore(jurors, [], 180, true);
  assert.equal(result.trimmedHighJuriId, 'j3');
  assert.equal(result.trimmedLowJuriId, 'j4');
  assert.equal(result.activeScores.length, 3);
  // active scores: 9.93, 9.93, 9.94 -> average is 9.9333... -> 9.933
  assert.equal(result.finalScore, 9.933);
});
