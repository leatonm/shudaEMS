import type { NremtStage } from '@/data/emt/nremtFlow';
import type {
  CallCategory,
  CoachNote,
  EmtCall,
  EmtVitals,
  RevealedVitals,
} from '@/data/emt/types';

export type { CoachNote };

export interface CoachContext {
  actionId: string;
  call: EmtCall;
  vitals: EmtVitals;
  /** Vitals already revealed before this action's reveal is applied. */
  revealedVitals: RevealedVitals;
  /** Keys this action is about to reveal. */
  revealing?: Array<keyof RevealedVitals>;
  nremtStage: NremtStage;
  completedActions: string[];
  treatments: string[];
}

const HISTORY_ACTIONS = new Set([
  'opqrst',
  'sample',
  'allergies',
  'medications_hx',
  'pmh',
  'events',
  'last_oral',
]);

const VITAL_STACK_ACTIONS = new Set([
  'vital_bp',
  'vital_pulse',
  'vital_rr',
  'check_spo2',
  'vital_spo2',
  'vital_temp',
  'blood_glucose',
  'pain_scale',
  'ecg',
  'vital_etco2',
]);

const SECONDARY_ACTIONS = new Set([
  'secondary_assessment',
  'lung_sounds',
  'skin_signs',
  'cap_refill',
  'exposure',
]);

const TRANSPORT_ACTIONS = new Set([
  'choose_destination',
  'destination_closest',
  'destination_stroke',
  'destination_trauma',
  'destination_pci',
  'destination_peds',
  'destination_ob',
  'set_priority_emergency',
  'set_priority_urgent',
  'set_priority_non_urgent',
  'priority_emergency',
  'priority_urgent',
  'priority_non_urgent',
  'stay_and_play',
  'load_and_go',
  'rapid_transport',
  'begin_handoff',
  'notify_hospital',
  'dest_trauma_center',
  'dest_stroke_center',
  'dest_pci_capable',
  'dest_pediatric_ed',
  'dest_closest_ed',
  'dest_labor_delivery',
]);

const PATIENT_CONTACT_ACTIONS = new Set([
  'general_impression',
  'rapid_assessment',
  'focused_assessment',
  'assess_loc',
  'chief_complaint',
  'airway',
  'breathing',
  'circulation',
  'disability',
  'exposure',
  'major_bleeding',
  'oxygen',
  'cpr',
  'aed',
  'suction',
  'airway_adjunct',
  'bvm',
  'bleeding_control',
  'aspirin',
  'nitroglycerin',
  'nebulizer',
  'epinephrine',
  'naloxone',
  'glucose_oral',
  ...HISTORY_ACTIONS,
  ...VITAL_STACK_ACTIONS,
  ...SECONDARY_ACTIONS,
]);

function hasDone(completed: string[], treatments: string[], id: string): boolean {
  return completed.includes(id) || treatments.includes(id);
}

/** True when this call needs immediate CPR / defibrillation priority. */
export function isArrestPriority(call: EmtCall, vitals: EmtVitals): boolean {
  if (call.archetypeId === 'cardiac_arrest') return true;
  if (call.recommendedTreatment.includes('cpr') && vitals.hr === 0) return true;
  if (vitals.hr === 0 && vitals.rr === 0) return true;
  return false;
}

/** Prefer Rapid Assessment for critical / unresponsive presentations. */
export function prefersRapidAssessment(call: EmtCall, vitals: EmtVitals): boolean {
  if (isArrestPriority(call, vitals)) return true;
  const ms = vitals.mentalStatus.toLowerCase();
  if (
    ms.includes('unresponsive') ||
    ms.includes('unconscious') ||
    ms.includes('pulseless') ||
    ms.includes('responds to pain') ||
    /\b(u|p)\b/.test(ms)
  ) {
    return true;
  }
  if (vitals.hr === 0 || vitals.rr === 0 || vitals.spo2 < 85) return true;
  if (call.category === 'trauma' && call.correctTransportPriority === 'emergency') {
    return true;
  }
  if (call.priority === 1 && call.correctTransportPriority === 'emergency') {
    return true;
  }
  return false;
}

