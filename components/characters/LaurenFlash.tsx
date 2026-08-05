import { useEffect, useRef, useState } from 'react';
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
  /** Practice = full; Exam = minimal. */
  gesture?: 'full' | 'gesture' | 'minimal';
  /** Auto-dismiss without requiring OK. */
  autoDismiss?: boolean;
}

interface LaurenFlashProps {
  flash: LaurenFlashPayload | null;
  onConfirm: () => void;
  onChoose?: (actionId: string) => void;
}

const EXIT_MS = 200;
const AUTO_HOLD_MS = 2200;

/**
 * Darkened slide-in — Lauren delivers findings / patient updates.
 * Content is snapshotted while open so dismiss never flashes the next reply.
 */
export function LaurenFlash({ flash, onConfirm, onChoose }: LaurenFlashProps) {
  const [shown, setShown] = useState<LaurenFlashPayload | null>(null);
  const [panelIn, setPanelIn] = useState(false);
  const leavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const { width, height } = useWindowDimensions();

  const gesture = shown?.gesture ?? 'full';
  const compact = gesture !== 'full';
  const panelW = Math.min(460, Math.round(width * 0.94));
  // Keep enough room for Lauren's lines — portrait used to steal almost all phone width.
  const minCopyW = Math.min(220, Math.round(width * 0.55));
  let portraitH = Math.min(
    compact ? 220 : 300,
    Math.round(height * (compact ? 0.3 : 0.42))
  );
  let portraitW = Math.round(portraitH * (560 / 858));
  const maxPortraitW = Math.max(110, panelW - minCopyW - 28);
  if (portraitW > maxPortraitW) {
    portraitW = maxPortraitW;
    portraitH = Math.round(portraitW * (858 / 560));
  }
  const copyW = Math.min(280, Math.max(minCopyW, panelW - portraitW - 28));
  const textPad = Math.round(portraitH * (compact ? 0.06 : 0.1));
  const accent = theme.colors.emsBlue;
  const choices = shown?.choices ?? [];
  const autoDismiss = Boolean(shown?.autoDismiss) && choices.length === 0;

  useEffect(() => {
    if (flash) {
      if (leavingRef.current) return;
      if (!shown || shown.id !== flash.id) {
        setShown(flash);
        setPanelIn(true);
      }
      return;
    }
    // Parent cleared the flash (e.g. another overlay took over).
    if (shown && !leavingRef.current) {
      leavingRef.current = true;
      setPanelIn(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShown(null);
        leavingRef.current = false;
      }, EXIT_MS);
    }
  }, [flash, shown]);

  useEffect(() => {
    if (!shown || !autoDismiss || leavingRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setPanelIn(false);
      timerRef.current = setTimeout(() => {
        leavingRef.current = false;
        setShown(null);
        onConfirmRef.current();
      }, EXIT_MS);
    }, AUTO_HOLD_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shown, autoDismiss]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const closeThen = (after: () => void) => {
    if (leavingRef.current || !shown) return;
    leavingRef.current = true;
    setPanelIn(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      leavingRef.current = false;
      setShown(null);
      after();
    }, EXIT_MS);
  };

  const modalVisible = !!shown;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!choices.length) closeThen(onConfirm);
      }}
    >
      <View style={styles.backdrop}>
        {panelIn && shown ? (
          <Animated.View
            key={shown.id}
            entering={FadeInRight.springify().damping(16).stiffness(160)}
            exiting={FadeOutRight.duration(EXIT_MS)}
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
              <View style={[styles.copy, { paddingBottom: textPad, width: copyW }]}>
                <View style={[styles.callsignChip, { borderColor: accent }]}>
                  <Text style={[styles.callsign, { color: accent }]}>
                    {Characters.lauren.name.toUpperCase()} · {Characters.lauren.shortRole}
                  </Text>
                </View>

                {shown.studentLine ? (
                  <Animated.View entering={FadeIn.delay(60)} style={styles.youChip}>
                    <Text style={styles.youLabel}>YOU</Text>
                    <Text style={styles.youText}>{shown.studentLine}</Text>
                  </Animated.View>
                ) : null}

                {shown.lines.map((line, i) => (
                  <Animated.View
                    key={`${shown.id}-${i}`}
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
                        onPress={() =>
                          closeThen(() => onChoose?.(choice.actionId))
                        }
                      >
                        <Text style={[styles.choiceText, { color: accent }]}>
                          {choice.label}
                        </Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                ) : autoDismiss ? null : (
                  <Animated.View entering={FadeIn.delay(360)}>
                    <Pressable
                      style={[styles.ackBtn, { borderColor: accent }]}
                      onPress={() => closeThen(onConfirm)}
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
        ) : null}
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
    alignItems: 'stretch',
    gap: 6,
  },
  callsignChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,229,255,0.12)',
    alignSelf: 'flex-end',
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
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  line: {
    color: '#F4FBFF',
    fontSize: fs(15),
    lineHeight: fs(21),
    fontWeight: '700',
    textAlign: 'left',
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
