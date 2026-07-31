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
  // Harmful / out of scope traps
  delay_for_full_history: {
    id: 'delay_for_full_history',
    name: 'Complete Full History First',
    description: 'Stay on scene until entire SAMPLE/OPQRST is finished',
    category: 'treatment',
    principle: 'universal',
    emtScope: true,
  },
  wait_and_see: {
    id: 'wait_and_see',
    name: 'Wait and Reassess Only',
    description: 'No interventions — observe only',
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
