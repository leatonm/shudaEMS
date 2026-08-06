import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ALL_CATEGORIES, type BadgeId } from '@/data/emt/badges';
import type { CallCategory, EmtDifficulty, EmtRunResult } from '@/data/emt/types';
import {
  daysBetween,
  levelFromXp,
  pickDailyCategory,
  todayKey,
  xpFromRun,
} from '@/lib/emtProgress';
import { getRankFromXp } from '@/lib/rankEngine';

export interface CompletedRunSummary {
  callId: string;
  category: CallCategory;
  difficulty: EmtDifficulty;
  score: number;
  stars: number;
  skillsSheetPass: boolean;
  xpEarned: number;
  daily: boolean;
  completedAt: string;
  dateKey: string;
}

export interface DailyChallengeState {
  dateKey: string;
  category: CallCategory;
  completed: boolean;
}

interface ProgressState {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null;
  unlockedBadges: BadgeId[];
  categoriesCompleted: CallCategory[];
  recentRuns: CompletedRunSummary[];
  awardedRunIds: string[];
  daily: DailyChallengeState;
  /** True while the active call was started as today's daily challenge. */
  dailyRunActive: boolean;
  lastAward: CompletedRunSummary | null;
  /** Display name on Settings / future leaderboard. */
  displayName: string;
  /** Durable file URI for custom profile photo; null = placeholder. */
  avatarUri: string | null;
  /** Local notifications every ~6h with a random coach tip / scenario. */
  coachTipsEnabled: boolean;

  ensureDaily: () => void;
  beginDailyRun: () => CallCategory;
  clearDailyRunFlag: () => void;
  setDisplayName: (name: string) => void;
  setAvatarUri: (uri: string | null) => void;
  setCoachTipsEnabled: (enabled: boolean) => void;
  recordCompletedRun: (input: {
    result: EmtRunResult;
    category: CallCategory;
    difficulty: EmtDifficulty;
  }) => CompletedRunSummary | null;
}

function freshDaily(dateKey = todayKey()): DailyChallengeState {
  return {
    dateKey,
    category: pickDailyCategory(dateKey),
    completed: false,
  };
}

function withUnlocked(
  current: BadgeId[],
  next: BadgeId[]
): BadgeId[] {
  const set = new Set(current);
  for (const id of next) set.add(id);
  return [...set];
}

