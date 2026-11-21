import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { answerRx, friendlyError, orderPhotoUrl } from '@/data/api';
import { keys, queryClient } from '@/data/queries';
import type { OrderDetail } from '@/data/types';
import { money } from '@/lib/pricing';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

import { Icon } from './icon';
import { Txt } from './txt';
import { Card, PrimaryButton, SecondaryButton } from './ui';

/** A private photo (prescription or receipt), opened with a short-lived link. */
function PrivatePhoto({ path, height }: { path: string; height: number }) {
  const url = useQuery({ queryKey: ['order-photo', path], queryFn: () => orderPhotoUrl(path), staleTime: 30 * 60_000 });
  return <View style={[styles.photo, { height }]}>{url.data ? <Image source={url.data} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}</View>;
}

/** The prescription and, once it comes, the pharmacy's price to accept or refuse. */
export function RxCard({ order }: { order: OrderDetail }) {
  const toast = useToast((s) => s.show);
  const line = order.stores[0];
  const quoted = line?.status === 'quoted';
  const answer = useMutation({
    mutationFn: (accept: boolean) => answerRx(order.id, accept),
    onSuccess: (_d, accept) => {
      toast(accept ? 'تمام، الصيدلية بتجهّز الدوا' : 'اتلغى الطلب');
      queryClient.invalidateQueries({ queryKey: keys.order(order.id) });
      queryClient.invalidateQueries({ queryKey: keys.orders });
    },
    onError: (e) => toast(friendlyError(e)),
  });

  return (
    <Card style={quoted ? { ...styles.card, ...styles.cardOn } : styles.card}>
      <View style={styles.head}>
        <Icon name="camera" size={22} color={colors.accent} />
        <Txt display weight={700} size={17} style={styles.flex}>
          الروشتة
        </Txt>
        {line?.status === 'pending' ? (
          <Txt size={14} weight={600} color={colors.warning}>
            الصيدلية بتراجعها
          </Txt>
        ) : null}
      </View>
      {order.rxPhotoPath ? <PrivatePhoto path={order.rxPhotoPath} height={180} /> : null}
      {order.rxNote ? (
        <Txt size={14} color={colors.body}>
          ملاحظتك: {order.rxNote}
        </Txt>
      ) : null}
      {quoted ? (
        <View style={styles.quote}>
          <Txt weight={700} size={18}>
            {line.name} بعتت السعر
          </Txt>
          {order.rxQuoteNote ? (
            <Txt size={15} color={colors.body}>
              «{order.rxQuoteNote}»
            </Txt>
          ) : null}
          <View style={styles.row}>
            <Txt size={15}>الدوا</Txt>
            <Txt size={15} weight={600}>
              {money(order.subtotal)}
            </Txt>
          </View>
          <View style={styles.row}>
            <Txt size={15}>التوصيل</Txt>
            <Txt size={15} weight={600}>
              {money(order.deliveryFee)}
            </Txt>
          </View>
          <View style={[styles.row, styles.total]}>
            <Txt weight={700} size={17}>
              الإجمالي
            </Txt>
            <Txt weight={700} size={19}>
              {money(order.total)}
            </Txt>
          </View>
          <PrimaryButton label={answer.isPending ? 'لحظة…' : `موافق، ابعتوها · ${money(order.total)}`} disabled={answer.isPending} onPress={() => answer.mutate(true)} />
          <SecondaryButton label="لا شكراً" tone={colors.danger} onPress={() => answer.mutate(false)} />
        </View>
      ) : null}
    </Card>
  );
}

/** What the customer asked for, the cap, and once bought: what was paid and the receipt. */
export function ErrandCard({ order }: { order: OrderDetail }) {
  const bought = !!order.receiptPath;
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="bag" size={22} color={colors.accent} />
        <Txt display weight={700} size={17} style={styles.flex}>
          هاتلي أي حاجة
        </Txt>
      </View>
      <Txt size={16} weight={500}>
        {order.errandText}
      </Txt>
      {order.errandFrom ? (
        <Txt size={14} color={colors.body}>
          من: {order.errandFrom}
        </Txt>
      ) : null}
      {bought ? (
        <>
          <PrivatePhoto path={order.receiptPath as string} height={220} />
          <View style={styles.row}>
            <Txt size={15}>تمن الحاجات بالفاتورة</Txt>
            <Txt size={15} weight={600}>
              {money(order.subtotal)}
            </Txt>
          </View>
          <View style={styles.row}>
            <Txt size={15}>التوصيل</Txt>
            <Txt size={15} weight={600}>
              {money(order.deliveryFee)}
            </Txt>
          </View>
          <View style={[styles.row, styles.total]}>
            <Txt weight={700} size={17}>
              هتدفع
            </Txt>
            <Txt weight={700} size={19}>
              {money(order.total)}
            </Txt>
          </View>
        </>
      ) : (
        <Txt size={14} color={colors.muted}>
          المندوب هيصرف لحد {money(order.errandBudget ?? 0)}، ويصوّرلك الفاتورة هنا. التوصيل {money(order.deliveryFee)}.
        </Txt>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 10 },
  cardOn: { borderWidth: 1.5, borderColor: colors.accent },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photo: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.photo },
  quote: { gap: 8, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider },
});
