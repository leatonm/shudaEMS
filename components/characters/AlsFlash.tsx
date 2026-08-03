import { useEffect, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
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
  resourceCallsign,
  resourceEnrouteLines,
  leeAlsLines,
} from '@/lib/characterDialogue';

interface ResourceFlashProps {
  visible: boolean;
  crew: ResourceCrew;
  mode?: AlsFlashMode;
  /** Acknowledge / clear after the flash (auto for enroute). */
  onConfirm: () => void;
}

const CREW_ACCENT: Record<ResourceCrew, string> = {
  als: theme.colors.success,
  fire: theme.colors.critical,
  pd: theme.colors.emsBlue,
};

const HOLD_MS = 2000;
const EXIT_MS = 200;

function linesFor(crew: ResourceCrew, mode: AlsFlashMode): string[] {
  if (mode === 'enroute') return resourceEnrouteLines(crew);
  return leeAlsLines('cancel');
}

/**
 * Right-side resource radio flash.
 * Enroute: auto "Copy. / En route." then slides out — no tap required.
 */
export function ResourceFlash({
  visible,
  crew,
  mode = 'enroute',
  onConfirm,
}: ResourceFlashProps) {
  const [shown, setShown] = useState<{
    crew: ResourceCrew;
    mode: AlsFlashMode;
    lines: string[];
  } | null>(null);
  const [panelIn, setPanelIn] = useState(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, height } = useWindowDimensions();

  const portraitH = Math.min(300, Math.round(height * 0.44));
  const portraitW = Math.round(portraitH * (560 / 705));
  const textPad = Math.round(portraitH * 0.12);
  const panelW = Math.min(440, Math.round(width * 0.94));
  const accent = shown ? CREW_ACCENT[shown.crew] : CREW_ACCENT[crew];
  const image: ImageSourcePropType | null =
    shown?.crew === 'als' ? Characters.lee.image : null;

  useEffect(() => {
    const clearTimers = () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      holdTimer.current = null;
      exitTimer.current = null;
    };

    if (!visible) {
      clearTimers();
      setPanelIn(false);
      exitTimer.current = setTimeout(() => setShown(null), EXIT_MS);
      return () => clearTimers();
    }

    clearTimers();
    const next = { crew, mode, lines: linesFor(crew, mode) };
    setShown(next);
    setPanelIn(true);

    // Enroute auto-acks — no COPY tap.
    if (mode === 'enroute') {
      holdTimer.current = setTimeout(() => {
        setPanelIn(false);
        exitTimer.current = setTimeout(() => {
          setShown(null);
          onConfirmRef.current();
        }, EXIT_MS);
      }, HOLD_MS);
    }

    return () => clearTimers();
  }, [visible, mode, crew]);

  return (
    <Modal visible={!!shown} transparent animationType="none" onRequestClose={onConfirm}>
      <View style={styles.backdrop} pointerEvents="box-none">
        {panelIn && shown ? (
          <Animated.View
            key={`${shown.crew}-${shown.mode}`}
            entering={FadeInRight.springify().damping(16).stiffness(160)}
            exiting={FadeOutRight.duration(EXIT_MS)}
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
                <View
                  style={[
                    styles.callsignChip,
                    { borderColor: accent, backgroundColor: `${accent}22` },
                  ]}
                >
                  <Text style={[styles.callsign, { color: accent }]}>
                    {resourceCallsign(shown.crew)}
                  </Text>
                </View>
                {shown.lines.map((line, i) => (
                  <Animated.View
                    key={`${shown.crew}-${i}-${line}`}
                    entering={FadeIn.delay(80 + i * 140)}
                    style={styles.lineChip}
                  >
                    <Text style={styles.line}>{line}</Text>
                  </Animated.View>
                ))}
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
        ) : null}
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
    backgroundColor: 'rgba(2, 8, 16, 0.55)',
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
});
