import { DESTINATION_LABELS, EMT_ACTIONS } from '@/data/emt/actions';
import { resourceAlreadyOnScene } from '@/data/emt/resources';
import type {
  AbcdeStep,
  EmtCall,
  WalkthroughChoice,
  WalkthroughStep,
} from '@/data/emt/types';

function isMedicalLeaning(category: EmtCall['category']): boolean {
  return category === 'medical' || category === 'peds' || category === 'ob';
}

function actionLabel(id: string): string {
  return EMT_ACTIONS[id]?.name ?? id.replace(/_/g, ' ');
}

function neededRequests(call: EmtCall): string[] {
  const needed = new Set<string>();
  for (const hazard of call.hazards) {
    for (const clear of hazard.clearWith) {
      if (
        (clear === 'request_fire' || clear === 'request_pd' || clear === 'request_als') &&
        !resourceAlreadyOnScene(call.resourcesOnScene, clear)
      ) {
        needed.add(clear);
      }
    }
  }
  // First-on-scene ALS need for high acuity when not already present
  if (
    call.recommendedTreatment.includes('request_als') &&
    !resourceAlreadyOnScene(call.resourcesOnScene, 'request_als') &&
    call.hazards.length === 0
  ) {
    // optional later — size-up still offers request ALS as correct-ish
  }
  return [...needed];
}

function trapEarlyTreat(idPrefix: string): WalkthroughChoice {
  return {
    id: `${idPrefix}_trap_treat`,
    label: 'Start treatment immediately',
    correct: false,
    tip: 'Complete size-up and primary survey before jumping to interventions.',
    actionKind: 'trap_early_treat',
    advance: 'jump_treatment',
    scoreDelta: -20,
    message: 'Flow miss — you skipped assessment and jumped to treatment.',
    severity: 'bad',
    skill: 'assessment',
    flowMiss: true,
  };
}

function trapSkipBsi(idPrefix: string): WalkthroughChoice {
  return {
    id: `${idPrefix}_trap_skip_bsi`,
    label: 'Go straight to the patient — gloves later',
    correct: false,
    tip: 'BSI / PPE first — every call.',
    actionKind: 'trap_skip_bsi',
    advance: 'next',
    scoreDelta: -25,
    message: 'Critical habit miss — no BSI before patient contact.',
    severity: 'bad',
    skill: 'scene_safety',
    flowMiss: true,
  };
}

function trapLoadGo(idPrefix: string): WalkthroughChoice {
  return {
    id: `${idPrefix}_trap_load`,
    label: 'Load and go — skip primary survey',
    correct: false,
    tip: 'Even load-and-go patients need a rapid ABC primary.',
    actionKind: 'trap_load_go',
    advance: 'jump_transport',
    scoreDelta: -22,
    message: 'Flow miss — transported without completing primary survey.',
    severity: 'bad',
    skill: 'assessment',
    flowMiss: true,
  };
}

function trapFullHistory(idPrefix: string): WalkthroughChoice {
  return {
    id: `${idPrefix}_trap_history`,
    label: 'Finish full SAMPLE / OPQRST before any care',
    correct: false,
    tip: 'Do not delay life threats for a complete history.',
    actionKind: 'trap_full_history',
    advance: 'stay',
    scoreDelta: -12,
    message: 'Delaying care for a complete history is inappropriate when life threats exist.',
    severity: 'warn',
    skill: 'assessment',
    flowMiss: true,
  };
}

/**
 * Build a linear TSOP-style walkthrough from a generated call.
 * Medical/OB/Peds: size-up → primary → history → treatment → transport
 * Trauma/MCI: size-up → primary → treatment → brief history → transport
 */
