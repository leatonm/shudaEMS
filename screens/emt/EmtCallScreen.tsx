import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResourceFlash } from '@/components/characters/AlsFlash';
import { LaurenFlash } from '@/components/characters/LaurenFlash';
import { RawrEasterEgg } from '@/components/characters/RawrEasterEgg';
import { AppBackdrop } from '@/components/ui/AppBackdrop';
import { PressScale, LiveDot } from '@/components/ui/motion';
import { ShiftButton } from '@/components/ui/ShiftUI';
import { Icons } from '@/constants/icons';
import { fs } from '@/constants/layout';
import { categoryColor, priorityColors, theme } from '@/constants/theme';
import {
  ACTION_MENU_ROOTS,
  ACTION_MENUS,
  type ActionMenuNode,
  type ActionMenuRoot,
} from '@/data/emt/actionMenu';
import { showCallTimer, isPracticeMode } from '@/data/emt/difficulty';
import { getSoftConsiderations } from '@/data/emt/laurenCoach';
import { getNremtStage } from '@/data/emt/nremtFlow';
import { recommendedRootForStage } from '@/data/emt/stageGuide';
import type { EmtCall } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

const ROOT_ICONS: Record<ActionMenuRoot | 'ask', (typeof Icons)[keyof typeof Icons]> = {
  scene: Icons.home,
  assessment: Icons.scenario,
  interventions: Icons.medical,
  resources: Icons.ambulance,
  transport: Icons.progress,
  ask: Icons.message,
};

const ROOT_ACCENTS: Record<ActionMenuRoot | 'ask', string> = {
  scene: theme.colors.accent,
  assessment: theme.colors.emsBlue,
  interventions: theme.colors.success,
  resources: theme.colors.violet,
  transport: theme.colors.critical,
  ask: theme.colors.accentLight,
};

