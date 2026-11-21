import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { EXTRA_STORE_FEE, itemsWord, MAX_STORES, money, storesWord, tripFee } from '@/lib/pricing';
import { cartCount, groupCart, useCart } from '@/state/cart';
import { colors, elevation, radius } from '@/theme';

import { Txt } from './txt';

/**
 * The trip bar: one cart can hold items from up to three stores, all brought
 * by one driver. It always shows the total with delivery, so the price never
 * jumps at checkout, and says what one more store would cost.
 */
export function CartPill() {
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);
  if (count === 0) return null;
  const groups = groupCart(lines);
  const fee = tripFee(groups.map((g) => g.store)).total;
  const total = groups.reduce((sum, g) => sum + g.subtotal, 0) + fee;
  const room = MAX_STORES - groups.length;
  const hint =
    room > 0
      ? `التوصيل ${money(fee)} · وكمان محل على نفس المندوب بـ${EXTRA_STORE_FEE} جنيه بس`
      : `التوصيل ${money(fee)} · ${storesWord(MAX_STORES)} في مشوار واحد`;

  return (
    <Animated.View entering={FadeInDown.duration(220)} pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`السلة، ${itemsWord(count)}، ${money(total)} شامل التوصيل`}
        onPress={() => router.push('/checkout')}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
        <View style={styles.slots}>
          {Array.from({ length: MAX_STORES }, (_, i) => {
            const store = groups[i]?.store;
            return (
              <View key={i} style={[styles.slot, styles.slotEmpty]}>
                {store ? (
                  // A new shop pops into its seat: the trip just grew.
                  <Animated.View key={store.id} entering={ZoomIn.springify()} style={[styles.slotFill, { backgroundColor: store.tint }]}>
                    <Txt display weight={700} size={13}>
                      {store.mark}
                    </Txt>
                  </Animated.View>
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={styles.text}>
          <View style={styles.row}>
            <Txt weight={600} size={16} color={colors.white} style={styles.flex} numberOfLines={1}>
              السلة · {itemsWord(count)}
            </Txt>
            <Txt weight={700} size={16} color={colors.white} numberOfLines={1}>
              {money(total)}
            </Txt>
          </View>
          <Txt size={13} color={colors.white} numberOfLines={2}>
            {hint}
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Room to leave under scroll content so the bar never covers the last row. */
export const CART_PILL_SPACE = 128;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  pressed: { opacity: 0.92 },
  pill: {
    minHeight: 68,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    ...elevation.raised,
  },
  slots: { flexDirection: 'row', gap: 4 },
  slot: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  slotEmpty: { backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  slotFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
