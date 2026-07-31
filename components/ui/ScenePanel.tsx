import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface ScenePanelProps {
  appearance: string[];
}

export function ScenePanel({ appearance }: ScenePanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Scene Arrival</Text>
      {appearance.map((line) => (
        <View key={line} style={styles.line}>
          <Text style={styles.dot}>▸</Text>
          <Text style={styles.text}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.emsBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  dot: {
    color: theme.colors.textMuted,
    marginRight: theme.spacing.sm,
    fontSize: 12,
    marginTop: 2,
  },
  text: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
});
