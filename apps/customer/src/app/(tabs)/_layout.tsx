import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Txt } from '@/components/txt';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home" label="الرئيسية" />
          </TabTrigger>
          <TabTrigger name="stores" href="/stores" asChild>
            <TabButton icon="store" label="المحلات" />
          </TabTrigger>
          <TabTrigger name="orders" href="/orders" asChild>
            <TabButton icon="receipt" label="طلباتي" />
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton icon="user" label="حسابي" />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
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
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={styles.button}>
      <Icon name={icon} size={26} color={tint} strokeWidth={isFocused ? 2.1 : 1.8} />
      <Txt size={14} weight={600} color={tint}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56 },
});
