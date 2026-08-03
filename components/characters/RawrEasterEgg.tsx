import { useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

const HOLD_MS = 2200;
const EXIT_MS = 200;

/** Matching waist-up art so Lauren and Lee read the same size in Rawr. */
const LAUREN_RAWR = require('../../assets/characters/lauren.png');

/**
 * Ask easter egg: type "rawr" → Lee (left) + Lauren (right) yell RAWR!
 * Bubbles sit above each portrait so the two sides never collide.
 */
export function RawrEasterEgg({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [panelIn, setPanelIn] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height } = useWindowDimensions();
  // Same frame for both characters.
  const portraitH = Math.min(260, Math.round(height * 0.36));
  const portraitW = Math.round(portraitH * 0.72);

  useEffect(() => {
    const clearTimers = () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      holdTimer.current = null;
      exitTimer.current = null;
    };

    if (!visible) {
      clearTimers();
      setPanelIn(false);
      exitTimer.current = setTimeout(() => setOpen(false), EXIT_MS);
      return () => clearTimers();
    }

    clearTimers();
    setOpen(true);
    setPanelIn(true);
    holdTimer.current = setTimeout(() => {
      setPanelIn(false);
      exitTimer.current = setTimeout(() => {
        setOpen(false);
        onDoneRef.current();
      }, EXIT_MS);
    }, HOLD_MS);

    return () => clearTimers();
  }, [visible]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onDone}>
      <View style={styles.backdrop} pointerEvents="box-none">
        {panelIn ? (
          <>
            <Animated.View
              key="lee-rawr"
              entering={FadeInLeft.springify().damping(16).stiffness(160)}
              exiting={FadeOutLeft.duration(EXIT_MS)}
              style={[styles.leftPanel, { width: portraitW + 16 }]}
            >
              <Animated.View entering={FadeIn.delay(100)} style={styles.bubbleLeft}>
                <Text style={[styles.name, { color: theme.colors.success }]}>
                  {Characters.lee.name.toUpperCase()}
                </Text>
                <View style={[styles.yellChip, { borderColor: theme.colors.success }]}>
                  <Text style={styles.yell}>RAWR!</Text>
                </View>
              </Animated.View>
              <Image
                source={Characters.lee.image}
                resizeMode="contain"
                style={{ width: portraitW, height: portraitH }}
              />
            </Animated.View>

            <Animated.View
              key="lauren-rawr"
              entering={FadeInRight.springify().damping(16).stiffness(160)}
              exiting={FadeOutRight.duration(EXIT_MS)}
              style={[styles.rightPanel, { width: portraitW + 16 }]}
            >
              <Animated.View entering={FadeIn.delay(100)} style={styles.bubbleRight}>
                <Text style={[styles.name, { color: theme.colors.emsBlue }]}>
                  {Characters.lauren.name.toUpperCase()}
                </Text>
                <View style={[styles.yellChip, { borderColor: theme.colors.emsBlue }]}>
                  <Text style={styles.yell}>RAWR!</Text>
                </View>
              </Animated.View>
              <Image
                source={LAUREN_RAWR}
                resizeMode="contain"
                style={{ width: portraitW, height: portraitH }}
              />
            </Animated.View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 16, 0.72)',
  },
  leftPanel: {
    position: 'absolute',
    left: 4,
    bottom: 20,
    alignItems: 'flex-start',
    gap: 6,
  },
  rightPanel: {
    position: 'absolute',
    right: 4,
    bottom: 20,
    alignItems: 'flex-end',
    gap: 6,
  },
  bubbleLeft: {
    alignItems: 'flex-start',
    gap: 4,
    maxWidth: 140,
  },
  bubbleRight: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 140,
  },
  name: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
  },
  yellChip: {
    backgroundColor: 'rgba(2, 10, 18, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  yell: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(34),
    letterSpacing: 2,
    lineHeight: fs(36),
  },
});
