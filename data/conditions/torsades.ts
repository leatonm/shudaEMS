import type { ConditionDefinition } from '@/data/conditions/types';

export const torsades: ConditionDefinition = {
  id: 'torsades',

  name: 'Torsades de Pointes',

  category: 'cardiac',

  dispatchTypes: [
    'Syncope',
    'Palpitations',
    'Cardiac Rhythm Disturbance',
    'Near Arrest',
    'Unresponsive',
  ],

  findings: [
    'Polymorphic Wide Complex Tachycardia',
    'Changing QRS Morphology',
    'Hypotension',
    'Altered Mental Status',
    'Poor Perfusion',
    'Syncope',
    'Dizziness',
  ],

  history: [
    'Long QT Syndrome',
    'Antiarrhythmic Medication',
    'Electrolyte Imbalance',
    'Previous Syncope',
  ],

  vitals: {
    hr: [160, 180, 200, 220],
    sbp: [60, 70, 80, 90],
    dbp: [35, 45, 55],
    rr: [20, 26, 32],
    spo2: [82, 88, 92],
  },

  criticalAssessments: ['Pulse Check', 'Cardiac Monitor', 'QT Interval', 'Rhythm Morphology'],

  treatments: [
    'Magnesium Sulfate',
    'Defibrillation',
    'Amiodarone (Refractory Cases)',
    'Medical Control Consultation',
  ],

  pearls: [
    'Magnesium is the first-line medication',
    'Polymorphic VT changes appearance beat-to-beat',
    'Torsades is often associated with prolonged QT',
  ],
};
