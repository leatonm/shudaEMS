import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { PressScale, enterUp } from '@/components/ui/motion';
import { DIFFICULTY_ICONS } from '@/constants/icons';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import type { EmtDifficulty } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

const OPTIONS: Array<{
  id: EmtDifficulty;
  label: string;
  bullets: string[];
}> = [
  {
    id: 'coach',
    label: 'Coach',
    bullets: [
      'Unlimited hints',
      'Lauren teaches throughout the scenario',
      'Pause anytime',
    ],
  },
  {
    id: 'standard',
    label: 'Standard',
    bullets: ['Realistic experience', 'Limited guidance'],
  },
  {
    id: 'exam',
    label: 'Exam',
    bullets: [
      'NREMT style',
      'No hints',
      'Timer',
      'Critical failures enabled',
      'Pass / Fail',
    ],
  },
];

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
    if (callId) router.replace(`/emt/dispatch/${callId}` as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenScroll>
        <Animated.Text entering={enterUp(0)} style={styles.kicker}>
          SELECT DIFFICULTY
        </Animated.Text>
        <Animated.Text entering={enterUp(1)} style={styles.lead}>
          Same engine. Different coaching.
        </Animated.Text>

        <View style={styles.list}>
          {OPTIONS.map((opt, i) => (
            <PressScale key={opt.id} onPress={() => start(opt.id)} style={styles.card}>
              <Animated.View entering={enterUp(i + 2)} style={styles.inner}>
                <Image source={DIFFICULTY_ICONS[opt.id]} style={styles.icon} />
                <View style={styles.copy}>
                  <Text style={styles.title}>{opt.label}</Text>
                  {opt.bullets.map((b) => (
                    <Text key={b} style={styles.bullet}>
                      · {b}
                    </Text>
                  ))}
                </View>
              </Animated.View>
            </PressScale>
          ))}
        </View>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  lead: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(34),
    letterSpacing: 1,
    marginBottom: 18,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
  inner: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  icon: { width: 56, height: 56 },
  copy: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(28),
    marginBottom: 6,
  },
  bullet: {
    color: theme.colors.textMuted,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
});
