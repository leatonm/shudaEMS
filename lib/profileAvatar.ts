import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

const AVATAR_FILENAME = 'profile-avatar.jpg';

/** Durable on-device path for the user's profile photo. */
export function profileAvatarDestFile(): File {
  return new File(Paths.document, AVATAR_FILENAME);
}

async function persistPickedUri(pickedUri: string): Promise<string> {
  const dest = profileAvatarDestFile();
  try {
    if (dest.exists) {
      dest.delete();
    }
  } catch {
    // Best-effort clear of prior avatar.
  }

  const source = new File(pickedUri);
  await source.copy(dest, { overwrite: true });
  // Cache-bust so Image reloads after replace.
  return `${dest.uri}?t=${Date.now()}`;
}

async function pickFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Photos permission',
      'Allow photo access in Settings to choose a profile picture.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistPickedUri(result.assets[0].uri);
}

async function pickFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Camera permission',
      'Allow camera access in Settings to take a profile picture.'
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistPickedUri(result.assets[0].uri);
}

export async function clearPersistedAvatar(): Promise<void> {
  try {
    const dest = profileAvatarDestFile();
    if (dest.exists) dest.delete();
  } catch {
    // Ignore missing file.
  }
}

/**
 * Native sheet: library, camera, or remove.
 * Returns the new durable URI, `null` if cancelled, or `''` if removed.
 */
export function promptProfileAvatarChange(
  hasCustom: boolean
): Promise<string | null> {
  return new Promise((resolve) => {
    const buttons: Array<{
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }> = [
      {
        text: 'Choose from library',
        onPress: () => {
          void pickFromLibrary().then(resolve);
        },
      },
      {
        text: 'Take photo',
        onPress: () => {
          void pickFromCamera().then(resolve);
        },
      },
    ];

    if (hasCustom) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => {
          void clearPersistedAvatar().then(() => resolve(''));
        },
      });
    }

    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => resolve(null),
    });

    Alert.alert(
      'Profile picture',
      Platform.OS === 'web'
        ? 'Pick an image for your profile.'
        : 'Use your phone to set a profile picture.',
      buttons
    );
  });
}