function arrestTreating(treatments: string[], completed: string[]): boolean {
  return (
    hasDone(completed, treatments, 'cpr') || hasDone(completed, treatments, 'aed')
  );
}

function categoryBeat(category: CallCategory): string {
  switch (category) {
    case 'trauma':
      return 'Trauma call — think hazards, bleeding, and C-spine as you size up.';
    case 'peds':
      return 'Pediatric call — keep caregivers close and watch work of breathing.';
    case 'ob':
      return 'OB call — two patients once delivery starts; protect mom and baby.';
    case 'mci':
      return 'MCI — count patients early and request more ambulances if needed.';
    default:
      return 'Medical call — protect yourself, then find life threats fast.';
  }
}

/**
 * Short phase intro — what this board is, what to do next, why.
 * Not a walkthrough script; player still chooses.
 */
export function phaseEnterGuide(stage: NremtStage, call: EmtCall): string[] {
  const beat = categoryBeat(call.category);
  switch (stage) {
    case 'scene_sizeup':
      return [
        'This is Scene Size-Up.',
        'Prepare yourself and stay safe — PPE, scene safety, patients, MOI/NOI, resources.',
        beat,
      ];
    case 'primary_survey':
      return [
        'This is the Primary Survey — patient contact.',
        'Open Assessment → Rapid Assessment (critical / unresponsive) or Focused Assessment (more stable).',
        isArrestPriority(call, call.vitals)
          ? 'If there is no pulse: CPR and AED under Treatment — do not stack vitals first.'
          : 'Treat life threats under Treatment as you find them. The bottom button advances when you are ready.',
      ];
    case 'history':
      return [
        'History taking.',
        'OPQRST and SAMPLE — focused questions that change treatment or destination.',
        call.category === 'trauma'
          ? 'Keep it tight if the patient is unstable — trauma history is brief.'
          : 'Allergies before medications when you can.',
      ];
    case 'secondary':
      return [
        'Secondary assessment.',
        'Look at the body system that matches this complaint — then reassess.',
      ];
    case 'vitals':
      return [
        'Vital signs.',
        'Get the numbers that matter — then act on critical findings; do not just collect them.',
      ];
    case 'reassessment':
      return [
        'Reassessment.',
        'Show how the patient changed after your interventions, then ready your report.',
      ];
    case 'report':
      return [
        'Transport decisions and verbal handoff.',
        'Stay and Play or Load and Go, then Transport for destination and mode — handoff opens when both are set.',
      ];
  }
}

/**
 * One brief coach line after an action — priority first, then order / soft next.
 * Allowed actions still proceed.
 * Priority → Lauren popup. Order / soft next → quiet strip + debrief note.
 */
export function coachAfterAction(ctx: CoachContext): {
  tip: string | null;
  note: CoachNote | null;
  /** Soft tips stay off Lauren's modal. */
  softOnly: boolean;
} {
  const priority = priorityTip(ctx);
  if (priority) {
    return {
      tip: priority,
      note: {
        id: `priority-${ctx.actionId}-${priority.slice(0, 24)}`,
        kind: 'priority',
        text: priority,
        actionId: ctx.actionId,
      },
      softOnly: false,
    };
  }

  const order = orderTip(ctx);
  if (order) {
    return {
      tip: order,
      note: {
        id: `order-${ctx.actionId}-${order.slice(0, 24)}`,
        kind: 'order',
        text: order,
        actionId: ctx.actionId,
      },
      softOnly: true,
    };
  }

  const softNext = softNextTip(ctx);
  if (softNext) {
    return {
      tip: softNext,
      note: {
        id: `phase-${ctx.actionId}-${softNext.slice(0, 24)}`,
        kind: 'phase',
        text: softNext,
        actionId: ctx.actionId,
      },
      softOnly: true,
    };
  }

  return { tip: null, note: null, softOnly: true };
}