function tintGradient(accent: string): [string, string] {
  return [`${accent}33`, 'rgba(8,18,28,0.96)'];
}

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
  const revealedVitals = useEmtStore((s) => s.revealedVitals);
  const pendingFollowUps = useEmtStore((s) => s.pendingFollowUps);
  const completedActions = useEmtStore((s) => s.completedActions);
  const treatments = useEmtStore((s) => s.treatments);
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
  const difficulty = useEmtStore((s) => s.difficulty);
  const showTimer = showCallTimer(difficulty);

  const [root, setRoot] = useState<ActionMenuRoot | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [rawrVisible, setRawrVisible] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const [cadExpanded, setCadExpanded] = useState(false);

  const activeLauren = laurenFlashQueue[0] ?? null;

  useEffect(() => {
    if (phase === 'handoff') router.replace('/emt/handoff' as Href);
    if (phase === 'debrief') router.replace('/emt/debrief' as Href);
  }, [phase, router]);

  // Return to the menu list on board advance — never leave them trapped in a folder.
  useEffect(() => {
    setRoot(null);
    setPath([]);
    setAskOpen(false);
  }, [nremtStage]);

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
    if (!showTimer || !arrivedAt) {
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
  }, [arrivedAt, showTimer]);

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
        <AppBackdrop tone="danger" />
        <View style={styles.centered}>
          <Text style={styles.muted}>No active call.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const act = (actionId: string) => {
    clearFollowUps();
    performMenuAction(actionId);
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

    if (/\brawr\b/.test(q)) {
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
      [/rapid assess/, 'rapid_assessment'],
      [/focused assess/, 'focused_assessment'],
      [/secondary/, 'focused_assessment'],
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
    setAskText('');
    if (hit) {
      act(hit[1]);
      return;
    }
    act('ask_unclear');
  };

  const priorityColor = priorityColors[call.priority] ?? theme.colors.emsBlue;
  const onCall =
    phase === 'on_scene' ||
    phase === 'scene_safety' ||
    phase === 'primary_survey' ||
    phase === 'history';
  const stageInfo = getNremtStage(nremtStage, call.category);
  const catColor = categoryColor(call.category);
  const recommendedRoot = recommendedRootForStage(nremtStage);
  const practice = isPracticeMode(difficulty);
  const softTips =
    practice && onCall
      ? getSoftConsiderations({
          completedActions,
          treatments,
          nremtStage,
          activeRoot: askOpen ? 'ask' : root,
          call,
          vitals,
        })
      : [];

  const selectRoot = (id: ActionMenuRoot) => {
    setRoot(id);
    setPath([]);
    setAskOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AppBackdrop />
      <View style={styles.shell}>
        <DispatchStrip
          call={call}
          priorityColor={priorityColor}
          catColor={catColor}
          expanded={cadExpanded}
          onToggle={() => setCadExpanded((v) => !v)}
          elapsed={elapsed}
          showTimer={showTimer}
        />

        <LinearGradient
          colors={['rgba(0,229,255,0.1)', 'rgba(8,18,28,0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.status}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle} numberOfLines={1}>
              {stageInfo.title.toUpperCase()}
            </Text>
            {showTimer ? (
              <View style={styles.timerChip}>
                <LiveDot color={theme.colors.critical} size={5} />
                <Text style={[styles.timerText, { color: theme.colors.critical }]}>
                  {elapsed}
                </Text>
              </View>
            ) : (
              <Text style={styles.practiceChipText}>PRACTICE</Text>
            )}
          </View>
          <View style={styles.statusRow}>
            <StatusChip label="Age" value={String(call.age)} />
            <StatusChip label="Sex" value={call.sex} />
            <StatusChip
              label="HR"
              value={revealedVitals.hr ? String(vitals.hr) : '—'}
              tone={
                revealedVitals.hr && (vitals.hr >= 100 || vitals.hr < 60)
                  ? 'critical'
                  : 'normal'
              }
            />
            <StatusChip
              label="BP"
              value={revealedVitals.bp ? vitals.bp : '—'}
            />
            <StatusChip
              label="RR"
              value={revealedVitals.rr ? String(vitals.rr) : '—'}
              tone={
                revealedVitals.rr && (vitals.rr >= 24 || vitals.rr < 10)
                  ? 'warn'
                  : 'normal'
              }
            />
            <StatusChip
              label="SpO₂"
              value={revealedVitals.spo2 ? `${vitals.spo2}%` : '—'}
              tone={
                revealedVitals.spo2 && vitals.spo2 < 94 ? 'critical' : 'normal'
              }
            />
          </View>
        </LinearGradient>

        {/* Always-horizontal menu strip — same whether a folder is open or not */}
        {onCall ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.menuStrip}
            contentContainerStyle={styles.rootTabs}
          >
            {ACTION_MENU_ROOTS.map((item) => {
              const accent = ROOT_ACCENTS[item.id];
              const active = root === item.id;
              const recommended = item.id === recommendedRoot;
              return (
                <PressScale
                  key={item.id}
                  onPress={() => selectRoot(item.id)}
                  style={styles.rootTabOuter}
                >
                  <View
                    style={[
                      styles.rootTab,
                      { borderColor: accent },
                      active ? { backgroundColor: `${accent}28` } : null,
                      recommended && !active ? styles.rootTabGuide : null,
                    ]}
                  >
                    <Image
                      source={ROOT_ICONS[item.id]}
                      style={styles.rootTabIcon}
                      resizeMode="contain"
                    />
                    <Text style={[styles.rootTabText, { color: accent }]}>
                      {item.label}
                    </Text>
                  </View>
                </PressScale>
              );
            })}
            <PressScale
              onPress={() => setAskOpen((v) => !v)}
              style={styles.rootTabOuter}
            >
              <View
                style={[
                  styles.rootTab,
                  { borderColor: ROOT_ACCENTS.ask },
                  askOpen ? { backgroundColor: `${ROOT_ACCENTS.ask}22` } : null,
                ]}
              >
                <Image
                  source={ROOT_ICONS.ask}
                  style={styles.rootTabIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.rootTabText, { color: ROOT_ACCENTS.ask }]}>Ask</Text>
              </View>
            </PressScale>
          </ScrollView>
        ) : null}

        {onCall && practice && softTips.length > 0 ? (
          <View style={styles.coachWhisper} accessibilityRole="text">
            <Text style={styles.coachWhisperKicker}>COACH</Text>
            {softTips.map((tip) => (
              <Text key={tip} style={styles.coachWhisperText}>
                {tip}
              </Text>
            ))}
          </View>
        ) : null}

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
                      style={styles.actionOuter}
                    >
                      <LinearGradient
                        colors={tintGradient(theme.colors.emsBlue)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.actionBtn, { borderColor: theme.colors.emsBlue }]}
                      >
                        <Text style={styles.actionLabel}>{fu.label}</Text>
                      </LinearGradient>
                    </PressScale>
                  ))}
                </View>
              ) : null}

              {root ? (
                <View style={styles.subMenu}>
                  <Text style={styles.subBreadcrumb}>{breadcrumb}</Text>
                  {nodes.map((node) => {
                    const done =
                      !!node.actionId &&
                      !node.repeatable &&
                      completedActions.includes(node.actionId);
                    const reassessPasses =
                      node.actionId === 'reassessment'
                        ? completedActions.filter((id) => id === 'reassessment')
                            .length
                        : 0;
                    const accent = done
                      ? theme.colors.success
                      : ROOT_ACCENTS[root] ?? theme.colors.emsBlue;
                    return (
                      <PressScale
                        key={node.id}
                        onPress={() => openNode(node)}
                        style={styles.actionOuter}
                      >
                        <LinearGradient
                          colors={tintGradient(accent)}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.actionBtn, { borderColor: accent }]}
                        >
                          <Text style={styles.actionLabel}>
                            {node.label}
                            {reassessPasses > 0 ? ` · ×${reassessPasses}` : ''}
                          </Text>
                          {node.children?.length ? (
                            <Image
                              source={Icons.arrowRight}
                              style={styles.moreIcon}
                              resizeMode="contain"
                            />
                          ) : done ? (
                            <Image
                              source={Icons.check}
                              style={styles.doneIcon}
                              resizeMode="contain"
                            />
                          ) : null}
                        </LinearGradient>
                      </PressScale>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyMenus}>
                  Pick a menu above — Size-Up, Assessment, Treatment, Resources, or Transport.
                </Text>
              )}
            </View>
          ) : null}
        </ScrollView>

        {onCall && askOpen ? (
          <View style={styles.askDock}>
            <TextInput
              style={styles.askInput}
              placeholder={'e.g. "I\'d like a blood pressure."'}
              placeholderTextColor={theme.colors.textMuted}
              value={askText}
              onChangeText={setAskText}
              onSubmitEditing={interpretAsk}
              autoFocus
            />
            <ShiftButton
              label="ASK"
              onPress={interpretAsk}
              accentColor={theme.colors.emsBlue}
              glow
            />
          </View>
        ) : null}

        {onCall ? (
          <View style={styles.bottomBar}>
            <View style={styles.bottomRow}>
              <PressScale
                disabled={!root}
                onPress={() => {
                  if (!root) return;
                  if (path.length) setPath((p) => p.slice(0, -1));
                  else setRoot(null);
                }}
                style={[styles.menuBackBtn, !root && styles.menuBackBtnInactive]}
              >
                <Image
                  source={Icons.back}
                  style={[styles.backIcon, !root && styles.backIconInactive]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.menuBackText,
                    !root && styles.menuBackTextInactive,
                  ]}
                >
                  BACK
                </Text>
              </PressScale>
              <View style={styles.advanceWrap}>
                <ShiftButton
                  label={`${stageInfo.advanceLabel}  >>`}
                  onPress={advanceNremtStage}
                  accentColor={theme.colors.emsBlue}
                  glow
                />
              </View>
            </View>
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
  catColor,
  expanded,
  onToggle,
  elapsed,
  showTimer,
}: {
  call: EmtCall;
  priorityColor: string;
  catColor: string;
  expanded: boolean;
  onToggle: () => void;
  elapsed: string;
  showTimer: boolean;
}) {
  return (
    <PressScale onPress={onToggle} style={styles.cadOuter}>
      <LinearGradient
        colors={tintGradient(catColor)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cadStrip, { borderColor: catColor }]}
      >
        <View style={styles.cadTop}>
          <Text style={styles.cadKicker}>ACTIVE CALL</Text>
          <View style={styles.cadTopRight}>
            <View style={[styles.priorityPill, { borderColor: priorityColor }]}>
              <Text style={[styles.cadPriority, { color: priorityColor }]}>
                P{call.priority}
              </Text>
            </View>
            {showTimer ? (
              <View style={styles.timerChip}>
                <LiveDot color={theme.colors.critical} size={6} />
                <Text style={[styles.timerText, { color: theme.colors.critical }]}>
                  {elapsed}
                </Text>
              </View>
            ) : null}
            <Text style={styles.cadToggle}>{expanded ? '▴' : '▾'}</Text>
          </View>
        </View>
        <View style={styles.cadUnitRow}>
          <Text style={styles.cadUnit}>{call.unit}</Text>
          <Text style={styles.cadComplaint} numberOfLines={expanded ? 3 : 1}>
            {call.dispatch}
          </Text>
        </View>
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
            {call.age}yo {call.sex} · tap CAD to expand
          </Text>
        )}
      </LinearGradient>
    </PressScale>
  );
}

