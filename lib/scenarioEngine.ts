import { SHIFT_SCORE } from '@/constants/scoring';
import { buildCaseReview } from '@/lib/caseReview';
import { calculateStars } from '@/lib/rankEngine';
import type {
  Action,
  EndingType,
  PatientState,
  Protocol,
  Scenario,
  ScenarioResult,
  TreatmentEffect,
  TreatmentEffectStep,
  TreatmentLogEntry,
} from '@/types/models';

export function parseBP(bp: string): { systolic: number; diastolic: number } {
  const [sys, dia] = bp.split('/').map(Number);
  return { systolic: sys, diastolic: dia };
}

export function calculateMAP(bp: string): number {
  const { systolic, diastolic } = parseBP(bp);
  return Math.round((diastolic * 2 + systolic) / 3);
}

export function createInitialPatientState(scenario: Scenario): PatientState {
  return { ...scenario.assessment };
}

export function evaluateProtocolChoice(
  scenario: Scenario,
  selectedProtocolId: string
): boolean {
  return selectedProtocolId === scenario.correctProtocol;
}

function isFluidBolusArray(
  effect: TreatmentEffect | TreatmentEffectStep[]
): effect is TreatmentEffectStep[] {
  return Array.isArray(effect);
}

export function applyTreatmentAction(
  scenario: Scenario,
  protocol: Protocol,
  patientState: PatientState,
  actionId: string,
  appliedActions: string[],
  protocolCorrect: boolean
): {
  patientState: PatientState;
  logEntry: TreatmentLogEntry;
  alreadyApplied: boolean;
} {
  const alreadyApplied = appliedActions.includes(actionId);

  if (alreadyApplied) {
    return {
      patientState,
      logEntry: {
        actionId,
        message: 'Already performed.',
        timestamp: Date.now(),
      },
      alreadyApplied: true,
    };
  }

  const effect = scenario.treatmentEffects[actionId];

  if (!effect) {
    return {
      patientState,
      logEntry: {
        actionId,
        message: 'No effect defined.',
        timestamp: Date.now(),
      },
      alreadyApplied: false,
    };
  }

  let message: string;
  let nextState = { ...patientState };

  if (actionId === 'fluid_bolus' && effect && isFluidBolusArray(effect)) {
    const bolusCount = appliedActions.filter((a) => a === 'fluid_bolus').length;
    const step = effect[bolusCount];

    if (step && protocolCorrect) {
      message = step.message;
      nextState = mergePatientState(nextState, step);
    } else if (step && !protocolCorrect) {
      message = 'Fluid given — minimal response. Consider reassessing diagnosis.';
      nextState = mergePatientState(nextState, {
        bp: step.bp ? adjustBPMinimal(step.bp) : nextState.bp,
        hr: nextState.hr - 4,
        message: '',
      });
    } else {
      return {
        patientState,
        logEntry: {
          actionId,
          message: 'Maximum fluid boluses reached for this scenario.',
          timestamp: Date.now(),
        },
        alreadyApplied: true,
      };
    }
  } else if (
    actionId === 'nitroglycerin' &&
    appliedActions.includes('cpap') &&
    scenario.correctActions.includes('nitro_paste') &&
    !scenario.correctActions.includes('nitroglycerin')
  ) {
    message =
      'Nitroglycerin SL given with CPAP in place — poor absorption under mask and risk of hypotension. Nitroglycerin paste is preferred for titratable afterload reduction.';
    nextState = mergePatientState(nextState, {
      bp: adjustBPMinimal(nextState.bp),
      spo2: nextState.spo2 !== undefined ? Math.max(nextState.spo2 - 4, 70) : undefined,
      mentalStatus: 'distressed',
    });
  } else if (effect && !isFluidBolusArray(effect)) {
    message = effect.message;
    nextState = mergePatientState(nextState, effect);
  } else {
    message = 'Action not available.';
  }

  return {
    patientState: nextState,
    logEntry: { actionId, message, timestamp: Date.now() },
    alreadyApplied: false,
  };
}

function mergePatientState(
  current: PatientState,
  update: Partial<TreatmentEffect | TreatmentEffectStep>
): PatientState {
  return {
    bp: update.bp ?? current.bp,
    hr: update.hr ?? current.hr,
    rr: update.rr ?? current.rr,
    temp: update.temp ?? current.temp,
    mentalStatus: update.mentalStatus ?? current.mentalStatus,
    spo2: update.spo2 ?? current.spo2,
  };
}

function adjustBPMinimal(bp: string): string {
  const { systolic, diastolic } = parseBP(bp);
  return `${Math.max(systolic - 6, 70)}/${Math.max(diastolic - 4, 40)}`;
}

