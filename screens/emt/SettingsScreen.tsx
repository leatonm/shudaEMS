import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { PressScale } from '@/components/ui/motion';
import { Icons } from '@/constants/icons';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import { refreshCoachTipSchedule, coachTipsSupported, sendTestCoachTipNow } from '@/lib/coachPings';
import { promptProfileAvatarChange } from '@/lib/profileAvatar';
import { shareAppInvite } from '@/lib/shareCoach';
import {
  selectLevelProgress,
  selectRankTitle,
  useProgressStore,
} from '@/store/progressStore';

export default function SettingsScreen() {
  const displayName = useProgressStore((s) => s.displayName);
  const setDisplayName = useProgressStore((s) => s.setDisplayName);
  const avatarUri = useProgressStore((s) => s.avatarUri);
  const setAvatarUri = useProgressStore((s) => s.setAvatarUri);
  const coachTipsEnabled = useProgressStore((s) => s.coachTipsEnabled);
  const setCoachTipsEnabled = useProgressStore((s) => s.setCoachTipsEnabled);
  const totalXp = useProgressStore((s) => s.totalXp);
  const [picking, setPicking] = useState(false);
  const [tipsBusy, setTipsBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);

  const level = selectLevelProgress(totalXp);
  const rank = selectRankTitle(totalXp);

  const changeAvatar = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const next = await promptProfileAvatarChange(!!avatarUri);
      if (next === null) return;
      setAvatarUri(next === '' ? null : next);
    } finally {
      setPicking(false);
    }
  };

  const toggleCoachTips = async (enabled: boolean) => {
    if (tipsBusy) return;
    if (enabled && !coachTipsSupported) {
      Alert.alert(
        'Device required',
        'Tips use local notifications, which are not available in the web browser. Open the app on a phone or a native build.'
      );
      return;
    }
    setTipsBusy(true);
    try {
      const ok = await refreshCoachTipSchedule(enabled);
      if (enabled && !ok) {
        Alert.alert(
          'Notifications needed',
          'Turn on notifications to get a random fact or tip every 6 hours.'
        );
        setCoachTipsEnabled(false);
        return;
      }
      setCoachTipsEnabled(enabled);
    } finally {
      setTipsBusy(false);
    }
  };

  const inviteClassmate = async () => {
    if (inviteBusy) return;
    setInviteBusy(true);
    try {
      await shareAppInvite();
    } finally {
      setInviteBusy(false);
    }
  };

  const tryTipNow = async () => {
    if (testBusy) return;
    if (!coachTipsSupported) {
      Alert.alert(
        'Device required',
        'Tips only work on a phone or native build, not in the browser.'
      );
      return;
    }
    setTestBusy(true);
    try {
      const ok = await sendTestCoachTipNow();
      if (!ok) {
        Alert.alert(
          'Notifications needed',
          'Allow notifications, then try again.'
        );
        return;
      }
      Alert.alert('Tip sent', 'Check your notification shade for a random fact or tip.');
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenScroll>
        <Text style={styles.kicker}>SETTINGS</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.lead}>
          Add a photo from your camera or gallery. Placeholder for now if you skip it.
        </Text>

        <View style={styles.profileCard}>
          <PressScale onPress={changeAvatar} style={styles.avatarPress} disabled={picking}>
            <View style={styles.avatarRing}>
              <Image
                source={avatarUri ? { uri: avatarUri } : Icons.userAvatar}
                style={styles.avatar}
                resizeMode="cover"
              />
              {picking ? (
                <View style={styles.avatarBusy}>
                  <ActivityIndicator color={theme.colors.emsBlue} />
                </View>
              ) : null}
            </View>
            <Text style={styles.avatarHint}>
              {avatarUri ? 'Tap to change photo' : 'Tap to add photo'}
            </Text>
          </PressScale>

          <View style={styles.profileMeta}>
            <Text style={styles.rankLine}>
              LVL {level.level} · {rank}
            </Text>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => setDisplayName(nameDraft)}
              onSubmitEditing={() => setDisplayName(nameDraft)}
              placeholder="Callsign / name"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={32}
              returnKeyType="done"
            />
          </View>
        </View>

        <Text style={[styles.title, styles.sectionTitle]}>Tips</Text>
        <Text style={styles.lead}>
          Every 6 hours, get a random EMT fact or field tip as a notification. Turn it off anytime.
        </Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>6-hour tips</Text>
            <Text style={styles.toggleBody}>
              {coachTipsEnabled ? 'On — next tip is scheduled' : 'Off'}
            </Text>
          </View>
          {tipsBusy ? (
            <ActivityIndicator color={theme.colors.emsBlue} />
          ) : (
            <Switch
              value={coachTipsEnabled}
              onValueChange={toggleCoachTips}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryDark,
              }}
              thumbColor={
                coachTipsEnabled ? theme.colors.emsBlue : theme.colors.textMuted
              }
            />
          )}
        </View>

        <PressScale
          onPress={tryTipNow}
          style={[styles.card, styles.testCard]}
          disabled={testBusy}
        >
          <Text style={styles.cardTitle}>
            {testBusy ? 'Sending…' : 'Try a tip now'}
          </Text>
          <Text style={styles.cardBody}>
            Instant test notification — no 6-hour wait.
          </Text>
        </PressScale>

        <Text style={[styles.title, styles.sectionTitle]}>Invite</Text>
        <Text style={styles.lead}>
          Share the app with a classmate so they can train with you.
        </Text>

        <PressScale
          onPress={inviteClassmate}
          style={styles.card}
          disabled={inviteBusy}
        >
          <Text style={styles.cardTitle}>Invite a classmate</Text>
          <Text style={styles.cardBody}>
            Open share and send EMT Response Simulator to someone in your class.
          </Text>
        </PressScale>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  kicker: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 1.5,
  },
  title: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(34),
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 22,
  },
  lead: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    lineHeight: fs(18),
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    marginBottom: 8,
  },
  avatarPress: { alignItems: 'center', gap: 6 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: theme.colors.emsBlue,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundAlt,
  },
  avatar: { width: '100%', height: '100%' },
  avatarBusy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,10,18,0.55)',
  },
  avatarHint: {
    color: theme.colors.emsBlue,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(9),
    letterSpacing: 0.4,
  },
  profileMeta: { flex: 1, gap: 8 },
  rankLine: {
    color: theme.colors.textMuted,
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(11),
    letterSpacing: 0.8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: 'rgba(8,18,28,0.9)',
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fs(16),
    fontFamily: 'BebasNeue',
    letterSpacing: 0.4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(24),
  },
  cardBody: {
    color: theme.colors.textMuted,
    fontSize: fs(13),
    marginTop: 4,
    lineHeight: fs(18),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  toggleCopy: { flex: 1, gap: 2 },
  toggleTitle: {
    color: theme.colors.text,
    fontFamily: 'BebasNeue',
    fontSize: fs(22),
  },
  toggleBody: {
    color: theme.colors.textMuted,
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  testCard: {
    marginTop: 10,
  },
});
