import { StyleSheet, Text, View } from 'react-native';

import { getNextRank, getRankFromXp, getRankProgress } from '@/lib/rankEngine';
import { theme } from '@/constants/theme';

interface RankBadgeProps {
  totalXp: number;
}

export function RankBadge({ totalXp }: RankBadgeProps) {
  const rank = getRankFromXp(totalXp);
  const next = getNextRank(totalXp);
  const progress = getRankProgress(totalXp);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>RANK</Text>
        <Text style={styles.rank}>{rank.title}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      {next ? (
        <Text style={styles.next}>
          {next.minXp - totalXp} XP to {next.title}
        </Text>
      ) : (
        <Text style={styles.next}>Maximum rank achieved</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  rank: {
    color: theme.colors.emsBlue,
    fontSize: 18,
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.emsBlue,
    borderRadius: 3,
  },
  next: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