function isNeutralAction(protocol: Protocol, actionId: string): boolean {
  return protocol.neutralActions?.includes(actionId) ?? false;
}

export function determineEnding(
  scenario: Scenario,
  protocolCorrect: boolean,
  appliedActions: string[]
): EndingType {
  if (!protocolCorrect) {
    return 'wrong_protocol';
  }

  const harmful = scenario.harmfulActions ?? [];
  if (harmful.some((action) => appliedActions.includes(action))) {
    return 'delayed_treatment';
  }

  const slWithCpap =
    appliedActions.includes('cpap') &&
    appliedActions.includes('nitroglycerin') &&
    scenario.correctActions.includes('nitro_paste') &&
    !scenario.correctActions.includes('nitroglycerin');
  if (slWithCpap) {
    return 'delayed_treatment';
  }

  const required = scenario.correctActions;
  const matched = required.filter((action) => appliedActions.includes(action));

  if (matched.length === required.length) {
    return 'perfect_save';
  }

  if (matched.length > 0) {
    return 'partial_success';
  }

  return 'delayed_treatment';
}

export function applyDeterioration(
  scenario: Scenario,
  ending: EndingType
): PatientState {
  const { message: _, ...vitals } = scenario.deterioration;
  return vitals;
}

export function calculateShiftScore(
  scenario: Scenario,
  protocol: Protocol,
  protocolCorrect: boolean,
  appliedActions: string[],
  ending: EndingType,
  assessmentCount: number
): number {
  let score = 0;

  if (ending === 'perfect_save') {
    score += SHIFT_SCORE.perfectCall;
  }

  if (protocolCorrect) {
    score += SHIFT_SCORE.correctProtocol;
  }

  const allTreatmentCorrect = scenario.correctActions.every((action) =>
    appliedActions.includes(action)
  );
  if (protocolCorrect && allTreatmentCorrect) {
    score += SHIFT_SCORE.correctTreatment;
  }

  if (protocolCorrect && assessmentCount >= 3) {
    score += SHIFT_SCORE.rapidIdentification;
  }

  const neutral = new Set(protocol.neutralActions ?? []);
  const unnecessary = appliedActions.filter(
    (action) =>
      !scenario.correctActions.includes(action) && !neutral.has(action)
  );
  score += unnecessary.length * SHIFT_SCORE.unnecessaryTreatment;

  return Math.max(0, score);
}

export function resolveScenario(
  scenario: Scenario,
  protocol: Protocol,
  protocolCorrect: boolean,
  appliedActions: string[],
  treatmentLog: TreatmentLogEntry[],
  currentPatientState: PatientState,
  assessmentCount: number,
  selectedProtocolId: string | null,
  actions: Record<string, Action>,
  protocols: Record<string, Protocol>
): ScenarioResult {
  const ending = determineEnding(scenario, protocolCorrect, appliedActions);
  const endingData = scenario.endings[ending];

  const treatmentCorrect = scenario.correctActions.every((action) =>
    appliedActions.includes(action)
  );

  const xpEarned = calculateShiftScore(
    scenario,
    protocol,
    protocolCorrect,
    appliedActions,
    ending,
    assessmentCount
  );

  const stars = calculateStars(ending, protocolCorrect, treatmentCorrect);

  let patientState = currentPatientState;

  if (ending === 'delayed_treatment' || ending === 'wrong_protocol') {
    patientState = applyDeterioration(scenario, ending);
    if (
      ending === 'delayed_treatment' &&
      !treatmentLog.some((e) => e.message === scenario.deterioration.message)
    ) {
      treatmentLog = [
        ...treatmentLog,
        {
          actionId: 'deterioration',
          message: scenario.deterioration.message,
          timestamp: Date.now(),
        },
      ];
    }
  }

  return {
    scenarioId: scenario.id,
    ending,
    endingTitle: endingData.title,
    outcomeMessage: endingData.message,
    xpEarned,
    stars,
    patientState,
    treatmentLog,
    protocolCorrect,
    treatmentCorrect,
    debrief: scenario.debrief,
    unlockedInsight: scenario.protocolInsight,
    caseReview: buildCaseReview(
      scenario,
      protocol,
      actions,
      appliedActions,
      selectedProtocolId,
      protocols
    ),
  };
}

export function getProtocolChoices(
  scenario: Scenario,
  protocols: Record<string, Protocol>
): Protocol[] {
  return scenario.protocolChoices
    .map((id) => protocols[id])
    .filter((protocol): protocol is Protocol => protocol !== undefined);
}

export function getTreatmentChoices(
  scenario: Scenario,
  actions: Record<string, Action>
): Action[] {
  return scenario.treatmentActions
    .map((id) => actions[id])
    .filter((action): action is Action => action !== undefined);
}
