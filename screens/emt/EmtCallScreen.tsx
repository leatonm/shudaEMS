import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResourceFlash } from '@/components/characters/AlsFlash';
import { PressScale } from '@/components/ui/motion';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import {
  ACTION_MENU_ROOTS,
  ACTION_MENUS,
  type ActionMenuNode,
  type ActionMenuRoot,
} from '@/data/emt/actionMenu';
import { showActionTips } from '@/data/emt/difficulty';
import type { ResponseCode } from '@/lib/characterDialogue';
import { useEmtStore } from '@/store/emtStore';

const RESPONDING_ACTIONS: ActionMenuNode[] = [
  { id: 'read_cad', label: 'Review CAD Information', actionId: 'read_cad' },
  { id: 'read_dispatch', label: 'Review Dispatch Notes', actionId: 'read_dispatch_notes' },
  { id: 'req_als', label: 'Request Additional Units', actionId: 'request_als' },
  { id: 'req_fire', label: 'Request Fire', actionId: 'request_fire' },
  { id: 'req_pd', label: 'Request Law Enforcement', actionId: 'request_pd' },
  { id: 'equip', label: 'Select Equipment', actionId: 'consider_equipment' },
  {
    id: 'protocols',
    label: 'Review Protocol (Coach Mode)',
    actionId: 'review_protocols',
  },
];

/**
 * Oral practical layout:
 * Lauren (evaluator) · Patient status (known vitals only) · What would you like to do?
 */
