import { Redirect, router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WawLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { Txt } from '@/components/txt';
import { Loading, styles as ui } from '@/components/ui';
import { signOut } from '@/data/api';
import { queryClient, useIsAdmin, useOverview } from '@/data/queries';
import { colors, radius } from '@/theme';

/** Admins only: the panel's header with its sections, then the section itself. */
export default function TabsLayout() {
  const isAdmin = useIsAdmin();
  const overview = useOverview();
  if (isAdmin.isPending) return <Loading />;
  if (!isAdmin.data) return <Redirect href="/login" />;

  const o = overview.data;
  const pendingDrivers = o?.drivers.filter((d) => d.status === 'pending').length ?? 0;
  const toReview = (o?.photos.length ?? 0) + (o?.shopProducts.length ?? 0);

  return (
    <Tabs style={styles.tabs}>
      <TabList asChild>
        <Header>
          <TabTrigger name="index" href="/" asChild>
            <NavButton icon="receipt" label="النهارده" count={o?.live.filter((x) => x.late).length} />
          </TabTrigger>
          <TabTrigger name="drivers" href="/drivers" asChild>
            <NavButton icon="moto" label="المناديب والكاش" count={pendingDrivers} />
          </TabTrigger>
          <TabTrigger name="review" href="/review" asChild>
            <NavButton icon="camera" label="الصور والمنتجات" count={toReview} />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <NavButton icon="list" label="الإعدادات" />
          </TabTrigger>
        </Header>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function Header({ style, children, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headRow}>
        <View style={styles.brand}>
          <WawLogo size={36} />
          <Txt display weight={700} size={20} color={colors.onAccent}>
            وقتي — الإدارة
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await signOut();
            queryClient.clear();
            router.replace('/login');
          }}
          style={({ pressed }) => [styles.signOut, pressed && ui.pressed]}>
          <Txt size={14} weight={600} color={colors.onAccent}>
            خروج
          </Txt>
        </Pressable>
      </View>
      <View {...props} style={styles.nav}>
        {children}
      </View>
    </View>
  );
}

function NavButton({
  isFocused,
  icon,
  label,
  count,
  children: _children,
  style: _style,
  ref: _ref,
  ...props
}: TabTriggerSlotProps & { icon: IconName; label: string; count?: number }) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={[styles.navButton, isFocused && styles.navOn]}>
      <Icon name={icon} size={20} color={isFocused ? colors.accent : colors.onAccent} strokeWidth={2} />
      <Txt size={15} weight={600} color={isFocused ? colors.accent : colors.onAccent}>
        {label}
      </Txt>
      {count ? (
        <View style={styles.count}>
          <Txt size={13} weight={700} color={colors.white}>
            {count}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, gap: 10, backgroundColor: colors.accent },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signOut: { height: 40, paddingHorizontal: 14, borderRadius: radius.md, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  navOn: { backgroundColor: colors.card },
  count: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
});
