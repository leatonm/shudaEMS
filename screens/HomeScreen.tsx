import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LaurenWelcome } from '@/components/characters/LaurenWelcome';
import {
  BadgesSheet,
  DailyChallengeSheet,
  StreaksSheet,
  useXpCardModel,
} from '@/components/ui/ProgressSheets';
import { PressScale } from '@/components/ui/motion';
import { AppBackdrop } from '@/components/ui/AppBackdrop';
import {
  CATEGORY_ICONS,
  CATEGORY_MASCOTS,
  HOW_IT_WORKS,
  Icons,
} from '@/constants/icons';
import { fs } from '@/constants/layout';
import { categoryColor, theme } from '@/constants/theme';
import { CALL_CATEGORIES } from '@/data/emt/categories';
import type { CallCategory } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';
import { useProgressStore } from '@/store/progressStore';

/** Single-viewport home — no vertical page scroll on phone. */
export default function HomeScreen() {
  const router = useRouter();
  const difficulty = useEmtStore((s) => s.difficulty);
  const startEmtCall = useEmtStore((s) => s.startCall);
  const setPendingCategory = useEmtStore((s) => s.setPendingCategory);
  const beginDailyRun = useProgressStore((s) => s.beginDailyRun);
  const clearDailyRunFlag = useProgressStore((s) => s.clearDailyRunFlag);
  const ensureDaily = useProgressStore((s) => s.ensureDaily);
  const daily = useProgressStore((s) => s.daily);
  const [sheet, setSheet] = useState<'streaks' | 'badges' | 'daily' | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const [dailyDismissed, setDailyDismissed] = useState(false);

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  const pickCategory = (category: CallCategory | null) => {
    clearDailyRunFlag();
    setPendingCategory(category);
    router.push('/emt/difficulty');
  };

  const handleDaily = () => {
    const category = beginDailyRun();
    setSheet(null);
    const callId = startEmtCall({ category, difficulty });
    if (callId) router.push(`/emt/dispatch/${callId}` as Href);
  };

  const showDailyBanner = !dailyDismissed && !daily.completed;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBackdrop />

      <View style={styles.shell}>
        <View style={styles.headerBlock}>
          <View style={styles.topBar}>
            <View style={styles.topSide} />
            <View style={styles.brandCopy}>
              <Image source={Icons.appLogo} style={styles.logo} />
              <View>
                <Text style={styles.brandTitle}>EMT RESPONSE</Text>
                <Text style={styles.brandSub}>SIMULATOR</Text>
              </View>
            </View>
            <View style={[styles.topSide, styles.topSideRight]}>
              <PressScale onPress={() => setSheet('streaks')} style={styles.xpChip}>
                <XpChip />
              </PressScale>
            </View>
          </View>

          {showDailyBanner ? (
            <PressScale onPress={() => setSheet('daily')} style={styles.dailyBanner}>
              <View style={styles.dailyDot} />
              <Image source={Icons.challenge} style={styles.dailyIcon} />
              <Text style={styles.dailyText} numberOfLines={1}>
                Daily Challenge · Tap for bonus XP
              </Text>
              <Pressable
                onPress={() => setDailyDismissed(true)}
                hitSlop={10}
                style={styles.dailyDismiss}
              >
                <Text style={styles.dailyDismissText}>✕</Text>
              </Pressable>
            </PressScale>
          ) : null}
        </View>

        <View style={styles.categoryBlock}>
          <Text style={styles.sectionTitle}>CHOOSE A CATEGORY</Text>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {CALL_CATEGORIES.map((cat) => {
              const accent = categoryColor(cat.id);
              return (
                <PressScale
                  key={cat.id}
                  onPress={() => pickCategory(cat.id)}
                  style={styles.rowOuter}
                >
                  <LinearGradient
                    colors={categoryGradient(accent)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.row, { borderColor: accent }]}
                  >
                    <Image
                      source={CATEGORY_ICONS[cat.id]}
                      style={styles.rowIcon}
                      resizeMode="contain"
                    />
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, { color: accent }]}>
                        {homeCategoryLabel(cat.id)}
                      </Text>
                      <Text style={styles.rowExamples}>{cat.examples}</Text>
                    </View>
                    <Image
                      source={CATEGORY_MASCOTS[cat.id]}
                      style={styles.rowMascot}
                      resizeMode="contain"
                    />
                    <Image source={Icons.arrowRight} style={styles.rowChevron} />
                  </LinearGradient>
                </PressScale>
              );
            })}

            <PressScale onPress={() => pickCategory(null)} style={styles.rowOuter}>
              <LinearGradient
                colors={['rgba(20,28,36,0.98)', 'rgba(8,14,20,0.99)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.row, styles.rowRandom]}
              >
                <Image source={Icons.random} style={styles.rowIcon} resizeMode="contain" />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>RANDOM</Text>
                  <Text style={styles.rowExamples}>Surprise me!</Text>
                </View>
                <Image
                  source={CATEGORY_MASCOTS.random}
                  style={styles.rowMascot}
                  resizeMode="contain"
                />
                <Image source={Icons.arrowRight} style={styles.rowChevron} />
              </LinearGradient>
            </PressScale>
          </ScrollView>
        </View>

        <View style={styles.bottomBlock}>
          <PressScale onPress={() => setHowOpen(true)} style={styles.howBtn}>
            <Text style={styles.howBtnText}>HOW IT WORKS</Text>
            <Text style={styles.howBtnChevron}>▾</Text>
          </PressScale>

          <View style={styles.footerRow}>
            <FooterIcon
              icon={Icons.badge}
              label="Badges"
              onPress={() => setSheet('badges')}
            />
            <FooterIcon
              icon={Icons.trophy}
              label="Board"
              onPress={() => router.push('/emt/leaderboard')}
            />
            <FooterIcon
              icon={Icons.trainingShield}
              label="Settings"
              onPress={() => router.push('/emt/settings')}
            />
          </View>
        </View>
      </View>

      <HowItWorksModal visible={howOpen} onClose={() => setHowOpen(false)} />
      <LaurenWelcome />
      <StreaksSheet visible={sheet === 'streaks'} onClose={() => setSheet(null)} />
      <BadgesSheet visible={sheet === 'badges'} onClose={() => setSheet(null)} />
      <DailyChallengeSheet
        visible={sheet === 'daily'}
        onClose={() => setSheet(null)}
        onStart={handleDaily}
      />
    </SafeAreaView>
  );
}

