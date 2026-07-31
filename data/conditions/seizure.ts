import type { ConditionDefinition } from '@/data/conditions/types';

export const seizure: ConditionDefinition = {
  id: 'seizure',
  name: 'Seizure / Withdrawal',
  category: 'neurologic',
  dispatchTypes: ['Seizure', 'Altered Mental Status'],
  findings: [
    'Generalized Tonic-Clonic Activity',
    'Postictal State',
    'Incontinence',
    'Tongue Biting',
    'Tremor',
    'Confusion',
  ],
  history: [
    'Known Epilepsy',
    'Medication Non-compliance',
    'No Prior Seizure Disorder',
    'Head Injury',
    'Heavy EtOH Use — Last Drink ~48h Ago',
  ],
  vitals: {
    sbp: [118, 128, 138, 148, 158],
    dbp: [70, 76, 82, 88, 92],
    hr: [88, 96, 108, 118, 132, 148],
    rr: [14, 16, 18, 22, 24, 28],
    spo2: [88, 91, 93, 94, 97],
    temp: [98.0, 98.8, 99.2, 100.4],
    glucose: [88, 96, 112, 118, 132],
  },
  criticalAssessments: ['Blood Glucose', 'Vitals', 'Medical History', 'ECG'],
  treatments: ['Midazolam', 'Blood Glucose Check', 'Cardiac Monitor', 'Oxygen', 'IV Access'],
  pearls: [
    'Always check glucose — hypoglycemia can mimic or trigger seizures',
    'Prolonged seizure activity requires benzodiazepines',
    'Seizure in pregnancy is eclampsia until proven otherwise',
  ],
};
