import type { ConditionDefinition } from '@/data/conditions/types';

export const chf: ConditionDefinition = {
  id: 'chf',
  name: 'CHF / Pulmonary Edema',
  category: 'cardiac',
  dispatchTypes: ['Difficulty Breathing', 'Chest Pain', 'Shortness of Breath'],
  findings: [
    'Bilateral Rales',
    'Orthopnea',
    'JVD',
    'Peripheral Edema',
    'Hypertension',
    'Pink Frothy Sputum',
    'Tripoding',
  ],
  history: [
    'Known CHF',
    'Missed Diuretics',
    'Orthopnea',
    'Prior Pulmonary Edema',
    'Hypertension',
  ],
  vitals: {
    sbp: [160, 172, 180, 188, 196, 200],
    dbp: [88, 92, 96, 100, 104],
    hr: [108, 112, 118, 122, 128],
    rr: [26, 28, 30, 32, 34],
    spo2: [82, 84, 86, 88, 91],
    temp: [97.8, 98.2, 98.6, 98.8],
    glucose: [96, 104, 118, 132],
  },
  criticalAssessments: ['Vitals', 'Lung Sounds', 'Medical History', 'ECG'],
  treatments: ['CPAP', 'Nitroglycerin Paste', 'Nitroglycerin SL', 'Oxygen', 'Cardiac Monitor'],
  pearls: [
    'Bilateral rales with hypertension suggest pulmonary edema — not asthma',
    'With CPAP on, use nitroglycerin paste — not SL under the mask',
    'Fluid bolus worsens cardiogenic pulmonary edema',
  ],
};
