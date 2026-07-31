import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ChoiceButton } from '@/components/ui/ChoiceButton';
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
import { categoryColor, theme } from '@/constants/theme';
import {
  formatLiveFeedback,
  showActionTips,
  showHazardDetails,
  showPhaseCoaching,
} from '@/data/emt/difficulty';
import { hazardsAreCleared } from '@/data/emt/engine';
import { describeResourcesOnArrival } from '@/data/emt/resources';
import { shuffleChoices } from '@/data/emt/walkthrough';
import type { WalkthroughChoice } from '@/data/emt/types';
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
  const abcdeCompleted = useEmtStore((s) => s.abcdeCompleted);
  const historyCompleted = useEmtStore((s) => s.historyCompleted);
  const treatments = useEmtStore((s) => s.treatments);
  const transportPriority = useEmtStore((s) => s.transportPriority);
  const destination = useEmtStore((s) => s.destination);
  const chooseNext = useEmtStore((s) => s.chooseNext);

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
      hazardsAreCleared(call, safetyActions),
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <LiveDot color={accent} />
          <Text style={[styles.phase, { color: accent }]}>{step.title}</Text>
        </View>
        <Text style={styles.unit}>
          {call.unit} · Priority {call.priority} · {difficulty.toUpperCase()}
        </Text>

        <PhaseRail phase={step.phase} accent={accent} completed={phaseCompletion} />

        <View style={styles.progressWrap}>
          <ProgressTrack progress={progress} color={accent} />
          <View style={styles.progressMeta}>
            <Text style={styles.progress}>PROVIDER DECISION BOARD</Text>
            {showScore ? <Text style={styles.score}>{totalScore} PTS</Text> : null}
          </View>
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
            hazardDetail={hazardDetail}
            accent={accent}
          />

          <PatientStatus
            call={call}
            vitals={vitals}
            showVitals={step.phase !== 'dispatch' && step.phase !== 'scene_safety'}
            accent={accent}
          />

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

          <View style={[styles.promptCard, { borderLeftColor: accent }]}>
            <Text style={[styles.promptLabel, { color: accent }]}>YOU ARE LEADING THIS CALL</Text>
            <Text style={styles.prompt}>{step.prompt}</Text>
            {coach && step.coachTip ? (
              <Text style={styles.hint}>{step.coachTip}</Text>
            ) : null}
          </View>

          {groups.map((group) => (
            <View key={group.label} style={styles.choiceGroup}>
              <Text style={styles.choiceGroupLabel}>{group.label}</Text>
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
                return (
                  <ChoiceButton
                    key={choice.id}
                    label={completed ? `✓ ${choice.label}` : choice.label}
                    subtitle={completed ? 'Completed' : tips ? choice.tip : undefined}
                    onPress={() => chooseNext(choice.id)}
                    index={index}
                    accentColor={accent}
                    variant={completed ? 'success' : 'default'}
                    disabled={completed}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
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

function PatientStatus({
  call,
  vitals,
  showVitals,
  accent,
}: {
  call: NonNullable<ReturnType<typeof useEmtStore.getState>['call']>;
  vitals: NonNullable<ReturnType<typeof useEmtStore.getState>['vitals']>;
  showVitals: boolean;
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
      key={`${vitals.bp}-${vitals.hr}-${vitals.rr}-${vitals.spo2}-${vitals.mentalStatus}`}
      entering={enterFade(0)}
      style={[styles.patientStatus, changed && { borderColor: accent }]}
    >
      <View style={styles.patientStatusHeader}>
        <Text style={[styles.patientStatusLabel, { color: accent }]}>LIVE PATIENT STATUS</Text>
        {changed ? <Text style={styles.patientChanged}>PATIENT RESPONSE</Text> : null}
      </View>
      {!showVitals ? (
        <>
          <Text style={styles.patientStatusSummary}>{call.patientSummary}</Text>
          <Text style={styles.patientNotAssessed}>
            Vital signs not yet obtained—complete the primary survey.
          </Text>
        </>
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

function groupChoices(choices: WalkthroughChoice[]) {
  const groups: Array<{ label: string; choices: WalkthroughChoice[] }> = [];
  const labels = new Map<string, WalkthroughChoice[]>();

  for (const choice of choices) {
    let label = 'AVAILABLE ACTIONS';
    if (choice.actionKind === 'abcde') label = 'PRIMARY ASSESSMENT';
    if (choice.actionKind === 'history' || choice.actionKind === 'check_allergies') {
      label = 'FOCUSED QUESTIONS';
    }
    if (choice.actionKind === 'treatment') label = 'INTERVENTIONS';
    if (
      choice.actionKind === 'enter_scene' ||
      choice.actionKind === 'proceed' ||
      choice.actionKind === 'trap_early_treat' ||
      choice.actionKind === 'trap_load_go'
    ) {
      label = 'MOVE THE CALL FORWARD';
    }
    if (
      choice.actionKind === 'transport_priority' ||
      choice.actionKind === 'transport_destination'
    ) {
      label = 'CHOOSE ONE';
    }
    const group = labels.get(label) ?? [];
    group.push(choice);
    labels.set(label, group);
  }

  for (const [label, groupedChoices] of labels) {
    groups.push({ label, choices: groupedChoices });
  }
  return groups;
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
  hazardDetail,
  accent,
}: {
  reveal: 'dispatch' | 'scene' | 'vitals' | 'none';
  call: NonNullable<ReturnType<typeof useEmtStore.getState>['call']>;
  hazardDetail: boolean;
  accent: string;
}) {
  const dispatchCard =
    reveal === 'dispatch' ? (
      <Animated.View entering={enterFade(0)} style={styles.card}>
        <Text style={styles.cad}>CAD DISPATCH · {call.category.toUpperCase()}</Text>
        <Text style={[styles.dispatch, { textShadowColor: accent }]}>{call.dispatch}</Text>
        <Text style={styles.patient}>{call.patientSummary}</Text>
      </Animated.View>
    ) : (
      <View style={styles.dispatchSticky}>
        <Text style={styles.cad}>CAD DISPATCH · {call.category.toUpperCase()}</Text>
        <Text style={styles.dispatchStickyText}>{call.dispatch}</Text>
        <Text style={styles.patientSticky}>{call.patientSummary}</Text>
      </View>
    );

  if (reveal === 'dispatch' || reveal === 'none') {
    return dispatchCard;
  }

  if (reveal === 'vitals') {
    return dispatchCard;
  }

  const resources = describeResourcesOnArrival(call.resourcesOnScene ?? []);
  const first = (call.resourcesOnScene ?? []).length === 0;

  return (
    <View style={styles.situation}>
      {dispatchCard}

      <Animated.View
        entering={enterFade(0)}
        style={[styles.resources, first ? styles.resourcesFirst : styles.resourcesPresent]}
      >
        <Text style={styles.resourcesLabel}>RESOURCES ON ARRIVAL</Text>
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
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phase: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  unit: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: 'IBMPlexMono',
    fontSize: 12,
  },
  phaseRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phaseRailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  phaseRailDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  phaseRailText: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressWrap: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progress: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  score: {
    color: theme.colors.accent,
    fontFamily: 'BebasNeue',
    fontSize: 22,
    letterSpacing: 1,
  },
  examBadge: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cad: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    letterSpacing: 1.5,
    fontSize: 11,
    marginBottom: theme.spacing.sm,
  },
  dispatch: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: 36,
    letterSpacing: 1,
    lineHeight: 38,
    marginBottom: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  patient: { color: theme.colors.accentLight, fontSize: 16 },
  dispatchSticky: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.critical,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dispatchStickyText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 4,
  },
  patientSticky: {
    color: theme.colors.accentLight,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  patientStatus: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  patientStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientStatusLabel: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  patientChanged: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  patientStatusSummary: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  patientNotAssessed: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  vitalGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  vitalTile: {
    flex: 1,
    minWidth: 58,
    backgroundColor: theme.colors.surface,
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
    fontSize: 9,
  },
  vitalTileValue: {
    color: theme.colors.text,
    fontFamily: 'SpaceMono',
    fontSize: 13,
    marginTop: 2,
  },
  vitalTileValueChanged: {
    color: theme.colors.accent,
  },
  mentalStatus: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  mentalStatusValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  situation: { marginBottom: theme.spacing.md },
  promptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  promptLabel: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  prompt: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  hint: {
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },
  body: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  hazard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  hazardLabel: { color: theme.colors.warning, fontWeight: '800' },
  hazardDesc: { color: theme.colors.text, marginTop: 2 },
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
  resourcesLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  resourcesHeadline: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  resourcesLine: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  choiceGroup: {
    marginBottom: theme.spacing.md,
  },
  choiceGroupLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 7,
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
    fontSize: 9,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  feedbackText: { color: theme.colors.text, lineHeight: 20 },
  muted: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
});
