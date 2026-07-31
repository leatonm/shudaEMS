/** EMT Response Simulator — core types (parallel to legacy protocol game). */

export type EmtPhase =
  | 'dispatch'
  | 'scene_safety'
  | 'primary_survey'
  | 'history'
  | 'treatment'
  | 'transport'
  | 'debrief';

export type AbcdeStep = 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure';

export type TransportPriority = 'emergency' | 'urgent' | 'non_urgent';

export type CallCategory = 'medical' | 'trauma' | 'peds' | 'ob' | 'mci';

export type EmtDifficulty = 'coach' | 'standard' | 'exam';

/** Agencies already present when you arrive — drives whether to request fire/ALS/PD. */
export type OnSceneResource = 'fire' | 'als' | 'pd';

export type DestinationType =
  | 'closest_ed'
  | 'stroke_center'
  | 'trauma_center'
  | 'pci_capable'
  | 'pediatric_ed'
  | 'labor_delivery';

export type SkillCategory =
  | 'scene_safety'
  | 'assessment'
  | 'treatment'
  | 'transport'
  | 'communication';

export interface EmtVitals {
  bp: string;
  hr: number;
  rr: number;
  spo2: number;
  glucose?: number;
  mentalStatus: string;
}

export interface SceneHazard {
  id: string;
  label: string;
  description: string;
  /** Required action before safe patient contact */
  clearWith: string[];
  severity: 'low' | 'moderate' | 'high';
}

export interface EmtAction {
  id: string;
  name: string;
  description: string;
  category: SkillCategory | 'assessment' | 'history';
  /** Universal principle vs region-specific protocol */
  principle: 'universal' | 'protocol_dependent';
  emtScope: boolean;
}

export interface AbcdeFinding {
  step: AbcdeStep;
  label: string;
  clue: string;
  critical?: boolean;
}

export interface HistoryPrompt {
  id: string;
  framework: 'SAMPLE' | 'OPQRST';
  label: string;
  clue: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  subtitle?: string;
}

export interface ConsequenceEffect {
  scoreDelta: number;
  message: string;
  vitals?: Partial<EmtVitals>;
  skill?: SkillCategory;
  severity?: 'good' | 'warn' | 'bad';
}

export interface TimelineEntry {
  phase: EmtPhase;
  actionId: string;
  label: string;
  message: string;
  scoreDelta: number;
  severity: 'good' | 'warn' | 'bad' | 'neutral';
  atMs: number;
}

/** NREMT Patient Assessment–style automatic fail criterion. */
export interface CriticalFail {
  id: string;
  /** Which skills sheet language this maps to */
  sheet: 'trauma' | 'medical' | 'both';
  label: string;
  detail: string;
}

export interface EmtDebrief {
  title: string;
  summary: string;
  whatWentWell: string[];
  improveNext: string[];
  pearl: string;
  universalPrinciples: string[];
  protocolNotes?: string[];
  /** Examiner-style critical criteria language */
  criticalFails: CriticalFail[];
  skillsSheetPass: boolean;
}

export interface SkillScores {
  scene_safety: number;
  assessment: number;
  treatment: number;
  transport: number;
  communication: number;
}

/** Building blocks for a generated or authored EMT call. */
export interface ScenarioArchetype {
  id: string;
  name: string;
  category: CallCategory;
  dispatchTemplates: string[];
  patientSummaries: string[];
  ageRange: [number, number];
  sexOptions: Array<'Male' | 'Female'>;
  hazardPool: SceneHazard[];
  /** Default hazards if generator picks randomly from pool */
  hazardPickCount: [number, number];
  abcde: AbcdeFinding[];
  history: HistoryPrompt[];
  vitalsPools: {
    sbp: number[];
    dbp: number[];
    hr: number[];
    rr: number[];
    spo2: number[];
    glucose?: number[];
    mentalStatus: string[];
  };
  /** Scene safety actions available */
  safetyActions: string[];
  /** Required before leaving scene_safety (at least these or equivalents) */
  requiredSafety: string[];
  /** Primary survey order expected */
  requiredAbcdeOrder: AbcdeStep[];
  treatmentActions: string[];
  recommendedTreatment: string[];
  harmfulTreatment: string[];
  transportPriorities: TransportPriority[];
  correctTransportPriority: TransportPriority;
  destinations: DestinationType[];
  correctDestination: DestinationType;
  pearls: string[];
  universalPrinciples: string[];
  protocolNotes?: string[];
}

export interface EmtCall {
  id: string;
  archetypeId: string;
  archetypeName: string;
  category: CallCategory;
  unit: string;
  priority: 1 | 2 | 3;
  dispatch: string;
  patientSummary: string;
  age: number;
  sex: 'Male' | 'Female';
  hazards: SceneHazard[];
  /** Who is already on scene when you arrive (size-up finding). */
  resourcesOnScene: OnSceneResource[];
  abcde: AbcdeFinding[];
  history: HistoryPrompt[];
  vitals: EmtVitals;
  safetyActions: DecisionOption[];
  requiredSafety: string[];
  requiredAbcdeOrder: AbcdeStep[];
  treatmentActions: DecisionOption[];
  recommendedTreatment: string[];
  harmfulTreatment: string[];
  transportPriorityOptions: DecisionOption[];
  correctTransportPriority: TransportPriority;
  destinationOptions: DecisionOption[];
  correctDestination: DestinationType;
  pearls: string[];
  universalPrinciples: string[];
  protocolNotes: string[];
}

export interface EmtRunResult {
  callId: string;
  stars: number;
  totalScore: number;
  skillScores: SkillScores;
  patientOutcome: 'improved' | 'stable' | 'deteriorated' | 'critical';
  timeline: TimelineEntry[];
  debrief: EmtDebrief;
  finalVitals: EmtVitals;
  criticalFails: CriticalFail[];
  skillsSheetPass: boolean;
}
