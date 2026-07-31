import { create } from 'zustand';

import { loadGameData, pickNextShiftCall } from '@/lib/dataLoader';
import { generateCall } from '@/data/generators/callGenerator';
import {
  applyTreatmentAction,
  createInitialPatientState,
  evaluateProtocolChoice,
  resolveScenario,
} from '@/lib/scenarioEngine';
import type {
  Action,
  GamePhase,
  PatientState,
  Protocol,
  ProtocolInsight,
  ProtocolMastery,
  Scenario,
  ScenarioResult,
  TreatmentLogEntry,
} from '@/types/models';
import { CORE_CONDITION_IDS } from '@/data/conditions/conditionRegistry';

interface GameStore {
  protocols: Record<string, Protocol>;
  scenarios: Scenario[];
  actions: Record<string, Action>;
  coreConditionIds: typeof CORE_CONDITION_IDS;
  generatedScenarios: Record<string, Scenario>;

  currentScenario: Scenario | null;
  phase: GamePhase;
  patientState: PatientState | null;
  selectedProtocolId: string | null;
  protocolCorrect: boolean | null;
  performedAssessments: string[];
  revealedClues: string[];
  appliedActions: string[];
  treatmentLog: TreatmentLogEntry[];
  result: ScenarioResult | null;
  totalXp: number;
  unlockedInsights: ProtocolInsight[];
  completedScenarioIds: string[];
  protocolCorrectIds: string[];
  protocolSessionStats: Record<string, { completed: number; correct: number }>;

  initialize: () => void;
  startShift: () => string | null;
  startScenario: (scenarioId: string) => void;
  respondToCall: () => void;
  beginAssessment: () => void;
  performAssessment: (assessmentId: string) => void;
  proceedToDiagnosis: () => void;
  selectProtocol: (protocolId: string) => void;
  applyTreatment: (actionId: string) => void;
  completeTreatment: () => void;
  finishScenario: () => void;
  resetSession: () => void;
  getProtocolMastery: () => ProtocolMastery[];
}

const initialPhase: GamePhase = 'dispatch';

function buildProtocolMastery(
  scenarios: Scenario[],
  protocolCorrectIds: string[],
  protocolSessionStats: Record<string, { completed: number; correct: number }>
): ProtocolMastery[] {
  const byProtocol = new Map<string, { solved: number; total: number }>();

  for (const scenario of scenarios) {
    const entry = byProtocol.get(scenario.protocolId) ?? {
      solved: 0,
      total: 0,
    };
    entry.total += 1;
    if (protocolCorrectIds.includes(scenario.id)) {
      entry.solved += 1;
    }
    byProtocol.set(scenario.protocolId, entry);
  }

  for (const protocolId of CORE_CONDITION_IDS) {
    const entry = byProtocol.get(protocolId) ?? { solved: 0, total: 0 };
    const session = protocolSessionStats[protocolId];
    if (session) {
      entry.solved += session.correct;
      entry.total += session.completed;
    } else if (entry.total === 0) {
      entry.total = 1;
    }
    byProtocol.set(protocolId, entry);
  }

  return Array.from(byProtocol.entries()).map(([protocolId, stats]) => ({
    protocolId,
    ...stats,
  }));
}

