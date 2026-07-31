import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { ProtocolInsight } from '@/types/models';

interface ProtocolInsightCardProps {
  insight: ProtocolInsight;
  isNew?: boolean;
}

export function ProtocolInsightCard({
  insight,
  isNew = false,
}: ProtocolInsightCardProps) {
  return (
    <View style={styles.container}>
      {isNew ? (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Protocol Insight Unlocked</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{insight.title}</Text>
      <Text style={styles.body}>{insight.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  newBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.accentLight,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  body: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
