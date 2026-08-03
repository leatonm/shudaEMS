import { useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';

const HOLD_MS = 2000;

/**
 * Ask easter egg: "the world rawr" → Lauren (left) + Lee (right) yell RAWR, then leave.
 */
export function RawrEasterEgg({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [flashKey, setFlashKey] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const { width, height } = useWindowDimensions();
  const portraitH = Math.min(240, Math.round(height * 0.36));
  const laurenW = Math.round(portraitH * (560 / 858));
  const leeW = Math.round(portraitH * (560 / 705));
  const halfW = Math.min(280, Math.round(width * 0.48));

  useEffect(() => {
    if (!visible) return;
    setFlashKey((k) => k + 1);
    const t = setTimeout(() => onDoneRef.current(), HOLD_MS);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop} pointerEvents="box-none">
        <Animated.View
          key={`lauren-${flashKey}`}
          entering={FadeInLeft.springify().damping(16).stiffness(160)}
          exiting={FadeOutLeft.duration(180)}
          style={[styles.leftPanel, { width: halfW }]}
        >
          <LinearGradient
            colors={['rgba(2, 8, 16, 0.92)', 'rgba(2, 8, 16, 0.55)', 'transparent']}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.leftRow}>
            <Image
              source={Characters.lauren.image}
              resizeMode="contain"
              style={{ width: laurenW, height: portraitH }}
            />
            <View style={styles.copy}>
              <Text style={[styles.name, { color: theme.colors.emsBlue }]}>
                {Characters.lauren.name.toUpperCase()}
              </Text>
              <Animated.View entering={FadeIn.delay(120)} style={styles.yellChip}>
                <Text style={styles.yell}>RAWR</Text>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          key={`lee-${flashKey}`}
          entering={FadeInRight.springify().damping(16).stiffness(160)}
          exiting={FadeOutRight.duration(180)}
          style={[styles.rightPanel, { width: halfW }]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(2, 8, 16, 0.55)', 'rgba(2, 8, 16, 0.92)']}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.rightRow}>
            <View style={styles.copyRight}>
              <Text style={[styles.name, { color: theme.colors.success }]}>
                {Characters.lee.name.toUpperCase()}
              </Text>
              <Animated.View entering={FadeIn.delay(120)} style={styles.yellChip}>
                <Text style={styles.yell}>RAWR</Text>
              </Animated.View>
            </View>
            <Image
              source={Characters.lee.image}
              resizeMode="contain"
              style={{ width: leeW, height: portraitH }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 16, 0.72)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 24,
  },
  leftPanel: {
    position: 'absolute',
    left: 0,
    bottom: 24,
    overflow: 'hidden',
    paddingLeft: 2,
  },
  rightPanel: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    overflow: 'hidden',
    paddingRight: 2,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 28,
    paddingRight: 8,
    gap: 8,
  },
  copyRight: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 28,
    paddingLeft: 8,
    gap: 8,
  },
  name: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
  },
  yellChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  yell: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(42),
    letterSpacing: 3,
    lineHeight: fs(44),
  },
});
