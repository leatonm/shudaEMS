import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { RespondTransition } from '@/components/emt/RespondTransition';
import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { enterUp, LiveDot } from '@/components/ui/motion';
import { Characters } from '@/constants/characters';
import { Icons } from '@/constants/icons';
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
        <AppBackdrop tone="danger" />
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
              <LiveDot color={priorityColor} />
              <Text style={[styles.liveText, { color: priorityColor }]}>LIVE</Text>
            </View>
          </View>
          <View style={styles.unitRow}>
            <Text style={styles.unit}>{call.unit}</Text>
            <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                PRIORITY {call.priority}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={enterUp(1)} style={styles.heroWrap}>
          <LinearGradient
            colors={[`${catColor}40`, 'rgba(8,18,28,0.94)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: catColor }]}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.complaint}>{call.dispatch}</Text>
                <Text style={styles.patientLine}>
                  {call.age}-year-old {call.sex.toLowerCase()}
                </Text>
              </View>
              <Image
                source={Characters.ambulance.image}
                style={styles.heroArt}
                resizeMode="contain"
              />
            </View>

            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>CAD NOTES</Text>
              <Text style={styles.notesValue}>{call.cadNotes}</Text>
            </View>

            <View style={styles.tileRow}>
              <DataTile
                label="ETA FROM STATION"
                value={`~${call.distanceMiles} MIN`}
                accent={theme.colors.emsBlue}
                icon={Icons.time}
              />
              <DataTile
                label="TIME OF DAY"
                value={call.timeOfDay.toUpperCase()}
                accent={theme.colors.accent}
                icon={Icons.calendar}
              />
              <DataTile
                label="WEATHER"
                value={call.weather.toUpperCase()}
                accent={theme.colors.accentLight}
                icon={Icons.info}
              />
            </View>

            <View style={styles.categoryChip}>
              <Text style={[styles.categoryText, { color: catColor }]}>
                {call.category.toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Acknowledge and begin response.</Text>
          <ShiftButton
            label="RESPOND  >>"
            onPress={() => setTransitioning(true)}
            disabled={transitioning}
            accentColor={theme.colors.emsBlue}
            glow
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

function DataTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: (typeof Icons)[keyof typeof Icons];
}) {
  return (
    <View style={[styles.tile, { borderColor: `${accent}66` }]}>
      <Image source={icon} style={styles.tileIcon} resizeMode="contain" />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: accent }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  shell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 16,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { color: theme.colors.textMuted },
  cadHeader: {
    marginBottom: 14,
  },
  cadHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: 'rgba(5,12,20,0.55)',
  },
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
    fontSize: fs(44),
    letterSpacing: 1,
    textShadowColor: theme.colors.cadGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  priorityBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(5,12,20,0.55)',
  },
  priorityText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.2,
  },
  heroWrap: { flex: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  complaint: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(28),
    letterSpacing: 0.6,
    lineHeight: fs(32),
  },
  patientLine: {
    color: theme.colors.accentLight,
    fontSize: fs(14),
    fontWeight: '700',
    marginTop: 4,
  },
  heroArt: {
    width: 88,
    height: 64,
    marginTop: 2,
  },
  notesBlock: {
    backgroundColor: 'rgba(5,12,20,0.55)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  notesLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
  },
  notesValue: {
    color: theme.colors.text,
    fontSize: fs(13),
    lineHeight: fs(18),
    fontWeight: '600',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(5,12,20,0.62)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
    alignItems: 'flex-start',
  },
  tileIcon: { width: 16, height: 16, opacity: 0.9 },
  tileLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(7),
    letterSpacing: 0.8,
  },
  tileValue: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 0.3,
    lineHeight: fs(14),
  },
  categoryChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(5,12,20,0.45)',
  },
  categoryText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
  },
  footer: {
    marginTop: 'auto',
    gap: 10,
    paddingTop: 18,
    paddingBottom: 4,
  },
  hint: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(12),
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
