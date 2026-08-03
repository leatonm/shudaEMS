import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { PressScale, enterUp } from '@/components/ui/motion';
import { DIFFICULTY_CARD_COPY, DIFFICULTY_ICONS, Icons } from '@/constants/icons';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import type { EmtDifficulty } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

const DIFFICULTY_BG = require('../../assets/images/bg2.png');

const OPTIONS: Array<{
  id: EmtDifficulty;
  label: string;
  badge: string;
  summary: string;
}> = [
  {
    id: 'coach',
    label: 'Coach',
    badge: 'BEST FOR LEARNING',
    summary: 'Hints · Lauren tips · Pause anytime',
  },
  {
    id: 'standard',
    label: 'Standard',
    badge: 'MOST POPULAR',
    summary: 'Realistic · Brief findings only',
  },
  {
    id: 'exam',
    label: 'Exam',
    badge: 'CHALLENGE YOURSELF',
    summary: 'NREMT · Timer · Critical fails · Pass/Fail',
  },
];

function cardGradient(accent: string): [string, string] {
  return [`${accent}33`, 'rgba(8,18,28,0.98)'];
}

/** Single-viewport difficulty pick — compact rows like home categories. */
export default function DifficultySelectScreen() {
  const router = useRouter();
  const setDifficulty = useEmtStore((s) => s.setDifficulty);
  const startCall = useEmtStore((s) => s.startCall);
  const pendingCategory = useEmtStore((s) => s.pendingCategory);

  const start = (id: EmtDifficulty) => {
    setDifficulty(id);
    const callId = startCall({
      difficulty: id,
      category: pendingCategory ?? undefined,
    });
    if (callId) router.push(`/emt/dispatch/${callId}` as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AppBackdrop source={DIFFICULTY_BG} />
      <View style={styles.shell}>
        <Animated.Text entering={enterUp(0)} style={styles.kicker}>
          CHOOSE YOUR EXPERIENCE
        </Animated.Text>
        <Animated.Text entering={enterUp(1)} style={styles.lead}>
          Same engine. Different coaching.
        </Animated.Text>

        <View style={styles.list}>
          {OPTIONS.map((opt, i) => {
            const copy = DIFFICULTY_CARD_COPY[opt.id];
            return (
              <PressScale key={opt.id} onPress={() => start(opt.id)} style={styles.rowOuter}>
                <Animated.View entering={enterUp(i + 2)}>
                  <LinearGradient
                    colors={cardGradient(copy.accent)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.row, { borderColor: copy.accent }]}
                  >
                    <Image
                      source={DIFFICULTY_ICONS[opt.id]}
                      style={styles.icon}
                      resizeMode="contain"
                    />
                    <View style={styles.copy}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: copy.accent }]}>{opt.label}</Text>
                        <View
                          style={[
                            styles.badge,
                            { borderColor: copy.accent, backgroundColor: copy.glow },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: copy.accent }]}>
                            {opt.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.summary} numberOfLines={1}>
                        {opt.summary}
                      </Text>
                    </View>
                    <Image source={Icons.arrowRight} style={styles.chevron} />
                  </LinearGradient>
                </Animated.View>
              </PressScale>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  shell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
    marginBottom: 2,
    textAlign: 'center',
  },
  lead: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  list: { gap: 8 },
  rowOuter: { borderRadius: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 6,
    overflow: 'hidden',
    minHeight: 72,
  },
  icon: { width: 34, height: 34 },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 0.6,
    lineHeight: fs(24),
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(7),
    letterSpacing: 0.6,
  },
  summary: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(14),
    fontWeight: '500',
  },
  chevron: {
    width: 12,
    height: 12,
    opacity: 0.55,
  },
});
