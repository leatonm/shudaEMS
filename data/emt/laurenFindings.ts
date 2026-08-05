import type {
  EmtCall,
  EmtVitals,
  RevealedVitals,
} from '@/data/emt/types';
import type { NremtStage } from '@/data/emt/nremtFlow';
import {
  coachAfterAction,
  type CoachNote,
} from '@/data/emt/laurenCoach';

export type RevealedVitalKey =
  | 'bp'
  | 'hr'
  | 'rr'
  | 'spo2'
  | 'glucose'
  | 'temp'
  | 'pain'
  | 'etco2'
  | 'ecg';

export interface LaurenExchange {
  /** What the student is treated as saying / doing. */
  studentLine: string;
  /** Lauren’s evaluator reply (1+ lines). */
  laurenLines: string[];
  /** Which vitals become visible on the patient strip. */
  reveal?: RevealedVitalKey[];
  /** Optional immediate follow-up choices (e.g. scene unsafe). */
  followUps?: Array<{ id: string; label: string; actionId: string }>;
}

function finding(call: EmtCall, step: string): string | undefined {
  return call.abcde.find((f) => f.step === step)?.clue;
}

function sceneSafetyLines(call: EmtCall): string[] {
  if (call.hazards.length === 0) {
    return ['The scene appears safe.'];
  }
  return [
    'Here is what you see on the scene:',
    ...call.hazards.map((h) => `${h.label}: ${h.description}`),
  ];
}

