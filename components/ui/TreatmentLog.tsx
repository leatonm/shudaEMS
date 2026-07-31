import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { TreatmentLogEntry } from '@/types/models';

interface TreatmentLogProps {
  entries: TreatmentLogEntry[];
}

export function TreatmentLog({ entries }: TreatmentLogProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Patient Status</Text>
        <Text style={styles.empty}>No interventions performed yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Status</Text>
      {entries.map((entry, index) => (
        <View key={`${entry.actionId}-${entry.timestamp}-${index}`} style={styles.entry}>
          <Text style={styles.bullet}>▸</Text>
          <Text style={styles.message}>{entry.message}</Text>
        </View>
      ))}
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
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.accentLight,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  bullet: {
    color: theme.colors.success,
    fontSize: 14,
    marginRight: theme.spacing.sm,
    marginTop: 1,
  },
  message: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
