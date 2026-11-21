import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CART_PILL_SPACE, CartPill } from '@/components/cart-pill';
import { Icon } from '@/components/icon';
import { QtyControl } from '@/components/qty-control';
import { ProductPhoto } from '@/components/photo';
import { StoreRow } from '@/components/store-tiles';
import { Txt, useInputSize } from '@/components/txt';
import { Chip, Loading, PrimaryButton, SecondaryButton, Sheet } from '@/components/ui';
import { linkedFirst, useAllProducts, useLinkedStoreIds, useStores } from '@/data/queries';
import type { Product, Store } from '@/data/types';
import { MAX_STORES, money, storesWord, tripFee } from '@/lib/pricing';
import { matches, rankMatch } from '@/lib/search';
import { groupCart, useCart } from '@/state/cart';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

const POPULAR = ['عيش', 'رز', 'سكر', 'كشري', 'طماطم', 'مسكن'];

/** One search for shops and the things they sell («رز», «بنادول», «كشري»). */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [limitOpen, setLimitOpen] = useState(false);
  const stores = useStores();
  const products = useAllProducts();
  const linkedIds = useLinkedStoreIds();
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const toast = useToast((s) => s.show);
  const inputSize = useInputSize(16);

  const q = query.trim();
  const storeById = new Map((stores.data ?? []).map((s) => [s.id, s]));
  const shopHits = q ? linkedFirst((stores.data ?? []).filter((s) => matches(`${s.name} ${s.categoryName}`, q)), linkedIds.data) : [];
  // Items whose own name matches come first («عيش بلدي» before a chicken "served with bread").
  const matched = q
    ? (products.data ?? [])
        .filter((p) => storeById.has(p.storeId) && matches(`${p.name} ${p.note}`, q))
        .map((p) => ({ p, rank: rankMatch(p.name, q), km: storeById.get(p.storeId)?.distanceKm ?? 99 }))
        .sort((a, b) => a.rank - b.rank || a.km - b.km)
    : [];
  // The same product in several shops shows once, from the nearest shop.
  const otherShops = new Map<string, number>();
  const itemHits: Product[] = [];
  const firstOf = new Map<string, string>();
  for (const { p } of matched) {
    const key = `${p.name}|${p.note}`;
    const first = firstOf.get(key);
    if (first) otherShops.set(first, (otherShops.get(first) ?? 0) + 1);
    else if (itemHits.length < 40) {
      firstOf.set(key, p.id);
      itemHits.push(p);
    }
  }
  // A section word («صيدلية», «بقالة») shows the shops first.
  const shopsFirst = shopHits.some((s) => matches(s.categoryName, q));

  const onAdd = (product: Product, store: Store) => {
    const result = add(product, store);
    if (result === 'store-limit') setLimitOpen(true);
    if (result === 'new-store') {
      toast(`${store.name} هيجي مع نفس المندوب · التوصيل بقى ${money(tripFee(groupCart(useCart.getState().lines).map((g) => g.store)).total)}`);
    }
  };

  const onRemove = (product: Product) => {
    const removed = remove(product.id);
    if (removed) toast(`اتشال ${product.name} من السلة`, { label: 'رجّعه', onPress: () => restore(removed) });
  };

  const itemsSection =
    itemHits.length > 0 ? (
      <>
        <Txt display weight={600} size={17} style={styles.sectionTitle}>
          حاجات
        </Txt>
        {itemHits.map((product) => {
          const store = storeById.get(product.storeId) as Store;
          return (
            <View key={product.id} style={styles.item}>
              <ProductPhoto product={product} style={styles.thumb} />
              <View style={styles.flex}>
                <Txt weight={600} size={16}>
                  {product.name}
                </Txt>
                <Txt size={14} color={colors.muted} numberOfLines={2}>
                  {store.name}
                  {product.note ? ` · ${product.note}` : ''}
                  {otherShops.get(product.id) ? ` · وفي ${otherShops.get(product.id) === 1 ? 'محل تاني' : `${otherShops.get(product.id)} محلات تانية`}` : ''}
                </Txt>
                <Txt weight={700} size={16}>
                  {money(product.price)}
                </Txt>
              </View>
              <QtyControl
                qty={lines[product.id]?.qty ?? 0}
                label={product.name}
                onAdd={() => onAdd(product, store)}
                onRemove={() => onRemove(product)}
              />
            </View>
          );
        })}
      </>
    ) : null;

  const shopsSection =
    shopHits.length > 0 ? (
      <>
        <Txt display weight={600} size={17} style={styles.sectionTitle}>
          محلات
        </Txt>
        {shopHits.map((store) => (
          <StoreRow key={store.id} store={store} linked={!!linkedIds.data?.includes(store.id)} />
        ))}
      </>
    ) : null;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.search}>
          <Icon name="search" size={22} color={colors.muted} />
          <TextInput
            autoFocus
            accessibilityLabel="دوّر على محل أو حاجة"
            placeholder="دوّر على محل أو حاجة (رز، عيش، كشري…)"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={[styles.input, { fontSize: inputSize }]}
          />
        </View>
        <SecondaryButton label="رجوع" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!q ? (
          <>
            <Txt weight={600} size={16}>
              الناس بتدوّر على
            </Txt>
            <View style={styles.chips}>
              {POPULAR.map((word) => (
                <Chip key={word} label={word} selected={false} onPress={() => setQuery(word)} />
              ))}
            </View>
          </>
        ) : stores.isPending || products.isPending ? (
          <Loading />
        ) : (
          <>
            {shopsFirst ? (
              <>
                {shopsSection}
                {itemsSection}
              </>
            ) : (
              <>
                {itemsSection}
                {shopsSection}
              </>
            )}

            {itemHits.length === 0 && shopHits.length === 0 ? (
              <View style={styles.empty}>
                <Txt weight={600} size={17} align="center">
                  ملقيناش «{q}» في المحلات اللي على التطبيق
                </Txt>
                <Txt size={15} color={colors.body} align="center">
                  جرّب كلمة تانية، أو خلّي المندوب يجيبهولك من أي محل في الفيوم.
                </Txt>
                <SecondaryButton label="هاتلي أي حاجة" onPress={() => router.push('/errand')} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <CartPill />

      <Sheet visible={limitOpen} onClose={() => setLimitOpen(false)} title={`المندوب بيجيب من ${storesWord(MAX_STORES)} بس في المشوار الواحد`}>
        <Txt size={16} color={colors.body}>
          ابعت اللي في السلة الأول، وده في طلب تاني.
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton
            label="روح للسلة"
            onPress={() => {
              setLimitOpen(false);
              router.push('/checkout');
            }}
          />
          <SecondaryButton label="خلاص، مش دلوقتي" onPress={() => setLimitOpen(false)} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 64, height: 64 },
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: colors.accent },
  search: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  input: { flex: 1, minWidth: 0, height: 48, fontFamily: fonts.body400, color: colors.ink },
  content: { padding: 16, paddingBottom: CART_PILL_SPACE },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  sectionTitle: { marginTop: 8, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  empty: { marginTop: 24, gap: 10, padding: 20, borderRadius: radius.lg, backgroundColor: colors.card },
  sheetActions: { marginTop: 6, gap: 10 },
});
