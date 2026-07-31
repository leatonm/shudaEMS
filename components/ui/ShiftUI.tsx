import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

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
}

export function ShiftButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ShiftButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    color: theme.colors.text,
    fontSize: 13,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primary: {
    backgroundColor: theme.colors.emsBlue,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#041218',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryText: {
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
});
