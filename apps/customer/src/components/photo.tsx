import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAllProducts } from '@/data/queries';
import type { Product, Store } from '@/data/types';
import { colors, elevation, fonts, radius } from '@/theme';

import { Icon } from './icon';
import { Txt } from './txt';

/** Catalog packshots (transparent PNGs) sit inside the frame; dish photos fill it. */
export const isPackshot = (url: string) => url.includes('/ingredients/') || url.toLowerCase().endsWith('.png');

/** Deep, readable brand colours; a brand always gets the same one. */
const BRAND_COLORS = ['#1F5FAD', '#C8102E', '#0E7A4F', '#6B2FB3', '#D35400', '#0B6E8C', '#A6192E', '#2D4A9E', '#7A4B00', '#00796B'];
function brandColor(brand: string) {
  let h = 0;
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0;
  return BRAND_COLORS[h % BRAND_COLORS.length];
}

/**
 * Until a product has its real photo (from the brand, our shoot or a customer),
 * it shows a clean card: the brand's name on its colour, or the item's own name.
 * Never a wrong photo.
 */
function NamedCard({ product, lift = 8 }: { product: Pick<Product, 'name' | 'brand'>; lift?: number }) {
  const [width, setWidth] = useState(0);
  const brand = product.brand?.trim();
  const title = brand || product.name;
  // Text scales with the frame: a 64px thumb and a 220px sheet both read well.
  const size = Math.max(8, Math.min(34, (width - 16) / (Math.max(title.length, 4) * 0.75)));
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.named, { paddingBottom: lift, backgroundColor: brand ? brandColor(brand) : colors.photo }]}>
      {width ? (
        <>
          {/* Decorative on small thumbs (the name is written next to it): may go below the 13px floor. */}
          <Text accessible={false} numberOfLines={2} style={[styles.label, { fontSize: size, color: brand ? colors.white : colors.body }]}>
            {title}
          </Text>
          {brand && width > 90 ? (
            <Txt size={Math.max(11, size * 0.45)} color="rgba(255,255,255,0.85)" align="center" numberOfLines={2}>
              {product.name.replace(brand, '').replace(/\s+/g, ' ').trim()}
            </Txt>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/** A product's catalog photo, or its brand / name card until the catalog has one. */
export function ProductPhoto({
  product,
  style,
  rounded = radius.md,
  textLift,
}: {
  product: Pick<Product, 'image' | 'name'> & { brand?: string | null };
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  /** Room kept under the name card's text, for a «+» sitting on the photo. */
  textLift?: number;
}) {
  const url = product.image ?? null;
  return (
    <View style={[styles.frame, { borderRadius: rounded }, style]}>
      {url ? (
        <Image
          source={url}
          accessibilityLabel={product.name}
          contentFit={isPackshot(url) ? 'contain' : 'cover'}
          transition={150}
          recyclingKey={url}
          style={isPackshot(url) ? styles.pack : StyleSheet.absoluteFill}
        />
      ) : (
        <NamedCard product={product} lift={textLift} />
      )}
    </View>
  );
}

/** Products of one store that have a photo, packshots first (they make the cleanest covers). */
function useStoreShots(storeId: string) {
  const all = useAllProducts();
  const seen = new Set<string>();
  const shots = (all.data ?? [])
    .filter((p) => p.storeId === storeId && p.image && !seen.has(p.image) && seen.add(p.image))
    .sort((a, b) => Number(isPackshot(b.image as string)) - Number(isPackshot(a.image as string)));
  // Start at a different place for each shop, so two supermarkets don't wear the same cover.
  let h = 0;
  for (let i = 0; i < storeId.length; i++) h = (h * 31 + storeId.charCodeAt(i)) >>> 0;
  const start = shots.length ? h % shots.length : 0;
  return [...shots.slice(start), ...shots.slice(0, start)];
}

/**
 * A store's cover: its photo for restaurants and sweet shops; for other shops,
 * a few of their own products on the shop's colour, so no shop needs a photographer.
 */
export function StoreCover({ store, height, style }: { store: Store; height: number; style?: StyleProp<ViewStyle> }) {
  const shots = useStoreShots(store.id).slice(0, 3);
  if (store.cover) {
    return (
      <View style={[styles.cover, { height }, style]}>
        <Image source={store.cover} contentFit="cover" transition={150} recyclingKey={store.cover} style={StyleSheet.absoluteFill} />
      </View>
    );
  }
  const size = Math.round(height * 0.7);
  return (
    <View style={[styles.cover, styles.composed, { height, backgroundColor: store.tint }, style]}>
      {shots.length ? (
        shots.map((p, i) => (
          <Image
            key={p.id}
            source={p.image as string}
            contentFit="contain"
            style={[
              { width: size, height: size, marginHorizontal: -size * 0.12 },
              i === 1 ? styles.middle : styles.side,
            ]}
          />
        ))
      ) : (
        <Txt display weight={700} size={height * 0.4} color={colors.ink}>
          {store.mark}
        </Txt>
      )}
    </View>
  );
}

/** Small square cover for store rows. */
export function StoreThumb({ store, size }: { store: Store; size: number }) {
  return <StoreCover store={store} height={size} style={{ width: size, borderRadius: size * 0.22 }} />;
}

/**
 * The add control that sits on a product photo, like the big apps: a round «+»;
 * once in the cart it opens into «− 2 +». The «+» never moves, so tapping the same
 * spot again always adds one more; «−» (a bin at one piece) appears beside it.
 */
export function AddOnPhoto({
  qty,
  label,
  onAdd,
  onRemove,
  style,
}: {
  qty: number;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.addWrap, qty > 0 && styles.addOpen, style]}>
      {qty > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={qty === 1 ? `شيل ${label}` : `قلّل ${label}`}
            hitSlop={4}
            onPress={onRemove}
            style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
            <Icon name={qty === 1 ? 'trash' : 'minus'} size={20} color={qty === 1 ? colors.danger : colors.ink} strokeWidth={2.2} />
          </Pressable>
          <Txt weight={700} size={17} style={styles.qty}>
            {qty}
          </Txt>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={qty === 0 ? `أضف ${label}` : `زوّد ${label}، في السلة ${qty}`}
        hitSlop={4}
        onPress={onAdd}
        style={({ pressed }) => [styles.round, styles.plus, pressed && styles.pressed]}>
        <Icon name="plus" size={22} color={colors.white} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.photo },
  pack: { position: 'absolute', top: '9%', bottom: '9%', left: '9%', right: '9%' },
  label: { fontFamily: fonts.display700, textAlign: 'center' },
  named: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 8 },
  cover: { overflow: 'hidden', backgroundColor: colors.photo },
  composed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  middle: { zIndex: 2, transform: [{ translateY: -4 }, { scale: 1.08 }] },
  side: { zIndex: 1, transform: [{ translateY: 6 }] },
  addWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill },
  addOpen: { backgroundColor: colors.card, ...elevation.raised },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  plus: { backgroundColor: colors.accent, ...elevation.raised },
  qty: { minWidth: 26, textAlign: 'center' },
  pressed: { opacity: 0.8 },
});
