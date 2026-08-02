import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { enterUp } from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

export default function HandoffScreen() {
  const router = useRouter();
  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const handoffText = useEmtStore((s) => s.handoffText);
  const setHandoffText = useEmtStore((s) => s.setHandoffText);
  const submitHandoff = useEmtStore((s) => s.submitHandoff);

  if (!call || phase !== 'handoff') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>No handoff in progress.</Text>
          <ShiftButton label="HOME" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const finish = () => {
    submitHandoff();
    router.replace('/emt/debrief');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenScroll>
        <Animated.Text entering={enterUp(0)} style={styles.kicker}>
          HOSPITAL HANDOFF
        </Animated.Text>
        <Animated.Text entering={enterUp(1)} style={styles.title}>
          You arrive at the Emergency Department.
        </Animated.Text>
        <Animated.Text entering={enterUp(2)} style={styles.lead}>
          Give a concise verbal report (MIST or SBAR). Lauren scores whether critical
          information was included.
        </Animated.Text>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>MIST</Text>
          <Text style={styles.hint}>
            Mechanism / Medical complaint · Injuries / Illness · Signs (vitals) · Treatment given
          </Text>
          <Text style={[styles.hintTitle, { marginTop: 10 }]}>SBAR</Text>
          <Text style={styles.hint}>
            Situation · Background · Assessment · Recommendation
          </Text>
        </View>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Type your handoff…"
          placeholderTextColor={theme.colors.textMuted}
          value={handoffText}
          onChangeText={setHandoffText}
          textAlignVertical="top"
        />

        <ShiftButton
          label="COMPLETE HANDOFF"
          onPress={finish}
          accentColor={theme.colors.emsBlue}
        />
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  muted: { color: theme.colors.textMuted },
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
    marginTop: 6,
    marginBottom: 8,
  },
  lead: {
    color: theme.colors.textMuted,
    fontSize: fs(14),
    lineHeight: fs(20),
    marginBottom: 14,
  },
  hintBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 14,
  },
  hintTitle: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.2,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(18),
    marginTop: 4,
  },
  input: {
    minHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 14,
    fontSize: fs(15),
    lineHeight: fs(22),
    marginBottom: 16,
  },
});
