import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Txt } from '@/components/txt';
import { Card, ErrorState, Loading, PrimaryButton } from '@/components/ui';
import { friendlyError, setSetting } from '@/data/api';
import { refreshAll, useOverview } from '@/data/queries';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

const NUMBERS: { key: string; label: string; unit: string }[] = [
  { key: 'errand_fee', label: 'توصيل «هاتلي أي حاجة»', unit: 'جنيه' },
  { key: 'errand_driver_pay', label: 'أجر المندوب في «هاتلي أي حاجة»', unit: 'جنيه' },
  { key: 'errand_budget_new', label: 'أقصى مبلغ للعميل الجديد', unit: 'جنيه' },
  { key: 'errand_budget_max', label: 'أقصى مبلغ بعد 3 طلبات', unit: 'جنيه' },
  { key: 'offer_seconds', label: 'وقت العرض على المندوب', unit: 'ثانية' },
];

/** «الإعدادات»: the few numbers and switches that run the business. */
export default function SettingsScreen() {
  const overview = useOverview();
  const toast = useToast((s) => s.show);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => setSetting(key, value),
    onSuccess: () => {
      refreshAll();
      toast('اتحفظ');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  if (overview.isPending) return <Loading />;
  if (overview.isError) return <ErrorState message={friendlyError(overview.error)} onRetry={() => overview.refetch()} />;
  const settings = overview.data.settings;
  const autoApprove = settings.auto_approve_drivers === 'true';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Txt weight={700} size={17}>
                تفعيل المناديب الجداد لوحدهم
              </Txt>
              <Txt size={14} color={autoApprove ? colors.warning : colors.body}>
                {autoApprove
                  ? 'شغّال دلوقتي للتجربة. اقفله قبل الإطلاق، وكل مندوب جديد هيستنى موافقتك.'
                  : 'مقفول: كل مندوب جديد بيستنى موافقتك في «المناديب والكاش».'}
              </Txt>
            </View>
            <Switch
              accessibilityLabel="تفعيل المناديب الجداد لوحدهم"
              value={autoApprove}
              onValueChange={(v) => save.mutate({ key: 'auto_approve_drivers', value: v ? 'true' : 'false' })}
              trackColor={{ true: colors.warning, false: colors.radioOff }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <View style={styles.grid}>
          {NUMBERS.map((n) => {
            const current = settings[n.key] ?? '';
            const draft = drafts[n.key] ?? current;
            const value = latinDigits(draft).replace(/[^\d]/g, '');
            return (
              <Card key={n.key} style={styles.numberCard}>
                <Txt weight={600} size={16}>
                  {n.label}
                </Txt>
                <View style={styles.row}>
                  <TextInput
                    accessibilityLabel={n.label}
                    keyboardType="number-pad"
                    value={draft}
                    onChangeText={(t) => setDrafts((d) => ({ ...d, [n.key]: t }))}
                    style={styles.input}
                  />
                  <Txt size={15} color={colors.body}>
                    {n.unit}
                  </Txt>
                </View>
                <PrimaryButton
                  label="احفظ"
                  disabled={!value || value === current || save.isPending}
                  onPress={() => save.mutate({ key: n.key, value })}
                />
              </Card>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  page: { width: '100%', maxWidth: 1100, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  numberCard: { flexBasis: 260, flexGrow: 1, gap: 10 },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.display700,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
});
