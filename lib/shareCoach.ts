import { Alert, Share } from 'react-native';
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';
import * as SMS from 'expo-sms';

import {
  formatCoachTipMessage,
  pickRandomCoachTip,
  type CoachTip,
} from '@/data/emt/coachTips';

/**
 * Ask for contacts access, then open the system contact picker.
 * Returns a phone number when the contact has one.
 */
export async function pickContactPhone(): Promise<{
  name: string;
  phone: string;
} | null> {
  const permission = await requestPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Contacts permission',
      'Allow contacts access to pick someone to text a tip or share the app with.'
    );
    return null;
  }

  const contact = await Contact.presentPicker();
  if (!contact) return null;

  const phones = await contact.getPhones();
  const phone = phones.find((p) => p.number)?.number?.trim() || null;
  if (!phone) {
    Alert.alert(
      'No phone number',
      'That contact has no phone number on file. Pick another contact or use Share.'
    );
    return null;
  }

  const details = await contact.getDetails([
    ContactField.FULL_NAME,
    ContactField.GIVEN_NAME,
  ]);
  const name =
    details.fullName?.trim() || details.givenName?.trim() || 'Contact';
  return { name, phone };
}

export async function textCoachTipToPhone(
  phone: string,
  tip?: CoachTip
): Promise<void> {
  const available = await SMS.isAvailableAsync();
  if (!available) {
    Alert.alert(
      'SMS unavailable',
      'This device cannot send texts. Try Share instead.'
    );
    return;
  }

  const message = formatCoachTipMessage(tip ?? pickRandomCoachTip());
  await SMS.sendSMSAsync([phone], message);
}

/** Open the SMS composer with a tip for a contact the user picks. */
export async function textCoachTipToContact(tip?: CoachTip): Promise<void> {
  const picked = await pickContactPhone();
  if (!picked) return;
  await textCoachTipToPhone(picked.phone, tip);
}

/** System share sheet — Messages, other apps, etc. */
export async function shareCoachTip(tip?: CoachTip): Promise<void> {
  const message = formatCoachTipMessage(tip ?? pickRandomCoachTip());
  await Share.share({
    message,
    title: 'EMT Coach tip',
  });
}

export async function shareAppInvite(): Promise<void> {
  await Share.share({
    message:
      'Train with me on EMT Response Simulator — oral-exam style scenarios for size-up, assessment, and transport decisions.',
    title: 'EMT Response Simulator',
  });
}
