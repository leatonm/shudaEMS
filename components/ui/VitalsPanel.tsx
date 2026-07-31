import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { PatientState } from '@/types/models';

interface VitalsPanelProps {
  vitals: PatientState;
  title?: string;
}

export function VitalsPanel({ vitals, title = 'Vitals' }: VitalsPanelProps) {
  const items = [
    { label: 'BP', value: vitals.bp },
    { label: 'HR', value: `${vitals.hr} bpm` },
    { label: 'RR', value: `${vitals.rr} /min` },
    ...(vitals.spo2 !== undefined
      ? [{ label: 'SpO2', value: `${vitals.spo2}%` }]
      : []),
    { label: 'Temp', value: `${vitals.temp}°F` },
    { label: 'Mental Status', value: vitals.mentalStatus },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.label}
            style={[
              styles.cell,
              item.label === 'Mental Status' && styles.cellWide,
            ]}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  cell: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: '30%',
    flexGrow: 1,
  },
  cellWide: {
    minWidth: '100%',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
