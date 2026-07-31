import { pickRandom } from '@/data/generators/rng';
import type {
  AbcdeStep,
  ConsequenceEffect,
  EmtCall,
  EmtDebrief,
  EmtRunResult,
  EmtVitals,
  SkillScores,
  TimelineEntry,
} from '@/data/emt/types';

const EMPTY_SKILLS: SkillScores = {
  scene_safety: 0,
  assessment: 0,
  treatment: 0,
  transport: 0,
  communication: 0,
};

function clampSkill(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function applyVitals(current: EmtVitals, patch?: Partial<EmtVitals>): EmtVitals {
  if (!patch) return current;
  return { ...current, ...patch };
}

export function hazardsAreCleared(
  call: EmtCall,
  safetyActionsTaken: string[]
): boolean {
  if (call.hazards.length === 0) {
    return call.requiredSafety.every((id) => safetyActionsTaken.includes(id));
  }

  const requiredMet = call.requiredSafety.every((id) =>
    safetyActionsTaken.includes(id)
  );
  const hazardsCleared = call.hazards.every((hazard) =>
    hazard.clearWith.some((id) => safetyActionsTaken.includes(id))
  );
  return requiredMet && hazardsCleared;
}

export function evaluateSafetyAction(
  call: EmtCall,
  actionId: string,
  alreadyTaken: string[],
  sceneEntered: boolean
): ConsequenceEffect {
  if (alreadyTaken.includes(actionId)) {
    return {
      scoreDelta: 0,
      message: 'Already done.',
      severity: 'warn',
    };
  }

  if (actionId === 'enter_scene') {
    const safe = hazardsAreCleared(call, alreadyTaken);
    if (!safe) {
      return {
        scoreDelta: -35,
        message:
          'You entered before the scene was safe. Provider risk — stage and clear hazards first.',
        skill: 'scene_safety',
        severity: 'bad',
        vitals: {
          mentalStatus: 'scene chaotic — delayed care',
        },
      };
    }
    return {
      scoreDelta: 15,
      message: 'Scene is reasonably secure. Moving to patient.',
      skill: 'scene_safety',
      severity: 'good',
    };
  }

  if (actionId === 'don_ppe') {
    return {
      scoreDelta: 12,
      message: 'BSI on. Protect yourself first — universal principle.',
      skill: 'scene_safety',
      severity: 'good',
    };
  }

  if (
    actionId === 'request_fire' ||
    actionId === 'request_pd' ||
    actionId === 'traffic_control' ||
    actionId === 'stage_away'
  ) {
    const helpsHazard = call.hazards.some((h) => h.clearWith.includes(actionId));
    return {
      scoreDelta: helpsHazard ? 18 : 8,
      message: helpsHazard
        ? 'Good call — that request addresses an active hazard.'
        : 'Extra caution noted. Continue clearing remaining hazards.',
      skill: 'scene_safety',
      severity: 'good',
    };
  }

  if (actionId === 'request_als') {
    return {
      scoreDelta: 10,
      message: 'ALS requested early — smart for a potentially critical patient.',
      skill: 'communication',
      severity: 'good',
    };
  }

  if (sceneEntered) {
    return {
      scoreDelta: 5,
      message: 'Additional safety step completed.',
      skill: 'scene_safety',
      severity: 'good',
    };
  }

  return {
    scoreDelta: 8,
    message: 'Safety action completed.',
    skill: 'scene_safety',
    severity: 'good',
  };
}

export function evaluateAbcdeStep(
  call: EmtCall,
  step: AbcdeStep,
  completed: AbcdeStep[]
): ConsequenceEffect {
  if (completed.includes(step)) {
    return { scoreDelta: 0, message: 'Already assessed.', severity: 'warn' };
  }

  const expectedIndex = call.requiredAbcdeOrder.indexOf(step);
  const nextExpected = call.requiredAbcdeOrder[completed.length];
  const finding = call.abcde.find((f) => f.step === step);
  const outOfOrder = nextExpected && step !== nextExpected && expectedIndex > completed.length;

  let scoreDelta = 12;
  let severity: ConsequenceEffect['severity'] = 'good';
  let message = finding?.clue ?? `${step} assessed.`;

  if (outOfOrder) {
    scoreDelta = 4;
    severity = 'warn';
    message = `${message} (Assess ABCDE in order when possible — you skipped ahead.)`;
  }

  if (finding?.critical) {
    scoreDelta += 4;
  }

  return {
    scoreDelta,
    message,
    skill: 'assessment',
    severity,
  };
}

export function evaluateTreatmentAction(
  call: EmtCall,
  actionId: string,
  alreadyApplied: string[],
  vitals: EmtVitals
): ConsequenceEffect {
  if (alreadyApplied.includes(actionId)) {
    return { scoreDelta: 0, message: 'Already performed.', severity: 'warn' };
  }

  if (call.harmfulTreatment.includes(actionId)) {
    const spo2 = Math.max((vitals.spo2 ?? 94) - 4, 78);
    return {
      scoreDelta: -22,
      message:
        actionId === 'aspirin' && call.archetypeId === 'stroke'
          ? 'Aspirin is generally avoided in suspected stroke unless protocol says otherwise.'
          : 'That choice delays definitive care or worsens the patient.',
      skill: 'treatment',
      severity: 'bad',
      vitals: {
        spo2,
        mentalStatus: vitals.mentalStatus,
      },
    };
  }

  if (call.recommendedTreatment.includes(actionId)) {
    const vitalsPatch: Partial<EmtVitals> = {};
    if (actionId === 'oxygen') {
      vitalsPatch.spo2 = Math.min(vitals.spo2 + 4, 99);
    }
    if (actionId === 'position_comfort') {
      vitalsPatch.rr = Math.max(vitals.rr - 2, 12);
    }
    return {
      scoreDelta: 14,
      message: 'Appropriate EMT-scope intervention.',
      skill: actionId === 'notify_hospital' || actionId === 'request_als' ? 'communication' : 'treatment',
      severity: 'good',
      vitals: vitalsPatch,
    };
  }

  return {
    scoreDelta: 4,
    message: 'Intervention performed — not critical for this presentation.',
    skill: 'treatment',
    severity: 'warn',
  };
}

export function evaluateTransport(
  call: EmtCall,
  priorityId: string,
  destinationId: string
): { priority: ConsequenceEffect; destination: ConsequenceEffect } {
  const priorityOk = priorityId === call.correctTransportPriority;
  const destinationOk = destinationId === call.correctDestination;

  return {
    priority: {
      scoreDelta: priorityOk ? 18 : -15,
      message: priorityOk
        ? 'Transport priority matches patient acuity.'
        : `Priority off — this patient needed ${call.correctTransportPriority} transport.`,
      skill: 'transport',
      severity: priorityOk ? 'good' : 'bad',
    },
    destination: {
      scoreDelta: destinationOk ? 20 : -18,
      message: destinationOk
        ? 'Correct destination for this presentation.'
        : 'Wrong destination — capability of the receiving facility matters.',
      skill: 'transport',
      severity: destinationOk ? 'good' : 'bad',
    },
  };
}

export function resolveEmtRun(input: {
  call: EmtCall;
  timeline: TimelineEntry[];
  skillScores: SkillScores;
  totalScore: number;
  finalVitals: EmtVitals;
  safetyActions: string[];
  abcdeCompleted: AbcdeStep[];
  treatments: string[];
  transportPriority: string | null;
  destination: string | null;
  enteredUnsafe: boolean;
}): EmtRunResult {
  const {
    call,
    timeline,
    skillScores,
    totalScore,
    finalVitals,
    safetyActions,
    abcdeCompleted,
    treatments,
    transportPriority,
    destination,
    enteredUnsafe,
  } = input;

  const whatWentWell: string[] = [];
  const improveNext: string[] = [];

  if (safetyActions.includes('don_ppe')) {
    whatWentWell.push('BSI / PPE before patient contact');
  } else {
    improveNext.push('Don PPE before patient contact every time');
  }

  if (enteredUnsafe) {
    improveNext.push('Do not enter an unsecured scene');
  } else if (hazardsAreCleared(call, safetyActions)) {
    whatWentWell.push('Scene hazards addressed before contact');
  }

  const abcdeComplete =
    call.requiredAbcdeOrder.every((s) => abcdeCompleted.includes(s));
  if (abcdeComplete) {
    whatWentWell.push('Completed primary survey (ABCDE)');
  } else {
    improveNext.push('Finish airway → breathing → circulation → disability → exposure');
  }

  const hits = call.recommendedTreatment.filter((id) => treatments.includes(id));
  const misses = call.recommendedTreatment.filter((id) => !treatments.includes(id));
  const harms = call.harmfulTreatment.filter((id) => treatments.includes(id));

  if (hits.length >= Math.ceil(call.recommendedTreatment.length * 0.6)) {
    whatWentWell.push('Key EMT treatments and notifications completed');
  }
  for (const id of misses.slice(0, 3)) {
    improveNext.push(`Consider: ${id.replace(/_/g, ' ')}`);
  }
  for (const id of harms) {
    improveNext.push(`Avoid: ${id.replace(/_/g, ' ')}`);
  }

  if (transportPriority === call.correctTransportPriority) {
    whatWentWell.push('Correct transport priority');
  } else {
    improveNext.push(`Transport priority should be ${call.correctTransportPriority}`);
  }

  if (destination === call.correctDestination) {
    whatWentWell.push('Correct receiving facility type');
  } else {
    improveNext.push(`Destination should be ${call.correctDestination.replace(/_/g, ' ')}`);
  }

  let patientOutcome: EmtRunResult['patientOutcome'] = 'stable';
  if (enteredUnsafe || harms.length > 0 || totalScore < 40) {
    patientOutcome = 'deteriorated';
  } else if (totalScore >= 110 && misses.length <= 1) {
    patientOutcome = 'improved';
  } else if (totalScore < 25) {
    patientOutcome = 'critical';
  }

  const stars =
    totalScore >= 120 ? 5 : totalScore >= 95 ? 4 : totalScore >= 70 ? 3 : totalScore >= 45 ? 2 : 1;

  const pearl = pickRandom(call.pearls, Math.random);

  const debrief: EmtDebrief = {
    title: call.archetypeId === 'stroke' ? 'Suspected Stroke' : 'Chest Pain / Suspected ACS',
    summary:
      patientOutcome === 'improved'
        ? 'Solid EMT judgment — systematic assessment and timely transport.'
        : patientOutcome === 'stable'
          ? 'Patient cared for, but a few decisions could have been sharper.'
          : 'Patient or provider risk increased due to critical misses.',
    whatWentWell: whatWentWell.length ? whatWentWell : ['You completed the call — review the timeline.'],
    improveNext: improveNext.length ? improveNext : ['Keep rehearsing ABCDE and destination choice.'],
    pearl,
    universalPrinciples: call.universalPrinciples,
    protocolNotes: call.protocolNotes,
  };

  const normalizedSkills: SkillScores = {
    scene_safety: clampSkill(skillScores.scene_safety),
    assessment: clampSkill(skillScores.assessment),
    treatment: clampSkill(skillScores.treatment),
    transport: clampSkill(skillScores.transport),
    communication: clampSkill(skillScores.communication),
  };

  return {
    callId: call.id,
    stars,
    totalScore: Math.max(0, totalScore),
    skillScores: normalizedSkills,
    patientOutcome,
    timeline,
    debrief,
    finalVitals,
  };
}

export function createInitialSkills(): SkillScores {
  return { ...EMPTY_SKILLS };
}

export { applyVitals };
