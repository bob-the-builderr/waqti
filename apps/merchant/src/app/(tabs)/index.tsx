import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { RxQuote } from '@/components/rx-quote';
import { ShopHeader } from '@/components/shop-header';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { Card, ErrorState, PrimaryButton, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { acceptOrder, busyOrder, friendlyError, itemOut, readyOrder, type MerchantItem, type MerchantOrder } from '@/data/api';
import { refreshAll, useOrders } from '@/data/queries';
import { clockTime, formatPhone, itemsWord, money } from '@/lib/format';
import { startRinging, stopRinging } from '@/lib/ring';
import { useToast } from '@/state/toast';
import { colors, elevation, radius } from '@/theme';

const PREP_CHOICES = [5, 10, 15, 20];

const missingText = {
  call: 'لو حاجة ناقصة: كلّم الزبون الأول',
  substitute: 'لو حاجة ناقصة: هات زيّها بنفس السعر أو أقل',
  remove: 'لو حاجة ناقصة: شيلها من الحساب',
} as const;

const payText = { cash: 'كاش مع المندوب', wallet: 'تحويل للمندوب' } as const;

export default function OrdersScreen() {
  const orders = useOrders();
  const list = orders.data ?? [];
  const pending = list.filter((o) => o.status === 'pending');
  const quoted = list.filter((o) => o.status === 'quoted');
  const preparing = list.filter((o) => o.status === 'accepted');
  const ready = list.filter((o) => o.status === 'ready');
  const done = list.filter((o) => o.status === 'picked_up' || o.status === 'rejected');

  // Ring like a phone call while any order waits for an answer.
  useEffect(() => {
    if (pending.length > 0) startRinging();
    else stopRinging();
  }, [pending.length]);
  useEffect(() => stopRinging, []);

  return (
    <View style={styles.screen}>
      <ShopHeader title="الطلبات" />
      {orders.isPending ? (
        <StoreListSkeleton rows={3} />
      ) : orders.isError ? (
        <ErrorState message={friendlyError(orders.error)} onRetry={() => orders.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {list.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="bell" size={52} color={colors.accent} strokeWidth={1.6} />
              <Txt weight={600} size={19} align="center">
                مفيش طلبات دلوقتي
              </Txt>
              <Txt size={16} color={colors.body} align="center">
                أول ما ييجي طلب هيرن هنا، حتى لو الشاشة دي مفتوحة على حاجة تانية.
              </Txt>
            </View>
          ) : null}

          {preparing.length > 0 ? <SectionTitle text={`بيتجهّز · ${preparing.length}`} /> : null}
          {preparing.map((o) => (
            <PreparingCard key={o.orderStoreId} order={o} />
          ))}

          {quoted.length > 0 ? <SectionTitle text={`مستني الزبون يوافق على السعر · ${quoted.length}`} /> : null}
          {quoted.map((o) => (
            <SmallCard key={o.orderStoreId} order={o} note={`روشتة · بعتّ السعر ${money(o.subtotal)}`} />
          ))}

          {ready.length > 0 ? <SectionTitle text={`جاهز، مستني المندوب · ${ready.length}`} /> : null}
          {ready.map((o) => (
            <SmallCard key={o.orderStoreId} order={o} note={`جاهز من ${o.acceptedAt ? clockTime(o.acceptedAt) : ''}`} />
          ))}

          {done.length > 0 ? <SectionTitle text="النهارده" /> : null}
          {done.map((o) => (
            <SmallCard key={o.orderStoreId} order={o} note={o.status === 'rejected' ? 'اعتذرت عنه' : 'المندوب استلمه'} dim />
          ))}
        </ScrollView>
      )}

      <NewOrder order={pending[pending.length - 1] ?? null} waiting={pending.length} />
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Txt display weight={600} size={18} style={styles.sectionTitle}>
      {text}
    </Txt>
  );
}

/** The ringing order: full screen, answer with «قبول» (and a prep time) or «مشغول». */
function NewOrder({ order, waiting }: { order: MerchantOrder | null; waiting: number }) {
  const insets = useSafeAreaInsets();
  const toast = useToast((s) => s.show);
  const [prep, setPrep] = useState(10);
  const [askBusy, setAskBusy] = useState(false);

  const accept = useMutation({
    mutationFn: () => acceptOrder(order!.orderStoreId, prep),
    onSuccess: () => {
      stopRinging();
      refreshAll();
      toast(`تمام، الطلب رقم ${order!.number} عندك. جهّزه في ${prep} دقيقة`);
    },
    onError: (e) => {
      refreshAll();
      toast(friendlyError(e));
    },
  });
  const busy = useMutation({
    mutationFn: () => busyOrder(order!.orderStoreId),
    onSuccess: () => {
      setAskBusy(false);
      stopRinging();
      refreshAll();
      toast('اعتذرنا للزبون عنك');
    },
    onError: (e) => {
      setAskBusy(false);
      refreshAll();
      toast(friendlyError(e));
    },
  });

  if (!order) return null;
  // A prescription has nothing to accept yet: it gets priced first.
  if (order.kind === 'rx') return <RxQuote order={order} waiting={waiting} />;
  const pieces = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={() => undefined} statusBarTranslucent>
      <View style={[styles.ring, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.ringHead}>
          <View style={styles.bell}>
            <Icon name="bell" size={34} color={colors.accent} strokeWidth={2} />
          </View>
          <Txt display weight={700} size={30} color={colors.onAccent}>
            طلب جديد
          </Txt>
          <Txt size={18} color={colors.onAccentSoft}>
            رقم {order.number} · {itemsWord(pieces)} · {money(order.subtotal)}
            {order.scheduledFor ? ` · متجدول الساعة ${clockTime(order.scheduledFor)}` : ''}
            {waiting > 1 ? ` · وفيه ${waiting - 1} كمان` : ''}
          </Txt>
        </View>

        <ScrollView style={styles.ringBody} contentContainerStyle={styles.ringBodyContent}>
          {order.items.map((i) => (
            <View key={i.id} style={styles.ringItem}>
              <Txt display weight={700} size={22} color={colors.accent} style={styles.qty}>
                {i.qty}×
              </Txt>
              <View style={styles.flex}>
                <Txt weight={600} size={19}>
                  {i.name}
                </Txt>
                {i.note ? (
                  <Txt size={15} color={colors.muted}>
                    {i.note}
                  </Txt>
                ) : null}
                {i.customerNote ? (
                  <Txt size={16} weight={700} color={colors.danger}>
                    الزبون: {i.customerNote}
                  </Txt>
                ) : null}
              </View>
              <Txt weight={600} size={17}>
                {money(i.lineTotal)}
              </Txt>
            </View>
          ))}
          <View style={styles.ringMoney}>
            <Line label="حساب الحاجات" value={money(order.subtotal)} />
            <Line label="عمولة وقتي" value={`− ${money(order.commission)}`} />
            <Line label="ليك" value={money(order.subtotal - order.commission)} strong />
            <Txt size={15} color={colors.body}>
              {payText[order.paymentMethod]} · {missingText[order.missingPolicy]}
            </Txt>
            {order.storeCount > 1 ? (
              <Txt size={15} weight={600} color={colors.accent}>
                الطلب ده جزء من مشوار فيه {order.storeCount} محلات، والمندوب هيعدّي عليك.
              </Txt>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.ringFoot}>
          <Txt weight={600} size={16} color={colors.onAccent}>
            هتجهّزه في كام دقيقة؟
          </Txt>
          <View style={styles.prepRow}>
            {PREP_CHOICES.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: prep === m }}
                onPress={() => setPrep(m)}
                style={[styles.prep, prep === m ? styles.prepOn : null]}>
                <Txt weight={700} size={18} color={prep === m ? colors.accent : colors.onAccent}>
                  {m}
                </Txt>
              </Pressable>
            ))}
          </View>
          <PrimaryButton
            label={accept.isPending ? 'بنقبل…' : `قبول · ${prep} دقيقة`}
            tone={colors.mint}
            textColor={colors.ink}
            disabled={accept.isPending}
            onPress={() => accept.mutate()}
          />
          <Pressable accessibilityRole="button" onPress={() => setAskBusy(true)} style={({ pressed }) => [styles.busy, pressed && ui.pressed]}>
            <Txt weight={600} size={17} color={colors.onAccent} align="center">
              مشغول، مش هقدر
            </Txt>
          </Pressable>
        </View>
      </View>

      <Sheet visible={askBusy} onClose={() => setAskBusy(false)} title="مش هتقدر تاخد الطلب ده؟">
        <Txt size={16} color={colors.body}>
          هنقول للزبون إن المحل مشغول. ده مش بيتحسب عليك، بس لو بتتكرر كتير الأحسن تخلي المحل «مشغول» من فوق.
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton label={busy.isPending ? 'لحظة…' : 'أيوه، مشغول'} tone={colors.danger} disabled={busy.isPending} onPress={() => busy.mutate()} />
          <SecondaryButton label="لأ، هرجع أقبله" onPress={() => setAskBusy(false)} />
        </View>
      </Sheet>
    </Modal>
  );
}

