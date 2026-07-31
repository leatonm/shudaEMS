import type { ConditionDefinition } from '@/data/conditions/types';

export const copdAsthma: ConditionDefinition = {
  id: 'copdAsthma',
  name: 'Asthma / COPD',
  category: 'respiratory',
  dispatchTypes: ['Difficulty Breathing', 'Shortness of Breath', 'Wheezing'],
  findings: [
    'Expiratory Wheezing',
    'Accessory Muscle Use',
    'Prolonged Expiration',
    'Tripoding',
    'Barrel Chest',
    'Productive Cough',
  ],
  history: [
    'Asthma',
    'COPD',
    'Home Oxygen Use',
    'Smoking History',
    'Recent URI',
    'Ran Out of Inhaler',
  ],
  vitals: {
    sbp: [118, 128, 138, 146, 156],
    dbp: [72, 78, 84, 88, 92],
    hr: [102, 108, 118, 124, 142],
    rr: [24, 26, 28, 32, 36],
    spo2: [84, 86, 88, 90, 92, 94],
    temp: [98.0, 98.4, 98.8, 99.0],
    glucose: [96, 102, 118],
  },
  criticalAssessments: ['Vitals', 'Lung Sounds', 'Medical History', 'Peak Flow'],
  treatments: ['Albuterol', 'DuoNeb', 'Steroid', 'Epinephrine IM', 'Oxygen'],
  pearls: [
    'Expiratory wheezing with accessory muscle use responds to bronchodilators',
    'Silent chest means severe bronchospasm — not improvement',
    'Wheezing is not always asthma — consider CHF when rales and edema present',
  ],
};
