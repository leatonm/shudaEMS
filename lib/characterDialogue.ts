import type { EmtDifficulty, EmtRunResult } from '@/data/emt/types';

export type LaurenRank =
  | 'Outstanding'
  | 'Strong Work'
  | 'Solid Call'
  | 'Needs Polish'
  | 'Rebuild Basics';

export type ChatTone = 'default' | 'good' | 'warn' | 'bad' | 'rank';

export interface LaurenChatMessage {
  id: string;
  text: string;
  tone: ChatTone;
  label?: string;
}

let launchGreetingConsumed = false;

/** Show Lauren’s welcome once per app launch. */
export function shouldShowLaunchGreeting(): boolean {
  if (launchGreetingConsumed) return false;
  launchGreetingConsumed = true;
  return true;
}

export function laurenWelcomeLines(returning: boolean): { title: string; body: string } {
  if (returning) {
    return {
      title: 'Welcome back.',
      body: "Good to see you again. Pick Practice or Exam and we'll run another call — I'll debrief you after.",
    };
  }
  return {
    title: 'Welcome aboard.',
    body: "I'm Lauren, your Medical Director. I'll coach you after every run. Request ALS and Lee's crew will roll. Ready when you are.",
  };
}

export function laurenRankFromResult(
  result: Pick<EmtRunResult, 'stars' | 'skillsSheetPass' | 'totalScore'>
): LaurenRank {
  if (!result.skillsSheetPass || result.stars <= 1) return 'Rebuild Basics';
  if (result.stars >= 5 && result.totalScore >= 100) return 'Outstanding';
  if (result.stars >= 4) return 'Strong Work';
  if (result.stars >= 3) return 'Solid Call';
  return 'Needs Polish';
}

export function laurenRankColor(rank: LaurenRank): string {
  switch (rank) {
    case 'Outstanding':
      return '#22F5A8';
    case 'Strong Work':
      return '#00E5FF';
    case 'Solid Call':
      return '#FFC531';
    case 'Needs Polish':
      return '#FFB020';
    case 'Rebuild Basics':
      return '#FF4D6D';
  }
}

