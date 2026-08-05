import { create } from 'zustand';

import {
  applyVitals,
  createInitialSkills,
  delayedCareVitals,
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
import { resolveMenuAction } from '@/data/emt/menuActions';
import {
  buildLaurenExchange,
  withCoachTips,
} from '@/data/emt/laurenFindings';
import {
  getWrapUpHints,
  phaseEnterGuide,
  uniqueCoachNotes,
} from '@/data/emt/laurenCoach';
import {
  getNremtStage,
  nextNremtStage,
  stageCoverage,
  type NremtStage,
} from '@/data/emt/nremtFlow';
import {
  presentLaurenExchange,
  showLaurenSuggestions,
  showPhaseCoaching,
  laurenGestureLevel,
} from '@/data/emt/difficulty';
import type {
  AbcdeStep,
  CallCategory,
  CoachNote,
  EmtCall,
  EmtDifficulty,
  EmtPhase,
  EmtRunResult,
  EmtVitals,
  FollowUpChoice,
  InstructorMessage,
  RevealedVitals,
  SkillCategory,
  SkillScores,
  TimelineEntry,
  WalkthroughChoice,
  WalkthroughStep,
} from '@/data/emt/types';
import type { ResourceCrew } from '@/lib/characterDialogue';
import { useProgressStore } from '@/store/progressStore';

export interface LaurenFlashItem {
  id: string;
  lines: string[];
  studentLine?: string;
  choices?: Array<{ id: string; label: string; actionId: string }>;
  /** Practice = full coaching; Exam = minimal. */
  gesture?: 'full' | 'gesture' | 'minimal';
  /** Auto-dismiss without OK (e.g. enroute ETA before unit radio flash). */
  autoDismiss?: boolean;
}

type ResourceStage = 'enroute' | 'standby';
type ResourceCrewKey = 'als' | 'fire' | 'pd';


interface PendingPhysio {
  id: string;
  fireAtMs: number;
  vitalsPatch?: Partial<EmtVitals>;
  laurenLines: string[];
  timelineLabel: string;
  scoreDelta?: number;
  skill?: SkillCategory;
}

/** Restorable call state for step-level Back (not used after the final destination). */
interface CallSnapshot {
  phase: EmtPhase;
  vitals: EmtVitals | null;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  sceneSecuredAfterDelay: boolean;
  abcdeCompleted: AbcdeStep[];
  historyCompleted: string[];
  treatments: string[];
  allergiesChecked: boolean;
  transportPriority: string | null;
  destination: string | null;
  timeline: TimelineEntry[];
  skillScores: SkillScores;
  totalScore: number;
  stepIndex: number;
}

interface EmtStore {
  call: EmtCall | null;
  phase: EmtPhase;
  difficulty: EmtDifficulty;
  vitals: EmtVitals | null;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  sceneSecuredAfterDelay: boolean;
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
  snapshots: CallSnapshot[];
  /** Freeform action menu — every tap is logged. */
  completedActions: string[];
  handoffText: string;
  pendingCategory: CallCategory | null;
  /** Last resource flash to show (UI consumes & clears). */
  pendingResourceFlash: ResourceCrew | null;
  /** Oral-exam conversation log (kept for debrief; UI uses Lauren flash). */
  instructorLog: InstructorMessage[];
  /** Only vitals the student has asked for. */
  revealedVitals: RevealedVitals;
  /** Silent risk accumulator (never shown mid-call). */
  riskScore: number;
  pendingFollowUps: FollowUpChoice[];
  /** Wall-clock when student acknowledged arrival (for elapsed timer). */
  arrivedAt: number | null;
  /** Delayed physio / Lauren beats (nitro drop, untreated deterioration). */
  pendingPhysio: PendingPhysio[];
  /** Lauren slide-in queue — findings & patient updates. */
  laurenFlashQueue: LaurenFlashItem[];
  /** Size-up resource staging — shortens later ETA if already rolling / standing by. */
  resourceStaging: Partial<Record<ResourceCrewKey, ResourceStage>>;
  /** Player-declared MOI vs NOI. */
  moiNoiCall: 'moi' | 'noi' | null;
  /** NREMT board stage — bottom CTA advances this. */
  nremtStage: NremtStage;
  /** Practice coaching comments collected for debrief review. */
  coachNotes: CoachNote[];
  /** Vitals snapshot from the last reassessment (for change lines). */
  lastReassessVitals: EmtVitals | null;

  setDifficulty: (difficulty: EmtDifficulty) => void;
  setPendingCategory: (category: CallCategory | null) => void;
  startCall: (options?: {
    category?: CallCategory;
    archetypeId?: string;
    difficulty?: EmtDifficulty;
  }) => string | null;
  acknowledgeDispatch: () => void;
  performMenuAction: (actionId: string) => void;
  /** Bottom CTA — advances NREMT assessment board stage. */
  advanceNremtStage: () => void;
  clearPendingResourceFlash: () => void;
  clearFollowUps: () => void;
  dismissLaurenFlash: () => void;
  /** Advance delayed patient physiology / Lauren beats. */
  tickPhysio: () => void;
  setHandoffText: (text: string) => void;
  submitHandoff: () => void;
  /** Stay and Play confirmed — grade without ED handoff. */
  finishOnScene: () => void;
  chooseNext: (choiceId: string) => void;
  undoChoice: (choiceId: string) => void;
  goBack: () => void;
  reset: () => void;
}

function captureSnapshot(state: {
  phase: EmtPhase;
  vitals: EmtVitals | null;
  safetyActions: string[];
  sceneEntered: boolean;
  enteredUnsafe: boolean;
  sceneSecuredAfterDelay: boolean;
  abcdeCompleted: AbcdeStep[];
  historyCompleted: string[];
  treatments: string[];
  allergiesChecked: boolean;
  transportPriority: string | null;
  destination: string | null;
  timeline: TimelineEntry[];
  skillScores: SkillScores;
  totalScore: number;
  stepIndex: number;
}): CallSnapshot {
  return {
    phase: state.phase,
    vitals: state.vitals ? { ...state.vitals } : null,
    safetyActions: [...state.safetyActions],
    sceneEntered: state.sceneEntered,
    enteredUnsafe: state.enteredUnsafe,
    sceneSecuredAfterDelay: state.sceneSecuredAfterDelay,
    abcdeCompleted: [...state.abcdeCompleted],
    historyCompleted: [...state.historyCompleted],
    treatments: [...state.treatments],
    allergiesChecked: state.allergiesChecked,
    transportPriority: state.transportPriority,
    destination: state.destination,
    timeline: state.timeline.map((entry) => ({ ...entry })),
    skillScores: { ...state.skillScores },
    totalScore: state.totalScore,
    stepIndex: state.stepIndex,
  };
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
  sceneSecuredAfterDelay: false,
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
  snapshots: [] as CallSnapshot[],
  completedActions: [] as string[],
  handoffText: '',
  pendingCategory: null as CallCategory | null,
  pendingResourceFlash: null as ResourceCrew | null,
  instructorLog: [] as InstructorMessage[],
  revealedVitals: {} as RevealedVitals,
  riskScore: 0,
  pendingFollowUps: [] as FollowUpChoice[],
  arrivedAt: null as number | null,
  pendingPhysio: [] as PendingPhysio[],
  laurenFlashQueue: [] as LaurenFlashItem[],
  resourceStaging: {} as Partial<Record<ResourceCrewKey, ResourceStage>>,
  moiNoiCall: null as 'moi' | 'noi' | null,
  nremtStage: 'scene_sizeup' as NremtStage,
  coachNotes: [] as CoachNote[],
  lastReassessVitals: null as EmtVitals | null,
};

export const useEmtStore = create<EmtStore>((set, get) => ({
  ...emptyState,
  difficulty: 'practice',

  setDifficulty: (difficulty) => set({ difficulty }),

  setPendingCategory: (category) => set({ pendingCategory: category }),

  startCall: (options) => {
    const difficulty = options?.difficulty ?? get().difficulty;
    const category = options?.category ?? get().pendingCategory ?? undefined;
    const call = generateEmtCall({
      category,
      archetypeId: options?.archetypeId,
    });
    const steps = buildDecisionFlow(call);
    set({
      ...emptyState,
      call,
      difficulty,
      phase: 'dispatch',
      vitals: { ...call.vitals },
      startedAt: Date.now(),
      steps,
      stepIndex: 0,
      skillScores: createInitialSkills(),
      pendingCategory: category ?? null,
    });
    return call.id;
  },

  acknowledgeDispatch: () => {
    const state = get();
    if (!state.call || state.phase !== 'dispatch') return;
    const at = Date.now() - state.startedAt;
    const stage = getNremtStage('scene_sizeup', state.call.category);
    const timeline = pushTimeline(state.timeline, {
      phase: stage.phase,
      actionId: 'respond',
      label: 'On scene',
      message: 'Arrived — scene size-up begins.',
      scoreDelta: 0,
      severity: 'neutral',
      skill: 'scene_safety',
      startedAt: state.startedAt,
    });

    const pendingPhysio: PendingPhysio[] =
      state.difficulty === 'practice'
        ? [
            {
              id: `idle-coach-${at}`,
              fireAtMs: at + 60_000,
              laurenLines: [
                'Still working size-up? Take your time — Practice has no clock. When ready: patient contact.',
              ],
              timelineLabel: 'Practice nudge',
              scoreDelta: 0,
              skill: 'scene_safety',
            },
          ]
        : [
            {
              id: `idle-warn-${at}`,
              fireAtMs: at + 45_000,
              laurenLines: ['Time is moving on this call.'],
              timelineLabel: 'Delay on scene',
              scoreDelta: -4,
              skill: 'scene_safety',
            },
            {
              id: `idle-worse-${at}`,
              fireAtMs: at + 90_000,
              vitalsPatch: delayedCareVitals(state.call, state.vitals!),
              laurenLines: ['The patient looks worse than when you arrived.'],
              timelineLabel: 'Patient deteriorating',
              scoreDelta: -10,
              skill: 'treatment',
            },
          ];

    set({
      phase: stage.phase,
      nremtStage: 'scene_sizeup',
      arrivedAt: Date.now(),
      timeline,
      instructorLog: [],
      completedActions: [...state.completedActions, 'respond'],
      pendingPhysio,
      coachNotes: [],
      // Practice: Lauren opens Scene Size-Up guidance. Exam: silent arrival.
      laurenFlashQueue:
        state.difficulty === 'practice'
          ? [
              {
                id: `flash-arrive-${at}`,
                lines: phaseEnterGuide('scene_sizeup', state.call),
              },
            ]
          : [],
    });
  },

  clearFollowUps: () => set({ pendingFollowUps: [] }),

  dismissLaurenFlash: () => {
    set({ laurenFlashQueue: get().laurenFlashQueue.slice(1) });
  },

  tickPhysio: () => {
    const state = get();
    if (!state.call || !state.vitals || state.result) return;
    if (
      state.phase !== 'on_scene' &&
      state.phase !== 'primary_survey' &&
      state.phase !== 'scene_safety' &&
      state.phase !== 'history'
    ) {
      return;
    }
    const now = Date.now() - state.startedAt;
    const due = state.pendingPhysio.filter((p) => p.fireAtMs <= now);
    if (!due.length) return;
    const remaining = state.pendingPhysio.filter((p) => p.fireAtMs > now);

    let vitals = state.vitals;
    let instructorLog = [...state.instructorLog];
    let timeline = state.timeline;
    let skillScores = state.skillScores;
    let totalScore = state.totalScore;
    const flashAdds: LaurenFlashItem[] = [];

    for (const effect of due) {
      if (effect.vitalsPatch) {
        vitals = applyVitals(vitals, effect.vitalsPatch);
      }
      for (const [i, text] of effect.laurenLines.entries()) {
        instructorLog.push({
          id: `physio-${effect.id}-${i}`,
          role: 'lauren',
          text,
          atMs: now + i,
        });
      }
      if (effect.laurenLines.length) {
        flashAdds.push({
          id: `flash-physio-${effect.id}`,
          lines: effect.laurenLines,
        });
      }
      const delta = effect.scoreDelta ?? 0;
      timeline = pushTimeline(timeline, {
        phase: 'on_scene',
        actionId: effect.id,
        label: effect.timelineLabel,
        message: effect.laurenLines[0] ?? effect.timelineLabel,
        scoreDelta: delta,
        severity: delta < 0 ? 'warn' : 'neutral',
        skill: effect.skill,
        startedAt: state.startedAt,
      });
      if (effect.skill && delta) {
        skillScores = applySkill(skillScores, effect.skill, delta);
        totalScore += delta;
      }
    }

    set({
      vitals,
      instructorLog,
      timeline,
      skillScores,
      totalScore,
      pendingPhysio: remaining,
      laurenFlashQueue: [...state.laurenFlashQueue, ...flashAdds],
    });
  },

  advanceNremtStage: () => {
    const state = get();
    if (!state.call || !state.vitals || state.result) return;
    if (state.phase === 'handoff' || state.phase === 'debrief' || state.phase === 'dispatch') {
      return;
    }

    const category = state.call.category;
    const current = getNremtStage(state.nremtStage, category);
    const next = nextNremtStage(state.nremtStage, category);
    const at = Date.now() - state.startedAt;
    const coverage = stageCoverage(current, state.completedActions);

    let riskScore = state.riskScore;
    let totalScore = state.totalScore;
    let skillScores = state.skillScores;
    let timeline = state.timeline;
    const earlyAdvance = coverage.done < Math.ceil(coverage.total * 0.5);

    if (earlyAdvance) {
      riskScore += 12;
      totalScore -= 8;
      skillScores = applySkill(skillScores, 'assessment', -8);
      timeline = pushTimeline(timeline, {
        phase: current.phase,
        actionId: `advance_${current.id}`,
        label: `Advanced past ${current.title}`,
        message: `Moved on with ${coverage.done}/${coverage.total} expected elements.`,
        scoreDelta: -8,
        severity: 'warn',
        skill: 'assessment',
        flowMiss: true,
        startedAt: state.startedAt,
      });
    } else {
      timeline = pushTimeline(timeline, {
        phase: current.phase,
        actionId: `advance_${current.id}`,
        label: current.advanceLabel,
        message: `Progressing from ${current.title}.`,
        scoreDelta: 4,
        severity: 'good',
        skill: 'assessment',
        startedAt: state.startedAt,
      });
      totalScore += 4;
      skillScores = applySkill(skillScores, 'assessment', 4);
    }

    const coach = showPhaseCoaching(state.difficulty);
    const transportReady = !!state.transportPriority && !!state.destination;

    // Entering the report board — stay on the call so they can use Transport.
    // Handoff opens once destination + mode are set (or they press HAND OFF).
    if (next?.id === 'report') {
      const reportLines = coach
        ? [
            earlyAdvance
              ? 'You are advancing with gaps on the skills sheet — that will show in debrief.'
              : 'Primary board is complete enough to report.',
            'Use Transport: Stay and Play or Load and Go, then Transport for destination and mode.',
            'Handoff opens when both destination and mode are set.',
          ]
        : [
            'Use Transport for destination and mode — handoff opens when both are set.',
          ];

      if (transportReady) {
        set({
          phase: 'handoff',
          nremtStage: 'report',
          riskScore,
          totalScore,
          skillScores,
          timeline,
          sceneEntered: true,
          instructorLog: [
            ...state.instructorLog,
            {
              id: `advance-report-${at}`,
              role: 'lauren',
              text: 'Destination and mode are set — time for your handoff.',
              atMs: at,
            },
          ],
          laurenFlashQueue: [
            ...state.laurenFlashQueue,
            {
              id: `flash-advance-${at}`,
              lines: [
                'Destination and transport mode are set.',
                'Deliver your verbal handoff.',
              ],
            },
          ],
          completedActions: state.completedActions.includes('begin_handoff')
            ? state.completedActions
            : [...state.completedActions, 'begin_handoff'],
        });
        return;
      }

      set({
        phase: 'on_scene',
        nremtStage: 'report',
        riskScore,
        totalScore,
        skillScores,
        timeline,
        sceneEntered: true,
        instructorLog: [
          ...state.instructorLog,
          {
            id: `advance-report-${at}`,
            role: 'lauren',
            text: reportLines[0],
            atMs: at,
          },
        ],
        laurenFlashQueue: coach
          ? [
              ...state.laurenFlashQueue,
              {
                id: `flash-advance-${at}`,
                lines: reportLines,
              },
            ]
          : state.laurenFlashQueue,
      });
      return;
    }

    // Last stage HAND OFF button — open verbal report (warn if dest/mode missing).
    if (!next) {
      const reportLines = transportReady
        ? ['You arrive at the emergency department. Deliver your verbal handoff.']
        : [
            'Arriving without a clear destination or transport mode.',
            'Deliver your handoff anyway — gaps will show in debrief.',
          ];

      set({
        phase: 'handoff',
        nremtStage: 'report',
        riskScore: transportReady ? riskScore : riskScore + 8,
        totalScore: transportReady ? totalScore : totalScore - 4,
        skillScores: transportReady
          ? skillScores
          : applySkill(skillScores, 'transport', -4),
        timeline: transportReady
          ? timeline
          : pushTimeline(timeline, {
              phase: 'transport',
              actionId: 'begin_handoff',
              label: 'Hand off incomplete plan',
              message: 'Handoff started without destination and/or mode.',
              scoreDelta: -4,
              severity: 'warn',
              skill: 'transport',
              flowMiss: true,
              startedAt: state.startedAt,
            }),
        sceneEntered: true,
        instructorLog: [
          ...state.instructorLog,
          {
            id: `advance-handoff-${at}`,
            role: 'lauren',
            text: reportLines[0],
            atMs: at,
          },
        ],
        laurenFlashQueue: [
          ...state.laurenFlashQueue,
          {
            id: `flash-handoff-${at}`,
            lines: reportLines,
          },
        ],
        completedActions: state.completedActions.includes('begin_handoff')
          ? state.completedActions
          : [...state.completedActions, 'begin_handoff'],
      });
      return;
    }

    let completedActions = [...state.completedActions];
    let safetyActions = [...state.safetyActions];
    let sceneEntered = state.sceneEntered;
    if (next.id === 'primary_survey') {
      sceneEntered = true;
      if (!completedActions.includes('enter_scene')) completedActions.push('enter_scene');
      if (!safetyActions.includes('enter_scene')) safetyActions.push('enter_scene');
    }

    const lines = coach
      ? [
          ...(earlyAdvance
            ? [
                `You are leaving ${current.title} with gaps (${coverage.done}/${coverage.total}).`,
                'That can cost you on the skills sheet — we will review it.',
              ]
            : []),
          ...phaseEnterGuide(next.id, state.call),
        ]
      : [];

    set({
      nremtStage: next.id,
      phase: next.phase,
      riskScore,
      totalScore,
      skillScores,
      timeline,
      sceneEntered,
      safetyActions,
      completedActions,
      instructorLog: [
        ...state.instructorLog,
        {
          id: `you-advance-${at}`,
          role: 'you',
          text: current.advanceLabel,
          atMs: at,
        },
        ...lines.map((text, i) => ({
          id: `lauren-advance-${at}-${i}`,
          role: 'lauren' as const,
          text,
          atMs: at + i + 1,
        })),
      ],
      laurenFlashQueue: lines.length
        ? [
            ...state.laurenFlashQueue,
            {
              id: `flash-advance-${at}`,
              lines,
            },
          ]
        : state.laurenFlashQueue,
    });
  },

  performMenuAction: (actionId) => {
    const state = get();
    if (!state.call || !state.vitals) return;
    if (state.result) return;
    if (state.phase === 'handoff' || state.phase === 'debrief' || state.phase === 'dispatch') {
      return;
    }

    if (
      actionId === 'patient_update' ||
      actionId === 'continue_care' ||
      actionId === 'continue_response' ||
      actionId === 'advance_nremt'
    ) {
      get().advanceNremtStage();
      return;
    }

    let exchange = buildLaurenExchange(actionId, state.call, state.vitals);

    // Stay and Play — wrap-up prompt with optional miss hints (does not end yet).
    if (actionId === 'stay_and_play') {
      const hints = getWrapUpHints({
        call: state.call,
        vitals: state.vitals,
        completedActions: state.completedActions,
        treatments: state.treatments,
        abcdeCompleted: state.abcdeCompleted,
      });
      exchange = {
        studentLine: "I'm going to stay and play — wrap up on scene.",
        laurenLines: [
          'Stay and Play ends the call on scene — no hospital transport.',
          'Anything else you want to do for the patient before we grade?',
          ...hints,
        ],
        followUps: [
          {
            id: 'keep_working',
            label: 'Keep working',
            actionId: 'continue_care_wrap',
          },
          {
            id: 'end_scene',
            label: 'End on scene & grade',
            actionId: 'confirm_stay_and_play',
          },
        ],
      };
    }

    // Repeatable reassessment — show changes since last check.
    if (actionId === 'reassessment') {
      const n =
        state.completedActions.filter((id) => id === 'reassessment').length + 1;
      const prev = state.lastReassessVitals;
      const changes: string[] = [];
      if (prev) {
        if (prev.hr !== state.vitals.hr) {
          changes.push(`HR ${prev.hr} → ${state.vitals.hr}`);
        }
        if (prev.rr !== state.vitals.rr) {
          changes.push(`RR ${prev.rr} → ${state.vitals.rr}`);
        }
        if (prev.spo2 !== state.vitals.spo2) {
          changes.push(`SpO₂ ${prev.spo2}% → ${state.vitals.spo2}%`);
        }
        if (prev.bp !== state.vitals.bp) {
          changes.push(`BP ${prev.bp} → ${state.vitals.bp}`);
        }
        if (prev.mentalStatus !== state.vitals.mentalStatus) {
          changes.push(
            `Mental status ${prev.mentalStatus} → ${state.vitals.mentalStatus}`
          );
        }
      }
      exchange = {
        studentLine: "I'd like to reassess the patient.",
        laurenLines: [
          `Reassessment #${n}: mental status ${state.vitals.mentalStatus}.`,
          `Vitals now: BP ${state.vitals.bp}, HR ${state.vitals.hr}, RR ${state.vitals.rr}, SpO₂ ${state.vitals.spo2}%.`,
          changes.length
            ? `Change since last check: ${changes.join('; ')}.`
            : n === 1
              ? 'Baseline reassessment logged — reassess again after interventions to watch for change.'
              : 'No major change since your last reassessment.',
          'You can reassess as often as you need.',
        ],
        reveal: ['hr', 'rr', 'spo2', 'bp'],
      };
    }

    if (actionId === 'continue_care_wrap') {
      exchange = {
        studentLine: "I'll keep working.",
        laurenLines: [
          'Sounds good. Reassess, treat life threats, then Stay and Play or Transport when you are ready.',
        ],
      };
    }

    if (actionId === 'confirm_stay_and_play') {
      exchange = {
        studentLine: "I'm ending care on scene — Stay and Play.",
        laurenLines: [
          'Disposition logged: stayed on scene.',
          'Closing the call for your debrief.',
        ],
      };
    }

    let newCoachNotes = state.coachNotes;
    if (showLaurenSuggestions(state.difficulty)) {
      const coached = withCoachTips(actionId, state.call, exchange, {
        vitals: state.vitals,
        revealedVitals: state.revealedVitals,
        nremtStage: state.nremtStage,
        completedActions: state.completedActions,
        treatments: state.treatments,
      });
      exchange = coached.exchange;
      if (coached.coachNote) {
        newCoachNotes = uniqueCoachNotes([...state.coachNotes, coached.coachNote]);
      }
    }
    exchange = presentLaurenExchange(state.difficulty, exchange);

    // If already staged during size-up, Lauren notes the shorter ETA.
    if (
      (actionId === 'request_als' ||
        actionId === 'request_fire' ||
        actionId === 'request_pd') &&
      state.resourceStaging
    ) {
      const crew =
        actionId === 'request_als' ? 'als' : actionId === 'request_fire' ? 'fire' : 'pd';
      const staged = state.resourceStaging[crew];
      if (staged === 'enroute') {
        exchange = presentLaurenExchange(state.difficulty, {
          ...exchange,
          laurenLines: [
            'They are already enroute from your size-up request.',
            'Expect a shortened ETA.',
          ],
        });
      } else if (staged === 'standby') {
        exchange = presentLaurenExchange(state.difficulty, {
          ...exchange,
          laurenLines: [
            'They were standing by from your size-up request.',
            'Bringing them into the scene now — faster than a cold start.',
          ],
        });
      }
    }

    const at = Date.now() - state.startedAt;
    const newLog: InstructorMessage[] = [
      ...state.instructorLog,
      {
        id: `you-${actionId}-${at}`,
        role: 'you',
        text: exchange.studentLine,
        atMs: at,
      },
      ...exchange.laurenLines.map((text, i) => ({
        id: `lauren-${actionId}-${at}-${i}`,
        role: 'lauren' as const,
        text,
        atMs: at + i + 1,
      })),
    ];

    const revealedVitals: RevealedVitals = { ...state.revealedVitals };
    for (const key of exchange.reveal ?? []) {
      revealedVitals[key] = true;
    }

    let riskScore = state.riskScore;
    if (actionId === 'enter_scene') {
      const cleared =
        state.sceneSecuredAfterDelay || hazardsAreCleared(state.call, state.safetyActions);
      if (!cleared && state.call.hazards.length > 0) {
        riskScore += 30;
      }
    }

    // Engine scoring still runs silently
    const fx = resolveMenuAction(actionId, {
      call: state.call,
      vitals: state.vitals,
      safetyActions: state.safetyActions,
      sceneEntered: state.sceneEntered,
      enteredUnsafe: state.enteredUnsafe,
      sceneSecuredAfterDelay: state.sceneSecuredAfterDelay,
      abcdeCompleted: state.abcdeCompleted,
      historyCompleted: state.historyCompleted,
      treatments: state.treatments,
      allergiesChecked: state.allergiesChecked,
      transportPriority: state.transportPriority,
      destination: state.destination,
      completedActions: state.completedActions,
      resourceStaging: state.resourceStaging,
    });

    const timeline = pushTimeline(state.timeline, {
      phase: 'on_scene',
      actionId,
      label: fx.label,
      message: fx.message,
      scoreDelta: fx.scoreDelta,
      severity: fx.severity,
      skill: fx.skill,
      flowMiss: fx.flowMiss,
      startedAt: state.startedAt,
    });

    const skillScores = applySkill(state.skillScores, fx.skill, fx.scoreDelta);
    const vitals = fx.vitalsPatch
      ? applyVitals(state.vitals, fx.vitalsPatch)
      : state.vitals;

    const nextCompleted = (() => {
      let list = [...state.completedActions];
      // Wrap-up prompt is not a disposition yet.
      if (fx.wrapUp) {
        return list;
      }
      // Reassessment is repeatable — always log another pass.
      if (actionId === 'reassessment') {
        list = [...list, 'reassessment'];
      } else if (!list.includes(actionId)) {
        list = [...list, actionId];
      }
      // Enroute also counts as the matching Resources menu request.
      const stage = /^resource_(als|fire|pd)_enroute$/.exec(actionId);
      if (stage) {
        const requestId =
          stage[1] === 'als'
            ? 'request_als'
            : stage[1] === 'fire'
              ? 'request_fire'
              : 'request_pd';
        if (!list.includes(requestId)) list = [...list, requestId];
      }
      if (fx.beginHandoff && !list.includes('begin_handoff')) {
        list = [...list, 'begin_handoff'];
      }
      for (const granted of fx.grantActions ?? []) {
        if (!list.includes(granted)) list = [...list, granted];
      }
      return list;
    })();

    const nextAbcde = fx.abcdeCompleted ?? state.abcdeCompleted;

    // Cancel idle deterioration once they start assessing / treating.
    let pendingPhysio = [...state.pendingPhysio];
    if (
      actionId === 'general_impression' ||
      actionId === 'rapid_assessment' ||
      actionId === 'focused_assessment' ||
      actionId === 'don_ppe' ||
      actionId === 'verbalize_scene_safe' ||
      actionId === 'oxygen' ||
      actionId === 'airway' ||
      actionId === 'breathing' ||
      actionId === 'circulation'
    ) {
      pendingPhysio = pendingPhysio.filter((p) => !p.id.startsWith('idle-'));
    }

    if (actionId === 'nitroglycerin' && vitals.bp) {
      pendingPhysio.push({
        id: `nitro-bp-${at}`,
        fireAtMs: at + 10_000,
        laurenLines: state.revealedVitals.bp
          ? [
              `Blood pressure is now ${vitals.bp}.`,
              'The patient looks a bit more pale.',
            ]
          : ['The patient looks a bit more pale after the nitroglycerin.'],
        timelineLabel: 'Blood pressure decreased',
        scoreDelta: 0,
        skill: 'treatment',
      });
    }
    if (
      actionId === 'general_impression' &&
      !state.treatments.includes('oxygen') &&
      !pendingPhysio.some((p) => p.id.startsWith('delay-o2'))
    ) {
      pendingPhysio.push({
        id: `delay-o2-${at}`,
        fireAtMs: at + 20_000,
        vitalsPatch: delayedCareVitals(state.call, vitals),
        laurenLines: ['The patient appears more fatigued than a moment ago.'],
        timelineLabel: 'Condition trending down',
        scoreDelta: -4,
        skill: 'treatment',
      });
    }
    const nextPending =
      actionId === 'oxygen'
        ? pendingPhysio.filter((p) => !p.id.startsWith('delay-o2'))
        : pendingPhysio;

    const baseQueue =
      state.laurenFlashQueue[0]?.choices?.some((c) => c.actionId === actionId)
        ? state.laurenFlashQueue.slice(1)
        : [...state.laurenFlashQueue];

    if (exchange.laurenLines.length) {
      const enrouteEta = /^resource_(als|fire|pd)_enroute$/.test(actionId);
      baseQueue.push({
        id: `flash-${actionId}-${at}`,
        // Button clicks already show the ask — Lauren popup is reply-only.
        lines: exchange.laurenLines,
        choices: exchange.followUps,
        gesture: laurenGestureLevel(state.difficulty),
        autoDismiss: enrouteEta,
      });
    }

    if (fx.beginHandoff && actionId !== 'begin_handoff') {
      baseQueue.push({
        id: `flash-handoff-${at}`,
        lines: [
          'Destination and transport mode are set.',
          'You arrive at the emergency department. Deliver your verbal handoff.',
        ],
      });
    }

    let resourceStaging = { ...state.resourceStaging };
    let moiNoiCall = state.moiNoiCall;
    if (actionId === 'declare_moi') moiNoiCall = 'moi';
    if (actionId === 'declare_noi') moiNoiCall = 'noi';
    const stageMatch = /^resource_(als|fire|pd)_(enroute|standby)$/.exec(actionId);
    if (stageMatch) {
      resourceStaging = {
        ...resourceStaging,
        [stageMatch[1]]: stageMatch[2] as ResourceStage,
      };
    }

    set({
      vitals,
      safetyActions: fx.safetyActions ?? state.safetyActions,
      abcdeCompleted: nextAbcde,
      historyCompleted: fx.historyCompleted ?? state.historyCompleted,
      treatments: fx.treatments ?? state.treatments,
      allergiesChecked: fx.allergiesChecked ?? state.allergiesChecked,
      sceneEntered: fx.sceneEntered ?? state.sceneEntered,
      enteredUnsafe: fx.enteredUnsafe ?? state.enteredUnsafe,
      transportPriority: fx.transportPriority ?? state.transportPriority,
      destination: fx.destination ?? state.destination,
      timeline,
      skillScores,
      totalScore: state.totalScore + fx.scoreDelta,
      completedActions: nextCompleted,
      pendingResourceFlash: fx.resourceFlash ?? null,
      phase: fx.beginHandoff
        ? 'handoff'
        : getNremtStage(state.nremtStage, state.call.category).phase,
      instructorLog: newLog,
      revealedVitals,
      riskScore,
      // Choices live on Lauren's flash — keep the action menu open.
      pendingFollowUps: [],
      pendingPhysio: nextPending,
      arrivedAt: state.arrivedAt ?? Date.now(),
      laurenFlashQueue: baseQueue,
      resourceStaging,
      moiNoiCall,
      coachNotes: newCoachNotes,
      lastReassessVitals:
        actionId === 'reassessment' ? { ...vitals } : state.lastReassessVitals,
    });

    if (fx.endOnScene) {
      get().finishOnScene();
    }
  },

  clearPendingResourceFlash: () => set({ pendingResourceFlash: null }),

  setHandoffText: (text) => set({ handoffText: text }),

  submitHandoff: () => {
    const state = get();
    if (!state.call || !state.vitals || state.phase !== 'handoff') return;

    const handoffScore =
      state.handoffText.trim().length >= 40
        ? 12
        : state.handoffText.trim().length >= 12
          ? 4
          : -6;

    const timeline = pushTimeline(state.timeline, {
      phase: 'handoff',
      actionId: 'verbal_handoff',
      label: 'ED handoff',
      message:
        handoffScore >= 12
          ? 'Concise handoff delivered.'
          : handoffScore > 0
            ? 'Handoff given — some critical elements may be missing.'
            : 'Handoff incomplete.',
      scoreDelta: handoffScore,
      severity: handoffScore >= 12 ? 'good' : handoffScore > 0 ? 'warn' : 'bad',
      skill: 'communication',
      startedAt: state.startedAt,
    });

    const skillScores = applySkill(state.skillScores, 'communication', handoffScore);
    const totalScore = state.totalScore + handoffScore;

    const result = resolveEmtRun({
      call: state.call,
      difficulty: state.difficulty,
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
      completedActions: [...state.completedActions, 'verbal_handoff'],
      coachNotes: state.coachNotes,
    });

    useProgressStore.getState().recordCompletedRun({
      result,
      category: state.call.category,
      difficulty: state.difficulty,
    });

    set({
      timeline,
      skillScores: result.skillScores,
      totalScore: result.totalScore,
      result,
      phase: 'debrief',
    });
  },

  finishOnScene: () => {
    const state = get();
    if (!state.call || !state.vitals || state.result) return;
    if (state.phase === 'debrief') return;

    const completedActions = state.completedActions.includes('stay_and_play')
      ? state.completedActions
      : [...state.completedActions, 'stay_and_play'];

    const result = resolveEmtRun({
      call: state.call,
      difficulty: state.difficulty,
      timeline: state.timeline,
      skillScores: state.skillScores,
      totalScore: state.totalScore,
      finalVitals: state.vitals,
      safetyActions: state.safetyActions,
      abcdeCompleted: state.abcdeCompleted,
      treatments: state.treatments,
      transportPriority: state.transportPriority,
      destination: state.destination,
      enteredUnsafe: state.enteredUnsafe,
      completedActions,
      coachNotes: state.coachNotes,
      onSceneDisposition: true,
    });

    useProgressStore.getState().recordCompletedRun({
      result,
      category: state.call.category,
      difficulty: state.difficulty,
    });

    set({
      completedActions,
      skillScores: result.skillScores,
      totalScore: result.totalScore,
      result,
      phase: 'debrief',
      laurenFlashQueue: [],
    });
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
    let sceneSecuredAfterDelay = state.sceneSecuredAfterDelay;
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
      const safe =
        sceneSecuredAfterDelay || hazardsAreCleared(state.call, safetyActions);
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
        const labels = missing.map((step) => {
          const finding = state.call!.abcde.find((item) => item.step === step);
          return finding?.label ?? step;
        });
        scoreDelta = -6 * missing.length;
        message = `You moved on with ${missing.length} required primary assessment item${missing.length === 1 ? '' : 's'} incomplete: ${labels.join(', ')}. Continue care, but reassess these threats.`;
        severity = 'bad';
        skill = 'assessment';
        flowMiss = true;
      } else {
        message =
          state.call.archetypeId === 'cardiac_arrest'
            ? 'Airway, breathing, and pulse check complete. Move immediately to CPR and AED.'
            : 'Primary survey complete. Move into focused patient care.';
        severity = 'good';
      }
    }

    if (kind === 'proceed' && payload === 'await_scene_clear') {
      const safe = hazardsAreCleared(state.call, safetyActions);
      if (!safe) {
        sceneSecuredAfterDelay = true;
        scoreDelta = -22;
        message =
          'You staged without arranging effective scene control. Dispatch eventually escalates the response, but patient contact is significantly delayed.';
        severity = 'bad';
        skill = 'scene_safety';
        flowMiss = true;
        vitals = applyVitals(vitals, delayedCareVitals(state.call, vitals));
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
        completedActions: state.completedActions,
        coachNotes: state.coachNotes,
      });

      // Final destination locks the run — no Back from debrief.
      set({
        safetyActions,
        sceneEntered,
        enteredUnsafe,
        sceneSecuredAfterDelay,
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
        snapshots: [],
      });

      if (state.call) {
        useProgressStore.getState().recordCompletedRun({
          result,
          category: state.call.category,
          difficulty: state.difficulty,
        });
      }
      return;
    }

    const nextIndex = resolveAdvanceIndex(
      state.steps,
      state.stepIndex,
      advance
    );
    const nextStep = state.steps[nextIndex];
    const leftStep = nextIndex !== state.stepIndex;
    const snapshots = leftStep
      ? [...state.snapshots, captureSnapshot(state)]
      : state.snapshots;

    set({
      safetyActions,
      sceneEntered,
      enteredUnsafe,
      sceneSecuredAfterDelay,
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
      snapshots,
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

  goBack: () => {
    const state = get();
    if (!state.call || state.result || state.phase === 'debrief') return;
    if (state.snapshots.length === 0) return;

    const previous = state.snapshots[state.snapshots.length - 1];
    set({
      ...previous,
      vitals: previous.vitals ? { ...previous.vitals } : null,
      safetyActions: [...previous.safetyActions],
      abcdeCompleted: [...previous.abcdeCompleted],
      historyCompleted: [...previous.historyCompleted],
      treatments: [...previous.treatments],
      timeline: previous.timeline.map((entry) => ({ ...entry })),
      skillScores: { ...previous.skillScores },
      snapshots: state.snapshots.slice(0, -1),
      result: null,
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
