import { anaphylaxis } from '@/data/conditions/anaphylaxis';
import { chf } from '@/data/conditions/chf';
import { copdAsthma } from '@/data/conditions/copdAsthma';
import { monomorphicVT } from '@/data/conditions/monomorphicVT';
import { sepsis } from '@/data/conditions/sepsis';
import { seizure } from '@/data/conditions/seizure';
import { stemi } from '@/data/conditions/stemi';
import { stroke } from '@/data/conditions/stroke';
import { torsades } from '@/data/conditions/torsades';
import type {
  ConditionCategory,
  ConditionDefinition,
  CoreConditionId,
} from '@/data/conditions/types';

/** All 9 core conditions — no more protocols until gameplay is proven. */
export const CONDITION_REGISTRY: Record<CoreConditionId, ConditionDefinition> = {
  sepsis,
  chf,
  copdAsthma,
  seizure,
  stemi,
  stroke,
  anaphylaxis,
  monomorphic_vt: monomorphicVT,
  torsades,
};

export const CORE_CONDITION_IDS = Object.keys(CONDITION_REGISTRY) as CoreConditionId[];

export const CONDITIONS_BY_CATEGORY: Record<ConditionCategory, ConditionDefinition[]> = {
  medical: [sepsis],
  respiratory: [copdAsthma, anaphylaxis],
  neurologic: [seizure, stroke],
  cardiac: [chf, stemi, monomorphicVT, torsades],
};

export function getCondition(id: CoreConditionId): ConditionDefinition {
  const condition = CONDITION_REGISTRY[id];
  if (!condition) {
    throw new Error(`Unknown condition "${id}".`);
  }
  return condition;
}

export function listConditions(): ConditionDefinition[] {
  return CORE_CONDITION_IDS.map((id) => CONDITION_REGISTRY[id]);
}

export function getConditionsForDispatch(dispatchType: string): ConditionDefinition[] {
  return listConditions().filter((c) => c.dispatchTypes.includes(dispatchType));
}

export function getConditionsByCategory(category: ConditionCategory): ConditionDefinition[] {
  return CONDITIONS_BY_CATEGORY[category];
}
