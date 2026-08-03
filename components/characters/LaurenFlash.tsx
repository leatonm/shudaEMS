import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight, FadeOutRight } from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';

export interface LaurenFlashPayload {
  id: string;
  lines: string[];
  /** Optional student action shown above Lauren's reply. */
  studentLine?: string;
  /** Choices shown instead of OK (MOI/NOI, resources, etc.). */
  choices?: Array<{ id: string; label: string; actionId: string }>;
  /** Coach = full; Standard = small gesture; Exam = minimal. */
  gesture?: 'full' | 'gesture' | 'minimal';
}

interface LaurenFlashProps {
  flash: LaurenFlashPayload | null;
  onConfirm: () => void;
  onChoose?: (actionId: string) => void;
}

/** Darkened slide-in — Lauren delivers findings / patient updates. Tap OK to continue. */
export function LaurenFlash({ flash, onConfirm, onChoose }: LaurenFlashProps) {
  const visible = !!flash;
  const [flashKey, setFlashKey] = useState(0);
  const { width, height } = useWindowDimensions();
  const gesture = flash?.gesture ?? 'full';
  const compact = gesture !== 'full';
  const portraitH = Math.min(
    compact ? 200 : 300,
    Math.round(height * (compact ? 0.28 : 0.44))
  );
  const portraitW = Math.round(portraitH * (560 / 858));
  const textPad = Math.round(portraitH * (compact ? 0.06 : 0.1));
  const panelW = Math.min(440, Math.round(width * 0.94));
  const accent = theme.colors.emsBlue;
  const choices = flash?.choices ?? [];

  useEffect(() => {
    if (!visible) return;
    setFlashKey((k) => k + 1);
  }, [visible, flash?.id]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!choices.length) onConfirm();
      }}
    >
      <View style={styles.backdrop}>
        <Animated.View
          key={flashKey}
          entering={FadeInRight.springify().damping(16).stiffness(160)}
          exiting={FadeOutRight.duration(160)}
          style={[styles.panel, { width: panelW }]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(2, 8, 16, 0.55)', 'rgba(2, 8, 16, 0.92)']}
            locations={[0, 0.28, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.row}>
            <View style={[styles.copy, { paddingBottom: textPad }]}>
              <View style={[styles.callsignChip, { borderColor: accent }]}>
                <Text style={[styles.callsign, { color: accent }]}>
                  {Characters.lauren.name.toUpperCase()} · {Characters.lauren.shortRole}
                </Text>
              </View>

              {flash?.studentLine ? (
                <Animated.View entering={FadeIn.delay(60)} style={styles.youChip}>
                  <Text style={styles.youLabel}>YOU</Text>
                  <Text style={styles.youText}>{flash.studentLine}</Text>
                </Animated.View>
              ) : null}

              {(flash?.lines ?? []).map((line, i) => (
                <Animated.View
                  key={`${flashKey}-${i}`}
                  entering={FadeIn.delay(120 + i * 160)}
                  style={styles.lineChip}
                >
                  <Text style={styles.line}>{line}</Text>
                </Animated.View>
              ))}

              {choices.length > 0 ? (
                <Animated.View entering={FadeIn.delay(360)} style={styles.choiceCol}>
                  {choices.map((choice) => (
                    <Pressable
                      key={choice.id}
                      style={[styles.choiceBtn, { borderColor: accent }]}
                      onPress={() => onChoose?.(choice.actionId)}
                    >
                      <Text style={[styles.choiceText, { color: accent }]}>
                        {choice.label}
                      </Text>
                    </Pressable>
                  ))}
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.delay(360)}>
                  <Pressable
                    style={[styles.ackBtn, { borderColor: accent }]}
                    onPress={onConfirm}
                  >
                    <Text style={[styles.ackText, { color: accent }]}>OK</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
            <Image
              source={Characters.lauren.image}
              resizeMode="contain"
              style={{ width: portraitW, height: portraitH }}
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
    backgroundColor: 'rgba(2, 8, 16, 0.78)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  panel: {
    overflow: 'hidden',
    paddingRight: 4,
    paddingLeft: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
  },
  copy: {
    flexShrink: 1,
    alignItems: 'flex-end',
    maxWidth: 260,
    gap: 6,
  },
  callsignChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,229,255,0.12)',
  },
  callsign: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
    textAlign: 'right',
  },
  youChip: {
    backgroundColor: 'rgba(14, 30, 44, 0.92)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  youLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1,
    marginBottom: 2,
    textAlign: 'right',
  },
  youText: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(18),
    textAlign: 'right',
  },
  lineChip: {
    backgroundColor: 'rgba(2, 10, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(234, 246, 251, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  line: {
    color: '#F4FBFF',
    fontSize: fs(16),
    lineHeight: fs(21),
    fontWeight: '700',
    textAlign: 'right',
  },
  ackBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
    backgroundColor: 'rgba(2, 10, 18, 0.85)',
    alignSelf: 'flex-end',
  },
  ackText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(13),
    letterSpacing: 1.4,
  },
  choiceCol: {
    width: '100%',
    gap: 6,
    marginTop: 4,
  },
  choiceBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(2, 10, 18, 0.9)',
  },
  choiceText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 0.6,
    textAlign: 'right',
  },
});
