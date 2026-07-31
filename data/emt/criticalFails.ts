import type {
  AbcdeStep,
  CriticalFail,
  EmtCall,
  EmtDifficulty,
} from '@/data/emt/types';
import { mergeWithOnSceneActions } from '@/data/emt/resources';

function hazardsCleared(call: EmtCall, safetyActionsTaken: string[]): boolean {
  const effective = mergeWithOnSceneActions(
    call.resourcesOnScene ?? [],
    safetyActionsTaken
  );
  const requiredMet = call.requiredSafety.every((id) => effective.includes(id));
  if (call.hazards.length === 0) return requiredMet;
  const hazardsOk = call.hazards.every((hazard) =>
    hazard.clearWith.some((id) => effective.includes(id))
  );
  return requiredMet && hazardsOk;
}

/** Interventions that address immediate life threats on NREMT-style sheets. */
const LIFE_THREAT_ACTIONS = new Set([
  'cpr',
  'aed',
  'oxygen',
  'airway_adjunct',
  'control_bleeding',
  'bleeding_control',
  'abdominal_thrusts',
  'c_spine',
  'support_delivery',
  'rapid_transport',
  'request_als',
]);

const SPECIALTY_DESTINATIONS = new Set([
  'stroke_center',
  'trauma_center',
  'pci_capable',
  'pediatric_ed',
  'labor_delivery',
]);

export interface CriticalFailInput {
  call: EmtCall;
  safetyActions: string[];
  abcdeCompleted: AbcdeStep[];
  treatments: string[];
  transportPriority: string | null;
  destination: string | null;
  enteredUnsafe: boolean;
}

/**
 * Maps playthrough outcomes to NREMT Patient Assessment critical criteria.
 * Any hit here fails a real skills sheet.
 */
