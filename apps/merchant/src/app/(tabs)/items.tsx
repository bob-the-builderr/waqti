import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ItemPhoto } from '@/components/item-photo';
import { ShopHeader } from '@/components/shop-header';
import { ProductListSkeleton } from '@/components/skeleton';
import { Txt, useInputSize } from '@/components/txt';
import { ErrorState, PrimaryButton, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { friendlyError, updateProduct, type MerchantProduct } from '@/data/api';
import { keys, queryClient, useProducts } from '@/data/queries';
import { kindsWord, money } from '@/lib/format';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

/** «الأصناف»: switch items on and off, fix prices, and add more from the catalog or by hand. */
export default function ItemsScreen() {
  const products = useProducts();
  const toast = useToast((s) => s.show);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MerchantProduct | null>(null);
  const [price, setPrice] = useState('');
  const inputSize = useInputSize(16);
  const priceSize = useInputSize(24);

  const save = useMutation({
    mutationFn: ({ id, newPrice, available }: { id: string; newPrice: number | null; available: boolean | null }) =>
      updateProduct(id, newPrice, available),
    // Show the change at once; the server answer confirms or rolls back.
    onMutate: async ({ id, newPrice, available }) => {
      await queryClient.cancelQueries({ queryKey: keys.products });
      const before = queryClient.getQueryData<MerchantProduct[]>(keys.products);
      queryClient.setQueryData<MerchantProduct[]>(keys.products, (list) =>
        list?.map((p) => (p.id === id ? { ...p, price: newPrice ?? p.price, isAvailable: available ?? p.isAvailable } : p)),
      );
      return { before };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.before) queryClient.setQueryData(keys.products, ctx.before);
      toast(friendlyError(e));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.products }),
  });

  const list = (products.data ?? []).filter((p) => !query.trim() || `${p.name} ${p.note}`.includes(query.trim()));
  const off = (products.data ?? []).filter((p) => !p.isAvailable).length;

  const savePrice = () => {
    const value = Number(latinDigits(price).replace(/[^\d]/g, ''));
    if (!editing || !value) return toast('اكتب السعر بالأرقام');
    save.mutate({ id: editing.id, newPrice: value, available: null });
    toast(`سعر ${editing.name} بقى ${money(value)}`);
    setEditing(null);
  };

  return (
    <View style={styles.screen}>
      <ShopHeader title="الأصناف" />
      {products.isPending ? (
        <View style={styles.content}>
          <ProductListSkeleton rows={6} />
        </View>
      ) : products.isError ? (
        <ErrorState message={friendlyError(products.error)} onRetry={() => products.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.addRow}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/catalog')} style={({ pressed }) => [styles.addButton, styles.addMain, pressed && ui.pressed]}>
              <Icon name="plus" size={20} color={colors.white} strokeWidth={2.4} />
              <Txt size={15} weight={600} color={colors.white}>
                من الكتالوج
              </Txt>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/new-product')} style={({ pressed }) => [styles.addButton, pressed && ui.pressed]}>
              <Icon name="camera" size={20} color={colors.accent} />
              <Txt size={15} weight={600} color={colors.accent}>
                منتج جديد
              </Txt>
            </Pressable>
          </View>
          <View style={styles.search}>
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel="دوّر على صنف"
              placeholder="دوّر على صنف"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { fontSize: inputSize }]}
            />
          </View>
          <Txt size={15} color={colors.body} style={styles.summary}>
            {kindsWord(products.data.length)}{off ? ` · ${off} مقفولين دلوقتي` : ''}. دوس على السعر عشان تغيّره.
          </Txt>

          {list.map((p) => (
            <View key={p.id} style={[styles.row, !p.isAvailable && styles.rowOff]}>
              <ItemPhoto image={p.image} brand={p.brand} name={p.name} size={56} />
              <View style={styles.flex}>
                <Txt weight={600} size={17}>
                  {p.name}
                </Txt>
                {p.note ? (
                  <Txt size={14} color={colors.muted}>
                    {p.note}
                  </Txt>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`غيّر سعر ${p.name}`}
                  hitSlop={6}
                  onPress={() => {
                    setEditing(p);
                    setPrice(String(p.price));
                  }}
                  style={({ pressed }) => [styles.price, pressed && ui.pressed]}>
                  <Txt weight={700} size={17} color={colors.accent}>
                    {money(p.price)}
                  </Txt>
                  <Icon name="forward" size={16} color={colors.accent} />
                </Pressable>
              </View>
              <View style={styles.toggle}>
                <Txt size={14} weight={600} color={p.isAvailable ? colors.success : colors.muted}>
                  {p.isAvailable ? 'موجود' : 'خلصان'}
                </Txt>
                <Switch
                  accessibilityLabel={`${p.name} موجود`}
                  value={p.isAvailable}
                  onValueChange={(v) => save.mutate({ id: p.id, newPrice: null, available: v })}
                  trackColor={{ true: colors.success, false: colors.radioOff }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={`سعر ${editing?.name ?? ''}`}>
        <Txt size={15} color={colors.body}>
          نفس سعر الرف في المحل. الزبون هيشوف السعر الجديد على طول.
        </Txt>
        <TextInput
          accessibilityLabel="السعر الجديد بالجنيه"
          keyboardType="number-pad"
          value={price}
          onChangeText={setPrice}
          onSubmitEditing={savePrice}
          style={[styles.priceInput, { fontSize: priceSize }]}
        />
        <View style={styles.sheetActions}>
          <PrimaryButton label="احفظ السعر" onPress={savePrice} />
          <SecondaryButton label="رجوع" onPress={() => setEditing(null)} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  addMain: { backgroundColor: colors.accent },
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32 },
  search: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  input: { flex: 1, minWidth: 0, height: 48, fontFamily: fonts.body400, color: colors.ink },
  summary: { marginTop: 10, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowOff: { opacity: 0.6 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 4, minHeight: 32 },
  toggle: { alignItems: 'center', gap: 4 },
  priceInput: {
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
    fontFamily: fonts.body600,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  sheetActions: { gap: 10 },
});
