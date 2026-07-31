import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { StarRating } from '@/components/ui/StarRating';
import { PopIn, PulseOrb, enterUp } from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { categoryColor, theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

export default function EmtDebriefScreen() {
  const router = useRouter();
  const result = useEmtStore((s) => s.result);
  const call = useEmtStore((s) => s.call);
  const difficulty = useEmtStore((s) => s.difficulty);
  const startCall = useEmtStore((s) => s.startCall);
  const reset = useEmtStore((s) => s.reset);

  const handleNext = (category?: import('@/data/emt/types').CallCategory) => {
    const id = startCall(category ? { category } : undefined);
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

  const passed = result.skillsSheetPass;
  const accent = categoryColor(call.category);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowTop} pointerEvents="none" />
      <PulseOrb
        color={passed ? theme.colors.successGlow : theme.colors.dangerGlow}
        size={300}
        top={-90}
        right={-90}
      />
      <ScreenScroll>
        <Animated.Text entering={enterUp(0)} style={styles.header}>
          Debrief
        </Animated.Text>
        <Animated.Text entering={enterUp(1)} style={styles.subheader}>
          {result.debrief.title} · {call.category.toUpperCase()} · {difficulty.toUpperCase()}
        </Animated.Text>

        <PopIn
          delay={140}
          style={[styles.sheetBanner, passed ? styles.sheetPass : styles.sheetFail]}
        >
          <Text style={styles.sheetKicker}>NREMT-STYLE SKILLS SHEET</Text>
          <Text style={[styles.sheetResult, passed ? styles.passText : styles.failText]}>
            {passed ? 'PASS' : 'FAIL'}
          </Text>
          <Text style={styles.sheetHint}>
            {passed
              ? 'No critical criteria missed.'
              : difficulty === 'exam'
                ? 'Critical fail — automatic exam failure.'
                : 'Would fail a skills sheet. Score capped for learning.'}
          </Text>
        </PopIn>

        <Animated.View
          entering={enterUp(3)}
          style={[styles.summary, { borderColor: accent }]}
        >
          <StarRating stars={result.stars} />
          <Text style={styles.outcome}>
            Patient: {result.patientOutcome.toUpperCase()} · Score {result.totalScore}
          </Text>
          <Text style={styles.summaryText}>{result.debrief.summary}</Text>
        </Animated.View>

        {result.criticalFails.length > 0 ? (
          <Section title="Critical criteria" index={4}>
            {result.criticalFails.map((fail) => (
              <View key={fail.id} style={styles.critCard}>
                <Text style={styles.critLabel}>{fail.label}</Text>
                <Text style={styles.critDetail}>{fail.detail}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {result.debrief.flowMisses && result.debrief.flowMisses.length > 0 ? (
          <Section title="Flow misses" index={5}>
            {result.debrief.flowMisses.map((item) => (
              <Bullet key={item} icon="!" color={theme.colors.critical} text={item} />
            ))}
          </Section>
        ) : null}

        <SkillRow scores={result.skillScores} />

        <Section title="What went well" index={6}>
          {result.debrief.whatWentWell.map((item) => (
            <Bullet key={item} icon="✓" color={theme.colors.success} text={item} />
          ))}
        </Section>

        <Section title="Improve next time" index={7}>
          {result.debrief.improveNext.map((item) => (
            <Bullet key={item} icon="→" color={theme.colors.warning} text={item} />
          ))}
        </Section>

        <Section title="Universal principles" index={8}>
          {result.debrief.universalPrinciples.map((item) => (
            <Bullet key={item} icon="•" color={theme.colors.accentLight} text={item} />
          ))}
        </Section>

        {result.debrief.protocolNotes && result.debrief.protocolNotes.length > 0 && (
          <Section title="Protocol-dependent (region matters)" index={8}>
            {result.debrief.protocolNotes.map((item) => (
              <Bullet key={item} icon="!" color={theme.colors.emsBlue} text={item} />
            ))}
          </Section>
        )}

        <View style={styles.pearl}>
          <Text style={styles.pearlLabel}>Clinical pearl</Text>
          <Text style={styles.pearlText}>{result.debrief.pearl}</Text>
        </View>

        <Section title="Call timeline" index={8}>
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

        <ShiftButton
          label={`ANOTHER ${call.category.toUpperCase()} CALL`}
          onPress={() => handleNext(call.category)}
          accentColor={accent}
        />
        <ShiftButton label="RANDOM CALL" onPress={() => handleNext()} variant="secondary" />
        <ShiftButton label="END SESSION" onPress={handleHome} variant="secondary" />
      </ScreenScroll>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  index = 0,
}: {
  title: string;
  children: ReactNode;
  index?: number;
}) {
  return (
    <Animated.View entering={enterUp(index)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Animated.View>
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
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: theme.colors.cadGlow,
    opacity: 0.35,
  },
  centered: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  header: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(42),
    letterSpacing: 1.5,
    lineHeight: fs(44),
  },
  subheader: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(11),
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
    marginTop: 4,
  },
  sheetBanner: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  sheetPass: {
    backgroundColor: theme.colors.successGlow,
    borderColor: theme.colors.success,
  },
  sheetFail: {
    backgroundColor: theme.colors.dangerGlow,
    borderColor: theme.colors.critical,
  },
  sheetKicker: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  sheetResult: { fontSize: fs(32), fontWeight: '900', marginTop: 4 },
  passText: { color: theme.colors.success },
  failText: { color: theme.colors.critical },
  sheetHint: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    textAlign: 'center',
    marginTop: 4,
    lineHeight: fs(17),
  },
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
  outcome: { color: theme.colors.accentLight, fontWeight: '700', fontSize: fs(14) },
  summaryText: {
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: fs(21),
    fontSize: fs(14),
  },
  critCard: {
    backgroundColor: theme.colors.dangerGlow,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.critical,
    padding: theme.spacing.md,
    marginBottom: 8,
  },
  critLabel: {
    color: theme.colors.critical,
    fontWeight: '800',
    marginBottom: 4,
    fontSize: fs(14),
  },
  critDetail: { color: theme.colors.text, lineHeight: fs(19), fontSize: fs(13) },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  skillChip: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  skillLabel: { color: theme.colors.textMuted, fontSize: fs(10), fontWeight: '700' },
  skillValue: {
    color: theme.colors.text,
    fontWeight: '800',
    fontFamily: 'SpaceMono',
    fontSize: fs(14),
  },
  section: { marginBottom: theme.spacing.md },
  sectionTitle: {
    color: theme.colors.emsBlue,
    fontSize: fs(12),
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bulletIcon: { width: fs(18), fontWeight: '800', fontSize: fs(14) },
  bulletText: { color: theme.colors.text, flex: 1, lineHeight: fs(20), fontSize: fs(14) },
  pearl: {
    backgroundColor: theme.colors.amberGlow,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pearlLabel: {
    color: theme.colors.accent,
    fontSize: fs(10),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pearlText: { color: theme.colors.text, lineHeight: fs(21), fontSize: fs(14) },
  timelineRow: {
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
    paddingLeft: 12,
    marginBottom: 12,
  },
  time: { color: theme.colors.textMuted, fontFamily: 'SpaceMono', fontSize: fs(11) },
  timelineLabel: { color: theme.colors.text, fontWeight: '700', fontSize: fs(14) },
  timelineMsg: { color: theme.colors.textMuted, lineHeight: fs(18), fontSize: fs(13) },
  disclaimer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerTitle: {
    color: theme.colors.warning,
    fontWeight: '800',
    marginBottom: 4,
    fontSize: fs(14),
  },
  disclaimerText: { color: theme.colors.textMuted, fontSize: fs(12), lineHeight: fs(18) },
  muted: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: fs(14),
  },
});
