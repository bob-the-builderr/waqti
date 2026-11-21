import { Redirect } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Txt } from '@/components/txt';
import { Loading, PrimaryButton } from '@/components/ui';
import { useMe } from '@/data/queries';
import { colors } from '@/theme';

export default function TabsLayout() {
  const me = useMe();
  if (me.isPending) return <Loading />;
  // Not signed up yet: open sign-up first.
  if (!me.data) return <Redirect href="/register" />;
  // Signed up but not approved yet (or stopped): no trips until our team says so.
  if (me.data.status !== 'active') return <Review status={me.data.status} onCheck={() => me.refetch()} />;

  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="moto" label="الشغل" />
          </TabTrigger>
          <TabTrigger name="earnings" href="/earnings" asChild>
            <TabButton icon="cash" label="فلوسي" />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

/** «حسابك تحت المراجعة»: what a new driver sees until our team checks his ID and licence. */
function Review({ status, onCheck }: { status: 'pending' | 'suspended' | 'active'; onCheck: () => void }) {
  const insets = useSafeAreaInsets();
  const pending = status === 'pending';
  return (
    <View style={[styles.review, { paddingTop: insets.top + 64, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.reviewBody}>
        <Icon name={pending ? 'clock' : 'shield'} size={64} color={colors.onAccent} strokeWidth={1.6} />
        <Txt display weight={700} size={26} color={colors.onAccent} align="center">
          {pending ? 'حسابك تحت المراجعة' : 'حسابك موقوف'}
        </Txt>
        <Txt size={17} color={colors.onAccentSoft} align="center">
          {pending
            ? 'فريق وقتي هيكلمك على رقمك يحدد معاك ميعاد تجيب فيه البطاقة والرخصة. أول ما نوافق، المشاوير هتبدأ توصلك.'
            : 'كلّم فريق وقتي عشان تعرف السبب وترجع تشتغل.'}
        </Txt>
      </View>
      <PrimaryButton label="شوف وصلت لفين" tone={colors.white} textColor={colors.accent} onPress={onCheck} />
    </View>
  );
}

function TabBar({ style, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return <View {...props} style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} />;
}

function TabButton({
  isFocused,
  icon,
  label,
  children: _children,
  style: _style,
  ref: _ref,
  ...props
}: TabTriggerSlotProps & { icon: IconName; label: string }) {
  const tint = isFocused ? colors.accent : colors.muted;
  return (
    <Pressable {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: isFocused }} style={styles.button}>
      <Icon name={icon} size={28} color={tint} strokeWidth={isFocused ? 2.1 : 1.8} />
      <Txt size={15} weight={600} color={tint}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  bar: { flexDirection: 'row', paddingTop: 8, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
  review: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', backgroundColor: colors.accent },
  reviewBody: { alignItems: 'center', gap: 14 },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 60 },
});
