import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CART_PILL_SPACE, CartPill } from '@/components/cart-pill';
import { Icon, type IconName } from '@/components/icon';
import { CategoryTiles, ProductRail, PromoBanners } from '@/components/home-parts';
import { StoreThumb } from '@/components/photo';
import { StoreCard, StoreMark } from '@/components/store-tiles';
import { WawLogo } from '@/components/brand';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { ErrorState, PrimaryButton, Sheet, styles as ui } from '@/components/ui';
import { linkedFirst, useAllProducts, useCategories, useFavorites, useLinkedStoreIds, useMyOrders, useStores } from '@/data/queries';
import { useReorder } from '@/data/reorder';
import type { OrderStatus } from '@/data/types';
import { EXTRA_STORE_FEE, MAX_DELIVERY, money, promisedArrival } from '@/lib/pricing';
import { usePromises } from '@/state/promises';
import { useAddress } from '@/state/address';
import { useSettings } from '@/state/settings';
import { colors, elevation, radius } from '@/theme';

const liveLabel: Partial<Record<OrderStatus, string>> = {
  placed: 'مستنيين المحل يأكّد',
  preparing: 'المحل بيجهّز طلبك',
  picked_up: 'المندوب استلم طلبك',
  on_the_way: 'المندوب في الطريق ليك',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const stores = useStores();
  const categories = useCategories();
  const products = useAllProducts();
  const linkedIds = useLinkedStoreIds();
  const favorites = useFavorites();
  const [howOpen, setHowOpen] = useState(false);
  const address = useAddress((s) => s.current);
  const askedText = useSettings((s) => s.askedText);
  const setBigText = useSettings((s) => s.setBigText);
  const setAskedText = useSettings((s) => s.setAskedText);
  const orders = useMyOrders();
  const quotes = usePromises((s) => s.byOrder);
  const reorder = useReorder();
  // The order on its way now, else the last one that arrived (for one-tap «اطلب تاني»).
  const active = orders.data?.find((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const last = orders.data?.find((o) => o.status === 'delivered');

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <WawLogo size={40} />
          <Txt display weight={700} size={26} color={colors.onAccent}>
            وقتي
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="عنوان التوصيل"
          onPress={() => router.push('/address')}
          style={({ pressed }) => [styles.address, pressed && ui.pressed]}>
          <View style={styles.flex}>
            <Txt size={13} color={colors.onAccentSoft} align="left">
              التوصيل لـ
            </Txt>
            <Txt weight={600} size={15} numberOfLines={1} color={colors.onAccent} align="left">
              {address.label} · {address.areaName}
            </Txt>
          </View>
          <Icon name="chevronDown" size={20} color={colors.onAccent} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="دوّر على محل أو حاجة"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [styles.search, pressed && ui.pressed]}>
        <Icon name="search" size={22} color={colors.muted} />
        <Txt size={15} color={colors.muted} numberOfLines={1}>
          دوّر على محل أو حاجة… عيش، رز، كشري
        </Txt>
      </Pressable>
    </View>
  );

  if (stores.isPending || categories.isPending) {
    return (
      <View style={styles.screen}>
        {header}
        <StoreListSkeleton rows={5} />
      </View>
    );
  }

  if (stores.isError || categories.isError) {
    return (
      <View style={styles.screen}>
        {header}
        <ErrorState
          message="مقدرناش نجيب المحلات"
          onRetry={() => {
            stores.refetch();
            categories.refetch();
          }}
        />
      </View>
    );
  }

  const linked = stores.data.filter((s) => linkedIds.data?.includes(s.id));
  const hearted = stores.data.filter((s) => favorites.data?.includes(s.id));
  const nearby = linkedFirst(stores.data, linkedIds.data).slice(0, 8);

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {askedText ? null : (
          // One slim line instead of a big card: it still asks, without taking over the top of the screen.
          <View style={styles.textAsk}>
            <Icon name="text" size={22} color={colors.accent} />
            <Txt weight={600} size={15} style={styles.flex}>
              الكلام صغير عليك؟
            </Txt>
            <Pressable accessibilityRole="button" onPress={() => setBigText(true)} style={({ pressed }) => [styles.textAskYes, pressed && ui.pressed]}>
              <Txt weight={600} size={14} color={colors.onAccent}>
                كبّره
              </Txt>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="كده كويس" hitSlop={8} onPress={setAskedText} style={({ pressed }) => [styles.textAskNo, pressed && ui.pressed]}>
              <Icon name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
        )}
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`طلبك رقم ${active.number}`}
            onPress={() => router.push(`/order/${active.id}`)}
            style={({ pressed }) => [styles.live, pressed && ui.pressed]}>
            <View style={styles.liveIcon}>
              <Icon name="moto" size={26} color={colors.onAccent} />
            </View>
            <View style={styles.flex}>
              <Txt weight={600} size={16} color={colors.onAccent}>
                {liveLabel[active.status] ?? 'طلبك ماشي'} · رقم {active.number}
              </Txt>
              <Txt size={14} color={colors.onAccentSoft}>
                وعد وقتي: قبل الساعة {promisedArrival(quotes[active.id], active.guaranteedMinutes, active.placedAt)}
              </Txt>
            </View>
            <Icon name="forward" size={20} color={colors.onAccent} />
          </Pressable>
        ) : null}

        {!active && last && last.rated === false ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="قيّم طلبك"
            onPress={() => router.push(`/order/${last.id}`)}
            style={({ pressed }) => [styles.rate, pressed && ui.pressed]}>
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                إزاي كان طلبك من {last.storeNames.join(' + ') || 'المندوب'}؟
              </Txt>
              <Txt size={14} color={colors.body}>
                قيّمه في ثانية، وكلامك بيوصل للمحل
              </Txt>
            </View>
            <Icon name="forward" size={20} color={colors.accent} />
          </Pressable>
        ) : null}

        {!active && last && last.storeNames.length ? (
          <View style={styles.again}>
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                اطلب تاني
              </Txt>
              <Txt size={14} color={colors.muted} numberOfLines={1}>
                {last.storeNames.join(' + ')} · {money(last.total)}
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="اطلب نفس الطلب تاني"
              disabled={reorder.isPending}
              onPress={() => reorder.mutate(last.id)}
              style={({ pressed }) => [styles.againButton, pressed && ui.pressed]}>
              <Icon name="repeat" size={18} color={colors.onAccent} strokeWidth={2} />
              <Txt weight={600} size={15} color={colors.onAccent}>
                {reorder.isPending ? 'لحظة…' : 'نفس الطلب'}
              </Txt>
            </Pressable>
          </View>
        ) : null}

        <CategoryTiles categories={categories.data} products={products.data ?? []} stores={stores.data} />

        <View style={styles.banners}>
          <PromoBanners products={products.data ?? []} stores={stores.data} onHow={() => setHowOpen(true)} />
        </View>

        {hearted.length ? (
          <>
            <View style={styles.sectionHead}>
              <Txt display weight={600} size={18}>
                مفضلتك
              </Txt>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {hearted.map((store) => (
                <Pressable
                  key={store.id}
                  accessibilityRole="button"
                  accessibilityLabel={store.name}
                  onPress={() => router.push(`/store/${store.id}`)}
                  style={({ pressed }) => [styles.favCard, pressed && ui.pressed]}>
                  <StoreThumb store={store} size={84} />
                  <Txt size={14} weight={600} align="center" numberOfLines={2}>
                    {store.name}
                  </Txt>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <Txt display weight={600} size={18}>
            محلاتك
          </Txt>
          {linked.length ? (
            <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push('/link-store')}>
              <Txt size={15} weight={600} color={colors.accent}>
                + ضيف محل
              </Txt>
            </Pressable>
          ) : null}
        </View>
        {linked.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {linked.map((store) => (
              <Pressable
                key={store.id}
                accessibilityRole="button"
                accessibilityLabel={store.name}
                onPress={() => router.push(`/store/${store.id}`)}
                style={({ pressed }) => [styles.linkedCard, pressed && ui.pressed]}>
                <StoreMark store={store} size={52} />
                <Txt size={14} weight={600} align="center" numberOfLines={2}>
                  {store.name}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/link-store')}
            style={({ pressed }) => [styles.addShop, pressed && ui.pressed]}>
            <View style={styles.addShopIcon}>
              <Icon name="qr" size={26} color={colors.accent} strokeWidth={1.8} />
            </View>
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                عندك محل بتتعامل معاه؟
              </Txt>
              <Txt size={14} color={colors.body}>
                ضيف الكود اللي عنده، ومحلك هيفضل قدامك هنا.
              </Txt>
            </View>
            <Icon name="forward" size={20} color={colors.muted} />
          </Pressable>
        )}

        <View style={styles.sectionHead}>
          <Txt display weight={600} size={18}>
            من المحلات اللي جنبك
          </Txt>
        </View>
        <ProductRail products={products.data ?? []} stores={nearby} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/errand')}
          style={({ pressed }) => [styles.errand, pressed && ui.pressed]}>
          <Icon name="bag" size={28} strokeWidth={1.7} />
          <View style={styles.flex}>
            <Txt weight={600} size={16}>
              مش لاقي محلك؟ هاتلي أي حاجة
            </Txt>
            <Txt size={14} color={colors.body}>
              المندوب يشتريها من أي محل في الفيوم، ويصوّرلك الفاتورة.
            </Txt>
          </View>
        </Pressable>

        <View style={styles.sectionHead}>
          <Txt display weight={600} size={18}>
            قريب منك
          </Txt>
          <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push('/stores')}>
            <Txt size={15} weight={600} color={colors.accent}>
              كل المحلات
            </Txt>
          </Pressable>
        </View>
        {nearby.map((store) => (
          <StoreCard key={store.id} store={store} linked={!!linkedIds.data?.includes(store.id)} />
        ))}
      </ScrollView>
      <CartPill />

      <Sheet visible={howOpen} onClose={() => setHowOpen(false)} title="إزاي بنشتغل">
        <How icon="moto" title="مندوب واحد يجيبلك من 3 محلات">
          التوصيل من 15 لـ 25 جنيه حسب المسافة، وكل محل زيادة بـ{EXTRA_STORE_FEE} جنيه بس. أقصى حاجة {money(MAX_DELIVERY)}.
        </How>
        <How icon="shield" title="وقت مضمون">
          بنقولك هيوصل قبل الساعة كام. لو اتأخرنا، التوصيل الجاي علينا من غير ما تكلم حد.
        </How>
        <How icon="check" title="نفس سعر الرف في المحل">
          من غير رسوم خدمة ولا تغليف. ومش هتدفع أي حاجة قبل ما الطلب يوصلك.
        </How>
        <PrimaryButton label="تمام" onPress={() => setHowOpen(false)} />
      </Sheet>
    </View>
  );
}

function How({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <View style={styles.how}>
      <View style={styles.howIcon}>
        <Icon name={icon} size={24} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Txt weight={600} size={16}>
          {title}
        </Txt>
        <Txt size={15} color={colors.body}>
          {children}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  header: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.accent },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 48 },
  address: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, maxWidth: 240 },
  search: {
    marginTop: 8,
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.card,
    backgroundColor: colors.card,
  },
  content: { padding: 16, paddingBottom: CART_PILL_SPACE },
  textAsk: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  textAskYes: { height: 40, paddingHorizontal: 14, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  textAskNo: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.ink, ...elevation.raised },
  liveIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  again: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  againButton: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.accent },
  banners: { marginTop: 16 },
  sectionHead: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rail: { gap: 10, paddingBottom: 4 },
  favCard: { width: 100, gap: 6, alignItems: 'center' },
  rate: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.card },
  linkedCard: { width: 104, padding: 10, gap: 6, alignItems: 'center', borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.mint, backgroundColor: colors.card },
  addShop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  addShopIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  errand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.mintSoft },
  how: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
