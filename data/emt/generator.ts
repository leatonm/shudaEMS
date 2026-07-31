import {
  actionToOption,
  destinationOptions,
  TRANSPORT_PRIORITY_OPTIONS,
} from '@/data/emt/actions';
import { getArchetype, EMT_ARCHETYPE_IDS } from '@/data/emt/registry';
import type { EmtCall, ScenarioArchetype } from '@/data/emt/types';
import {
  createRng,
  generateId,
  pickRandom,
  randomInt,
  randomSubset,
  type Rng,
} from '@/data/generators/rng';

const UNITS = ['Medic 4', 'Engine 2', 'Unit 12', 'Rescue 7', 'Ambulance 3'];

function buildVitals(archetype: ScenarioArchetype, rng: Rng) {
  const sbp = pickRandom(archetype.vitalsPools.sbp, rng);
  const dbp = pickRandom(archetype.vitalsPools.dbp, rng);
  return {
    bp: `${sbp}/${dbp}`,
    hr: pickRandom(archetype.vitalsPools.hr, rng),
    rr: pickRandom(archetype.vitalsPools.rr, rng),
    spo2: pickRandom(archetype.vitalsPools.spo2, rng),
    glucose: archetype.vitalsPools.glucose
      ? pickRandom(archetype.vitalsPools.glucose, rng)
      : undefined,
    mentalStatus: pickRandom(archetype.vitalsPools.mentalStatus, rng),
  };
}

export interface GenerateEmtCallOptions {
  archetypeId?: string;
  seed?: number;
}

export function generateEmtCall(options: GenerateEmtCallOptions = {}): EmtCall {
  const rng = createRng(options.seed);
  const archetypeId =
    options.archetypeId ?? pickRandom(EMT_ARCHETYPE_IDS, rng);
  const archetype = getArchetype(archetypeId);

  const [minH, maxH] = archetype.hazardPickCount;
  const hazardCount = randomInt(minH, maxH, rng);
  const hazards = randomSubset(archetype.hazardPool, hazardCount, rng);

  const age = randomInt(archetype.ageRange[0], archetype.ageRange[1], rng);
  const sex = pickRandom(archetype.sexOptions, rng);
  const complaint = pickRandom(archetype.dispatchTemplates, rng);
  const appearance = pickRandom(archetype.patientSummaries, rng);

  return {
    id: generateId(`emt_${archetype.id}`, rng),
    archetypeId: archetype.id,
    unit: pickRandom(UNITS, rng),
    priority: pickRandom([1, 1, 2] as const, rng),
    dispatch: complaint,
    patientSummary: `${age}yo ${sex} — ${appearance}`,
    age,
    sex,
    hazards,
    abcde: archetype.abcde,
    history: archetype.history,
    vitals: buildVitals(archetype, rng),
    safetyActions: archetype.safetyActions.map(actionToOption),
    requiredSafety: [...archetype.requiredSafety],
    requiredAbcdeOrder: [...archetype.requiredAbcdeOrder],
    treatmentActions: archetype.treatmentActions.map(actionToOption),
    recommendedTreatment: [...archetype.recommendedTreatment],
    harmfulTreatment: [...archetype.harmfulTreatment],
    transportPriorityOptions: TRANSPORT_PRIORITY_OPTIONS.filter((o) =>
      archetype.transportPriorities.includes(o.id as 'emergency' | 'urgent' | 'non_urgent')
    ),
    correctTransportPriority: archetype.correctTransportPriority,
    destinationOptions: destinationOptions(archetype.destinations),
    correctDestination: archetype.correctDestination,
    pearls: [...archetype.pearls],
    universalPrinciples: [...archetype.universalPrinciples],
    protocolNotes: [...(archetype.protocolNotes ?? [])],
  };
}
