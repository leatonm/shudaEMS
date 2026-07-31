import { create } from 'zustand';

import {
  applyVitals,
  evaluateAbcdeStep,
  evaluateSafetyAction,
  evaluateTransport,
  evaluateTreatmentAction,
  hazardsAreCleared,
  resolveEmtRun,
} from '@/data/emt/engine';
import { generateEmtCall } from '@/data/emt/generator';
import type {
  AbcdeStep,
  CallCategory,
  EmtCall,
  EmtPhase,
  EmtRunResult,
  EmtVitals,
  SkillScores,
  TimelineEntry,
} from '@/data/emt/types';
import { createInitialSkills } from '@/data/emt/engine';
import { isDestination, isTransportPriority } from '@/data/emt/actions';

interface EmtStore {
  call: EmtCall | null;
  phase: EmtPhase;
  vitals: EmtVitals | null;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  abcdeCompleted: AbcdeStep[];
  historyCompleted: string[];
  treatments: string[];
  transportPriority: string | null;
  destination: string | null;
  timeline: TimelineEntry[];
  skillScores: SkillScores;
  totalScore: number;
  result: EmtRunResult | null;
  startedAt: number;

  startCall: (options?: { category?: CallCategory; archetypeId?: string }) => string | null;
  respond: () => void;
  takeSafetyAction: (actionId: string) => void;
  beginPrimarySurvey: () => void;
  assessAbcde: (step: AbcdeStep) => void;
  proceedToHistory: () => void;
  takeHistory: (promptId: string) => void;
  proceedToTreatment: () => void;
  applyTreatment: (actionId: string) => void;
  proceedToTransport: () => void;
  chooseTransportPriority: (id: string) => void;
  chooseDestination: (id: string) => void;
  completeCall: () => void;
  reset: () => void;
}

function pushTimeline(
  timeline: TimelineEntry[],
  entry: Omit<TimelineEntry, 'atMs'> & { startedAt: number }
): TimelineEntry[] {
  const { startedAt, ...rest } = entry;
  return [
    ...timeline,
    {
      ...rest,
      atMs: Date.now() - startedAt,
    },
  ];
}

function applySkill(
  scores: SkillScores,
  skill: TimelineEntry['severity'] extends never ? never : import('@/data/emt/types').SkillCategory | undefined,
  delta: number
): SkillScores {
  if (!skill) return scores;
  return {
    ...scores,
    [skill]: scores[skill] + delta,
  };
}