export function buildWalkthrough(call: EmtCall): WalkthroughStep[] {
  const steps: WalkthroughStep[] = [];
  const medical = isMedicalLeaning(call.category);
  const requests = neededRequests(call);

  // —— Dispatch ——
  steps.push({
    id: 'dispatch',
    phase: 'dispatch',
    title: 'Dispatch',
    prompt: 'You have the CAD. What do you do next?',
    coachTip: 'Acknowledge and respond — size-up starts on arrival.',
    reveal: 'dispatch',
    choices: [
      {
        id: 'dispatch_respond',
        label: 'Respond to the call',
        correct: true,
        actionKind: 'respond',
        advance: 'next',
        scoreDelta: 5,
        message: 'En route. Prepare for scene size-up.',
        severity: 'good',
        skill: 'communication',
      },
      {
        id: 'dispatch_wait',
        label: 'Wait for more details before leaving',
        correct: false,
        tip: 'Respond — gather more on arrival.',
        actionKind: 'proceed',
        advance: 'stay',
        scoreDelta: -4,
        message: 'Delaying response wastes time. Roll and size up on scene.',
        severity: 'warn',
        flowMiss: true,
      },
      trapEarlyTreat('dispatch'),
    ],
  });

  // —— Size-up: BSI ——
  steps.push({
    id: 'sizeup_bsi',
    phase: 'scene_safety',
    title: 'Scene size-up',
    prompt: 'You arrive. What is your first action?',
    coachTip: 'BSI / PPE before patient contact — every time.',
    reveal: 'scene',
    choices: [
      {
        id: 'bsi_don',
        label: 'Don PPE / verbalize BSI',
        correct: true,
        actionKind: 'ppe',
        payload: 'don_ppe',
        advance: 'next',
        scoreDelta: 12,
        message: 'BSI on. Protect yourself first.',
        severity: 'good',
        skill: 'scene_safety',
      },
      trapSkipBsi('bsi'),
      {
        id: 'bsi_enter',
        label: 'Enter scene and start care now',
        correct: false,
        tip: 'PPE and scene safety before patient contact.',
        actionKind: 'enter_scene',
        payload: 'enter_scene',
        advance: 'jump_primary',
        scoreDelta: -30,
        message: 'Entered without BSI / size-up — provider and patient risk.',
        severity: 'bad',
        skill: 'scene_safety',
        flowMiss: true,
      },
      trapEarlyTreat('bsi'),
    ],
  });

  // —— Size-up: scene safety verbalize / hazards ——
  const hasAgitatedBystanders = call.hazards.some((h) => h.id === 'bystanders');
  const sceneChoices: WalkthroughChoice[] = hasAgitatedBystanders
    ? [
        {
          id: 'scene_withdraw_bystanders',
          label: 'Withdraw to safety; move the patient only if safely possible',
          correct: true,
          tip: 'Do not attempt a rescue through danger. Withdraw, then request PD.',
          actionKind: 'stage',
          payload: 'stage_away',
          advance: 'next',
          scoreDelta: 14,
          message:
            'Crew withdraws from the unsafe crowd. Move the patient only if it does not increase risk; request PD and reassess before re-entry.',
          severity: 'good',
          skill: 'scene_safety',
        },
        {
          id: 'scene_deescalate_continue',
          label: 'Try to calm the crowd while continuing patient care',
          correct: false,
          tip: 'Do not remain exposed while attempting to de-escalate an unsafe crowd.',
          actionKind: 'trap_ignore_hazards',
          advance: 'stay',
          scoreDelta: -14,
          message:
            'The crew remains exposed to an uncontrolled crowd. Withdraw and request law enforcement.',
          severity: 'bad',
          skill: 'scene_safety',
          flowMiss: true,
        },
        {
          id: 'scene_ignore',
          label: 'Ignore surroundings — focus on the patient',
          correct: false,
          tip: 'Scene safety is a critical criterion.',
          actionKind: 'trap_ignore_hazards',
          advance: 'stay',
          scoreDelta: -18,
          message: 'Flow miss — failed to respond to an unsafe scene.',
          severity: 'bad',
          skill: 'scene_safety',
          flowMiss: true,
        },
        trapEarlyTreat('scene'),
      ]
    : [
        {
          id: 'scene_safe_ok',
          label:
            call.hazards.length === 0
              ? 'Verbalize: scene appears safe'
              : 'Identify hazards and plan to make scene safe',
          correct: true,
          actionKind: 'verbalize_safe',
          advance: 'next',
          scoreDelta: 10,
          message:
            call.hazards.length === 0
              ? 'Scene safety verbalized.'
              : 'Hazards noted — address them before patient contact.',
          severity: 'good',
          skill: 'scene_safety',
        },
        {
          id: 'scene_ignore',
          label: 'Ignore surroundings — focus on the patient',
          correct: false,
          tip: 'Scene safety is a critical criterion.',
          actionKind: 'trap_ignore_hazards',
          advance: 'next',
          scoreDelta: -18,
          message: 'Flow miss — failed to determine scene safety.',
          severity: 'bad',
          skill: 'scene_safety',
          flowMiss: true,
        },
        {
          id: 'scene_stage',
          label: 'Stage at a safe distance until the scene is secured',
          correct: call.hazards.some((h) => h.severity === 'high'),
          tip: 'Stage before entry when hazards are uncontrolled; then reassess.',
          actionKind: 'stage',
          payload: 'stage_away',
          advance: 'stay',
          scoreDelta: call.hazards.some((h) => h.severity === 'high') ? 14 : 6,
          message: 'Holding at a safe distance. Reassess when resources clear the hazard.',
          severity: 'good',
          skill: 'scene_safety',
        },
        trapEarlyTreat('scene'),
      ];

  steps.push({
    id: 'sizeup_scene',
    phase: 'scene_safety',
    title: 'Scene size-up',
    prompt: hasAgitatedBystanders
      ? 'The agitated crowd is making the scene unsafe. What do you do?'
      : 'Is the scene safe for you and the patient?',
    coachTip: hasAgitatedBystanders
      ? 'If a scene becomes unsafe, withdraw. Take the patient only when doing so is safe.'
      : 'Say it out loud. If unsafe — stage or request help.',
    reveal: 'scene',
    choices: sceneChoices,
  });

  // —— Size-up: additional resources (if needed or always offer ALS decision) ——
  const resourceChoices: WalkthroughChoice[] = [];
  if (requests.length > 0) {
    const primaryReq = requests[0];
    resourceChoices.push({
      id: `req_${primaryReq}`,
      label: actionLabel(primaryReq),
      correct: true,
      actionKind: 'safety_request',
      payload: primaryReq,
      advance: 'next',
      scoreDelta: 16,
      message: 'Good — that request addresses an active need.',
      severity: 'good',
      skill: primaryReq === 'request_als' ? 'communication' : 'scene_safety',
    });
    for (const extra of requests.slice(1, 3)) {
      resourceChoices.push({
        id: `req_${extra}`,
        label: actionLabel(extra),
        correct: true,
        actionKind: 'safety_request',
        payload: extra,
        advance: 'stay',
        scoreDelta: 12,
        message: 'Additional resource requested.',
        severity: 'good',
        skill: 'scene_safety',
      });
    }
  } else if (!resourceAlreadyOnScene(call.resourcesOnScene, 'request_als')) {
    resourceChoices.push({
      id: 'req_als_optional',
      label: 'Request ALS intercept',
      correct: call.recommendedTreatment.includes('request_als'),
      actionKind: 'safety_request',
      payload: 'request_als',
      advance: 'next',
      scoreDelta: call.recommendedTreatment.includes('request_als') ? 12 : 4,
      message: call.recommendedTreatment.includes('request_als')
        ? 'ALS requested early — smart for acuity.'
        : 'ALS noted — continue size-up.',
      severity: 'good',
      skill: 'communication',
    });
  }

  // Re-request trap if already on scene
  if (resourceAlreadyOnScene(call.resourcesOnScene, 'request_fire')) {
    resourceChoices.push({
      id: 'req_fire_dup',
      label: 'Request Fire / Rescue',
      correct: false,
      tip: 'Fire is already on scene — coordinate.',
      actionKind: 'safety_request',
      payload: 'request_fire',
      advance: 'stay',
      scoreDelta: -8,
      message: 'Fire is already on scene — do not re-request.',
      severity: 'warn',
      skill: 'scene_safety',
      flowMiss: true,
    });
  }
  if (resourceAlreadyOnScene(call.resourcesOnScene, 'request_als')) {
    resourceChoices.push({
      id: 'req_als_dup',
      label: 'Request ALS Intercept',
      correct: false,
      tip: 'ALS is already on scene.',
      actionKind: 'safety_request',
      payload: 'request_als',
      advance: 'stay',
      scoreDelta: -8,
      message: 'ALS is already on scene — coordinate.',
      severity: 'warn',
      skill: 'communication',
      flowMiss: true,
    });
  }

  resourceChoices.push({
    id: 'res_continue',
    label:
      requests.length > 0
        ? 'Continue without requesting help'
        : 'No additional resources needed — continue',
    correct: requests.length === 0,
    tip:
      requests.length > 0
        ? 'This scene likely needs additional resources.'
        : undefined,
    actionKind: 'proceed',
    advance: 'next',
    scoreDelta: requests.length > 0 ? -10 : 6,
    message:
      requests.length > 0
        ? 'Flow miss — needed resources were not requested.'
        : 'Proceeding with on-scene resources.',
    severity: requests.length > 0 ? 'warn' : 'good',
    skill: 'scene_safety',
    flowMiss: requests.length > 0,
  });

  resourceChoices.push(trapEarlyTreat('resources'));

  steps.push({
    id: 'sizeup_resources',
    phase: 'scene_safety',
    title: 'Scene size-up',
    prompt: 'Do you need additional resources?',
    coachTip: 'Use what you see on arrival — do not re-request units already there.',
    reveal: 'scene',
    choices: resourceChoices,
  });

  // —— Size-up: enter / begin primary ——
  steps.push({
    id: 'sizeup_enter',
    phase: 'scene_safety',
    title: 'Scene size-up',
    prompt: 'Scene size-up complete. What next?',
    coachTip: 'Enter only when reasonably safe — or accept the risk consciously (and fail criteria).',
    reveal: 'scene',
    choices: [
      {
        id: 'enter_safe',
        label: 'Enter scene / begin primary survey',
        correct: true,
        actionKind: 'enter_scene',
        payload: 'enter_scene',
        advance: 'jump_primary',
        scoreDelta: 15,
        message: 'Moving to patient for primary survey.',
        severity: 'good',
        skill: 'scene_safety',
      },
      {
        id: 'enter_stage_more',
        label: 'Stage further away and wait',
        correct: false,
        tip: 'If the scene is workable, begin care — do not stall forever.',
        actionKind: 'stage',
        payload: 'stage_away',
        advance: 'stay',
        scoreDelta: -4,
        message: 'Still staging. Patient is waiting.',
        severity: 'warn',
        skill: 'scene_safety',
      },
      trapEarlyTreat('enter'),
      trapLoadGo('enter'),
    ],
  });

  // —— Primary ABCDE ——
  const abcOrder: AbcdeStep[] =
    call.requiredAbcdeOrder.length > 0
      ? call.requiredAbcdeOrder
      : ['airway', 'breathing', 'circulation', 'disability', 'exposure'];

  abcOrder.forEach((step, index) => {
    const finding = call.abcde.find((f) => f.step === step);
    const isLast = index === abcOrder.length - 1;
    const nextAdvance = isLast
      ? medical
        ? 'jump_history'
        : 'jump_treatment'
      : 'next';

    const choices: WalkthroughChoice[] = [
      {
        id: `abc_${step}`,
        label: `Assess ${finding?.label ?? step}`,
        correct: true,
        actionKind: 'abcde',
        payload: step,
        advance: nextAdvance,
        scoreDelta: finding?.critical ? 16 : 12,
        message: finding?.clue ?? `${step} assessed.`,
        severity: 'good',
        skill: 'assessment',
      },
      {
        id: `abc_${step}_skip`,
        label: `Skip ${finding?.label ?? step} — come back later`,
        correct: false,
        tip: 'Primary survey should be systematic.',
        actionKind: 'proceed',
        advance: nextAdvance,
        scoreDelta: -14,
        message: `Flow miss — skipped ${step} in primary survey.`,
        severity: 'bad',
        skill: 'assessment',
        flowMiss: true,
      },
      trapEarlyTreat(`abc_${step}`),
      trapFullHistory(`abc_${step}`),
    ];

    if (index < 2) {
      choices.push(trapLoadGo(`abc_${step}`));
    }

    steps.push({
      id: `primary_${step}`,
      phase: 'primary_survey',
      title: 'Primary survey',
      prompt: `Primary survey — what do you assess next?`,
      coachTip: 'Airway → Breathing → Circulation → Disability → Exposure.',
      reveal: 'vitals',
      choices,
    });
  });

  // —— History (medical path full; trauma path brief after treatment) ——
  const historySteps = (opts: { brief: boolean; idPrefix: string }) => {
    const prompts = opts.brief ? call.history.slice(0, 2) : call.history;
    prompts.forEach((prompt, index) => {
      const isLast = index === prompts.length - 1;
      const allergyPrompt =
        /allerg/i.test(prompt.label) ||
        /allerg/i.test(prompt.id) ||
        prompt.id === 'allergies';

      const choices: WalkthroughChoice[] = [
        {
          id: `${opts.idPrefix}_hist_${prompt.id}`,
          label: `${prompt.framework}: ${prompt.label}`,
          correct: true,
          actionKind: allergyPrompt ? 'check_allergies' : 'history',
          payload: prompt.id,
          advance: isLast
            ? opts.brief
              ? 'jump_transport'
              : 'jump_treatment'
            : 'next',
          scoreDelta: 8,
          message: prompt.clue,
          severity: 'good',
          skill: 'assessment',
        },
        {
          id: `${opts.idPrefix}_hist_${prompt.id}_meds`,
          label: 'Give medication now',
          correct: false,
          tip: 'Check allergies / indications before meds.',
          actionKind: 'trap_meds_before_allergies',
          payload: call.recommendedTreatment.find((t) =>
            ['aspirin', 'nitroglycerin', 'oxygen'].includes(t)
          ),
          advance: 'stay',
          scoreDelta: -16,
          message: 'Flow miss — medication before allergy / indication check.',
          severity: 'bad',
          skill: 'treatment',
          flowMiss: true,
        },
        trapEarlyTreat(`${opts.idPrefix}_${prompt.id}`),
        {
          id: `${opts.idPrefix}_hist_${prompt.id}_skip`,
          label: 'Skip history — go to transport',
          correct: false,
          tip: opts.brief
            ? 'A focused SAMPLE still matters.'
            : 'Gather key SAMPLE / OPQRST before transport when possible.',
          actionKind: 'proceed',
          advance: opts.brief ? 'jump_transport' : 'jump_treatment',
          scoreDelta: -8,
          message: 'Skipped focused history.',
          severity: 'warn',
          skill: 'assessment',
          flowMiss: true,
        },
      ];

      steps.push({
        id: `${opts.idPrefix}_${prompt.id}`,
        phase: 'history',
        title: opts.brief ? 'Focused history' : 'History',
        prompt: opts.brief
          ? 'Rapid SAMPLE — what do you ask next?'
          : 'History — what do you obtain next?',
        coachTip: 'Focused questions. Do not delay life threats.',
        reveal: 'vitals',
        choices,
      });
    });
  };

  if (medical) {
    historySteps({ brief: false, idPrefix: 'hist' });
  }

  // —— Treatment steps ——
  const treatIds = [
    ...call.recommendedTreatment.filter((id) => id !== 'request_als' || !resourceAlreadyOnScene(call.resourcesOnScene, 'request_als')),
  ];
  // Ensure at least one treatment decision
  const treatmentQueue =
    treatIds.length > 0
      ? treatIds.slice(0, 5)
      : call.treatmentActions.map((t) => t.id).slice(0, 3);

  treatmentQueue.forEach((treatId, index) => {
    const isLast = index === treatmentQueue.length - 1;
    const harmful = call.harmfulTreatment[0];
    const advance = isLast
      ? medical
        ? 'jump_transport'
        : 'jump_history'
      : 'next';

    const choices: WalkthroughChoice[] = [
      {
        id: `treat_${treatId}`,
        label: actionLabel(treatId),
        correct: true,
        actionKind: 'treatment',
        payload: treatId,
        advance,
        scoreDelta: 14,
        message: 'Appropriate EMT-scope intervention.',
        severity: 'good',
        skill:
          treatId === 'notify_hospital' || treatId === 'request_als'
            ? 'communication'
            : 'treatment',
      },
    ];

    if (harmful) {
      choices.push({
        id: `treat_harm_${treatId}_${harmful}`,
        label: actionLabel(harmful),
        correct: false,
        tip: 'That choice can worsen the patient or delay care.',
        actionKind: 'treatment',
        payload: harmful,
        advance: 'stay',
        scoreDelta: -22,
        message: 'Harmful or inappropriate intervention.',
        severity: 'bad',
        skill: 'treatment',
        flowMiss: true,
      });
    }

    choices.push({
      id: `treat_allergies_${treatId}`,
      label: 'Ask about allergies before this intervention',
      correct: ['aspirin', 'nitroglycerin'].includes(treatId),
      tip: 'Allergies matter before meds — not before every action.',
      actionKind: 'check_allergies',
      payload: 'allergies',
      advance: 'stay',
      scoreDelta: ['aspirin', 'nitroglycerin'].includes(treatId) ? 10 : 2,
      message: ['aspirin', 'nitroglycerin'].includes(treatId)
        ? 'Allergy check before medication — good habit.'
        : 'Noted — continue indicated care.',
      severity: 'good',
      skill: 'assessment',
    });

    choices.push({
      id: `treat_wait_${treatId}`,
      label: 'Wait and reassess only — no intervention',
      correct: false,
      tip: 'Indicated care should not be withheld.',
      actionKind: 'treatment',
      payload: 'wait_and_see',
      advance: 'stay',
      scoreDelta: -14,
      message: 'Withholding indicated care.',
      severity: 'bad',
      skill: 'treatment',
      flowMiss: true,
    });

    choices.push({
      id: `treat_skip_${treatId}`,
      label: isLast
        ? medical
          ? 'Skip remaining care — choose transport'
          : 'Skip remaining care — brief history'
        : 'Skip this intervention',
      correct: false,
      actionKind: 'proceed',
      advance,
      scoreDelta: -10,
      message: `Skipped ${actionLabel(treatId)}.`,
      severity: 'warn',
      skill: 'treatment',
      flowMiss: true,
    });

    steps.push({
      id: `treatment_${treatId}`,
      phase: 'treatment',
      title: 'Treatment',
      prompt: 'What intervention do you perform next?',
      coachTip: 'Match EMT-scope care to the presentation. Check allergies before meds.',
      reveal: 'vitals',
      choices,
    });
  });

  if (!medical) {
    historySteps({ brief: true, idPrefix: 'trauma_hist' });
  }

  // —— Transport priority ——
  const priorityChoices: WalkthroughChoice[] = call.transportPriorityOptions.map(
    (opt) => ({
      id: `prio_${opt.id}`,
      label: opt.label,
      correct: opt.id === call.correctTransportPriority,
      tip: opt.subtitle,
      actionKind: 'transport_priority' as const,
      payload: opt.id,
      advance: 'next' as const,
      scoreDelta: opt.id === call.correctTransportPriority ? 18 : -15,
      message:
        opt.id === call.correctTransportPriority
          ? 'Transport priority matches acuity.'
          : `Priority off — needed ${call.correctTransportPriority}.`,
      severity: (opt.id === call.correctTransportPriority ? 'good' : 'bad') as
        | 'good'
        | 'bad',
      skill: 'transport' as const,
      flowMiss: opt.id !== call.correctTransportPriority,
    })
  );

  steps.push({
    id: 'transport_priority',
    phase: 'transport',
    title: 'Transport',
    prompt: 'Select transport priority.',
    coachTip: 'Unstable / time-critical → emergency.',
    reveal: 'vitals',
    choices: priorityChoices,
  });

  // —— Destination ——
  const destChoices: WalkthroughChoice[] = call.destinationOptions.map((opt) => ({
    id: `dest_${opt.id}`,
    label: opt.label,
    correct: opt.id === call.correctDestination,
    actionKind: 'transport_destination' as const,
    payload: opt.id,
    advance: 'complete' as const,
    scoreDelta: opt.id === call.correctDestination ? 20 : -18,
    message:
      opt.id === call.correctDestination
        ? 'Correct receiving facility.'
        : `Wrong destination — needed ${DESTINATION_LABELS[call.correctDestination] ?? call.correctDestination}.`,
    severity: (opt.id === call.correctDestination ? 'good' : 'bad') as
      | 'good'
      | 'bad',
    skill: 'transport' as const,
    flowMiss: opt.id !== call.correctDestination,
  }));

  steps.push({
    id: 'transport_destination',
    phase: 'transport',
    title: 'Transport',
    prompt: 'Select destination.',
    coachTip: 'Match facility capability to the presentation.',
    reveal: 'vitals',
    choices: destChoices,
  });

  return steps;
}

export function findStepIndex(
  steps: WalkthroughStep[],
  phase: WalkthroughStep['phase']
): number {
  const idx = steps.findIndex((s) => s.phase === phase);
  if (idx >= 0) return idx;
  const transport = steps.findIndex((s) => s.phase === 'transport');
  if (transport >= 0) return transport;
  return Math.max(0, steps.length - 1);
}

/** Deterministic shuffle for choice order (stable per call + step). */
export function shuffleChoices<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
