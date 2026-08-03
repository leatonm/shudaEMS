import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  /** Soft outer glow — matches home / dispatch energy. */
  glow?: boolean;
}

export function ShiftButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accentColor,
  index = 0,
  style,
  glow = false,
}: ShiftButtonProps) {
  const accent = accentColor ?? theme.colors.emsBlue;

  if (variant === 'primary') {
    return (
      <PressScale
        onPress={onPress}
        disabled={disabled}
        entering={enterUp(index)}
        style={[
          styles.buttonOuter,
          glow
            ? {
                shadowColor: accent,
                shadowOpacity: 0.55,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }
            : null,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[accent, `${accent}CC`, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </LinearGradient>
      </PressScale>
    );
  }

  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      entering={enterUp(index)}
      style={[
        styles.button,
        styles.secondary,
        accentColor ? { borderColor: accentColor } : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.secondaryText,
          accentColor ? { color: accentColor } : null,
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
  buttonOuter: {
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#041218',
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(15),
    letterSpacing: 1.4,
  },
  secondaryText: {
    color: theme.colors.text,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(14),
    letterSpacing: 1,
  },
});
