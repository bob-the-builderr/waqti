import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CART_PILL_SPACE, CartPill } from '@/components/cart-pill';
import { Icon, Star } from '@/components/icon';
import { HeartButton } from '@/components/favorite';
import { AddOnPhoto, ProductPhoto, StoreCover } from '@/components/photo';
import { PhotoAsk } from '@/components/photo-ask';
import { QtyControl } from '@/components/qty-control';
import { StoreMark } from '@/components/store-tiles';
import { ProductListSkeleton, StoreListSkeleton } from '@/components/skeleton';
import { Txt, useInputSize } from '@/components/txt';
import {
  Badge,
  callNumber,
  Card,
  Chip,
  ErrorState,
  GuaranteeChip,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Sheet,
  styles as ui,
} from '@/components/ui';
import { useLinkedStoreIds, useProducts, useStore } from '@/data/queries';
import type { Product, Store } from '@/data/types';
import { baseFee, guaranteeMinutes, MAX_STORES, money, storeOpen, storesWord, tripFee } from '@/lib/pricing';
import { matches } from '@/lib/search';
import { groupCart, useCart } from '@/state/cart';
import { useToast } from '@/state/toast';
import { colors, elevation, fonts, radius } from '@/theme';

const DISH_NOTES = ['من غير بصل', 'سبايسي', 'صوص زيادة', 'من غير طحينة'];

function listTitle(store: Store) {
  if (store.categoryId === 'rest') return 'المنيو';
  if (store.isPharmacy) return 'حاجات من الصيدلية من غير روشتة';
  return 'الحاجات اللي في المحل';
}

