import { router } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import type { Store } from '@/data/types';
import { baseFee, guaranteeMinutes, money, storeOpen } from '@/lib/pricing';
import { colors, elevation, radius } from '@/theme';

import { Star } from './icon';
import { HeartButton } from './favorite';
import { StoreCover, StoreThumb } from './photo';
import { Txt } from './txt';
import { Badge, GuaranteeChip, styles as ui } from './ui';

const openStore = (id: string) => router.push(`/store/${id}`);

export function StoreMark({ store, size, style }: { store: Store; size: number; style?: ViewStyle }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: store.tint }, style]}>
      <Txt display weight={700} size={size * 0.4}>
        {store.mark}
      </Txt>
    </View>
  );
}

function distanceText(store: Store) {
  return store.distanceKm == null ? null : `${store.distanceKm} كم`;
}

/** Full-width card used in every store list. */
export function StoreRow({ store, linked = false, showCategory = true }: { store: Store; linked?: boolean; showCategory?: boolean }) {
  const distance = distanceText(store);
  const open = storeOpen(store);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={store.name}
      onPress={() => openStore(store.id)}
      style={({ pressed }) => [styles.row, linked && styles.rowLinked, !open && styles.rowClosed, pressed && ui.pressed]}>
      <StoreThumb store={store} size={76} />
      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <Txt weight={600} size={16} numberOfLines={1} style={styles.name}>
            {store.name}
          </Txt>
          {linked ? <Badge label="محلك" tone={colors.mintSoft} color={colors.ink} /> : null}
          {open ? null : <Badge label={store.isOpen ? 'مشغول دلوقتي' : 'مقفول'} tone={colors.warningSoft} color={colors.warning} />}
        </View>
        <Txt size={14} color={colors.muted} numberOfLines={1}>
          {showCategory ? `${store.categoryName} · ` : ''}
          {store.area}
          {distance ? ` · ${distance}` : ''}
        </Txt>
        <View style={styles.meta}>
          <GuaranteeChip minutes={guaranteeMinutes([store])} />
          <View style={styles.inline}>
            <Star size={14} />
            <Txt size={14} weight={500} color={colors.body}>
              {store.rating.toFixed(1)}{store.ratingCount ? ` (${store.ratingCount})` : ''}
            </Txt>
          </View>
          <Txt size={14} weight={500} color={colors.body}>
            توصيل {money(baseFee(store.distanceKm))}
          </Txt>
        </View>
        {store.isPharmacy ? (
          <Txt size={13} weight={600} color={colors.accent}>
            بتقبل صورة الروشتة
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Big card with the cover photo on top and the logo over its edge, for the home screen. */
export function StoreCard({ store, linked = false }: { store: Store; linked?: boolean }) {
  const open = storeOpen(store);
  const distance = distanceText(store);
  return (
    <View style={[styles.card, !open && styles.rowClosed]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={store.name}
        onPress={() => openStore(store.id)}
        style={({ pressed }) => pressed && ui.pressed}>
        <StoreCover store={store} height={136} />
        {open ? null : (
          <View style={styles.closedTag}>
            <Badge label={store.isOpen ? 'مشغول دلوقتي' : 'مقفول'} tone={colors.warningSoft} color={colors.warning} />
          </View>
        )}
        <View style={styles.cardBody}>
          <StoreMark store={store} size={52} style={styles.logo} />
          <View style={styles.rowBody}>
            <View style={styles.nameRow}>
              <Txt weight={700} size={17} numberOfLines={1} style={styles.name}>
                {store.name}
              </Txt>
              {linked ? <Badge label="محلك" tone={colors.mintSoft} color={colors.ink} /> : null}
            </View>
            <Txt size={14} color={colors.muted} numberOfLines={1}>
              {store.categoryName} · {store.area}
              {distance ? ` · ${distance}` : ''}
            </Txt>
          </View>
        </View>
        <View style={[styles.meta, styles.cardMeta]}>
          <GuaranteeChip minutes={guaranteeMinutes([store])} />
          <View style={styles.inline}>
            <Star size={14} />
            <Txt size={14} weight={500} color={colors.body}>
              {store.rating.toFixed(1)}{store.ratingCount ? ` (${store.ratingCount})` : ''}
            </Txt>
          </View>
          <Txt size={14} weight={500} color={colors.body}>
            توصيل {money(baseFee(store.distanceKm))}
          </Txt>
        </View>
      </Pressable>
      <HeartButton storeId={store.id} storeName={store.name} style={styles.heart} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...elevation.card,
  },
  rowClosed: { opacity: 0.6 },
  rowLinked: { borderWidth: 1.5, borderColor: colors.mint },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: { marginBottom: 14, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card, ...elevation.card },
  closedTag: { position: 'absolute', top: 10, start: 10 },
  heart: { position: 'absolute', top: 10, end: 10 },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingTop: 8 },
  logo: { marginTop: -32, borderWidth: 3, borderColor: colors.card },
  cardMeta: { paddingHorizontal: 12, paddingBottom: 12, marginTop: 6 },
});
