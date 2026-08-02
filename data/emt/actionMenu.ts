import type { CallCategory, SkillCategory } from '@/data/emt/types';

/** Top-level gameplay buckets — player only ever sees these five (+ Ask Lauren). */
export type ActionMenuRoot =
  | 'scene'
  | 'assessment'
  | 'interventions'
  | 'resources'
  | 'transport';

export interface ActionMenuNode {
  id: string;
  label: string;
  actionId?: string;
  tip?: string;
  children?: ActionMenuNode[];
  alsOnly?: boolean;
}

export const ACTION_MENU_ROOTS: Array<{
  id: ActionMenuRoot;
  label: string;
  skill: SkillCategory;
  blurb: string;
}> = [
  { id: 'scene', label: 'Scene', skill: 'scene_safety', blurb: 'Size-up, BSI, hazards' },
  { id: 'assessment', label: 'Assessment', skill: 'assessment', blurb: 'Primary, history, vitals' },
  { id: 'interventions', label: 'Treatment', skill: 'treatment', blurb: 'Oxygen, meds, procedures' },
  { id: 'resources', label: 'Resources', skill: 'communication', blurb: 'Fire, law, medic, air' },
  { id: 'transport', label: 'Transport', skill: 'transport', blurb: 'Priority, destination, report' },
];

