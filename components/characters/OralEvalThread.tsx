import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import type { InstructorMessage } from '@/data/emt/types';

const PROMPT_RE = /^what would you like to do\??$/i;

function isPromptLine(text: string) {
  return PROMPT_RE.test(text.trim());
}

/**
 * Oral-exam conversation with Lauren — replaces a terminal-style call log.
 * Latest finding is the beat; earlier turns stay as quiet context.
 */
export function OralEvalThread({
  messages,
  compact = false,
}: {
  messages: InstructorMessage[];
  /** Arrival / early phases — fewer lines. */
  compact?: boolean;
}) {
  const thread = useMemo(() => {
    const cleaned = messages.filter((m) => !isPromptLine(m.text));
    const limit = compact ? 4 : 8;
    return cleaned.slice(-limit);
  }, [messages, compact]);

  const latestLauren = [...thread].reverse().find((m) => m.role === 'lauren');

  if (!thread.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Image source={Characters.lauren.image} style={styles.avatar} resizeMode="cover" />
        <View style={styles.headerCopy}>
          <Text style={styles.name}>
            {Characters.lauren.name.toUpperCase()} · {Characters.lauren.shortRole}
          </Text>
          <Text style={styles.role}>Listening · oral evaluation</Text>
        </View>
      </View>

      <View style={styles.thread}>
        {thread.map((msg) => {
          const isYou = msg.role === 'you';
          const isLatest = latestLauren?.id === msg.id;
          return (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.springify().damping(18).stiffness(160)}
              style={[
                styles.row,
                isYou ? styles.rowYou : styles.rowLauren,
                isLatest ? styles.rowLatest : null,
              ]}
            >
              {!isYou ? <Text style={styles.speaker}>Lauren</Text> : null}
              {isYou ? <Text style={styles.speakerYou}>You</Text> : null}
              <Text style={[styles.bubbleText, isLatest && styles.bubbleTextLatest]}>
                {msg.text}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.22)',
    backgroundColor: 'rgba(6, 18, 28, 0.72)',
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: theme.colors.emsBlue,
    backgroundColor: theme.colors.surface,
  },
  headerCopy: { flex: 1, gap: 2 },
  name: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.1,
  },
  role: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  thread: { gap: 8 },
  row: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '94%',
  },
  rowLauren: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  rowYou: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowLatest: {
    borderColor: theme.colors.emsBlue,
    backgroundColor: 'rgba(0,229,255,0.14)',
  },
  speaker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  speakerYou: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.8,
    marginBottom: 3,
    textAlign: 'right',
  },
  bubbleText: {
    color: theme.colors.textMuted,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  bubbleTextLatest: {
    color: theme.colors.text,
    fontSize: fs(15),
    lineHeight: fs(21),
    fontWeight: '600',
  },
});