function priorityTip(ctx: CoachContext): string | null {
  const { actionId, call, vitals, treatments, completedActions, revealing } = ctx;
  const done = (id: string) => hasDone(completedActions, treatments, id);
  const arrest = isArrestPriority(call, vitals);
  const treatingArrest = arrestTreating(treatments, completedActions);

  // --- Cardiac arrest priority ---
  if (arrest && !treatingArrest) {
    if (actionId === 'vital_bp') {
      return 'No measurable BP in arrest — start high-quality CPR and get the AED.';
    }
    if (VITAL_STACK_ACTIONS.has(actionId) && actionId !== 'vital_pulse') {
      return 'Pulseless — do not stack vitals. CPR and AED now.';
    }
    if (HISTORY_ACTIONS.has(actionId) || SECONDARY_ACTIONS.has(actionId)) {
      return 'Arrest first. History and secondary wait until compressions are going.';
    }
    if (TRANSPORT_ACTIONS.has(actionId)) {
      return 'Transport matters — but not before CPR is started.';
    }
    if (actionId === 'circulation' || actionId === 'vital_pulse') {
      return 'No pulse — move to CPR and AED. Do not delay for a full vitals panel.';
    }
    if (actionId === 'breathing' || actionId === 'airway') {
      return 'Airway and breathing matter — then confirm pulse and start CPR if absent.';
    }
  }

  if (arrest && treatingArrest) {
    if (HISTORY_ACTIONS.has(actionId) && !done('request_als')) {
      return 'Good — keep CPR quality high. Request ALS if they are not already rolling.';
    }
  }

  // --- Critical SpO2 just revealed / already known ---
  const spo2Now =
    revealing?.includes('spo2') || ctx.revealedVitals.spo2 ? vitals.spo2 : null;
  if (
    spo2Now != null &&
    spo2Now > 0 &&
    spo2Now < 90 &&
    !done('oxygen') &&
    !done('bvm') &&
    (actionId === 'check_spo2' ||
      actionId === 'vital_spo2' ||
      (VITAL_STACK_ACTIONS.has(actionId) && ctx.revealedVitals.spo2))
  ) {
    return `SpO₂ is ${spo2Now}% — treat hypoxia (oxygen / support breathing) before more numbers.`;
  }

  // --- Critical HR ---
  const hrNow =
    revealing?.includes('hr') || ctx.revealedVitals.hr ? vitals.hr : null;
  if (hrNow != null && hrNow > 0 && (hrNow < 40 || hrNow > 150) && !arrest) {
    if (
      actionId === 'vital_pulse' ||
      actionId === 'circulation' ||
      (VITAL_STACK_ACTIONS.has(actionId) && ctx.revealedVitals.hr)
    ) {
      if (!done('request_als') && hrNow < 40) {
        return `Heart rate ${hrNow} — this is unstable. Support ABCs and get ALS rolling.`;
      }
      if (hrNow > 150 && !done('request_als')) {
        return `Heart rate ${hrNow} — note it, support the patient, and consider ALS early.`;
      }
    }
  }

  // --- Critical RR ---
  const rrNow =
    revealing?.includes('rr') || ctx.revealedVitals.rr ? vitals.rr : null;
  if (
    rrNow != null &&
    rrNow > 0 &&
    (rrNow < 8 || rrNow >= 30) &&
    !done('oxygen') &&
    !done('bvm') &&
    (actionId === 'vital_rr' || actionId === 'breathing')
  ) {
    return rrNow < 8
      ? `Respirations ${rrNow} — support ventilation; do not just move to the next vital.`
      : `Respirations ${rrNow} — high work of breathing. Oxygen and reassess.`;
  }

  // --- Trauma bleeding before long history ---
  if (
    call.category === 'trauma' &&
    call.recommendedTreatment.includes('bleeding_control') &&
    !done('bleeding_control') &&
    !done('major_bleeding') &&
    (HISTORY_ACTIONS.has(actionId) || SECONDARY_ACTIONS.has(actionId))
  ) {
    return 'Life-threatening bleeding comes before a long history on trauma.';
  }

  // --- Anaphylaxis / breathing complaint — O2 priority soft tip ---
  if (
    (call.archetypeId === 'anaphylaxis' ||
      call.archetypeId === 'respiratory_distress') &&
    !done('oxygen') &&
    HISTORY_ACTIONS.has(actionId) &&
    (ctx.revealedVitals.spo2 ? vitals.spo2 < 94 : true)
  ) {
    if (actionId === 'sample' || actionId === 'opqrst') {
      return 'Breathing complaint — do not let a long history delay oxygen if they need it.';
    }
  }

  // --- Soft next-step after good size-up pieces lives in softNextTip ---
  return null;
}

