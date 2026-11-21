import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Txt, useInputSize } from '@/components/txt';
import { Badge, Card, Chip, ErrorState, Loading, PrimaryButton, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { friendlyError, recordDeposit, setDriverStatus, type AdminDriver } from '@/data/api';
import { refreshAll, useOverview } from '@/data/queries';
import { formatPhone, money } from '@/lib/format';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

const vehicleName = { bicycle: 'عجلة', scooter: 'سكوتر', motorcycle: 'موتوسيكل' } as const;
const METHODS = [
  { id: 'instapay', label: 'إنستاباي' },
  { id: 'vodafone_cash', label: 'فودافون كاش' },
  { id: 'fawry', label: 'فوري' },
  { id: 'office', label: 'في المكتب' },
] as const;
type Method = (typeof METHODS)[number]['id'];

/** «المناديب والكاش»: approve new riders, stop one, and record the cash they hand in. */
export default function DriversScreen() {
  const overview = useOverview();
  const toast = useToast((s) => s.show);
  const amountSize = useInputSize(24);
  const [depositFor, setDepositFor] = useState<AdminDriver | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('instapay');
  const [reference, setReference] = useState('');

  const status = useMutation({
    mutationFn: ({ id, to }: { id: string; to: AdminDriver['status'] }) => setDriverStatus(id, to),
    onSuccess: (_d, { to }) => {
      refreshAll();
      toast(to === 'active' ? 'المندوب اتفعّل، المشاوير هتبدأ توصله' : 'المندوب اتوقف');
    },
    onError: (e) => toast(friendlyError(e)),
  });
  const deposit = useMutation({
    mutationFn: () => recordDeposit(depositFor!.userId, Number(latinDigits(amount).replace(/[^\d]/g, '')), method, reference),
    onSuccess: (r) => {
      toast(`اتسجّل. معاه دلوقتي ${money(r.cash_held)}`);
      setDepositFor(null);
      refreshAll();
    },
    onError: (e) => toast(friendlyError(e)),
  });

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState message={friendlyError(overview.error)} onRetry={() => overview.refetch()} />;
  const drivers = overview.data.drivers;
  const pending = drivers.filter((d) => d.status === 'pending');
  const others = drivers.filter((d) => d.status !== 'pending');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.page}>
        {pending.length ? (
          <>
            <Txt display weight={700} size={19}>
              مستنيين موافقتك · {pending.length}
            </Txt>
            <Txt size={14} color={colors.body}>
              كلّمه، اتأكد من البطاقة والرخصة، وبعدين فعّله.
            </Txt>
            <View style={styles.grid}>
              {pending.map((d) => (
                <Card key={d.userId} style={styles.driver}>
                  <Txt weight={700} size={17}>
                    {d.name}
                  </Txt>
                  <Txt size={14} color={colors.body}>
                    {vehicleName[d.vehicle]} · سجّل {new Date(d.createdAt).toLocaleDateString('ar-EG-u-nu-latn')}
                  </Txt>
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${d.phone}`)}>
                    <Txt size={15} weight={600} color={colors.accent}>
                      {formatPhone(d.phone)}
                    </Txt>
                  </Pressable>
                  <View style={styles.actions}>
                    <View style={styles.flex}>
                      <PrimaryButton label="فعّله" onPress={() => status.mutate({ id: d.userId, to: 'active' })} />
                    </View>
                    <View style={styles.flex}>
                      <SecondaryButton label="ارفضه" tone={colors.danger} onPress={() => status.mutate({ id: d.userId, to: 'suspended' })} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        <Txt display weight={700} size={19} style={styles.section}>
          كل المناديب · {others.length}
        </Txt>
        <View style={styles.grid}>
          {others.map((d) => {
            const share = Math.min(1, d.cashHeld / Math.max(1, d.cashLimit));
            return (
              <Card key={d.userId} style={d.status === 'suspended' ? { ...styles.driver, ...styles.off } : styles.driver}>
                <View style={styles.row}>
                  <Txt weight={700} size={17} style={styles.flex}>
                    {d.name}
                  </Txt>
                  {d.status === 'suspended' ? (
                    <Badge label="موقوف" tone={colors.dangerSoft} color={colors.danger} />
                  ) : d.appOpen ? (
                    <Badge label="فاتح التطبيق" tone={colors.successSoft} color={colors.success} />
                  ) : (
                    <Badge label="مش متاح" tone={colors.field} color={colors.muted} />
                  )}
                </View>
                <Txt size={14} color={colors.body}>
                  {vehicleName[d.vehicle]} · {formatPhone(d.phone)} · ★ {d.rating.toFixed(1)}
                  {d.ratingCount ? ` (${d.ratingCount})` : ''} · {d.tripsToday} مشوار النهارده
                </Txt>
                <View style={styles.row}>
                  <Txt size={15} weight={600} style={styles.flex}>
                    كاش معاه: {money(d.cashHeld)}
                  </Txt>
                  <Txt size={13} color={colors.muted}>
                    الحد {money(d.cashLimit)}
                  </Txt>
                </View>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round(share * 100)}%`, backgroundColor: share >= 1 ? colors.danger : share >= 0.8 ? colors.warning : colors.success }]} />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setDepositFor(d);
                      setAmount(d.cashHeld > 0 ? String(d.cashHeld) : '');
                      setReference('');
                    }}
                    style={({ pressed }) => [styles.small, pressed && ui.pressed]}>
                    <Txt size={14} weight={600} color={colors.accent}>
                      سجّل توريد
                    </Txt>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => status.mutate({ id: d.userId, to: d.status === 'suspended' ? 'active' : 'suspended' })}
                    style={({ pressed }) => [styles.small, d.status === 'suspended' ? null : styles.smallDanger, pressed && ui.pressed]}>
                    <Txt size={14} weight={600} color={d.status === 'suspended' ? colors.accent : colors.danger}>
                      {d.status === 'suspended' ? 'رجّعه' : 'وقّفه'}
                    </Txt>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      <Sheet visible={!!depositFor} onClose={() => setDepositFor(null)} title={`توريد من ${depositFor?.name ?? ''}`}>
        <Txt size={15} color={colors.body}>
          معاه دلوقتي {money(depositFor?.cashHeld ?? 0)}. اكتب المبلغ اللي وصلك فعلاً.
        </Txt>
        <TextInput
          accessibilityLabel="المبلغ"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          style={[styles.amount, { fontSize: amountSize }]}
        />
        <View style={styles.chips}>
          {METHODS.map((m) => (
            <Chip key={m.id} label={m.label} selected={method === m.id} onPress={() => setMethod(m.id)} />
          ))}
        </View>
        <TextInput
          accessibilityLabel="رقم العملية"
          placeholder="رقم العملية أو ملاحظة (مش لازم)"
          placeholderTextColor={colors.muted}
          value={reference}
          onChangeText={setReference}
          style={styles.reference}
        />
        <PrimaryButton label={deposit.isPending ? 'لحظة…' : 'سجّل'} disabled={!amount || deposit.isPending} onPress={() => deposit.mutate()} />
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  page: { width: '100%', maxWidth: 1100, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  section: { marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  driver: { flexGrow: 1, flexBasis: 320, gap: 6 },
  off: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.field },
  barFill: { height: 8, borderRadius: 4 },
  small: { height: 40, paddingHorizontal: 12, borderRadius: radius.md, justifyContent: 'center', backgroundColor: colors.accentSoft },
  smallDanger: { backgroundColor: colors.dangerSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amount: {
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    fontFamily: fonts.display700,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  reference: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.body400,
    color: colors.ink,
    textAlign: 'right',
    backgroundColor: colors.card,
  },
});
