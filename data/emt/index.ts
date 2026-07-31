export type {
  CallCategory,
  CriticalFail,
  EmtCall,
  EmtDifficulty,
  EmtPhase,
  EmtRunResult,
  OnSceneResource,
  ScenarioArchetype,
  WalkthroughChoice,
  WalkthroughStep,
} from '@/data/emt/types';
export { DIFFICULTY_OPTIONS } from '@/data/emt/difficulty';
export { evaluateCriticalFails } from '@/data/emt/criticalFails';
export {
  describeResourcesOnArrival,
  pickResourcesOnScene,
} from '@/data/emt/resources';
export { buildWalkthrough, shuffleChoices } from '@/data/emt/walkthrough';
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
