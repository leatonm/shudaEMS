import { useEffect, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { LaurenWelcome } from '@/components/characters/LaurenWelcome';
import {
  BadgesSheet,
  DailyChallengeSheet,
  StreaksSheet,
  useXpCardModel,
} from '@/components/ui/ProgressSheets';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { PressScale, PulseOrb, enterUp } from '@/components/ui/motion';
import {
  CATEGORY_ICONS,
  CATEGORY_MASCOTS,
  DIFFICULTY_CARD_COPY,
  DIFFICULTY_ICONS,
  HOW_IT_WORKS,
  Icons,
} from '@/constants/icons';
import { HOME_MAX_WIDTH, HOME_SIDEBAR_BREAKPOINT, fs } from '@/constants/layout';
import { categoryColor, theme } from '@/constants/theme';
import { CALL_CATEGORIES } from '@/data/emt/categories';
import { DIFFICULTY_OPTIONS } from '@/data/emt/difficulty';
import type { CallCategory, EmtDifficulty } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';
import { useProgressStore } from '@/store/progressStore';

export default function HomeScreen() {
  const router = useRouter();
  const startEmtCall = useEmtStore((s) => s.startCall);
  const difficulty = useEmtStore((s) => s.difficulty);
  const setDifficulty = useEmtStore((s) => s.setDifficulty);
  const beginDailyRun = useProgressStore((s) => s.beginDailyRun);
  const clearDailyRunFlag = useProgressStore((s) => s.clearDailyRunFlag);
  const ensureDaily = useProgressStore((s) => s.ensureDaily);
  const [wide, setWide] = useState(false);
  const [sheet, setSheet] = useState<'streaks' | 'badges' | 'daily' | null>(null);

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  const onLayout = (e: LayoutChangeEvent) => {
    setWide(e.nativeEvent.layout.width >= HOME_SIDEBAR_BREAKPOINT);
  };

  const handleStartCategory = (category?: CallCategory) => {
    clearDailyRunFlag();
    const callId = startEmtCall(category ? { category, difficulty } : { difficulty });
    if (callId) {
      router.push(`/emt/call/${callId}`);
    }
  };

  const handleStartDaily = () => {
    const category = beginDailyRun();
    setSheet(null);
    const callId = startEmtCall({ category, difficulty });
    if (callId) {
      router.push(`/emt/call/${callId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PulseOrb color={theme.colors.amberGlow} size={220} top={-60} right={-80} />
      <PulseOrb
        color={theme.colors.cadGlow}
        size={260}
        top={120}
        left={-100}
        duration={4400}
        delay={600}
      />

      <ScreenScroll maxWidth={HOME_MAX_WIDTH} contentStyle={styles.scrollInner}>
        <View onLayout={onLayout} style={[styles.shell, wide && styles.shellWide]}>
          <View style={[styles.mainCol, wide && styles.mainColWide]}>
            <Animated.View entering={enterUp(0)}>
              <HeroBanner />
            </Animated.View>

            {!wide ? (
              <Animated.View entering={enterUp(1)}>
                <XpCard />
              </Animated.View>
            ) : null}

            <Animated.View entering={enterUp(1)} style={styles.disclaimer}>
              <View style={styles.disclaimerTextCol}>
                <Text style={styles.disclaimerTitle}>TRAINING AID ONLY</Text>
                <Text style={styles.disclaimerText}>
                  Not a substitute for formal EMT education, certification, medical direction, or
                  local protocols.
                </Text>
              </View>
              <Image source={Icons.trainingShield} style={styles.disclaimerIcon} />
            </Animated.View>

            <Animated.View entering={enterUp(2)} style={styles.section}>
              <Text style={styles.sectionLabel}>CHOOSE DIFFICULTY</Text>
              <View style={styles.diffRow}>
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const copy = DIFFICULTY_CARD_COPY[opt.id];
                  const selected = difficulty === opt.id;
                  return (
                    <PressScale
                      key={opt.id}
                      onPress={() => setDifficulty(opt.id as EmtDifficulty)}
                      style={[
                        styles.diffCard,
                        selected && {
                          borderColor: copy.accent,
                          backgroundColor: copy.glow,
                          shadowColor: copy.accent,
                          shadowOpacity: 0.55,
                        },
                      ]}
                    >
                      <Image source={DIFFICULTY_ICONS[opt.id]} style={styles.diffIcon} />
                      <Text style={[styles.diffTitle, selected && { color: copy.accent }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.diffTag}>{copy.tagline}</Text>
                    </PressScale>
                  );
                })}
              </View>
              <Text style={styles.diffHelp}>
                {DIFFICULTY_OPTIONS.find((o) => o.id === difficulty)?.description}
              </Text>
            </Animated.View>

            <Animated.View entering={enterUp(3)} style={styles.catSection}>
              <Text style={styles.sectionLabel}>CHOOSE A CATEGORY</Text>
              {CALL_CATEGORIES.map((cat, index) => (
                <CategoryRow
                  key={cat.id}
                  label={cat.label}
                  examples={cat.examples}
                  accent={categoryColor(cat.id)}
                  icon={CATEGORY_ICONS[cat.id]}
                  mascot={CATEGORY_MASCOTS[cat.id]}
                  index={index}
                  onPress={() => handleStartCategory(cat.id)}
                />
              ))}
              <CategoryRow
                label="Random"
                examples="Surprise me!"
                accent="#7A93A3"
                icon={Icons.random}
                mascot={CATEGORY_MASCOTS.random}
                index={CALL_CATEGORIES.length}
                onPress={() => handleStartCategory()}
              />
            </Animated.View>

            <Animated.View entering={enterUp(4)} style={styles.section}>
              <Text style={styles.funHeadline}>MAKE IT FUN. MAKE IT COUNT.</Text>
              <View style={styles.funRow}>
                <FunTile
                  icon={Icons.streak}
                  label="Streaks"
                  onPress={() => setSheet('streaks')}
                />
                <FunTile
                  icon={Icons.trophy}
                  label="Leaderboard"
                  onPress={() => router.push('/emt/leaderboard')}
                />
                <FunTile
                  icon={Icons.badge}
                  label="Badges"
                  onPress={() => setSheet('badges')}
                />
                <FunTile
                  icon={Icons.challenge}
                  label="Daily Challenge"
                  onPress={() => setSheet('daily')}
                />
              </View>
            </Animated.View>

            <Animated.View entering={enterUp(5)} style={styles.quoteBar}>
              <Image source={Icons.appLogo} style={styles.quoteLogo} />
              <Text style={styles.quote}>
                Train like a pro. Respond with confidence. Make a difference.
              </Text>
              <Image source={Icons.appLogo} style={styles.quoteLogo} />
            </Animated.View>

            {!wide ? (
              <Animated.View entering={enterUp(6)} style={styles.sidebarInline}>
                <HowItWorksPanel />
              </Animated.View>
            ) : null}
          </View>

          {wide ? (
            <Animated.View entering={enterUp(2)} style={styles.sidebar}>
              <XpCard />
              <HowItWorksPanel />
            </Animated.View>
          ) : null}
        </View>
      </ScreenScroll>

      <StreaksSheet visible={sheet === 'streaks'} onClose={() => setSheet(null)} />
      <BadgesSheet visible={sheet === 'badges'} onClose={() => setSheet(null)} />
      <DailyChallengeSheet
        visible={sheet === 'daily'}
        onClose={() => setSheet(null)}
        onStart={handleStartDaily}
      />
      <LaurenWelcome />
    </SafeAreaView>
  );
}

function HeroBanner() {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['#1a0a14', '#0a1628', '#051018']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroGlowRed} />
      <View style={styles.heroGlowBlue} />
      <Image source={Icons.ambulance} style={styles.heroAmbulance} />
      <View style={styles.heroBrand}>
        <Image source={Icons.appLogo} style={styles.heroLogo} />
        <View>
          <Text style={styles.heroTitle}>EMT RESPONSE</Text>
          <Text style={styles.heroSub}>SIMULATOR</Text>
        </View>
      </View>
    </View>
  );
}

function XpCard() {
  const { totalXp, level, rank } = useXpCardModel();
  const streak = useProgressStore((s) => s.currentStreak);

  return (
    <View style={styles.xpCard}>
      <View style={styles.xpTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.xpLevel}>XP LEVEL {level.level}</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${Math.round(level.ratio * 100)}%` }]} />
          </View>
          <Text style={styles.xpMeta}>
            {level.intoLevel.toLocaleString()} / {level.need.toLocaleString()} XP
            {' · '}
            {totalXp.toLocaleString()} total
            {streak > 0 ? ` · ${streak}d streak` : ''}
          </Text>
        </View>
        <View style={styles.avatarWrap}>
          <Image source={Icons.medicMascot} style={styles.avatar} />
          <Text style={styles.avatarLabel}>{rank}</Text>
        </View>
      </View>
    </View>
  );
}