function softNextTip(ctx: CoachContext): string | null {
  const { actionId, call, vitals } = ctx;
  if (actionId === 'don_ppe') {
    return 'Consider scene safety next — is it safe to work?';
  }
  if (actionId === 'verbalize_scene_safe' && call.hazards.length === 0) {
    return 'Consider patients, MOI or NOI, and whether you need more resources.';
  }
  if (actionId === 'general_impression') {
    return isArrestPriority(call, vitals)
      ? 'Consider ABCs and a pulse check next — unresponsive impression.'
      : 'Consider responsiveness, life threats, then ABCs.';
  }
  if (actionId === 'rapid_assessment') {
    return isArrestPriority(call, vitals)
      ? 'Rapid primary done — if there is no pulse, start CPR and get the AED.'
      : 'Rapid primary done — treat life threats, then vitals or transport as indicated.';
  }
  if (actionId === 'focused_assessment') {
    return prefersRapidAssessment(call, vitals)
      ? 'Consider whether a Rapid Assessment still belongs — this patient may be more critical than a focused exam covers.'
      : 'Focused exam done — consider vitals and SAMPLE / OPQRST next.';
  }
  return null;
}

function orderTip(ctx: CoachContext): string | null {
  const { actionId, completedActions, treatments, nremtStage } = ctx;
  const done = (id: string) => hasDone(completedActions, treatments, id);

  // PPE before patient contact — allow, but comment
  if (
    !done('don_ppe') &&
    PATIENT_CONTACT_ACTIONS.has(actionId) &&
    actionId !== 'don_ppe'
  ) {
    return 'Consider BSI / PPE before patient contact — build the habit even when you skip ahead.';
  }

  // Treating / assessing deep during size-up
  if (
    nremtStage === 'scene_sizeup' &&
    (HISTORY_ACTIONS.has(actionId) ||
      SECONDARY_ACTIONS.has(actionId) ||
      TRANSPORT_ACTIONS.has(actionId) ||
      actionId === 'aspirin' ||
      actionId === 'nitroglycerin')
  ) {
    return 'Consider finishing size-up first (PPE, safety, patients, MOI/NOI) before deep care.';
  }

  // Full SAMPLE before ABCs on primary
  if (
    nremtStage === 'primary_survey' &&
    HISTORY_ACTIONS.has(actionId) &&
    !(done('airway') && done('breathing') && done('circulation'))
  ) {
    return 'Consider ABCs / life threats on primary before a full SAMPLE.';
  }

  // Destination / priority too early
  if (
    (nremtStage === 'scene_sizeup' || nremtStage === 'primary_survey') &&
    TRANSPORT_ACTIONS.has(actionId)
  ) {
    return 'Consider wrapping primary threats before locking destination and mode.';
  }

  // Vitals stage but chasing history again
  if (nremtStage === 'vitals' && HISTORY_ACTIONS.has(actionId)) {
    return 'Consider acting on critical vitals you already have before more history.';
  }

  return null;
}

export type SoftCoachRoot = 'scene' | 'assessment' | 'interventions' | 'resources' | 'transport' | 'ask' | null;

/**
 * Quiet Practice coaching — optional "Consider…" lines based on gaps.
 * Never blocks free choice; mistakes still count on the skills sheet / debrief.
 */
