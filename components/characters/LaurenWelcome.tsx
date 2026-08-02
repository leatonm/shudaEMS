import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import {
  laurenWelcomeLines,
  shouldShowLaunchGreeting,
} from '@/lib/characterDialogue';
import { useProgressStore } from '@/store/progressStore';

/** Lauren greets once per launch — slides in from the left. */
export function LaurenWelcome() {
  const returning = useProgressStore(
    (s) => s.totalXp > 0 || s.recentRuns.length > 0 || !!s.lastPlayDate
  );
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(() => useProgressStore.persist.hasHydrated());
  const lines = laurenWelcomeLines(returning);
  const { width, height } = useWindowDimensions();
  const portraitH = Math.min(320, Math.round(height * 0.48));
  const portraitW = Math.round(portraitH * (560 / 858));
  const textPad = Math.round(portraitH * 0.16);
  const panelW = Math.min(480, Math.round(width * 0.96));

  useEffect(() => {
    const unsub = useProgressStore.persist.onFinishHydration(() => setHydrated(true));
    if (useProgressStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (shouldShowLaunchGreeting()) setVisible(true);
  }, [hydrated]);

  const close = () => setVisible(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeInLeft.springify().damping(16).stiffness(160)}
          exiting={FadeOutLeft.duration(160)}
          style={[styles.panel, { width: panelW }]}
        >
          <LinearGradient
            colors={['rgba(2, 8, 16, 0.9)', 'rgba(2, 8, 16, 0.58)', 'transparent']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.row}>
            <Image
              source={Characters.lauren.image}
              resizeMode="contain"
              style={{ width: portraitW, height: portraitH }}
            />
            <View style={[styles.copy, { paddingBottom: textPad }]}>
              <View style={styles.callsignChip}>
                <Text style={styles.callsign}>
                  {Characters.lauren.name.toUpperCase()} · {Characters.lauren.shortRole}
                </Text>
              </View>
              <Animated.Text entering={FadeIn.delay(100)} style={styles.title}>
                {lines.title}
              </Animated.Text>
              <Animated.View entering={FadeIn.delay(200)} style={styles.bodyChip}>
                <Text style={styles.body}>{lines.body}</Text>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(320)}>
                <Pressable style={styles.cta} onPress={close}>
                  <Text style={styles.ctaText}>LET&apos;S TRAIN</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 16, 0.78)',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  panel: {
    overflow: 'hidden',
    paddingLeft: 4,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    alignItems: 'flex-start',
    maxWidth: 260,
    gap: 8,
    minWidth: 160,
  },
  callsignChip: {
    backgroundColor: 'rgba(0, 229, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callsign: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
  },
  title: {
    color: '#F4FBFF',
    fontFamily: 'BebasNeue',
    fontSize: fs(34),
    letterSpacing: 1,
    lineHeight: fs(36),
    textShadowColor: 'rgba(2, 8, 16, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  bodyChip: {
    backgroundColor: 'rgba(2, 10, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(234, 246, 251, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  body: {
    color: '#F4FBFF',
    fontSize: fs(14),
    lineHeight: fs(20),
    fontWeight: '600',
  },
  cta: {
    backgroundColor: theme.colors.emsBlue,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: theme.colors.background,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1.4,
  },
});
