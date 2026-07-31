import type {
  ConditionDefinition,
  CoreConditionId,
  GeneratedPatient,
  GeneratePatientOptions,
} from '@/data/conditions/types';
import { getCondition } from '@/data/conditions/conditionRegistry';
import {
  createRng,
  generateId,
  pickDifficulty,
  pickFromPool,
  pickRandom,
  randomInt,
  randomSubset,
  type Rng,
} from '@/data/generators/rng';

function pickVital(pool: number[] | undefined, fallback: number, rng: Rng): number {
  if (!pool || pool.length === 0) return fallback;
  return pickFromPool(pool, rng);
}

/**
 * Builds a patient from condition building blocks.
 * Works with ANY ConditionDefinition in the registry.
 */
export function generatePatient(
  condition: ConditionDefinition,
  options?: GeneratePatientOptions
): GeneratedPatient;
export function generatePatient(
  conditionId: CoreConditionId,
  options?: GeneratePatientOptions
): GeneratedPatient;
export function generatePatient(
  conditionOrId: ConditionDefinition | CoreConditionId,
  options: GeneratePatientOptions = {}
): GeneratedPatient {
  const condition =
    typeof conditionOrId === 'string' ? getCondition(conditionOrId) : conditionOrId;
  const rng = createRng(options.seed);
  const difficulty = options.difficulty ?? pickDifficulty(rng);
  const dispatch =
    options.dispatchType && condition.dispatchTypes.includes(options.dispatchType)
      ? options.dispatchType
      : pickRandom(condition.dispatchTypes, rng);

  const sbp = pickVital(condition.vitals.sbp, 120, rng);
  const dbp = pickVital(condition.vitals.dbp, 80, rng);
  const hr = pickVital(condition.vitals.hr, 100, rng);
  const rr = pickVital(condition.vitals.rr, 18, rng);
  const spo2 = pickVital(condition.vitals.spo2, 96, rng);
  const temp = pickVital(condition.vitals.temp, 98.4, rng);
  const glucose = pickVital(condition.vitals.glucose, 110, rng);

  const findingCount = difficulty === 'easy' ? 3 : 2;
  const historyCount = difficulty === 'hard' ? 1 : 2;

  return {
    id: generateId(`gen_${condition.id}`, rng),
    conditionId: condition.id,
    difficulty,
    dispatch,
    age: randomInt(18, 90, rng),
    sex: pickRandom(['Male', 'Female'], rng),
    history: randomSubset(condition.history, historyCount, rng),
    findings: randomSubset(condition.findings, findingCount, rng),
    vitals: {
      bp: `${sbp}/${dbp}`,
      hr,
      rr,
      spo2,
      temp,
      glucose,
    },
    criticalAssessments: [...condition.criticalAssessments],
    pearl: pickRandom(condition.pearls, rng),
  };
}

export function generatePatientFromCondition(
  conditionId: CoreConditionId,
  options: GeneratePatientOptions = {}
): GeneratedPatient {
  return generatePatient(getCondition(conditionId), options);
}
