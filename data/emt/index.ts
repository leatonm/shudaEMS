export type {
  CallCategory,
  EmtCall,
  EmtPhase,
  EmtRunResult,
  ScenarioArchetype,
} from '@/data/emt/types';
export { generateEmtCall } from '@/data/emt/generator';
export {
  EMT_ARCHETYPE_IDS,
  getArchetype,
  listArchetypes,
  listArchetypesByCategory,
} from '@/data/emt/registry';
export { CALL_CATEGORIES } from '@/data/emt/categories';
export {
  evaluateAbcdeStep,
  evaluateSafetyAction,
  evaluateTransport,
  evaluateTreatmentAction,
  hazardsAreCleared,
  resolveEmtRun,
} from '@/data/emt/engine';
