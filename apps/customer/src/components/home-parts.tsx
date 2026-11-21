import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Category, Product, Store } from '@/data/types';
import { money, MAX_STORES, storeOpen, storesWord, tripFee } from '@/lib/pricing';
import { groupCart, useCart } from '@/state/cart';
import { useToast } from '@/state/toast';
import { colors, elevation, radius } from '@/theme';

import { Icon, type IconName } from './icon';
import { AddOnPhoto, ProductPhoto } from './photo';
import { Txt } from './txt';
import { styles as ui } from './ui';

/** Each section's soft colour, behind its photo. */
export const categoryTint: Record<string, string> = {
  rest: '#FCE3D2',
  market: '#E3EEDB',
  pharm: '#DDEAF4',
  veg: '#E9F2D2',
  meat: '#F7DEDE',
  bakery: '#F5E8CF',
};

/** What each section is best known for; its photo becomes the section's face. */
const signature: Record<string, string> = { rest: 'كشري', market: 'زيت', pharm: 'مسكن', veg: 'طماطم', meat: 'فرخة', bakery: 'كنافة' };

/** A section's face on the home screen: its signature item, else its first product with a photo. */
function faceOf(categoryId: string, products: Product[], stores: Store[]) {
  const ids = new Set(stores.filter((s) => s.categoryId === categoryId).map((s) => s.id));
  const withPhoto = products.filter((p) => ids.has(p.storeId) && p.image);
  const word = signature[categoryId];
  return (word && withPhoto.find((p) => p.name.includes(word))) || withPhoto[0] || null;
}

/** Sections as photo tiles, three to a row, like the big apps' top row but all visible at once. */
export function CategoryTiles({ categories, products, stores }: { categories: Category[]; products: Product[]; stores: Store[] }) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const face = faceOf(category.id, products, stores);
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            onPress={() => router.push(`/category/${category.id}`)}
            style={({ pressed }) => [styles.tile, { backgroundColor: categoryTint[category.id] ?? colors.field }, pressed && ui.pressed]}>
            {face ? (
              <ProductPhoto product={face} rounded={40} style={styles.tilePhoto} />
            ) : (
              <View style={[styles.tilePhoto, styles.tileIcon]}>
                <Icon name={category.icon} size={34} strokeWidth={1.7} />
              </View>
            )}
            <Txt size={15} weight={600} align="center" numberOfLines={2}>
              {category.name}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

type Banner = {
  key: string;
  tone: string;
  title: string;
  titleColor: string;
  body: string;
  bodyColor: string;
  art: ReactNode;
  onPress: () => void;
};

