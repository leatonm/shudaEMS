export type { EmtCall, EmtPhase, EmtRunResult, ScenarioArchetype } from '@/data/emt/types';
export { generateEmtCall } from '@/data/emt/generator';
export { listArchetypes, getArchetype, EMT_ARCHETYPE_IDS } from '@/data/emt/registry';
export {
  evaluateSafetyAction,
  evaluateAbcdeStep,
  evaluateTreatmentAction,
  evaluateTransport,
  hazardsAreCleared,
  resolveEmtRun,
} from '@/data/emt/engine';
