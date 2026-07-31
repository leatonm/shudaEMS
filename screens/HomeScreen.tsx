import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ShiftButton } from '@/components/ui/ShiftUI';
import { BrandMark } from '@/components/ui/BrandMark';
import { PressScale, PulseOrb, enterUp } from '@/components/ui/motion';
import { categoryColor, theme } from '@/constants/theme';
import { CALL_CATEGORIES } from '@/data/emt/categories';
import { DIFFICULTY_OPTIONS } from '@/data/emt/difficulty';
import type { CallCategory, EmtDifficulty } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

export default function HomeScreen() {
  const router = useRouter();
  const startEmtCall = useEmtStore((s) => s.startCall);
  const difficulty = useEmtStore((s) => s.difficulty);
  const setDifficulty = useEmtStore((s) => s.setDifficulty);

  const handleStartCategory = (category?: CallCategory) => {
    const callId = startEmtCall(category ? { category, difficulty } : { difficulty });
    if (callId) {
      router.push(`/emt/call/${callId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PulseOrb color={theme.colors.amberGlow} size={240} top={-50} right={-70} />
      <PulseOrb
        color={theme.colors.cadGlow}
        size={280}
        top={140}
        left={-90}
        duration={4400}
        delay={600}
      />
      <PulseOrb
        color={theme.colors.violetGlow}
        size={220}
        bottom={-60}
        right={-40}
        duration={5200}
        delay={1200}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandMark />

        <Animated.View entering={enterUp(3)} style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Training aid only</Text>
          <Text style={styles.disclaimerText}>
            Not a substitute for formal EMT education, certification, medical direction, or local
            protocols.
          </Text>
        </Animated.View>

        <Animated.View entering={enterUp(4)} style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>DIFFICULTY</Text>
          <View style={styles.diffRow}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <DifficultyChip
                key={opt.id}
                label={opt.label}
                selected={difficulty === opt.id}
                accent={opt.id === 'exam' ? 'exam' : 'default'}
                onPress={() => setDifficulty(opt.id as EmtDifficulty)}
              />
            ))}
          </View>
          <Text style={styles.diffHelp}>
            {DIFFICULTY_OPTIONS.find((o) => o.id === difficulty)?.description}
          </Text>
        </Animated.View>

        <Animated.View entering={enterUp(5)} style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>CHOOSE A CATEGORY</Text>
          <Text style={styles.shiftPrompt}>
            Step-by-step skills-sheet walkthrough. Correct and incorrect options at each
            decision — stay in order like the NREMT sheet.
          </Text>

          {CALL_CATEGORIES.map((cat, index) => (
            <View key={cat.id}>
              {index > 0 ? <View style={styles.spacer} /> : null}
              <ShiftButton
                label={cat.label.toUpperCase()}
                onPress={() => handleStartCategory(cat.id)}
                variant={index === 0 ? 'primary' : 'secondary'}
                accentColor={categoryColor(cat.id)}
                index={index}
              />
              <Text style={styles.examples}>{cat.examples}</Text>
            </View>
          ))}

          <View style={styles.spacer} />
          <ShiftButton
            label="RANDOM ANY CATEGORY"
            onPress={() => handleStartCategory()}
            variant="secondary"
            index={CALL_CATEGORIES.length}
          />
        </Animated.View>

        <Animated.View entering={enterUp(6)} style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>COMPETE</Text>
          <Text style={styles.shiftPrompt}>
            Season standings for clinical judgment and patient outcomes.
          </Text>
          <ShiftButton
            label="VIEW LEADERBOARD"
            onPress={() => router.push('/emt/leaderboard')}
            variant="secondary"
            accentColor={theme.colors.accent}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DifficultyChip({
  label,
  selected,
  onPress,
  accent,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: 'default' | 'exam';
}) {
  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        selected && accent === 'exam' && styles.chipExam,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          selected && accent === 'exam' && styles.chipTextExam,
        ]}
      >
        {label}
      </Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  disclaimer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  disclaimerTitle: {
    color: theme.colors.warning,
    fontWeight: '800',
    marginBottom: 4,
    fontSize: 12,
  },
  disclaimerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  shiftCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  shiftLabel: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  shiftPrompt: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    flex: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  chipSelected: {
    borderColor: theme.colors.emsBlue,
    backgroundColor: theme.colors.cadGlow,
  },
  chipExam: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.amberGlow,
  },
  chipText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 13 },
  chipTextSelected: { color: theme.colors.accentLight },
  chipTextExam: { color: theme.colors.accent },
  diffHelp: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  examples: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 17,
  },
  spacer: { height: theme.spacing.sm },
});
