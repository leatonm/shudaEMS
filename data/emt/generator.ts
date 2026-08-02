import {
  actionToOption,
  destinationOptions,
  TRANSPORT_PRIORITY_OPTIONS,
} from '@/data/emt/actions';
import {
  EMT_ARCHETYPE_IDS,
  getArchetype,
  pickArchetypeIdForCategory,
} from '@/data/emt/registry';
import { pickResourcesOnScene } from '@/data/emt/resources';
import type { CallCategory, EmtCall, ScenarioArchetype } from '@/data/emt/types';
import {
  createRng,
  generateId,
  pickRandom,
  randomInt,
  randomSubset,
  type Rng,
} from '@/data/generators/rng';

/** Player BLS ambulance — medic units are paramedic intercept only. */
const PLAYER_UNIT = 'EMS 81';

function buildVitals(archetype: ScenarioArchetype, rng: Rng) {
  const sbp = pickRandom(archetype.vitalsPools.sbp, rng);
  const dbp = pickRandom(archetype.vitalsPools.dbp, rng);
  const bp = sbp === 0 && dbp === 0 ? '—' : `${sbp}/${dbp}`;
  return {
    bp,
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
  /** Prefer category — generator picks a random call type inside it */
  category?: CallCategory;
  /** Pin a specific archetype when testing */
  archetypeId?: string;
  seed?: number;
}

export function generateEmtCall(options: GenerateEmtCallOptions = {}): EmtCall {
  const rng = createRng(options.seed);

  let archetypeId = options.archetypeId;
  if (!archetypeId && options.category) {
    archetypeId = pickArchetypeIdForCategory(options.category, rng);
  }
  if (!archetypeId) {
    archetypeId = pickRandom(EMT_ARCHETYPE_IDS, rng);
  }

  const archetype = getArchetype(archetypeId);

  const [minH, maxH] = archetype.hazardPickCount;
  const hazardCount =
    archetype.hazardPool.length === 0 ? 0 : randomInt(minH, maxH, rng);
  const hazards = randomSubset(archetype.hazardPool, hazardCount, rng);

  const age = randomInt(archetype.ageRange[0], archetype.ageRange[1], rng);
  const sex = pickRandom(archetype.sexOptions, rng);
  const complaint = pickRandom(archetype.dispatchTemplates, rng);
  const appearance = pickRandom(archetype.patientSummaries, rng);

  const patientSummary =
    archetype.category === 'mci'
      ? appearance
      : `${age}yo ${sex} — ${appearance}`;

  const recommendsAls =
    archetype.recommendedTreatment.includes('request_als') ||
    archetype.safetyActions.includes('request_als') ||
    archetype.treatmentActions.includes('request_als');

  const resourcesOnScene = pickResourcesOnScene({
    category: archetype.category,
    hazards,
    recommendsAls,
    rng,
  });

  const weather = pickRandom(
    ['Clear', 'Overcast', 'Light rain', 'Windy', 'Hot / humid', 'Cold'],
    rng
  );
  const timeOfDay = pickRandom(
    ['Daytime', 'Evening', 'Night', 'Early morning', 'Rush hour'],
    rng
  );
  const distanceMiles = randomInt(1, 12, rng);
  const cadNotes = pickRandom(
    [
      `Caller reports ${complaint.toLowerCase()}. PD advising.`,
      'No further updates. Stage if scene not secure.',
      'Multiple callers. Confirm patient count on arrival.',
      'Access may be limited — watch for bystanders.',
      'Previous medical history unknown to caller.',
    ],
    rng
  );

  return {
    id: generateId(`emt_${archetype.id}`, rng),
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    category: archetype.category,
    unit: PLAYER_UNIT,
    priority: pickRandom([1, 1, 2] as const, rng),
    dispatch: complaint,
    cadNotes,
    weather,
    distanceMiles,
    timeOfDay,
    patientSummary,
    age,
    sex,
    hazards,
    resourcesOnScene,
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
      archetype.transportPriorities.includes(
        o.id as 'emergency' | 'urgent' | 'non_urgent'
      )
    ),
    correctTransportPriority: archetype.correctTransportPriority,
    destinationOptions: destinationOptions(archetype.destinations),
    correctDestination: archetype.correctDestination,
    pearls: [...archetype.pearls],
    universalPrinciples: [...archetype.universalPrinciples],
    protocolNotes: [...(archetype.protocolNotes ?? [])],
  };
}
