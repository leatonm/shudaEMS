import type { DecisionOption, DestinationType, EmtAction, TransportPriority } from '@/data/emt/types';

/** EMT-scope action catalog — universal principles unless marked protocol_dependent. */
export const EMT_ACTIONS: Record<string, EmtAction> = {
  // Scene safety
  stage_away: {
    id: 'stage_away',
    name: 'Stage Away / Wait for Secure',
    description: 'Hold at a safe distance until hazards are controlled',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  request_fire: {
    id: 'request_fire',
    name: 'Request Fire / Rescue',
    description: 'Call for fire suppression, extrication, or hazmat support',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  request_pd: {
    id: 'request_pd',
    name: 'Request Law Enforcement',
    description: 'Request PD for traffic or scene security',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  request_als: {
    id: 'request_als',
    name: 'Request ALS Intercept',
    description: 'Request paramedic intercept for advanced care',
    category: 'communication',
    principle: 'universal',
    emtScope: true,
  },
  don_ppe: {
    id: 'don_ppe',
    name: 'Don PPE',
    description: 'Gloves, eye protection, and appropriate BSI',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  traffic_control: {
    id: 'traffic_control',
    name: 'Establish Traffic Control',
    description: 'Position apparatus and cones; request traffic control',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  enter_scene: {
    id: 'enter_scene',
    name: 'Enter Scene Now',
    description: 'Move to patient contact immediately',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },

  // ABCDE assessments are phase actions, not catalog items

  // Treatment — EMT scope
  oxygen: {
    id: 'oxygen',
    name: 'Supplemental Oxygen',
    description: 'Titrate O₂ to maintain adequate SpO₂',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  aspirin: {
    id: 'aspirin',
    name: 'Aspirin',
    description: 'Chewable aspirin for suspected ACS (if no contraindication)',
    category: 'treatment',
    principle: 'protocol_dependent',
    emtScope: true,
  },
  nitroglycerin: {
    id: 'nitroglycerin',
    name: 'Assist with Nitroglycerin',
    description: 'Assist with prescribed NTG if protocol/medical direction allows',
    category: 'treatment',
    principle: 'protocol_dependent',
    emtScope: true,
  },
  position_comfort: {
    id: 'position_comfort',
    name: 'Position of Comfort',
    description: 'Sit upright or position for ease of breathing',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  bleeding_control: {
    id: 'bleeding_control',
    name: 'Bleeding Control',
    description: 'Direct pressure, packing, or tourniquet as indicated',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  c_spine: {
    id: 'c_spine',
    name: 'Manual C-Spine Stabilization',
    description: 'Maintain in-line cervical stabilization',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  airway_adjunct: {
    id: 'airway_adjunct',
    name: 'Airway Adjunct',
    description: 'OPA/NPA as indicated for airway patency',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  blood_glucose: {
    id: 'blood_glucose',
    name: 'Blood Glucose Check',
    description: 'Point-of-care glucose — rule out mimic',
    category: 'assessment',
    principle: 'universal',
    emtScope: true,
  },
  stroke_scale: {
    id: 'stroke_scale',
    name: 'Stroke Assessment Scale',
    description: 'Cincinnati or local stroke scale',
    category: 'assessment',
    principle: 'universal',
    emtScope: true,
  },
  notify_hospital: {
    id: 'notify_hospital',
    name: 'Notify Receiving Facility',
    description: 'Early notification with findings and ETA',
    category: 'communication',
    principle: 'universal',
    emtScope: true,
  },
  rapid_transport: {
    id: 'rapid_transport',
    name: 'Rapid Packaging / Transport',
    description: 'Minimize scene time for time-critical patient',
    category: 'transport',
    principle: 'universal',
    emtScope: true,
  },
  rapid_assessment: {
    id: 'rapid_assessment',
    name: 'Rapid Assessment',
    description:
      'One-pass primary for critical or unresponsive patients — impression, AVPU, ABCs, life threats',
    category: 'assessment',
    principle: 'universal',
    emtScope: true,
  },
  focused_assessment: {
    id: 'focused_assessment',
    name: 'Focused Assessment',
    description:
      'Complaint-focused exam for more stable, responsive patients',
    category: 'assessment',
    principle: 'universal',
    emtScope: true,
  },
  stay_and_play: {
    id: 'stay_and_play',
    name: 'Stay and Play',
    description: 'Complete care on scene and end the call without transport',
    category: 'transport',
    principle: 'universal',
    emtScope: true,
  },
  confirm_stay_and_play: {
    id: 'confirm_stay_and_play',
    name: 'End On Scene',
    description: 'Confirm stay-and-play disposition and close the call for grading',
    category: 'transport',
    principle: 'universal',
    emtScope: true,
  },
  load_and_go: {
    id: 'load_and_go',
    name: 'Load and Go',
    description: 'Package and leave — continue care and reassessment en route',
    category: 'transport',
    principle: 'universal',
    emtScope: true,
  },
  cpr: {
    id: 'cpr',
    name: 'Start CPR',
    description: 'High-quality chest compressions',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  aed: {
    id: 'aed',
    name: 'Apply AED',
    description: 'Attach AED and follow prompts',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  abdominal_thrusts: {
    id: 'abdominal_thrusts',
    name: 'Abdominal Thrusts',
    description: 'Heimlich for complete FBAO (responsive patient)',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  back_blows_chest_thrusts: {
    id: 'back_blows_chest_thrusts',
    name: 'Back Blows / Chest Thrusts',
    description: 'Infant foreign-body airway obstruction sequence',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  control_bleeding: {
    id: 'control_bleeding',
    name: 'Control Life-Threatening Bleeding',
    description: 'Direct pressure, packing, or tourniquet',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  establish_command: {
    id: 'establish_command',
    name: 'Establish Command',
    description: 'Take or announce incident command',
    category: 'scene_safety',
    principle: 'universal',
    emtScope: true,
  },
  request_mutual_aid: {
    id: 'request_mutual_aid',
    name: 'Request Mutual Aid',
    description: 'Call additional EMS/fire resources',
    category: 'communication',
    principle: 'universal',
    emtScope: true,
  },
  start_triage: {
    id: 'start_triage',
    name: 'Begin START Triage',
    description: 'Sort patients: walking / breathing / circulation / mentation',
    category: 'assessment',
    principle: 'universal',
    emtScope: true,
  },
  treat_green_first: {
    id: 'treat_green_first',
    name: 'Treat Walking Wounded First',
    description: 'Focus on minor injuries before critical patients',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  treat_arrest_first_mci: {
    id: 'treat_arrest_first_mci',
    name: 'Commit Crew to Cardiac Arrest First',
    description: 'Tie up resources on unlikely salvage in MCI',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  support_delivery: {
    id: 'support_delivery',
    name: 'Support Delivery / Newborn Care',
    description: 'Assist delivery, dry/stimulate newborn, keep warm',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  left_lateral: {
    id: 'left_lateral',
    name: 'Left Lateral Position',
    description: 'Position pregnant patient to improve venous return',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  // Harmful / out of scope traps
  delay_for_full_history: {
    id: 'delay_for_full_history',
    name: 'Delay Care for a Complete History',
    description: 'Withhold immediate care until the entire SAMPLE/OPQRST is finished',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  wait_and_see: {
    id: 'wait_and_see',
    name: 'Withhold Treatment and Observe',
    description: 'Wait longer without an intervention and see whether the patient improves',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
};

export const TRANSPORT_PRIORITY_OPTIONS: DecisionOption[] = [
  { id: 'emergency', label: 'Emergency (lights & sirens)', subtitle: 'Unstable / time-critical' },
  { id: 'urgent', label: 'Urgent', subtitle: 'Stable but priority destination' },
  { id: 'non_urgent', label: 'Non-urgent', subtitle: 'Stable, routine transport' },
];

export const DESTINATION_LABELS: Record<DestinationType, string> = {
  closest_ed: 'Closest Emergency Department',
  stroke_center: 'Stroke-Capable Center',
  trauma_center: 'Trauma Center',
  pci_capable: 'PCI-Capable / Cardiac Center',
  pediatric_ed: 'Pediatric Emergency Department',
  labor_delivery: 'Labor & Delivery / OB-Capable Facility',
};

export function actionToOption(actionId: string): DecisionOption {
  const action = EMT_ACTIONS[actionId];
  return {
    id: actionId,
    label: action?.name ?? actionId,
    subtitle: action?.description,
  };
}

export function destinationOptions(ids: DestinationType[]): DecisionOption[] {
  return ids.map((id) => ({
    id,
    label: DESTINATION_LABELS[id],
  }));
}

export function isTransportPriority(id: string): id is TransportPriority {
  return id === 'emergency' || id === 'urgent' || id === 'non_urgent';
}

export function isDestination(id: string): id is DestinationType {
  return id in DESTINATION_LABELS;
}
