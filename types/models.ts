export interface AdultSIRS {
  temperatureHigh: number;
  temperatureLow: number;
  heartRate: number;
  respRate: number;
  etco2: number;
}

export interface QSOFA {
  sbp: number;
  respRate: number;
  mentalStatusChange: boolean;
}

export interface FluidProtocol {
  adultBolus: number;
  maxLiters: number;
  targetSBP: number;
  targetMAP: number;
}

export interface Protocol {
  id: string;
  name: string;
  protocolCode: string;
  keyIndicators: string[];
  recognition: {
    adultSIRS: AdultSIRS;
    qSOFA: QSOFA;
  };
  interventions: string[];
  fluidProtocol: FluidProtocol;
  neutralActions?: string[];
}

export interface DispatchCard {
  unit: string;
  priority: 1 | 2 | 3;
  chiefComplaint: string;
  patientSummary: string;
  eta: string;
}

export interface AssessmentOption {
  id: string;
  label: string;
  clue: string;
}

export interface CaseDebrief {
  primaryCondition: string;
  protocolUsed: string;
  keyIndicators: string[];
  correctTreatment: string[];
}

export type TreatmentReviewStatus =
  | 'done'
  | 'missed'
  | 'harmful'
  | 'unnecessary';

export interface TreatmentReviewItem {
  label: string;
  status: TreatmentReviewStatus;
}

export interface CaseReviewSnapshot {
  protocolName: string;
  protocolCode: string;
  whyThisPatient: string[];
  protocolCriteria: string[];
  protocolInterventions: string[];
  diagnosisReview: {
    youChose: string;
    correctAnswer: string;
    wasCorrect: boolean;
  };
  treatmentReview: TreatmentReviewItem[];
}

export interface Vitals {
  bp: string;
  hr: number;
  rr: number;
  temp: number;
  mentalStatus: string;
  spo2?: number;
}

export interface TreatmentEffectStep {
  bp?: string;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  mentalStatus?: string;
  message: string;
}

export interface TreatmentEffect {
  message: string;
  bp?: string;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  mentalStatus?: string;
}

export interface ScenarioEnding {
  title: string;
  message: string;
}

export interface ProtocolInsight {
  title: string;
  body: string;
}

export interface Scenario {
  id: string;
  protocolId: string;
  dispatchCard: DispatchCard;
  dispatchNotes: string;
  scene: {
    appearance: string[];
  };
  assessmentOptions: AssessmentOption[];
  assessment: Vitals;
  correctProtocol: string;
  correctActions: string[];
  harmfulActions?: string[];
  protocolChoices: string[];
  treatmentActions: string[];
  treatmentEffects: Record<string, TreatmentEffect | TreatmentEffectStep[]>;
  deterioration: Vitals & { message: string };
  endings: {
    perfect_save: ScenarioEnding;
    partial_success: ScenarioEnding;
    delayed_treatment: ScenarioEnding;
    wrong_protocol: ScenarioEnding;
  };
  debrief: CaseDebrief;
  protocolInsight: ProtocolInsight;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  type: 'intervention' | 'assessment' | 'monitoring';
  protocolIds: string[];
}

export type GamePhase =
  | 'dispatch'
  | 'scene'
  | 'assessment'
  | 'diagnosis'
  | 'treatment'
  | 'outcome'
  | 'debrief';

export type EndingType =
  | 'perfect_save'
  | 'partial_success'
  | 'delayed_treatment'
  | 'wrong_protocol';

export interface PatientState extends Vitals {}

export interface TreatmentLogEntry {
  actionId: string;
  message: string;
  timestamp: number;
}

export interface ScenarioResult {
  scenarioId: string;
  ending: EndingType;
  endingTitle: string;
  outcomeMessage: string;
  xpEarned: number;
  stars: number;
  patientState: PatientState;
  treatmentLog: TreatmentLogEntry[];
  protocolCorrect: boolean;
  treatmentCorrect: boolean;
  debrief: CaseDebrief;
  unlockedInsight: ProtocolInsight;
  caseReview: CaseReviewSnapshot;
}

export interface ProtocolMastery {
  protocolId: string;
  solved: number;
  total: number;
}

export interface NumericRange {
  min: number;
  max: number;
}

export interface VitalsRange {
  bpSystolic: NumericRange;
  bpDiastolic: NumericRange;
  hr: NumericRange;
  rr: NumericRange;
  temp: NumericRange;
  spo2: NumericRange;
  mentalStatus: string[];
}

export interface DispatchVariant {
  chiefComplaint: string;
  notes: string;
}

export interface HistoryVariant {
  history: string[];
  clue: string;
}

export interface TemplateVitalsRange {
  bpSystolic: [number, number];
  bpDiastolic: [number, number];
  hr: [number, number];
  rr: [number, number];
  temp: [number, number];
  spo2: [number, number];
  mentalStatus: string[];
}

export interface PresentationProfile {
  id: string;
  weight: number;
  ages?: number[];
  sexes?: ('Male' | 'Female')[];
  glucoseRange?: [number, number];
  dispatchPool: DispatchVariant[];
  historyPool: HistoryVariant[];
  scenePool: string[][];
  lungSoundsClue: string;
  ecgClue: string;
  bloodSugarClue: string;
  vitals: TemplateVitalsRange;
  debriefIndicators: string[];
  insight: ProtocolInsight;
  requiresCpap?: boolean;
  correctProtocol?: string;
  correctActions?: string[];
  harmfulActions?: string[];
  debriefPrimaryCondition?: string;
  debriefCorrectTreatment?: string[];
  useTwelveLead?: boolean;
  twelveLeadClue?: string;
}

export interface ConditionTemplate {
  conditionId: string;
  protocolId: string;
  units: string[];
  ages: number[];
  sexes: ('Male' | 'Female')[];
  priorities: (1 | 2 | 3)[];
  etas: string[];
  profiles: PresentationProfile[];
  scenarioSkeleton: Omit<
    Scenario,
    | 'id'
    | 'protocolId'
    | 'dispatchCard'
    | 'dispatchNotes'
    | 'scene'
    | 'assessmentOptions'
    | 'assessment'
    | 'debrief'
    | 'protocolInsight'
  > & {
    debrief: Omit<CaseDebrief, 'keyIndicators'>;
  };
}

export interface GeneratedPatient {
  id: string;
  conditionId: string;
  profileId: string;
  dispatch: string;
  age: number;
  sex: 'Male' | 'Female';
  history: string[];
  temp: number;
  bp: string;
  hr: number;
  rr: number;
  spo2: number;
  mentalStatus: string;
  dispatchNotes: string;
  patientSummary: string;
  unit: string;
  priority: 1 | 2 | 3;
  eta: string;
  sceneAppearance: string[];
  historyClue: string;
  lungSoundsClue: string;
  ecgClue: string;
  bloodSugarClue: string;
  glucose: number;
}

export interface GeneratePatientOptions {
  seed?: number;
  profileId?: string;
  excludeProfileIds?: string[];
}
