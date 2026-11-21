import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WawLogo } from '@/components/brand';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { Card, ErrorState } from '@/components/ui';
import { friendlyError, type EarningsBlock } from '@/data/api';
import { useEarnings, useMe } from '@/data/queries';
import { formatPhone, money } from '@/lib/format';
import { colors, radius } from '@/theme';

const vehicleName = { bicycle: 'عجلة', scooter: 'سكوتر', motorcycle: 'موتوسيكل' } as const;

/** «فلوسي»: what you earned and the cash you're holding, today and this week. */
export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const e = useEarnings();
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <WawLogo size={38} />
        <View style={styles.flex}>
          <Txt display weight={700} size={22} color={colors.onAccent}>
            فلوسي
          </Txt>
          <Txt size={14} color={colors.onAccentSoft}>
            {me.data ? `${me.data.name} · ${vehicleName[me.data.vehicle]} · ${formatPhone(me.data.phone)}` : ''}
          </Txt>
        </View>
      </View>
      {e.isPending ? (
        <StoreListSkeleton rows={2} />
      ) : e.isError ? (
        <ErrorState message={friendlyError(e.error)} onRetry={() => e.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Cash held={e.data.cashHeld} limit={e.data.cashLimit} />
          <Block title="النهارده" data={e.data.today} big />
          <Block title="الأسبوع ده" data={e.data.week} />
          <View style={styles.note}>
            <Txt size={16} weight={600}>
              أجرك بيتحوّلك كل أسبوع
            </Txt>
            <Txt size={15} color={colors.body}>
              على فودافون كاش أو إنستاباي، والبقشيش كله ليك. الكاش اللي بتحصّله من الزبائن بتورّده كل يوم بفوري أو إنستاباي، ومبتدفعش للمحلات أي حاجة.
            </Txt>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** The cash he holds against his limit: over it, only transfer-paid orders reach him. */
function Cash({ held, limit }: { held: number; limit: number }) {
  const share = Math.min(1, held / Math.max(1, limit));
  const full = held >= limit;
  const near = !full && share >= 0.8;
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Txt display weight={700} size={20}>
          كاش معاك دلوقتي
        </Txt>
        <Txt size={15} color={colors.body}>
          الحد {money(limit)}
        </Txt>
      </View>
      <Txt display weight={700} size={30} color={full ? colors.danger : colors.ink}>
        {money(held)}
      </Txt>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${Math.round(share * 100)}%`, backgroundColor: full ? colors.danger : near ? colors.warning : colors.success }]} />
      </View>
      <Txt size={15} color={full ? colors.danger : colors.body}>
        {full
          ? 'وصلت للحد. ورّد الكاش عشان ترجعلك طلبات الكاش، وطلبات التحويل شغالة عادي.'
          : near
            ? 'قربت من الحد. ورّد النهارده عشان طلبات الكاش متقفش.'
            : 'ورّد الكاش كل يوم بفوري أو إنستاباي على حساب وقتي، والحد بيكبر مع الوقت.'}
      </Txt>
    </Card>
  );
}

function Block({ title, data, big = false }: { title: string; data: EarningsBlock; big?: boolean }) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Txt display weight={700} size={20}>
          {title}
        </Txt>
        <Txt size={15} color={colors.body}>
          {data.trips ? `${data.trips} مشوار` : 'لسه مفيش مشاوير'}
        </Txt>
      </View>
      <View style={styles.earned}>
        <Txt size={15} color={colors.onAccentSoft}>
          أجرك
        </Txt>
        <Txt display weight={700} size={big ? 36 : 28} color={colors.onAccent}>
          {money(data.earned)}
        </Txt>
      </View>
      <View style={styles.row}>
        <Txt size={17} style={styles.flex}>
          كاش حصّلته من الزبائن
        </Txt>
        <Txt size={17} weight={600}>
          {money(data.cash)}
        </Txt>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.accent },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  earned: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.accent, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.field },
  barFill: { height: 8, borderRadius: 4 },
  note: { padding: 16, gap: 6, borderRadius: radius.lg, backgroundColor: colors.mintSoft },
});
