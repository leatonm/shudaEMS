import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShiftButton } from '@/components/ui/ShiftUI';
import { StarRating } from '@/components/ui/StarRating';
import { theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

export default function EmtDebriefScreen() {
  const router = useRouter();
  const result = useEmtStore((s) => s.result);
  const call = useEmtStore((s) => s.call);
  const startCall = useEmtStore((s) => s.startCall);
  const reset = useEmtStore((s) => s.reset);

  const handleNext = (archetypeId?: string) => {
    const id = startCall(archetypeId);
    if (id) router.replace(`/emt/call/${id}`);
  };

  const handleHome = () => {
    reset();
    router.replace('/');
  };

  if (!result || !call) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>No debrief available.</Text>
          <ShiftButton label="HOME" onPress={handleHome} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Debrief</Text>
        <Text style={styles.subheader}>{result.debrief.title}</Text>

        <View style={styles.summary}>
          <StarRating stars={result.stars} />
          <Text style={styles.outcome}>
            Patient: {result.patientOutcome.toUpperCase()} · Score {result.totalScore}
          </Text>
          <Text style={styles.summaryText}>{result.debrief.summary}</Text>
        </View>

        <SkillRow scores={result.skillScores} />

        <Section title="What went well">
          {result.debrief.whatWentWell.map((item) => (
            <Bullet key={item} icon="✓" color={theme.colors.success} text={item} />
          ))}
        </Section>

        <Section title="Improve next time">
          {result.debrief.improveNext.map((item) => (
            <Bullet key={item} icon="→" color={theme.colors.warning} text={item} />
          ))}
        </Section>

        <Section title="Universal principles">
          {result.debrief.universalPrinciples.map((item) => (
            <Bullet key={item} icon="•" color={theme.colors.accentLight} text={item} />
          ))}
        </Section>

        {result.debrief.protocolNotes && result.debrief.protocolNotes.length > 0 && (
          <Section title="Protocol-dependent (region matters)">
            {result.debrief.protocolNotes.map((item) => (
              <Bullet key={item} icon="!" color={theme.colors.emsBlue} text={item} />
            ))}
          </Section>
        )}

        <View style={styles.pearl}>
          <Text style={styles.pearlLabel}>Clinical pearl</Text>
          <Text style={styles.pearlText}>{result.debrief.pearl}</Text>
        </View>

        <Section title="Call timeline">
          {result.timeline.map((entry, index) => (
            <View key={`${entry.actionId}-${index}`} style={styles.timelineRow}>
              <Text style={styles.time}>
                {formatMs(entry.atMs)} · {entry.severity === 'good' ? '+' : ''}
                {entry.scoreDelta}
              </Text>
              <Text style={styles.timelineLabel}>{entry.label}</Text>
              <Text style={styles.timelineMsg}>{entry.message}</Text>
            </View>
          ))}
        </Section>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Training aid only</Text>
          <Text style={styles.disclaimerText}>
            This simulator is for educational practice. It is not a substitute for formal EMT
            education, certification, medical direction, or your local protocols.
          </Text>
        </View>

        <ShiftButton label="ANOTHER CHEST PAIN CALL" onPress={() => handleNext('chest_pain')} />
        <ShiftButton label="STROKE CALL" onPress={() => handleNext('stroke')} variant="secondary" />
        <ShiftButton label="RANDOM CALL" onPress={() => handleNext()} variant="secondary" />
        <ShiftButton label="END SESSION" onPress={handleHome} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletIcon, { color }]}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function SkillRow({
  scores,
}: {
  scores: {
    scene_safety: number;
    assessment: number;
    treatment: number;
    transport: number;
    communication: number;
  };
}) {
  const entries = [
    ['Safety', scores.scene_safety],
    ['Assess', scores.assessment],
    ['Treat', scores.treatment],
    ['Transport', scores.transport],
    ['Comms', scores.communication],
  ] as const;

  return (
    <View style={styles.skills}>
      {entries.map(([label, value]) => (
        <View key={label} style={styles.skillChip}>
          <Text style={styles.skillLabel}>{label}</Text>
          <Text style={styles.skillValue}>{Math.round(value)}</Text>
        </View>
      ))}
    </View>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  header: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  subheader: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  summary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  outcome: { color: theme.colors.accentLight, fontWeight: '700' },
  summaryText: { color: theme.colors.text, textAlign: 'center', lineHeight: 21 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  skillChip: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  skillLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' },
  skillValue: { color: theme.colors.text, fontWeight: '800', fontFamily: 'SpaceMono' },
  section: { marginBottom: theme.spacing.md },
  sectionTitle: {
    color: theme.colors.emsBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bulletIcon: { width: 18, fontWeight: '800' },
  bulletText: { color: theme.colors.text, flex: 1, lineHeight: 20 },
  pearl: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pearlLabel: {
    color: theme.colors.emsBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pearlText: { color: theme.colors.text, lineHeight: 21 },
  timelineRow: {
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
    paddingLeft: 12,
    marginBottom: 12,
  },
  time: { color: theme.colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11 },
  timelineLabel: { color: theme.colors.text, fontWeight: '700' },
  timelineMsg: { color: theme.colors.textMuted, lineHeight: 18 },
  disclaimer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerTitle: { color: theme.colors.warning, fontWeight: '800', marginBottom: 4 },
  disclaimerText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  muted: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
});
