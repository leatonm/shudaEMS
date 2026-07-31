import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  phase?: string;
}

export function ScreenHeader({ title, subtitle, phase }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {phase ? <Text style={styles.phase}>{phase}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  phase: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});
