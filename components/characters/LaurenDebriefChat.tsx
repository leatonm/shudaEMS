import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  CharacterModal,
  CharacterStage,
  ChatBubble,
} from '@/components/characters/CharacterStage';
import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import {
  laurenDebriefChat,
  laurenRankColor,
} from '@/lib/characterDialogue';
import type { EmtDifficulty, EmtRunResult } from '@/data/emt/types';

/**
 * Post-call coach with Lauren — one beat at a time, then Full Report.
 */
export function LaurenDebriefChat({
  result,
  difficulty,
  onFullReport,
  replayNonce = 0,
}: {
  result: EmtRunResult;
  difficulty: EmtDifficulty;
  onFullReport: () => void;
  /** Bump to reopen Lauren from the start (debrief Replay button). */
  replayNonce?: number;
}) {
  const { rank, messages } = useMemo(
    () => laurenDebriefChat(result, difficulty),
    [result, difficulty]
  );
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const accent = laurenRankColor(rank);
  const current = messages[step];
  const isLast = step >= messages.length - 1;
  const portrait = result.skillsSheetPass
    ? Characters.lauren.image
    : Characters.lauren.imageDisappointed;

  useEffect(() => {
    setVisible(true);
    setStep(0);
  }, [result.callId]);

  useEffect(() => {
    if (replayNonce <= 0) return;
    setStep(0);
    setVisible(true);
  }, [replayNonce]);

  const openFullReport = () => {
    setVisible(false);
    onFullReport();
  };

  const replay = () => {
    setStep(0);
    setVisible(true);
  };

  const advance = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    openFullReport();
  };

  return (
    <>
      <CharacterModal visible={visible} onClose={() => {}} dismissOnBackdrop={false}>
        <CharacterStage
          image={portrait}
          name={Characters.lauren.name}
          role="Medical Director"
          accent={accent}
          compact
        >
          <Text style={[styles.rankTitle, { color: accent }]}>{rank.toUpperCase()}</Text>
          <Text style={styles.rankSub}>
            {result.percentScore}% · {result.stars}★ ·{' '}
            {result.skillsSheetPass ? 'PASS' : 'FAIL'}
          </Text>

          <View style={styles.dots}>
            {messages.map((msg, i) => (
              <View
                key={msg.id}
                style={[
                  styles.dot,
                  i === step && { backgroundColor: accent, width: 16 },
                  i < step && { backgroundColor: accent, opacity: 0.45 },
                ]}
              />
            ))}
          </View>

          {current ? (
            <Animated.View
              key={current.id}
              entering={FadeInDown.springify().damping(18)}
              style={styles.beat}
            >
              <ChatBubble text={current.text} tone={current.tone} label={current.label} />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeIn.delay(80)} style={styles.actions}>
            <Pressable style={[styles.cta, { backgroundColor: accent }]} onPress={advance}>
              <Text style={styles.ctaText}>{isLast ? 'FULL REPORT' : 'NEXT'}</Text>
            </Pressable>
            {!isLast ? (
              <Pressable style={styles.secondary} onPress={openFullReport}>
                <Text style={styles.secondaryText}>SKIP TO FULL REPORT</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </CharacterStage>
      </CharacterModal>

      {!visible ? (
        <Pressable
          style={[styles.reopen, { borderColor: accent }]}
          onPress={replay}
        >
          <Text style={[styles.reopenText, { color: accent }]}>
            REPLAY LAUREN · {rank.toUpperCase()}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

export function laurenDebriefRankLabel(
  result: EmtRunResult,
  difficulty: EmtDifficulty
): string {
  return laurenDebriefChat(result, difficulty).rank;
}

const styles = StyleSheet.create({
  rankTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fs(36),
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  rankSub: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  beat: {
    width: '100%',
    minHeight: 96,
    marginBottom: 14,
  },
  actions: {
    gap: 8,
  },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: theme.colors.background,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1.2,
  },
  secondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.1,
  },
  reopen: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  reopenText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1,
  },
});
