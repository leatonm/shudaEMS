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
import { describeResourcesOnArrival } from '@/data/emt/resources';
import { shuffleChoices } from '@/data/emt/walkthrough';
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
  const live =
    lastFeedback && step.phase !== 'dispatch'
      ? formatLiveFeedback(difficulty, lastFeedback)
      : null;

  const progress = (stepIndex + 1) / Math.max(1, steps.length);

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

        <View style={styles.progressWrap}>
          <ProgressTrack progress={progress} color={accent} />
          <View style={styles.progressMeta}>
            <Text style={styles.progress}>
              STEP {stepIndex + 1} / {steps.length}
            </Text>
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
            vitals={vitals}
            hazardDetail={hazardDetail}
            accent={accent}
          />

          <View style={[styles.promptCard, { borderLeftColor: accent }]}>
            <Text style={[styles.promptLabel, { color: accent }]}>WHAT DO YOU DO NEXT?</Text>
            <Text style={styles.prompt}>{step.prompt}</Text>
            {coach && step.coachTip ? (
              <Text style={styles.hint}>{step.coachTip}</Text>
            ) : null}
          </View>

          {shuffled.map((choice, index) => (
            <ChoiceButton
              key={choice.id}
              label={choice.label}
              subtitle={tips ? choice.tip : undefined}
              onPress={() => chooseNext(choice.id)}
              index={index}
              accentColor={accent}
            />
          ))}
        </Animated.View>

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
            <Text style={styles.feedbackText}>{live.text}</Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SituationStrip({
  reveal,
  call,
  vitals,
  hazardDetail,
  accent,
}: {
  reveal: 'dispatch' | 'scene' | 'vitals' | 'none';
  call: NonNullable<ReturnType<typeof useEmtStore.getState>['call']>;
  vitals: NonNullable<ReturnType<typeof useEmtStore.getState>['vitals']>;
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

      {reveal === 'vitals' ? (
        <Animated.View entering={enterFade(1)} style={styles.vitals}>
          <Text style={styles.vitalsLabel}>VITALS</Text>
          <Text style={styles.vitalsText}>
            BP {vitals.bp} · HR {vitals.hr} · RR {vitals.rr} · SpO₂ {vitals.spo2}% ·{' '}
            {vitals.mentalStatus}
          </Text>
        </Animated.View>
      ) : null}
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
  vitals: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  vitalsLabel: {
    color: theme.colors.emsBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vitalsText: { color: theme.colors.text, fontFamily: 'SpaceMono', fontSize: 13 },
  feedback: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
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
  feedbackText: { color: theme.colors.text, lineHeight: 20 },
  muted: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
});