function evaluateNewBadges(ctx: {
  unlocked: BadgeId[];
  totalXp: number;
  currentStreak: number;
  runCount: number;
  categoriesCompleted: CallCategory[];
  stars: number;
  skillsSheetPass: boolean;
  difficulty: EmtDifficulty;
  dailyJustCompleted: boolean;
}): BadgeId[] {
  const earned: BadgeId[] = [];
  const has = (id: BadgeId) => ctx.unlocked.includes(id) || earned.includes(id);

  if (ctx.runCount >= 1 && !has('first_call')) earned.push('first_call');
  if (ctx.currentStreak >= 3 && !has('streak_3')) earned.push('streak_3');
  if (ctx.currentStreak >= 7 && !has('streak_7')) earned.push('streak_7');
  if (ctx.stars >= 5 && !has('five_star')) earned.push('five_star');
  if (ctx.difficulty === 'exam' && ctx.skillsSheetPass && !has('exam_pass')) {
    earned.push('exam_pass');
  }
  if (ctx.dailyJustCompleted && !has('daily_done')) earned.push('daily_done');
  if (
    ALL_CATEGORIES.every((c) => ctx.categoriesCompleted.includes(c)) &&
    !has('category_tour')
  ) {
    earned.push('category_tour');
  }
  if (ctx.totalXp >= 1000 && !has('centurion')) earned.push('centurion');

  return earned;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      unlockedBadges: [],
      categoriesCompleted: [],
      recentRuns: [],
      awardedRunIds: [],
      daily: freshDaily(),
      dailyRunActive: false,
      lastAward: null,
      displayName: '',
      avatarUri: null,
      coachTipsEnabled: false,

      ensureDaily: () => {
        const today = todayKey();
        const { daily } = get();
        if (daily.dateKey !== today) {
          set({ daily: freshDaily(today), dailyRunActive: false });
        }
      },

      beginDailyRun: () => {
        get().ensureDaily();
        const { daily } = get();
        set({ dailyRunActive: true });
        return daily.category;
      },

      clearDailyRunFlag: () => set({ dailyRunActive: false }),

      setDisplayName: (name) => set({ displayName: name.trim().slice(0, 32) }),

      setAvatarUri: (uri) => set({ avatarUri: uri }),

      setCoachTipsEnabled: (enabled) => set({ coachTipsEnabled: enabled }),

      recordCompletedRun: ({ result, category, difficulty }) => {
        const state = get();
        if (state.awardedRunIds.includes(result.callId)) {
          return null;
        }

        const today = todayKey();
        let daily = state.daily.dateKey === today ? state.daily : freshDaily(today);
        const isDaily =
          state.dailyRunActive &&
          !daily.completed &&
          category === daily.category &&
          daily.dateKey === today;

        const xpEarned = xpFromRun(result, difficulty, { dailyBonus: isDaily });

        // Streak: consecutive local calendar days with at least one completed call.
        let currentStreak = state.currentStreak;
        const last = state.lastPlayDate;
        if (!last) {
          currentStreak = 1;
        } else if (last === today) {
          currentStreak = Math.max(1, currentStreak);
        } else if (daysBetween(last, today) === 1) {
          currentStreak = currentStreak + 1;
        } else {
          currentStreak = 1;
        }
        const longestStreak = Math.max(state.longestStreak, currentStreak);

        const totalXp = state.totalXp + xpEarned;
        const categoriesCompleted = state.categoriesCompleted.includes(category)
          ? state.categoriesCompleted
          : [...state.categoriesCompleted, category];

        if (isDaily) {
          daily = { ...daily, completed: true };
        }

        const summary: CompletedRunSummary = {
          callId: result.callId,
          category,
          difficulty,
          score: result.totalScore,
          stars: result.stars,
          skillsSheetPass: result.skillsSheetPass,
          xpEarned,
          daily: isDaily,
          completedAt: new Date().toISOString(),
          dateKey: today,
        };

        const unlockedBadges = withUnlocked(
          state.unlockedBadges,
          evaluateNewBadges({
            unlocked: state.unlockedBadges,
            totalXp,
            currentStreak,
            runCount: state.recentRuns.length + 1,
            categoriesCompleted,
            stars: result.stars,
            skillsSheetPass: result.skillsSheetPass,
            difficulty,
            dailyJustCompleted: isDaily,
          })
        );

        set({
          totalXp,
          currentStreak,
          longestStreak,
          lastPlayDate: today,
          unlockedBadges,
          categoriesCompleted,
          recentRuns: [summary, ...state.recentRuns].slice(0, 40),
          awardedRunIds: [...state.awardedRunIds, result.callId].slice(-80),
          daily,
          dailyRunActive: false,
          lastAward: summary,
        });

        return summary;
      },
    }),
    {
      name: 'emt-progress-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        totalXp: s.totalXp,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastPlayDate: s.lastPlayDate,
        unlockedBadges: s.unlockedBadges,
        categoriesCompleted: s.categoriesCompleted,
        recentRuns: s.recentRuns,
        awardedRunIds: s.awardedRunIds,
        daily: s.daily,
        displayName: s.displayName,
        avatarUri: s.avatarUri,
        coachTipsEnabled: s.coachTipsEnabled,
      }),
    }
  )
);

export function selectLevelProgress(totalXp: number) {
  return levelFromXp(totalXp);
}

export function selectRankTitle(totalXp: number) {
  return getRankFromXp(totalXp).title;
}
