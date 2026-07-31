import { chestPain } from './archetypes/chestPain';
import {
  anaphylaxisMedical,
  cardiacArrest,
  overdoseAms,
  respiratoryDistress,
} from './archetypes/medical';
import { mciStart } from './archetypes/mci';
import { childbirth, obEmergency } from './archetypes/ob';
import { pediatricChoking, pediatricFebrile } from './archetypes/peds';
import { stroke } from './archetypes/stroke';
import { bleedingTrauma, mvcTrauma } from './archetypes/trauma';
import type { CallCategory, ScenarioArchetype } from './types';

export const EMT_ARCHETYPE_REGISTRY: Record<string, ScenarioArchetype> = {
  // Medical
  chest_pain: chestPain,
  stroke,
  cardiac_arrest: cardiacArrest,
  respiratory_distress: respiratoryDistress,
  anaphylaxis: anaphylaxisMedical,
  overdose_ams: overdoseAms,
  // Trauma
  mvc_trauma: mvcTrauma,
  bleeding_trauma: bleedingTrauma,
  // Peds
  pediatric_choking: pediatricChoking,
  pediatric_febrile: pediatricFebrile,
  // OB
  childbirth,
  ob_emergency: obEmergency,
  // MCI
  mci_start: mciStart,
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

export function listArchetypesByCategory(category: CallCategory): ScenarioArchetype[] {
  return listArchetypes().filter((a) => a.category === category);
}

export function pickArchetypeIdForCategory(
  category: CallCategory,
  rng: () => number
): string {
  const pool = listArchetypesByCategory(category);
  if (pool.length === 0) {
    throw new Error(`No archetypes registered for category "${category}".`);
  }
  return pool[Math.floor(rng() * pool.length)].id;
}
