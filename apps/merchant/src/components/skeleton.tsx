import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, elevation, radius } from '@/theme';

/** A soft pulsing block in the shape of what is loading. */
function Bone({ width, height, round = radius.sm }: { width: DimensionValue; height: number; round?: number }) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: round, backgroundColor: colors.field }, pulse]} />;
}

/** Placeholder store cards, so the page has its shape before the shops arrive. */
export function StoreListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View accessibilityLabel="بنحمّل المحلات" style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.card}>
          <Bone width={56} height={56} round={16} />
          <View style={styles.lines}>
            <Bone width="60%" height={16} />
            <Bone width="85%" height={13} />
            <Bone width="45%" height={20} round={radius.pill} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Placeholder item rows for a store page. */
export function ProductListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View accessibilityLabel="بنحمّل الحاجات">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.lines}>
            <Bone width="55%" height={16} />
            <Bone width="30%" height={13} />
            <Bone width="25%" height={16} />
          </View>
          <Bone width={96} height={48} round={radius.md} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...elevation.card,
  },
  lines: { flex: 1, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
});
