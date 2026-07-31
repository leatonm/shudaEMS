import type { CallCategory, CoreConditionId } from '@/data/conditions/types';

/** Primary dispatch types for gameplay milestone — realistic differentials per call. */
export const MILESTONE_DISPATCH_TYPES = [
  'Difficulty Breathing',
  'Chest Pain',
  'Altered Mental Status',
  'Palpitations',
] as const;

export type MilestoneDispatchType = (typeof MILESTONE_DISPATCH_TYPES)[number];

/** Short codes players/dispatchers use — resolved before call routing. */
export const DISPATCH_ALIASES: Record<string, string> = {
  AMS: 'Altered Mental Status',
  SOB: 'Shortness of Breath',
  DB: 'Difficulty Breathing',
  CP: 'Chest Pain',
};

/** Dispatch-first routing — player sees chief complaint, not the hidden diagnosis. */
export const CALL_CATEGORIES: CallCategory[] = [
  {
    dispatchType: 'Difficulty Breathing',
    conditions: [
      { id: 'chf', weight: 3 },
      { id: 'copdAsthma', weight: 3 },
      { id: 'anaphylaxis', weight: 2 },
      { id: 'sepsis', weight: 2 },
    ],
  },
  {
    dispatchType: 'Shortness of Breath',
    conditions: [
      { id: 'chf', weight: 3 },
      { id: 'copdAsthma', weight: 3 },
      { id: 'monomorphic_vt', weight: 2 },
    ],
  },
  {
    dispatchType: 'Wheezing',
    conditions: [
      { id: 'copdAsthma', weight: 3 },
      { id: 'anaphylaxis', weight: 2 },
      { id: 'chf', weight: 1 },
    ],
  },
  {
    dispatchType: 'Chest Pain',
    conditions: [
      { id: 'stemi', weight: 3 },
      { id: 'monomorphic_vt', weight: 2 },
      { id: 'chf', weight: 2 },
    ],
  },
  {
    dispatchType: 'Palpitations',
    conditions: [
      { id: 'monomorphic_vt', weight: 3 },
      { id: 'torsades', weight: 3 },
    ],
  },
  {
    dispatchType: 'Rapid Heart Rate',
    conditions: [{ id: 'monomorphic_vt', weight: 4 }],
  },
  {
    dispatchType: 'Near Syncope',
    conditions: [
      { id: 'monomorphic_vt', weight: 3 },
      { id: 'torsades', weight: 2 },
    ],
  },
  {
    dispatchType: 'Syncope',
    conditions: [
      { id: 'torsades', weight: 4 },
      { id: 'monomorphic_vt', weight: 1 },
    ],
  },
  {
    dispatchType: 'Cardiac Rhythm Disturbance',
    conditions: [
      { id: 'torsades', weight: 3 },
      { id: 'monomorphic_vt', weight: 3 },
    ],
  },
  {
    dispatchType: 'Near Arrest',
    conditions: [{ id: 'torsades', weight: 4 }],
  },
  {
    dispatchType: 'Unresponsive',
    conditions: [
      { id: 'torsades', weight: 3 },
      { id: 'seizure', weight: 2 },
      { id: 'stroke', weight: 1 },
    ],
  },
  {
    dispatchType: 'Altered Mental Status',
    conditions: [
      { id: 'sepsis', weight: 3 },
      { id: 'seizure', weight: 3 },
      { id: 'stroke', weight: 3 },
    ],
  },
  {
    dispatchType: 'Seizure',
    conditions: [
      { id: 'seizure', weight: 4 },
      { id: 'stroke', weight: 1 },
    ],
  },
  {
    dispatchType: 'Weakness',
    conditions: [
      { id: 'stroke', weight: 4 },
      { id: 'sepsis', weight: 2 },
    ],
  },
  {
    dispatchType: 'Difficulty Speaking',
    conditions: [{ id: 'stroke', weight: 4 }],
  },
  {
    dispatchType: 'Dizziness',
    conditions: [
      { id: 'stroke', weight: 3 },
      { id: 'monomorphic_vt', weight: 2 },
      { id: 'torsades', weight: 2 },
    ],
  },
  {
    dispatchType: 'Fall',
    conditions: [
      { id: 'sepsis', weight: 3 },
      { id: 'stroke', weight: 2 },
    ],
  },
  {
    dispatchType: 'General Weakness',
    conditions: [
      { id: 'sepsis', weight: 4 },
      { id: 'stemi', weight: 1 },
    ],
  },
  {
    dispatchType: 'Flu Symptoms',
    conditions: [{ id: 'sepsis', weight: 3 }],
  },
  {
    dispatchType: 'Not Feeling Well',
    conditions: [
      { id: 'sepsis', weight: 3 },
      { id: 'stemi', weight: 1 },
    ],
  },
  {
    dispatchType: 'Allergic Reaction',
    conditions: [{ id: 'anaphylaxis', weight: 4 }],
  },
  {
    dispatchType: 'Bee Sting',
    conditions: [{ id: 'anaphylaxis', weight: 4 }],
  },
  {
    dispatchType: 'Medication Reaction',
    conditions: [{ id: 'anaphylaxis', weight: 4 }],
  },
  {
    dispatchType: 'Collapse',
    conditions: [
      { id: 'anaphylaxis', weight: 3 },
      { id: 'sepsis', weight: 2 },
    ],
  },
];

export const DISPATCH_TYPES: string[] = CALL_CATEGORIES.map((c) => c.dispatchType);

export function normalizeDispatchType(input: string): string {
  const trimmed = input.trim();
  const alias = DISPATCH_ALIASES[trimmed] ?? DISPATCH_ALIASES[trimmed.toUpperCase()];
  if (alias) return alias;

  const match = CALL_CATEGORIES.find(
    (c) => c.dispatchType.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.dispatchType ?? trimmed;
}

export function getEligibleConditions(
  dispatchType: string,
  exclude: CoreConditionId[] = []
): CallCategory['conditions'] {
  const normalized = normalizeDispatchType(dispatchType);
  const category = CALL_CATEGORIES.find((c) => c.dispatchType === normalized);
  if (!category) return [];
  return category.conditions.filter((c) => !exclude.includes(c.id));
}
