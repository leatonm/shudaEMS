import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { dispatchLaurenLines } from '@/data/emt/laurenFindings';
import { useEmtStore } from '@/store/emtStore';

export default function DispatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useEmtStore((s) => s.call);
  const acknowledgeDispatch = useEmtStore((s) => s.acknowledgeDispatch);

  if (!call || call.id !== id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Dispatch not found.</Text>
          <ShiftButton label="HOME" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const lines = dispatchLaurenLines(call);

  const respond = () => {
    acknowledgeDispatch();
    router.replace(`/emt/call/${call.id}` as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenScroll>
        <Animated.View entering={FadeInLeft.springify().damping(16)} style={styles.laurenRow}>
          <Image
            source={Characters.lauren.image}
            resizeMode="contain"
            style={styles.lauren}
          />
          <View style={styles.bubbleCol}>
            <Text style={styles.callsign}>LAUREN · EVALUATOR</Text>
            {lines.map((line) => (
              <View key={line} style={styles.bubble}>
                <Text style={styles.intro}>{line}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <ShiftButton label="RESPOND" onPress={respond} accentColor={theme.colors.emsBlue} />
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { color: theme.colors.textMuted },
  laurenRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 24,
    marginTop: 8,
  },
  lauren: { width: 130, height: 220 },
  bubbleCol: { flex: 1, gap: 8, paddingBottom: 28 },
  callsign: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  bubble: {
    backgroundColor: 'rgba(2, 10, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 12,
    padding: 12,
  },
  intro: {
    color: theme.colors.text,
    fontSize: fs(15),
    lineHeight: fs(22),
    fontWeight: '600',
  },
});
