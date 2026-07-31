import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { theme } from '@/constants/theme';
import { hazardsAreCleared } from '@/data/emt/engine';
import type { AbcdeStep } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

const PHASE_TITLE: Record<string, string> = {
  dispatch: 'Dispatch',
  scene_safety: 'Scene Safety',
  primary_survey: 'Primary Survey (ABCDE)',
  history: 'History (SAMPLE / OPQRST)',
  treatment: 'Treatment',
  transport: 'Transport Decision',
};

export default function EmtCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
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

  useEffect(() => {
    if (phase === 'debrief') {
      router.replace('/emt/debrief');
    }
  }, [phase, router]);

  if (!call || !vitals || (id && call.id !== id && phase === 'dispatch')) {
    // Allow mismatch briefly after navigation; store already has call
  }

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.phase}>{PHASE_TITLE[phase] ?? phase}</Text>
        <Text style={styles.unit}>{call.unit} · Priority {call.priority}</Text>
        <Text style={styles.score}>Score {totalScore}</Text>

        {phase === 'dispatch' && (
          <View style={styles.card}>
            <Text style={styles.cad}>CAD DISPATCH · {call.category.toUpperCase()}</Text>
            <Text style={styles.dispatch}>{call.dispatch}</Text>
            <Text style={styles.patient}>{call.patientSummary}</Text>
            <Text style={styles.hint}>
              Think like an EMT: safety first, then ABCs, then treat and transport.
            </Text>
            <ShiftButton label="RESPOND" onPress={respond} />
          </View>
        )}

        {phase === 'scene_safety' && (
          <View style={styles.section}>
            <Text style={styles.question}>Is the scene safe?</Text>
            {call.hazards.length === 0 ? (
              <Text style={styles.body}>No obvious major hazards on arrival. Still don PPE.</Text>
            ) : (
              call.hazards.map((h) => (
                <View key={h.id} style={styles.hazard}>
                  <Text style={styles.hazardLabel}>{h.label}</Text>
                  <Text style={styles.hazardDesc}>{h.description}</Text>
                </View>
              ))
            )}

            {call.safetyActions.map((action) => {
              const done = safetyActions.includes(action.id);
              return (
                <ChoiceButton
                  key={action.id}
                  label={done ? `✓ ${action.label}` : action.label}
                  subtitle={action.subtitle}
                  onPress={() => takeSafetyAction(action.id)}
                  variant={done ? 'success' : 'default'}
                  disabled={done}
                />
              );
            })}

            <ShiftButton
              label="BEGIN PRIMARY SURVEY"
              onPress={beginPrimarySurvey}
              disabled={!canPrimary}
            />
            {!canPrimary && (
              <Text style={styles.warn}>
                Clear hazards / don PPE, then enter the scene before patient contact.
              </Text>
            )}
          </View>
        )}

        {phase === 'primary_survey' && (
          <View style={styles.section}>
            <Text style={styles.question}>Primary assessment — ABCDE</Text>
            <Text style={styles.body}>Tap each step. Order matters.</Text>
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
            {!hasAbc && (
              <Text style={styles.warn}>Complete Airway, Breathing, and Circulation first.</Text>
            )}
          </View>
        )}

        {phase === 'history' && (
          <View style={styles.section}>
            <Text style={styles.question}>Gather history as needed</Text>
            <Text style={styles.body}>
              Unstable patients get a focused SAMPLE/OPQRST — don&apos;t delay transport for trivia.
            </Text>
            {call.history.map((prompt) => {
              const done = historyCompleted.includes(prompt.id);
              return (
                <ChoiceButton
                  key={prompt.id}
                  label={done ? `✓ ${prompt.framework}: ${prompt.label}` : `${prompt.framework}: ${prompt.label}`}
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
            <Text style={styles.question}>EMT-scope interventions</Text>
            {call.treatmentActions.map((action) => {
              const done = treatments.includes(action.id);
              return (
                <ChoiceButton
                  key={action.id}
                  label={done ? `✓ ${action.label}` : action.label}
                  subtitle={action.subtitle}
                  onPress={() => applyTreatment(action.id)}
                  variant={done ? 'success' : 'default'}
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
                subtitle={opt.subtitle}
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

        {lastFeedback && phase !== 'dispatch' && (
          <View
            style={[
              styles.feedback,
              lastFeedback.severity === 'good'
                ? styles.feedbackGood
                : lastFeedback.severity === 'bad'
                  ? styles.feedbackBad
                  : styles.feedbackWarn,
            ]}
          >
            <Text style={styles.feedbackText}>{lastFeedback.message}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VitalsStrip({
  vitals,
}: {
  vitals: { bp: string; hr: number; rr: number; spo2: number; mentalStatus: string };
}) {
  return (
    <View style={styles.vitals}>
      <Text style={styles.vitalsLabel}>LIVE VITALS</Text>
      <Text style={styles.vitalsText}>
        BP {vitals.bp} · HR {vitals.hr} · RR {vitals.rr} · SpO₂ {vitals.spo2}% · {vitals.mentalStatus}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  phase: {
    color: theme.colors.emsBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  unit: { color: theme.colors.textMuted, marginTop: 4, fontFamily: 'SpaceMono' },
  score: { color: theme.colors.warning, fontWeight: '800', marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  cad: {
    color: theme.colors.error,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 11,
    marginBottom: theme.spacing.sm,
  },
  dispatch: { color: theme.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8 },
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
  warn: { color: theme.colors.warning, textAlign: 'center', marginTop: 8, fontSize: 12 },
  muted: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
  vitals: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
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
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: theme.colors.success,
  },
  feedbackWarn: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: theme.colors.warning,
  },
  feedbackBad: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: theme.colors.error,
  },
  feedbackText: { color: theme.colors.text, lineHeight: 20 },
});
