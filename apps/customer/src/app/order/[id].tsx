import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Countdown } from '@/components/countdown';
import { whenText } from '@/lib/schedule';
import { MapView } from '@/components/map';
import { ErrandCard, RxCard } from '@/components/order-extras';
import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import {
  askForHelp,
  Banner,
  callNumber,
  Card,
  ErrorState,
  Loading,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Sheet,
  styles as ui,
} from '@/components/ui';
import { cancelOrder, fetchProductsByIds, friendlyError } from '@/data/api';
import { keys, queryClient, useMyOrders, useOrder, useOrderDriver, useStores } from '@/data/queries';
import { RateOrderCard } from '@/components/rate-order';
import type { OrderDetail, OrderStatus, OrderStoreStatus } from '@/data/types';
import { money, promisedArrival } from '@/lib/pricing';
import { usePromises } from '@/state/promises';
import { useCart, type Line } from '@/state/cart';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'placed', label: 'وصل للمحل' },
  { status: 'preparing', label: 'بيتجهّز' },
  { status: 'picked_up', label: 'المندوب استلمه' },
  { status: 'on_the_way', label: 'في الطريق' },
  { status: 'delivered', label: 'وصلك' },
];

const headline: Record<OrderStatus, string> = {
  placed: 'مستنيين المحل يأكّد',
  preparing: 'المحل بيجهّز طلبك',
  picked_up: 'المندوب استلم طلبك',
  on_the_way: 'المندوب في الطريق ليك',
  delivered: 'طلبك وصلك',
  cancelled: 'الطلب اتلغى',
};

const storeStatus: Record<OrderStoreStatus, string> = {
  pending: 'مستني يأكّد',
  quoted: 'بعتت السعر',
  accepted: 'أكّد وبيجهّز',
  ready: 'جاهز',
  picked_up: 'المندوب استلم',
  rejected: 'اعتذر',
  rerouted: 'اتحوّل لمحل تاني',
};

const vehicleName = { bicycle: 'عجلة', scooter: 'سكوتر', motorcycle: 'موتوسيكل' } as const;

const missingText = {
  call: 'لو حاجة مش موجودة: المحل هيكلمك الأول',
  substitute: 'لو حاجة مش موجودة: زيّها بنفس السعر أو أقل',
  remove: 'لو حاجة مش موجودة: تتشال من الحساب',
} as const;

