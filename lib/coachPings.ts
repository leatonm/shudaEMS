import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { pickRandomCoachTip } from '@/data/emt/coachTips';

const TIP_CHANNEL = 'emt-coach-tips';
const TIP_PREFIX = 'coach-tip-';
/** 6 hours */
export const COACH_TIP_INTERVAL_SEC = 6 * 60 * 60;

/** Scheduled local notifications are native-only (not available on web). */
export const coachTipsSupported =
  Platform.OS === 'ios' || Platform.OS === 'android';

if (coachTipsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(TIP_CHANNEL, {
    name: 'EMT Coach tips',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#00E5FF',
  });
}

export async function requestCoachTipPermissions(): Promise<boolean> {
  if (!coachTipsSupported) return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  return status === 'granted';
}

async function cancelCoachTipNotifications() {
  if (!coachTipsSupported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (n) =>
          n.identifier.startsWith(TIP_PREFIX) ||
          n.content.data?.kind === 'coach_tip'
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Schedule the next random tip ~6 hours out (and a couple ahead so content rotates).
 * These are local notifications on the device — not SMS.
 */
export async function refreshCoachTipSchedule(enabled: boolean): Promise<boolean> {
  if (!coachTipsSupported) {
    return !enabled;
  }

  await cancelCoachTipNotifications();
  if (!enabled) return true;

  const granted = await requestCoachTipPermissions();
  if (!granted) return false;

  await ensureAndroidChannel();

  let exclude: string | null = null;
  // Next three pings: 6h, 12h, 18h — each with a different tip body.
  for (let i = 1; i <= 3; i++) {
    const tip = pickRandomCoachTip(exclude);
    exclude = tip.id;
    await Notifications.scheduleNotificationAsync({
      identifier: `${TIP_PREFIX}${i}-${tip.id}`,
      content: {
        title: tip.title,
        body: tip.body,
        data: { kind: 'coach_tip', tipId: tip.id },
        ...(Platform.OS === 'android' ? { channelId: TIP_CHANNEL } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: COACH_TIP_INTERVAL_SEC * i,
        repeats: false,
      },
    });
  }

  return true;
}

/** Fire one random tip immediately — useful to verify notifications on device. */
export async function sendTestCoachTipNow(): Promise<boolean> {
  if (!coachTipsSupported) return false;

  const granted = await requestCoachTipPermissions();
  if (!granted) return false;

  await ensureAndroidChannel();
  const tip = pickRandomCoachTip();
  await Notifications.scheduleNotificationAsync({
    identifier: `${TIP_PREFIX}test-${Date.now()}`,
    content: {
      title: tip.title,
      body: tip.body,
      data: { kind: 'coach_tip', tipId: tip.id, test: true },
      ...(Platform.OS === 'android' ? { channelId: TIP_CHANNEL } : null),
    },
    trigger: null,
  });
  return true;
}

/** Call on app launch when tips are enabled — keeps the 6h queue topped up. */
export async function ensureCoachTipSchedule(enabled: boolean): Promise<void> {
  if (!coachTipsSupported) return;
  if (!enabled) {
    await cancelCoachTipNotifications();
    return;
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const tips = scheduled.filter(
    (n) =>
      n.identifier.startsWith(TIP_PREFIX) || n.content.data?.kind === 'coach_tip'
  );
  if (tips.length < 2) {
    await refreshCoachTipSchedule(true);
  }
}
