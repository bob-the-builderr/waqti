import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { Txt } from '@/components/txt';
import { Card, ErrorState, Loading, PrimaryButton, SecondaryButton } from '@/components/ui';
import { friendlyError, hideProduct, reviewPhoto } from '@/data/api';
import { refreshAll, useOverview } from '@/data/queries';
import { money } from '@/lib/format';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

/**
 * «الصور والمنتجات»: photos customers sent for items with none (yes = it shows in
 * every shop selling the item), and items shops added themselves.
 */
export default function ReviewScreen() {
  const overview = useOverview();
  const toast = useToast((s) => s.show);
  const photo = useMutation({
    mutationFn: ({ id, ok }: { id: string; ok: boolean }) => reviewPhoto(id, ok),
    onSuccess: (_d, { ok }) => {
      refreshAll();
      toast(ok ? 'الصورة بقت ظاهرة في كل المحلات' : 'اترفضت');
    },
    onError: (e) => toast(friendlyError(e)),
  });
  const hide = useMutation({
    mutationFn: (id: string) => hideProduct(id),
    onSuccess: () => {
      refreshAll();
      toast('المنتج اتشال من المحل');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState message={friendlyError(overview.error)} onRetry={() => overview.refetch()} />;
  const { photos, shopProducts } = overview.data;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <Txt display weight={700} size={19}>
          صور من العملاء · {photos.length}
        </Txt>
        {photos.length === 0 ? (
          <Txt size={15} color={colors.body}>
            مفيش صور مستنية.
          </Txt>
        ) : null}
        <View style={styles.grid}>
          {photos.map((p) => (
            <Card key={p.id} style={styles.photoCard}>
              <Image source={p.photo} contentFit="cover" style={styles.photo} />
              <Txt weight={700} size={16}>
                {p.product}
              </Txt>
              <Txt size={14} color={colors.body}>
                من {p.store}
              </Txt>
              <View style={styles.actions}>
                <View style={styles.flex}>
                  <PrimaryButton label="وافق" onPress={() => photo.mutate({ id: p.id, ok: true })} />
                </View>
                <View style={styles.flex}>
                  <SecondaryButton label="ارفض" tone={colors.danger} onPress={() => photo.mutate({ id: p.id, ok: false })} />
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Txt display weight={700} size={19} style={styles.section}>
          منتجات ضافتها المحلات · {shopProducts.length}
        </Txt>
        <Txt size={14} color={colors.body}>
          ظاهرة للعملاء على طول. لو فيه حاجة غلط أو مش مسموح بيها، شيلها.
        </Txt>
        <View style={styles.grid}>
          {shopProducts.map((p) => (
            <Card key={p.id} style={styles.productCard}>
              <View style={styles.row}>
                <ItemPhoto image={p.photo} name={p.name} size={64} />
                <View style={styles.flex}>
                  <Txt weight={700} size={16}>
                    {p.name}
                  </Txt>
                  <Txt size={14} color={colors.body}>
                    {p.store} · {p.size || '—'} · {money(p.price)}
                    {p.section ? ` · ${p.section}` : ''}
                  </Txt>
                </View>
              </View>
              <SecondaryButton label="شيله من المحل" tone={colors.danger} onPress={() => hide.mutate(p.id)} />
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  page: { width: '100%', maxWidth: 1100, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  section: { marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: { flexBasis: 260, flexGrow: 1, maxWidth: 360, gap: 6 },
  photo: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.field },
  productCard: { flexBasis: 320, flexGrow: 1, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
