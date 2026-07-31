import { RANKS } from '@/constants/ranks';
import type { EndingType, ScenarioResult } from '@/types/models';

export function getRankFromXp(totalXp: number) {
  let current: (typeof RANKS)[number] = RANKS[0];
  for (const rank of RANKS) {
    if (totalXp >= rank.minXp) {
      current = rank;
    }
  }
  return current;
}

export function getNextRank(totalXp: number) {
  const currentIndex = RANKS.findIndex(
    (rank) => getRankFromXp(totalXp).id === rank.id
  );
  return RANKS[currentIndex + 1] ?? null;
}

export function getRankProgress(totalXp: number): number {
  const current = getRankFromXp(totalXp);
  const next = getNextRank(totalXp);
  if (!next) return 1;
  const range = next.minXp - current.minXp;
  const progress = totalXp - current.minXp;
  return Math.min(1, progress / range);
}

export function calculateStars(
  ending: EndingType,
  protocolCorrect: boolean,
  treatmentCorrect: boolean
): number {
  if (ending === 'perfect_save' && protocolCorrect && treatmentCorrect) {
    return 5;
  }
  if (ending === 'perfect_save') return 4;
  if (ending === 'partial_success' && protocolCorrect) return 3;
  if (ending === 'delayed_treatment' && protocolCorrect) return 2;
  if (protocolCorrect) return 2;
  return 1;
}

export function formatStars(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function getPerformanceLabel(result: ScenarioResult): string {
  if (result.stars >= 5) return 'Perfect Call';
  if (result.stars >= 4) return 'Strong Save';
  if (result.stars >= 3) return 'Acceptable Outcome';
  if (result.stars >= 2) return 'Needs Improvement';
  return 'Critical Miss';
}
