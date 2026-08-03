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
    id: 'coach',
    label: 'Coach',
    description: 'Lauren offers tips and suggestions during the call.',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Brief findings only — no coaching tips mid-call.',
  },
  {
    id: 'exam',
    label: 'Exam Mode',
    description: 'Minimal cues, no hints, NREMT-style critical fails.',
  },
];

export function showActionTips(difficulty: EmtDifficulty): boolean {
  return difficulty === 'coach';
}

export function showPhaseCoaching(difficulty: EmtDifficulty): boolean {
  return difficulty === 'coach';
}

/** Lauren may suggest next moves / tip choices (Coach only). */
export function showLaurenSuggestions(difficulty: EmtDifficulty): boolean {
  return difficulty === 'coach';
}

/** Standard = short nod; Exam = barely there; Coach = full reply. */
export function laurenGestureLevel(
  difficulty: EmtDifficulty
): 'full' | 'gesture' | 'minimal' {
  if (difficulty === 'coach') return 'full';
  if (difficulty === 'exam') return 'minimal';
  return 'gesture';
}

export function showHazardDetails(difficulty: EmtDifficulty): boolean {
  return difficulty !== 'exam';
}

/**
 * Shape Lauren’s mid-call reply for the active difficulty.
 * Coach: tips + suggestions. Standard: short factual gesture. Exam: minimal.
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
  ]);
  const decisions = exchange.followUps?.filter((f) => decisionIds.has(f.actionId));

  if (level === 'minimal') {
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

  // standard — small gesture: 1–2 factual lines, no tip choices
  return {
    studentLine: exchange.studentLine,
    laurenLines: exchange.laurenLines.slice(0, 2),
    reveal: exchange.reveal,
    followUps: decisions?.length ? decisions : undefined,
  };
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
    return {
      text: entry.message,
      showSeverity: entry.severity === 'good' || entry.severity === 'bad',
    };
  }

  return { text: '…', showSeverity: false };
}
