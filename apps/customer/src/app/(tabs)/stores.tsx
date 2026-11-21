import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CART_PILL_SPACE, CartPill } from '@/components/cart-pill';
import { Icon } from '@/components/icon';
import { StoreRow } from '@/components/store-tiles';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt, useInputSize } from '@/components/txt';
import { Chip, ErrorState, SecondaryButton, TabHeader } from '@/components/ui';
import { linkedFirst, useAllProducts, useCategories, useLinkedStoreIds, useStores } from '@/data/queries';
import { storesWord } from '@/lib/pricing';
import { matches } from '@/lib/search';
import { colors, fonts, radius } from '@/theme';

export default function StoresScreen() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const stores = useStores();
  const categories = useCategories();
  const linkedIds = useLinkedStoreIds();
  const q = query.trim();
  const products = useAllProducts(!!q);
  const inputSize = useInputSize(16);

  /** Shops whose items match, so «رز» finds the groceries that sell rice. */
  const sellers = new Map<string, string>();
  if (q) {
    for (const p of products.data ?? []) {
      if (!sellers.has(p.storeId) && matches(p.name, q)) sellers.set(p.storeId, p.name);
    }
  }

  const visible = linkedFirst(
    (stores.data ?? []).filter(
      (s) => (!categoryId || s.categoryId === categoryId) && (!q || matches(s.name, q) || sellers.has(s.id)),
    ),
    linkedIds.data,
  );

  return (
    <View style={styles.screen}>
      <TabHeader
        title="كل المحلات"
        trailing={
          stores.data ? (
            <Txt size={14} color={colors.onAccentSoft}>
              {storesWord(visible.length)}
            </Txt>
          ) : null
        }>
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput
            accessibilityLabel="دوّر على محل أو حاجة"
            placeholder="اسم المحل أو حاجة بيبيعها"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { fontSize: inputSize }]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="الكل" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {(categories.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>
      </TabHeader>

      {stores.isPending ? (
        <StoreListSkeleton />
      ) : stores.isError ? (
        <ErrorState message="مقدرناش نجيب المحلات" onRetry={() => stores.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {visible.map((store) => (
            <View key={store.id}>
              <StoreRow store={store} linked={!!linkedIds.data?.includes(store.id)} />
              {q && sellers.has(store.id) && !matches(store.name, q) ? (
                <Txt size={14} color={colors.accent} weight={500} style={styles.sells}>
                  بيبيع: {sellers.get(store.id)}
                </Txt>
              ) : null}
            </View>
          ))}
          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Txt weight={600} size={17} align="center">
                ملقيناش محل بالاسم ده
              </Txt>
              <Txt size={15} color={colors.body} align="center">
                جرّب كلمة تانية، أو خلّي المندوب يجيبهولك من أي محل في الفيوم.
              </Txt>
              <SecondaryButton label="هاتلي أي حاجة" onPress={() => router.push('/errand')} />
            </View>
          ) : null}
        </ScrollView>
      )}
      <CartPill />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  search: {
    marginTop: 10,
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
  },
  input: { flex: 1, minWidth: 0, height: 46, fontFamily: fonts.body400, color: colors.ink },
  chips: { gap: 8, paddingTop: 10 },
  content: { padding: 16, paddingBottom: CART_PILL_SPACE },
  sells: { marginTop: -6, marginBottom: 12, paddingHorizontal: 12 },
  empty: { padding: 20, gap: 10, borderRadius: radius.lg, backgroundColor: colors.card },
});
