import { StyleSheet, Text, View } from 'react-native';

import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { PressScale, enterUp } from '@/components/ui/motion';

interface MasteryCardProps {
  protocolName: string;
  solved: number;
  total: number;
}

export function MasteryCard({ protocolName, solved, total }: MasteryCardProps) {
  const progress = total > 0 ? solved / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{protocolName} Mastery</Text>
        <Text style={styles.count}>
          {solved}/{total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

interface ShiftButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accentColor?: string;
  index?: number;
  style?: object;
}

export function ShiftButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accentColor,
  index = 0,
  style,
}: ShiftButtonProps) {
  const tint =
    variant === 'primary'
      ? { backgroundColor: accentColor ?? theme.colors.emsBlue }
      : accentColor
        ? { borderColor: accentColor }
        : null;

  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      entering={enterUp(index)}
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        tint,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.secondaryText,
          variant === 'secondary' && accentColor ? { color: accentColor } : null,
        ]}
      >
        {label}
      </Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    fontWeight: '600',
  },
  count: {
    color: theme.colors.text,
    fontSize: fs(13),
    fontWeight: '800',
    fontFamily: 'SpaceMono',
  },
  track: {
    height: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primary: {
    backgroundColor: theme.colors.emsBlue,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#041218',
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryText: {
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
});