/** Stores with more items than this get a search box. */
const SEARCH_FROM = 8;

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore(id);
  const products = useProducts(id);
  const linkedIds = useLinkedStoreIds();
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const setNote = useCart((s) => s.setNote);
  const toast = useToast((s) => s.show);
  const [query, setQuery] = useState('');
  const [limitOpen, setLimitOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [aisle, setAisle] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const inputSize = useInputSize(16);

  if (store.isPending) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="" />
        <StoreListSkeleton rows={1} />
      </View>
    );
  }

  if (!store.data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="المحل" />
        <ErrorState message="المحل ده مش موجود أو مقفول دلوقتي" onRetry={() => store.refetch()} />
      </View>
    );
  }

  const shop = store.data;
  const isLinked = !!linkedIds.data?.includes(shop.id);
  // The shop app can close or pause the shop; then nothing can be added from it.
  const open = storeOpen(shop, store.dataUpdatedAt);
  const inCart = groupCart(lines);

  const onAdd = (product: Product) => {
    const result = add(product, shop);
    if (result === 'store-limit') setLimitOpen(true);
    if (result === 'new-store') {
      toast(`${shop.name} هيجي مع نفس المندوب · التوصيل بقى ${money(tripFee(groupCart(useCart.getState().lines).map((g) => g.store)).total)}`);
    }
  };

  const onRemove = (product: Product) => {
    const removed = remove(product.id);
    if (removed) toast(`اتشال ${product.name} من السلة`, { label: 'رجّعه', onPress: () => restore(removed) });
  };

  const items = (products.data ?? []).filter((p) => !query.trim() || matches(`${p.name} ${p.note}`, query));
  // Restaurants read as a menu (photo beside each dish); every other shop as a shelf of photos, two to a row.
  const asGrid = shop.categoryId !== 'rest';
  const cardWidth = (Math.min(width, 560) - 32 - 10) / 2;
  const qtyOf = (p: Product) => lines[p.id]?.qty ?? 0;
  const openSheet = (p: Product) => {
    setSelected(p);
    setNoteDraft(lines[p.id]?.note ?? '');
  };
  // Restaurants take a short note per dish («من غير بصل»).
  const takesNotes = shop.categoryId === 'rest';
  // Aisles («ألبان وبيض»، «زيوت وسمن») in catalog order. With «الكل» each aisle gets its own heading.
  const aisles = [...new Set((products.data ?? []).map((p) => p.section).filter((x): x is string => !!x))];
  const shown = aisle ? items.filter((p) => p.section === aisle) : items;
  const groups =
    !aisle && aisles.length > 1 && !query.trim()
      ? [
          ...aisles.map((a) => ({ title: a as string | null, list: shown.filter((p) => p.section === a) })),
          { title: null, list: shown.filter((p) => !p.section) },
        ].filter((g) => g.list.length)
      : [{ title: null, list: shown }];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 150)}
        scrollEventThrottle={64}>
        <StoreCover store={shop} height={200 + insets.top} />
        <View style={styles.content}>
        {open ? null : (
          <View style={styles.closed}>
            <Icon name="clock" size={22} color={colors.warning} />
            <Txt size={16} weight={600} color={colors.warning} style={styles.flex}>
              {shop.isOpen ? 'المحل مشغول دلوقتي ومش بياخد طلبات. جرّب كمان شوية' : 'المحل مقفول دلوقتي'}
            </Txt>
          </View>
        )}
        <Card style={styles.info}>
          <View style={styles.identity}>
            <StoreMark store={shop} size={64} style={styles.logo} />
            <View style={styles.flex}>
              <Txt display weight={700} size={21}>
                {shop.name}
              </Txt>
              <Txt size={14} color={colors.muted}>
                {shop.categoryName} · {shop.area}
              </Txt>
            </View>
          </View>
          <View style={styles.meta}>
            <GuaranteeChip minutes={guaranteeMinutes([shop])} />
            <View style={styles.inline}>
              <Star size={15} />
              <Txt size={14} weight={500}>
                {shop.rating.toFixed(1)}{shop.ratingCount ? ` (${shop.ratingCount} تقييم)` : ''}
              </Txt>
            </View>
            <Txt size={14} weight={500}>
              التوصيل {money(baseFee(shop.distanceKm))}
            </Txt>
          </View>
          <View style={styles.promise}>
            <Icon name="check" size={18} color={colors.success} strokeWidth={2.2} />
            <Txt size={15} weight={500} color={colors.body} style={styles.flex}>
              نفس سعر الرف في المحل بالظبط
            </Txt>
          </View>
          {isLinked ? (
            <View style={styles.linked}>
              <Badge label="من محلاتك" tone={colors.mintSoft} color={colors.ink} />
            </View>
          ) : null}
          {shop.phone ? (
            <View style={styles.call}>
              <SecondaryButton label="اتصل بالمحل" icon="phone" onPress={() => callNumber(shop.phone as string)} />
            </View>
          ) : null}
        </Card>

        {shop.isPharmacy ? (
          <Card style={styles.rx}>
            <View style={styles.rxHead}>
              <View style={styles.rxIcon}>
                <Icon name="camera" size={26} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <Txt display weight={600} size={17}>
                  عندك روشتة أو علبة دوا فاضية؟
                </Txt>
                <Txt size={15} color={colors.body}>
                  صوّرها، والصيدلية تكلمك بالسعر قبل ما تبعت أي حاجة.
                </Txt>
              </View>
            </View>
            <SecondaryButton label="صوّر الروشتة" icon="camera" onPress={() => router.push(`/rx/${shop.id}`)} />
          </Card>
        ) : null}

        <View style={styles.listHead}>
          <Txt display weight={600} size={18}>
            {listTitle(shop)}
          </Txt>
          {shop.dailyPrices ? <Badge label="أسعار النهارده" tone={colors.successSoft} color={colors.success} /> : null}
        </View>

        {(products.data?.length ?? 0) > SEARCH_FROM ? (
          <View style={styles.search}>
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel={`دوّر في ${shop.name}`}
              placeholder={`دوّر في ${shop.name}`}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { fontSize: inputSize }]}
            />
          </View>
        ) : null}

        {aisles.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aisles}>
            <Chip label="الكل" selected={!aisle} onPress={() => setAisle(null)} />
            {aisles.map((a) => (
              <Chip key={a} label={a} selected={aisle === a} onPress={() => setAisle(a)} />
            ))}
          </ScrollView>
        ) : null}

        {products.isPending ? (
          <ProductListSkeleton />
        ) : products.isError ? (
          <ErrorState message="مقدرناش نجيب الحاجات" onRetry={() => products.refetch()} />
        ) : (
          <>
            {groups.map((g) => (
              <View key={g.title ?? 'all'}>
                {g.title ? (
                  <Txt display weight={600} size={17} style={styles.aisleTitle}>
                    {g.title}
                  </Txt>
                ) : null}
                <View style={asGrid ? styles.grid : null}>
                    {g.list.map((product) =>
                  // The add control sits beside the card's pressable area, not inside it (no button in a button).
                  asGrid ? (
                    <View key={product.id} style={[styles.gridCard, { width: cardWidth }]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={product.name}
                        onPress={() => openSheet(product)}
                        style={({ pressed }) => [styles.gridInner, pressed && ui.pressed]}>
                        <ProductPhoto product={product} style={styles.gridPhoto} textLift={44} />
                        <Txt weight={700} size={16}>
                          {money(product.price)}
                        </Txt>
                        <Txt size={15} weight={500} numberOfLines={2}>
                          {product.name}
                        </Txt>
                        {product.note ? (
                          <Txt size={13} color={colors.muted} numberOfLines={1}>
                            {product.note}
                          </Txt>
                        ) : null}
                      </Pressable>
                      {open ? (
                        <AddOnPhoto
                          qty={qtyOf(product)}
                          label={product.name}
                          onAdd={() => onAdd(product)}
                          onRemove={() => onRemove(product)}
                          style={[styles.onPhoto, { top: cardWidth - 60 }]}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <View key={product.id} style={styles.item}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={product.name}
                        onPress={() => openSheet(product)}
                        style={({ pressed }) => [styles.itemInner, pressed && ui.pressed]}>
                        <View style={styles.flex}>
                          <Txt weight={600} size={16}>
                            {product.name}
                          </Txt>
                          {product.note ? (
                            <Txt size={14} color={colors.muted} numberOfLines={2}>
                              {product.note}
                            </Txt>
                          ) : null}
                          <Txt weight={700} size={16} style={styles.price}>
                            {money(product.price)}
                          </Txt>
                        </View>
                        <ProductPhoto product={product} style={styles.rowPhoto} />
                      </Pressable>
                      {open ? (
                        <AddOnPhoto qty={qtyOf(product)} label={product.name} onAdd={() => onAdd(product)} onRemove={() => onRemove(product)} style={styles.onRowPhoto} />
                      ) : null}
                    </View>
                  ),
                )}
              </View>
              </View>
            ))}
          </>
        )}
        {products.data && items.length === 0 ? (
          <Txt size={15} color={colors.muted} align="center" style={styles.noMatch}>
            مفيش حاجة بالاسم ده في {shop.name}
          </Txt>
        ) : null}
        </View>
      </ScrollView>

      {/* Back on the photo; once the photo scrolls away, a slim violet bar with the name. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }, scrolled && styles.topBarSolid]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.back, scrolled && styles.backOnBar, pressed && ui.pressed]}>
          <Icon name="back" size={22} strokeWidth={2.2} color={scrolled ? colors.onAccent : colors.ink} />
        </Pressable>
        <View style={styles.flex}>
          {scrolled ? (
            <Txt display weight={600} size={18} numberOfLines={1} color={colors.onAccent}>
              {shop.name}
            </Txt>
          ) : null}
        </View>
        <HeartButton storeId={shop.id} storeName={shop.name} />
      </View>
      <CartPill />

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected ? (
          <>
            <ProductPhoto product={selected} rounded={radius.lg} style={selected.image ? styles.sheetPhoto : styles.sheetCard} />
            {selected.image ? null : <PhotoAsk product={selected} />}
            <View style={styles.sheetMeta}>
              <Txt size={15} color={colors.muted} style={styles.flex}>
                {selected.note || shop.name}
              </Txt>
              <Txt display weight={700} size={20}>
                {money(selected.price)}
              </Txt>
            </View>
            {open && qtyOf(selected) > 0 ? (
              <View style={styles.sheetMeta}>
                <Txt size={16} weight={600} style={styles.flex}>
                  في السلة
                </Txt>
                <QtyControl qty={qtyOf(selected)} label={selected.name} onAdd={() => onAdd(selected)} onRemove={() => onRemove(selected)} />
              </View>
            ) : null}
            {open && takesNotes ? (
              <View style={styles.noteBox}>
                <Txt size={15} weight={600}>
                  ملاحظة للمطعم (مش لازم)
                </Txt>
                <View style={styles.noteChips}>
                  {DISH_NOTES.map((n) => (
                    <Chip
                      key={n}
                      label={n}
                      selected={noteDraft.includes(n)}
                      onPress={() => setNoteDraft((d) => (d.includes(n) ? d.replace(n, '').replace(/^،\s*|،\s*$/g, '').replace(/،\s*،/g, '،').trim() : d ? `${d}، ${n}` : n))}
                    />
                  ))}
                </View>
                <TextInput
                  accessibilityLabel="ملاحظة للمطعم"
                  placeholder="أو اكتب ملاحظتك"
                  placeholderTextColor={colors.muted}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  maxLength={100}
                  style={[styles.noteInput, { fontSize: inputSize }]}
                />
              </View>
            ) : null}
            {open ? (
              <PrimaryButton
                label={qtyOf(selected) > 0 ? 'تمام' : `أضف للسلة · ${money(selected.price)}`}
                onPress={() => {
                  if (qtyOf(selected) === 0) onAdd(selected);
                  if (takesNotes) setNote(selected.id, noteDraft.trim());
                  setSelected(null);
                }}
              />
            ) : null}
          </>
        ) : null}
      </Sheet>

      <Sheet
        visible={limitOpen}
        onClose={() => setLimitOpen(false)}
        title={`المندوب بيجيب من ${storesWord(MAX_STORES)} بس في المشوار الواحد`}>
        <Txt size={16} color={colors.body}>
          السلة فيها دلوقتي: {inCart.map((g) => g.store.name).join('، ')}. تحب تبعت الطلب ده الأول، و{shop.name} في طلب
          تاني؟
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton
            label="ابعت اللي في السلة الأول"
            onPress={() => {
              setLimitOpen(false);
              router.push('/checkout');
            }}
          />
          <SecondaryButton
            label="شيل محل من السلة"
            onPress={() => {
              setLimitOpen(false);
              router.push('/checkout');
            }}
          />
          <Pressable accessibilityRole="button" onPress={() => setLimitOpen(false)} style={({ pressed }) => [styles.textButton, pressed && ui.pressed]}>
            <Txt size={16} weight={500} color={colors.muted} align="center">
              خلاص، مش دلوقتي
            </Txt>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: CART_PILL_SPACE },
  content: { paddingHorizontal: 16 },
  info: { marginTop: -40 },
  logo: { marginTop: -44, borderWidth: 3, borderColor: colors.card },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  topBarSolid: { backgroundColor: colors.accent },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...elevation.raised },
  backOnBar: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  aisles: { gap: 8, paddingVertical: 10 },
  aisleTitle: { marginTop: 18 },
  gridCard: { padding: 8, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  gridInner: { gap: 2 },
  gridPhoto: { width: '100%', aspectRatio: 1, marginBottom: 6 },
  onPhoto: { position: 'absolute', end: 14 },
  rowPhoto: { width: 104, height: 104 },
  onRowPhoto: { position: 'absolute', bottom: 22, end: 4 },
  sheetPhoto: { width: '100%', height: 220 },
  sheetCard: { width: '100%', height: 130 },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteBox: { gap: 8 },
  noteChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteInput: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body400,
    color: colors.ink,
    textAlign: 'right',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 14 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  linked: { marginTop: 10 },
  closed: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 12, borderRadius: radius.lg, backgroundColor: colors.warningSoft },
  call: { marginTop: 12 },
  rx: { marginTop: 14, gap: 14, borderWidth: 1.5, borderColor: colors.accent },
  rxHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rxIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  listHead: { marginTop: 22, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
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
    backgroundColor: colors.card,
  },
  input: { flex: 1, minWidth: 0, height: 46, fontFamily: fonts.body400, color: colors.ink },
  item: { paddingTop: 14, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.divider },
  itemInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { marginTop: 2 },
  noMatch: { marginTop: 24 },
  sheetActions: { marginTop: 6, gap: 10 },
  textButton: { minHeight: 48, justifyContent: 'center' },
});
