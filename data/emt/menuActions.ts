import { EMT_ACTIONS } from '@/data/emt/actions';
import { evaluateAbcdeStep, evaluateTreatmentAction, hazardsAreCleared } from '@/data/emt/engine';
import type {
  AbcdeStep,
  DestinationType,
  EmtCall,
  EmtVitals,
  SkillCategory,
  TimelineEntry,
  TransportPriority,
} from '@/data/emt/types';

const ABCDE = new Set<string>(['airway', 'breathing', 'circulation', 'disability', 'exposure']);

const SAFETY = new Set([
  'don_ppe',
  'verbalize_scene_safe',
  'traffic_control',
  'stage_away',
  'enter_scene',
  'request_fire',
  'request_pd',
  'c_spine',
  'scan_hazards',
  'assess_moi',
  'count_patients',
  'consider_resources',
  'declare_moi',
  'declare_noi',
  'resource_pick_als',
  'resource_pick_pd',
  'resource_pick_fire',
  'resource_pick_none',
  'resource_als_enroute',
  'resource_als_standby',
  'resource_pd_enroute',
  'resource_pd_standby',
  'resource_fire_enroute',
  'resource_fire_standby',
]);

const HISTORY = new Set([
  'opqrst',
  'sample',
  'allergies',
  'medications_hx',
  'pmh',
  'events',
  'last_oral',
]);

const ASSESS = new Set([
  'general_impression',
  'assess_loc',
  'chief_complaint',
  'lung_sounds',
  'work_of_breathing',
  'check_spo2',
  'skin_signs',
  'cap_refill',
  'major_bleeding',
  'secondary_assessment',
  'reassessment',
  'vital_bp',
  'vital_pulse',
  'vital_rr',
  'vital_spo2',
  'vital_etco2',
  'vital_temp',
  'pain_scale',
  'blood_glucose',
  'ecg',
  'suction',
  'bvm',
  'etco2',
  'intubation',
  'nebulizer',
  'cpap',
  'needle_decomp',
  'tourniquet',
  'iv',
  'io',
]);

const DEST_MAP: Record<string, DestinationType> = {
  dest_trauma_center: 'trauma_center',
  dest_stroke_center: 'stroke_center',
  dest_pci_capable: 'pci_capable',
  dest_pediatric_ed: 'pediatric_ed',
  dest_closest_ed: 'closest_ed',
  dest_labor_delivery: 'labor_delivery',
};

const PRIORITY_MAP: Record<string, TransportPriority> = {
  priority_emergency: 'emergency',
  priority_urgent: 'urgent',
  priority_non_urgent: 'non_urgent',
};

const PRIORITY_LABEL: Record<TransportPriority, string> = {
  emergency: 'lights & sirens',
  urgent: 'urgent (no lights)',
  non_urgent: 'regular traffic',
};

export interface MenuActionResult {
  label: string;
  message: string;
  scoreDelta: number;
  severity: TimelineEntry['severity'];
  skill: SkillCategory;
  vitalsPatch?: Partial<EmtVitals>;
  safetyActions?: string[];
  abcdeCompleted?: AbcdeStep[];
  historyCompleted?: string[];
  treatments?: string[];
  allergiesChecked?: boolean;
  sceneEntered?: boolean;
  enteredUnsafe?: boolean;
  transportPriority?: string | null;
  destination?: string | null;
  beginHandoff?: boolean;
  flowMiss?: boolean;
  /** Resource flash crew */
  resourceFlash?: 'als' | 'fire' | 'pd';
}

export interface MenuActionContext {
  call: EmtCall;
  vitals: EmtVitals;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  sceneSecuredAfterDelay: boolean;
  abcdeCompleted: AbcdeStep[];
  historyCompleted: string[];
  treatments: string[];
  allergiesChecked: boolean;
  transportPriority: string | null;
  destination: string | null;
  completedActions: string[];
  resourceStaging?: Partial<Record<'als' | 'fire' | 'pd', 'enroute' | 'standby'>>;
}

function catalogName(id: string): string {
  return EMT_ACTIONS[id]?.name ?? id.replace(/_/g, ' ');
}

