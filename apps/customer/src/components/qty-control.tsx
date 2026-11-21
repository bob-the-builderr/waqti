import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

import { Icon } from './icon';
import { Txt } from './txt';

type Props = { qty: number; label: string; onAdd: () => void; onRemove: () => void };

/**
 * «أضف» that becomes «+ 2» once the item is in the cart.
 *
 * The add target keeps exactly the footprint of the «أضف» pill, so tapping the
 * same spot again always adds one more. The "−" (a bin at one piece) sits
 * outside that footprint, towards the item's name, so it is never hit by a
 * repeated tap.
 */
export function QtyControl({ qty, label, onAdd, onRemove }: Props) {
  return (
    <View style={styles.wrap}>
      {qty > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={qty === 1 ? `شيل ${label}` : `قلّل ${label}`}
          onPress={onRemove}
          style={({ pressed }) => [styles.minus, pressed && styles.pressed]}>
          {qty === 1 ? (
            <Icon name="trash" size={20} color={colors.danger} strokeWidth={2} />
          ) : (
            <Icon name="minus" size={20} strokeWidth={2.4} />
          )}
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={qty === 0 ? `أضف ${label}` : `زوّد ${label}، في السلة ${qty}`}
        hitSlop={4}
        onPress={onAdd}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        {qty === 0 ? (
          <Txt weight={600} size={16} color={colors.white}>
            أضف
          </Txt>
        ) : (
          <Txt weight={700} size={18} color={colors.white}>
            {qty}
          </Txt>
        )}
        <Icon name="plus" size={20} color={colors.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  add: {
    width: 96,
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
  },
  minus: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
});
