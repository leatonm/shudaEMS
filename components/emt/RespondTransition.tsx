import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Image, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';

const DRIVE_MS = 3200;

/**
 * Full-screen flare when the student hits RESPOND —
 * siren strobes, radio ack, ambulance racing to the call.
 */
export function RespondTransition({
  visible,
  unit,
  onComplete,
}: {
  visible: boolean;
  unit: string;
  onComplete: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const drive = useSharedValue(0);
  const strobe = useSharedValue(0);
  const shake = useSharedValue(0);
  const sweep = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const ambulanceW = Math.round(Math.min(width * 0.92, 340));
  const ambulanceH = Math.round(ambulanceW * 0.58);
  // Keep the road lower so top-left CAD notes don't cover the pass-by.
  const roadTop = height * 0.52;

  useEffect(() => {
    if (!visible) {
      drive.value = 0;
      strobe.value = 0;
      shake.value = 0;
      sweep.value = 0;
      return;
    }

    const done = () => onCompleteRef.current();

    strobe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 90 }),
        withTiming(0.85, { duration: 90 }),
        withTiming(0, { duration: 220 })
      ),
      -1,
      false
    );

    sweep.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );

    shake.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 45 }),
          withTiming(-1, { duration: 45 }),
          withTiming(0.6, { duration: 45 }),
          withTiming(0, { duration: 90 })
        ),
        12,
        false
      )
    );

    drive.value = 0;
    drive.value = withDelay(
      280,
      withTiming(1, { duration: DRIVE_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(done)();
        }
      })
    );
  }, [visible, drive, shake, strobe, sweep]);

  // Shake only the FX / ambulance — keep dispatch + radio copy locked for reading.
  const fxShakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 5 },
      { translateY: shake.value * 3 },
    ],
  }));

  const ambulanceStyle = useAnimatedStyle(() => {
    // Art faces toward bottom-left — race from off-right to off-left.
    const startX = width * 0.78;
    const endX = -ambulanceW - width * 0.25;
    const x = startX + (endX - startX) * drive.value;
    const y = Math.sin(drive.value * Math.PI) * -18;
    const scale = 1.08 + drive.value * 0.22;
    const fadeIn = Math.min(drive.value * 6, 1);
    const fadeOut = drive.value > 0.9 ? 1 - (drive.value - 0.9) / 0.1 : 1;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate: `${interpolate(drive.value, [0, 0.5, 1], [2, 0, -1.5])}deg` },
      ],
      opacity: fadeIn * fadeOut,
    };
  });

  const redStrobeStyle = useAnimatedStyle(() => ({
    opacity: strobe.value * 0.28,
  }));

  const blueStrobeStyle = useAnimatedStyle(() => ({
    opacity: (1 - strobe.value) * 0.18,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-width, width * 1.2]) }],
    opacity: 0.35 + drive.value * 0.25,
  }));

  const dustStyle = useAnimatedStyle(() => {
    const mid = drive.value > 0.15 && drive.value < 0.92 ? 1 : 0;
    return {
      opacity: mid * (0.25 + strobe.value * 0.2),
      transform: [
        {
          translateX: interpolate(drive.value, [0, 1], [width * 0.4, -width * 0.5]),
        },
        { scaleX: 1 + drive.value * 1.4 },
      ],
    };
  });

  const statusPulse = useAnimatedStyle(() => ({
    borderColor: strobe.value > 0.5 ? theme.colors.critical : theme.colors.emsBlue,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.root}>
        <View style={styles.backdrop} />

        {/* FX layer shakes / strobes — text stays outside so it stays readable */}
        <Animated.View style={[styles.fxLayer, fxShakeStyle]} pointerEvents="none">
          <Animated.View style={[styles.strobeRed, redStrobeStyle]} />
          <Animated.View style={[styles.strobeBlue, blueStrobeStyle]} />

          <Animated.View style={[styles.lightSweepWrap, sweepStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,197,49,0.35)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.lightSweep}
            />
          </Animated.View>

          <View style={[styles.speedLines, { top: roadTop - 40 }]}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SpeedLine key={i} index={i} drive={drive} width={width} />
            ))}
          </View>

          <View style={[styles.road, { top: roadTop }]}>
            <Animated.View style={[styles.dust, dustStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.dustBar}
              />
            </Animated.View>

            <Animated.View style={ambulanceStyle}>
              <Image
                source={Characters.ambulance.image}
                resizeMode="contain"
                style={{ width: ambulanceW, height: ambulanceH }}
              />
            </Animated.View>
          </View>
        </Animated.View>

        <View style={styles.stage} pointerEvents="none">
          <Animated.View entering={FadeInDown.delay(40).springify().damping(16)} style={styles.copyBlock}>
            <Text style={styles.kicker}>DISPATCH ACK · CHANNEL 1</Text>
            <Text style={styles.unit}>{unit}</Text>
            <Animated.Text entering={FadeIn.delay(180)} style={styles.line}>
              Copy. En route Code.
            </Animated.Text>

            <Animated.View style={[styles.statusRow, statusPulse]}>
              <View style={styles.liveDot} />
              <Text style={styles.status}>RESPONDING</Text>
            </Animated.View>

            <View style={styles.radioStack}>
              <RadioBeat delay={320} text={`${unit} — 10-4, responding.`} />
              <RadioBeat delay={720} text="Dispatch copy. Advise on arrival." />
              <RadioBeat delay={1180} text="Lights and siren. Scene size-up next." />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.footer}>
            <Text style={styles.footerText}>ON THE CLOCK · PATIENT CONTACT AHEAD</Text>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

