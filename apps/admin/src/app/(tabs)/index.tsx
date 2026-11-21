import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/txt';
import { Badge, Card, ErrorState, Loading, PrimaryButton, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { cancelOrder, friendlyError, type LiveOrder } from '@/data/api';
import { refreshAll, useOverview } from '@/data/queries';
import { clockTime, formatPhone, money } from '@/lib/format';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

const statusText: Record<LiveOrder['status'], string> = {
  placed: 'مستني المحل',
  preparing: 'بيتجهّز',
  picked_up: 'المندوب استلم',
  on_the_way: 'في الطريق',
};
const kindText = { shop: 'طلب', rx: 'روشتة', errand: 'هاتلي أي حاجة' } as const;

/** «النهارده»: today's numbers and every order still on its way, late ones first. */
export default function TodayScreen() {
  const overview = useOverview();
  const toast = useToast((s) => s.show);
  const [toCancel, setToCancel] = useState<LiveOrder | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      setToCancel(null);
      refreshAll();
      toast('الطلب اتلغى');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState message={friendlyError(overview.error)} onRetry={() => overview.refetch()} />;
  const { today, live } = overview.data;
  const net = today.commission + today.deliveryFees - today.driverPay;
  const sorted = [...live].sort((a, b) => Number(b.late) - Number(a.late));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <View style={styles.kpis}>
          <Kpi label="طلبات النهارده" value={String(today.orders)} note={`اتوصّل ${today.delivered} · اتلغى ${today.cancelled}`} />
          <Kpi label="مبيعات المحلات" value={money(today.sales)} note="من الطلبات اللي وصلت" />
          <Kpi label="دخل وقتي" value={money(net)} note={`عمولة ${money(today.commission)} + توصيل ${money(today.deliveryFees)} − أجر المناديب ${money(today.driverPay)}`} strong />
          <Kpi label="شغالة دلوقتي" value={String(live.length)} note={live.some((o) => o.late) ? `${live.filter((o) => o.late).length} متأخرين` : 'محدش متأخر'} warn={live.some((o) => o.late)} />
        </View>

        <Txt display weight={700} size={19} style={styles.section}>
          الطلبات الشغالة
        </Txt>
        {sorted.length === 0 ? (
          <Card>
            <Txt size={16} color={colors.body}>
              مفيش طلبات شغالة دلوقتي.
            </Txt>
          </Card>
        ) : null}
        <View style={styles.grid}>
          {sorted.map((o) => (
            <Card key={o.id} style={o.late ? { ...styles.order, ...styles.late } : styles.order}>
              <View style={styles.row}>
                <Txt display weight={700} size={18} style={styles.flex}>
                  {kindText[o.kind]} رقم {o.number}
                </Txt>
                {o.late ? <Badge label="متأخر" tone={colors.dangerSoft} color={colors.danger} /> : <Badge label={statusText[o.status]} />}
              </View>
              <Txt size={14} color={colors.body}>
                {o.area} · {money(o.total)} {o.paymentMethod === 'cash' ? 'كاش' : 'تحويل'} · {clockTime(o.placedAt)}
                {o.scheduledFor ? ` · متجدول ${clockTime(o.scheduledFor)}` : ''}
              </Txt>
              {o.stores.map((s) => (
                <Txt key={s.name} size={14}>
                  {s.name}: <Txt size={14} weight={600}>{s.status}</Txt>
                </Txt>
              ))}
              <Txt size={14} color={o.driver ? colors.ink : colors.warning}>
                {o.driver ? `المندوب: ${o.driver}` : 'لسه مفيش مندوب'}
              </Txt>
              <View style={styles.actions}>
                {o.customerPhone ? <Link label={`الزبون ${formatPhone(o.customerPhone)}`} url={`tel:${o.customerPhone}`} /> : null}
                {o.driverPhone ? <Link label="كلّم المندوب" url={`tel:${o.driverPhone}`} /> : null}
                <Pressable accessibilityRole="button" onPress={() => setToCancel(o)} style={({ pressed }) => [styles.cancel, pressed && ui.pressed]}>
                  <Txt size={14} weight={600} color={colors.danger}>
                    إلغاء
                  </Txt>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <Sheet visible={!!toCancel} onClose={() => setToCancel(null)} title={`تلغي طلب رقم ${toCancel?.number ?? ''}؟`}>
        <Txt size={16} color={colors.body}>
          الطلب هيتقفل عند الزبون والمحل والمندوب. استعملها بس لما تكون كلّمت الزبون.
        </Txt>
        <PrimaryButton label={cancel.isPending ? 'لحظة…' : 'أيوه، الغيه'} tone={colors.danger} disabled={cancel.isPending} onPress={() => toCancel && cancel.mutate(toCancel.id)} />
        <SecondaryButton label="لأ" onPress={() => setToCancel(null)} />
      </Sheet>
    </ScrollView>
  );
}

function Kpi({ label, value, note, strong = false, warn = false }: { label: string; value: string; note: string; strong?: boolean; warn?: boolean }) {
  return (
    <View style={[styles.kpi, strong && styles.kpiStrong, warn && styles.kpiWarn]}>
      <Txt size={14} weight={600} color={strong ? colors.onAccentSoft : colors.body}>
        {label}
      </Txt>
      <Txt display weight={700} size={26} color={strong ? colors.onAccent : warn ? colors.danger : colors.ink}>
        {value}
      </Txt>
      <Txt size={13} color={strong ? colors.onAccentSoft : colors.muted}>
        {note}
      </Txt>
    </View>
  );
}

function Link({ label, url }: { label: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={({ pressed }) => [styles.link, pressed && ui.pressed]}>
      <Txt size={14} weight={600} color={colors.accent}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  page: { width: '100%', maxWidth: 1100, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { flexGrow: 1, flexBasis: 220, gap: 2, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  kpiStrong: { backgroundColor: colors.accent },
  kpiWarn: { borderWidth: 1.5, borderColor: colors.danger },
  section: { marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  order: { flexGrow: 1, flexBasis: 320, gap: 6 },
  late: { borderWidth: 1.5, borderColor: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  link: { height: 40, paddingHorizontal: 12, borderRadius: radius.md, justifyContent: 'center', backgroundColor: colors.accentSoft },
  cancel: { height: 40, paddingHorizontal: 12, borderRadius: radius.md, justifyContent: 'center', backgroundColor: colors.dangerSoft },
});
