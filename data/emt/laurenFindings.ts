import type { EmtCall, EmtVitals, SceneHazard } from '@/data/emt/types';

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

function hazardLine(hazards: SceneHazard[]): string {
  if (hazards.length === 0) {
    return 'The scene appears secure from where you are staging.';
  }
  return hazards.map((h) => h.description || h.label).join(' ');
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
        laurenLines: [
          call.hazards.length === 0
            ? 'Yes. The scene appears safe.'
            : hazardLine(call.hazards),
        ],
        followUps:
          call.hazards.length > 0
            ? [
                { id: 'fu_continue', label: 'Continue', actionId: 'enter_scene' },
                { id: 'fu_pd', label: 'Request Law Enforcement', actionId: 'request_pd' },
                { id: 'fu_retreat', label: 'Retreat', actionId: 'stage_away' },
                {
                  id: 'fu_deescalate',
                  label: 'Attempt Verbal De-escalation',
                  actionId: 'deescalate',
                },
                { id: 'fu_wait', label: 'Wait for Law', actionId: 'stage_away' },
                { id: 'fu_ignore', label: 'Ignore Hazard', actionId: 'enter_scene' },
              ]
            : undefined,
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
        studentLine: "I'd like to evaluate MOI / NOI.",
        laurenLines: [
          call.category === 'trauma'
            ? `Mechanism appears consistent with the dispatch: ${call.dispatch}`
            : `Nature of illness appears medical: ${call.dispatch}`,
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
        studentLine: 'Do I need additional resources?',
        laurenLines: [
          'That is your call. Request what you need through Resources when ready.',
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
    case 'assess_loc':
      return {
        studentLine: "I'd like to assess level of consciousness.",
        laurenLines: [`Mental status: ${vitals.mentalStatus}.`],
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
        studentLine: "I'd like to obtain a blood pressure.",
        laurenLines: [`The patient's blood pressure is ${vitals.bp}.`],
        reveal: ['bp'],
      };
    case 'vital_pulse':
      return {
        studentLine: "I'd like to obtain a pulse.",
        laurenLines: [`The pulse is ${vitals.hr}.`],
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
        studentLine: "I'd like to request ALS.",
        laurenLines: ['ALS has been requested.'],
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
          'Obtain fresh vitals if you have not recently.',
        ],
      };
    case 'notify_hospital':
      return {
        studentLine: "I'd like to give a radio report / notify the hospital.",
        laurenLines: ['Hospital is notified. Continue your report.'],
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
    `${call.unit}, you're responding priority ${call.priority}.`,
    `${call.age}-year-old ${call.sex.toLowerCase()}.`,
    call.dispatch,
    call.cadNotes,
    `Time from station is approximately ${call.distanceMiles} minutes.`,
  ];
}