export const ACTION_MENUS: Record<ActionMenuRoot, ActionMenuNode[]> = {
  scene: [
    { id: 'ppe', label: 'PPE / BSI', actionId: 'don_ppe' },
    { id: 'scene_safe', label: 'Scene Safety', actionId: 'verbalize_scene_safe' },
    { id: 'num_patients', label: 'Number of Patients', actionId: 'count_patients' },
    { id: 'moi_noi', label: 'MOI / NOI', actionId: 'assess_moi' },
    { id: 'hazards', label: 'Hazards', actionId: 'scan_hazards' },
    { id: 'add_resources_hint', label: 'Additional Resources', actionId: 'consider_resources' },
    { id: 'cspine', label: 'C-Spine', actionId: 'c_spine' },
    { id: 'enter', label: 'Continue / Patient Contact', actionId: 'enter_scene' },
  ],
  assessment: [
    { id: 'impression', label: 'General Impression', actionId: 'general_impression' },
    {
      id: 'primary',
      label: 'Primary Assessment',
      children: [
        { id: 'aw', label: 'Airway', actionId: 'airway' },
        { id: 'br', label: 'Breathing', actionId: 'breathing' },
        { id: 'circ', label: 'Circulation', actionId: 'circulation' },
        { id: 'dis', label: 'Disability', actionId: 'disability' },
        { id: 'exp', label: 'Exposure', actionId: 'exposure' },
      ],
    },
    {
      id: 'history',
      label: 'History',
      children: [
        { id: 'hist_opqrst', label: 'OPQRST', actionId: 'opqrst' },
        { id: 'hist_sample', label: 'SAMPLE', actionId: 'sample' },
        { id: 'hist_allergies', label: 'Allergies', actionId: 'allergies' },
        { id: 'hist_meds', label: 'Medications', actionId: 'medications_hx' },
        { id: 'hist_pmh', label: 'Past Medical History', actionId: 'pmh' },
        { id: 'hist_events', label: 'Events Leading Up', actionId: 'events' },
        { id: 'hist_clarify', label: 'Clarifying Questions', actionId: 'last_oral' },
      ],
    },
    {
      id: 'vitals',
      label: 'Vitals',
      children: [
        { id: 'v_bp', label: 'Blood Pressure', actionId: 'vital_bp' },
        { id: 'v_pulse', label: 'Pulse', actionId: 'vital_pulse' },
        { id: 'v_rr', label: 'Respiratory Rate', actionId: 'vital_rr' },
        { id: 'v_spo2', label: 'SpO₂', actionId: 'check_spo2' },
        { id: 'v_temp', label: 'Temperature', actionId: 'vital_temp' },
        { id: 'v_bgl', label: 'Blood Glucose', actionId: 'blood_glucose' },
        { id: 'v_ecg', label: '12-Lead ECG', actionId: 'ecg' },
        { id: 'v_etco2', label: 'ETCO₂', actionId: 'vital_etco2', alsOnly: true },
        { id: 'v_pain', label: 'Pain Scale', actionId: 'pain_scale' },
        { id: 'v_pupils', label: 'Pupils', actionId: 'disability' },
        { id: 'v_cap', label: 'Capillary Refill', actionId: 'cap_refill' },
      ],
    },
    { id: 'focused', label: 'Focused Assessment', actionId: 'secondary_assessment' },
    { id: 'reassess', label: 'Reassessment', actionId: 'reassessment' },
  ],
  interventions: [
    {
      id: 'int_airway',
      label: 'Airway',
      children: [
        { id: 'aw_suction', label: 'Suction', actionId: 'suction' },
        { id: 'aw_opa', label: 'OPA / NPA', actionId: 'airway_adjunct' },
        { id: 'aw_bvm', label: 'BVM', actionId: 'bvm' },
      ],
    },
    {
      id: 'int_breathing',
      label: 'Breathing',
      children: [
        { id: 'br_o2', label: 'Oxygen', actionId: 'oxygen' },
        { id: 'br_neb', label: 'Nebulizer', actionId: 'nebulizer' },
        { id: 'br_lungs', label: 'Lung Sounds', actionId: 'lung_sounds' },
      ],
    },
    {
      id: 'int_cardiac',
      label: 'Cardiac',
      children: [
        { id: 'card_cpr', label: 'CPR', actionId: 'cpr' },
        { id: 'card_aed', label: 'AED', actionId: 'aed' },
      ],
    },
    { id: 'int_trauma', label: 'Trauma', actionId: 'bleeding_control' },
    {
      id: 'int_meds',
      label: 'Medication',
      children: [
        { id: 'med_asa', label: 'Aspirin', actionId: 'aspirin' },
        { id: 'med_ntg', label: 'Nitroglycerin', actionId: 'nitroglycerin' },
        { id: 'med_albuterol', label: 'Albuterol', actionId: 'nebulizer' },
        { id: 'med_dextrose', label: 'Dextrose / Oral Glucose', actionId: 'oral_glucose' },
        { id: 'med_narcan', label: 'Narcan', actionId: 'narcan' },
        { id: 'med_epi', label: 'Epinephrine', actionId: 'epinephrine' },
        { id: 'med_morphine', label: 'Morphine', actionId: 'morphine', alsOnly: true },
      ],
    },
    { id: 'int_iv', label: 'IV / IO', actionId: 'iv', alsOnly: true },
    { id: 'int_splint', label: 'Splinting', actionId: 'splint' },
    { id: 'int_ob', label: 'OB', actionId: 'support_delivery' },
    { id: 'int_peds', label: 'Pediatric', actionId: 'pediatric_care' },
    { id: 'int_position', label: 'Position of Comfort', actionId: 'position_comfort' },
  ],
  resources: [
    { id: 'res_ambo', label: 'Additional Ambulance', actionId: 'request_ambo' },
    { id: 'res_fire', label: 'Fire Department', actionId: 'request_fire' },
    { id: 'res_pd', label: 'Law Enforcement', actionId: 'request_pd' },
    { id: 'res_supervisor', label: 'Supervisor', actionId: 'request_supervisor' },
    { id: 'res_air', label: 'Air Medical', actionId: 'request_air' },
    { id: 'res_medcontrol', label: 'Medical Control', actionId: 'notify_hospital' },
    { id: 'res_hazmat', label: 'Hazmat', actionId: 'request_hazmat' },
    { id: 'res_rescue', label: 'Technical Rescue', actionId: 'request_rescue' },
    { id: 'res_als', label: 'Medic / Paramedic', actionId: 'request_als' },
  ],
  transport: [
    { id: 'tp_stay', label: 'Stay and Play', actionId: 'stay_and_play' },
    { id: 'tp_load', label: 'Load and Go', actionId: 'load_and_go' },
    {
      id: 'tp_dest',
      label: 'Destination Type',
      children: [
        { id: 'dest_pci', label: 'PCI Center', actionId: 'dest_pci_capable' },
        { id: 'dest_stroke', label: 'Stroke Center', actionId: 'dest_stroke_center' },
        { id: 'dest_trauma', label: 'Level I Trauma', actionId: 'dest_trauma_center' },
        { id: 'dest_peds', label: 'Pediatric Hospital', actionId: 'dest_pediatric_ed' },
        { id: 'dest_community', label: 'Community Hospital', actionId: 'dest_closest_ed' },
        { id: 'dest_ld', label: 'Labor & Delivery', actionId: 'dest_labor_delivery' },
      ],
    },
    {
      id: 'tp_mode',
      label: 'Transport Mode',
      children: [
        { id: 'mode_routine', label: 'Routine', actionId: 'priority_non_urgent' },
        { id: 'mode_ls', label: 'Lights and Sirens', actionId: 'priority_emergency' },
      ],
    },
    { id: 'tp_notify', label: 'Hospital Notification', actionId: 'notify_hospital' },
    { id: 'tp_handoff', label: 'Transfer of Care', actionId: 'begin_handoff' },
  ],
};

export function findMenuNode(root: ActionMenuRoot, path: string[]): ActionMenuNode | null {
  let nodes = ACTION_MENUS[root];
  let current: ActionMenuNode | null = null;
  for (const id of path) {
    current = nodes.find((n) => n.id === id) ?? null;
    if (!current) return null;
    nodes = current.children ?? [];
  }
  return current;
}

export function categoryLabel(id: CallCategory): string {
  switch (id) {
    case 'medical':
      return 'Medical';
    case 'trauma':
      return 'Trauma';
    case 'peds':
      return 'Pediatric';
    case 'ob':
      return 'OB';
    case 'mci':
      return 'MCI';
  }
}
