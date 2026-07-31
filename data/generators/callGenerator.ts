import {
  getCondition,
  CONDITION_REGISTRY,
  CORE_CONDITION_IDS,
} from '@/data/conditions/conditionRegistry';
import {
  DISPATCH_TYPES,
  getEligibleConditions,
  normalizeDispatchType,
} from '@/data/conditions/callCategories';
import type {
  CoreConditionId,
  GeneratedCall,
  GenerateCallOptions,
} from '@/data/conditions/types';
import { generatePatient } from '@/data/generators/patientGenerator';
import {
  createRng,
  pickDifficulty,
  pickRandom,
  pickWeighted,
  type Rng,
} from '@/data/generators/rng';
import { composeScenario } from '@/data/generators/scenarioComposer';

function pickHiddenCondition(
  dispatchType: string,
  rng: Rng,
  exclude: CoreConditionId[] = []
): CoreConditionId {
  const eligible = getEligibleConditions(dispatchType, exclude);
  if (eligible.length === 0) {
    throw new Error(
      `No conditions registered for dispatch type "${dispatchType}". ` +
        `Known types: ${DISPATCH_TYPES.join(', ')}`
    );
  }
  return pickWeighted(eligible, rng).id;
}

function buildCall(
  dispatchType: string,
  options: GenerateCallOptions = {}
): GeneratedCall {
  const rng = createRng(options.seed);
  const normalizedDispatch = normalizeDispatchType(dispatchType);
  const difficulty = options.difficulty ?? pickDifficulty(rng);
  const conditionId = pickHiddenCondition(
    normalizedDispatch,
    rng,
    options.excludeConditionIds
  );
  const condition = getCondition(conditionId);

  const patient = generatePatient(condition, {
    difficulty,
    dispatchType: normalizedDispatch,
    seed: options.seed,
  });

  const scenario = composeScenario({ condition, patient, rng });

  return {
    scenario,
    dispatchType: normalizedDispatch,
    hiddenConditionId: conditionId,
    difficulty,
    patient,
  };
}

/**
 * Dispatch-first call generation.
 * Player sees chief complaint — hidden diagnosis comes from condition building blocks.
 *
 * @example generateCall('Difficulty Breathing')
 * @example generateCall('AMS')
 * @example generateCall({ dispatchType: 'Chest Pain', seed: 42 })
 */
export function generateCall(dispatchType: string, options?: GenerateCallOptions): GeneratedCall;
export function generateCall(options?: GenerateCallOptions): GeneratedCall;
export function generateCall(
  dispatchTypeOrOptions?: string | GenerateCallOptions,
  maybeOptions?: GenerateCallOptions
): GeneratedCall {
  if (typeof dispatchTypeOrOptions === 'string') {
    return buildCall(dispatchTypeOrOptions, maybeOptions);
  }

  const options = dispatchTypeOrOptions ?? {};
  const rng = createRng(options.seed);
  const dispatchType =
    options.dispatchType ?? pickRandom(DISPATCH_TYPES, rng);
  return buildCall(dispatchType, options);
}

export function generateCallForCondition(
  conditionId: CoreConditionId,
  options: Omit<GenerateCallOptions, 'excludeConditionIds'> = {}
): GeneratedCall {
  const condition = getCondition(conditionId);
  const rng = createRng(options.seed);
  const dispatchType = normalizeDispatchType(
    options.dispatchType ?? pickRandom(condition.dispatchTypes, rng)
  );
  const difficulty = options.difficulty ?? pickDifficulty(rng);

  const patient = generatePatient(condition, {
    difficulty,
    dispatchType,
    seed: options.seed,
  });

  return {
    scenario: composeScenario({ condition, patient, rng }),
    dispatchType,
    hiddenConditionId: conditionId,
    difficulty,
    patient,
  };
}

export function pickRandomDispatchType(rng: Rng = Math.random): string {
  return pickRandom(DISPATCH_TYPES, rng);
}

export { CONDITION_REGISTRY, CORE_CONDITION_IDS, DISPATCH_TYPES };
