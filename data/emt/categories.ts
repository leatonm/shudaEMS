import type { CallCategory } from '@/data/emt/types';

export interface CallCategoryInfo {
  id: CallCategory;
  label: string;
  description: string;
  examples: string;
}

export const CALL_CATEGORIES: CallCategoryInfo[] = [
  {
    id: 'medical',
    label: 'Medical',
    description: 'Cardiac, respiratory, neuro, allergic, overdose, and more.',
    examples: 'Chest pain · Stroke · Cardiac arrest · Breathing · Anaphylaxis',
  },
  {
    id: 'trauma',
    label: 'Trauma',
    description: 'Injury, bleeding, MVC, falls, and mechanism-based care.',
    examples: 'MVC · Bleeding · Fall · Penetrating injury',
  },
  {
    id: 'peds',
    label: 'Pediatric',
    description: 'Infants and children — airway, choking, fever, trauma.',
    examples: 'Choking · Febrile seizure · Pediatric trauma',
  },
  {
    id: 'ob',
    label: 'OB',
    description: 'Pregnancy and childbirth emergencies.',
    examples: 'Active labor · Delivery · OB complications',
  },
  {
    id: 'mci',
    label: 'MCI',
    description: 'Multi-casualty — command, mutual aid, and START triage.',
    examples: 'Tornado · Bus crash · Mass casualty triage',
  },
];

export function getCategoryInfo(id: CallCategory): CallCategoryInfo {
  const found = CALL_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category "${id}"`);
  return found;
}
