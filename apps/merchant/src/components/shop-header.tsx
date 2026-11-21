import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { friendlyError, setOpen, type MerchantStore } from '@/data/api';
import { refreshAll, useShop } from '@/data/queries';
import { clockTime } from '@/lib/format';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

import { WawLogo } from './brand';
import { Icon } from './icon';
import { Txt } from './txt';
import { PrimaryButton, SecondaryButton, Sheet, styles as ui } from './ui';

type ShopState = 'open' | 'paused' | 'closed';

export function shopState(shop: MerchantStore, now = Date.now()): ShopState {
  if (!shop.isOpen) return 'closed';
  if (shop.pausedUntil && new Date(shop.pausedUntil).getTime() > now) return 'paused';
  return 'open';
}

const stateLook: Record<ShopState, { label: string; dot: string }> = {
  open: { label: 'مفتوح وبيستقبل طلبات', dot: colors.mint },
  paused: { label: 'مشغول', dot: colors.saffronDot },
  closed: { label: 'مقفول', dot: '#FF8A8A' },
};

/** Violet top bar on every tab: the shop's name and whether it takes orders, one tap to change. */
export function ShopHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const toast = useToast((s) => s.show);
  const [open, setOpenSheet] = useState(false);

  const change = useMutation({
    mutationFn: ({ isOpen, pause }: { isOpen: boolean; pause: number }) => setOpen(isOpen, pause),
    onSuccess: (_, v) => {
      setOpenSheet(false);
      refreshAll();
      toast(!v.isOpen ? 'المحل اتقفل، مش هيجيلك طلبات' : v.pause ? `مش هيجيلك طلبات جديدة لمدة ${v.pause} دقيقة` : 'المحل مفتوح وبيستقبل طلبات');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const data = shop.data;
  const state = data ? shopState(data, shop.dataUpdatedAt) : 'open';
  const look = stateLook[state];

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <WawLogo size={38} />
          <View>
            <Txt display weight={700} size={22} color={colors.onAccent}>
              {title}
            </Txt>
            <Txt size={14} color={colors.onAccentSoft} numberOfLines={1}>
              {data?.name ?? ''}
            </Txt>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`حالة المحل: ${look.label}. غيّرها`}
          onPress={() => setOpenSheet(true)}
          style={({ pressed }) => [styles.state, pressed && ui.pressed]}>
          <View style={[styles.dot, { backgroundColor: look.dot }]} />
          <Txt size={14} weight={600} color={colors.onAccent}>
            {state === 'paused' && data?.pausedUntil ? `مشغول لحد ${clockTime(data.pausedUntil)}` : look.label.split(' ')[0]}
          </Txt>
          <Icon name="chevronDown" size={18} color={colors.onAccent} />
        </Pressable>
      </View>

      <Sheet visible={open} onClose={() => setOpenSheet(false)} title="حالة المحل">
        <Txt size={16} color={colors.body}>
          دلوقتي: {look.label}
          {state === 'paused' && data?.pausedUntil ? ` لحد ${clockTime(data.pausedUntil)}` : ''}
        </Txt>
        <View style={styles.actions}>
          <PrimaryButton label="مفتوح وبيستقبل طلبات" onPress={() => change.mutate({ isOpen: true, pause: 0 })} />
          <SecondaryButton label="مشغول 20 دقيقة" onPress={() => change.mutate({ isOpen: true, pause: 20 })} />
          <SecondaryButton label="مشغول ساعة" onPress={() => change.mutate({ isOpen: true, pause: 60 })} />
          <SecondaryButton label="اقفل المحل" tone={colors.danger} onPress={() => change.mutate({ isOpen: false, pause: 0 })} />
        </View>
        <Txt size={14} color={colors.muted}>
          «مشغول» مش بيتحسب عليك. الطلبات اللي معاك بتكمّل عادي.
        </Txt>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  state: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actions: { gap: 10, marginTop: 4 },
});
