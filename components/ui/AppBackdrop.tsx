import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type BackdropTone = 'default' | 'success' | 'danger' | 'amber';

const BACKGROUND = require('../../assets/images/background.png');

/**
 * Full-screen background art — covers whatever size the device/window is.
 */
export function AppBackdrop({
  tone = 'default',
  source,
}: {
  tone?: BackdropTone;
  /** Optional art override (e.g. difficulty `bg2.png`). */
  source?: ImageSourcePropType;
}) {
  const wash =
    tone === 'success'
      ? 'rgba(34, 245, 168, 0.12)'
      : tone === 'danger'
        ? 'rgba(255, 77, 109, 0.14)'
        : tone === 'amber'
          ? 'rgba(255, 197, 49, 0.12)'
          : 'rgba(0, 229, 255, 0.08)';

  return (
    <View pointerEvents="none" style={styles.root}>
      <Image source={source ?? BACKGROUND} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(5,10,18,0.55)', 'rgba(5,10,18,0.35)', 'rgba(5,10,18,0.72)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[wash, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topWash}
      />
      <LinearGradient
        colors={['transparent', 'rgba(3,7,12,0.9)']}
        style={styles.bottomFade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
});
