import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CART_PILL_SPACE, CartPill } from '@/components/cart-pill';
import { StoreRow } from '@/components/store-tiles';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { Chip, ErrorState, ScreenHeader } from '@/components/ui';
import { linkedFirst, useCategories, useLinkedStoreIds, useStores } from '@/data/queries';
import type { Store } from '@/data/types';
import { storesWord } from '@/lib/pricing';
import { colors } from '@/theme';

type Sort = 'near' | 'rating' | 'fast';

const sorters: Record<Sort, (a: Store, b: Store) => number> = {
  near: (a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99),
  rating: (a, b) => b.rating - a.rating,
  fast: (a, b) => a.etaMax - b.etaMax,
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categories = useCategories();
  const stores = useStores();
  const linkedIds = useLinkedStoreIds();
  const [sort, setSort] = useState<Sort>('near');

  const category = categories.data?.find((c) => c.id === id);
  // The shop that brought the customer always leads its own section.
  const list = linkedFirst((stores.data ?? []).filter((s) => s.categoryId === id).sort(sorters[sort]), linkedIds.data);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={category?.name ?? 'القسم'}
        trailing={
          stores.data ? (
            <Txt size={14} color={colors.onAccentSoft}>
              {storesWord(list.length)}
            </Txt>
          ) : null
        }
      />
      {stores.isPending ? (
        <StoreListSkeleton />
      ) : stores.isError ? (
        <ErrorState message="مقدرناش نجيب المحلات" onRetry={() => stores.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sorts}>
            <Chip label="الأقرب" selected={sort === 'near'} onPress={() => setSort('near')} />
            <Chip label="الأحسن تقييم" selected={sort === 'rating'} onPress={() => setSort('rating')} />
            <Chip label="الأسرع" selected={sort === 'fast'} onPress={() => setSort('fast')} />
          </View>
          {list.map((store) => (
            <StoreRow key={store.id} store={store} showCategory={false} linked={!!linkedIds.data?.includes(store.id)} />
          ))}
        </ScrollView>
      )}
      <CartPill />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 16, paddingBottom: CART_PILL_SPACE },
  sorts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
});
