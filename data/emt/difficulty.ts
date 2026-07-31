import type { EmtDifficulty, TimelineEntry } from '@/data/emt/types';

export type { EmtDifficulty };

/** How much coaching the student gets during the call. Teaching stays on debrief. */
export const DIFFICULTY_OPTIONS: Array<{
  id: EmtDifficulty;
  label: string;
  description: string;
}> = [
  {
    id: 'coach',
    label: 'Coach',
    description: 'Light hints and immediate feedback — good for first runs.',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Findings only. No action tips. Feedback is short.',
  },
  {
    id: 'exam',
    label: 'Exam',
    description:
      'NREMT pressure. Minimal coaching. One critical fail = skills sheet FAIL.',
  },
];

export function showActionTips(difficulty: EmtDifficulty): boolean {
  return difficulty === 'coach';
}

export function showPhaseCoaching(difficulty: EmtDifficulty): boolean {
  return difficulty === 'coach';
}

export function showHazardDetails(difficulty: EmtDifficulty): boolean {
  return difficulty !== 'exam';
}

/** Live feedback during the call — hide answer keys on harder modes. */
export function formatLiveFeedback(
  difficulty: EmtDifficulty,
  entry: Pick<TimelineEntry, 'message' | 'severity' | 'scoreDelta'>
): { text: string; showSeverity: boolean } {
  if (difficulty === 'coach') {
    return { text: entry.message, showSeverity: true };
  }

  if (difficulty === 'standard') {
    // Standard mode removes pre-decision hints, but still teaches after the
    // provider commits to an action.
    return {
      text: entry.message,
      showSeverity: entry.severity === 'good' || entry.severity === 'bad',
    };
  }

  // exam — almost silent during play
  return { text: '…', showSeverity: false };
}