/** Swipeable banners. Until there are real offers they carry our promises. */
export function PromoBanners({ products, stores, onHow }: { products: Product[]; stores: Store[]; onHow: () => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, 560) - 32;
  const [page, setPage] = useState(0);
  const faces = ['bakery', 'pharm', 'veg'].map((c) => faceOf(c, products, stores)).filter((p): p is Product => !!p);
  const pills = faceOf('pharm', products, stores);

  const banners: Banner[] = [
    {
      key: 'trip',
      tone: colors.accent,
      title: 'عيش ودوا وخضار.. في مشوار واحد',
      titleColor: colors.onAccent,
      body: `من ${storesWord(MAX_STORES)} بمندوب واحد، وكل محل زيادة بـ7 جنيه بس`,
      bodyColor: colors.onAccentSoft,
      art: (
        <View style={styles.artRow}>
          {faces.map((p, i) => (
            <ProductPhoto key={p.id} product={p} rounded={36} style={[styles.artPhoto, i === 1 && styles.artMiddle]} />
          ))}
        </View>
      ),
      onPress: onHow,
    },
    {
      key: 'promise',
      tone: colors.ink,
      title: 'وعد وقتي',
      titleColor: colors.mint,
      body: 'بنقولك هيوصل قبل الساعة كام. لو اتأخرنا، التوصيل الجاي علينا',
      bodyColor: colors.onAccentSoft,
      art: <BannerIcon name="shield" tone={colors.mint} color={colors.ink} />,
      onPress: onHow,
    },
    {
      key: 'rx',
      tone: colors.mint,
      title: 'عندك روشتة؟ صوّرها',
      titleColor: colors.ink,
      body: 'والصيدلية تكلمك بالسعر قبل ما تبعت أي حاجة',
      bodyColor: colors.body,
      art: pills ? <ProductPhoto product={pills} rounded={40} style={styles.artSingle} /> : <BannerIcon name="camera" tone={colors.white} color={colors.ink} />,
      onPress: () => router.push('/category/pharm'),
    },
  ];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 10}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.bannerRail}
        onScroll={(e) => setPage(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / (cardWidth + 10)))}
        scrollEventThrottle={32}>
        {banners.map((b) => (
          <Pressable
            key={b.key}
            accessibilityRole="button"
            accessibilityLabel={b.title}
            onPress={b.onPress}
            style={({ pressed }) => [styles.banner, { width: cardWidth, backgroundColor: b.tone }, pressed && ui.pressed]}>
            <View style={styles.bannerText}>
              <Txt display weight={700} size={18} color={b.titleColor}>
                {b.title}
              </Txt>
              <Txt size={14} color={b.bodyColor}>
                {b.body}
              </Txt>
            </View>
            {b.art}
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((b, i) => (
          <View key={b.key} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

function BannerIcon({ name, tone, color }: { name: IconName; tone: string; color: string }) {
  return (
    <View style={[styles.artSingle, styles.artIcon, { backgroundColor: tone }]}>
      <Icon name={name} size={44} color={color} strokeWidth={1.8} />
    </View>
  );
}

/** A row of items from nearby open shops, added straight from the home screen. */
export function ProductRail({ products, stores }: { products: Product[]; stores: Store[] }) {
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const toast = useToast((s) => s.show);
  const byId = new Map(stores.map((s) => [s.id, s]));

  // Items with photos, taking turns between kinds of shop so the row isn't all one aisle.
  const queues = new Map<string, { product: Product; store: Store }[]>();
  for (const store of stores) {
    if (!storeOpen(store)) continue;
    const q = queues.get(store.categoryId) ?? [];
    const seen = new Set(q.map((x) => x.product.image));
    for (const product of products) {
      if (product.storeId === store.id && product.image && !seen.has(product.image)) {
        q.push({ product, store });
        seen.add(product.image);
      }
    }
    queues.set(store.categoryId, q);
  }
  const picks: { product: Product; store: Store }[] = [];
  for (let round = 0; picks.length < 12 && round < 6; round++) {
    for (const q of queues.values()) if (q[round] && picks.length < 12) picks.push(q[round]);
  }
  if (!picks.length) return null;

  const onAdd = (product: Product) => {
    const store = byId.get(product.storeId);
    if (!store) return;
    const result = add(product, store);
    if (result === 'store-limit') toast(`المندوب بيجيب من ${storesWord(MAX_STORES)} بس في المشوار. ابعت اللي في السلة الأول`);
    if (result === 'new-store') {
      toast(`${store.name} هيجي مع نفس المندوب · التوصيل بقى ${money(tripFee(groupCart(useCart.getState().lines).map((g) => g.store)).total)}`);
    }
  };
  const onRemove = (product: Product) => {
    const removed = remove(product.id);
    if (removed) toast(`اتشال ${product.name} من السلة`, { label: 'رجّعه', onPress: () => restore(removed) });
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {picks.map(({ product, store }) => (
        <View key={product.id} style={styles.productCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${product.name} من ${store.name}`}
            onPress={() => router.push(`/store/${store.id}`)}
            style={({ pressed }) => [styles.productInner, pressed && ui.pressed]}>
            <ProductPhoto product={product} style={styles.productPhoto} textLift={44} />
            <Txt weight={700} size={16}>
              {money(product.price)}
            </Txt>
            <Txt size={14} weight={500} numberOfLines={1}>
              {product.name}
            </Txt>
            <Txt size={13} color={colors.muted} numberOfLines={1}>
              {store.name}
            </Txt>
          </Pressable>
          <AddOnPhoto
            qty={lines[product.id]?.qty ?? 0}
            label={product.name}
            onAdd={() => onAdd(product)}
            onRemove={() => onRemove(product)}
            style={styles.onPhoto}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '30%', flexGrow: 1, paddingTop: 12, paddingBottom: 10, paddingHorizontal: 6, gap: 6, alignItems: 'center', borderRadius: radius.lg },
  tilePhoto: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.75)' },
  tileIcon: { borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  bannerRail: { gap: 10 },
  banner: { minHeight: 140, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: radius.xl, overflow: 'hidden' },
  bannerText: { flex: 1, minWidth: 0, gap: 6 },
  artRow: { flexDirection: 'row', alignItems: 'center' },
  artPhoto: { width: 52, height: 52, marginHorizontal: -8, borderWidth: 2, borderColor: colors.white },
  artMiddle: { zIndex: 2, width: 62, height: 62 },
  artSingle: { width: 80, height: 80 },
  artIcon: { borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 20, backgroundColor: colors.accent },
  rail: { gap: 10, paddingBottom: 4 },
  productCard: { width: 150, padding: 8, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  productInner: { gap: 2 },
  productPhoto: { width: '100%', height: 128, marginBottom: 6 },
  onPhoto: { position: 'absolute', top: 86, end: 14 },
});
