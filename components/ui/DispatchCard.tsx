import { StyleSheet, Text, View } from 'react-native';

import { priorityColors, theme } from '@/constants/theme';
import type { DispatchCard as DispatchCardData } from '@/types/models';

interface DispatchCardProps {
  dispatch: DispatchCardData;
}

export function DispatchCard({ dispatch }: DispatchCardProps) {
  const priorityColor = priorityColors[dispatch.priority] ?? theme.colors.emsBlue;

  return (
    <View style={[styles.card, { borderColor: priorityColor }]}>
      <View style={styles.header}>
        <Text style={[styles.priority, { color: priorityColor }]}>
          PRIORITY {dispatch.priority}
        </Text>
        <Text style={styles.unit}>{dispatch.unit}</Text>
      </View>
      <Text style={styles.complaint}>{dispatch.chiefComplaint}</Text>
      <Text style={styles.patient}>{dispatch.patientSummary}</Text>
      <View style={styles.footer}>
        <Text style={styles.eta}>ETA {dispatch.eta}</Text>
        <View style={[styles.liveDot, { backgroundColor: priorityColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  priority: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  unit: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
  complaint: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xs,
  },
  patient: {
    color: theme.colors.accentLight,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  eta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
