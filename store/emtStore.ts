import { create } from 'zustand';

import {
  applyVitals,
  createInitialSkills,
  evaluateAbcdeStep,
  evaluateTreatmentAction,
  hazardsAreCleared,
  resolveEmtRun,
} from '@/data/emt/engine';
import { generateEmtCall } from '@/data/emt/generator';
import {
  buildDecisionFlow,
  findDecisionStepIndex,
} from '@/data/emt/decisionFlow';
import type {
  AbcdeStep,
  CallCategory,
  EmtCall,
  EmtDifficulty,
  EmtPhase,
  EmtRunResult,
  EmtVitals,
  SkillCategory,
  SkillScores,
  TimelineEntry,
  WalkthroughChoice,
  WalkthroughStep,
} from '@/data/emt/types';

interface EmtStore {
  call: EmtCall | null;
  phase: EmtPhase;
  difficulty: EmtDifficulty;
  vitals: EmtVitals | null;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  abcdeCompleted: AbcdeStep[];
  historyCompleted: string[];
  treatments: string[];
  allergiesChecked: boolean;
  transportPriority: string | null;
  destination: string | null;
  timeline: TimelineEntry[];
  skillScores: SkillScores;
  totalScore: number;
  result: EmtRunResult | null;
  startedAt: number;
  steps: WalkthroughStep[];
  stepIndex: number;

  setDifficulty: (difficulty: EmtDifficulty) => void;
  startCall: (options?: {
    category?: CallCategory;
    archetypeId?: string;
    difficulty?: EmtDifficulty;
  }) => string | null;
  chooseNext: (choiceId: string) => void;
  undoChoice: (choiceId: string) => void;
  reset: () => void;
}

/** Actions a provider can take back before committing to the next step. */
const UNDOABLE_KINDS = new Set<WalkthroughChoice['actionKind']>([
  'ppe',
  'stage',
  'verbalize_safe',
  'safety_request',
  'abcde',
  'history',
  'check_allergies',
  'treatment',
]);

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
  skill: SkillCategory | undefined,
  delta: number
): SkillScores {
  if (!skill) return scores;
  return {
    ...scores,
    [skill]: scores[skill] + delta,
  };
}

function resolveAdvanceIndex(
  steps: WalkthroughStep[],
  currentIndex: number,
  advance: WalkthroughChoice['advance']
): number {
  switch (advance) {
    case 'stay':
      return currentIndex;
    case 'next':
      return Math.min(currentIndex + 1, steps.length - 1);
    case 'jump_primary':
      return findDecisionStepIndex(steps, 'primary_survey');
    case 'jump_history': {
      const idx = findDecisionStepIndex(steps, 'history');
      return idx > 0 || steps[0]?.phase === 'history'
        ? idx
        : findDecisionStepIndex(steps, 'treatment');
    }
    case 'jump_treatment':
      return findDecisionStepIndex(steps, 'treatment');
    case 'jump_transport':
      return findDecisionStepIndex(steps, 'transport');
    case 'complete':
      return currentIndex;
    default:
      return currentIndex + 1;
  }
}

const emptyState = {
  call: null as EmtCall | null,
  phase: 'dispatch' as EmtPhase,
  vitals: null as EmtVitals | null,
  safetyActions: [] as string[],
  sceneEntered: false,
  enteredUnsafe: false,
  abcdeCompleted: [] as AbcdeStep[],
  historyCompleted: [] as string[],
  treatments: [] as string[],
  allergiesChecked: false,
  transportPriority: null as string | null,
  destination: null as string | null,
  timeline: [] as TimelineEntry[],
  skillScores: createInitialSkills(),
  totalScore: 0,
  result: null as EmtRunResult | null,
  startedAt: 0,
  steps: [] as WalkthroughStep[],
  stepIndex: 0,
};

