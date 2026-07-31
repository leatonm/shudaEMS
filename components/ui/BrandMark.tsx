import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { enterDown, enterUp } from '@/components/ui/motion';

interface BrandMarkProps {
  /** Compact for stacked nav headers */
  compact?: boolean;
}

/** Hero wordmark — dispatch-bay identity, not a generic eyebrow + headline. */
export function BrandMark({ compact = false }: BrandMarkProps) {
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [sweep]);

  const ruleStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + sweep.value * 0.55,
    transform: [{ scaleX: 0.7 + sweep.value * 0.3 }],
  }));

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
      <Animated.Text entering={enterDown(0)} style={styles.wordmark}>
        RESPONSE
      </Animated.Text>
      <Animated.View entering={enterUp(1)} style={styles.subRow}>
        <Text style={styles.emt}>EMT</Text>
        <Animated.View style={[styles.subRule, ruleStyle]} />
        <Text style={styles.simulator}>SIMULATOR</Text>
      </Animated.View>
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
    fontSize: fs(64),
    lineHeight: fs(68),
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: theme.colors.cadGlowStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
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
    fontSize: fs(28),
    letterSpacing: 3,
  },
  subRule: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.accent,
  },
  simulator: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 2,
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
    fontSize: fs(9),
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 1.5,
    marginTop: -1,
  },
});
