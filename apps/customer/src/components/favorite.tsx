import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { friendlyError, setFavorite } from '@/data/api';
import { keys, useFavorites } from '@/data/queries';
import { useToast } from '@/state/toast';
import { colors, elevation } from '@/theme';

import { Icon } from './icon';

/** Round heart over a shop's photo: tap to keep the shop in «مفضلتك». */
export function HeartButton({ storeId, storeName, style }: { storeId: string; storeName: string; style?: StyleProp<ViewStyle> }) {
  const favorites = useFavorites();
  const client = useQueryClient();
  const toast = useToast((s) => s.show);
  const on = !!favorites.data?.includes(storeId);

  const toggle = useMutation({
    mutationFn: (next: boolean) => setFavorite(storeId, next),
    // Show the change at once; put it back if the server says no.
    onMutate: (next) => {
      const before = client.getQueryData<string[]>(keys.favorites) ?? [];
      client.setQueryData<string[]>(keys.favorites, next ? [...before, storeId] : before.filter((id) => id !== storeId));
      return { before };
    },
    onError: (e, _next, context) => {
      if (context) client.setQueryData(keys.favorites, context.before);
      toast(friendlyError(e));
    },
    onSuccess: (_data, next) => toast(next ? `${storeName} في مفضلتك` : `اتشال ${storeName} من مفضلتك`),
    onSettled: () => client.invalidateQueries({ queryKey: keys.favorites }),
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `شيل ${storeName} من المفضلة` : `ضيف ${storeName} للمفضلة`}
      accessibilityState={{ selected: on }}
      hitSlop={6}
      onPress={() => toggle.mutate(!on)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Icon name="heart" size={22} color={on ? colors.danger : colors.ink} fill={on ? colors.danger : 'none'} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...elevation.raised },
  pressed: { opacity: 0.8 },
});
