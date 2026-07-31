export {
  CONDITION_REGISTRY,
  CONDITIONS_BY_CATEGORY,
  CORE_CONDITION_IDS,
  getCondition,
  getConditionsByCategory,
  getConditionsForDispatch,
  listConditions,
} from '@/data/conditions/conditionRegistry';

export type {
  CallCategory,
  CallDifficulty,
  ConditionCategory,
  ConditionDefinition,
  CoreConditionId,
  GeneratedCall,
  GeneratedPatient,
  GenerateCallOptions,
  GeneratePatientOptions,
  ScenarioGameplay,
} from '@/data/conditions/types';

export {
  CALL_CATEGORIES,
  DISPATCH_ALIASES,
  DISPATCH_TYPES,
  getEligibleConditions,
  MILESTONE_DISPATCH_TYPES,
  normalizeDispatchType,
} from '@/data/conditions/callCategories';