function homeCategoryLabel(id: CallCategory): string {
  switch (id) {
    case 'peds':
      return 'Peds';
    case 'mci':
      return 'MCI / START';
    default:
      return id.charAt(0).toUpperCase() + id.slice(1);
  }
}

/** Soft category tint → deep navy, matching the earlier home cards. */
function categoryGradient(accent: string): [string, string] {
  return [`${accent}33`, 'rgba(8,18,28,0.98)'];
}

function XpChip() {
  const xp = useXpCardModel();
  return (
    <View>
      <Text style={styles.xpLevel}>LVL {xp.level.level}</Text>
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${Math.round(xp.level.ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

function FooterIcon({
  icon,
  label,
  onPress,
}: {
  icon: (typeof Icons)[keyof typeof Icons];
  label: string;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} style={styles.footerIconBtn}>
      <Image source={icon} style={styles.footerIcon} />
      <Text style={styles.footerLabel}>{label}</Text>
    </PressScale>
  );
}

function HowItWorksModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.howBtnText}>HOW IT WORKS</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.modalClose}>
              <Text style={styles.dailyDismissText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {HOW_IT_WORKS.map((step) => (
              <View key={step.n} style={styles.howRow}>
                <View style={[styles.howBadge, { borderColor: step.color }]}>
                  <Text style={[styles.howNum, { color: step.color }]}>{step.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howTitle}>{step.title}</Text>
                  <Text style={styles.howBody}>{step.body}</Text>
                </View>
                <Image source={step.icon} style={styles.howIcon} />
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  shell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 36,
    paddingBottom: 10,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginTop: 28,
    marginBottom: 16,
  },
  categoryBlock: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  bottomBlock: {
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  topSide: {
    width: 88,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topSideRight: {
    alignItems: 'flex-end',
  },
  logo: { width: 96, height: 96 },
  brandCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  brandTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(26),
    letterSpacing: 1,
    lineHeight: fs(28),
  },
  brandSub: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 1.6,
    marginTop: -2,
  },
  xpChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
  },
  xpLevel: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  xpTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.backgroundAlt,
    marginTop: 4,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: theme.colors.emsBlue },
  dailyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,197,49,0.12)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  dailyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  dailyIcon: { width: 22, height: 22 },
  dailyText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: fs(14),
    fontWeight: '700',
  },
  dailyDismiss: { padding: 4 },
  dailyDismissText: { color: theme.colors.textMuted, fontSize: fs(13) },
  sectionTitle: {
    color: theme.colors.emsBlue,
    fontFamily: 'BebasNeue',
    fontSize: fs(26),
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  listScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  list: {
    gap: 8,
    justifyContent: 'center',
  },
  rowOuter: {
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 6,
    overflow: 'hidden',
    minHeight: 100,
  },
  rowRandom: {
    borderColor: theme.colors.border,
  },
  rowIcon: {
    width: 56,
    height: 56,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 2,
  },
  rowTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(32),
    letterSpacing: 0.7,
    lineHeight: fs(34),
  },
  rowExamples: {
    color: theme.colors.textMuted,
    fontSize: fs(14),
    lineHeight: fs(19),
    marginTop: 4,
    fontWeight: '500',
  },
  rowMascot: {
    width: 96,
    height: 96,
    marginVertical: -6,
  },
  rowChevron: {
    width: 14,
    height: 14,
    opacity: 0.55,
  },
  howBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    position: 'relative',
  },
  howBtnText: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  howBtnChevron: {
    color: theme.colors.textMuted,
    fontSize: fs(14),
    position: 'absolute',
    right: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 2,
  },
  footerIconBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 4 },
  footerIcon: { width: 28, height: 28 },
  footerLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  howBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howNum: { fontFamily: 'IBMPlexMonoBold', fontSize: fs(11) },
  howTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(18),
  },
  howBody: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  howIcon: { width: 28, height: 28 },
});