/** Build the oral-exam exchange for a student action. */
export function buildLaurenExchange(
  actionId: string,
  call: EmtCall,
  vitals: EmtVitals
): LaurenExchange {
  switch (actionId) {
    case 'don_ppe':
      return {
        studentLine: "I'd like to take BSI precautions.",
        laurenLines: ['You are wearing gloves and eye protection.'],
      };
    case 'verbalize_scene_safe':
      return {
        studentLine: 'Is the scene safe?',
        laurenLines: sceneSafetyLines(call),
        // Coach-only tips are attached in presentLaurenExchange / store.
      };
    case 'count_patients':
      return {
        studentLine: "I'd like to determine the number of patients.",
        laurenLines: [
          call.category === 'mci'
            ? 'Multiple patients are visible. Exact count is still being established.'
            : 'You identify one patient.',
        ],
      };
    case 'assess_moi':
      return {
        studentLine: "I'd like to determine MOI or NOI.",
        laurenLines: ['Is this a mechanism of injury, or a nature of illness?'],
        followUps: [
          { id: 'fu_moi', label: 'MOI — Mechanism of Injury', actionId: 'declare_moi' },
          { id: 'fu_noi', label: 'NOI — Nature of Illness', actionId: 'declare_noi' },
        ],
      };
    case 'declare_moi':
      return {
        studentLine: 'This is a mechanism of injury.',
        laurenLines: [
          `Noted — MOI. Dispatch context: ${call.dispatch}`,
        ],
      };
    case 'declare_noi':
      return {
        studentLine: 'This is a nature of illness.',
        laurenLines: [
          `Noted — NOI. Dispatch context: ${call.dispatch}`,
        ],
      };
    case 'scan_hazards':
      return {
        studentLine: "I'd like to identify any hazards.",
        laurenLines: [
          call.hazards.length
            ? call.hazards.map((h) => `${h.label}: ${h.description}`).join(' ')
            : 'No obvious environmental hazards identified.',
        ],
      };
    case 'c_spine':
      return {
        studentLine: "I'd like to take C-spine precautions.",
        laurenLines: ['Manual C-spine stabilization is noted.'],
      };
    case 'consider_resources':
      return {
        studentLine: 'Do we need additional resources?',
        laurenLines: [
          call.resourcesOnScene.length
            ? `Already on scene: ${call.resourcesOnScene
                .map((r) => r.toUpperCase())
                .join(', ')}.`
            : 'No additional units are on scene yet.',
          'Who do you want — Medic (ALS), Law, or Fire?',
        ],
        followUps: [
          { id: 'fu_res_als', label: 'Medic / ALS', actionId: 'resource_pick_als' },
          { id: 'fu_res_pd', label: 'Law Enforcement', actionId: 'resource_pick_pd' },
          { id: 'fu_res_fire', label: 'Fire', actionId: 'resource_pick_fire' },
          { id: 'fu_res_none', label: 'None right now', actionId: 'resource_pick_none' },
        ],
      };
    case 'resource_pick_als':
      return {
        studentLine: 'I need Medic / ALS.',
        laurenLines: ['Medic — do you want them enroute to the scene, or standing by?'],
        followUps: [
          { id: 'fu_als_enroute', label: 'Enroute to scene', actionId: 'resource_als_enroute' },
          { id: 'fu_als_standby', label: 'Stand by', actionId: 'resource_als_standby' },
        ],
      };
    case 'resource_pick_pd':
      return {
        studentLine: 'I need Law Enforcement.',
        laurenLines: ['Law — enroute to the scene, or standing by?'],
        followUps: [
          { id: 'fu_pd_enroute', label: 'Enroute to scene', actionId: 'resource_pd_enroute' },
          { id: 'fu_pd_standby', label: 'Stand by', actionId: 'resource_pd_standby' },
        ],
      };
    case 'resource_pick_fire':
      return {
        studentLine: 'I need Fire.',
        laurenLines: ['Fire — enroute to the scene, or standing by?'],
        followUps: [
          { id: 'fu_fire_enroute', label: 'Enroute to scene', actionId: 'resource_fire_enroute' },
          { id: 'fu_fire_standby', label: 'Stand by', actionId: 'resource_fire_standby' },
        ],
      };
    case 'resource_pick_none':
      return {
        studentLine: 'No additional resources right now.',
        laurenLines: ['Copy — no additional resources at this time.'],
      };
    case 'resource_als_enroute':
      return {
        studentLine: 'Medic enroute to the scene.',
        laurenLines: [
          `Medic is enroute — about ${call.distanceMiles} minutes away.`,
        ],
      };
    case 'resource_als_standby':
      return {
        studentLine: 'Medic standing by.',
        laurenLines: [
          'Medic is standing by.',
          'If you need them later, they will arrive sooner.',
        ],
      };
    case 'resource_pd_enroute':
      return {
        studentLine: 'Law enroute to the scene.',
        laurenLines: [
          `Law is enroute — about ${call.distanceMiles} minutes away.`,
        ],
      };
    case 'resource_pd_standby':
      return {
        studentLine: 'Law standing by.',
        laurenLines: [
          'Law is standing by.',
          'If you need them later, they will arrive sooner.',
        ],
      };
    case 'resource_fire_enroute':
      return {
        studentLine: 'Fire enroute to the scene.',
        laurenLines: [
          `Fire is enroute — about ${call.distanceMiles} minutes away.`,
        ],
      };
    case 'resource_fire_standby':
      return {
        studentLine: 'Fire standing by.',
        laurenLines: [
          'Fire is standing by.',
          'If you need them later, they will arrive sooner.',
        ],
      };
    case 'traffic_control':
      return {
        studentLine: "I'd like to establish traffic control.",
        laurenLines: ['Traffic control is being established.'],
      };
    case 'stage_away':
      return {
        studentLine: "I'll stage away until the scene is secure.",
        laurenLines: ['You remain staged at a safe distance.'],
      };
    case 'enter_scene':
      return {
        studentLine: "I'd like to make patient contact.",
        laurenLines: [
          'You move to the patient.',
          call.patientSummary,
        ],
      };
    case 'deescalate':
      return {
        studentLine: "I'd attempt verbal de-escalation.",
        laurenLines: [
          'You attempt calm verbal engagement. Tension eases slightly, but the situation remains fluid.',
        ],
      };
    case 'general_impression':
      return {
        studentLine: "I'd like a general impression.",
        laurenLines: [
          call.patientSummary,
          finding(call, 'breathing') ?? 'Work of breathing is notable.',
          'Appears anxious.',
        ].filter(Boolean) as string[],
      };
    case 'rapid_assessment': {
      const arrest =
        vitals.hr === 0 ||
        vitals.mentalStatus.toLowerCase().includes('unresponsive') ||
        vitals.mentalStatus.toLowerCase().includes('pulseless');
      return {
        studentLine: "I'd like to do a rapid assessment.",
        laurenLines: [
          call.patientSummary,
          `AVPU / mental status: ${vitals.mentalStatus}.`,
          finding(call, 'airway') ?? 'Airway assessed.',
          finding(call, 'breathing') ?? `Breathing: RR ${vitals.rr}.`,
          finding(call, 'circulation') ?? `Circulation: pulse ${vitals.hr}.`,
          finding(call, 'disability') ?? `Disability: ${vitals.mentalStatus}.`,
          finding(call, 'exposure') ?? 'Quick exposure for life threats completed.',
          arrest
            ? 'This looks critical — move to CPR / AED if there is no pulse.'
            : 'Rapid primary complete. Treat life threats, then vitals / transport as indicated.',
        ].filter(Boolean) as string[],
        reveal: ['hr', 'rr'],
        followUps: arrest
          ? [
              { id: 'fu_cpr', label: 'Start CPR', actionId: 'cpr' },
              { id: 'fu_aed', label: 'Apply AED', actionId: 'aed' },
            ]
          : undefined,
      };
    }
    case 'focused_assessment':
      return {
        studentLine: "I'd like to do a focused assessment.",
        laurenLines: [
          call.patientSummary,
          `Mental status: ${vitals.mentalStatus}.`,
          `Chief complaint / focus: ${call.dispatch}`,
          finding(call, 'breathing') ??
            finding(call, 'circulation') ??
            finding(call, 'disability') ??
            'Focused exam findings documented for the complaint.',
          'Skin signs and system-focused checks completed. Grab vitals and SAMPLE/OPQRST as needed.',
        ].filter(Boolean) as string[],
        reveal: ['hr', 'rr'],
      };
    case 'assess_loc':
      return {
        studentLine: "I'd like to assess level of consciousness — AVPU.",
        laurenLines: [`Mental status: ${vitals.mentalStatus}.`],
      };
    case 'chief_complaint':
      return {
        studentLine: "I'd like the chief complaint and any apparent life threats.",
        laurenLines: [
          `Chief complaint / presentation: ${call.dispatch}`,
          finding(call, 'circulation') ??
            finding(call, 'breathing') ??
            'No immediate external life threat is obvious from here — continue your primary.',
        ],
      };
    case 'airway':
      return {
        studentLine: "I'd like to assess the airway.",
        laurenLines: [finding(call, 'airway') ?? 'Airway is patent.'],
      };
    case 'breathing':
      return {
        studentLine: "I'd like to assess breathing.",
        laurenLines: [
          finding(call, 'breathing') ?? `Respirations ${vitals.rr}.`,
          'SpO₂ is unavailable until pulse oximetry is applied.',
        ],
        reveal: ['rr'],
      };
    case 'circulation':
      return {
        studentLine: "I'd like to assess circulation.",
        laurenLines: [
          finding(call, 'circulation') ?? `Pulse is ${vitals.hr}.`,
        ],
        reveal: ['hr'],
      };
    case 'disability':
      return {
        studentLine: "I'd like to assess disability / neuro.",
        laurenLines: [finding(call, 'disability') ?? `Mental status: ${vitals.mentalStatus}.`],
      };
    case 'exposure':
      return {
        studentLine: "I'd like to expose as needed for assessment.",
        laurenLines: [finding(call, 'exposure') ?? 'Exposure completed with privacy maintained.'],
      };
    case 'lung_sounds':
      return {
        studentLine: "I'd like to assess lung sounds.",
        laurenLines: [
          finding(call, 'breathing') ?? 'Lung sounds assessed bilaterally.',
        ],
      };
    case 'work_of_breathing':
      return {
        studentLine: "I'd like to assess work of breathing.",
        laurenLines: ['Accessory muscle use is present.'],
      };
    case 'check_spo2':
    case 'vital_spo2':
      return {
        studentLine: "I'd like to apply pulse oximetry.",
        laurenLines: [`SpO₂ is ${vitals.spo2}%.`],
        reveal: ['spo2'],
      };
    case 'vital_bp':
      return {
        studentLine: "I'd like a blood pressure.",
        laurenLines: [
          vitals.hr === 0
            ? 'There is no obtainable blood pressure — the patient is pulseless.'
            : `Blood pressure is ${vitals.bp}.`,
        ],
        reveal: ['bp'],
      };
    case 'vital_pulse':
      return {
        studentLine: "I'd like to obtain a pulse.",
        laurenLines: [
          vitals.hr === 0
            ? 'No pulse. Begin CPR — do not delay for a full vitals panel.'
            : `The pulse is ${vitals.hr}.`,
        ],
        reveal: ['hr'],
      };
    case 'vital_rr':
      return {
        studentLine: "I'd like to obtain a respiratory rate.",
        laurenLines: [`Respirations are ${vitals.rr}.`],
        reveal: ['rr'],
      };
    case 'vital_temp':
      return {
        studentLine: "I'd like to obtain a temperature.",
        laurenLines: ['Temperature is within a non-critical range for this presentation.'],
        reveal: ['temp'],
      };
    case 'blood_glucose':
      return {
        studentLine: "I'd like to obtain a blood glucose.",
        laurenLines: [
          vitals.glucose != null
            ? `Blood glucose is ${vitals.glucose}.`
            : 'Blood glucose is not critical for this presentation.',
        ],
        reveal: vitals.glucose != null ? ['glucose'] : undefined,
      };
    case 'ecg':
      return {
        studentLine: "I'd like a 12-lead ECG.",
        laurenLines: ['12-lead obtained. Rhythm and findings available for your interpretation.'],
        reveal: ['ecg'],
      };
    case 'pain_scale':
      return {
        studentLine: "I'd like a pain scale.",
        laurenLines: ['Patient rates pain 7 out of 10.'],
        reveal: ['pain'],
      };
    case 'skin_signs':
      return {
        studentLine: "I'd like to assess skin signs.",
        laurenLines: ['Skin is pale and diaphoretic.'],
      };
    case 'cap_refill':
      return {
        studentLine: "I'd like to check capillary refill.",
        laurenLines: ['Capillary refill is delayed.'],
      };
    case 'major_bleeding':
      return {
        studentLine: "I'd like to check for major bleeding.",
        laurenLines: [
          call.category === 'trauma'
            ? 'Assess for external hemorrhage as you expose.'
            : 'No major external bleeding identified.',
        ],
      };
    case 'opqrst': {
      const by = (re: RegExp) =>
        call.history.find((h) => h.framework === 'OPQRST' && re.test(h.label))?.clue;
      return {
        studentLine: "I'd like to obtain an OPQRST history.",
        laurenLines: [
          `Onset — ${by(/onset/i) ?? 'Started approximately 30 minutes ago.'}`,
          `Provocation — ${by(/provoc|palliat/i) ?? 'Worse with activity.'}`,
          `Quality — ${by(/quality/i) ?? 'Pressure.'}`,
          `Radiation — ${by(/radiat/i) ?? 'Left arm.'}`,
          `Severity — ${by(/sever/i) ?? '8 / 10.'}`,
          `Time — ${by(/time|duration/i) ?? 'Constant.'}`,
        ],
      };
    }
    case 'sample': {
      const by = (re: RegExp) =>
        call.history.find((h) => h.framework === 'SAMPLE' && re.test(h.label))?.clue;
      return {
        studentLine: "I'd like to obtain a SAMPLE history.",
        laurenLines: [
          `Signs/Symptoms — ${by(/sign|symptom/i) ?? call.dispatch}`,
          `Allergies — ${by(/allerg/i) ?? 'No known drug allergies reported.'}`,
          `Medications — ${by(/medicat/i) ?? 'See medication list if available.'}`,
          `Past history — ${by(/past|history|pmh/i) ?? 'Limited history available.'}`,
          `Last oral intake — ${by(/oral|intake|last/i) ?? 'Unknown.'}`,
          `Events — ${by(/event/i) ?? 'Events leading up match the dispatch complaint.'}`,
        ],
      };
    }
    case 'allergies':
      return {
        studentLine: 'Does the patient have any allergies?',
        laurenLines: [
          call.history.find((h) => /allerg/i.test(h.label))?.clue ??
            'No known drug allergies reported.',
        ],
      };
    case 'oxygen':
      return {
        studentLine: "I'd like to apply supplemental oxygen.",
        laurenLines: [
          'Oxygen is applied as directed.',
          'The patient appears slightly less anxious.',
        ],
      };
    case 'aspirin':
      return {
        studentLine: "I'd like to administer aspirin.",
        laurenLines: ['Aspirin is administered per your direction.'],
      };
    case 'nitroglycerin':
      return {
        studentLine: "I'd like to assist with nitroglycerin.",
        laurenLines: [
          'Nitroglycerin is assisted as directed.',
          'Two minutes later…',
          'Chest pain has improved somewhat.',
          'Recheck blood pressure — it may have dropped.',
        ],
      };
    case 'request_als':
      return {
        studentLine: "I'd like to request a medic / paramedic.",
        laurenLines: ['Medic has been requested.'],
      };
    case 'request_pd':
      return {
        studentLine: "I'd like to request law enforcement.",
        laurenLines: ['Law enforcement has been requested.'],
      };
    case 'request_fire':
      return {
        studentLine: "I'd like to request fire / rescue.",
        laurenLines: ['Fire / rescue has been requested.'],
      };
    case 'reassessment':
      return {
        studentLine: "I'd like to reassess the patient.",
        laurenLines: [
          `Reassessment: mental status ${vitals.mentalStatus}.`,
          'You can reassess again anytime to watch for change.',
        ],
        reveal: ['hr', 'rr', 'spo2', 'bp'],
      };
    case 'notify_hospital':
      return {
        studentLine: "I'd like to give a radio report / notify the hospital.",
        laurenLines: ['Hospital is notified. Continue your report.'],
      };
    case 'stay_and_play':
      return {
        studentLine: "I'm going to stay and play — wrap up on scene.",
        laurenLines: [
          'Stay and Play ends the call on scene — no transport.',
          'Anything else you want to do for the patient before we grade?',
        ],
        followUps: [
          {
            id: 'keep_working',
            label: 'Keep working',
            actionId: 'continue_care_wrap',
          },
          {
            id: 'end_scene',
            label: 'End on scene & grade',
            actionId: 'confirm_stay_and_play',
          },
        ],
      };
    case 'continue_care_wrap':
      return {
        studentLine: "I'll keep working.",
        laurenLines: [
          'Keep going — reassess or treat, then Stay and Play or Transport when ready.',
        ],
      };
    case 'confirm_stay_and_play':
      return {
        studentLine: "I'm ending care on scene — Stay and Play.",
        laurenLines: ['Disposition logged. Closing the call for your debrief.'],
      };
    case 'load_and_go':
      return {
        studentLine: "I'm going to load and go — continue care en route.",
        laurenLines: [
          'Packaging for transport. Keep assessing and treating on the way.',
          'Next: open Transport and choose destination and mode.',
        ],
      };
    case 'begin_handoff':
      return {
        studentLine: "I'd like to begin hospital handoff.",
        laurenLines: ['You arrive at the emergency department. Deliver your verbal report.'],
      };
    case 'read_cad':
      return {
        studentLine: "I'd like to review CAD information.",
        laurenLines: [
          call.cadNotes,
          `Weather: ${call.weather}. Time of day: ${call.timeOfDay}.`,
          `Estimated time from station: ${call.distanceMiles} minutes.`,
        ],
      };
    case 'read_dispatch_notes':
      return {
        studentLine: "I'd like to review the dispatch notes.",
        laurenLines: [call.dispatch, call.patientSummary],
      };
    case 'consider_equipment':
      return {
        studentLine: "I'd like to select equipment before arrival.",
        laurenLines: [
          'Consider airway bag, oxygen, monitor, and any call-specific gear.',
        ],
      };
    case 'ask_unclear':
      return {
        studentLine: '…',
        laurenLines: [
          "I didn't catch a clear action there.",
          'Try something like a vital, BSI, scene safety, or an intervention.',
        ],
      };
    case 'review_protocols':
      return {
        studentLine: "I'd like to review protocol (coach).",
        laurenLines: call.pearls.slice(0, 2),
      };
    default: {
      const label = actionId.replace(/_/g, ' ');
      return {
        studentLine: `I'd like to ${label}.`,
        laurenLines: [`Noted: ${label}.`],
      };
    }
  }
}

