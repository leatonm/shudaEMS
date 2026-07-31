import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_SNAPPY = { damping: 18, stiffness: 320, mass: 0.6 };
const SPRING_SOFT = { damping: 20, stiffness: 140, mass: 0.9 };

/** Stagger delay for lists — capped so long lists don't crawl in. */
export function stagger(index: number, step = 55, max = 440): number {
  return Math.min(index * step, max);
}

export const enterUp = (index = 0) =>
  FadeInDown.delay(stagger(index)).duration(420).springify().damping(18);

export const enterDown = (index = 0) =>
  FadeInUp.delay(stagger(index)).duration(420).springify().damping(18);

export const enterFade = (index = 0) => FadeIn.delay(stagger(index)).duration(320);

export const enterStepIn = SlideInRight.duration(300).springify().damping(20);
export const exitStepOut = SlideOutLeft.duration(200);

interface PressScaleProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  entering?: React.ComponentProps<typeof Animated.View>['entering'];
}

/** Pressable that springs down on touch — makes every tap feel physical. */
export function PressScale({
  children,
  onPress,
  disabled = false,
  style,
  scaleTo = 0.96,
  entering,
}: PressScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: 1 - pressed.value * 0.1,
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withSpring(1, SPRING_SNAPPY);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING_SNAPPY);
      }}
      onPress={onPress}
      disabled={disabled}
      entering={entering}
      style={[style, animatedStyle] as StyleProp<ViewStyle>}
    >
      {children}
    </AnimatedPressable>
  );
}

interface PulseOrbProps {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  duration?: number;
  delay?: number;
}

/** Slow-breathing background glow — ambient energy behind the content. */
export function PulseOrb({
  color,
  size,
  top,
  bottom,
  left,
  right,
  duration = 3600,
  delay = 0,
}: PulseOrbProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [delay, duration, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.5,
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
        },
        animatedStyle,
      ]}
    />
  );
}

/** Small blinking status dot. */
export function LiveDot({ color = theme.colors.success, size = 8 }) {
  const blink = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [blink]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + blink.value * 0.65,
    transform: [{ scale: 0.85 + blink.value * 0.3 }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ProgressTrackProps {
  /** 0 to 1 */
  progress: number;
  color?: string;
}

/** Animated progress bar that springs to the new value. */
export function ProgressTrack({ progress, color = theme.colors.emsBlue }: ProgressTrackProps) {
  const value = useSharedValue(progress);

  useEffect(() => {
    value.value = withSpring(Math.max(0, Math.min(1, progress)), SPRING_SOFT);
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <Animated.View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </Animated.View>
  );
}

/** Content that pops in with a spring — used for result banners. */
export function PopIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 180 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

export { Animated };