function HowItWorksPanel() {
  return (
    <View style={styles.howCard}>
      <Text style={styles.howTitle}>HOW IT WORKS</Text>
      {HOW_IT_WORKS.map((step) => (
        <View key={step.n} style={styles.howRow}>
          <View style={[styles.howNum, { borderColor: step.color, shadowColor: step.color }]}>
            <Text style={[styles.howNumText, { color: step.color }]}>{step.n}</Text>
          </View>
          <View style={styles.howCopy}>
            <Text style={styles.howStepTitle}>{step.title}</Text>
            <Text style={styles.howStepBody}>{step.body}</Text>
          </View>
          <Image source={step.icon} style={styles.howIcon} />
        </View>
      ))}
    </View>
  );
}

function CategoryRow({
  label,
  examples,
  accent,
  icon,
  mascot,
  index,
  onPress,
}: {
  label: string;
  examples: string;
  accent: string;
  icon: ImageSourcePropType;
  mascot: ImageSourcePropType;
  index: number;
  onPress: () => void;
}) {
  return (
    <PressScale
      onPress={onPress}
      entering={enterUp(index + 3)}
      style={[styles.catRow, { borderColor: accent, shadowColor: accent }]}
    >
      <LinearGradient
        colors={[`${accent}44`, `${accent}14`, 'transparent']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <Image source={icon} style={styles.catIcon} />
      <View style={styles.catCopy}>
        <Text style={[styles.catLabel, { color: accent }]}>{label.toUpperCase()}</Text>
        <Text style={styles.catExamples} numberOfLines={1}>
          {examples}
        </Text>
      </View>
      <Image source={mascot} style={styles.catMascot} />
      <Image source={Icons.arrowRight} style={styles.catChevron} />
    </PressScale>
  );
}

function FunTile({
  icon,
  label,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} style={styles.funTile}>
      <Image source={icon} style={styles.funIcon} />
      <Text style={styles.funLabel}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scrollInner: { paddingTop: theme.spacing.md },
  shell: {
    width: '100%',
    gap: 14,
  },
  shellWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  mainCol: { width: '100%', gap: 14 },
  mainColWide: { flex: 1, minWidth: 0 },
  sidebar: {
    width: 268,
    gap: 12,
    paddingTop: 2,
  },
  sidebarInline: { marginTop: 4 },

  hero: {
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  heroGlowRed: {
    position: 'absolute',
    right: 36,
    top: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 45, 85, 0.24)',
  },
  heroGlowBlue: {
    position: 'absolute',
    right: 110,
    bottom: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 120, 255, 0.22)',
  },
  heroAmbulance: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    width: 108,
    height: 108,
    opacity: 0.5,
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  heroLogo: { width: 96, height: 96 },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(42),
    lineHeight: fs(44),
    letterSpacing: 1.5,
    textShadowColor: theme.colors.cadGlowStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  heroSub: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 2.5,
    marginTop: -2,
  },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 176, 32, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  disclaimerTextCol: { flex: 1 },
  disclaimerTitle: {
    color: theme.colors.warning,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  disclaimerText: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(16),
  },
  disclaimerIcon: { width: 36, height: 36 },

  section: { gap: 8 },
  catSection: { gap: 6 },
  sectionLabel: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.5,
    marginBottom: 2,
    textShadowColor: theme.colors.cadGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  diffRow: { flexDirection: 'row', gap: 8 },
  diffCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  diffIcon: { width: 52, height: 52 },
  diffTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
    letterSpacing: 1,
  },
  diffTag: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    textAlign: 'center',
    lineHeight: fs(13),
  },
  diffHelp: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(16),
  },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 76,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
    overflow: 'visible',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  catIcon: { width: 58, height: 58 },
  catCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  catLabel: {
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
    letterSpacing: 1,
    lineHeight: fs(26),
  },
  catExamples: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(14),
    marginTop: 1,
  },
  catMascot: {
    width: 78,
    height: 78,
    marginVertical: -8,
    marginRight: -2,
  },
  catChevron: { width: 16, height: 16, opacity: 0.65 },

  funHeadline: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  funRow: { flexDirection: 'row', gap: 8 },
  funTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  funIcon: { width: 42, height: 42 },
  funLabel: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  quoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  quoteLogo: { width: 22, height: 22, opacity: 0.45 },
  quote: {
    flex: 1,
    color: theme.colors.emsBlue,
    fontSize: fs(12),
    lineHeight: fs(18),
    textAlign: 'center',
    fontStyle: 'italic',
  },

  xpCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 12,
  },
  xpTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  xpLevel: {
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceLight,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: theme.colors.emsBlue,
    borderRadius: 4,
  },
  xpMeta: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    marginTop: 5,
  },
  avatarWrap: { alignItems: 'center', width: 68 },
  avatar: { width: 58, height: 58 },
  avatarLabel: {
    color: theme.colors.textMuted,
    fontSize: fs(9),
    marginTop: 2,
    textAlign: 'center',
  },

  howCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 12,
    gap: 10,
  },
  howTitle: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.5,
  },
  howRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  howNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  howNumText: {
    fontFamily: 'BebasNeue',
    fontSize: fs(15),
  },
  howCopy: { flex: 1 },
  howStepTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: fs(12),
  },
  howStepBody: {
    color: theme.colors.textMuted,
    fontSize: fs(10),
    lineHeight: fs(14),
    marginTop: 1,
  },
  howIcon: { width: 22, height: 22, opacity: 0.85 },
});