export function dispatchLaurenLines(call: EmtCall): string[] {
  return [
    "You've arrived.",
    'Walk me through your size-up.',
    'Verbalize PPE, scene safety, number of patients, additional resources, and NOI or MOI.',
    `Dispatch was: ${call.dispatch}`,
  ];
}

/**
 * Practice-only coaching: one short next-step / priority / order tip.
 * Does not click for the player — just guides. Exam never calls this.
 */
export function withCoachTips(
  actionId: string,
  call: EmtCall,
  exchange: LaurenExchange,
  ctx: {
    vitals: EmtVitals;
    revealedVitals: RevealedVitals;
    nremtStage: NremtStage;
    completedActions: string[];
    treatments: string[];
  }
): { exchange: LaurenExchange; coachNote: CoachNote | null } {
  // Hazard scene-safety tips stay (factual risk + soft next move).
  if (actionId === 'verbalize_scene_safe' && call.hazards.length > 0) {
    const hazardTips = call.hazards
      .map((h) => h.coachTip)
      .filter((tip): tip is string => Boolean(tip));
    const base: LaurenExchange = {
      ...exchange,
      laurenLines: [
        ...exchange.laurenLines,
        ...hazardTips.slice(0, 1),
        'If it is not safe yet, request Law or Fire — or stage away.',
      ],
    };
    return { exchange: base, coachNote: null };
  }

  if (actionId === 'review_protocols') {
    return { exchange, coachNote: null };
  }

  const { tip, note, softOnly } = coachAfterAction({
    actionId,
    call,
    vitals: ctx.vitals,
    revealedVitals: ctx.revealedVitals,
    revealing: exchange.reveal,
    nremtStage: ctx.nremtStage,
    completedActions: ctx.completedActions,
    treatments: ctx.treatments,
  });

  if (!tip) {
    return { exchange, coachNote: null };
  }

  // Order / phase tips stay off Lauren's popup — quiet strip handles them.
  if (softOnly) {
    return { exchange, coachNote: note };
  }

  return {
    exchange: {
      ...exchange,
      // One brief coach line — never bury the factual finding.
      laurenLines: [...exchange.laurenLines, tip],
      followUps: exchange.followUps,
    },
    coachNote: note,
  };
}
