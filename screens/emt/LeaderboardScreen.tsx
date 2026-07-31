import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LEADERBOARD_ENTRIES,
  LEADERBOARD_NOTE,
  LEADERBOARD_SEASON,
} from '@/data/emt/leaderboard';
import { theme } from '@/constants/theme';

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{LEADERBOARD_SEASON}</Text>
        <Text style={styles.title}>Standings</Text>
        <Text style={styles.subtitle}>{LEADERBOARD_NOTE}</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.colRank, styles.headerText]}>#</Text>
          <Text style={[styles.colName, styles.headerText]}>PROVIDER</Text>
          <Text style={[styles.colScore, styles.headerText]}>SCORE</Text>
        </View>

        {LEADERBOARD_ENTRIES.map((entry) => (
          <View
            key={entry.handle}
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
          </View>
        ))}

        <Text style={styles.footer}>
          Standings are sample data for the soft launch. Your runs will join the board in a later
          update.
        </Text>
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
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: 48,
    letterSpacing: 2,
    lineHeight: 50,
    marginTop: 2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    fontSize: 10,
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
    width: 28,
    color: theme.colors.textMuted,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  topRank: {
    color: theme.colors.warning,
  },
  colName: {
    flex: 1,
    paddingRight: 8,
  },
  handle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  colScore: {
    width: 56,
    textAlign: 'right',
    color: theme.colors.accentLight,
    fontFamily: 'SpaceMono',
    fontWeight: '800',
    fontSize: 14,
  },
  footer: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
});
