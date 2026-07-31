import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ShiftButton } from '@/components/ui/ShiftUI';
import {
  LiveDot,
  ProgressTrack,
  PulseOrb,
  enterFade,
  enterStepIn,
  enterUp,
  exitStepOut,
} from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { categoryColor, theme } from '@/constants/theme';
import {
  formatLiveFeedback,
  showActionTips,
  showHazardDetails,
  showPhaseCoaching,
} from '@/data/emt/difficulty';
import { hazardsAreCleared, unresolvedSceneHazards } from '@/data/emt/engine';
import { describeResourcesOnArrival } from '@/data/emt/resources';
import { shuffleChoices } from '@/data/emt/walkthrough';
import type { WalkthroughChoice, WalkthroughStep } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

export default function EmtCallScreen() {
  const router = useRouter();

  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const difficulty = useEmtStore((s) => s.difficulty);
  const vitals = useEmtStore((s) => s.vitals);
  const steps = useEmtStore((s) => s.steps);
  const stepIndex = useEmtStore((s) => s.stepIndex);
  const timeline = useEmtStore((s) => s.timeline);
  const totalScore = useEmtStore((s) => s.totalScore);
  const safetyActions = useEmtStore((s) => s.safetyActions);
  const sceneEntered = useEmtStore((s) => s.sceneEntered);
  const enteredUnsafe = useEmtStore((s) => s.enteredUnsafe);
  const sceneSecuredAfterDelay = useEmtStore((s) => s.sceneSecuredAfterDelay);
  const abcdeCompleted = useEmtStore((s) => s.abcdeCompleted);
  const historyCompleted = useEmtStore((s) => s.historyCompleted);
  const treatments = useEmtStore((s) => s.treatments);
  const transportPriority = useEmtStore((s) => s.transportPriority);
  const destination = useEmtStore((s) => s.destination);
  const chooseNext = useEmtStore((s) => s.chooseNext);
  const undoChoice = useEmtStore((s) => s.undoChoice);

  const tips = showActionTips(difficulty);
  const coach = showPhaseCoaching(difficulty);
  const hazardDetail = showHazardDetails(difficulty);
  const showScore = difficulty !== 'exam';

  const step = steps[stepIndex];

  const shuffled = useMemo(() => {
    if (!call || !step) return [];
    return shuffleChoices(step.choices, `${call.id}:${step.id}`);
  }, [call, step]);

  useEffect(() => {
    if (phase === 'debrief') {
      router.replace('/emt/debrief');
    }
  }, [phase, router]);

  if (!call || !vitals || !step) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>No active call.</Text>
          <ShiftButton label="BACK" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const accent = categoryColor(call.category);
  const lastFeedback = timeline[timeline.length - 1];
  const live = lastFeedback ? formatLiveFeedback(difficulty, lastFeedback) : null;

  const progress = (stepIndex + 1) / Math.max(1, steps.length);
  const groups = groupChoices(shuffled);
  const phaseCompletion = {
    scene_safety:
      sceneEntered &&
      !enteredUnsafe &&
      (sceneSecuredAfterDelay || hazardsAreCleared(call, safetyActions)),
    primary_survey: call.requiredAbcdeOrder.every((item) =>
      abcdeCompleted.includes(item)
    ),
    treatment: call.recommendedTreatment
      .filter((item) => item !== 'request_als')
      .some((item) => treatments.includes(item)),
    transport: false,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PulseOrb color={theme.colors.cadGlow} size={200} top={-30} right={-50} />
      <PulseOrb
        color={theme.colors.violetGlow}
        size={180}
        bottom={-50}
        left={-60}
        duration={4800}
        delay={800}
      />

      <ScreenScroll>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <LiveDot color={accent} />
            <Text style={styles.unit}>
              {call.unit} · P{call.priority} · {difficulty.toUpperCase()}
            </Text>
          </View>
          {showScore ? <Text style={styles.score}>{totalScore} PTS</Text> : null}
        </View>

        <PhaseRail phase={step.phase} accent={accent} completed={phaseCompletion} />

        <View style={styles.progressWrap}>
          <ProgressTrack progress={progress} color={accent} />
        </View>

        {difficulty === 'exam' ? (
          <Text style={styles.examBadge}>EXAM · critical criteria active</Text>
        ) : null}

        <Animated.View
          key={`${step.id}-${stepIndex}`}
          entering={enterStepIn}
          exiting={exitStepOut}
        >
          <SituationStrip
            reveal={step.reveal}
            call={call}
            vitals={vitals}
            showVitals={step.phase !== 'dispatch' && step.phase !== 'scene_safety'}
            hazardDetail={hazardDetail}
            accent={accent}
          />

          {step.development ? (
            <SceneDevelopment
              development={step.development}
              accent={accent}
              delayed={sceneSecuredAfterDelay}
              unresolved={unresolvedSceneHazards(call, safetyActions).map(
                (hazard) => hazard.label
              )}
            />
          ) : null}

          {live && live.text !== '…' ? (
            <Animated.View
              key={`fb-${timeline.length}`}
              entering={enterUp(0)}
              style={[
                styles.feedback,
                live.showSeverity && lastFeedback?.severity === 'good'
                  ? styles.feedbackGood
                  : live.showSeverity && lastFeedback?.severity === 'bad'
                    ? styles.feedbackBad
                    : styles.feedbackNeutral,
              ]}
            >
              <Text style={styles.feedbackLabel}>
                {lastFeedback?.severity === 'good'
                  ? 'WHY THAT WORKED'
                  : lastFeedback?.severity === 'bad'
                    ? 'CLINICAL CONSEQUENCE'
                    : 'DECISION REVIEW'}
              </Text>
              <Text style={styles.feedbackText}>{live.text}</Text>
            </Animated.View>
          ) : null}

          <View style={styles.promptBlock}>
            <Text style={[styles.promptEyebrow, { color: accent }]}>{step.title}</Text>
            <Text style={styles.prompt}>{step.prompt}</Text>
            {coach && step.coachTip ? (
              <Text style={styles.hint}>{step.coachTip}</Text>
            ) : null}
          </View>

          {groups.map((group) => (
            <View
              key={group.label || 'forward'}
              style={group.forward ? styles.forwardGroup : styles.choiceGroup}
            >
              {group.label ? (
                <Text style={styles.choiceGroupLabel}>{group.label}</Text>
              ) : null}
              {group.choices.map((choice, index) => {
                const completed = isChoiceCompleted(choice, {
                  safetyActions,
                  sceneEntered,
                  abcdeCompleted,
                  historyCompleted,
                  treatments,
                  transportPriority,
                  destination,
                });
                const canUndo =
                  completed &&
                  !(
                    choice.actionKind === 'treatment' &&
                    choice.payload &&
                    call.harmfulTreatment.includes(choice.payload)
                  );
                return (
                  <ChoiceButton
                    key={choice.id}
                    label={choice.label}
                    subtitle={
                      completed
                        ? canUndo
                          ? 'Tap to undo'
                          : 'Patient response recorded — choose corrective care'
                        : tips
                          ? choice.tip
                          : undefined
                    }
                    onPress={() =>
                      completed && canUndo
                        ? undoChoice(choice.id)
                        : chooseNext(choice.id)
                    }
                    index={index}
                    accentColor={accent}
                    variant={group.forward && !completed ? 'primary' : 'task'}
                    completed={completed}
                    disabled={completed && !canUndo}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const PHASES = [
  { id: 'scene_safety', label: 'SIZE-UP' },
  { id: 'primary_survey', label: 'PRIMARY' },
  { id: 'treatment', label: 'PATIENT CARE' },
  { id: 'transport', label: 'TRANSPORT' },
] as const;

function PhaseRail({
  phase,
  accent,
  completed,
}: {
  phase: string;
  accent: string;
  completed: Record<(typeof PHASES)[number]['id'], boolean>;
}) {
  const currentIndex =
    phase === 'dispatch'
      ? -1
      : PHASES.findIndex((item) => item.id === phase);

  return (
    <View style={styles.phaseRail}>
      {PHASES.map((item, index) => {
        const active = index === currentIndex;
        const complete = completed[item.id];
        const skipped = index < currentIndex && !complete;
        return (
          <View key={item.id} style={styles.phaseRailItem}>
            <View
              style={[
                styles.phaseRailDot,
                complete && { backgroundColor: theme.colors.success },
                active && { backgroundColor: accent, transform: [{ scale: 1.25 }] },
                skipped && { backgroundColor: theme.colors.error },
              ]}
            />
            <Text
              style={[
                styles.phaseRailText,
                (active || complete) && { color: active ? accent : theme.colors.success },
                skipped && { color: theme.colors.error },
              ]}
            >
              {skipped ? `! ${item.label}` : item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Single source of truth for the call: the CAD line, who the patient is, and their
 * current vitals once they've been assessed.
 */
function CallStatusCard({
  call,
  vitals,
  showVitals,
  prominent,
  accent,
}: {
  call: NonNullable<ReturnType<typeof useEmtStore.getState>['call']>;
  vitals: NonNullable<ReturnType<typeof useEmtStore.getState>['vitals']>;
  showVitals: boolean;
  prominent: boolean;
  accent: string;
}) {
  const changed =
    vitals.bp !== call.vitals.bp ||
    vitals.hr !== call.vitals.hr ||
    vitals.rr !== call.vitals.rr ||
    vitals.spo2 !== call.vitals.spo2 ||
    vitals.mentalStatus !== call.vitals.mentalStatus;

  return (
    <Animated.View
      entering={enterFade(0)}
      style={[styles.statusCard, changed && showVitals && { borderColor: accent }]}
    >
      <View style={styles.statusHeader}>
        <View style={styles.statusHeaderLeft}>
          <LiveDot color={theme.colors.critical} size={7} />
          <Text style={styles.cad}>CAD DISPATCH · {call.category.toUpperCase()}</Text>
        </View>
        {showVitals ? (
          changed ? <Text style={styles.patientChanged}>PATIENT RESPONSE</Text> : null
        ) : (
          <Text style={styles.vitalsPending}>VITALS PENDING</Text>
        )}
      </View>

      <Text
        style={[
          prominent ? styles.dispatchHero : styles.dispatchLine,
          prominent && { textShadowColor: accent },
        ]}
      >
        {call.dispatch}
      </Text>
      <Text style={styles.patientSummary}>{call.patientSummary}</Text>

      {showVitals ? (
        <Animated.View
          key={`${vitals.bp}-${vitals.hr}-${vitals.rr}-${vitals.spo2}-${vitals.mentalStatus}`}
          entering={enterFade(0)}
          style={styles.vitalsBlock}
        >
          <Text style={[styles.vitalsLabel, { color: accent }]}>LIVE VITALS</Text>
          {call.archetypeId === 'cardiac_arrest' ||
          (vitals.hr === 0 && vitals.rr === 0) ? (
            <View style={styles.arrestBanner}>
              <Text style={styles.arrestBannerTitle}>PULSELESS · APNEIC</Text>
              <Text style={styles.arrestBannerText}>
                No blood pressure to obtain. Confirm pulse ≤10 seconds, then start high-quality
                CPR and apply the AED.
              </Text>
              <Text style={styles.mentalStatus}>
                Status: <Text style={styles.mentalStatusValue}>{vitals.mentalStatus}</Text>
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.vitalGrid}>
                <VitalTile label="BP" value={vitals.bp} changed={vitals.bp !== call.vitals.bp} />
                <VitalTile
                  label="HR"
                  value={String(vitals.hr)}
                  changed={vitals.hr !== call.vitals.hr}
                />
                <VitalTile
                  label="RR"
                  value={String(vitals.rr)}
                  changed={vitals.rr !== call.vitals.rr}
                />
                <VitalTile
                  label="SpO₂"
                  value={`${vitals.spo2}%`}
                  changed={vitals.spo2 !== call.vitals.spo2}
                />
              </View>
              <Text style={styles.mentalStatus}>
                Mental status: <Text style={styles.mentalStatusValue}>{vitals.mentalStatus}</Text>
              </Text>
            </>
          )}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function VitalTile({
  label,
  value,
  changed,
}: {
  label: string;
  value: string;
  changed: boolean;
}) {
  return (
    <View style={[styles.vitalTile, changed && styles.vitalTileChanged]}>
      <Text style={styles.vitalTileLabel}>{label}</Text>
      <Text style={[styles.vitalTileValue, changed && styles.vitalTileValueChanged]}>
        {value}
      </Text>
    </View>
  );
}

function SceneDevelopment({
  development,
  accent,
  delayed,
  unresolved,
}: {
  development: NonNullable<WalkthroughStep['development']>;
  accent: string;
  delayed: boolean;
  unresolved: string[];
}) {
  const elapsed = development.elapsedMinutes + (delayed ? 9 : 0);
  const headline = delayed
    ? 'Scene secured after an avoidable delay'
    : development.headline;
  const lines = delayed
    ? [
        unresolved.length > 0
          ? `${unresolved.join(', ')} remained uncontrolled when you chose to wait.`
          : 'Required scene-safety actions were incomplete when you chose to wait.',
        'Dispatch eventually escalated the response and the scene was secured.',
        'Patient contact was delayed; expect the patient’s condition to have worsened.',
      ]
    : development.lines;

  return (
    <Animated.View
      entering={enterUp(0)}
      style={[
        styles.development,
        { borderColor: delayed ? theme.colors.error : accent },
      ]}
    >
      <View style={styles.developmentHeader}>
        <Text
          style={[
            styles.developmentLabel,
            { color: delayed ? theme.colors.error : accent },
          ]}
        >
          SCENE DEVELOPMENT
        </Text>
        <Text style={styles.developmentTime}>+{elapsed} MIN</Text>
      </View>
      <Text style={styles.developmentHeadline}>{headline}</Text>
      {lines.map((line) => (
        <View key={line} style={styles.developmentRow}>
          <View
            style={[
              styles.developmentDot,
              { backgroundColor: delayed ? theme.colors.error : accent },
            ]}
          />
          <Text style={styles.developmentText}>{line}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

interface ChoiceGroup {
  label: string;
  choices: WalkthroughChoice[];
  /** Ends the step — rendered last as a solid call to action. */
  forward: boolean;
}

/** Ordered so the work to do reads top-down and the exit is always at the bottom. */
const GROUP_ORDER = [
  'PROTECT YOURSELF',
  'SCENE CONTROL',
  'ON-SCENE ACTIONS',
  'PRIMARY ASSESSMENT',
  'FOCUSED QUESTIONS',
  'INTERVENTIONS',
  'CHOOSE ONE',
  '',
];

function groupLabel(choice: WalkthroughChoice): string {
  switch (choice.actionKind) {
    case 'respond':
    case 'enter_scene':
    case 'proceed':
      return '';
    case 'ppe':
    case 'stage':
      return 'PROTECT YOURSELF';
    case 'verbalize_safe':
    case 'safety_request':
      return 'SCENE CONTROL';
    case 'abcde':
      return 'PRIMARY ASSESSMENT';
    case 'history':
    case 'check_allergies':
      return 'FOCUSED QUESTIONS';
    case 'treatment':
      return 'INTERVENTIONS';
    case 'transport_priority':
    case 'transport_destination':
      return 'CHOOSE ONE';
    default:
      return 'ON-SCENE ACTIONS';
  }
}

function groupChoices(choices: WalkthroughChoice[]): ChoiceGroup[] {
  const labels = new Map<string, WalkthroughChoice[]>();

  for (const choice of choices) {
    const label = groupLabel(choice);
    const group = labels.get(label) ?? [];
    group.push(choice);
    labels.set(label, group);
  }

  return [...labels.entries()]
    .map(([label, groupedChoices]) => ({
      label,
      choices: groupedChoices,
      forward: label === '',
    }))
    .sort((a, b) => GROUP_ORDER.indexOf(a.label) - GROUP_ORDER.indexOf(b.label));
}

function isChoiceCompleted(
  choice: WalkthroughChoice,
  state: {
    safetyActions: string[];
    sceneEntered: boolean;
    abcdeCompleted: string[];
    historyCompleted: string[];
    treatments: string[];
    transportPriority: string | null;
    destination: string | null;
  }
): boolean {
  const payload = choice.payload;
  if (!payload) return false;
  if (choice.actionKind === 'ppe' || choice.actionKind === 'stage') {
    return state.safetyActions.includes(payload);
  }
  if (choice.actionKind === 'verbalize_safe') {
    return state.safetyActions.includes('verbalize_scene_safe');
  }
  if (choice.actionKind === 'safety_request') {
    return state.safetyActions.includes(payload);
  }
  if (choice.actionKind === 'enter_scene') return state.sceneEntered;
  if (choice.actionKind === 'abcde') return state.abcdeCompleted.includes(payload);
  if (choice.actionKind === 'history' || choice.actionKind === 'check_allergies') {
    return state.historyCompleted.includes(payload);
  }
  if (choice.actionKind === 'treatment') return state.treatments.includes(payload);
  if (choice.actionKind === 'transport_priority') {
    return state.transportPriority === payload;
  }
  if (choice.actionKind === 'transport_destination') return state.destination === payload;
  return false;
}

function SituationStrip({
  reveal,
  call,
  vitals,
  showVitals,
  hazardDetail,
  accent,
}: {
  reveal: 'dispatch' | 'scene' | 'vitals' | 'none';
  call: NonNullable<ReturnType<typeof useEmtStore.getState>['call']>;
  vitals: NonNullable<ReturnType<typeof useEmtStore.getState>['vitals']>;
  showVitals: boolean;
  hazardDetail: boolean;
  accent: string;
}) {
  const statusCard = (
    <CallStatusCard
      call={call}
      vitals={vitals}
      showVitals={showVitals}
      prominent={reveal === 'dispatch'}
      accent={accent}
    />
  );

  if (reveal !== 'scene') {
    return statusCard;
  }

  const resources = describeResourcesOnArrival(call.resourcesOnScene ?? []);
  const first = (call.resourcesOnScene ?? []).length === 0;

  return (
    <View style={styles.situation}>
      {statusCard}

      <Text style={styles.sceneSectionLabel}>WHAT YOU SEE ON ARRIVAL</Text>

      <Animated.View
        entering={enterFade(0)}
        style={[styles.resources, first ? styles.resourcesFirst : styles.resourcesPresent]}
      >
        <Text style={styles.resourcesHeadline}>{resources.headline}</Text>
        {resources.lines.map((line) => (
          <Text key={line} style={styles.resourcesLine}>
            {line}
          </Text>
        ))}
      </Animated.View>

      {call.hazards.length === 0 ? (
        <Text style={styles.body}>No obvious major hazards visible.</Text>
      ) : (
        call.hazards.map((h, index) => (
          <Animated.View key={h.id} entering={enterUp(index + 1)} style={styles.hazard}>
            <Text style={styles.hazardLabel}>{h.label}</Text>
            {hazardDetail ? <Text style={styles.hazardDesc}>{h.description}</Text> : null}
          </Animated.View>
        ))
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unit: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(12),
  },
  phaseRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phaseRailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  phaseRailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  phaseRailText: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressWrap: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  score: {
    color: theme.colors.accent,
    fontFamily: 'BebasNeue',
    fontSize: fs(26),
    letterSpacing: 1,
    textShadowColor: theme.colors.amberGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  examBadge: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.critical,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.critical,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cad: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    letterSpacing: 1.5,
    fontSize: fs(11),
  },
  dispatchHero: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(36),
    letterSpacing: 1,
    lineHeight: fs(38),
    marginBottom: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  dispatchLine: {
    color: theme.colors.text,
    fontSize: fs(15),
    fontWeight: '700',
    lineHeight: fs(21),
  },
  patientSummary: {
    color: theme.colors.accentLight,
    fontSize: fs(14),
    lineHeight: fs(20),
    marginTop: 4,
  },
  patientChanged: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.8,
  },
  vitalsPending: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.8,
  },
  vitalsBlock: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  vitalsLabel: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  arrestBanner: {
    backgroundColor: theme.colors.dangerGlow,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.critical,
    padding: theme.spacing.md,
  },
  arrestBannerTitle: {
    color: theme.colors.critical,
    fontFamily: 'BebasNeue',
    fontSize: fs(28),
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  arrestBannerText: {
    color: theme.colors.text,
    fontSize: fs(13),
    lineHeight: fs(19),
    marginBottom: 8,
  },
  vitalGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  vitalTile: {
    flex: 1,
    minWidth: 58,
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  vitalTileChanged: {
    backgroundColor: theme.colors.amberGlow,
    borderColor: theme.colors.accent,
  },
  vitalTileLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
  },
  vitalTileValue: {
    color: theme.colors.text,
    fontFamily: 'SpaceMono',
    fontSize: fs(13),
    marginTop: 2,
  },
  vitalTileValueChanged: {
    color: theme.colors.accent,
  },
  mentalStatus: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    marginTop: 10,
  },
  mentalStatusValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  situation: { marginBottom: theme.spacing.md },
  development: {
    backgroundColor: theme.colors.cadGlow,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  developmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  developmentLabel: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
  },
  developmentTime: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 0.8,
  },
  developmentHeadline: {
    color: theme.colors.text,
    fontSize: fs(20),
    fontWeight: '800',
    marginBottom: 10,
  },
  developmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 5,
  },
  developmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  developmentText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  promptBlock: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  promptEyebrow: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  prompt: {
    color: theme.colors.text,
    fontSize: fs(22),
    fontWeight: '700',
    lineHeight: fs(28),
  },
  hint: {
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: fs(20),
    fontSize: fs(13),
  },
  body: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: fs(20),
    fontSize: fs(14),
  },
  hazard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  hazardLabel: { color: theme.colors.warning, fontWeight: '800', fontSize: fs(14) },
  hazardDesc: { color: theme.colors.text, marginTop: 2, fontSize: fs(14), lineHeight: fs(20) },
  resources: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  resourcesFirst: {
    backgroundColor: theme.colors.amberGlow,
    borderColor: theme.colors.accent,
  },
  resourcesPresent: {
    backgroundColor: theme.colors.cadGlow,
    borderColor: theme.colors.emsBlue,
  },
  sceneSectionLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  resourcesHeadline: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: fs(15),
    marginBottom: 4,
  },
  resourcesLine: {
    color: theme.colors.text,
    fontSize: fs(13),
    lineHeight: fs(19),
  },
  choiceGroup: {
    marginBottom: theme.spacing.lg,
  },
  forwardGroup: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  choiceGroupLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  feedback: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  feedbackGood: {
    backgroundColor: theme.colors.successGlow,
    borderColor: theme.colors.success,
  },
  feedbackBad: {
    backgroundColor: theme.colors.dangerGlow,
    borderColor: theme.colors.error,
  },
  feedbackNeutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  feedbackLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  feedbackText: { color: theme.colors.text, lineHeight: fs(20), fontSize: fs(14) },
  muted: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: fs(14),
  },
});
