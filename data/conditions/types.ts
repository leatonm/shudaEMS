import type { CaseDebrief, ProtocolInsight, Scenario } from '@/types/models';

export type ConditionCategory = 'cardiac' | 'respiratory' | 'neurologic' | 'medical';

export type CoreConditionId =
  | 'sepsis'
  | 'chf'
  | 'copdAsthma'
  | 'seizure'
  | 'stemi'
  | 'stroke'
  | 'anaphylaxis'
  | 'monomorphic_vt'
  | 'torsades';

export type CallDifficulty = 'easy' | 'medium' | 'hard';

/** Building blocks — every protocol is data, not a hand-written scenario. */
export interface ConditionDefinition {
  id: CoreConditionId;
  name: string;
  category: ConditionCategory;
  dispatchTypes: string[];
  findings: string[];
  history: string[];
  vitals: {
    sbp?: number[];
    dbp?: number[];
    hr?: number[];
    rr?: number[];
    spo2?: number[];
    temp?: number[];
    glucose?: number[];
  };
  criticalAssessments: string[];
  treatments: string[];
  pearls: string[];
}

/** Lightweight patient blob from building blocks. */
export interface GeneratedPatient {
  id: string;
  conditionId: CoreConditionId;
  difficulty: CallDifficulty;
  dispatch: string;
  age: number;
  sex: 'Male' | 'Female';
  history: string[];
  findings: string[];
  vitals: {
    bp: string;
    hr: number;
    rr: number;
    spo2: number;
    temp: number;
    glucose: number;
  };
  criticalAssessments: string[];
  pearl: string;
}

export interface ScenarioGameplay {
  protocolId: string;
  correctProtocol: string;
  correctActions: string[];
  harmfulActions?: string[];
  protocolChoices: string[];
  treatmentActions: string[];
  treatmentEffects: Scenario['treatmentEffects'];
  deterioration: Partial<import('@/types/models').Vitals> & { message: string };
  endings: Scenario['endings'];
  debrief: Omit<CaseDebrief, 'keyIndicators'>;
  insight: ProtocolInsight;
  debriefIndicators?: string[];
}

export interface CallCategory {
  dispatchType: string;
  conditions: { id: CoreConditionId; weight: number }[];
}

export interface GeneratePatientOptions {
  difficulty?: CallDifficulty;
  seed?: number;
  dispatchType?: string;
}

export interface GeneratedCall {
  scenario: Scenario;
  dispatchType: string;
  hiddenConditionId: CoreConditionId;
  difficulty: CallDifficulty;
  patient: GeneratedPatient;
}

export interface GenerateCallOptions {
  dispatchType?: string;
  difficulty?: CallDifficulty;
  seed?: number;
  excludeConditionIds?: CoreConditionId[];
}
