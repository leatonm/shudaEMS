import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShiftButton } from '@/components/ui/ShiftUI';
import { BrandMark } from '@/components/ui/BrandMark';
import { theme } from '@/constants/theme';
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
      <View style={styles.glowAmber} pointerEvents="none" />
      <View style={styles.glowTeal} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandMark />

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Training aid only</Text>
          <Text style={styles.disclaimerText}>
            Not a substitute for formal EMT education, certification, medical direction, or local
            protocols.
          </Text>
        </View>

        <View style={styles.shiftCard}>
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
        </View>

        <View style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>CHOOSE A CATEGORY</Text>
          <Text style={styles.shiftPrompt}>
            You pick the lane — Medical, Trauma, Peds, OB, or MCI. The generator builds the call.
          </Text>

          {CALL_CATEGORIES.map((cat, index) => (
            <View key={cat.id}>
              {index > 0 ? <View style={styles.spacer} /> : null}
              <ShiftButton
                label={cat.label.toUpperCase()}
                onPress={() => handleStartCategory(cat.id)}
                variant={index === 0 ? 'primary' : 'secondary'}
              />
              <Text style={styles.examples}>{cat.examples}</Text>
            </View>
          ))}

          <View style={styles.spacer} />
          <ShiftButton
            label="RANDOM ANY CATEGORY"
            onPress={() => handleStartCategory()}
            variant="secondary"
          />
        </View>

        <View style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>COMPETE</Text>
          <Text style={styles.shiftPrompt}>
            Season standings for clinical judgment and patient outcomes.
          </Text>
          <ShiftButton
            label="VIEW LEADERBOARD"
            onPress={() => router.push('/emt/leaderboard')}
            variant="secondary"
          />
        </View>
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
    <Pressable
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  glowAmber: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.amberGlow,
  },
  glowTeal: {
    position: 'absolute',
    top: 120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.colors.cadGlow,
  },
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
