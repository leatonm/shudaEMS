import { useEffect, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight, FadeOutRight } from 'react-native-reanimated';

import { Characters } from '@/constants/characters';
import { fs } from '@/constants/layout';
import { theme } from '@/constants/theme';
import {
  type AlsFlashMode,
  type ResourceCrew,
  leeAlsLines,
  resourceCallsign,
} from '@/lib/characterDialogue';

interface ResourceFlashProps {
  visible: boolean;
  crew: ResourceCrew;
  mode?: AlsFlashMode;
  /** Acknowledge the short radio flash. */
  onConfirm: () => void;
}

const CREW_ACCENT: Record<ResourceCrew, string> = {
  als: theme.colors.success,
  fire: theme.colors.critical,
  pd: theme.colors.emsBlue,
};

/** Right-side resource flash — Lee for ALS; Fire/PD text-only until art lands. */
export function ResourceFlash({
  visible,
  crew,
  mode = 'enroute',
  onConfirm,
}: ResourceFlashProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [flashKey, setFlashKey] = useState(0);
  const { width, height } = useWindowDimensions();
  const portraitH = Math.min(280, Math.round(height * 0.42));
  const portraitW = Math.round(portraitH * (560 / 705));
  const textPad = Math.round(portraitH * 0.12);
  const panelW = Math.min(440, Math.round(width * 0.94));
  const cancel = mode === 'cancel';
  const accent = CREW_ACCENT[crew];
  const image: ImageSourcePropType | null =
    crew === 'als' ? Characters.lee.image : null;

  useEffect(() => {
    if (!visible) return;
    if (crew === 'als') {
      setLines(leeAlsLines(mode));
    } else if (cancel) {
      setLines(
        crew === 'fire'
          ? ['Engine copy.', 'Standing down.']
          : ['PD copy.', "We're clear."]
      );
    } else {
      setLines(
        crew === 'fire'
          ? ['Engine copy.', 'En route.']
          : ['PD copy.', 'En route.']
      );
    }
    setFlashKey((k) => k + 1);
  }, [visible, mode, crew]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <Animated.View
          key={flashKey}
          entering={FadeInRight.springify().damping(16).stiffness(160)}
          exiting={FadeOutRight.duration(160)}
          style={[styles.panel, { width: panelW }]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(2, 8, 16, 0.55)', 'rgba(2, 8, 16, 0.9)']}
            locations={[0, 0.3, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.row}>
            <View style={[styles.copy, { paddingBottom: image ? textPad : 12 }]}>
              <View style={[styles.callsignChip, { borderColor: accent, backgroundColor: `${accent}22` }]}>
                <Text style={[styles.callsign, { color: accent }]}>
                  {resourceCallsign(crew)}
                </Text>
              </View>
              {lines.map((line, i) => (
                <Animated.View
                  key={`${flashKey}-${line}-${i}`}
                  entering={FadeIn.delay(100 + i * 180)}
                  style={styles.lineChip}
                >
                  <Text style={styles.line}>{line}</Text>
                </Animated.View>
              ))}

              <Animated.View entering={FadeIn.delay(420)}>
                <Pressable style={[styles.ackBtn, { borderColor: accent }]} onPress={onConfirm}>
                  <Text style={[styles.ackText, { color: accent }]}>COPY</Text>
                </Pressable>
              </Animated.View>
            </View>
            {image ? (
              <Image
                source={image}
                resizeMode="contain"
                style={{ width: portraitW, height: portraitH }}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** @deprecated Prefer ResourceFlash */
export function AlsFlash(props: {
  visible: boolean;
  mode?: AlsFlashMode;
  onDone: () => void;
  onConfirm?: () => void;
}) {
  return (
    <ResourceFlash
      visible={props.visible}
      crew="als"
      mode={props.mode}
      onConfirm={props.onConfirm ?? props.onDone}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 16, 0.78)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  panel: {
    overflow: 'hidden',
    paddingRight: 4,
    paddingLeft: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
  },
  copy: {
    flexShrink: 1,
    alignItems: 'flex-end',
    maxWidth: 260,
    gap: 6,
  },
  callsignChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callsign: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(10),
    letterSpacing: 1.4,
    textAlign: 'right',
  },
  lineChip: {
    backgroundColor: 'rgba(2, 10, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(234, 246, 251, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  line: {
    color: '#F4FBFF',
    fontSize: fs(16),
    lineHeight: fs(21),
    fontWeight: '700',
    textAlign: 'right',
  },
  ackBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: 'rgba(2, 10, 18, 0.85)',
  },
  ackText: {
    fontFamily: 'IBMPlexMonoBold',
    fontSize: fs(13),
    letterSpacing: 1.4,
  },
});