export default function EmtCallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const vitals = useEmtStore((s) => s.vitals);
  const difficulty = useEmtStore((s) => s.difficulty);
  const instructorLog = useEmtStore((s) => s.instructorLog);
  const revealedVitals = useEmtStore((s) => s.revealedVitals);
  const pendingFollowUps = useEmtStore((s) => s.pendingFollowUps);
  const completedActions = useEmtStore((s) => s.completedActions);
  const performMenuAction = useEmtStore((s) => s.performMenuAction);
  const continueFromResponding = useEmtStore((s) => s.continueFromResponding);
  const acknowledgeArrival = useEmtStore((s) => s.acknowledgeArrival);
  const clearFollowUps = useEmtStore((s) => s.clearFollowUps);
  const tickPhysio = useEmtStore((s) => s.tickPhysio);
  const arrivedAt = useEmtStore((s) => s.arrivedAt);
  const pendingResourceFlash = useEmtStore((s) => s.pendingResourceFlash);
  const clearPendingResourceFlash = useEmtStore((s) => s.clearPendingResourceFlash);
  const setResourceResponseCode = useEmtStore((s) => s.setResourceResponseCode);

  const [root, setRoot] = useState<ActionMenuRoot | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [elapsed, setElapsed] = useState('00:00');
  const logRef = useRef<ScrollView>(null);
  const tips = showActionTips(difficulty);

  useEffect(() => {
    if (phase === 'handoff') router.replace('/emt/handoff' as Href);
  }, [phase, router]);

  useEffect(() => {
    logRef.current?.scrollToEnd({ animated: true });
  }, [instructorLog.length]);

  useEffect(() => {
    if (phase !== 'on_scene' && phase !== 'arrival') return;
    const id = setInterval(() => tickPhysio(), 2000);
    return () => clearInterval(id);
  }, [phase, tickPhysio]);

  useEffect(() => {
    if (!arrivedAt) {
      setElapsed('00:00');
      return;
    }
    const tick = () => {
      const sec = Math.max(0, Math.floor((Date.now() - arrivedAt) / 1000));
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      setElapsed(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [arrivedAt]);

  const nodes = useMemo(() => {
    if (!root) return [];
    let list = ACTION_MENUS[root];
    for (const seg of path) {
      const next = list.find((n) => n.id === seg);
      list = next?.children ?? [];
    }
    return list.filter((n) => !n.alsOnly);
  }, [root, path]);

  if (!call || call.id !== id || !vitals) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.muted}>No active call.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const act = (actionId: string) => {
    clearFollowUps();
    performMenuAction(actionId);
    setRoot(null);
    setPath([]);
    setAskOpen(false);
    setAskText('');
  };

  const openNode = (node: ActionMenuNode) => {
    if (node.children?.length) {
      setPath((p) => [...p, node.id]);
      return;
    }
    if (node.actionId) act(node.actionId);
  };

  const interpretAsk = () => {
    const q = askText.trim().toLowerCase();
    if (!q) return;
    const map: Array<[RegExp, string]> = [
      [/blood pressure|bp\b/, 'vital_bp'],
      [/pulse(?! ox)|heart rate|\bhr\b/, 'vital_pulse'],
      [/respirat|breathing rate|\brr\b/, 'vital_rr'],
      [/spo2|pulse ox|oximetry/, 'check_spo2'],
      [/glucose|bgl|sugar/, 'blood_glucose'],
      [/lung/, 'lung_sounds'],
      [/pupil/, 'disability'],
      [/airway/, 'airway'],
      [/breathing/, 'breathing'],
      [/circulation|pulse check/, 'circulation'],
      [/impression/, 'general_impression'],
      [/oxygen|\bo2\b/, 'oxygen'],
      [/aspirin|asa/, 'aspirin'],
      [/nitro/, 'nitroglycerin'],
      [/scene safe|is the scene/, 'verbalize_scene_safe'],
      [/bsi|ppe|gloves/, 'don_ppe'],
      [/reassess/, 'reassessment'],
    ];
    const hit = map.find(([re]) => re.test(q));
    if (hit) {
      act(hit[1]);
      return;
    }
    if (difficulty === 'coach') {
      act('consider_resources');
    }
  };

  const portrait =
    call && revealedVitals.bp === undefined
      ? Characters.lauren.image
      : Characters.lauren.image;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        {/* Lauren evaluator panel */}
        <View style={styles.laurenPanel}>
          <Image source={portrait} resizeMode="contain" style={styles.lauren} />
          <View style={styles.logWrap}>
            <Text style={styles.callsign}>LAUREN · EVALUATOR</Text>
            <ScrollView
              ref={logRef}
              style={styles.log}
              contentContainerStyle={styles.logContent}
              showsVerticalScrollIndicator={false}
            >
              {instructorLog.slice(-12).map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.bubble, msg.role === 'you' ? styles.youBubble : styles.laurenBubble]}
                >
                  {msg.role === 'you' ? (
                    <Text style={styles.youLabel}>YOU</Text>
                  ) : null}
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Patient demographics + known vitals only */}
        <View style={styles.status}>
          <Text style={styles.statusTitle}>PATIENT STATUS</Text>
          <View style={styles.demoRow}>
            <StatusChip label="Age" value={String(call.age)} />
            <StatusChip label="Sex" value={call.sex} />
            <StatusChip
              label="Status"
              value={
                phase === 'responding'
                  ? 'En route'
                  : phase === 'arrival'
                    ? 'On scene'
                    : 'Waiting'
              }
            />
            <StatusChip label="Time Since Arrival" value={elapsed} />
          </View>
          <View style={styles.statusRow}>
            <StatusChip label="HR" value={revealedVitals.hr ? String(vitals.hr) : 'Unknown'} />
            <StatusChip label="BP" value={revealedVitals.bp ? vitals.bp : 'Unknown'} />
            <StatusChip label="RR" value={revealedVitals.rr ? String(vitals.rr) : 'Unknown'} />
            <StatusChip
              label="SpO₂"
              value={revealedVitals.spo2 ? `${vitals.spo2}%` : 'Unknown'}
            />
          </View>
        </View>

        {/* Phase-specific controls */}
        <View style={styles.actions}>
          {phase === 'responding' ? (
            <>
              <Text style={styles.prompt}>Response phase — prepare if you want.</Text>
              {RESPONDING_ACTIONS.filter(
                (a) => a.actionId !== 'review_protocols' || tips
              ).map((node) => (
                <PressScale
                  key={node.id}
                  onPress={() => node.actionId && act(node.actionId)}
                  style={[
                    styles.actionBtn,
                    node.actionId && completedActions.includes(node.actionId)
                      ? styles.actionDone
                      : null,
                  ]}
                >
                  <Text style={styles.actionLabel}>{node.label}</Text>
                </PressScale>
              ))}
              <ShiftButton
                label="CONTINUE TO SCENE"
                onPress={continueFromResponding}
                accentColor={theme.colors.emsBlue}
              />
            </>
          ) : null}

          {phase === 'arrival' ? (
            <>
              <Text style={styles.prompt}>You are on scene.</Text>
              <ShiftButton
                label="BEGIN ASSESSMENT"
                onPress={acknowledgeArrival}
                accentColor={theme.colors.emsBlue}
              />
            </>
          ) : null}

          {phase === 'on_scene' ? (
            <>
              {pendingFollowUps.length > 0 ? (
                <View style={styles.followUps}>
                  <Text style={styles.prompt}>How do you want to handle this?</Text>
                  {pendingFollowUps.map((fu) => (
                    <PressScale
                      key={fu.id}
                      onPress={() => act(fu.actionId)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionLabel}>{fu.label}</Text>
                    </PressScale>
                  ))}
                </View>
              ) : !root ? (
                <>
                  <Text style={styles.prompt}>What would you like to do?</Text>
                  <View style={styles.rootGrid}>
                    {ACTION_MENU_ROOTS.map((item) => (
                      <PressScale
                        key={item.id}
                        onPress={() => {
                          setRoot(item.id);
                          setPath([]);
                        }}
                        style={styles.rootChip}
                      >
                        <Text style={styles.rootChipText}>{item.label}</Text>
                      </PressScale>
                    ))}
                    <PressScale
                      onPress={() => setAskOpen((v) => !v)}
                      style={[styles.rootChip, styles.askChip]}
                    >
                      <Text style={styles.rootChipText}>Ask Lauren</Text>
                    </PressScale>
                  </View>
                  {askOpen ? (
                    <View style={styles.askBox}>
                      <TextInput
                        style={styles.askInput}
                        placeholder={'e.g. "I\'d like to obtain a blood pressure."'}
                        placeholderTextColor={theme.colors.textMuted}
                        value={askText}
                        onChangeText={setAskText}
                        onSubmitEditing={interpretAsk}
                      />
                      <ShiftButton label="ASK" onPress={interpretAsk} accentColor={theme.colors.emsBlue} />
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.subMenu}>
                  <PressScale
                    onPress={() => {
                      if (path.length) setPath((p) => p.slice(0, -1));
                      else setRoot(null);
                    }}
                  >
                    <Text style={styles.back}>‹ BACK</Text>
                  </PressScale>
                  <Text style={styles.prompt}>
                    {ACTION_MENU_ROOTS.find((r) => r.id === root)?.label}
                  </Text>
                  {nodes.map((node) => (
                    <PressScale
                      key={node.id}
                      onPress={() => openNode(node)}
                      style={[
                        styles.actionBtn,
                        node.actionId && completedActions.includes(node.actionId)
                          ? styles.actionDone
                          : null,
                      ]}
                    >
                      <Text style={styles.actionLabel}>{node.label}</Text>
                      {node.children?.length ? (
                        <Text style={styles.more}>›</Text>
                      ) : null}
                    </PressScale>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </View>
      </View>

      <ResourceFlash
        visible={!!pendingResourceFlash}
        crew={pendingResourceFlash ?? 'als'}
        mode="enroute"
        onConfirm={(code?: ResponseCode) => {
          if (pendingResourceFlash && code) {
            setResourceResponseCode(pendingResourceFlash, code);
          }
          clearPendingResourceFlash();
        }}
      />
    </SafeAreaView>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  const unknown = value === 'Unknown';
  return (
    <View style={[styles.chip, unknown && styles.chipUnknown]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, unknown && styles.chipValueUnknown]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: theme.colors.textMuted },
  shell: { flex: 1, paddingHorizontal: 12, paddingBottom: 8 },
  laurenPanel: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    minHeight: 220,
    maxHeight: 320,
  },
  lauren: { width: 100, height: 200, alignSelf: 'flex-end' },
  logWrap: { flex: 1, paddingTop: 8 },
  callsign: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  log: { flex: 1 },
  logContent: { gap: 8, paddingBottom: 8 },
  bubble: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  laurenBubble: {
    backgroundColor: 'rgba(2, 10, 18, 0.88)',
    borderColor: 'rgba(0, 229, 255, 0.28)',
  },
  youBubble: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    alignSelf: 'flex-end',
    maxWidth: '92%',
  },
  youLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1,
    marginBottom: 2,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: fs(14),
    lineHeight: fs(20),
    fontWeight: '600',
  },
  status: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    marginVertical: 6,
  },
  statusTitle: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  chipUnknown: { opacity: 0.75 },
  chipLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
  },
  chipValue: {
    color: theme.colors.text,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(15),
    marginTop: 2,
  },
  chipValueUnknown: { color: theme.colors.textMuted, fontSize: fs(13) },
  actions: { gap: 8, paddingTop: 4, maxHeight: '42%' },
  prompt: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rootChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: '30%',
    flexGrow: 1,
  },
  askChip: { borderColor: theme.colors.emsBlue },
  rootChipText: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(18),
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionDone: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successGlow,
  },
  actionLabel: {
    color: theme.colors.text,
    fontSize: fs(15),
    fontWeight: '700',
    flex: 1,
  },
  more: { color: theme.colors.emsBlue, fontSize: fs(18) },
  back: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    marginBottom: 4,
  },
  subMenu: { gap: 6 },
  followUps: { gap: 6 },
  askBox: { gap: 8, marginTop: 4 },
  askInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fs(14),
  },
});
