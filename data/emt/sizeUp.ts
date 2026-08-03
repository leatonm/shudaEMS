import type { EmtPhase } from '@/data/emt/types';

/** NREMT-style size-up elements the student must verbalize before continuing. */
export interface SizeUpEssential {
  id: string;
  label: string;
  /** Any of these actions marks the essential complete. */
  actionIds: string[];
  /** Primary tap target shown on the size-up board. */
  primaryActionId: string;
}

export const SIZE_UP_ESSENTIALS: SizeUpEssential[] = [
  {
    id: 'ppe',
    label: 'PPE / BSI',
    actionIds: ['don_ppe'],
    primaryActionId: 'don_ppe',
  },
  {
    id: 'scene',
    label: 'Scene Safety',
    actionIds: ['verbalize_scene_safe'],
    primaryActionId: 'verbalize_scene_safe',
  },
  {
    id: 'patients',
    label: 'Number of Patients',
    actionIds: ['count_patients'],
    primaryActionId: 'count_patients',
  },
  {
    id: 'resources',
    label: 'Additional Resources',
    actionIds: [
      'consider_resources',
      'request_als',
      'request_fire',
      'request_pd',
      'request_air',
      'request_ambo',
      'request_hazmat',
      'request_rescue',
      'request_supervisor',
    ],
    primaryActionId: 'consider_resources',
  },
  {
    id: 'moi',
    label: 'NOI / MOI',
    actionIds: ['assess_moi'],
    primaryActionId: 'assess_moi',
  },
];

/** Core xABC steps before opening the full care menu. */
export const PRIMARY_ABC_ACTIONS = [
  { id: 'airway', label: 'Airway (xABC)' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'circulation', label: 'Circulation' },
  { id: 'disability', label: 'Disability' },
  { id: 'exposure', label: 'Exposure' },
] as const;

/** Life threats the student can address during primary. */
export const CRITICAL_TREATMENT_ACTIONS = [
  { id: 'oxygen', label: 'Oxygen' },
  { id: 'bleeding_control', label: 'Bleeding Control' },
  { id: 'suction', label: 'Suction' },
  { id: 'airway_adjunct', label: 'OPA / NPA' },
  { id: 'bvm', label: 'BVM' },
  { id: 'cpr', label: 'CPR' },
  { id: 'aed', label: 'AED' },
  { id: 'position_comfort', label: 'Position of Comfort' },
] as const;

export const CALL_FLOW_STEPS: Array<{ id: EmtPhase; label: string }> = [
  { id: 'scene_safety', label: 'Size-Up' },
  { id: 'primary_survey', label: 'Primary' },
  { id: 'on_scene', label: 'Care' },
];

export function isSizeUpEssentialDone(
  essential: SizeUpEssential,
  completedActions: string[]
): boolean {
  const set = new Set(completedActions);
  return essential.actionIds.some((id) => set.has(id));
}

export function sizeUpComplete(completedActions: string[]): boolean {
  return SIZE_UP_ESSENTIALS.every((e) => isSizeUpEssentialDone(e, completedActions));
}

export function sizeUpProgress(completedActions: string[]): {
  done: number;
  total: number;
  items: Array<SizeUpEssential & { complete: boolean }>;
} {
  const items = SIZE_UP_ESSENTIALS.map((e) => ({
    ...e,
    complete: isSizeUpEssentialDone(e, completedActions),
  }));
  return {
    done: items.filter((i) => i.complete).length,
    total: items.length,
    items,
  };
}

export function coreAbcComplete(abcdeCompleted: string[]): boolean {
  return ['airway', 'breathing', 'circulation'].every((s) => abcdeCompleted.includes(s));
}