export function getSoftConsiderations(ctx: {
  completedActions: string[];
  treatments: string[];
  nremtStage: NremtStage;
  activeRoot: SoftCoachRoot;
  call: EmtCall;
  vitals: EmtVitals;
}): string[] {
  const done = (id: string) => hasDone(ctx.completedActions, ctx.treatments, id);
  const tips: string[] = [];
  const push = (tip: string) => {
    if (tips.length >= 2) return;
    if (!tips.includes(tip)) tips.push(tip);
  };

  const arrest = isArrestPriority(ctx.call, ctx.vitals);
  const trauma = ctx.call.category === 'trauma' || ctx.call.category === 'mci';

  // Call-type flow coaching (soft path — never locks menus)
  if (arrest) {
    if (!done('don_ppe') || !done('verbalize_scene_safe')) {
      push('Arrest path: BSI and scene safety, then Rapid Assessment → CPR / AED.');
    } else if (
      !done('rapid_assessment') &&
      !(done('airway') && done('circulation'))
    ) {
      push('Arrest path: Rapid Assessment next, then CPR and AED under Treatment.');
    } else if (!done('cpr') && !done('aed')) {
      push('Arrest path: start CPR and get the AED — do not stack history first.');
    } else if (!done('request_als') && ctx.activeRoot !== 'resources') {
      push('Arrest path: keep CPR quality high and get ALS rolling if they are not already.');
    }
  } else if (trauma) {
    if (!done('don_ppe') || !done('verbalize_scene_safe')) {
      push('Trauma path: BSI, scene safety, then Rapid Assessment for life threats.');
    } else if (
      !done('rapid_assessment') &&
      !done('focused_assessment') &&
      !done('major_bleeding')
    ) {
      push('Trauma path: Rapid Assessment — control bleeding and ABCs before long history.');
    } else if (
      (ctx.call.recommendedTreatment.includes('bleeding_control') ||
        ctx.call.recommendedTreatment.includes('control_bleeding')) &&
      !done('bleeding_control') &&
      !done('control_bleeding')
    ) {
      push('Trauma path: if bleeding is life-threatening, treat it when you find it.');
    }
  } else if (!done('don_ppe')) {
    push('Medical path: start with BSI, then scene size-up, then Rapid or Focused assessment.');
  }

  const sizeUpThin =
    !done('don_ppe') ||
    !done('verbalize_scene_safe') ||
    (!done('declare_moi') && !done('declare_noi') && !done('assess_moi'));

  const leftSizeUpEarly =
    ctx.nremtStage !== 'scene_sizeup' ||
    ctx.activeRoot === 'assessment' ||
    ctx.activeRoot === 'interventions' ||
    ctx.activeRoot === 'transport';

  // Jumping into assessment / treatment / transport without size-up pieces
  if (
    tips.length < 2 &&
    (leftSizeUpEarly || ctx.activeRoot === 'assessment' || ctx.activeRoot === 'interventions')
  ) {
    if (!done('don_ppe')) {
      push('Consider BSI / PPE before patient contact.');
    }
    if (!done('verbalize_scene_safe')) {
      push('Consider a quick scene size-up — is it safe to work?');
    }
    if (
      !done('count_patients') &&
      !done('declare_moi') &&
      !done('declare_noi') &&
      !done('assess_moi')
    ) {
      push('Consider patients, MOI or NOI, and whether you need more help.');
    } else if (!done('declare_moi') && !done('declare_noi') && !done('assess_moi')) {
      push('Consider stating MOI or NOI so your size-up is complete.');
    }
    if (
      ctx.call.hazards.length > 0 &&
      !done('request_pd') &&
      !done('request_fire') &&
      !done('stage_away') &&
      !done('enter_scene')
    ) {
      push('Consider hazards — Law, Fire, or staging away if it is not safe yet.');
    }
  }

  // In assessment — nudge Rapid vs Focused, not every ABC click
  if (
    tips.length < 2 &&
    (ctx.activeRoot === 'assessment' || ctx.nremtStage === 'primary_survey')
  ) {
    const hasPrimaryPass =
      done('rapid_assessment') ||
      done('focused_assessment') ||
      (done('airway') && done('breathing') && done('circulation'));
    if (!hasPrimaryPass) {
      if (prefersRapidAssessment(ctx.call, ctx.vitals)) {
        push('Consider a Rapid Assessment — critical or altered patients need a one-pass primary.');
      } else {
        push('Consider a Focused Assessment for a stable, responsive patient — or Rapid if they look sick.');
      }
    }
  }

  // Treatment before primary threats
  if (tips.length < 2 && ctx.activeRoot === 'interventions') {
    if (
      !done('rapid_assessment') &&
      !done('focused_assessment') &&
      !done('general_impression') &&
      !done('airway') &&
      !done('circulation')
    ) {
      push('Consider a rapid primary impression / ABCs before interventions.');
    }
    if (arrest && !done('cpr') && !done('aed')) {
      push('Consider CPR and AED first if there is no pulse.');
    }
  }

  // Transport / disposition
  if (tips.length < 2 && ctx.activeRoot === 'transport') {
    if (sizeUpThin) {
      push('Consider finishing size-up and primary threats before transport decisions.');
    } else if (!(done('airway') && done('breathing') && done('circulation'))) {
      push('Consider addressing life threats on primary before destination and mode.');
    } else {
      push('Stay and Play ends on scene for grading. Load and Go → Transport for destination and mode.');
    }
  }

  // Reassess reminder after treatments
  if (
    tips.length < 2 &&
    ctx.activeRoot === 'assessment' &&
    ctx.treatments.length > 0 &&
    !ctx.completedActions.includes('reassessment')
  ) {
    push('Consider reassessing after interventions — you can reassess as often as you need.');
  }

  // Default gentle nudge early on scene menu
  if (ctx.activeRoot === 'scene' && !done('don_ppe') && tips.length === 0) {
    push('Consider starting with BSI, then scene safety.');
  }

  return tips;
}

