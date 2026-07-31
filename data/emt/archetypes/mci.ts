import { HAZARD_LIBRARY } from '@/data/emt/hazards';
import type { ScenarioArchetype } from '@/data/emt/types';

const ABCDE = ['airway', 'breathing', 'circulation', 'disability', 'exposure'] as const;

export const mciStart: ScenarioArchetype = {
  id: 'mci_start',
  name: 'MCI — START Triage',
  category: 'mci',
  dispatchTemplates: [
    'Tornado strike — multiple victims',
    'Bus crash — mass casualty',
    'Explosion at shopping center — many injured',
  ],
  patientSummaries: [
    'Multiple patients across debris field',
    'Walking wounded mixed with critical injuries',
    'More patients than ambulances on scene',
  ],
  ageRange: [25, 55],
  sexOptions: ['Male', 'Female'],
  hazardPool: [
    HAZARD_LIBRARY.structural_damage,
    HAZARD_LIBRARY.multiple_patients,
    HAZARD_LIBRARY.leaking_fluid,
  ],
  hazardPickCount: [2, 3],
  abcde: [
    {
      step: 'airway',
      label: 'Airway (triage lens)',
      clue: 'Some patients not breathing — open airway once; still apneic = black tag.',
      critical: true,
    },
    {
      step: 'breathing',
      label: 'Breathing (triage lens)',
      clue: 'RR > 30 → red. Walking wounded → green.',
      critical: true,
    },
    {
      step: 'circulation',
      label: 'Circulation (triage lens)',
      clue: 'No radial pulse / CRT > 2 sec → red.',
      critical: true,
    },
    {
      step: 'disability',
      label: 'Disability (triage lens)',
      clue: 'Cannot follow commands → red.',
      critical: true,
    },
    {
      step: 'exposure',
      label: 'Exposure / Scene size-up',
      clue: 'Burns, crush, open fractures across multiple patients.',
      critical: true,
    },
  ],
  history: [
    {
      id: 'events',
      framework: 'SAMPLE',
      label: 'Incident overview',
      clue: 'Sudden mass casualty. Exact count unknown. Resources overwhelmed.',
    },
  ],
  vitalsPools: {
    sbp: [90, 110, 130],
    dbp: [60, 70, 80],
    hr: [100, 120, 140],
    rr: [20, 28, 36],
    spo2: [88, 92, 96],
    mentalStatus: ['mixed — multi-patient'],
  },
  safetyActions: [
    'don_ppe',
    'stage_away',
    'establish_command',
    'request_mutual_aid',
    'request_fire',
    'request_als',
    'enter_scene',
  ],
  requiredSafety: ['don_ppe', 'establish_command'],
  requiredAbcdeOrder: [...ABCDE],
  treatmentActions: [
    'start_triage',
    'request_mutual_aid',
    'establish_command',
    'notify_hospital',
    'rapid_transport',
    'treat_green_first',
    'treat_arrest_first_mci',
    'cpr',
    'wait_and_see',
  ],
  recommendedTreatment: [
    'start_triage',
    'request_mutual_aid',
    'establish_command',
    'notify_hospital',
  ],
  harmfulTreatment: ['treat_green_first', 'treat_arrest_first_mci', 'wait_and_see'],
  transportPriorities: ['emergency', 'urgent', 'non_urgent'],
  correctTransportPriority: 'emergency',
  destinations: ['trauma_center', 'closest_ed', 'pediatric_ed'],
  correctDestination: 'trauma_center',
  pearls: [
    'START: Sort — Walking → breathing → circulation → mentation.',
    'Do not commit all resources to one arrest when many salvable patients remain.',
  ],
  universalPrinciples: [
    'Command and mutual aid early',
    'Greatest good for greatest number',
    'Triage before individual deep treatment',
  ],
};