export default function OrderScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const order = useOrder(id);
  const stores = useStores();
  // Stars already given? (from the orders list, which knows since 011)
  const rated = useMyOrders().data?.find((x) => x.id === id)?.rated;
  const fill = useCart((s) => s.fill);
  const cartHasItems = useCart((s) => Object.keys(s.lines).length > 0);
  const toast = useToast((s) => s.show);
  const quoted = usePromises((s) => (id ? s.byOrder[id] : undefined));
  const liveStatus = order.data?.status;
  const driver = useOrderDriver(id, !!liveStatus && liveStatus !== 'delivered' && liveStatus !== 'cancelled');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);

  const cancel = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: keys.orders });
      toast('الطلب اتلغى، ومش هتدفع أي حاجة');
    },
    onError: (error) => {
      setCancelOpen(false);
      toast(friendlyError(error));
    },
  });

  const reorder = useMutation({
    mutationFn: async (detail: OrderDetail) => {
      const wanted = detail.stores.flatMap((s) => s.lines).filter((l) => l.productId);
      const products = await fetchProductsByIds(wanted.map((l) => l.productId as string));
      const lines: Line[] = [];
      for (const product of products) {
        const store = stores.data?.find((s) => s.id === product.storeId);
        const qty = wanted.find((l) => l.productId === product.id)?.qty ?? 1;
        if (store) lines.push({ product, store, qty });
      }
      return { lines, missing: wanted.length - lines.length };
    },
    onSuccess: ({ lines, missing }) => {
      setReorderOpen(false);
      if (lines.length === 0) {
        toast('الحاجات دي مش متوفرة دلوقتي في المحلات');
        return;
      }
      fill(lines);
      if (missing > 0) toast('فيه حاجات مش متوفرة النهارده، ضفنا الباقي بأسعار النهارده');
      router.push('/checkout');
    },
    onError: (error) => toast(friendlyError(error)),
  });

  if (order.isPending) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="طلبك" />
        <Loading />
      </View>
    );
  }

  if (order.isError || !order.data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="طلبك" />
        <ErrorState message="مقدرناش نجيب الطلب" onRetry={() => order.refetch()} />
      </View>
    );
  }

  const o = order.data;
  const placedAt = new Date(o.placedAt);
  // The same time the customer saw before confirming, when this phone placed the order.
  const arrival = promisedArrival(quoted, o.guaranteedMinutes, o.placedAt);
  const dueAt = quoted ?? placedAt.getTime() + o.guaranteedMinutes * 60_000;
  // The order refetches every 20 seconds while active, so its fetch time is a fresh "now".
  const late = o.status !== 'delivered' && o.status !== 'cancelled' && order.dataUpdatedAt > dueAt;
  const stepIndex = steps.findIndex((s) => s.status === o.status);
  const canCancel = o.status === 'placed' && o.stores.every((s) => s.status === 'pending');
  const active = o.status !== 'delivered' && o.status !== 'cancelled';
  const later = !!o.scheduledFor && new Date(o.scheduledFor).getTime() - order.dataUpdatedAt > 60 * 60_000;

  const startReorder = () => (cartHasItems ? setReorderOpen(true) : reorder.mutate(o));
  const phoneOf = (storeId: string) => stores.data?.find((s) => s.id === storeId)?.phone ?? null;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={`طلب رقم ${o.number}`} />
      <ScrollView contentContainerStyle={styles.content}>
        {fresh && o.status === 'placed' ? (
          <Banner icon="check" tone={colors.successSoft} iconColor={colors.success}>
            <Txt display weight={700} size={18}>
              تمام، طلبك وصل للمحلات
            </Txt>
            <Txt size={15} color={colors.body}>
              لو عايز تلغي، دوس «إلغاء الطلب» تحت قبل ما المحل يأكّد.
            </Txt>
          </Banner>
        ) : null}

        <Card style={styles.gap}>
          <View style={styles.hero}>
            <View style={styles.flex}>
              <Txt display weight={700} size={22}>
                {headline[o.status]}
              </Txt>
              {active && later ? (
                <Txt size={17} weight={500} color={colors.accent}>
                  متجدول: {whenText(new Date(o.scheduledFor as string).getTime())}
                </Txt>
              ) : active ? (
                <Txt size={17} weight={500} color={late ? colors.warning : colors.success}>
                  {late ? 'اتأخرنا عليك. التوصيل الجاي علينا' : `وعد وقتي: قبل الساعة ${arrival}`}
                </Txt>
              ) : null}
            </View>
            {active && !later ? (
              <Countdown
                minutesLeft={Math.max(0, Math.ceil((dueAt - order.dataUpdatedAt) / 60_000))}
                totalMinutes={Math.round((dueAt - placedAt.getTime()) / 60_000)}
                late={late}
              />
            ) : null}
          </View>
          {o.status !== 'cancelled' ? (
            <View style={styles.steps}>
              {steps.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <View key={step.status} style={styles.step}>
                    <View style={[styles.dot, done ? styles.dotOn : styles.dotOff]}>
                      {done ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} /> : null}
                    </View>
                    <Txt size={13} weight={done ? 600 : 400} color={done ? colors.ink : colors.muted} align="center">
                      {step.label}
                    </Txt>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Card>

        {o.kind === 'rx' ? (
          <View style={styles.gap}>
            <RxCard order={o} />
          </View>
        ) : null}
        {o.kind === 'errand' ? (
          <View style={styles.gap}>
            <ErrandCard order={o} />
          </View>
        ) : null}

        {/* While it's on its way: the shops and your door on the map (the rider's dot comes with the phone app's GPS). */}
        {active && o.dropLat != null && o.dropLng != null ? (
          <MapView
            lat={o.dropLat}
            lng={o.dropLng}
            zoom={15}
            markers={[
              ...o.stores.flatMap((s) => {
                const shop = stores.data?.find((x) => x.id === s.storeId);
                return shop?.lat != null && shop.lng != null ? [{ lat: shop.lat, lng: shop.lng, kind: 'store' as const, label: shop.mark }] : [];
              }),
              { lat: o.dropLat, lng: o.dropLng, kind: 'home' as const },
            ]}
            style={[styles.gap, styles.map]}
          />
        ) : null}

        {driver.data ? (
          <Card style={styles.gap}>
            <View style={styles.rider}>
              <View style={styles.riderIcon}>
                <Icon name="moto" size={26} color={colors.onAccent} />
              </View>
              <View style={styles.flex}>
                <Txt weight={600} size={17}>
                  {driver.data.name} هيوصلك
                </Txt>
                <Txt size={14} color={colors.body}>
                  سبع وقتي · {vehicleName[driver.data.vehicle]}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`كلّم ${driver.data.name}`}
                onPress={() => callNumber(driver.data!.phone)}
                style={({ pressed }) => [styles.callIcon, pressed && ui.pressed]}>
                <Icon name="phone" size={20} color={colors.accent} />
              </Pressable>
            </View>
          </Card>
        ) : null}

        {o.stores.map((s) => (
          <Card key={s.storeId || s.name} style={styles.gap}>
            <View style={styles.storeHead}>
              <Txt weight={600} size={16} style={styles.flex}>
                {s.name}
              </Txt>
              {phoneOf(s.storeId) ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`اتصل بـ${s.name}`}
                  hitSlop={8}
                  onPress={() => callNumber(phoneOf(s.storeId) as string)}
                  style={({ pressed }) => [styles.callIcon, pressed && ui.pressed]}>
                  <Icon name="phone" size={20} color={colors.accent} />
                </Pressable>
              ) : null}
              <View style={[styles.pill, s.status === 'rejected' ? styles.pillBad : styles.pillOk]}>
                <Txt size={13} weight={600} color={s.status === 'rejected' ? colors.danger : colors.accent}>
                  {storeStatus[s.status]}
                </Txt>
              </View>
            </View>
            {s.lines.map((l, i) => (
              <View key={`${l.name}-${i}`} style={styles.line}>
                <View style={styles.flex}>
                  <Txt size={15}>
                    {l.name}
                    {l.note ? ` · ${l.note}` : ''} × {l.qty}
                  </Txt>
                  {l.customerNote ? (
                    <Txt size={14} weight={600} color={colors.accent}>
                      ملاحظتك: {l.customerNote}
                    </Txt>
                  ) : null}
                </View>
                <Txt size={15} weight={500}>
                  {money(l.lineTotal)}
                </Txt>
              </View>
            ))}
          </Card>
        ))}

        <Card style={styles.gap}>
          <Row label="حساب الحاجات" value={money(o.subtotal)} />
          <Row label="التوصيل" value={money(o.deliveryFee)} />
          <View style={styles.totalRow}>
            <Txt weight={700} size={18}>
              {o.paymentMethod === 'cash' ? 'هتدفع كاش' : 'هتحوّل من الموبايل'}
            </Txt>
            <Txt weight={700} size={20}>
              {money(o.total)}
            </Txt>
          </View>
          {/* Only shop orders have shelves that can run out. */}
          {o.kind === 'shop' ? (
            <Txt size={14} color={colors.body}>
              {missingText[o.missingPolicy]}
            </Txt>
          ) : null}
        </Card>

        {o.status === 'delivered' && rated === false ? (
          <View style={styles.gap}>
            <RateOrderCard orderId={o.id} storeNames={o.storeNames} />
          </View>
        ) : null}

        <View style={styles.actions}>
          {canCancel ? <SecondaryButton label="إلغاء الطلب" tone={colors.danger} onPress={() => setCancelOpen(true)} /> : null}
          {/* Only once the order is over, so nobody sends the same basket twice by mistake. */}
          {!active ? (
            <SecondaryButton
              label={reorder.isPending ? 'بنجهّز السلة…' : 'اطلب نفس الطلب تاني'}
              icon="repeat"
              onPress={startReorder}
            />
          ) : null}
          <SecondaryButton label="محتاج مساعدة؟" icon="phone" onPress={askForHelp} />
        </View>
      </ScrollView>

      <Sheet visible={cancelOpen} onClose={() => setCancelOpen(false)} title="تلغي الطلب؟">
        <Txt size={16} color={colors.body}>
          المحلات لسه مأكدتش، فالإلغاء ببلاش ومش هتدفع أي حاجة.
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton
            label={cancel.isPending ? 'بنلغي…' : 'أيوه، الغي الطلب'}
            tone={colors.danger}
            disabled={cancel.isPending}
            onPress={() => cancel.mutate(o.id)}
          />
          <SecondaryButton label="لأ، سيبه" onPress={() => setCancelOpen(false)} />
        </View>
      </Sheet>

      <Sheet visible={reorderOpen} onClose={() => setReorderOpen(false)} title="نبدّل السلة؟">
        <Txt size={16} color={colors.body}>
          السلة فيها حاجات دلوقتي. هنشيلها ونحط حاجات الطلب ده بأسعار النهارده.
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton label="أيوه، بدّلها" onPress={() => reorder.mutate(o)} />
          <SecondaryButton label="لأ، سيب السلة" onPress={() => setReorderOpen(false)} />
        </View>
      </Sheet>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt size={16} style={styles.flex}>
        {label}
      </Txt>
      <Txt size={16} weight={500}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32 },
  gap: { marginTop: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  steps: { flexDirection: 'row', marginTop: 16, gap: 4 },
  map: { height: 220 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.success },
  dotOff: { borderWidth: 2, borderColor: colors.radioOff, backgroundColor: colors.card },
  storeHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  rider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riderIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  callIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  pillOk: { backgroundColor: colors.accentSoft },
  pillBad: { backgroundColor: colors.dangerSoft },
  line: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.divider },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  actions: { marginTop: 18, gap: 10 },
  sheetActions: { marginTop: 6, gap: 10 },
});
