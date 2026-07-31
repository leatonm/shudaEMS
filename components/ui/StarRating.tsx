import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { PopIn } from '@/components/ui/motion';

interface StarRatingProps {
  stars: number;
  size?: 'sm' | 'lg';
}

export function StarRating({ stars, size = 'lg' }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => (
        <PopIn key={index} delay={index * 90}>
          <Text
            style={[
              styles.star,
              size === 'sm' && styles.starSm,
              index < stars ? styles.filled : styles.empty,
            ]}
          >
            ★
          </Text>
        </PopIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 28,
  },
  starSm: {
    fontSize: 18,
  },
  filled: {
    color: theme.colors.accent,
  },
  empty: {
    color: theme.colors.border,
  },
});
