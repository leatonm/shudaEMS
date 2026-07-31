import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface StarRatingProps {
  stars: number;
  size?: 'sm' | 'lg';
}

export function StarRating({ stars, size = 'lg' }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text
          key={index}
          style={[
            styles.star,
            size === 'sm' && styles.starSm,
            index < stars ? styles.filled : styles.empty,
          ]}
        >
          ★
        </Text>
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
    color: theme.colors.warning,
  },
  empty: {
    color: theme.colors.border,
  },
});
