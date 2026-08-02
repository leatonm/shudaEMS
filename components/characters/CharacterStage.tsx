import type { ReactNode } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { fs, isWeb } from '@/constants/layout';
import { theme } from '@/constants/theme';

/** Centered character stage — portrait on top, readable copy underneath. */
export function CharacterStage({
  image,
  name,
  role,
  accent = theme.colors.emsBlue,
  children,
  compact = false,
}: {
  image: ImageSourcePropType;
  name: string;
  role: string;
  accent?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  // Mid crop: badge/patch in frame without dominating the modal.
  const portraitW = Math.min(
    compact ? 200 : isWeb ? 260 : 230,
    Math.round(width * (compact ? 0.5 : 0.62))
  );
  // md.png ~560×858 after keep_frac crop through the name badge.
  const portraitAspect = 560 / 858;
  const naturalH = portraitW / portraitAspect;
  const maxH = Math.round(height * (compact ? 0.34 : 0.38));
  const scale = naturalH > maxH ? maxH / naturalH : 1;
  const finalW = Math.round(portraitW * scale);
  const finalH = Math.round(naturalH * scale);

  return (
    <View style={styles.stage}>
      <Animated.View entering={ZoomIn.springify().damping(15)} style={styles.portraitWrap}>
        <Image
          source={image}
          resizeMode="contain"
          style={{ width: finalW, height: finalH }}
        />
      </Animated.View>
      <Text style={[styles.badge, { color: accent, borderColor: accent }]}>
        {name.toUpperCase()} · {role.toUpperCase()}
      </Text>
      <Animated.View entering={FadeIn.delay(90)} style={styles.body}>
        {children}
      </Animated.View>
    </View>
  );
}

export function CharacterModal({
  visible,
  onClose,
  children,
  dismissOnBackdrop = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdrop?: boolean;
}) {
  const { width } = useWindowDimensions();
  const cardMax = Math.min(440, width - 32);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        <Pressable
          style={[styles.card, { width: cardMax, maxWidth: isWeb ? 440 : undefined }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardScroll}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ChatBubble({
  text,
  tone = 'default',
  label,
}: {
  text: string;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'rank';
  label?: string;
}) {
  const toneStyle =
    tone === 'good'
      ? styles.bubbleGood
      : tone === 'warn'
        ? styles.bubbleWarn
        : tone === 'bad'
          ? styles.bubbleBad
          : tone === 'rank'
            ? styles.bubbleRank
            : styles.bubbleDefault;

  return (
    <View style={[styles.bubble, toneStyle]}>
      {label ? <Text style={styles.bubbleLabel}>{label}</Text> : null}
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    width: '100%',
  },
  portraitWrap: {
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'visible',
  },
  badge: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.3,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  body: {
    width: '100%',
    alignItems: 'stretch',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 16, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    maxHeight: '88%',
    shadowColor: theme.colors.emsBlue,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  cardScroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  bubble: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  bubbleDefault: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: theme.colors.border,
  },
  bubbleGood: {
    backgroundColor: theme.colors.successGlow,
    borderColor: theme.colors.success,
  },
  bubbleWarn: {
    backgroundColor: theme.colors.amberGlow,
    borderColor: theme.colors.warning,
  },
  bubbleBad: {
    backgroundColor: theme.colors.dangerGlow,
    borderColor: theme.colors.critical,
  },
  bubbleRank: {
    backgroundColor: theme.colors.cadGlow,
    borderColor: theme.colors.emsBlue,
  },
  bubbleLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: fs(15),
    lineHeight: fs(22),
  },
});
