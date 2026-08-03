import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { RespondTransition } from '@/components/emt/RespondTransition';
import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { enterUp } from '@/components/ui/motion';
import { fs } from '@/constants/layout';
import { categoryColor, priorityColors, theme } from '@/constants/theme';
import { useEmtStore } from '@/store/emtStore';

/** CAD-style dispatch briefing — no evaluator character. */
export default function DispatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useEmtStore((s) => s.call);
  const acknowledgeDispatch = useEmtStore((s) => s.acknowledgeDispatch);
  const [transitioning, setTransitioning] = useState(false);

  const finishRespond = useCallback(() => {
    if (!call) return;
    acknowledgeDispatch();
    // Replace dispatch so Back from the call returns to Difficulty.
    router.replace(`/emt/call/${call.id}` as Href);
  }, [acknowledgeDispatch, call, router]);

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

  const priorityColor = priorityColors[call.priority] ?? theme.colors.emsBlue;
  const catColor = categoryColor(call.category);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AppBackdrop />
      <View style={styles.shell}>
        <Animated.View entering={enterUp(0)} style={styles.cadHeader}>
          <View style={styles.cadHeaderTop}>
            <Text style={styles.cadKicker}>DISPATCH · CAD</Text>
            <View style={[styles.livePill, { borderColor: priorityColor }]}>
              <View style={[styles.liveDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.liveText, { color: priorityColor }]}>LIVE</Text>
            </View>
          </View>
          <View style={styles.unitRow}>
            <Text style={styles.unit}>{call.unit}</Text>
            <Text style={[styles.priorityBadge, { color: priorityColor, borderColor: priorityColor }]}>
              PRIORITY {call.priority}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={enterUp(1)}
          style={[styles.card, { borderColor: catColor }]}
        >
          <Text style={styles.complaint}>{call.dispatch}</Text>
          <Text style={styles.patientLine}>
            {call.age}-year-old {call.sex.toLowerCase()}
          </Text>

          <View style={styles.divider} />

          <CadRow label="CAD NOTES" value={call.cadNotes} />
          <CadRow label="CATEGORY" value={call.category.toUpperCase()} accent={catColor} />
          <CadRow
            label="ETA FROM STATION"
            value={`Approx. ${call.distanceMiles} min`}
          />
          <CadRow label="TIME OF DAY" value={call.timeOfDay} />
          <CadRow label="WEATHER" value={call.weather} />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Acknowledge and begin response.</Text>
          <ShiftButton
            label="RESPOND"
            onPress={() => setTransitioning(true)}
            disabled={transitioning}
            accentColor={theme.colors.emsBlue}
          />
        </View>
      </View>

      <RespondTransition
        visible={transitioning}
        unit={call.unit}
        onComplete={finishRespond}
      />
    </SafeAreaView>
  );
}

function CadRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.cadRow}>
      <Text style={styles.cadLabel}>{label}</Text>
      <Text style={[styles.cadValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  shell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { color: theme.colors.textMuted },
  cadHeader: {
    marginBottom: 18,
  },
  cadHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cadKicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.6,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  unit: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(40),
    letterSpacing: 1,
  },
  priorityBadge: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.2,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  card: {
    backgroundColor: 'rgba(8,18,28,0.88)',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  complaint: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(30),
    letterSpacing: 0.6,
    lineHeight: fs(34),
  },
  patientLine: {
    color: theme.colors.accentLight,
    fontSize: fs(16),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  cadRow: {
    gap: 2,
  },
  cadLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
  },
  cadValue: {
    color: theme.colors.text,
    fontSize: fs(15),
    lineHeight: fs(21),
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    gap: 10,
    paddingTop: 24,
    paddingBottom: 8,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    textAlign: 'center',
  },
});
