import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface BrandMarkProps {
  /** Compact for stacked nav headers */
  compact?: boolean;
}

/** Hero wordmark — dispatch-bay identity, not a generic eyebrow + headline. */
export function BrandMark({ compact = false }: BrandMarkProps) {
  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <Text style={styles.compactKicker}>TRAINING NET</Text>
        <Text style={styles.compactTitle}>RESPONSE</Text>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <Text style={styles.wordmark}>RESPONSE</Text>
      <View style={styles.subRow}>
        <Text style={styles.emt}>EMT</Text>
        <View style={styles.subRule} />
        <Text style={styles.simulator}>SIMULATOR</Text>
      </View>

      <Text style={styles.tagline}>
        Size up. Assess. Decide. Debrief like the skills sheet.
      </Text>
    </View>
  );
}

interface CadHeaderTitleProps {
  title: string;
  channel?: string;
}

/** Stack nav title — radio strip instead of plain uppercase text. */
export function CadHeaderTitle({ title, channel = 'TRAINING NET' }: CadHeaderTitleProps) {
  return (
    <View style={styles.headerWrap}>
      <Text style={styles.headerChannel}>{channel}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  wordmark: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: theme.spacing.md,
    alignSelf: 'stretch',
  },
  emt: {
    color: theme.colors.emsBlue,
    fontFamily: 'BebasNeue',
    fontSize: 28,
    letterSpacing: 3,
  },
  subRule: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.accent,
    opacity: 0.85,
  },
  simulator: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 11,
    letterSpacing: 2,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
    textAlign: 'center',
  },
  compactWrap: {
    alignItems: 'flex-start',
  },
  compactKicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  compactTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: 22,
    letterSpacing: 1,
    marginTop: -2,
  },
  headerWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerChannel: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: 22,
    letterSpacing: 1.5,
    marginTop: -1,
  },
});
