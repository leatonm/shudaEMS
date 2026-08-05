import type { EmtDifficulty, TimelineEntry } from '@/data/emt/types';
import type { LaurenExchange } from '@/data/emt/laurenFindings';

export type { EmtDifficulty };

/** How much coaching the student gets during the call. Teaching stays on debrief. */
export const DIFFICULTY_OPTIONS: Array<{
  id: EmtDifficulty;
  label: string;
  description: string;
}> = [
  {
    id: 'practice',
    label: 'Practice',
    description:
      'Hints, systematic coaching, no clock pressure — learn without pass/fail.',
  },
  {
    id: 'exam',
    label: 'Exam',
    description: 'Timed run, critical fails, NREMT-style pass/fail.',
  },
];

/** Graded pass/fail only on Exam. */
export function isExamMode(difficulty: EmtDifficulty): boolean {
  return difficulty === 'exam';
}

export function isPracticeMode(difficulty: EmtDifficulty): boolean {
  return difficulty === 'practice';
}

/** Elapsed call timer — Exam only. */
export function showCallTimer(difficulty: EmtDifficulty): boolean {
  return difficulty === 'exam';
}

export function showActionTips(difficulty: EmtDifficulty): boolean {
  return difficulty === 'practice';
}

export function showPhaseCoaching(difficulty: EmtDifficulty): boolean {
  return difficulty === 'practice';
}

/** Lauren may suggest next moves / tip choices (Practice only). */
export function showLaurenSuggestions(difficulty: EmtDifficulty): boolean {
  return difficulty === 'practice';
}

/** Practice = full coaching replies; Exam = minimal cues. */
export function laurenGestureLevel(
  difficulty: EmtDifficulty
): 'full' | 'gesture' | 'minimal' {
  return difficulty === 'practice' ? 'full' : 'minimal';
}

export function showHazardDetails(difficulty: EmtDifficulty): boolean {
  return difficulty === 'practice';
}

/**
 * Shape Lauren’s mid-call reply for the active difficulty.
 * Practice: tips + suggestions. Exam: minimal factual cue.
 */
export function presentLaurenExchange(
  difficulty: EmtDifficulty,
  exchange: LaurenExchange
): LaurenExchange {
  const level = laurenGestureLevel(difficulty);

  if (level === 'full') {
    return exchange;
  }

  // Decision prompts the player must answer (not coaching tips).
  const decisionIds = new Set([
    'declare_moi',
    'declare_noi',
    'resource_pick_als',
    'resource_pick_pd',
    'resource_pick_fire',
    'resource_pick_none',
    'resource_als_enroute',
    'resource_als_standby',
    'resource_pd_enroute',
    'resource_pd_standby',
    'resource_fire_enroute',
    'resource_fire_standby',
    'continue_care_wrap',
    'confirm_stay_and_play',
  ]);
  const decisions = exchange.followUps?.filter((f) => decisionIds.has(f.actionId));

  const first = exchange.laurenLines[0];
  return {
    studentLine: exchange.studentLine,
    laurenLines: first
      ? [first.length > 72 ? `${first.slice(0, 69)}…` : first]
      : ['Noted.'],
    reveal: exchange.reveal,
    followUps: decisions?.length ? decisions : undefined,
  };
}

/** Live feedback during the call — hide answer keys on Exam. */
export function formatLiveFeedback(
  difficulty: EmtDifficulty,
  entry: Pick<TimelineEntry, 'message' | 'severity' | 'scoreDelta'>
): { text: string; showSeverity: boolean } {
  if (difficulty === 'practice') {
    return { text: entry.message, showSeverity: true };
  }

  return { text: '…', showSeverity: false };
}