export function evaluateCriticalFails(input: CriticalFailInput): CriticalFail[] {
  const {
    call,
    safetyActions,
    abcdeCompleted,
    treatments,
    transportPriority,
    destination,
    enteredUnsafe,
  } = input;

  const treatmentsEffective = mergeWithOnSceneActions(
    call.resourcesOnScene ?? [],
    treatments
  );

  const fails: CriticalFail[] = [];

  if (!safetyActions.includes('don_ppe')) {
    fails.push({
      id: 'no_bsi',
      sheet: 'both',
      label: 'Failure to take or verbalize BSI / PPE precautions',
      detail: 'Don PPE before patient contact — every call, every time.',
    });
  }

  if (enteredUnsafe) {
    fails.push({
      id: 'scene_unsafe',
      sheet: 'both',
      label: 'Failure to determine / ensure scene safety',
      detail: 'You made patient contact before hazards were cleared.',
    });
  } else if (call.hazards.length > 0 && !hazardsCleared(call, safetyActions)) {
    fails.push({
      id: 'hazards_uncleared',
      sheet: 'both',
      label: 'Failure to manage identifiable scene hazards',
      detail: 'Active hazards were never addressed before care continued.',
    });
  }

  const abcRequired = (['airway', 'breathing', 'circulation'] as const).filter((step) =>
    call.requiredAbcdeOrder.includes(step)
  );
  const missingAbc = abcRequired.filter((step) => !abcdeCompleted.includes(step));
  if (missingAbc.length > 0) {
    fails.push({
      id: 'incomplete_abc',
      sheet: 'both',
      label: 'Failure to adequately assess airway, breathing, and circulation',
      detail: `Missed required primary survey step(s): ${missingAbc.join(', ')}.`,
    });
  }

  const missedCriticalFindings = call.abcde.filter(
    (f) =>
      f.critical &&
      call.requiredAbcdeOrder.includes(f.step) &&
      !abcdeCompleted.includes(f.step)
  );
  if (missedCriticalFindings.length > 0 && missingAbc.length === 0) {
    fails.push({
      id: 'missed_life_threat_assessment',
      sheet: call.category === 'trauma' ? 'trauma' : 'medical',
      label: 'Failure to assess for and manage life threats',
      detail: `Critical finding(s) never assessed: ${missedCriticalFindings
        .map((f) => f.label)
        .join(', ')}.`,
    });
  }

  const recommendedLifeThreats = call.recommendedTreatment.filter((id) =>
    LIFE_THREAT_ACTIONS.has(id)
  );
  const lifeThreatHits = recommendedLifeThreats.filter((id) =>
    treatmentsEffective.includes(id)
  );
  const lifeThreatFloor = Math.max(1, Math.ceil(recommendedLifeThreats.length * 0.5));
  if (recommendedLifeThreats.length > 0 && lifeThreatHits.length < lifeThreatFloor) {
    fails.push({
      id: 'no_life_threat_management',
      sheet: call.category === 'trauma' ? 'trauma' : 'medical',
      label: 'Failure to manage identified life threats',
      detail: `Performed ${lifeThreatHits.length}/${recommendedLifeThreats.length} recommended life-threat interventions (need at least ${lifeThreatFloor}).`,
    });
  }

  // Trauma: C-spine when recommended is a classic critical criterion
  if (
    call.recommendedTreatment.includes('c_spine') &&
    !treatmentsEffective.includes('c_spine') &&
    !fails.some((f) => f.id === 'no_life_threat_management')
  ) {
    fails.push({
      id: 'no_spinal_precautions',
      sheet: 'trauma',
      label: 'Failure to provide spinal precautions when indicated',
      detail: 'MOI / findings indicated C-spine precautions.',
    });
  }

  const harms = call.harmfulTreatment.filter((id) => treatments.includes(id));
  if (harms.length > 0) {
    fails.push({
      id: 'dangerous_treatment',
      sheet: 'both',
      label: 'Performed a dangerous or inappropriate intervention',
      detail: `Avoid: ${harms.map((id) => id.replace(/_/g, ' ')).join(', ')}.`,
    });
  }

  if (
    call.correctTransportPriority === 'emergency' &&
    transportPriority &&
    transportPriority !== 'emergency'
  ) {
    fails.push({
      id: 'wrong_priority',
      sheet: 'both',
      label: 'Inappropriate transport priority for acuity',
      detail: 'This patient needed emergency (lights & sirens) transport.',
    });
  }

  if (
    destination &&
    destination !== call.correctDestination &&
    SPECIALTY_DESTINATIONS.has(call.correctDestination)
  ) {
    fails.push({
      id: 'wrong_destination',
      sheet: 'both',
      label: 'Inappropriate destination / receiving facility',
      detail: `Needed ${call.correctDestination.replace(/_/g, ' ')} capability.`,
    });
  }

  return fails;
}

/** Exam = automatic skills-sheet fail. Other modes still flag criteria for teaching. */
export function skillsSheetFailed(
  fails: CriticalFail[],
  difficulty: EmtDifficulty
): boolean {
  if (fails.length === 0) return false;
  return difficulty === 'exam';
}

export function applyCriticalFailScoring(input: {
  fails: CriticalFail[];
  difficulty: EmtDifficulty;
  totalScore: number;
  stars: number;
}): { totalScore: number; stars: number; skillsSheetPass: boolean } {
  const { fails, difficulty, totalScore } = input;
  const examFail = skillsSheetFailed(fails, difficulty);

  if (fails.length === 0) {
    return {
      totalScore: Math.max(0, totalScore),
      stars: input.stars,
      skillsSheetPass: true,
    };
  }

  if (examFail) {
    return {
      totalScore: Math.min(totalScore, 35),
      stars: 0,
      skillsSheetPass: false,
    };
  }

  // Coach / Standard: still punish hard, but leave room to learn
  return {
    totalScore: Math.max(0, Math.min(totalScore, difficulty === 'coach' ? 70 : 55)),
    stars: Math.min(input.stars, difficulty === 'coach' ? 2 : 1),
    skillsSheetPass: false,
  };
}