/** An accepted order: tick items as you pack them, «خلصان» for anything missing, then «جاهز». */
function PreparingCard({ order }: { order: MerchantOrder }) {
  const toast = useToast((s) => s.show);
  const [packed, setPacked] = useState<Record<string, boolean>>({});
  const [outItem, setOutItem] = useState<MerchantItem | null>(null);

  const ready = useMutation({
    mutationFn: () => readyOrder(order.orderStoreId),
    onSuccess: () => {
      refreshAll();
      toast(`الطلب رقم ${order.number} جاهز. المندوب جاي`);
    },
    onError: (e) => toast(friendlyError(e)),
  });
  const out = useMutation({
    mutationFn: (id: string) => itemOut(id),
    onSuccess: () => {
      setOutItem(null);
      refreshAll();
      toast('اتشالت من الطلب ومن قايمة المحل لحد ما ترجّعها');
    },
    onError: (e) => {
      setOutItem(null);
      toast(friendlyError(e));
    },
  });

  const due = order.acceptedAt && order.prepMinutes ? new Date(new Date(order.acceptedAt).getTime() + order.prepMinutes * 60_000) : null;
  const live = order.items.filter((i) => !i.outOfStock);
  const allPacked = live.length > 0 && live.every((i) => packed[i.id]);

  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Txt display weight={700} size={20}>
            رقم {order.number}
          </Txt>
          <Txt size={15} color={colors.body}>
            {due ? `جهّزه قبل ${clockTime(due)}` : ''} · {money(order.subtotal)} · {payText[order.paymentMethod]}
          </Txt>
        </View>
        {order.customerPhone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="كلّم الزبون"
            onPress={() => Linking.openURL(`tel:${order.customerPhone}`).catch(() => undefined)}
            style={({ pressed }) => [styles.call, pressed && ui.pressed]}>
            <Icon name="phone" size={22} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>

      {order.items.map((i) => (
        <View key={i.id} style={[styles.item, i.outOfStock && styles.itemOut]}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!packed[i.id], disabled: i.outOfStock }}
            accessibilityLabel={`${i.name}، ${i.qty}`}
            disabled={i.outOfStock}
            onPress={() => setPacked((p) => ({ ...p, [i.id]: !p[i.id] }))}
            style={styles.itemMain}>
            <View style={[styles.box, packed[i.id] && styles.boxOn]}>
              {packed[i.id] ? <Icon name="check" size={18} color={colors.white} strokeWidth={2.6} /> : null}
            </View>
            <Txt display weight={700} size={20} color={colors.accent} style={styles.qty}>
              {i.qty}×
            </Txt>
            <View style={styles.flex}>
              <Txt weight={600} size={18} style={i.outOfStock ? styles.strike : undefined}>
                {i.name}
              </Txt>
              <Txt size={14} color={colors.muted}>
                {i.outOfStock ? 'خلصان، اتشال من الحساب' : i.note}
              </Txt>
              {i.customerNote && !i.outOfStock ? (
                <Txt size={15} weight={700} color={colors.danger}>
                  الزبون: {i.customerNote}
                </Txt>
              ) : null}
            </View>
          </Pressable>
          {i.outOfStock ? null : (
            <Pressable accessibilityRole="button" onPress={() => setOutItem(i)} style={({ pressed }) => [styles.outButton, pressed && ui.pressed]}>
              <Txt size={14} weight={600} color={colors.danger}>
                خلصان
              </Txt>
            </Pressable>
          )}
        </View>
      ))}

      <Txt size={14} color={colors.body} style={styles.missing}>
        {missingText[order.missingPolicy]}
      </Txt>
      <PrimaryButton
        label={ready.isPending ? 'لحظة…' : allPacked ? 'جاهز، ابعت المندوب' : 'جاهز'}
        disabled={ready.isPending}
        onPress={() => ready.mutate()}
      />

      <Sheet visible={!!outItem} onClose={() => setOutItem(null)} title={`«${outItem?.name ?? ''}» خلصان؟`}>
        <Txt size={16} color={colors.body}>
          هتتشال من حساب الطلب، وهتتقفل في قايمة المحل لحد ما ترجّعها من «الأصناف».
          {order.missingPolicy === 'call' && order.customerPhone ? ` الزبون طالب تكلّمه الأول على ${formatPhone(order.customerPhone)}.` : ''}
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton label={out.isPending ? 'لحظة…' : 'أيوه، خلصان'} tone={colors.danger} disabled={out.isPending} onPress={() => outItem && out.mutate(outItem.id)} />
          <SecondaryButton label="لأ، موجود" onPress={() => setOutItem(null)} />
        </View>
      </Sheet>
    </Card>
  );
}