function resetScenarioState(scenario: Scenario) {
  return {
    currentScenario: scenario,
    phase: 'dispatch' as GamePhase,
    patientState: createInitialPatientState(scenario),
    selectedProtocolId: null,
    protocolCorrect: null,
    performedAssessments: [],
    revealedClues: [],
    appliedActions: [],
    treatmentLog: [],
    result: null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  protocols: {},
  scenarios: [],
  actions: {},
  coreConditionIds: CORE_CONDITION_IDS,
  generatedScenarios: {},

  currentScenario: null,
  phase: initialPhase,
  patientState: null,
  selectedProtocolId: null,
  protocolCorrect: null,
  performedAssessments: [],
  revealedClues: [],
  appliedActions: [],
  treatmentLog: [],
  result: null,
  totalXp: 0,
  unlockedInsights: [],
  completedScenarioIds: [],
  protocolCorrectIds: [],
  protocolSessionStats: {},

  initialize: () => {
    const data = loadGameData();
    set({
      protocols: data.protocols,
      scenarios: data.scenarios,
      actions: data.actions,
      coreConditionIds: data.coreConditionIds,
    });
  },

  startShift: () => {
    const { scenarios, completedScenarioIds } = get();
    const scenario =
      scenarios.length > 0
        ? pickNextShiftCall(scenarios, completedScenarioIds)
        : generateCall().scenario;
    const isGenerated = scenario.id.startsWith('gen_');
    const generatedScenarios = isGenerated
      ? { ...get().generatedScenarios, [scenario.id]: scenario }
      : get().generatedScenarios;

    set({
      ...resetScenarioState(scenario),
      generatedScenarios,
    });
    return scenario.id;
  },

  startScenario: (scenarioId) => {
    if (get().currentScenario?.id === scenarioId) return;

    const scenario =
      get().scenarios.find((s) => s.id === scenarioId) ??
      get().generatedScenarios[scenarioId];
    if (!scenario) return;

    set(resetScenarioState(scenario));
  },

  respondToCall: () => {
    set({ phase: 'scene' });
  },

  beginAssessment: () => {
    set({ phase: 'assessment' });
  },

  performAssessment: (assessmentId) => {
    const { currentScenario, performedAssessments, revealedClues } = get();
    if (!currentScenario || performedAssessments.includes(assessmentId)) return;

    const option = currentScenario.assessmentOptions.find(
      (item) => item.id === assessmentId
    );
    if (!option) return;

    set({
      performedAssessments: [...performedAssessments, assessmentId],
      revealedClues: [...revealedClues, option.clue],
    });
  },

  proceedToDiagnosis: () => {
    if (!get().performedAssessments.includes('vitals')) return;
    set({ phase: 'diagnosis' });
  },

  selectProtocol: (protocolId) => {
    const { currentScenario } = get();
    if (!currentScenario) return;

    set({
      selectedProtocolId: protocolId,
      protocolCorrect: evaluateProtocolChoice(currentScenario, protocolId),
      phase: 'treatment',
    });
  },

  applyTreatment: (actionId) => {
    const {
      currentScenario,
      protocols,
      patientState,
      protocolCorrect,
      appliedActions,
      treatmentLog,
    } = get();

    if (!currentScenario || !patientState || protocolCorrect === null) return;

    const protocol = protocols[currentScenario.correctProtocol];
    const { patientState: nextState, logEntry, alreadyApplied } =
      applyTreatmentAction(
        currentScenario,
        protocol,
        patientState,
        actionId,
        appliedActions,
        protocolCorrect
      );

    if (alreadyApplied) return;

    set({
      patientState: nextState,
      appliedActions: [...appliedActions, actionId],
      treatmentLog: [...treatmentLog, logEntry],
    });
  },

  completeTreatment: () => {
    const {
      currentScenario,
      protocols,
      protocolCorrect,
      appliedActions,
      treatmentLog,
      patientState,
      performedAssessments,
      selectedProtocolId,
      actions,
    } = get();

    if (!currentScenario || !patientState || protocolCorrect === null) return;

    const protocol = protocols[currentScenario.correctProtocol];
    const result = resolveScenario(
      currentScenario,
      protocol,
      protocolCorrect,
      appliedActions,
      treatmentLog,
      patientState,
      performedAssessments.length,
      selectedProtocolId,
      actions,
      protocols
    );

    const existingTitles = get().unlockedInsights.map((i) => i.title);
    const newInsights = existingTitles.includes(result.unlockedInsight.title)
      ? get().unlockedInsights
      : [...get().unlockedInsights, result.unlockedInsight];

    const completedIds = get().completedScenarioIds.includes(currentScenario.id)
      ? get().completedScenarioIds
      : [...get().completedScenarioIds, currentScenario.id];

    const protocolCorrectIds =
      result.protocolCorrect &&
      !get().protocolCorrectIds.includes(currentScenario.id)
        ? [...get().protocolCorrectIds, currentScenario.id]
        : get().protocolCorrectIds;

    const protocolId = currentScenario.protocolId;
    const priorStats = get().protocolSessionStats[protocolId] ?? {
      completed: 0,
      correct: 0,
    };
    const protocolSessionStats = {
      ...get().protocolSessionStats,
      [protocolId]: {
        completed: priorStats.completed + 1,
        correct: priorStats.correct + (result.protocolCorrect ? 1 : 0),
      },
    };

    set({
      result,
      patientState: result.patientState,
      treatmentLog: result.treatmentLog,
      totalXp: get().totalXp + result.xpEarned,
      unlockedInsights: newInsights,
      completedScenarioIds: completedIds,
      protocolCorrectIds,
      protocolSessionStats,
      phase: 'outcome',
    });
  },

  finishScenario: () => {
    set({ phase: 'debrief' });
  },

  resetSession: () => {
    set({
      currentScenario: null,
      phase: initialPhase,
      patientState: null,
      selectedProtocolId: null,
      protocolCorrect: null,
      performedAssessments: [],
      revealedClues: [],
      appliedActions: [],
      treatmentLog: [],
      result: null,
    });
  },

  getProtocolMastery: () =>
    buildProtocolMastery(
      get().scenarios,
      get().protocolCorrectIds,
      get().protocolSessionStats
    ),
}));
