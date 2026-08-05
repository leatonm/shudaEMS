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
  'rapid_transport',
  'begin_handoff',
  'notify_hospital',
]);

const PATIENT_CONTACT_ACTIONS = new Set([
  'general_impression',
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
        'Open Assessment → Primary (xABC). Find life threats as you go.',
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
        'Verbal report and transfer of care.',
        'Clear, concise, and in order — what you found, what you did, what they need next.',
      ];
  }
}

/**
 * One brief coach line after an action — priority first, then order.
 * Allowed actions still proceed; Lauren only comments.
 */
export function coachAfterAction(ctx: CoachContext): {
  tip: string | null;
  note: CoachNote | null;
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
    };
  }

  return { tip: null, note: null };
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

  // --- Soft next-step after good size-up pieces (not big hints) ---
  if (actionId === 'don_ppe') {
    return 'Good. Next: is the scene safe to work?';
  }
  if (actionId === 'verbalize_scene_safe' && call.hazards.length === 0) {
    return 'Next: patients, MOI or NOI, and whether you need more resources.';
  }
  if (actionId === 'general_impression') {
    return isArrestPriority(call, vitals)
      ? 'Unresponsive impression — move to ABCs and pulse check fast.'
      : 'Next: responsiveness, chief complaint / life threats, then ABCs.';
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
    return "I'll allow it — BSI still belongs before patient contact. Build the habit.";
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
    return 'Noted — finish size-up (PPE, safety, patients, MOI/NOI) so the board stays clean.';
  }

  // Full SAMPLE before ABCs on primary
  if (
    nremtStage === 'primary_survey' &&
    HISTORY_ACTIONS.has(actionId) &&
    !(done('airway') && done('breathing') && done('circulation'))
  ) {
    return 'Allowed — but life threats on primary come before a full SAMPLE.';
  }

  // Destination / priority too early
  if (
    (nremtStage === 'scene_sizeup' || nremtStage === 'primary_survey') &&
    TRANSPORT_ACTIONS.has(actionId)
  ) {
    return 'Destination can wait until primary threats are addressed.';
  }

  // Vitals stage but chasing history again
  if (nremtStage === 'vitals' && HISTORY_ACTIONS.has(actionId)) {
    return 'You can — just do not skip acting on critical vitals you already have.';
  }

  return null;
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