export const useEmtStore = create<EmtStore>((set, get) => ({
  call: null,
  phase: 'dispatch',
  vitals: null,
  safetyActions: [],
  sceneEntered: false,
  enteredUnsafe: false,
  abcdeCompleted: [],
  historyCompleted: [],
  treatments: [],
  transportPriority: null,
  destination: null,
  timeline: [],
  skillScores: createInitialSkills(),
  totalScore: 0,
  result: null,
  startedAt: 0,

  startCall: (options) => {
    const call = generateEmtCall({
      category: options?.category,
      archetypeId: options?.archetypeId,
    });
    set({
      call,
      phase: 'dispatch',
      vitals: { ...call.vitals },
      safetyActions: [],
      sceneEntered: false,
      enteredUnsafe: false,
      abcdeCompleted: [],
      historyCompleted: [],
      treatments: [],
      transportPriority: null,
      destination: null,
      timeline: [],
      skillScores: createInitialSkills(),
      totalScore: 0,
      result: null,
      startedAt: Date.now(),
    });
    return call.id;
  },

  respond: () => {
    set({ phase: 'scene_safety' });
  },

  takeSafetyAction: (actionId) => {
    const state = get();
    if (!state.call || state.phase !== 'scene_safety') return;

    const effect = evaluateSafetyAction(
      state.call,
      actionId,
      state.safetyActions,
      state.sceneEntered
    );

    if (effect.message === 'Already done.') return;

    const nextSafety = [...state.safetyActions, actionId];
    const entering = actionId === 'enter_scene';
    const enteredUnsafe =
      state.enteredUnsafe ||
      (entering && !hazardsAreCleared(state.call, state.safetyActions));

    const timeline = pushTimeline(state.timeline, {
      phase: 'scene_safety',
      actionId,
      label: state.call.safetyActions.find((a) => a.id === actionId)?.label ?? actionId,
      message: effect.message,
      scoreDelta: effect.scoreDelta,
      severity: effect.severity ?? 'neutral',
      startedAt: state.startedAt,
    });

    set({
      safetyActions: nextSafety,
      sceneEntered: state.sceneEntered || entering,
      enteredUnsafe,
      vitals: applyVitals(state.vitals!, effect.vitals),
      timeline,
      totalScore: state.totalScore + effect.scoreDelta,
      skillScores: applySkill(state.skillScores, effect.skill, effect.scoreDelta),
    });
  },

  beginPrimarySurvey: () => {
    const { call, safetyActions, sceneEntered } = get();
    if (!call) return;
    if (!sceneEntered && !hazardsAreCleared(call, safetyActions)) {
      // Allow begin if they somehow cleared without explicit enter — auto-enter if safe
      if (hazardsAreCleared(call, safetyActions)) {
        set({ sceneEntered: true, phase: 'primary_survey' });
      }
      return;
    }
    if (!sceneEntered) return;
    set({ phase: 'primary_survey' });
  },

  assessAbcde: (step) => {
    const state = get();
    if (!state.call || state.phase !== 'primary_survey') return;

    const effect = evaluateAbcdeStep(state.call, step, state.abcdeCompleted);
    if (effect.message === 'Already assessed.') return;

    const timeline = pushTimeline(state.timeline, {
      phase: 'primary_survey',
      actionId: step,
      label: state.call.abcde.find((a) => a.step === step)?.label ?? step,
      message: effect.message,
      scoreDelta: effect.scoreDelta,
      severity: effect.severity ?? 'neutral',
      startedAt: state.startedAt,
    });

    set({
      abcdeCompleted: [...state.abcdeCompleted, step],
      timeline,
      totalScore: state.totalScore + effect.scoreDelta,
      skillScores: applySkill(state.skillScores, effect.skill, effect.scoreDelta),
    });
  },

  proceedToHistory: () => {
    const { abcdeCompleted, call } = get();
    if (!call) return;
    // Require airway, breathing, circulation at minimum
    const required = ['airway', 'breathing', 'circulation'] as AbcdeStep[];
    if (!required.every((s) => abcdeCompleted.includes(s))) return;
    set({ phase: 'history' });
  },

  takeHistory: (promptId) => {
    const state = get();
    if (!state.call || state.phase !== 'history') return;
    if (state.historyCompleted.includes(promptId)) return;

    const prompt = state.call.history.find((h) => h.id === promptId);
    if (!prompt) return;

    const timeline = pushTimeline(state.timeline, {
      phase: 'history',
      actionId: promptId,
      label: `${prompt.framework}: ${prompt.label}`,
      message: prompt.clue,
      scoreDelta: 5,
      severity: 'good',
      startedAt: state.startedAt,
    });

    set({
      historyCompleted: [...state.historyCompleted, promptId],
      timeline,
      totalScore: state.totalScore + 5,
      skillScores: {
        ...state.skillScores,
        assessment: state.skillScores.assessment + 5,
      },
    });
  },

  proceedToTreatment: () => {
    set({ phase: 'treatment' });
  },

  applyTreatment: (actionId) => {
    const state = get();
    if (!state.call || !state.vitals || state.phase !== 'treatment') return;

    const effect = evaluateTreatmentAction(
      state.call,
      actionId,
      state.treatments,
      state.vitals
    );
    if (effect.message === 'Already performed.') return;

    const timeline = pushTimeline(state.timeline, {
      phase: 'treatment',
      actionId,
      label: state.call.treatmentActions.find((a) => a.id === actionId)?.label ?? actionId,
      message: effect.message,
      scoreDelta: effect.scoreDelta,
      severity: effect.severity ?? 'neutral',
      startedAt: state.startedAt,
    });

    set({
      treatments: [...state.treatments, actionId],
      vitals: applyVitals(state.vitals, effect.vitals),
      timeline,
      totalScore: state.totalScore + effect.scoreDelta,
      skillScores: applySkill(state.skillScores, effect.skill, effect.scoreDelta),
    });
  },

  proceedToTransport: () => {
    set({ phase: 'transport' });
  },

  chooseTransportPriority: (id) => {
    if (!isTransportPriority(id)) return;
    set({ transportPriority: id });
  },

  chooseDestination: (id) => {
    if (!isDestination(id)) return;
    set({ destination: id });
  },

  completeCall: () => {
    const state = get();
    if (!state.call || !state.vitals) return;
    if (!state.transportPriority || !state.destination) return;

    const transportFx = evaluateTransport(
      state.call,
      state.transportPriority,
      state.destination
    );

    let timeline = pushTimeline(state.timeline, {
      phase: 'transport',
      actionId: 'priority',
      label: 'Transport Priority',
      message: transportFx.priority.message,
      scoreDelta: transportFx.priority.scoreDelta,
      severity: transportFx.priority.severity ?? 'neutral',
      startedAt: state.startedAt,
    });
    timeline = pushTimeline(timeline, {
      phase: 'transport',
      actionId: 'destination',
      label: 'Destination',
      message: transportFx.destination.message,
      scoreDelta: transportFx.destination.scoreDelta,
      severity: transportFx.destination.severity ?? 'neutral',
      startedAt: state.startedAt,
    });

    const totalScore =
      state.totalScore +
      transportFx.priority.scoreDelta +
      transportFx.destination.scoreDelta;

    const skillScores = applySkill(
      applySkill(state.skillScores, 'transport', transportFx.priority.scoreDelta),
      'transport',
      transportFx.destination.scoreDelta
    );

    const result = resolveEmtRun({
      call: state.call,
      timeline,
      skillScores,
      totalScore,
      finalVitals: state.vitals,
      safetyActions: state.safetyActions,
      abcdeCompleted: state.abcdeCompleted,
      treatments: state.treatments,
      transportPriority: state.transportPriority,
      destination: state.destination,
      enteredUnsafe: state.enteredUnsafe,
    });

    set({
      timeline,
      totalScore: result.totalScore,
      skillScores: result.skillScores,
      result,
      phase: 'debrief',
    });
  },

  reset: () => {
    set({
      call: null,
      phase: 'dispatch',
      vitals: null,
      safetyActions: [],
      sceneEntered: false,
      enteredUnsafe: false,
      abcdeCompleted: [],
      historyCompleted: [],
      treatments: [],
      transportPriority: null,
      destination: null,
      timeline: [],
      skillScores: createInitialSkills(),
      totalScore: 0,
      result: null,
      startedAt: 0,
    });
  },
}));