function RadioBeat({ delay, text }: { delay: number; text: string }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(280)} style={styles.radioBeat}>
      <Text style={styles.radioLabel}>RADIO</Text>
      <Text style={styles.radioText}>{text}</Text>
    </Animated.View>
  );
}

function SpeedLine({
  index,
  drive,
  width,
}: {
  index: number;
  drive: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const phase = (drive.value + index * 0.12) % 1;
    return {
      opacity: drive.value > 0.08 && drive.value < 0.95 ? 0.15 + (index % 3) * 0.08 : 0,
      transform: [
        {
          translateX: interpolate(phase, [0, 1], [width * 0.3, -width * 0.8]),
        },
        { scaleX: 0.6 + (index % 4) * 0.35 },
      ],
      top: 12 + index * 28,
      width: 70 + index * 22,
    };
  });

  return <Animated.View style={[styles.speedLine, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2, 8, 16, 0.96)',
  },
  stage: {
    flex: 1,
    zIndex: 4,
  },
  fxLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  strobeRed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '55%',
    backgroundColor: theme.colors.critical,
  },
  strobeBlue: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '55%',
    backgroundColor: theme.colors.emsBlue,
  },
  lightSweepWrap: {
    position: 'absolute',
    top: '20%',
    bottom: '25%',
    width: 90,
  },
  lightSweep: {
    flex: 1,
    width: 90,
  },
  speedLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 200,
  },
  speedLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(234, 246, 251, 0.55)',
    right: 0,
  },
  copyBlock: {
    position: 'absolute',
    top: 44,
    left: 14,
    maxWidth: 220,
    alignItems: 'flex-start',
    gap: 4,
    zIndex: 5,
  },
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.6,
  },
  unit: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(36),
    letterSpacing: 1.2,
    lineHeight: fs(38),
    textShadowColor: 'rgba(0, 229, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  line: {
    color: theme.colors.accentLight,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(12),
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.critical,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 45, 85, 0.12)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.critical,
  },
  status: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
  },
  radioStack: {
    width: '100%',
    marginTop: 10,
    gap: 6,
  },
  radioBeat: {
    backgroundColor: 'rgba(5, 12, 20, 0.88)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 1,
  },
  radioLabel: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1.2,
  },
  radioText: {
    color: theme.colors.text,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(11),
    letterSpacing: 0.2,
    lineHeight: fs(14),
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 340,
    overflow: 'visible',
    zIndex: 2,
  },
  dust: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    height: 48,
    width: '100%',
  },
  dustBar: {
    flex: 1,
    height: 48,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.2,
  },
});
