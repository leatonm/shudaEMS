import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseDebriefCard } from '@/components/ui/CaseDebriefCard';
import { RankBadge } from '@/components/ui/RankBadge';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { StarRating } from '@/components/ui/StarRating';
import { theme } from '@/constants/theme';
import { getPerformanceLabel } from '@/lib/rankEngine';
import { useGameStore } from '@/store/gameStore';

export default function ResultsScreen() {
  const router = useRouter();
  const result = useGameStore((s) => s.result);
  const totalXp = useGameStore((s) => s.totalXp);
  const resetSession = useGameStore((s) => s.resetSession);
  const startShift = useGameStore((s) => s.startShift);

  const handleNextCall = () => {
    const scenarioId = startShift();
    if (scenarioId) {
      router.replace(`/scenario/${scenarioId}`);
    }
  };

  const handleEndShift = () => {
    resetSession();
    router.replace('/');
  };

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.empty}>No case review available.</Text>
          <ShiftButton label="RETURN TO ACADEMY" onPress={handleEndShift} />
        </View>
      </SafeAreaView>
    );
  }

  const performanceLabel = getPerformanceLabel(result);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Case Review</Text>
        <Text style={styles.subheader}>
          What the protocol says · what you did · what to remember
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.performance}>{performanceLabel}</Text>
          <StarRating stars={result.stars} />
          <Text style={styles.xp}>+{result.xpEarned} XP</Text>
        </View>

        <CaseDebriefCard
          debrief={result.debrief}
          caseReview={result.caseReview}
          insight={result.unlockedInsight}
        />

        <RankBadge totalXp={totalXp} />

        <ShiftButton label="NEXT CALL" onPress={handleNextCall} />
        <ShiftButton label="END SHIFT" onPress={handleEndShift} variant="secondary" />
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
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  header: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  subheader: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  performance: {
    color: theme.colors.accentLight,
    fontSize: 14,
    fontWeight: '700',
  },
  xp: {
    color: theme.colors.warning,
    fontSize: 28,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
});
