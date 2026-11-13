import { FighterMatchScore } from "../types/silat";

export function calculateRoundRawPoints(fighter: FighterMatchScore, round: number): number {
  const r = fighter?.rounds?.[round];
  if (!r) return 0;
  return (r.pukulan || 0) * 1 + (r.tendangan || 0) * 2 + (r.jatuhan || 0) * 3;
}

export function calculateRoundDeduction(fighter: FighterMatchScore, round: number): number {
  const r = fighter?.rounds?.[round];
  if (!r) return 0;
  return (r.binaan || 0) * 0 + (r.teguran || 0) * 1 + (r.peringatan || 0) * 5;
}

export function calculateRoundNetScore(fighter: FighterMatchScore, round: number): number {
  const raw = calculateRoundRawPoints(fighter, round);
  const ded = calculateRoundDeduction(fighter, round);
  return raw - ded;
}

export function calculatePenaltyDeduction(fighter: FighterMatchScore): number {
  if (!fighter) return 0;
  let total = 0;
  for (let r = 1; r <= 3; r++) {
    total += calculateRoundDeduction(fighter, r);
  }
  return total;
}

export function calculateTotalScore(fighter: FighterMatchScore): number {
  if (!fighter) return 0;
  let total = 0;
  for (let r = 1; r <= 3; r++) {
    total += calculateRoundNetScore(fighter, r);
  }
  return total;
}
