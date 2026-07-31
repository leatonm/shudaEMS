import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { theme } from '@/constants/theme';
import {
  formatLiveFeedback,
  showActionTips,
  showHazardDetails,
  showPhaseCoaching,
} from '@/data/emt/difficulty';
import { hazardsAreCleared } from '@/data/emt/engine';
import {
  describeResourcesOnArrival,
  resourceAlreadyOnScene,
} from '@/data/emt/resources';
import type { AbcdeStep } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

const PHASE_TITLE: Record<string, string> = {
  dispatch: 'Dispatch',
  scene_safety: 'Scene Size-Up',
  primary_survey: 'Primary Survey',
  history: 'History',
  treatment: 'Treatment',
  transport: 'Transport',
};

export default function EmtCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const difficulty = useEmtStore((s) => s.difficulty);
  const vitals = useEmtStore((s) => s.vitals);
  const safetyActions = useEmtStore((s) => s.safetyActions);
  const sceneEntered = useEmtStore((s) => s.sceneEntered);
  const abcdeCompleted = useEmtStore((s) => s.abcdeCompleted);
  const historyCompleted = useEmtStore((s) => s.historyCompleted);
  const treatments = useEmtStore((s) => s.treatments);
  const transportPriority = useEmtStore((s) => s.transportPriority);
  const destination = useEmtStore((s) => s.destination);
  const timeline = useEmtStore((s) => s.timeline);
  const totalScore = useEmtStore((s) => s.totalScore);

  const respond = useEmtStore((s) => s.respond);
  const takeSafetyAction = useEmtStore((s) => s.takeSafetyAction);
  const beginPrimarySurvey = useEmtStore((s) => s.beginPrimarySurvey);
  const assessAbcde = useEmtStore((s) => s.assessAbcde);
  const proceedToHistory = useEmtStore((s) => s.proceedToHistory);
  const takeHistory = useEmtStore((s) => s.takeHistory);
  const proceedToTreatment = useEmtStore((s) => s.proceedToTreatment);
  const applyTreatment = useEmtStore((s) => s.applyTreatment);
  const proceedToTransport = useEmtStore((s) => s.proceedToTransport);
  const chooseTransportPriority = useEmtStore((s) => s.chooseTransportPriority);
  const chooseDestination = useEmtStore((s) => s.chooseDestination);
  const completeCall = useEmtStore((s) => s.completeCall);

  const tips = showActionTips(difficulty);
  const coach = showPhaseCoaching(difficulty);
  const hazardDetail = showHazardDetails(difficulty);

  useEffect(() => {
    if (phase === 'debrief') {
      router.replace('/emt/debrief');
    }
  }, [phase, router]);

  if (!call || !vitals) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>No active call.</Text>
          <ShiftButton label="BACK" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const sceneSafe = hazardsAreCleared(call, safetyActions);
  const canPrimary = sceneEntered || sceneSafe;
  const hasAbc =
    abcdeCompleted.includes('airway') &&
    abcdeCompleted.includes('breathing') &&
    abcdeCompleted.includes('circulation');

  const lastFeedback = timeline[timeline.length - 1];
  const live =
    lastFeedback && phase !== 'dispatch'
      ? formatLiveFeedback(difficulty, lastFeedback)
      : null;

  // Exam: hide running score so they don't chase points mid-call
  const showScore = difficulty !== 'exam';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glow} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.phase}>{PHASE_TITLE[phase] ?? phase}</Text>
        <Text style={styles.unit}>
          {call.unit} · Priority {call.priority} · {difficulty.toUpperCase()}
        </Text>
        {difficulty === 'exam' ? (
          <Text style={styles.examBadge}>EXAM · critical criteria active</Text>
        ) : null}
        {showScore ? <Text style={styles.score}>Score {totalScore}</Text> : null}

        {phase === 'dispatch' && (
          <View style={styles.card}>
            <Text style={styles.cad}>CAD DISPATCH · {call.category.toUpperCase()}</Text>
            <Text style={styles.dispatch}>{call.dispatch}</Text>
            <Text style={styles.patient}>{call.patientSummary}</Text>
            {coach ? (
              <Text style={styles.hint}>
                Size up the scene first. Primary survey before deep history.
              </Text>
            ) : null}
            <ShiftButton label="RESPOND" onPress={respond} />
          </View>
        )}

        {phase === 'scene_safety' && (
          <View style={styles.section}>
            <Text style={styles.question}>Scene size-up</Text>

            <ResourcesPanel resourcesOnScene={call.resourcesOnScene ?? []} />

            {call.hazards.length === 0 ? (
              <Text style={styles.body}>
                {coach
                  ? 'No obvious major hazards on arrival.'
                  : 'Quiet residential scene on arrival.'}
              </Text>
            ) : (
              call.hazards.map((h) => (
                <View key={h.id} style={styles.hazard}>
                  <Text style={styles.hazardLabel}>{h.label}</Text>
                  {hazardDetail ? (
                    <Text style={styles.hazardDesc}>{h.description}</Text>
                  ) : null}
                </View>
              ))
            )}

            {call.safetyActions.map((action) => {
              const done = safetyActions.includes(action.id);
              const alreadyThere = resourceAlreadyOnScene(
                call.resourcesOnScene ?? [],
                action.id
              );
              const label = done
                ? `✓ ${action.label}`
                : alreadyThere
                  ? `${action.label} (already on scene)`
                  : action.label;
              return (
                <ChoiceButton
                  key={action.id}
                  label={label}
                  subtitle={
                    tips
                      ? alreadyThere
                        ? 'Already present — coordinate, do not re-request.'
                        : action.subtitle
                      : undefined
                  }
                  onPress={() => takeSafetyAction(action.id)}
                  variant={done ? 'success' : alreadyThere ? 'error' : 'default'}
                  disabled={done}
                />
              );
            })}

            <ShiftButton
              label="BEGIN PRIMARY SURVEY"
              onPress={beginPrimarySurvey}
              disabled={!canPrimary}
            />
            {!canPrimary && coach ? (
              <Text style={styles.warn}>Secure the scene before patient contact.</Text>
            ) : null}
          </View>
        )}

        {phase === 'primary_survey' && (
          <View style={styles.section}>
            <Text style={styles.question}>Primary survey</Text>
            {coach ? <Text style={styles.body}>Assess in order when possible.</Text> : null}
            {call.abcde.map((finding) => {
              const done = abcdeCompleted.includes(finding.step);
              return (
                <ChoiceButton
                  key={finding.step}
                  label={done ? `✓ ${finding.label}` : finding.label}
                  onPress={() => assessAbcde(finding.step as AbcdeStep)}
                  variant={done ? 'success' : 'default'}
                  disabled={done}
                />
              );
            })}
            <ShiftButton
              label="PROCEED TO HISTORY"
              onPress={proceedToHistory}
              disabled={!hasAbc}
            />
            {!hasAbc && coach ? (
              <Text style={styles.warn}>Complete Airway, Breathing, and Circulation first.</Text>
            ) : null}
          </View>
        )}

        {phase === 'history' && (
          <View style={styles.section}>
            <Text style={styles.question}>History</Text>
            {coach ? (
              <Text style={styles.body}>
                Focused SAMPLE / OPQRST — don&apos;t delay care for trivia.
              </Text>
            ) : null}
            {call.history.map((prompt) => {
              const done = historyCompleted.includes(prompt.id);
              return (
                <ChoiceButton
                  key={prompt.id}
                  label={
                    done
                      ? `✓ ${prompt.framework}: ${prompt.label}`
                      : `${prompt.framework}: ${prompt.label}`
                  }
                  onPress={() => takeHistory(prompt.id)}
                  variant={done ? 'success' : 'default'}
                  disabled={done}
                />
              );
            })}
            <ShiftButton label="MOVE TO TREATMENT" onPress={proceedToTreatment} />
          </View>
        )}

        {phase === 'treatment' && (
          <View style={styles.section}>
            <VitalsStrip vitals={vitals} />
            <Text style={styles.question}>Interventions</Text>
            {call.treatmentActions.map((action) => {
              const done = treatments.includes(action.id);
              const alreadyThere = resourceAlreadyOnScene(
                call.resourcesOnScene ?? [],
                action.id
              );
              const label = done
                ? `✓ ${action.label}`
                : alreadyThere
                  ? `${action.label} (already on scene)`
                  : action.label;
              return (
                <ChoiceButton
                  key={action.id}
                  label={label}
                  subtitle={
                    tips
                      ? alreadyThere
                        ? 'Already present — coordinate, do not re-request.'
                        : action.subtitle
                      : undefined
                  }
                  onPress={() => applyTreatment(action.id)}
                  variant={done ? 'success' : alreadyThere ? 'error' : 'default'}
                  disabled={done}
                />
              );
            })}
            <ShiftButton label="TRANSPORT DECISION" onPress={proceedToTransport} />
          </View>
        )}

        {phase === 'transport' && (
          <View style={styles.section}>
            <Text style={styles.question}>Transport priority</Text>
            {call.transportPriorityOptions.map((opt) => (
              <ChoiceButton
                key={opt.id}
                label={opt.label}
                subtitle={tips ? opt.subtitle : undefined}
                onPress={() => chooseTransportPriority(opt.id)}
                variant={transportPriority === opt.id ? 'success' : 'default'}
              />
            ))}

            <Text style={[styles.question, styles.spaced]}>Destination</Text>
            {call.destinationOptions.map((opt) => (
              <ChoiceButton
                key={opt.id}
                label={opt.label}
                onPress={() => chooseDestination(opt.id)}
                variant={destination === opt.id ? 'success' : 'default'}
              />
            ))}

            <ShiftButton
              label="COMPLETE CALL"
              onPress={completeCall}
              disabled={!transportPriority || !destination}
            />
          </View>
        )}

        {live && live.text !== '…' ? (
          <View
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
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourcesPanel({
  resourcesOnScene,
}: {
  resourcesOnScene: import('@/data/emt/types').OnSceneResource[];
}) {
  const info = describeResourcesOnArrival(resourcesOnScene);
  const first = resourcesOnScene.length === 0;

  return (
    <View style={[styles.resources, first ? styles.resourcesFirst : styles.resourcesPresent]}>
      <Text style={styles.resourcesLabel}>RESOURCES ON ARRIVAL</Text>
      <Text style={styles.resourcesHeadline}>{info.headline}</Text>
      {info.lines.map((line) => (
        <Text key={line} style={styles.resourcesLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function VitalsStrip({
  vitals,
}: {
  vitals: { bp: string; hr: number; rr: number; spo2: number; mentalStatus: string };
}) {
  return (
    <View style={styles.vitals}>
      <Text style={styles.vitalsLabel}>VITALS</Text>
      <Text style={styles.vitalsText}>
        BP {vitals.bp} · HR {vitals.hr} · RR {vitals.rr} · SpO₂ {vitals.spo2}% · {vitals.mentalStatus}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  glow: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.cadGlow,
  },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  phase: {
    color: theme.colors.emsBlue,
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
  examBadge: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 4,
  },
  score: {
    color: theme.colors.accent,
    fontFamily: 'BebasNeue',
    fontSize: 28,
    letterSpacing: 1,
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
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  patient: { color: theme.colors.accentLight, fontSize: 16, marginBottom: theme.spacing.md },
  hint: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg, lineHeight: 20 },
  section: { gap: 4 },
  question: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  spaced: { marginTop: theme.spacing.lg },
  body: { color: theme.colors.textMuted, marginBottom: theme.spacing.md, lineHeight: 20 },
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
    marginBottom: theme.spacing.md,
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
  warn: { color: theme.colors.warning, textAlign: 'center', marginTop: 8, fontSize: 12 },
  muted: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
  vitals: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    marginTop: theme.spacing.lg,
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
});
