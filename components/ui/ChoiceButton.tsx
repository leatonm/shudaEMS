import { StyleSheet, Text, View } from 'react-native';

import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { PressScale, enterUp } from '@/components/ui/motion';

/**
 * `task` reads as a checklist item you tick off, `primary` as the one action that
 * ends the step. Keeping them visually unrelated is what makes the board scannable.
 */
export type ChoiceVariant = 'primary' | 'task' | 'default';

interface ChoiceButtonProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  variant?: ChoiceVariant;
  completed?: boolean;
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
  completed = false,
  disabled = false,
  index = 0,
  accentColor,
}: ChoiceButtonProps) {
  const accent = accentColor ?? theme.colors.emsBlue;

  if (variant === 'primary') {
    return (
      <PressScale
        onPress={onPress}
        disabled={disabled}
        entering={enterUp(index)}
        style={[styles.cta, { backgroundColor: accent }, disabled && styles.disabled]}
      >
        <View style={styles.ctaBody}>
          <Text style={styles.ctaLabel}>{label}</Text>
          {subtitle ? <Text style={styles.ctaSubtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.ctaArrow}>›</Text>
      </PressScale>
    );
  }

  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      entering={enterUp(index)}
      style={[
        styles.row,
        completed && styles.rowCompleted,
        disabled && !completed && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.marker,
          { borderColor: completed ? theme.colors.success : accent },
          completed && styles.markerDone,
        ]}
      >
        {completed ? <Text style={styles.markerTick}>✓</Text> : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.label, completed && styles.labelCompleted]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  rowCompleted: {
    opacity: 0.7,
  },
  marker: {
    width: fs(22),
    height: fs(22),
    borderRadius: fs(11),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  markerDone: {
    backgroundColor: theme.colors.successGlow,
  },
  markerTick: {
    color: theme.colors.success,
    fontSize: fs(11),
    fontWeight: '900',
    lineHeight: fs(13),
  },
  rowBody: {
    flex: 1,
  },
  label: {
    color: theme.colors.text,
    fontSize: fs(16),
    fontWeight: '600',
    lineHeight: fs(21),
  },
  labelCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    marginTop: 2,
    lineHeight: fs(18),
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaBody: {
    flex: 1,
  },
  ctaLabel: {
    color: '#041218',
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ctaSubtitle: {
    color: 'rgba(4, 18, 24, 0.7)',
    fontSize: fs(13),
    marginTop: 2,
  },
  ctaArrow: {
    color: '#041218',
    fontSize: fs(26),
    fontWeight: '800',
    marginLeft: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.4,
  },
});