/** Build a short stepped debrief — details live in the full report. */
export function laurenDebriefChat(
  result: EmtRunResult,
  difficulty: EmtDifficulty
): { rank: LaurenRank; messages: LaurenChatMessage[] } {
  const rank = laurenRankFromResult(result);
  const messages: LaurenChatMessage[] = [];

  const openers: Record<LaurenRank, string> = {
    Outstanding:
      "Okay… {stars} stars and the patient came out ahead. I'm putting this one in the “show the interns” folder.",
    'Strong Work':
      'Nice work out there — {stars} stars. Fundamentals were clean. A couple tweaks and this becomes automatic.',
    'Solid Call':
      "{stars} stars. You kept the call moving. Not flashy — effective. Let's tighten the edges.",
    'Needs Polish':
      '{stars} stars. The bones of a good call are here, but a few misses slowed you down. No shame — we fix them.',
    'Rebuild Basics':
      "Alright, huddle up. {stars} star{s} and we need a reset on the skills-sheet order. I'll walk you through what hurt.",
  };

  messages.push({
    id: 'opener',
    tone: 'default',
    text: openers[rank]
      .replace('{stars}', String(result.stars))
      .replace('{s}', result.stars === 1 ? '' : 's'),
  });

  if (difficulty === 'practice') {
    if (result.criticalFails.length === 0) {
      messages.push({
        id: 'sheet-pass',
        label: 'PRACTICE',
        tone: 'good',
        text: 'Clean practice run — no critical criteria tripped. Keep that rhythm.',
      });
    } else {
      messages.push({
        id: 'sheet-coach',
        label: 'COACHING',
        tone: 'warn',
        text: 'Practice mode isn’t graded pass/fail. Let’s treat the critical criteria below as homework — then re-run it.',
      });
    }
  } else if (result.skillsSheetPass) {
    messages.push({
      id: 'sheet-pass',
      label: 'SKILLS SHEET',
      tone: 'good',
      text: 'Skills sheet: PASS. No critical criteria tripped.',
    });
  } else {
    messages.push({
      id: 'sheet-fail',
      label: 'SKILLS SHEET',
      tone: 'bad',
      text: 'Skills sheet: FAIL. On Exam, one critical miss ends the run.',
    });
  }

  if (result.criticalFails.length > 0) {
    const names = result.criticalFails.map((f) => f.label).join(' · ');
    messages.push({
      id: 'crit',
      label: difficulty === 'practice' ? 'DRILL THESE' : 'CRITICAL',
      tone: 'bad',
      text:
        result.criticalFails.length === 1
          ? `Critical criteria: ${names}. Open the full report for the detail.`
          : `${result.criticalFails.length} critical criteria: ${names}. Full report has each one.`,
    });
  }

  const misses = result.debrief.flowMisses ?? [];
  if (misses.length > 0) {
    messages.push({
      id: 'miss',
      label: 'FLOW',
      tone: 'warn',
      text:
        misses.length === 1
          ? `Flow miss to fix: ${misses[0]}`
          : `${misses.length} flow misses — top one: ${misses[0]}`,
    });
  }

  // Practice: review mid-call coaching notes (priority / order)
  if (difficulty === 'practice') {
    const notes = (result.coachNotes ?? result.debrief.coachNotes ?? []).filter(
      (n) => n.kind === 'priority' || n.kind === 'order'
    );
    if (notes.length > 0) {
      const top = notes.slice(0, 2);
      messages.push({
        id: 'coach-review',
        label: 'GUIDANCE REVIEW',
        tone: 'warn',
        text:
          top.length === 1
            ? `During the call I flagged: ${top[0].text}`
            : `During the call I flagged ${notes.length} moments — starting with: ${top[0].text}`,
      });
    }
  }

  const well = result.debrief.whatWentWell[0];
  if (well) {
    messages.push({
      id: 'well',
      label: 'WHAT WORKED',
      tone: 'good',
      text: well,
    });
  }

  const improve = result.debrief.improveNext[0];
  if (improve) {
    messages.push({
      id: 'improve',
      label: 'HOMEWORK',
      tone: 'warn',
      text: improve,
    });
  }

  const closers: Record<LaurenRank, string> = {
    Outstanding: 'Take the win — then try Exam when you want the pressure.',
    'Strong Work': 'One more clean Practice rep, then sit Exam when you feel spicy.',
    'Solid Call': 'Replay this category once more while the rhythm is fresh.',
    'Needs Polish': 'Stay on Practice — fix those misses, then I’ll re-rank you.',
    'Rebuild Basics': 'Stay on Practice for a couple runs. I’ll meet you after each one.',
  };

  messages.push({
    id: 'close',
    tone: 'default',
    text: closers[rank],
  });

  return { rank, messages };
}

const ALS_ENROUTE = [['Copy.', 'En route.']];

const ALS_CANCEL = [
  ['Copy.', 'Standing down.'],
  ['Got it.', 'Canceling.'],
  ['Medic copy.', "We're clear."],
  ['Understood.', 'Holding back.'],
  ['Copy that.', 'Return to service.'],
];

export type AlsFlashMode = 'enroute' | 'cancel';
export type ResourceCrew = 'als' | 'fire' | 'pd';

export function resourceCallsign(crew: ResourceCrew): string {
  switch (crew) {
    case 'als':
      return 'LEE · MEDIC';
    case 'fire':
      return 'FIRE / RESCUE';
    case 'pd':
      return 'LAW ENFORCEMENT';
  }
}

/** Short radio lines for resource slide-ins. */
export function leeAlsLines(mode: AlsFlashMode = 'enroute'): string[] {
  if (mode === 'enroute') return ['Copy.', 'En route.'];
  const pool = ALS_CANCEL;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Simple enroute radio lines for any crew. */
export function resourceEnrouteLines(crew: ResourceCrew): string[] {
  if (crew === 'als') return ['Copy.', 'En route.'];
  if (crew === 'fire') return ['Copy.', 'En route.'];
  return ['Copy.', 'En route.'];
}

export function isAlsRequestChoice(choice: { payload?: string; id: string }): boolean {
  return choice.payload === 'request_als' || choice.id.includes('request_als');
}

export function isFireRequestChoice(choice: { payload?: string; id: string }): boolean {
  return choice.payload === 'request_fire' || choice.id.includes('request_fire');
}

export function isPdRequestChoice(choice: { payload?: string; id: string }): boolean {
  return choice.payload === 'request_pd' || choice.id.includes('request_pd');
}

export function resourceCrewFromChoice(choice: {
  payload?: string;
  id: string;
}): ResourceCrew | null {
  if (isAlsRequestChoice(choice)) return 'als';
  if (isFireRequestChoice(choice)) return 'fire';
  if (isPdRequestChoice(choice)) return 'pd';
  return null;
}