/**
 * Soft miss hints when the student is about to end on scene (Stay and Play).
 * Optional — they can still end immediately.
 */
export function getWrapUpHints(ctx: {
  call: EmtCall;
  vitals: EmtVitals;
  completedActions: string[];
  treatments: string[];
  abcdeCompleted: string[];
}): string[] {
  const done = (id: string) => hasDone(ctx.completedActions, ctx.treatments, id);
  const hints: string[] = [];
  const push = (tip: string) => {
    if (hints.length >= 2) return;
    hints.push(tip);
  };

  if (!done('don_ppe')) push('Missed so far: BSI / PPE.');
  if (!done('verbalize_scene_safe')) push('Missed so far: scene safety check.');
  if (
    !done('rapid_assessment') &&
    !done('focused_assessment') &&
    !(done('airway') && done('breathing') && done('circulation'))
  ) {
    push(
      prefersRapidAssessment(ctx.call, ctx.vitals)
        ? 'Missed so far: a Rapid Assessment / primary ABCs.'
        : 'Missed so far: Rapid or Focused assessment.'
    );
  }
  if (isArrestPriority(ctx.call, ctx.vitals) && !done('cpr') && !done('aed')) {
    push('Missed so far: CPR / AED for arrest.');
  }
  for (const id of ctx.call.recommendedTreatment.slice(0, 4)) {
    if (
      ['oxygen', 'aspirin', 'bleeding_control', 'control_bleeding', 'narcan', 'epinephrine', 'request_als'].includes(
        id
      ) &&
      !done(id)
    ) {
      push(`Missed so far: ${id.replace(/_/g, ' ')}.`);
    }
  }
  if (!done('reassessment')) {
    push('You can still reassess once more before ending — changes matter.');
  }

  return hints;
}

/** Deduplicate coach notes for debrief (keep first occurrence of similar text). */
export function uniqueCoachNotes(notes: CoachNote[]): CoachNote[] {
  const seen = new Set<string>();
  const out: CoachNote[] = [];
  for (const note of notes) {
    const key = note.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(note);
  }
  return out;
}