/** Resolve a freeform menu action against NREMT-style expectations (silent during play). */
export function resolveMenuAction(
  actionId: string,
  ctx: MenuActionContext
): MenuActionResult {
  const already = ctx.completedActions.includes(actionId);
  const label = catalogName(actionId);

  if (actionId === 'ask_unclear') {
    return {
      label: 'Ask',
      message: 'No matching action — Lauren asked for clarification.',
      scoreDelta: 0,
      severity: 'neutral',
      skill: 'communication',
    };
  }

  if (actionId === 'stay_and_play') {
    return {
      label: 'Stay and Play',
      message:
        'Staying on scene to finish indicated care before transport. Keep working ABCs and treatments here.',
      scoreDelta: already ? 0 : 6,
      severity: 'good',
      skill: 'transport',
    };
  }

  if (actionId === 'load_and_go') {
    return {
      label: 'Load and Go',
      message:
        'Packaging for transport — continue assessment and interventions en route. Next: pick destination and mode under Transport.',
      scoreDelta: already ? 0 : 8,
      severity: 'good',
      skill: 'transport',
    };
  }

  if (actionId === 'begin_handoff') {
    const ready = !!ctx.transportPriority && !!ctx.destination;
    return {
      label: 'Arrive at ED',
      message: ready
        ? 'You arrive at the emergency department. Prepare your handoff.'
        : 'You pull up without a clear destination / mode — still, handoff begins.',
      scoreDelta: ready ? 8 : -4,
      severity: ready ? 'good' : 'warn',
      skill: 'transport',
      beginHandoff: true,
      flowMiss: !ready,
    };
  }

  if (DEST_MAP[actionId]) {
    const dest = DEST_MAP[actionId];
    const correct = dest === ctx.call.correctDestination;
    const modeReady = !!ctx.transportPriority;
    return {
      label: `Destination: ${dest.replace(/_/g, ' ')}`,
      message: modeReady
        ? correct
          ? 'Receiving facility set. Arriving at the ED — deliver your handoff.'
          : 'Destination logged. Arriving at the ED — deliver your handoff.'
        : correct
          ? 'Appropriate receiving facility selected. Choose transport mode next.'
          : 'Destination logged — choose transport mode next.',
      scoreDelta: correct ? 14 : 2,
      severity: correct ? 'good' : 'warn',
      skill: 'transport',
      destination: dest,
      beginHandoff: modeReady,
      flowMiss: !correct,
    };
  }

  if (PRIORITY_MAP[actionId]) {
    const priority = PRIORITY_MAP[actionId];
    const correct = priority === ctx.call.correctTransportPriority;
    const destReady = !!ctx.destination;
    return {
      label: `Transport mode: ${PRIORITY_LABEL[priority]}`,
      message: destReady
        ? correct
          ? 'Mode matches acuity. Arriving at the ED — deliver your handoff.'
          : 'Mode recorded. Arriving at the ED — deliver your handoff.'
        : correct
          ? 'Transport mode matches patient acuity. Choose hospital destination next.'
          : 'Mode recorded — choose hospital destination next.',
      scoreDelta: correct ? 12 : 2,
      severity: correct ? 'good' : 'warn',
      skill: 'transport',
      transportPriority: priority,
      beginHandoff: destReady,
      flowMiss: !correct,
    };
  }

  if (actionId === 'request_als' || actionId === 'request_fire' || actionId === 'request_pd') {
    const crew = actionId === 'request_als' ? 'als' : actionId === 'request_fire' ? 'fire' : 'pd';
    const staged = ctx.resourceStaging?.[crew];
    const needed =
      ctx.call.recommendedTreatment.includes(actionId) ||
      ctx.call.requiredSafety.includes(actionId) ||
      ctx.call.hazards.some((h) => h.clearWith.includes(actionId));
    const safetyActions = ctx.safetyActions.includes(actionId)
      ? ctx.safetyActions
      : [...ctx.safetyActions, actionId];
    const treatments =
      actionId === 'request_als' && !ctx.treatments.includes('request_als')
        ? [...ctx.treatments, 'request_als']
        : ctx.treatments;
    const faster =
      staged === 'enroute'
        ? ' Already rolling — shortened ETA.'
        : staged === 'standby'
          ? ' They were standing by — upgrading to your scene.'
          : '';
    return {
      label,
      message: (needed ? `${label} requested.` : `${label} requested (may be redundant).`) + faster,
      scoreDelta: needed ? 10 : staged ? 6 : 3,
      severity: needed || staged ? 'good' : 'neutral',
      skill: actionId === 'request_als' ? 'communication' : 'scene_safety',
      safetyActions,
      treatments,
      // Skip radio flash if already staged during size-up — Lauren covers it.
      resourceFlash: staged ? undefined : crew,
    };
  }

  const stageMatch = /^resource_(als|fire|pd)_(enroute|standby)$/.exec(actionId);
  if (stageMatch) {
    const crew = stageMatch[1] as 'als' | 'fire' | 'pd';
    const mode = stageMatch[2] as 'enroute' | 'standby';
    const requestId =
      crew === 'als' ? 'request_als' : crew === 'fire' ? 'request_fire' : 'request_pd';
    const safetyActions =
      mode === 'enroute' && !ctx.safetyActions.includes(requestId)
        ? [...ctx.safetyActions, requestId]
        : ctx.safetyActions;
    const treatments =
      crew === 'als' && mode === 'enroute' && !ctx.treatments.includes('request_als')
        ? [...ctx.treatments, 'request_als']
        : ctx.treatments;
    return {
      label: `${crew.toUpperCase()} ${mode}`,
      message:
        mode === 'enroute'
          ? `${crew.toUpperCase()} enroute — about ${ctx.call.distanceMiles} minutes away.`
          : `${crew.toUpperCase()} standing by — if you need them later, they will arrive sooner.`,
      scoreDelta: already ? 0 : 8,
      severity: 'good',
      skill: crew === 'als' ? 'communication' : 'scene_safety',
      safetyActions,
      treatments,
      // Unit radio flash after Lauren's ETA — enroute only.
      resourceFlash: mode === 'enroute' ? crew : undefined,
    };
  }

  if (SAFETY.has(actionId) || actionId.startsWith('request_')) {
    if (actionId === 'enter_scene') {
      const cleared =
        ctx.sceneSecuredAfterDelay || hazardsAreCleared(ctx.call, ctx.safetyActions);
      const enteredUnsafe = !cleared;
      const safetyActions = ctx.safetyActions.includes('enter_scene')
        ? ctx.safetyActions
        : [...ctx.safetyActions, 'enter_scene'];
      return {
        label: 'Patient contact',
        message: enteredUnsafe
          ? 'Entered before hazards cleared — scene risk logged.'
          : 'Scene entered for patient contact.',
        scoreDelta: enteredUnsafe ? -18 : 10,
        severity: enteredUnsafe ? 'bad' : 'good',
        skill: 'scene_safety',
        safetyActions,
        sceneEntered: true,
        enteredUnsafe: ctx.enteredUnsafe || enteredUnsafe,
        flowMiss: enteredUnsafe,
      };
    }

    const safetyActions = ctx.safetyActions.includes(actionId)
      ? ctx.safetyActions
      : [...ctx.safetyActions, actionId];
    const required = ctx.call.requiredSafety.includes(actionId);
    return {
      label,
      message: already ? `${label} already logged.` : `${label} completed.`,
      scoreDelta: already ? 0 : required ? 10 : 6,
      severity: already ? 'neutral' : 'good',
      skill: 'scene_safety',
      safetyActions,
    };
  }

  if (ABCDE.has(actionId)) {
    const step = actionId as AbcdeStep;
    const fx = evaluateAbcdeStep(ctx.call, step, ctx.abcdeCompleted);
    const abcdeCompleted = ctx.abcdeCompleted.includes(step)
      ? ctx.abcdeCompleted
      : [...ctx.abcdeCompleted, step];
    return {
      label: fx.message.split('.')[0] || label,
      message: fx.message,
      scoreDelta: fx.scoreDelta,
      severity: fx.severity ?? 'good',
      skill: 'assessment',
      abcdeCompleted,
      flowMiss: fx.severity === 'warn' || fx.severity === 'bad',
    };
  }

  if (HISTORY.has(actionId)) {
    const historyCompleted = ctx.historyCompleted.includes(actionId)
      ? ctx.historyCompleted
      : [...ctx.historyCompleted, actionId];
    const allergiesChecked = actionId === 'allergies' ? true : ctx.allergiesChecked;
    const prompt = ctx.call.history.find(
      (h) =>
        h.id === actionId ||
        h.label.toLowerCase().includes(actionId.replace(/_/g, ' ')) ||
        (actionId === 'opqrst' && h.framework === 'OPQRST') ||
        (actionId === 'sample' && h.framework === 'SAMPLE')
    );
    return {
      label: prompt?.label ?? label,
      message: prompt?.clue ?? `${label} obtained.`,
      scoreDelta: already ? 0 : 8,
      severity: 'good',
      skill: 'assessment',
      historyCompleted,
      allergiesChecked,
    };
  }

  if (ASSESS.has(actionId)) {
    const finding =
      actionId === 'general_impression'
        ? ctx.call.patientSummary
        : actionId.startsWith('vital_') || actionId === 'blood_glucose'
          ? `Vitals check: BP ${ctx.vitals.bp}, HR ${ctx.vitals.hr}, RR ${ctx.vitals.rr}, SpO₂ ${ctx.vitals.spo2}%${
              ctx.vitals.glucose != null ? `, BGL ${ctx.vitals.glucose}` : ''
            }.`
          : `${label} assessed.`;
    return {
      label,
      message: finding,
      scoreDelta: already ? 0 : 7,
      severity: 'good',
      skill: 'assessment',
    };
  }

  // Treatments / interventions
  const treatments = ctx.treatments.includes(actionId)
    ? ctx.treatments
    : [...ctx.treatments, actionId];
  const harmful = ctx.call.harmfulTreatment.includes(actionId);
  if (harmful) {
    return {
      label,
      message: `${label} may be harmful for this presentation.`,
      scoreDelta: -20,
      severity: 'bad',
      skill: 'treatment',
      treatments,
      flowMiss: true,
    };
  }

  const fx = evaluateTreatmentAction(ctx.call, actionId, ctx.treatments, ctx.vitals);
  const medNeedsAllergy =
    ['aspirin', 'nitroglycerin', 'epinephrine', 'narcan', 'oral_glucose', 'nebulizer'].includes(
      actionId
    ) && !ctx.allergiesChecked;

  return {
    label,
    message: medNeedsAllergy
      ? `${fx.message} (Allergy check not documented yet.)`
      : fx.message,
    scoreDelta: medNeedsAllergy ? Math.min(fx.scoreDelta, 4) : fx.scoreDelta,
    severity: medNeedsAllergy ? 'warn' : fx.severity ?? 'good',
    skill: 'treatment',
    treatments,
    vitalsPatch: fx.vitals,
    flowMiss: medNeedsAllergy || fx.severity === 'bad',
  };
}
