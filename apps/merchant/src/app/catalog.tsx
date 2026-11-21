import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ItemPhoto } from '@/components/item-photo';
import { ProductListSkeleton } from '@/components/skeleton';
import { Txt, useInputSize } from '@/components/txt';
import { Chip, ErrorState, PrimaryButton, ScreenHeader, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { friendlyError, stockItem, type CatalogItem } from '@/data/api';
import { keys, queryClient, useCatalog } from '@/data/queries';
import { money } from '@/lib/format';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

/**
 * «من الكتالوج»: everything shops of this kind sell, with photo and size ready.
 * The shop taps «ضيف», sets its own price, and the item is on its shelf.
 */
export default function CatalogScreen() {
  const catalog = useCatalog();
  const toast = useToast((s) => s.show);
  const [query, setQuery] = useState('');
  const [aisle, setAisle] = useState<string | null>(null);
  const [picked, setPicked] = useState<CatalogItem | null>(null);
  const [price, setPrice] = useState('');
  const inputSize = useInputSize(16);
  const priceSize = useInputSize(24);

  const stock = useMutation({
    mutationFn: ({ item, value }: { item: CatalogItem; value: number }) => stockItem(item.id, value),
    onSuccess: (_d, { item, value }) => {
      toast(`${item.name} بقى عندك بـ${money(value)}`);
      queryClient.invalidateQueries({ queryKey: keys.catalog });
      queryClient.invalidateQueries({ queryKey: keys.products });
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const save = () => {
    const value = Number(latinDigits(price).replace(/[^\d]/g, ''));
    if (!picked || !value) return toast('اكتب السعر بالأرقام');
    stock.mutate({ item: picked, value });
    setPicked(null);
  };

  const items = catalog.data ?? [];
  const aisles = [...new Set(items.map((c) => c.section))];
  const q = query.trim();
  const shown = items.filter((c) => (!aisle || c.section === aisle) && (!q || `${c.name} ${c.brand} ${c.size}`.includes(q)));
  const onShelf = items.filter((c) => c.stocked).length;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="ضيف من الكتالوج" />
      {catalog.isPending ? (
        <View style={styles.content}>
          <ProductListSkeleton rows={6} />
        </View>
      ) : catalog.isError ? (
        <ErrorState message={friendlyError(catalog.error)} onRetry={() => catalog.refetch()} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Txt size={16} color={colors.body} align="center">
            مفيش كتالوج جاهز لنوع محلك لسه. ضيف منتجاتك بنفسك من «منتج جديد».
          </Txt>
          <PrimaryButton label="+ منتج جديد" onPress={() => router.replace('/new-product')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Txt size={15} color={colors.body}>
            {items.length} منتج بصورهم وأحجامهم. عندك منهم {onShelf}. دوس «ضيف» وحط سعرك.
          </Txt>
          <View style={styles.search}>
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel="دوّر في الكتالوج"
              placeholder="دوّر: جهينة، زيت، شاي…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { fontSize: inputSize }]}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="الكل" selected={!aisle} onPress={() => setAisle(null)} />
            {aisles.map((a) => (
              <Chip key={a} label={a} selected={aisle === a} onPress={() => setAisle(a)} />
            ))}
          </ScrollView>

          {shown.map((c) => (
            <View key={c.id} style={styles.row}>
              <ItemPhoto image={c.image} brand={c.brand} name={c.name} size={60} />
              <View style={styles.flex}>
                <Txt weight={600} size={16} numberOfLines={2}>
                  {c.name}
                </Txt>
                <Txt size={14} color={colors.muted}>
                  {c.size}
                  {c.size ? ' · ' : ''}السعر المعتاد {money(c.refPrice)}
                </Txt>
              </View>
              {c.stocked ? (
                <View style={styles.have}>
                  <Icon name="check" size={18} color={colors.success} strokeWidth={2.4} />
                  <Txt size={14} weight={600} color={colors.success}>
                    عندك
                  </Txt>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`ضيف ${c.name}`}
                  onPress={() => {
                    setPicked(c);
                    setPrice(String(c.refPrice));
                  }}
                  style={({ pressed }) => [styles.add, pressed && ui.pressed]}>
                  <Txt weight={600} size={15} color={colors.white}>
                    ضيف
                  </Txt>
                </Pressable>
              )}
            </View>
          ))}
          {shown.length === 0 ? (
            <Txt size={15} color={colors.muted} align="center" style={styles.none}>
              مش لاقيه؟ ضيفه بنفسك من «منتج جديد».
            </Txt>
          ) : null}
          <SecondaryButton label="+ منتج مش في الكتالوج" onPress={() => router.replace('/new-product')} />
        </ScrollView>
      )}

      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={picked?.name ?? ''}>
        <Txt size={15} color={colors.body}>
          حط نفس سعر الرف عندك. السعر المعتاد {money(picked?.refPrice ?? 0)}، وتقدر تغيّره بعدين من «الأصناف».
        </Txt>
        <TextInput
          accessibilityLabel="السعر بالجنيه"
          keyboardType="number-pad"
          value={price}
          onChangeText={setPrice}
          onSubmitEditing={save}
          style={[styles.priceInput, { fontSize: priceSize }]}
        />
        <PrimaryButton label="ضيفه للمحل" onPress={save} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  empty: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  search: {
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
  input: { flex: 1, minWidth: 0, height: 46, fontFamily: fonts.body400, color: colors.ink, textAlign: 'right' },
  chips: { gap: 8, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: colors.card },
  add: { height: 44, paddingHorizontal: 18, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  have: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  none: { marginVertical: 16 },
  priceInput: {
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.display700,
    color: colors.ink,
  },
});