function StatusChip({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'warn' | 'critical';
}) {
  const unknown = value === '—';
  const valueColor =
    tone === 'critical'
      ? theme.colors.critical
      : tone === 'warn'
        ? theme.colors.warning
        : theme.colors.text;
  return (
    <View style={[styles.chip, unknown && styles.chipUnknown]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color: valueColor }, unknown && styles.chipValueUnknown]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: theme.colors.textMuted },
  shell: { flex: 1, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 6 },
  cadOuter: { borderRadius: 12, marginBottom: 6 },
  cadStrip: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  cadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cadKicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.3,
  },
  cadTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cadUnitRow: {
    gap: 2,
    marginBottom: 2,
  },
  cadUnit: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 0.8,
    lineHeight: fs(24),
  },
  cadPriority: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1,
  },
  cadToggle: { color: theme.colors.textMuted, fontSize: fs(12) },
  cadComplaint: {
    color: theme.colors.text,
    fontSize: fs(13),
    lineHeight: fs(17),
    fontWeight: '700',
  },
  cadMeta: { marginTop: 6, gap: 2 },
  cadMetaText: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  cadMetaMuted: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    marginTop: 2,
    opacity: 0.85,
  },
  status: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  statusTitle: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1,
    flex: 1,
    marginRight: 8,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.critical,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,45,85,0.12)',
  },
  timerText: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.6,
  },
  practiceChipText: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 0.8,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 4 },
  chip: {
    backgroundColor: 'rgba(5,12,20,0.7)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 40,
    flexGrow: 1,
    flexBasis: 0,
  },
  chipUnknown: { opacity: 0.7 },
  chipLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(7),
    letterSpacing: 0.5,
  },
  chipValue: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    marginTop: 0,
  },
  chipValueUnknown: { color: theme.colors.textMuted, fontSize: fs(10) },
  menuStrip: {
    flexGrow: 0,
    marginBottom: 4,
  },
  coachWhisper: {
    borderWidth: 1,
    borderColor: 'rgba(255,197,49,0.35)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,197,49,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 2,
  },
  coachWhisperKicker: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  coachWhisperText: {
    color: theme.colors.text,
    fontSize: fs(12),
    lineHeight: fs(16),
    fontWeight: '500',
  },
  rootTabs: {
    gap: 5,
    paddingVertical: 2,
    paddingRight: 8,
  },
  rootTabOuter: { borderRadius: 8 },
  rootTab: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
    gap: 1,
    backgroundColor: 'rgba(8,18,28,0.88)',
  },
  rootTabGuide: {
    borderStyle: 'dashed',
  },
  rootTabIcon: { width: 16, height: 16 },
  rootTabText: {
    fontFamily: 'BebasNeue',
    fontSize: fs(12),
    letterSpacing: 0.3,
  },
  emptyMenus: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(17),
    marginTop: 6,
    textAlign: 'center',
  },
  subBreadcrumb: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(16),
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  phaseScroll: { flex: 1 },
  phaseContent: { paddingBottom: 8 },
  phaseBlock: { gap: 8 },
  prompt: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(18),
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actionOuter: { borderRadius: 10 },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  actionLabel: {
    color: theme.colors.text,
    fontSize: fs(14),
    fontWeight: '700',
  },
  moreIcon: { width: 12, height: 12, opacity: 0.8 },
  doneIcon: { width: 16, height: 16 },
  subMenu: { gap: 6 },
  followUps: { gap: 6 },
  askDock: {
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  askInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.emsBlue,
    borderRadius: 10,
    backgroundColor: 'rgba(8,18,28,0.9)',
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fs(14),
  },
  bottomBar: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  menuBackBtn: {
    minWidth: 88,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.emsBlue,
    backgroundColor: 'rgba(0,229,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    marginBottom: theme.spacing.sm,
  },
  menuBackBtnInactive: {
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(8,18,28,0.7)',
    opacity: 0.45,
  },
  backIcon: { width: 12, height: 12 },
  backIconInactive: { opacity: 0.5 },
  menuBackText: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1,
  },
  menuBackTextInactive: {
    color: theme.colors.textMuted,
  },
  advanceWrap: {
    flex: 1,
  },
});
