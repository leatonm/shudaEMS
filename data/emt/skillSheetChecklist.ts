/** Official-looking NREMT Patient Assessment checklist items for debrief reveal. */

export interface SkillSheetItem {
  id: string;
  label: string;
  /** Action IDs that mark this item complete. */
  actionIds: string[];
}

export const NREMT_SKILL_SHEET: SkillSheetItem[] = [
  { id: 'ppe', label: 'PPE / BSI', actionIds: ['don_ppe'] },
  { id: 'scene', label: 'Scene Safety', actionIds: ['verbalize_scene_safe', 'scan_hazards'] },
  { id: 'patients', label: 'Number of Patients', actionIds: ['count_patients'] },
  {
    id: 'resources',
    label: 'Additional Resources',
    actionIds: [
      'consider_resources',
      'request_als',
      'request_fire',
      'request_pd',
      'request_air',
      'request_ambo',
    ],
  },
  { id: 'moi', label: 'MOI / NOI', actionIds: ['assess_moi'] },
  { id: 'impression', label: 'General Impression', actionIds: ['general_impression'] },
  { id: 'avpu', label: 'Responsiveness / AVPU', actionIds: ['assess_loc', 'disability'] },
  { id: 'chief', label: 'Chief Complaint / Life Threats', actionIds: ['chief_complaint'] },
  { id: 'airway', label: 'Airway', actionIds: ['airway'] },
  { id: 'breathing', label: 'Breathing', actionIds: ['breathing'] },
  { id: 'circulation', label: 'Circulation', actionIds: ['circulation'] },
  { id: 'history', label: 'History', actionIds: ['sample', 'opqrst', 'allergies', 'medications_hx', 'pmh', 'events'] },
  { id: 'opqrst', label: 'OPQRST', actionIds: ['opqrst'] },
  { id: 'sample', label: 'SAMPLE', actionIds: ['sample'] },
  {
    id: 'vitals',
    label: 'Vital Signs',
    actionIds: ['vital_bp', 'vital_pulse', 'vital_rr', 'check_spo2', 'blood_glucose'],
  },
  {
    id: 'treatment',
    label: 'Appropriate Treatment',
    actionIds: [
      'oxygen',
      'aspirin',
      'nitroglycerin',
      'narcan',
      'epinephrine',
      'bleeding_control',
      'cpr',
      'aed',
      'position_comfort',
    ],
  },
  { id: 'reassess', label: 'Reassessment', actionIds: ['reassessment'] },
  {
    id: 'transport',
    label: 'Transport Decision',
    actionIds: [
      'load_and_go',
      'stay_and_play',
      'priority_emergency',
      'priority_non_urgent',
      'dest_pci_capable',
      'dest_stroke_center',
      'dest_trauma_center',
      'dest_closest_ed',
      'dest_pediatric_ed',
      'dest_labor_delivery',
    ],
  },
  { id: 'report', label: 'Verbal Report', actionIds: ['verbal_handoff', 'begin_handoff', 'notify_hospital'] },
];

export function evaluateSkillSheet(
  completedActions: string[]
): Array<SkillSheetItem & { done: boolean }> {
  const set = new Set(completedActions);
  return NREMT_SKILL_SHEET.map((item) => ({
    ...item,
    done: item.actionIds.some((id) => set.has(id)),
  }));
}

/** Map raw point score + sheet pass into an overall % for the debrief hero. */
export function scoreToPercent(totalScore: number, skillsSheetPass: boolean): number {
  const raw = Math.round(((totalScore + 20) / 140) * 100);
  const clamped = Math.max(0, Math.min(100, raw));
  if (!skillsSheetPass) return Math.min(clamped, 69);
  return clamped;
}