export const useEmtStore = create<EmtStore>((set, get) => ({
  ...emptyState,
  difficulty: 'standard',

  setDifficulty: (difficulty) => set({ difficulty }),

  startCall: (options) => {
    const difficulty = options?.difficulty ?? get().difficulty;
    const call = generateEmtCall({
      category: options?.category,
      archetypeId: options?.archetypeId,
    });
    const steps = buildDecisionFlow(call);
    set({
      ...emptyState,
      call,
      difficulty,
      phase: steps[0]?.phase ?? 'dispatch',
      vitals: { ...call.vitals },
      startedAt: Date.now(),
      steps,
      stepIndex: 0,
      skillScores: createInitialSkills(),
    });
    return call.id;
  },

  chooseNext: (choiceId) => {
    const state = get();
    if (!state.call || !state.vitals || state.phase === 'debrief') return;
    if (state.result) return;

    const step = state.steps[state.stepIndex];
    if (!step) return;

    const choice = step.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    let safetyActions = [...state.safetyActions];
    let sceneEntered = state.sceneEntered;
    let enteredUnsafe = state.enteredUnsafe;
    let abcdeCompleted = [...state.abcdeCompleted];
    let historyCompleted = [...state.historyCompleted];
    let treatments = [...state.treatments];
    let allergiesChecked = state.allergiesChecked;
    let transportPriority = state.transportPriority;
    let destination = state.destination;
    let vitals = state.vitals;
    let scoreDelta = choice.scoreDelta ?? 0;
    let message = choice.message ?? choice.label;
    let severity = choice.severity ?? (choice.correct ? 'good' : 'warn');
    let skill = choice.skill;
    let flowMiss = Boolean(choice.flowMiss);
    let advance = choice.advance;

    const kind = choice.actionKind;
    const payload = choice.payload;

    if (kind === 'ppe' && payload) {
      if (!safetyActions.includes(payload)) safetyActions.push(payload);
    }

    if (kind === 'verbalize_safe') {
      if (!safetyActions.includes('verbalize_scene_safe')) {
        safetyActions.push('verbalize_scene_safe');
      }
    }

    if (kind === 'stage' && payload) {
      if (!safetyActions.includes(payload)) safetyActions.push(payload);
    }

    if (kind === 'safety_request' && payload) {
      if (!safetyActions.includes(payload)) safetyActions.push(payload);
      if (payload === 'request_als' && !treatments.includes('request_als')) {
        treatments.push('request_als');
      }
    }

    if (kind === 'enter_scene') {
      const safe = hazardsAreCleared(state.call, safetyActions);
      if (!safe) {
        enteredUnsafe = true;
        scoreDelta = Math.min(scoreDelta, -30);
        message =
          choice.message ??
          'Entered before the scene was safe — provider risk.';
        severity = 'bad';
        flowMiss = true;
        vitals = applyVitals(vitals, {
          mentalStatus: 'scene chaotic — delayed care',
        });
      }
      sceneEntered = true;
      if (!safetyActions.includes('enter_scene')) {
        safetyActions.push('enter_scene');
      }
    }

    if (kind === 'trap_skip_bsi') {
      enteredUnsafe = enteredUnsafe || state.call.hazards.length > 0;
      flowMiss = true;
    }

    if (kind === 'trap_ignore_hazards') {
      enteredUnsafe = true;
      sceneEntered = true;
      if (!safetyActions.includes('enter_scene')) {
        safetyActions.push('enter_scene');
      }
      flowMiss = true;
    }

    if (kind === 'abcde' && payload) {
      const stepId = payload as AbcdeStep;
      const effect = evaluateAbcdeStep(state.call, stepId, abcdeCompleted);
      scoreDelta = effect.scoreDelta;
      message = effect.message;
      severity = effect.severity ?? severity;
      skill = effect.skill ?? skill;
      if (!abcdeCompleted.includes(stepId)) {
        abcdeCompleted.push(stepId);
      }
      sceneEntered = true;
    }

    if ((kind === 'history' || kind === 'check_allergies') && payload) {
      if (!historyCompleted.includes(payload)) {
        historyCompleted.push(payload);
      }
      if (kind === 'check_allergies' || /allerg/i.test(payload)) {
        allergiesChecked = true;
      }
    }

    if (kind === 'trap_meds_before_allergies') {
      flowMiss = true;
      if (!allergiesChecked) {
        scoreDelta = Math.min(scoreDelta, -16);
        message =
          'Medication considered before allergy check — dangerous habit.';
        severity = 'bad';
      }
      if (payload && !treatments.includes(payload)) {
        const fx = evaluateTreatmentAction(
          state.call,
          payload,
          treatments,
          vitals
        );
        treatments.push(payload);
        vitals = applyVitals(vitals, fx.vitals);
      }
    }

    if (kind === 'treatment' && payload) {
      const medicationSafetyMiss =
        ['aspirin', 'nitroglycerin'].includes(payload) &&
        !allergiesChecked;
      if (medicationSafetyMiss) {
        flowMiss = true;
        scoreDelta = Math.min(scoreDelta, -12);
        message =
          (choice.message ?? message) +
          ' (Allergy check missing before medication.)';
        severity = 'bad';
      }
      if (!treatments.includes(payload)) {
        const fx = evaluateTreatmentAction(
          state.call,
          payload,
          treatments,
          vitals
        );
        treatments.push(payload);
        vitals = applyVitals(vitals, fx.vitals);
        if (!medicationSafetyMiss) {
          message = fx.message;
          scoreDelta = fx.scoreDelta;
          severity = fx.severity ?? severity;
          skill = fx.skill ?? skill;
        }
        if (
          state.call.harmfulTreatment.includes(payload) ||
          resourceAlreadyOnSceneCheck(state.call, payload)
        ) {
          flowMiss = true;
        }
      }
    }

    if (kind === 'trap_early_treat' || kind === 'trap_load_go') {
      flowMiss = true;
      sceneEntered = true;
    }

    if (kind === 'trap_full_history') {
      flowMiss = true;
    }

    if (kind === 'proceed' && payload === 'finish_primary') {
      const missing = state.call.requiredAbcdeOrder.filter(
        (item) => !abcdeCompleted.includes(item)
      );
      if (missing.length > 0) {
        scoreDelta = -6 * missing.length;
        message = `You moved on with ${missing.length} primary assessment item${missing.length === 1 ? '' : 's'} incomplete: ${missing.join(', ')}. Continue care, but reassess these threats.`;
        severity = 'bad';
        skill = 'assessment';
        flowMiss = true;
      } else {
        message = 'Primary survey complete. Move into focused patient care.';
        severity = 'good';
      }
    }

    if (kind === 'proceed' && payload === 'await_scene_clear') {
      const safe = hazardsAreCleared(state.call, safetyActions);
      if (!safe) {
        advance = 'stay';
        scoreDelta = -8;
        message =
          'You stage, but the scene remains unsafe. Arrange the required controls before returning.';
        severity = 'warn';
        skill = 'scene_safety';
        flowMiss = true;
      } else {
        const development = state.steps[state.stepIndex + 1]?.development;
        message = development
          ? `You stage for ${development.elapsedMinutes} minutes while the scene is secured.`
          : 'You hold at a safe location while the scene is secured.';
      }
    }

    if (kind === 'proceed' && payload === 'choose_transport') {
      const missingPrimary = state.call.requiredAbcdeOrder.filter(
        (item) => !abcdeCompleted.includes(item)
      );
      if (missingPrimary.length > 0) {
        scoreDelta = Math.min(scoreDelta, -10);
        message = `Transport selected with primary threats still unchecked: ${missingPrimary.join(', ')}.`;
        severity = 'bad';
        skill = 'assessment';
        flowMiss = true;
      } else if (treatments.length === 0) {
        scoreDelta = Math.min(scoreDelta, -6);
        message = 'Transport selected without performing an indicated intervention.';
        severity = 'warn';
        skill = 'treatment';
        flowMiss = true;
      }
    }

    if (kind === 'transport_priority' && payload) {
      transportPriority = payload;
    }

    if (kind === 'transport_destination' && payload) {
      destination = payload;
    }

    const timeline = pushTimeline(state.timeline, {
      phase: step.phase,
      actionId: choice.id,
      label: choice.label,
      message,
      scoreDelta,
      severity,
      skill,
      flowMiss,
      startedAt: state.startedAt,
    });

    const skillScores = applySkill(state.skillScores, skill, scoreDelta);
    const totalScore = state.totalScore + scoreDelta;

    if (choice.advance === 'complete') {
      const finalPriority =
        transportPriority ?? state.call.correctTransportPriority;
      const finalDestination =
        destination ?? state.call.correctDestination;

      const result = resolveEmtRun({
        call: state.call,
        timeline,
        skillScores,
        totalScore,
        finalVitals: vitals,
        safetyActions,
        abcdeCompleted,
        treatments,
        transportPriority: finalPriority,
        destination: finalDestination,
        enteredUnsafe,
        difficulty: state.difficulty,
      });

      set({
        safetyActions,
        sceneEntered,
        enteredUnsafe,
        abcdeCompleted,
        historyCompleted,
        treatments,
        allergiesChecked,
        transportPriority: finalPriority,
        destination: finalDestination,
        vitals,
        timeline,
        skillScores: result.skillScores,
        totalScore: result.totalScore,
        result,
        phase: 'debrief',
      });
      return;
    }

    const nextIndex = resolveAdvanceIndex(
      state.steps,
      state.stepIndex,
      advance
    );
    const nextStep = state.steps[nextIndex];

    set({
      safetyActions,
      sceneEntered,
      enteredUnsafe,
      abcdeCompleted,
      historyCompleted,
      treatments,
      allergiesChecked,
      transportPriority,
      destination,
      vitals,
      timeline,
      skillScores,
      totalScore,
      stepIndex: nextIndex,
      phase: nextStep?.phase ?? state.phase,
    });
  },

  undoChoice: (choiceId) => {
    const state = get();
    if (!state.call || state.result || state.phase === 'debrief') return;

    const step = state.steps[state.stepIndex];
    const choice = step?.choices.find((c) => c.id === choiceId);
    if (!choice || !UNDOABLE_KINDS.has(choice.actionKind)) return;
    if (
      choice.actionKind === 'treatment' &&
      choice.payload &&
      state.call.harmfulTreatment.includes(choice.payload)
    ) {
      return;
    }

    const entries = state.timeline.filter((e) => e.actionId === choiceId);
    if (entries.length === 0) return;

    const payload = choice.payload;
    const kind = choice.actionKind;

    const safetyActions = state.safetyActions.filter((id) => {
      if (kind === 'verbalize_safe') return id !== 'verbalize_scene_safe';
      if (kind === 'ppe' || kind === 'stage' || kind === 'safety_request') {
        return id !== payload;
      }
      return true;
    });
    const abcdeCompleted =
      kind === 'abcde'
        ? state.abcdeCompleted.filter((id) => id !== payload)
        : state.abcdeCompleted;
    const historyCompleted =
      kind === 'history' || kind === 'check_allergies'
        ? state.historyCompleted.filter((id) => id !== payload)
        : state.historyCompleted;
    const treatments =
      kind === 'treatment' || (kind === 'safety_request' && payload === 'request_als')
        ? state.treatments.filter((id) => id !== payload)
        : state.treatments;

    const allergyPayloads = new Set(
      state.steps
        .flatMap((s) => s.choices)
        .filter((c) => c.actionKind === 'check_allergies' && c.payload)
        .map((c) => c.payload as string)
    );
    const allergiesChecked = historyCompleted.some(
      (id) => allergyPayloads.has(id) || /allerg/i.test(id)
    );

    let skillScores = state.skillScores;
    let totalScore = state.totalScore;
    for (const entry of entries) {
      totalScore -= entry.scoreDelta;
      skillScores = applySkill(skillScores, entry.skill, -entry.scoreDelta);
    }

    set({
      safetyActions,
      abcdeCompleted,
      historyCompleted,
      treatments,
      allergiesChecked,
      vitals: recomputeVitals(state.call, treatments, state.enteredUnsafe),
      timeline: state.timeline.filter((e) => e.actionId !== choiceId),
      skillScores,
      totalScore,
    });
  },

  reset: () => {
    set({ ...emptyState, difficulty: get().difficulty });
  },
}));

/**
 * Treatments mutate vitals as they are applied, so undoing one means replaying the
 * remaining treatments from the patient's presenting vitals.
 */
function recomputeVitals(
  call: EmtCall,
  treatments: string[],
  enteredUnsafe: boolean
): EmtVitals {
  let vitals: EmtVitals = { ...call.vitals };
  if (enteredUnsafe) {
    vitals = applyVitals(vitals, { mentalStatus: 'scene chaotic — delayed care' });
  }
  const applied: string[] = [];
  for (const treatment of treatments) {
    const fx = evaluateTreatmentAction(call, treatment, applied, vitals);
    vitals = applyVitals(vitals, fx.vitals);
    applied.push(treatment);
  }
  return vitals;
}

function resourceAlreadyOnSceneCheck(
  call: EmtCall,
  actionId: string
): boolean {
  const map: Record<string, 'fire' | 'als' | 'pd'> = {
    request_fire: 'fire',
    request_als: 'als',
    request_pd: 'pd',
  };
  const res = map[actionId];
  return res ? (call.resourcesOnScene ?? []).includes(res) : false;
}
