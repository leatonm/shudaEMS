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
import { showCallTimer } from '@/data/emt/difficulty';
import { getNremtStage } from '@/data/emt/nremtFlow';
import {
  getStageFocus,
  recommendedRootForStage,
  rootRoleBlurb,
} from '@/data/emt/stageGuide';
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
  const stageFocus = getStageFocus(nremtStage, call, completedActions);
  const recommendedRoot = recommendedRootForStage(nremtStage);

  const runQuickAction = (qa: {
    label: string;
    actionId?: string;
    openRoot?: ActionMenuRoot;
    openPath?: string[];
  }) => {
    // Jump to the folder that owns this option so it is visible.
    if (qa.openRoot) {
      setRoot(qa.openRoot);
      setPath(qa.openPath ?? []);
      setAskOpen(false);
    }
    if (qa.actionId) {
      act(qa.actionId);
    }
  };

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
          colors={['rgba(0,229,255,0.12)', 'rgba(8,18,28,0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.status}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>
              NREMT · {stageInfo.title.toUpperCase()}
            </Text>
            {showTimer ? (
              <View style={styles.timerChip}>
                <LiveDot color={theme.colors.critical} size={6} />
                <Text style={[styles.timerText, { color: theme.colors.critical }]}>
                  {elapsed}
                </Text>
              </View>
            ) : (
              <View style={styles.practiceChip}>
                <Text style={styles.practiceChipText}>PRACTICE</Text>
              </View>
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

        <ScrollView
          style={styles.phaseScroll}
          contentContainerStyle={styles.phaseContent}
          showsVerticalScrollIndicator={false}
        >
          {onCall ? (
            <View style={styles.phaseBlock}>
              <View style={styles.focusBanner} pointerEvents="box-none">
                <LinearGradient
                  colors={tintGradient(theme.colors.emsBlue)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.focusInner, { borderColor: theme.colors.emsBlue }]}
                >
                  <Text style={styles.focusKicker}>GUIDE · {stageFocus.title.toUpperCase()}</Text>
                  <Text style={styles.focusHint}>{stageFocus.hint}</Text>
                  <Text style={styles.focusAdvance}>{stageFocus.advanceHint}</Text>
                </LinearGradient>
              </View>

              {stageFocus.quickActions.length > 0 ? (
                <View style={styles.quickWrap}>
                  <Text style={styles.quickLabel}>SUGGESTED (OPTIONAL)</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickRow}
                  >
                    {stageFocus.quickActions.map((qa) => {
                      const isFolder = Boolean(qa.openRoot) && !qa.actionId;
                      return (
                        <PressScale
                          key={`${qa.label}-${qa.actionId ?? qa.openRoot}-${(qa.openPath ?? []).join('.')}`}
                          onPress={() => runQuickAction(qa)}
                          style={styles.quickChipOuter}
                        >
                          <View
                            style={[
                              styles.quickChip,
                              isFolder ? styles.quickChipFolder : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.quickChipText,
                                isFolder ? styles.quickChipFolderText : null,
                              ]}
                            >
                              {isFolder ? `${qa.label} ›` : qa.label}
                            </Text>
                          </View>
                        </PressScale>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

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

              {!root ? (
                <>
                  <Text style={styles.prompt}>Choose a menu</Text>
                  <View style={styles.rootGrid}>
                    {ACTION_MENU_ROOTS.map((item) => {
                      const accent = ROOT_ACCENTS[item.id];
                      const recommended = item.id === recommendedRoot;
                      const blurb = rootRoleBlurb(item.id, nremtStage) || item.blurb;
                      return (
                        <PressScale
                          key={item.id}
                          onPress={() => selectRoot(item.id)}
                          style={styles.rootOuter}
                        >
                          <LinearGradient
                            colors={tintGradient(accent)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                              styles.rootChip,
                              { borderColor: accent },
                              recommended ? styles.rootChipHot : null,
                            ]}
                          >
                            {recommended ? (
                              <Text style={[styles.rootBadge, { color: accent }]}>GUIDE</Text>
                            ) : null}
                            <Image
                              source={ROOT_ICONS[item.id]}
                              style={styles.rootIcon}
                              resizeMode="contain"
                            />
                            <Text style={[styles.rootChipText, { color: accent }]}>
                              {item.label}
                            </Text>
                            <Text style={styles.rootBlurb}>{blurb}</Text>
                          </LinearGradient>
                        </PressScale>
                      );
                    })}
                  </View>

                  <View style={styles.compactRow}>
                    <PressScale
                      onPress={() => setAskOpen((v) => !v)}
                      style={styles.compactOuter}
                    >
                      <LinearGradient
                        colors={tintGradient(ROOT_ACCENTS.ask)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.compactChip,
                          { borderColor: ROOT_ACCENTS.ask },
                          askOpen ? styles.compactChipActive : null,
                        ]}
                      >
                        <Image
                          source={ROOT_ICONS.ask}
                          style={styles.compactIcon}
                          resizeMode="contain"
                        />
                        <Text style={[styles.compactText, { color: ROOT_ACCENTS.ask }]}>
                          Ask
                        </Text>
                      </LinearGradient>
                    </PressScale>
                  </View>
                </>
              ) : (
                <View style={styles.subMenu}>
                  {/* Switch menus without going back to the grid first */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
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
                              active ? { backgroundColor: `${accent}22` } : null,
                              recommended && !active ? styles.rootTabGuide : null,
                            ]}
                          >
                            <Text style={[styles.rootTabText, { color: accent }]}>
                              {item.label}
                            </Text>
                            {recommended ? (
                              <Text style={[styles.rootTabGuideLabel, { color: accent }]}>
                                guide
                              </Text>
                            ) : null}
                          </View>
                        </PressScale>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.subHeader}>
                    <Text style={styles.subBreadcrumb}>{breadcrumb}</Text>
                    <Text style={styles.subHint}>
                      {root === 'assessment'
                        ? 'Impression is on this list. Primary / History / Vitals are folders. Treatment is its own menu.'
                        : root === 'interventions'
                          ? 'Life threats (O₂, CPR, bleeding, meds) live here — use anytime.'
                          : rootRoleBlurb(root, nremtStage)}
                    </Text>
                  </View>
                  {nodes.map((node) => {
                    const done =
                      !!node.actionId && completedActions.includes(node.actionId);
                    const accent = done
                      ? theme.colors.success
                      : ROOT_ACCENTS[root] ?? theme.colors.emsBlue;
                    const suggestPath =
                      root === stageFocus.openRoot &&
                      stageFocus.openPath[0] === node.id &&
                      path.length === 0;
                    const suggestLeafHere =
                      !!node.actionId &&
                      stageFocus.quickActions.some((q) => q.actionId === node.actionId);
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
                          style={[
                            styles.actionBtn,
                            { borderColor: accent },
                            suggestPath || suggestLeafHere ? styles.actionBtnHot : null,
                          ]}
                        >
                          <View style={styles.actionCopy}>
                            <Text style={styles.actionLabel}>{node.label}</Text>
                            {suggestPath || suggestLeafHere ? (
                              <Text style={styles.actionSuggest}>Suggested</Text>
                            ) : null}
                          </View>
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 6,
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusTitle: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1.1,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: theme.colors.critical,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,45,85,0.12)',
  },
  timerText: {
    color: theme.colors.critical,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 0.8,
  },
  practiceChip: {
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: theme.colors.cadGlow,
  },
  practiceChipText: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
    backgroundColor: 'rgba(5,12,20,0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 7,
    paddingVertical: 4,
    minWidth: 52,
  },
  chipUnknown: { opacity: 0.7 },
  chipLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
  },
  chipValue: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    marginTop: 1,
  },
  chipValueUnknown: { color: theme.colors.textMuted, fontSize: fs(11) },
  phaseScroll: { flex: 1 },
  phaseContent: { paddingBottom: 8 },
  phaseBlock: { gap: 8 },
  focusBanner: { borderRadius: 12 },
  focusInner: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
    overflow: 'hidden',
  },
  focusKicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.2,
  },
  focusHint: {
    color: theme.colors.text,
    fontSize: fs(13),
    lineHeight: fs(18),
    fontWeight: '600',
  },
  focusAdvance: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMono',
    fontSize: fs(10),
    letterSpacing: 0.3,
    marginTop: 2,
  },
  quickWrap: { gap: 4 },
  quickLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1.1,
  },
  quickRow: { gap: 6, paddingRight: 8 },
  quickChipOuter: { borderRadius: 999 },
  quickChip: {
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickChipFolder: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(255,197,49,0.1)',
  },
  quickChipText: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 0.4,
  },
  quickChipFolderText: {
    color: theme.colors.accent,
  },
  prompt: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(18),
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rootTabs: {
    gap: 6,
    paddingVertical: 2,
    paddingRight: 8,
  },
  rootTabOuter: { borderRadius: 10 },
  rootTab: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(8,18,28,0.88)',
  },
  rootTabGuide: {
    borderStyle: 'dashed',
  },
  rootTabIcon: { width: 18, height: 18 },
  rootTabText: {
    fontFamily: 'BebasNeue',
    fontSize: fs(14),
    letterSpacing: 0.4,
  },
  rootTabGuideLabel: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 0.6,
  },
  emptyMenus: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(17),
    marginTop: 4,
  },
  subBreadcrumb: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(18),
    letterSpacing: 0.5,
  },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rootOuter: {
    width: '48%',
    flexGrow: 1,
    maxWidth: '49%',
    borderRadius: 12,
  },
  rootChip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 9,
    gap: 2,
    overflow: 'hidden',
    minHeight: 72,
  },
  rootChipHot: {
    borderWidth: 2,
    shadowColor: theme.colors.emsBlue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  rootBadge: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(8),
    letterSpacing: 1,
    marginBottom: 1,
  },
  rootIcon: { width: 20, height: 20, marginBottom: 1 },
  rootChipText: {
    fontFamily: 'BebasNeue',
    fontSize: fs(16),
    letterSpacing: 0.4,
  },
  rootBlurb: {
    color: theme.colors.textMuted,
    fontSize: fs(9),
    lineHeight: fs(12),
  },
  compactRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  compactOuter: {
    flex: 1,
    borderRadius: 10,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 40,
    overflow: 'hidden',
  },
  compactChipActive: {
    backgroundColor: 'rgba(139,243,255,0.12)',
  },
  compactIcon: { width: 18, height: 18 },
  compactText: {
    fontFamily: 'BebasNeue',
    fontSize: fs(16),
    letterSpacing: 0.4,
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
  actionBtnHot: {
    borderWidth: 2,
    borderColor: theme.colors.emsBlue,
  },
  actionCopy: { flex: 1, gap: 2, paddingRight: 8 },
  actionLabel: {
    color: theme.colors.text,
    fontSize: fs(14),
    fontWeight: '700',
  },
  actionSuggest: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.6,
  },
  moreIcon: { width: 12, height: 12, opacity: 0.8 },
  doneIcon: { width: 16, height: 16 },
  subMenu: { gap: 6 },
  subHeader: { gap: 4, marginBottom: 2 },
  subHint: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(15),
  },
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
