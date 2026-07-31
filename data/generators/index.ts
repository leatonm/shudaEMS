export { generateCall, generateCallForCondition, pickRandomDispatchType } from '@/data/generators/callGenerator';
export { generatePatient, generatePatientFromCondition } from '@/data/generators/patientGenerator';
export { composeScenario } from '@/data/generators/scenarioComposer';
export * from '@/data/generators/rng';
export { CONDITION_REGISTRY, CORE_CONDITION_IDS, getCondition } from '@/data/conditions/conditionRegistry';
export type { ConditionDefinition, GeneratedPatient, GeneratedCall } from '@/data/conditions/types';
