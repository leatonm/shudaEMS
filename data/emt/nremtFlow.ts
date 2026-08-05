import type { CallCategory, EmtPhase } from '@/data/emt/types';

/**
 * NREMT Patient Assessment board stages (Medical sheet as primary model).
 * Bottom CTA advances these — menus stay free-choice the whole time.
 */
export type NremtStage =
  | 'scene_sizeup'
  | 'primary_survey'
  | 'history'
  | 'secondary'
  | 'vitals'
  | 'reassessment'
  | 'report';

export interface NremtStageInfo {
  id: NremtStage;
  /** Short label under CAD / status. */
  title: string;
  /** Bottom button label to LEAVE this stage. */
  advanceLabel: string;
  /** Maps to store `phase` for scoring / physio. */
  phase: EmtPhase;
  /** Lauren lines when entering this stage. */
  enterLines: string[];
  /** Actions that "should" be done before advancing (soft — free play still allowed). */
  expectedActions: string[];
}

/** Medical sheet progression (trauma uses same board labels for now). */
export const NREMT_MEDICAL_STAGES: NremtStageInfo[] = [
  {
    id: 'scene_sizeup',
    title: 'Scene Size-Up',
    advanceLabel: 'MAKE PATIENT CONTACT',
    phase: 'scene_safety',
    enterLines: [
      'Start with scene size-up.',
      'Scene safety, patients, MOI or NOI, resources, and C-spine as needed.',
    ],
    expectedActions: [
      'don_ppe',
      'verbalize_scene_safe',
      'count_patients',
      'assess_moi',
      'consider_resources',
      'declare_moi',
      'declare_noi',
      'c_spine',
    ],
  },
  {
    id: 'primary_survey',
    title: 'Primary Survey',
    advanceLabel: 'HISTORY TAKING',
    phase: 'primary_survey',
    enterLines: [
      'This is the Primary Survey — patient contact.',
      'Open Assessment → Primary (xABC). Treat life threats under Treatment as you find them.',
    ],
    expectedActions: [
      'general_impression',
      'assess_loc',
      'disability',
      'airway',
      'breathing',
      'circulation',
      'major_bleeding',
      'oxygen',
    ],
  },
  {
    id: 'history',
    title: 'History Taking',
    advanceLabel: 'SECONDARY ASSESSMENT',
    phase: 'history',
    enterLines: [
      'History taking.',
      'Work through OPQRST and SAMPLE — clarifying questions as needed.',
    ],
    expectedActions: ['opqrst', 'sample', 'allergies', 'medications_hx', 'pmh', 'events'],
  },
  {
    id: 'secondary',
    title: 'Secondary Assessment',
    advanceLabel: 'VITAL SIGNS',
    phase: 'on_scene',
    enterLines: [
      'Secondary assessment.',
      'Assess the affected body part or system for this presentation.',
    ],
    expectedActions: ['secondary_assessment', 'lung_sounds', 'skin_signs', 'cap_refill'],
  },
  {
    id: 'vitals',
    title: 'Vital Signs',
    advanceLabel: 'REASSESSMENT',
    phase: 'on_scene',
    enterLines: [
      'Vital signs and field impression.',
      'Obtain BP, pulse, and respirations. State your impression and interventions.',
    ],
    expectedActions: ['vital_bp', 'vital_pulse', 'vital_rr', 'check_spo2'],
  },
  {
    id: 'reassessment',
    title: 'Reassessment',
    advanceLabel: 'VERBAL REPORT',
    phase: 'on_scene',
    enterLines: [
      'Reassessment.',
      'Show how and when you reassess, then prepare an accurate verbal report.',
    ],
    expectedActions: ['reassessment'],
  },
  {
    id: 'report',
    title: 'Verbal Report',
    advanceLabel: 'HAND OFF',
    phase: 'on_scene',
    enterLines: [
      'Set destination and transport mode under Transport, then deliver your verbal handoff.',
    ],
    expectedActions: ['load_and_go', 'stay_and_play', 'verbal_handoff', 'begin_handoff'],
  },
];

export function nremtStagesForCategory(_category: CallCategory): NremtStageInfo[] {
  // Trauma sheet differs; medical board is the current driver.
  return NREMT_MEDICAL_STAGES;
}

export function getNremtStage(
  stageId: NremtStage,
  category: CallCategory = 'medical'
): NremtStageInfo {
  const stages = nremtStagesForCategory(category);
  return stages.find((s) => s.id === stageId) ?? stages[0];
}

export function nextNremtStage(
  stageId: NremtStage,
  category: CallCategory = 'medical'
): NremtStageInfo | null {
  const stages = nremtStagesForCategory(category);
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx < 0 || idx >= stages.length - 1) return null;
  return stages[idx + 1];
}

/** Soft completeness for coaching / silent flow-miss scoring. */
export function stageCoverage(
  stage: NremtStageInfo,
  completedActions: string[]
): { done: number; total: number; missing: string[] } {
  const set = new Set(completedActions);
  // Count unique "buckets" — any of related IDs can satisfy loosely.
  const buckets: string[][] = [];
  if (stage.id === 'scene_sizeup') {
    buckets.push(
      ['don_ppe'],
      ['verbalize_scene_safe'],
      ['count_patients'],
      ['assess_moi', 'declare_moi', 'declare_noi'],
      [
        'consider_resources',
        'resource_pick_none',
        'resource_als_enroute',
        'resource_als_standby',
        'resource_pd_enroute',
        'resource_pd_standby',
        'resource_fire_enroute',
        'resource_fire_standby',
        'request_als',
        'request_fire',
        'request_pd',
      ],
      ['c_spine']
    );
  } else if (stage.id === 'primary_survey') {
    buckets.push(
      ['general_impression'],
      ['assess_loc', 'disability'],
      ['chief_complaint'],
      ['airway'],
      ['breathing', 'oxygen', 'work_of_breathing'],
      ['circulation', 'major_bleeding', 'skin_signs', 'cap_refill']
    );
  } else if (stage.id === 'history') {
    buckets.push(['opqrst'], ['sample', 'allergies', 'medications_hx', 'pmh', 'events']);
  } else {
    buckets.push(...stage.expectedActions.map((a) => [a]));
  }

  let done = 0;
  const missing: string[] = [];
  for (const bucket of buckets) {
    if (bucket.some((id) => set.has(id))) done += 1;
    else missing.push(bucket[0]);
  }
  return { done, total: buckets.length, missing };
}