function SmallCard({ order, note, dim = false }: { order: MerchantOrder; note: string; dim?: boolean }) {
  return (
    <View style={[styles.small, dim && styles.dim]}>
      <Txt weight={600} size={16} style={styles.flex}>
        رقم {order.number} · {itemsWord(order.items.reduce((n, i) => n + (i.outOfStock ? 0 : i.qty), 0))}
      </Txt>
      <Txt size={15} color={colors.body}>
        {note} · {money(order.subtotal)}
      </Txt>
    </View>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Txt size={strong ? 18 : 16} weight={strong ? 700 : 400} style={styles.flex}>
        {label}
      </Txt>
      <Txt size={strong ? 20 : 16} weight={strong ? 700 : 500}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 64, paddingHorizontal: 24 },
  sectionTitle: { marginTop: 8, marginBottom: 10 },
  card: { marginBottom: 14, gap: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  call: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider },
  itemOut: { opacity: 0.55 },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  box: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: colors.radioOff, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.success, borderColor: colors.success },
  qty: { minWidth: 40 },
  strike: { textDecorationLine: 'line-through' },
  outButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  missing: { marginTop: 6, marginBottom: 8 },
  small: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 10, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  dim: { opacity: 0.7 },
  ring: { flex: 1, paddingHorizontal: 16, backgroundColor: colors.accent, gap: 14 },
  ringHead: { alignItems: 'center', gap: 6 },
  bell: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, marginBottom: 4 },
  ringBody: { flex: 1, borderRadius: radius.xl, backgroundColor: colors.card },
  ringBodyContent: { padding: 16 },
  ringItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  ringMoney: { marginTop: 10, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ringFoot: { gap: 10 },
  prepRow: { flexDirection: 'row', gap: 8 },
  prep: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  prepOn: { backgroundColor: colors.white, borderColor: colors.white },
  busy: { minHeight: 52, justifyContent: 'center' },
  sheetActions: { gap: 10, marginTop: 4 },
});
