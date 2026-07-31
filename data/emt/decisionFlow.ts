import { DESTINATION_LABELS, EMT_ACTIONS } from '@/data/emt/actions';
import { resourceAlreadyOnScene } from '@/data/emt/resources';
import type {
  AbcdeStep,
  EmtCall,
  WalkthroughChoice,
  WalkthroughStep,
} from '@/data/emt/types';

function actionLabel(id: string): string {
  return EMT_ACTIONS[id]?.name ?? id.replace(/_/g, ' ');
}

function neededRequests(call: EmtCall): string[] {
  const requests = new Set<string>();
  for (const hazard of call.hazards) {
    for (const action of hazard.clearWith) {
      if (action === 'don_ppe') continue;
      if (resourceAlreadyOnScene(call.resourcesOnScene, action)) continue;
      requests.add(action);
    }
  }
  if (
    call.recommendedTreatment.includes('request_als') &&
    !resourceAlreadyOnScene(call.resourcesOnScene, 'request_als')
  ) {
    requests.add('request_als');
  }
  return [...requests];
}

function sceneDevelopment(call: EmtCall): NonNullable<WalkthroughStep['development']> {
  const elapsedMinutes =
    3 +
    [...call.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 6;
  const lines = call.hazards.map((hazard) => {
    switch (hazard.id) {
      case 'bystanders':
        return 'Law enforcement secures the crowd and confirms a safe path to the patient.';
      case 'traffic':
        return 'Traffic is stopped and a protected work area is established.';
      case 'leaking_fluid':
      case 'smoke':
        return 'Fire / Rescue controls the immediate hazard and clears EMS to enter.';
      case 'unstable_surface':
        return 'A safer access route is identified around the unstable ground.';
      case 'structural_damage':
        return 'Fire / Rescue marks a stable access route through the debris.';
      case 'multiple_patients':
        return 'Command and incoming units establish scene organization and assignments.';
      case 'unknown_meds':
        return 'No additional threat develops; PPE remains in place for patient contact.';
      default:
        return `${hazard.label} is controlled and the entry route is reassessed.`;
    }
  });

  return {
    elapsedMinutes,
    headline: 'Scene secured',
    lines: [...new Set(lines)],
  };
}

function flowTrap(
  id: string,
  label: string,
  advance: WalkthroughChoice['advance'],
  message: string
): WalkthroughChoice {
  return {
    id,
    label,
    correct: false,
    actionKind: advance === 'jump_transport' ? 'trap_load_go' : 'trap_early_treat',
    advance,
    scoreDelta: -20,
    message,
    severity: 'bad',
    skill: 'assessment',
    flowMiss: true,
  };
}

/**
 * Provider-driven TSOP flow.
 *
 * Each board exposes a clinical work area rather than asking a chain of
 * one-answer quiz questions. The provider chooses the order, can move ahead
 * early, and receives consequences without being forced back onto a script.
 */
export function buildDecisionFlow(call: EmtCall): WalkthroughStep[] {
  const requests = neededRequests(call);
  const hasBystanders = call.hazards.some((hazard) => hazard.id === 'bystanders');
  const hasUnsafeScene = call.hazards.length > 0;

  const sceneChoices: WalkthroughChoice[] = [
    {
      id: 'scene_ppe',
      label: 'Don PPE / verbalize BSI',
      correct: true,
      actionKind: 'ppe',
      payload: 'don_ppe',
      advance: 'stay',
      scoreDelta: 12,
      message: 'BSI in place. You can continue the size-up.',
      severity: 'good',
      skill: 'scene_safety',
    },
    hasBystanders
      ? {
          id: 'scene_withdraw_bystanders',
          label: 'Withdraw to safety; move the patient only if safely possible',
          correct: true,
          tip: 'Request PD before re-entry.',
          actionKind: 'stage',
          payload: 'stage_away',
          advance: 'stay',
          scoreDelta: 14,
          message:
            'You withdraw from the unsafe crowd. Move the patient only if that can be done without increasing risk.',
          severity: 'good',
          skill: 'scene_safety',
        }
      : {
          id: 'scene_assess_safety',
          label:
            call.hazards.length === 0
              ? 'Verbalize that the scene appears safe'
              : 'Identify the visible hazards',
          correct: true,
          actionKind: 'verbalize_safe',
          advance: 'stay',
          scoreDelta: 10,
          message:
            call.hazards.length === 0
              ? 'No immediate hazards identified. Continue monitoring the scene.'
              : 'Hazards identified. Control them before patient contact.',
          severity: 'good',
          skill: 'scene_safety',
        },
  ];

  for (const request of requests) {
    if (hasBystanders && request === 'stage_away') continue;
    sceneChoices.push({
      id: `scene_${request}`,
      label: actionLabel(request),
      correct: true,
      actionKind: request === 'stage_away' ? 'stage' : 'safety_request',
      payload: request,
      advance: 'stay',
      scoreDelta: 14,
      message: `${actionLabel(request)} requested to address the scene or patient need.`,
      severity: 'good',
      skill: request === 'request_als' ? 'communication' : 'scene_safety',
    });
  }

  for (const [resource, request] of [
    ['fire', 'request_fire'],
    ['als', 'request_als'],
    ['pd', 'request_pd'],
  ] as const) {
    if (call.resourcesOnScene.includes(resource)) {
      sceneChoices.push({
        id: `scene_duplicate_${request}`,
        label: actionLabel(request),
        correct: false,
        tip: `${resource.toUpperCase()} is already on scene—coordinate with them.`,
        actionKind: 'safety_request',
        payload: request,
        advance: 'stay',
        scoreDelta: -8,
        message: `${resource.toUpperCase()} is already present. Coordinate instead of re-requesting.`,
        severity: 'warn',
        skill: request === 'request_als' ? 'communication' : 'scene_safety',
        flowMiss: true,
      });
    }
  }

  if (hasUnsafeScene) {
    sceneChoices.push(
      {
        id: 'scene_await_update',
        label: 'Hold position and await a scene update',
        correct: true,
        tip: 'Stage until the hazards you identified are controlled.',
        actionKind: 'proceed',
        payload: 'await_scene_clear',
        advance: 'next',
        scoreDelta: 8,
        message: 'You hold at a safe location while the scene is secured.',
        severity: 'good',
        skill: 'scene_safety',
      },
      {
        id: 'scene_enter_unsafe',
        label: 'Approach the patient before the scene is secured',
        correct: false,
        actionKind: 'trap_ignore_hazards',
        payload: 'enter_scene',
        advance: 'jump_primary',
        scoreDelta: -30,
        message: 'You entered before the scene was secured — provider risk.',
        severity: 'bad',
        skill: 'scene_safety',
        flowMiss: true,
      }
    );
  } else {
    sceneChoices.push({
      id: 'scene_enter',
      label: 'Approach the patient and begin the primary survey',
      correct: true,
      actionKind: 'enter_scene',
      payload: 'enter_scene',
      advance: 'jump_primary',
      scoreDelta: 15,
      message: 'You move to the patient and begin the primary survey.',
      severity: 'good',
      skill: 'scene_safety',
    });
  }

  sceneChoices.push(
    flowTrap(
      'scene_treat_early',
      'Start treatment before completing the size-up',
      'jump_treatment',
      'You moved to treatment before confirming BSI, scene safety, and primary findings.'
    )
  );

  const abcdeChoices: WalkthroughChoice[] = (
    call.requiredAbcdeOrder.length
      ? call.requiredAbcdeOrder
      : (['airway', 'breathing', 'circulation', 'disability', 'exposure'] as AbcdeStep[])
  ).map((step) => {
    const finding = call.abcde.find((item) => item.step === step);
    return {
      id: `primary_${step}`,
      label: `Assess ${finding?.label ?? step}`,
      correct: true,
      actionKind: 'abcde',
      payload: step,
      advance: 'stay',
      scoreDelta: finding?.critical ? 16 : 12,
      message: finding?.clue ?? `${step} assessed.`,
      severity: 'good',
      skill: 'assessment',
    };
  });

  abcdeChoices.push(
    {
      id: 'primary_to_care',
      label: 'Move to focused history and treatment',
      correct: true,
      tip: 'Complete life-threat assessment first.',
      actionKind: 'proceed',
      payload: 'finish_primary',
      advance: 'jump_treatment',
      scoreDelta: 8,
      message: 'Primary survey complete. Move into focused patient care.',
      severity: 'good',
      skill: 'assessment',
    },
    flowTrap(
      'primary_load_early',
      'Load the patient and choose transport now',
      'jump_transport',
      'You initiated transport decisions before completing a rapid primary survey.'
    )
  );

  const careChoices: WalkthroughChoice[] = call.history.map((prompt) => {
    const allergies =
      prompt.id === 'allergies' ||
      /allerg/i.test(prompt.id) ||
      /allerg/i.test(prompt.label);
    return {
      id: `care_history_${prompt.id}`,
      label: `${prompt.framework}: ${prompt.label}`,
      correct: true,
      actionKind: allergies ? 'check_allergies' : 'history',
      payload: prompt.id,
      advance: 'stay',
      scoreDelta: 8,
      message: prompt.clue,
      severity: 'good',
      skill: 'assessment',
    };
  });

  const treatmentIds = new Set(
    call.recommendedTreatment
      .filter(
        (id) =>
          id !== 'request_als' ||
          !resourceAlreadyOnScene(call.resourcesOnScene, 'request_als')
      )
      .slice(0, 5)
  );
  const neutralTreatment = call.treatmentActions
    .map((option) => option.id)
    .find(
      (id) =>
        !treatmentIds.has(id) &&
        !call.harmfulTreatment.includes(id) &&
        id !== 'wait_and_see'
    );
  if (neutralTreatment) treatmentIds.add(neutralTreatment);
  if (call.harmfulTreatment[0]) treatmentIds.add(call.harmfulTreatment[0]);

  for (const treatment of [...treatmentIds].slice(0, 7)) {
    const recommended = call.recommendedTreatment.includes(treatment);
    const harmful = call.harmfulTreatment.includes(treatment);
    careChoices.push({
      id: `care_treatment_${treatment}`,
      label: actionLabel(treatment),
      correct: recommended,
      tip: harmful ? 'This may worsen the patient or delay definitive care.' : undefined,
      actionKind: 'treatment',
      payload: treatment,
      advance: 'stay',
      scoreDelta: recommended ? 14 : harmful ? -22 : 4,
      message: recommended
        ? 'Appropriate EMT-scope intervention.'
        : harmful
          ? 'This intervention can worsen the patient or delay needed care.'
          : 'Reasonable action, but not the priority for this presentation.',
      severity: recommended ? 'good' : harmful ? 'bad' : 'warn',
      skill: treatment === 'notify_hospital' ? 'communication' : 'treatment',
      flowMiss: harmful,
    });
  }

  careChoices.push({
    id: 'care_to_transport',
    label: 'Set transport priority and destination',
    correct: true,
    actionKind: 'proceed',
    payload: 'choose_transport',
    advance: 'jump_transport',
    scoreDelta: 8,
    message: 'Moving to the transport decision.',
    severity: 'good',
    skill: 'transport',
  });

  const priorityChoices: WalkthroughChoice[] = call.transportPriorityOptions.map(
    (option) => ({
      id: `priority_${option.id}`,
      label: option.label,
      correct: option.id === call.correctTransportPriority,
      tip: option.subtitle,
      actionKind: 'transport_priority',
      payload: option.id,
      advance: 'next',
      scoreDelta: option.id === call.correctTransportPriority ? 18 : -15,
      message:
        option.id === call.correctTransportPriority
          ? 'Transport priority matches the patient’s acuity.'
          : `This patient needs ${call.correctTransportPriority} transport.`,
      severity: option.id === call.correctTransportPriority ? 'good' : 'bad',
      skill: 'transport',
      flowMiss: option.id !== call.correctTransportPriority,
    })
  );

  const destinationChoices: WalkthroughChoice[] = call.destinationOptions.map(
    (option) => ({
      id: `destination_${option.id}`,
      label: option.label,
      correct: option.id === call.correctDestination,
      actionKind: 'transport_destination',
      payload: option.id,
      advance: 'complete',
      scoreDelta: option.id === call.correctDestination ? 20 : -18,
      message:
        option.id === call.correctDestination
          ? 'Receiving facility matches the patient’s needs.'
          : `This patient needs ${DESTINATION_LABELS[call.correctDestination] ?? call.correctDestination}.`,
      severity: option.id === call.correctDestination ? 'good' : 'bad',
      skill: 'transport',
      flowMiss: option.id !== call.correctDestination,
    })
  );

  return [
    {
      id: 'dispatch',
      phase: 'dispatch',
      title: 'Dispatch',
      prompt: 'Review the CAD, then get yourself en route.',
      coachTip: 'Acknowledge now. More information comes while responding and on arrival.',
      reveal: 'dispatch',
      choices: [
        {
          id: 'dispatch_respond',
          label: 'Acknowledge and respond',
          correct: true,
          actionKind: 'respond',
          advance: 'next',
          scoreDelta: 5,
          message: 'En route. Prepare for scene size-up.',
          severity: 'good',
          skill: 'communication',
        },
      ],
    },
    {
      id: 'scene_board',
      phase: 'scene_safety',
      title: 'Scene size-up',
      prompt: 'Manage the scene, then decide when it is safe to approach.',
      coachTip: 'You control the order. Complete what the scene requires before patient contact.',
      reveal: 'scene',
      choices: sceneChoices,
    },
    ...(hasUnsafeScene
      ? [
          {
            id: 'scene_development',
            phase: 'scene_safety' as const,
            title: 'Scene update',
            prompt: 'Conditions have changed. Re-enter and continue to patient contact.',
            coachTip: 'Reassess before moving in; scene safety remains an ongoing process.',
            reveal: 'none' as const,
            development: sceneDevelopment(call),
            choices: [
              {
                id: 'scene_return',
                label: 'Return to the scene and approach the patient',
                correct: true,
                actionKind: 'enter_scene' as const,
                payload: 'enter_scene',
                advance: 'jump_primary' as const,
                scoreDelta: 15,
                message: 'You re-enter the secured scene and begin the primary survey.',
                severity: 'good' as const,
                skill: 'scene_safety' as const,
              },
            ],
          },
        ]
      : []),
    {
      id: 'primary_board',
      phase: 'primary_survey',
      title: 'Primary survey',
      prompt: 'Choose your assessment sequence and identify immediate threats.',
      coachTip: 'ABCDE is systematic. You may move ahead, but skipped threats count.',
      reveal: 'vitals',
      choices: abcdeChoices,
    },
    {
      id: 'patient_care_board',
      phase: 'treatment',
      title: 'Patient care',
      prompt: 'Choose focused questions, interventions, and when to transport.',
      coachTip: 'Treat immediate threats, verify medication safety, and avoid delaying transport.',
      reveal: 'vitals',
      choices: careChoices,
    },
    {
      id: 'transport_priority',
      phase: 'transport',
      title: 'Transport',
      prompt: 'Choose the transport priority.',
      coachTip: 'Match urgency to stability and time-sensitive risk.',
      reveal: 'vitals',
      choices: priorityChoices,
    },
    {
      id: 'transport_destination',
      phase: 'transport',
      title: 'Transport',
      prompt: 'Choose the receiving destination.',
      coachTip: 'Match facility capability to the suspected condition.',
      reveal: 'vitals',
      choices: destinationChoices,
    },
  ];
}

export function findDecisionStepIndex(
  steps: WalkthroughStep[],
  phase: WalkthroughStep['phase']
): number {
  const index = steps.findIndex((step) => step.phase === phase);
  if (index >= 0) return index;
  const transport = steps.findIndex((step) => step.phase === 'transport');
  return transport >= 0 ? transport : Math.max(0, steps.length - 1);
}
