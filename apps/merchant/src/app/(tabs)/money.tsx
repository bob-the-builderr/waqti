import { ScrollView, StyleSheet, View } from 'react-native';

import { ShopHeader } from '@/components/shop-header';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { Card, ErrorState } from '@/components/ui';
import { friendlyError, type MoneyBlock } from '@/data/api';
import { useMoney } from '@/data/queries';
import { money, ordersWord } from '@/lib/format';
import { colors, radius } from '@/theme';

/** «فلوس النهارده»: what the shop sold, what we take, what it gets. Nothing else. */
export default function MoneyScreen() {
  const m = useMoney();
  return (
    <View style={styles.screen}>
      <ShopHeader title="الفلوس" />
      {m.isPending ? (
        <StoreListSkeleton rows={2} />
      ) : m.isError ? (
        <ErrorState message={friendlyError(m.error)} onRetry={() => m.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Block title="النهارده" data={m.data.today} big />
          <Block title="الأسبوع ده" data={m.data.week} />
          <View style={styles.note}>
            <Txt size={16} weight={600}>
              فلوسك بتتحوّلك كل أسبوع
            </Txt>
            <Txt size={15} color={colors.body}>
              وقتي بتحصّل فلوس الطلبات من الزبون، كاش أو تحويل، وبتحوّلك صافي حقك كل أسبوع على إنستاباي أو حسابك في البنك بعد العمولة. مفيش حاجة تدفعها مقدّم.
            </Txt>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Block({ title, data, big = false }: { title: string; data: MoneyBlock; big?: boolean }) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Txt display weight={700} size={20}>
          {title}
        </Txt>
        <Txt size={15} color={colors.body}>
          {data.orders ? ordersWord(data.orders) : 'لسه مفيش طلبات'}
        </Txt>
      </View>
      <View style={styles.net}>
        <Txt size={15} color={colors.onAccentSoft}>
          ليك
        </Txt>
        <Txt display weight={700} size={big ? 36 : 28} color={colors.onAccent}>
          {money(data.net)}
        </Txt>
      </View>
      <Row label="المبيعات" value={money(data.sales)} />
      <Row label="عمولة وقتي" value={`− ${money(data.commission)}`} />
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt size={17} style={styles.flex}>
        {label}
      </Txt>
      <Txt size={17} weight={600}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  net: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.accent, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  note: { padding: 16, gap: 6, borderRadius: radius.lg, backgroundColor: colors.mintSoft },
});
