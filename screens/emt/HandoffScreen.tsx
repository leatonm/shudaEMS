import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { enterUp } from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { categoryColor, priorityColors, theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

const HANDOFF_BG = require('../../assets/images/transport.png');

/** ED arrival — verbal handoff report before debrief. */
export default function HandoffScreen() {
  const router = useRouter();
  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const handoffText = useEmtStore((s) => s.handoffText);
  const setHandoffText = useEmtStore((s) => s.setHandoffText);
  const submitHandoff = useEmtStore((s) => s.submitHandoff);
  const destination = useEmtStore((s) => s.destination);
  const transportPriority = useEmtStore((s) => s.transportPriority);

  if (!call || phase !== 'handoff') {
    return (
      <SafeAreaView style={styles.safe}>
        <AppBackdrop source={HANDOFF_BG} tone="danger" />
        <View style={styles.centered}>
          <Text style={styles.muted}>No handoff in progress.</Text>
          <ShiftButton label="HOME" onPress={() => router.replace('/')} glow />
        </View>
      </SafeAreaView>
    );
  }

  const finish = () => {
    submitHandoff();
    router.replace('/emt/debrief');
  };

  const catColor = categoryColor(call.category);
  const priorityNum = Number(transportPriority ?? call.priority);
  const priorityColor = priorityColors[priorityNum] ?? theme.colors.emsBlue;
  const priorityLabel = transportPriority ?? String(call.priority);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AppBackdrop source={HANDOFF_BG} tone="danger" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enterUp(0)} style={styles.header}>
          <Text style={styles.kicker}>ED ARRIVAL · HANDOFF</Text>
          <Text style={styles.title}>Emergency Department</Text>
          <Text style={styles.lead}>
            Give a concise verbal report. Lauren scores critical details.
          </Text>
        </Animated.View>

        <Animated.View entering={enterUp(1)}>
          <LinearGradient
            colors={[`${catColor}33`, 'rgba(8,18,28,0.94)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cadCard, { borderColor: catColor }]}
          >
            <View style={styles.cadTop}>
              <Text style={styles.unit}>{call.unit}</Text>
              <View style={[styles.priorityPill, { borderColor: priorityColor }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  P{priorityLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.complaint} numberOfLines={2}>
              {call.dispatch}
            </Text>
            <Text style={styles.cadMeta}>
              {call.age}yo {call.sex}
              {destination ? ` · ${destination}` : ''}
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={enterUp(2)} style={styles.frameworkRow}>
          <FrameworkChip
            title="MIST"
            body="Mechanism · Injuries · Signs · Treatment"
            accent={theme.colors.emsBlue}
          />
          <FrameworkChip
            title="SBAR"
            body="Situation · Background · Assess · Rec"
            accent={theme.colors.accent}
          />
        </Animated.View>

        <Animated.View entering={enterUp(3)} style={styles.reportBlock}>
          <Text style={styles.reportLabel}>VERBAL REPORT</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Type your handoff…"
            placeholderTextColor={theme.colors.textMuted}
            value={handoffText}
            onChangeText={setHandoffText}
            textAlignVertical="top"
          />
        </Animated.View>

        <ShiftButton
          label="COMPLETE HANDOFF  >>"
          onPress={finish}
          accentColor={theme.colors.critical}
          glow
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function FrameworkChip({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <View style={[styles.chip, { borderColor: `${accent}88` }]}>
      <Text style={[styles.chipTitle, { color: accent }]}>{title}</Text>
      <Text style={styles.chipBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  muted: { color: theme.colors.textMuted },
  header: {
    alignItems: 'center',
    marginBottom: 2,
  },
  kicker: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(28),
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: theme.colors.dangerGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  lead: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(16),
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  cadCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    overflow: 'hidden',
  },
  cadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  unit: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 0.8,
  },
  priorityPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(5,12,20,0.55)',
  },
  priorityText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1,
  },
  complaint: {
    color: theme.colors.text,
    fontSize: fs(13),
    fontWeight: '700',
    lineHeight: fs(17),
  },
  cadMeta: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(10),
    letterSpacing: 0.3,
  },
  frameworkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(8,18,28,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
  },
  chipTitle: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.2,
  },
  chipBody: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    lineHeight: fs(13),
  },
  reportBlock: { gap: 6 },
  reportLabel: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
  },
  input: {
    minHeight: 120,
    maxHeight: 180,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(8,18,28,0.9)',
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
});
