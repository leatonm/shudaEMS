import type { ConditionDefinition } from '@/data/conditions/types';

export const monomorphicVT: ConditionDefinition = {
  id: 'monomorphic_vt',

  name: 'Monomorphic Ventricular Tachycardia',

  category: 'cardiac',

  dispatchTypes: [
    'Chest Pain',
    'Palpitations',
    'Rapid Heart Rate',
    'Shortness of Breath',
    'Dizziness',
    'Near Syncope',
  ],

  findings: [
    'Wide Complex Tachycardia',
    'Regular Rhythm',
    'Palpitations',
    'Hypotension',
    'Chest Pain',
    'Diaphoresis',
    'Poor Perfusion',
    'Altered Mental Status',
  ],

  history: ['Previous MI', 'Coronary Artery Disease', 'Heart Failure', 'Recent Exertion'],

  vitals: {
    hr: [150, 160, 170, 180, 200],
    sbp: [70, 80, 90, 100, 110],
    dbp: [40, 50, 60, 70],
    rr: [18, 22, 26],
    spo2: [88, 92, 94, 96],
  },

  criticalAssessments: [
    'Cardiac Monitor',
    'Rhythm Regularity',
    'Pulse Check',
    'Hemodynamic Stability',
  ],

  treatments: [
    'Synchronized Cardioversion',
    'Amiodarone',
    'Lidocaine',
    'Medical Control Consultation',
  ],

  pearls: [
    'Treat the patient, not just the monitor',
    'Unstable VT requires immediate cardioversion',
    'Wide complex tachycardia should be assumed VT until proven otherwise',
  ],
};
