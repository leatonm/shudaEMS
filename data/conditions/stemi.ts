import type { ConditionDefinition } from '@/data/conditions/types';

export const stemi: ConditionDefinition = {
  id: 'stemi',
  name: 'STEMI',
  category: 'cardiac',
  dispatchTypes: ['Chest Pain', 'General Weakness', 'Not Feeling Well'],
  findings: [
    'Crushing Chest Pain',
    'Diaphoresis',
    'Radiation to Left Arm',
    'Jaw Pain',
    'Nausea',
    'ST Elevation',
    'Hypotension',
  ],
  history: [
    'Hypertension',
    'Hyperlipidemia',
    'Diabetes',
    'Smoking History',
    'Prior MI',
    'Family History of CAD',
  ],
  vitals: {
    sbp: [128, 138, 148, 158, 168],
    dbp: [78, 82, 88, 92, 96],
    hr: [88, 92, 98, 104, 112],
    rr: [18, 20, 22, 24],
    spo2: [92, 94, 96, 98],
    temp: [97.8, 98.0, 98.4, 98.6],
    glucose: [96, 112, 142, 188],
  },
  criticalAssessments: ['12-Lead ECG', 'Vitals', 'Medical History', 'Blood Glucose'],
  treatments: ['Aspirin', 'Nitroglycerin SL', 'STEMI Alert', 'Cardiac Monitor', 'IV Access'],
  pearls: [
    'Classic crushing pain with ST elevation requires aspirin, nitro if BP allows, and STEMI alert',
    'Women and diabetics may present with nausea, weakness, and jaw pain',
    'Always obtain a 12-lead — history alone is not enough',
  ],
};
