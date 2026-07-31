import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { DispatchCard } from '@/components/ui/DispatchCard';
import { ScenePanel } from '@/components/ui/ScenePanel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { StarRating } from '@/components/ui/StarRating';
import { TreatmentLog } from '@/components/ui/TreatmentLog';
import { VitalsPanel } from '@/components/ui/VitalsPanel';
import { theme } from '@/constants/theme';
import {
  getProtocolChoices,
  getTreatmentChoices,
} from '@/lib/scenarioEngine';
import { useGameStore } from '@/store/gameStore';

const PHASE_LABELS: Record<string, string> = {
  dispatch: 'Incoming Call',
  scene: 'On Scene',
  assessment: 'Assessment',
  diagnosis: 'Leading Diagnosis',
  treatment: 'Treatment',
  outcome: 'Outcome',
};

export default function ScenarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const currentScenario = useGameStore((s) => s.currentScenario);
  const phase = useGameStore((s) => s.phase);
  const patientState = useGameStore((s) => s.patientState);
  const protocols = useGameStore((s) => s.protocols);
  const actions = useGameStore((s) => s.actions);
  const performedAssessments = useGameStore((s) => s.performedAssessments);
  const revealedClues = useGameStore((s) => s.revealedClues);
  const appliedActions = useGameStore((s) => s.appliedActions);
  const treatmentLog = useGameStore((s) => s.treatmentLog);
  const result = useGameStore((s) => s.result);
  const startScenario = useGameStore((s) => s.startScenario);
  const respondToCall = useGameStore((s) => s.respondToCall);
  const beginAssessment = useGameStore((s) => s.beginAssessment);
  const performAssessment = useGameStore((s) => s.performAssessment);
  const proceedToDiagnosis = useGameStore((s) => s.proceedToDiagnosis);
  const selectProtocol = useGameStore((s) => s.selectProtocol);
  const applyTreatment = useGameStore((s) => s.applyTreatment);
  const completeTreatment = useGameStore((s) => s.completeTreatment);
  const finishScenario = useGameStore((s) => s.finishScenario);

  useEffect(() => {
    if (id && (!currentScenario || currentScenario.id !== id)) {
      startScenario(id);
    }
  }, [id, currentScenario, startScenario]);

  if (!currentScenario || !patientState) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loading}>Connecting to CAD...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const protocolChoices = getProtocolChoices(currentScenario, protocols);
  const treatmentChoices = getTreatmentChoices(currentScenario, actions);
  const hasVitals = performedAssessments.includes('vitals');

  const handleCaseReview = () => {
    finishScenario();
    router.replace('/results');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          phase={PHASE_LABELS[phase] ?? phase}
          title={currentScenario.dispatchCard.unit}
          subtitle={
            phase === 'dispatch'
              ? 'Minimal dispatch information. Respond to learn more.'
              : undefined
          }
        />

        {phase === 'dispatch' && (
          <View style={styles.section}>
            <DispatchCard dispatch={currentScenario.dispatchCard} />
            <ShiftButton label="RESPOND" onPress={respondToCall} />
          </View>
        )}

        {phase === 'scene' && (
          <View style={styles.section}>
            <DispatchCard dispatch={currentScenario.dispatchCard} />
            <Text style={styles.notes}>{currentScenario.dispatchNotes}</Text>
            <ScenePanel appearance={currentScenario.scene.appearance} />
            <ShiftButton label="BEGIN ASSESSMENT" onPress={beginAssessment} />
          </View>
        )}

        {phase === 'assessment' && (
          <View style={styles.section}>
            <Text style={styles.question}>What do you want to assess?</Text>
            {currentScenario.assessmentOptions.map((option) => {
              const done = performedAssessments.includes(option.id);
              return (
                <ChoiceButton
                  key={option.id}
                  label={done ? `✓ ${option.label}` : `[ ${option.label} ]`}
                  onPress={() => performAssessment(option.id)}
                  variant={done ? 'success' : 'default'}
                  disabled={done}
                />
              );
            })}

            {revealedClues.length > 0 && (
              <View style={styles.cluesBox}>
                <Text style={styles.cluesLabel}>Findings</Text>
                {revealedClues.map((clue) => (
                  <Text key={clue} style={styles.clueItem}>
                    ▸ {clue}
                  </Text>
                ))}
              </View>
            )}

            <ShiftButton
              label="PROCEED TO DIAGNOSIS"
              onPress={proceedToDiagnosis}
              disabled={!hasVitals}
            />
            {!hasVitals && (
              <Text style={styles.hint}>Obtain vitals before committing to a diagnosis.</Text>
            )}
          </View>
        )}

        {phase === 'diagnosis' && (
          <View style={styles.section}>
            {hasVitals && (
              <VitalsPanel vitals={currentScenario.assessment} title="Vitals Obtained" />
            )}
            <Text style={styles.question}>What is your leading diagnosis?</Text>
            {protocolChoices.map((protocol) => (
              <ChoiceButton
                key={protocol.id}
                label={protocol.name}
                onPress={() => selectProtocol(protocol.id)}
              />
            ))}
          </View>
        )}

        {phase === 'treatment' && (
          <View style={styles.section}>
            <VitalsPanel vitals={patientState} title="Live Vitals" />
            <TreatmentLog entries={treatmentLog} />

            <Text style={styles.question}>Perform interventions</Text>
            {treatmentChoices.map((action) => {
              const applied = appliedActions.includes(action.id);
              return (
                <ChoiceButton
                  key={action.id}
                  label={applied ? `✓ ${action.name}` : action.name}
                  subtitle={action.description}
                  onPress={() => applyTreatment(action.id)}
                  variant={applied ? 'success' : 'default'}
                  disabled={applied}
                />
              );
            })}

            <View style={styles.spacer} />
            <ShiftButton label="COMPLETE TREATMENT" onPress={completeTreatment} />
          </View>
        )}

        {phase === 'outcome' && result && (
          <View style={styles.section}>
            <View
              style={[
                styles.outcomeBanner,
                result.stars >= 4
                  ? styles.feedbackSuccess
                  : result.stars >= 3
                    ? styles.feedbackPartial
                    : styles.feedbackError,
              ]}
            >
              <Text style={styles.outcomeTitle}>{result.endingTitle}</Text>
              <Text style={styles.outcomeMessage}>{result.outcomeMessage}</Text>
              <View style={styles.starsRow}>
                <StarRating stars={result.stars} />
              </View>
            </View>

            <VitalsPanel vitals={result.patientState} title="Final Patient State" />
            <TreatmentLog entries={result.treatmentLog} />

            <ShiftButton label="CASE REVIEW" onPress={handleCaseReview} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  section: {
    flex: 1,
  },
  notes: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  question: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  hint: {
    color: theme.colors.warning,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  cluesBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  cluesLabel: {
    color: theme.colors.emsBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  clueItem: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
    fontFamily: 'SpaceMono',
  },
  spacer: {
    height: theme.spacing.md,
  },
  outcomeBanner: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: theme.colors.success,
  },
  feedbackPartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: theme.colors.warning,
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: theme.colors.error,
  },
  outcomeTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  outcomeMessage: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  starsRow: {
    alignItems: 'flex-start',
  },
});
