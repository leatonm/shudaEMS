import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { PressScale } from '@/components/ui/motion';
import { DIFFICULTY_OPTIONS } from '@/data/emt/difficulty';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

export default function SettingsScreen() {
  const difficulty = useEmtStore((s) => s.difficulty);
  const setDifficulty = useEmtStore((s) => s.setDifficulty);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenScroll>
        <Text style={styles.kicker}>SETTINGS</Text>
        <Text style={styles.title}>Default difficulty</Text>
        <Text style={styles.lead}>
          Used when you start a daily challenge from Home. Scenario runs still ask each time.
        </Text>

        <View style={styles.list}>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const selected = difficulty === opt.id;
            return (
              <PressScale
                key={opt.id}
                onPress={() => setDifficulty(opt.id)}
                style={[styles.card, selected && styles.cardOn]}
              >
                <Text style={styles.cardTitle}>{opt.label}</Text>
                <Text style={styles.cardBody}>{opt.description}</Text>
              </PressScale>
            );
          })}
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
    letterSpacing: 1.5,
  },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(34),
    marginTop: 4,
  },
  lead: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(18),
    marginBottom: 16,
  },
  list: { gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
  },
  cardOn: {
    borderColor: theme.colors.emsBlue,
    backgroundColor: theme.colors.cadGlow,
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
  },
  cardBody: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    marginTop: 4,
    lineHeight: fs(18),
  },
});
