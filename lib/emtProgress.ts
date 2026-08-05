import type { CallCategory, EmtDifficulty, EmtRunResult } from '@/data/emt/types';

const DIFFICULTY_MULT: Record<EmtDifficulty, number> = {
  practice: 1,
  exam: 1.5,
};

/** Calendar day key in local time — YYYY-MM-DD. */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

export function xpFromRun(
  result: Pick<EmtRunResult, 'totalScore' | 'stars' | 'skillsSheetPass'>,
  difficulty: EmtDifficulty,
  opts?: { dailyBonus?: boolean }
): number {
  const base = Math.max(0, result.totalScore) + result.stars * 20;
  let xp = Math.round(base * DIFFICULTY_MULT[difficulty]);
  if (result.skillsSheetPass) xp += 25;
  if (opts?.dailyBonus) xp += 50;
  return Math.max(10, xp);
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  need: number;
  /** 0–1 fill for the XP bar */
  ratio: number;
}

/** Soft curve — early levels come fast, later ones stretch. */
export function levelFromXp(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let need = 100;

  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(100 * Math.pow(1.12, level - 1));
  }

  return {
    level,
    intoLevel: remaining,
    need,
    ratio: need > 0 ? remaining / need : 1,
  };
}

export function pickDailyCategory(dateKey: string): CallCategory {
  const cats: CallCategory[] = ['medical', 'trauma', 'peds', 'ob', 'mci'];
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return cats[hash % cats.length];
}
