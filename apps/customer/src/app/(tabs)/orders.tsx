import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { ErrorState, PrimaryButton, TabHeader, styles as ui } from '@/components/ui';
import { useMyOrders } from '@/data/queries';
import type { OrderStatus, OrderSummary } from '@/data/types';
import { money, promisedArrival } from '@/lib/pricing';
import { usePromises } from '@/state/promises';
import { colors, elevation, radius } from '@/theme';

const statusLabel: Record<OrderStatus, string> = {
  placed: 'مستنيين المحل يأكّد',
  preparing: 'بيتجهّز',
  picked_up: 'المندوب استلمه',
  on_the_way: 'في الطريق ليك',
  delivered: 'وصل',
  cancelled: 'اتلغى',
};

const statusTone: Record<OrderStatus, { bg: string; fg: string }> = {
  placed: { bg: colors.accentSoft, fg: colors.accent },
  preparing: { bg: colors.accentSoft, fg: colors.accent },
  picked_up: { bg: colors.accentSoft, fg: colors.accent },
  on_the_way: { bg: colors.accentSoft, fg: colors.accent },
  delivered: { bg: colors.successSoft, fg: colors.success },
  cancelled: { bg: colors.dangerSoft, fg: colors.danger },
};

function placedAtText(iso: string) {
  return new Date(iso).toLocaleString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

const isActive = (o: OrderSummary) => o.status !== 'delivered' && o.status !== 'cancelled';

export default function OrdersScreen() {
  const orders = useMyOrders();

  useFocusEffect(
    useCallback(() => {
      orders.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <View style={styles.screen}>
      <TabHeader title="طلباتي" />
      {orders.isPending ? (
        <StoreListSkeleton rows={3} />
      ) : orders.isError ? (
        <ErrorState message="مقدرناش نجيب طلباتك" onRetry={() => orders.refetch()} />
      ) : orders.data.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="receipt" size={48} color={colors.muted} strokeWidth={1.5} />
          <Txt weight={600} size={18} align="center">
            لسه مطلبتش حاجة
          </Txt>
          <Txt size={15} color={colors.body} align="center">
            أول طلب هيظهر هنا، ومعاه ميعاد وصوله لحد ما يوصلك.
          </Txt>
          <View style={styles.emptyAction}>
            <PrimaryButton label="ابدأ أول طلب" onPress={() => router.replace('/')} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {[...orders.data.filter(isActive), ...orders.data.filter((o) => !isActive(o))].map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const quoted = usePromises((s) => s.byOrder[order.id]);
  const active = isActive(order);
  const tone = statusTone[order.status];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`طلب رقم ${order.number}، ${statusLabel[order.status]}`}
      onPress={() => router.push(`/order/${order.id}`)}
      style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && ui.pressed]}>
      <View style={styles.row}>
        <Txt weight={600} size={16} style={styles.flex} numberOfLines={2}>
          {order.storeNames.join(' + ') || 'هاتلي أي حاجة'}
        </Txt>
        <Txt size={14} color={colors.muted}>
          رقم {order.number}
        </Txt>
      </View>
      <Txt size={14} color={colors.muted}>
        {placedAtText(order.placedAt)}
      </Txt>
      {active ? (
        <Txt size={15} weight={600} color={colors.success}>
          هيوصلك قبل الساعة {promisedArrival(quoted, order.guaranteedMinutes, order.placedAt)}
        </Txt>
      ) : null}
      <View style={[styles.row, styles.footer]}>
        <View style={[styles.status, { backgroundColor: tone.bg }]}>
          <Txt size={14} weight={600} color={tone.fg}>
            {statusLabel[order.status]}
          </Txt>
        </View>
        <Txt weight={700} size={16}>
          {money(order.total)}
        </Txt>
      </View>
      {!active ? (
        <View style={styles.again}>
          <Icon name="repeat" size={18} color={colors.accent} strokeWidth={2} />
          <Txt size={15} weight={600} color={colors.accent}>
            اطلب نفس الطلب تاني
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyAction: { alignSelf: 'stretch', marginTop: 10 },
  card: { marginBottom: 12, padding: 16, gap: 4, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  cardActive: { borderWidth: 1.5, borderColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  footer: { marginTop: 8 },
  status: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  again: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider },
});
