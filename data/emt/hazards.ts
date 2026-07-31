import type { SceneHazard } from '@/data/emt/types';

export const HAZARD_LIBRARY: Record<string, SceneHazard> = {
  traffic: {
    id: 'traffic',
    label: 'Active Traffic',
    description: 'Vehicles still moving through the scene',
    clearWith: ['traffic_control', 'request_pd'],
    severity: 'moderate',
  },
  leaking_fluid: {
    id: 'leaking_fluid',
    label: 'Leaking Fluids',
    description: 'Fuel or unknown fluid under vehicle',
    clearWith: ['request_fire'],
    severity: 'high',
  },
  smoke: {
    id: 'smoke',
    label: 'Smoke / Fire Risk',
    description: 'Vehicle smoking — fire potential',
    clearWith: ['request_fire'],
    severity: 'high',
  },
  unstable_surface: {
    id: 'unstable_surface',
    label: 'Uneven / Unstable Ground',
    description: 'Ice, debris, or slope hazard',
    clearWith: ['don_ppe', 'stage_away'],
    severity: 'low',
  },
  bystanders: {
    id: 'bystanders',
    label: 'Agitated Bystanders',
    description: 'Crowd interfering with access',
    clearWith: ['request_pd'],
    severity: 'moderate',
  },
  unknown_meds: {
    id: 'unknown_meds',
    label: 'Medication Bottles Nearby',
    description: 'Possible overdose clues — BSI still required',
    clearWith: ['don_ppe'],
    severity: 'low',
  },
  structural_damage: {
    id: 'structural_damage',
    label: 'Unstable Structure / Debris',
    description: 'Collapsed area or debris field — do not freestyle entry',
    clearWith: ['request_fire', 'establish_command'],
    severity: 'high',
  },
  multiple_patients: {
    id: 'multiple_patients',
    label: 'Multiple Patients Visible',
    description: 'More patients than you can treat alone',
    clearWith: ['request_mutual_aid', 'establish_command'],
    severity: 'high',
  },
};
