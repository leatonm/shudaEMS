/**
 * Legacy entry point — generation lives in `data/generators/`.
 * @deprecated Import from `@/data/generators/callGenerator` instead.
 */
export {
  generateCall,
  generateCallForCondition,
  pickRandomDispatchType,
  CORE_CONDITION_IDS,
} from '@/data/generators/callGenerator';

export {
  generatePatient,
  generatePatientFromCondition,
} from '@/data/generators/patientGenerator';

export { composeScenario } from '@/data/generators/scenarioComposer';

export type {
  GeneratedCall,
  GenerateCallOptions,
  GeneratedPatient,
  GeneratePatientOptions,
} from '@/data/conditions/types';
