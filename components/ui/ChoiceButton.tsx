import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { PressScale, enterUp } from '@/components/ui/motion';

interface ChoiceButtonProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'default' | 'success' | 'error';
  disabled?: boolean;
  /** Position in the list — drives the stagger-in delay */
  index?: number;
  accentColor?: string;
}

export function ChoiceButton({
  label,
  subtitle,
  onPress,
  variant = 'default',
  disabled = false,
  index = 0,
  accentColor,
}: ChoiceButtonProps) {
  const barColor =
    accentColor ??
    (variant === 'success'
      ? theme.colors.success
      : variant === 'error'
        ? theme.colors.error
        : theme.colors.emsBlue);

  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      entering={enterUp(index)}
      style={[
        styles.button,
        variant === 'success' && styles.success,
        variant === 'error' && styles.error,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  success: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successGlow,
  },
  error: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.dangerGlow,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
});
