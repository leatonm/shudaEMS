import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BADGES } from '@/data/emt/badges';
import { CALL_CATEGORIES } from '@/data/emt/categories';
import { Icons } from '@/constants/icons';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import {
  selectLevelProgress,
  selectRankTitle,
  useProgressStore,
} from '@/store/progressStore';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
}

export function StreaksSheet({ visible, onClose }: SheetProps) {
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const longestStreak = useProgressStore((s) => s.longestStreak);
  const lastPlayDate = useProgressStore((s) => s.lastPlayDate);
  const recentRuns = useProgressStore((s) => s.recentRuns);

  return (
    <Sheet visible={visible} onClose={onClose} title="STREAKS" icon={Icons.streak}>
      <View style={styles.statRow}>
        <Stat label="Current" value={`${currentStreak}d`} accent={theme.colors.accent} />
        <Stat label="Best" value={`${longestStreak}d`} accent={theme.colors.emsBlue} />
      </View>
      <Text style={styles.body}>
        Complete at least one call each calendar day to keep your streak alive.
        {lastPlayDate ? ` Last play: ${lastPlayDate}.` : ' No calls logged yet.'}
      </Text>
      {recentRuns.length > 0 ? (
        <>
          <Text style={styles.subhead}>Recent runs</Text>
          {recentRuns.slice(0, 6).map((run) => (
            <Text key={`${run.callId}-${run.completedAt}`} style={styles.listLine}>
              {run.dateKey} · {run.category.toUpperCase()} · {run.stars}★ · +{run.xpEarned} XP
              {run.daily ? ' · Daily' : ''}
            </Text>
          ))}
        </>
      ) : null}
    </Sheet>
  );
}

export function BadgesSheet({ visible, onClose }: SheetProps) {
  const unlocked = useProgressStore((s) => s.unlockedBadges);

  return (
    <Sheet visible={visible} onClose={onClose} title="BADGES" icon={Icons.badge}>
      <Text style={styles.body}>
        {unlocked.length} / {BADGES.length} unlocked
      </Text>
      {BADGES.map((badge) => {
        const have = unlocked.includes(badge.id);
        return (
          <View key={badge.id} style={[styles.badgeRow, !have && styles.badgeLocked]}>
            <Image source={badge.icon} style={[styles.badgeIcon, !have && styles.dim]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.badgeTitle, !have && styles.dimText]}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
            </View>
            <Text style={[styles.badgeStatus, have && styles.badgeHave]}>
              {have ? 'OWNED' : 'LOCKED'}
            </Text>
          </View>
        );
      })}
    </Sheet>
  );
}

export function DailyChallengeSheet({
  visible,
  onClose,
  onStart,
}: SheetProps & { onStart: () => void }) {
  const daily = useProgressStore((s) => s.daily);
  const ensureDaily = useProgressStore((s) => s.ensureDaily);
  const cat = CALL_CATEGORIES.find((c) => c.id === daily.category);

  useEffect(() => {
    if (visible) ensureDaily();
  }, [visible, ensureDaily]);

  return (
    <Sheet visible={visible} onClose={onClose} title="DAILY CHALLENGE" icon={Icons.challenge}>
      <Text style={styles.body}>
        Today’s focus category is seeded for every provider — finish it for a +50 XP bonus.
      </Text>
      <View style={styles.dailyCard}>
        <Text style={styles.dailyCat}>{(cat?.label ?? daily.category).toUpperCase()}</Text>
        <Text style={styles.dailyMeta}>{cat?.examples ?? ''}</Text>
        <Text style={[styles.dailyStatus, daily.completed && styles.dailyDone]}>
          {daily.completed ? 'COMPLETED TODAY' : 'READY TO START'}
        </Text>
      </View>
      {!daily.completed ? (
        <Pressable style={styles.primaryBtn} onPress={onStart}>
          <Text style={styles.primaryBtnText}>START DAILY CALL</Text>
        </Pressable>
      ) : (
        <Text style={styles.body}>Come back tomorrow for a new category seed.</Text>
      )}
    </Sheet>
  );
}

export function useXpCardModel() {
  const totalXp = useProgressStore((s) => s.totalXp);
  const level = selectLevelProgress(totalXp);
  const rank = selectRankTitle(totalXp);
  return { totalXp, level, rank };
}

function Sheet({
  visible,
  onClose,
  title,
  icon,
  children,
}: SheetProps & {
  title: string;
  icon: ImageSourcePropType;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Image source={icon} style={styles.headerIcon} />
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.stat, { borderColor: accent }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerIcon: { width: 28, height: 28 },
  title: {
    flex: 1,
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(13),
    letterSpacing: 1.4,
  },
  close: { color: theme.colors.textMuted, fontSize: fs(18), paddingHorizontal: 4 },
  scroll: { maxHeight: 420 },
  body: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(19),
    marginBottom: 12,
  },
  subhead: {
    color: theme.colors.text,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  listLine: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(18),
    marginBottom: 2,
  },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'BebasNeue', fontSize: fs(32) },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  badgeLocked: { opacity: 0.75 },
  badgeIcon: { width: 36, height: 36 },
  dim: { opacity: 0.35 },
  dimText: { color: theme.colors.textMuted },
  badgeTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: fs(14),
  },
  badgeDesc: {
    color: theme.colors.textMuted,
    fontSize: fs(11),
    lineHeight: fs(15),
    marginTop: 2,
  },
  badgeStatus: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.5,
  },
  badgeHave: { color: theme.colors.success },
  dailyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.critical,
    backgroundColor: theme.colors.dangerGlow,
    padding: 14,
    marginBottom: 14,
  },
  dailyCat: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(28),
    letterSpacing: 1,
  },
  dailyMeta: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(17),
    marginTop: 4,
  },
  dailyStatus: {
    marginTop: 10,
    color: theme.colors.accent,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1,
  },
  dailyDone: { color: theme.colors.success },
  primaryBtn: {
    backgroundColor: theme.colors.emsBlue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: theme.colors.background,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(12),
    letterSpacing: 1.2,
  },
});
