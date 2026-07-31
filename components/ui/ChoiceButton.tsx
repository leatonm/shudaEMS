import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/constants/theme';

interface ChoiceButtonProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'default' | 'success' | 'error';
  disabled?: boolean;
}

export function ChoiceButton({
  label,
  subtitle,
  onPress,
  variant = 'default',
  disabled = false,
}: ChoiceButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'success' && styles.success,
        variant === 'error' && styles.error,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  success: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successGlow,
  },
  error: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.dangerGlow,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
  },
});
