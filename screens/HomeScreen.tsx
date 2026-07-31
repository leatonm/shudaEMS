import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShiftButton } from '@/components/ui/ShiftUI';
import { theme } from '@/constants/theme';
import { CALL_CATEGORIES } from '@/data/emt/categories';
import type { CallCategory } from '@/data/emt/types';
import { useEmtStore } from '@/store/emtStore';

export default function HomeScreen() {
  const router = useRouter();
  const startEmtCall = useEmtStore((s) => s.startCall);

  const handleStartCategory = (category?: CallCategory) => {
    const callId = startEmtCall(category ? { category } : undefined);
    if (callId) {
      router.push(`/emt/call/${callId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.academy}>EMT RESPONSE SIMULATOR</Text>
          <Text style={styles.title}>Think Like an EMT</Text>
          <Text style={styles.tagline}>
            Pick a category. The call is generated — chest pain, arrest, choking, MCI, and more.
            Scene safety → ABCDE → treat → transport.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Training aid only</Text>
          <Text style={styles.disclaimerText}>
            Not a substitute for formal EMT education, certification, medical direction, or local
            protocols. Universal principles are taught separately from region-specific actions.
          </Text>
        </View>

        <View style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>CHOOSE A CATEGORY</Text>
          <Text style={styles.shiftPrompt}>
            You do not pick the exact diagnosis. You pick the lane — the generator builds the call.
          </Text>

          {CALL_CATEGORIES.map((cat, index) => (
            <View key={cat.id}>
              {index > 0 ? <View style={styles.spacer} /> : null}
              <ShiftButton
                label={cat.label.toUpperCase()}
                onPress={() => handleStartCategory(cat.id)}
                variant={index === 0 ? 'primary' : 'secondary'}
              />
              <Text style={styles.examples}>{cat.examples}</Text>
            </View>
          ))}

          <View style={styles.spacer} />
          <ShiftButton
            label="RANDOM ANY CATEGORY"
            onPress={() => handleStartCategory()}
            variant="secondary"
          />
        </View>

        <View style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>COMPETE</Text>
          <Text style={styles.shiftPrompt}>
            Season standings for clinical judgment and patient outcomes. Soft-launch board — live
            sync later.
          </Text>
          <ShiftButton
            label="VIEW LEADERBOARD"
            onPress={() => router.push('/emt/leaderboard')}
            variant="secondary"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coming next: deeper MCI · PCR · en-route</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  academy: {
    color: theme.colors.emsBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  disclaimer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  disclaimerTitle: {
    color: theme.colors.warning,
    fontWeight: '800',
    marginBottom: 4,
    fontSize: 12,
  },
  disclaimerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  shiftCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  shiftLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  shiftPrompt: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  examples: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 17,
  },
  spacer: {
    height: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});
