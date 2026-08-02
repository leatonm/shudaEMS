import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import {
  LEADERBOARD_ENTRIES,
  LEADERBOARD_NOTE,
  LEADERBOARD_SEASON,
} from '@/data/emt/leaderboard';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { enterUp } from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { selectRankTitle, useProgressStore } from '@/store/progressStore';

export default function LeaderboardScreen() {
  const totalXp = useProgressStore((s) => s.totalXp);
  const calls = useProgressStore((s) => s.recentRuns.length);
  const streak = useProgressStore((s) => s.currentStreak);
  const rankTitle = selectRankTitle(totalXp);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AppBackdrop tone="amber" />
      <ScreenScroll>
        <Animated.Text entering={enterUp(0)} style={styles.kicker}>
          {LEADERBOARD_SEASON}
        </Animated.Text>
        <Animated.Text entering={enterUp(1)} style={styles.title}>
          Standings
        </Animated.Text>
        <Animated.Text entering={enterUp(2)} style={styles.subtitle}>
          {LEADERBOARD_NOTE}
        </Animated.Text>

        <Animated.View entering={enterUp(2)} style={styles.youCard}>
          <Text style={styles.youKicker}>YOUR LOCAL PROGRESS</Text>
          <Text style={styles.youHandle}>You · {rankTitle}</Text>
          <Text style={styles.youMeta}>
            {totalXp.toLocaleString()} XP · {calls} calls
            {streak > 0 ? ` · ${streak}d streak` : ''}
          </Text>
        </Animated.View>

        <View style={styles.headerRow}>
          <Text style={[styles.colRank, styles.headerText]}>#</Text>
          <Text style={[styles.colName, styles.headerText]}>PROVIDER</Text>
          <Text style={[styles.colScore, styles.headerText]}>SCORE</Text>
        </View>

        {LEADERBOARD_ENTRIES.map((entry, index) => (
          <Animated.View
            key={entry.handle}
            entering={enterUp(index + 3)}
            style={[styles.row, entry.rank <= 3 && styles.rowTop]}
          >
            <Text style={[styles.colRank, entry.rank <= 3 && styles.topRank]}>
              {entry.rank}
            </Text>
            <View style={styles.colName}>
              <Text style={styles.handle}>{entry.handle}</Text>
              <Text style={styles.meta}>
                {entry.agency} · {entry.calls} calls · {entry.badge}
              </Text>
            </View>
            <Text style={styles.colScore}>{entry.score}</Text>
          </Animated.View>
        ))}

        <Text style={styles.footer}>
          Season board above is sample soft-launch data. Your XP and streak below are saved on this
          device.
        </Text>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(48),
    letterSpacing: 2,
    lineHeight: fs(50),
    marginTop: 2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(19),
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  youCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    backgroundColor: theme.colors.cadGlow,
    padding: 14,
    marginBottom: theme.spacing.lg,
  },
  youKicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  youHandle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(26),
    letterSpacing: 1,
  },
  youMeta: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    fontWeight: '800',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTop: {
    backgroundColor: theme.colors.cadGlow,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  colRank: {
    width: fs(28),
    color: theme.colors.textMuted,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    fontSize: fs(14),
  },
  topRank: {
    color: theme.colors.accent,
  },
  colName: {
    flex: 1,
    paddingRight: 8,
  },
  handle: {
    color: theme.colors.text,
    fontSize: fs(15),
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    marginTop: 2,
  },
  colScore: {
    width: fs(56),
    textAlign: 'right',
    color: theme.colors.accentLight,
    fontFamily: 'SpaceMono',
    fontWeight: '800',
    fontSize: fs(14),
  },
  footer: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(18),
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
});
