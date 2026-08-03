import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResourceFlash } from '@/components/characters/AlsFlash';
import { LaurenFlash } from '@/components/characters/LaurenFlash';
import { RawrEasterEgg } from '@/components/characters/RawrEasterEgg';
import { PressScale } from '@/components/ui/motion';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { fs } from '@/constants/layout';
import { categoryColor, priorityColors, theme } from '@/constants/theme';
import {
  ACTION_MENU_ROOTS,
  ACTION_MENUS,
  type ActionMenuNode,
  type ActionMenuRoot,
} from '@/data/emt/actionMenu';
import { showActionTips } from '@/data/emt/difficulty';
import { getNremtStage } from '@/data/emt/nremtFlow';
import type { EmtCall } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

/**
 * Free oral-exam call: CAD + vitals on top, choose any next action,
 * Lauren findings via slide-in modal. Bottom CTA advances NREMT board stages.
 */
export default function EmtCallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useEmtStore((s) => s.call);
  const phase = useEmtStore((s) => s.phase);
  const vitals = useEmtStore((s) => s.vitals);
  const difficulty = useEmtStore((s) => s.difficulty);
  const revealedVitals = useEmtStore((s) => s.revealedVitals);
  const pendingFollowUps = useEmtStore((s) => s.pendingFollowUps);
  const completedActions = useEmtStore((s) => s.completedActions);
  const performMenuAction = useEmtStore((s) => s.performMenuAction);
  const advanceNremtStage = useEmtStore((s) => s.advanceNremtStage);
  const clearFollowUps = useEmtStore((s) => s.clearFollowUps);
  const tickPhysio = useEmtStore((s) => s.tickPhysio);
  const arrivedAt = useEmtStore((s) => s.arrivedAt);
  const pendingResourceFlash = useEmtStore((s) => s.pendingResourceFlash);
  const clearPendingResourceFlash = useEmtStore((s) => s.clearPendingResourceFlash);
  const laurenFlashQueue = useEmtStore((s) => s.laurenFlashQueue);
  const dismissLaurenFlash = useEmtStore((s) => s.dismissLaurenFlash);
  const nremtStage = useEmtStore((s) => s.nremtStage);

  const [root, setRoot] = useState<ActionMenuRoot | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [rawrVisible, setRawrVisible] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const [cadExpanded, setCadExpanded] = useState(true);
  const tips = showActionTips(difficulty);

  const activeLauren = laurenFlashQueue[0] ?? null;

  useEffect(() => {
    if (phase === 'handoff') router.replace('/emt/handoff' as Href);
  }, [phase, router]);

  useEffect(() => {
    if (
      phase !== 'on_scene' &&
      phase !== 'primary_survey' &&
      phase !== 'scene_safety' &&
      phase !== 'history'
    ) {
      return;
    }
    const timer = setInterval(() => tickPhysio(), 2000);
    return () => clearInterval(timer);
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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
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

  const breadcrumb = useMemo(() => {
    if (!root) return null;
    const labels: string[] = [
      ACTION_MENU_ROOTS.find((r) => r.id === root)?.label ?? root,
    ];
    let list = ACTION_MENUS[root];
    for (const seg of path) {
      const next = list.find((n) => n.id === seg);
      if (!next) break;
      labels.push(next.label);
      list = next.children ?? [];
    }
    return labels.join(' › ');
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
    // Keep the current menu open so size-up (and other tabs) stay put.
    setAskOpen(false);
    setAskText('');
  };

  const chooseLauren = (actionId: string) => {
    clearFollowUps();
    performMenuAction(actionId);
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
    // Easter egg — case ignored via toLowerCase above
    if (q === 'the world rawr') {
      setAskOpen(false);
      setAskText('');
      setRawrVisible(true);
      return;
    }
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
      [/cpr/, 'cpr'],
      [/scene safe|is the scene/, 'verbalize_scene_safe'],
      [/bsi|ppe|gloves/, 'don_ppe'],
      [/patients|how many/, 'count_patients'],
      [/moi|noi|mechanism|nature of/, 'assess_moi'],
      [/resources|als|medic|fire|pd|police/, 'consider_resources'],
      [/reassess|update/, 'patient_update'],
    ];
    const hit = map.find(([re]) => re.test(q));
    if (hit) {
      act(hit[1]);
      return;
    }
    if (tips) act('consider_resources');
  };

  const priorityColor = priorityColors[call.priority] ?? theme.colors.emsBlue;
  const onCall =
    phase === 'on_scene' ||
    phase === 'scene_safety' ||
    phase === 'primary_survey' ||
    phase === 'history';
  const stageInfo = getNremtStage(nremtStage, call.category);


  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.shell}>
        <DispatchStrip
          call={call}
          priorityColor={priorityColor}
          expanded={cadExpanded}
          onToggle={() => setCadExpanded((v) => !v)}
          elapsed={elapsed}
        />

        <View style={styles.status}>
          <Text style={styles.statusTitle}>
            NREMT · {stageInfo.title.toUpperCase()} · {elapsed}
          </Text>
          <View style={styles.statusRow}>
            <StatusChip label="Age" value={String(call.age)} />
            <StatusChip label="Sex" value={call.sex} />
            <StatusChip
              label="HR"
              value={revealedVitals.hr ? String(vitals.hr) : 'Unknown'}
            />
            <StatusChip
              label="BP"
              value={revealedVitals.bp ? vitals.bp : 'Unknown'}
            />
            <StatusChip
              label="RR"
              value={revealedVitals.rr ? String(vitals.rr) : 'Unknown'}
            />
            <StatusChip
              label="SpO₂"
              value={revealedVitals.spo2 ? `${vitals.spo2}%` : 'Unknown'}
            />
          </View>
        </View>

        <ScrollView
          style={styles.phaseScroll}
          contentContainerStyle={styles.phaseContent}
          showsVerticalScrollIndicator={false}
        >
          {onCall ? (
            <View style={styles.phaseBlock}>
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
              ) : null}

              {!root ? (
                <>
                  <Text style={styles.prompt}>What would you like to do next?</Text>
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
                        <Text style={styles.rootBlurb}>{item.blurb}</Text>
                      </PressScale>
                    ))}
                    <PressScale
                      onPress={() => setAskOpen((v) => !v)}
                      style={[styles.rootChip, styles.askChip]}
                    >
                      <Text style={styles.rootChipText}>Ask</Text>
                      <Text style={styles.rootBlurb}>Say it in your own words</Text>
                    </PressScale>
                  </View>
                  {askOpen ? (
                    <View style={styles.askBox}>
                      <TextInput
                        style={styles.askInput}
                        placeholder={'e.g. "I\'d like a blood pressure."'}
                        placeholderTextColor={theme.colors.textMuted}
                        value={askText}
                        onChangeText={setAskText}
                        onSubmitEditing={interpretAsk}
                      />
                      <ShiftButton
                        label="ASK"
                        onPress={interpretAsk}
                        accentColor={theme.colors.emsBlue}
                      />
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
                  <Text style={styles.prompt}>{breadcrumb}</Text>
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
                      ) : node.actionId &&
                        completedActions.includes(node.actionId) ? (
                        <Text style={styles.doneMark}>✓</Text>
                      ) : null}
                    </PressScale>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        {onCall ? (
          <View style={styles.bottomBar}>
            <ShiftButton
              label={stageInfo.advanceLabel}
              onPress={advanceNremtStage}
              accentColor={theme.colors.emsBlue}
            />
          </View>
        ) : null}
      </View>

      <LaurenFlash
        flash={rawrVisible ? null : activeLauren}
        onConfirm={dismissLaurenFlash}
        onChoose={chooseLauren}
      />

      <ResourceFlash
        visible={!!pendingResourceFlash && !activeLauren && !rawrVisible}
        crew={pendingResourceFlash ?? 'als'}
        mode="enroute"
        onConfirm={clearPendingResourceFlash}
      />

      <RawrEasterEgg visible={rawrVisible} onDone={() => setRawrVisible(false)} />
    </SafeAreaView>
  );
}

