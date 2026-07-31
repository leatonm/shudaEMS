import { chestPain } from '@/data/emt/archetypes/chestPain';
import { stroke } from '@/data/emt/archetypes/stroke';
import type { ScenarioArchetype } from '@/data/emt/types';

export const EMT_ARCHETYPE_REGISTRY: Record<string, ScenarioArchetype> = {
  chest_pain: chestPain,
  stroke,
};

export const EMT_ARCHETYPE_IDS = Object.keys(EMT_ARCHETYPE_REGISTRY);

export function getArchetype(id: string): ScenarioArchetype {
  const archetype = EMT_ARCHETYPE_REGISTRY[id];
  if (!archetype) {
    throw new Error(`Unknown EMT archetype "${id}".`);
  }
  return archetype;
}

export function listArchetypes(): ScenarioArchetype[] {
  return EMT_ARCHETYPE_IDS.map((id) => EMT_ARCHETYPE_REGISTRY[id]);
}