function DispatchStrip({
  call,
  priorityColor,
  expanded,
  onToggle,
  elapsed,
}: {
  call: EmtCall;
  priorityColor: string;
  expanded: boolean;
  onToggle: () => void;
  elapsed: string;
}) {
  const catColor = categoryColor(call.category);
  return (
    <PressScale onPress={onToggle} style={[styles.cadStrip, { borderColor: catColor }]}>
      <View style={styles.cadTop}>
        <Text style={styles.cadUnit}>{call.unit}</Text>
        <Text style={[styles.cadPriority, { color: priorityColor }]}>
          P{call.priority}
        </Text>
        <Text style={styles.cadElapsed}>{elapsed}</Text>
        <Text style={styles.cadToggle}>{expanded ? '▴' : '▾'}</Text>
      </View>
      <Text style={styles.cadComplaint} numberOfLines={expanded ? 3 : 1}>
        {call.dispatch}
      </Text>
      {expanded ? (
        <View style={styles.cadMeta}>
          <Text style={styles.cadMetaText}>
            {call.age}yo {call.sex} · {call.cadNotes}
          </Text>
          <Text style={styles.cadMetaMuted}>
            {call.timeOfDay} · {call.weather}
          </Text>
        </View>
      ) : (
        <Text style={styles.cadMetaMuted}>
          {call.age}yo {call.sex} · tap to expand
        </Text>
      )}
    </PressScale>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  const unknown = value === 'Unknown';
  return (
    <View style={[styles.chip, unknown && styles.chipUnknown]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, unknown && styles.chipValueUnknown]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: theme.colors.textMuted },
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  cadStrip: {
    backgroundColor: 'rgba(8,18,28,0.92)',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  cadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cadUnit: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
    letterSpacing: 0.8,
    flex: 1,
  },
  cadPriority: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1,
  },
  cadElapsed: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
  },
  cadToggle: { color: theme.colors.textMuted, fontSize: fs(14) },
  cadComplaint: {
    color: theme.colors.text,
    fontSize: fs(15),
    lineHeight: fs(20),
    fontWeight: '700',
  },
  cadMeta: { marginTop: 8, gap: 4 },
  cadMetaText: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  cadMetaMuted: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    marginTop: 4,
    opacity: 0.85,
  },
  status: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  statusTitle: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 64,
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
  phaseScroll: { flex: 1 },
  phaseContent: { paddingBottom: 12 },
  phaseBlock: { gap: 8 },
  prompt: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rootChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: '46%',
    flexGrow: 1,
    gap: 4,
  },
  askChip: { borderColor: theme.colors.emsBlue },
  rootChipText: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(20),
  },
  rootBlurb: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(14),
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
  doneMark: {
    color: theme.colors.success,
    fontSize: fs(16),
    fontWeight: '800',
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
  bottomBar: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 6,
  },
  bottomHint: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(15),
    textAlign: 'center',
  },
});
