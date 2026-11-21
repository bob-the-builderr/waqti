import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useToast } from '@/state/toast';
import { colors, elevation, radius } from '@/theme';

import { Icon, type IconName } from './icon';
import { Txt } from './txt';

/** Top bar with a back button, for screens pushed on the stack. Brand violet, white text. */
export function ScreenHeader({ title, trailing }: { title: string; trailing?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Icon name="back" size={22} strokeWidth={2} color={colors.onAccent} />
        <Txt size={14} weight={500} color={colors.onAccent}>
          رجوع
        </Txt>
      </Pressable>
      <Txt display weight={600} size={18} numberOfLines={1} color={colors.onAccent} style={styles.headerTitle}>
        {title}
      </Txt>
      {trailing}
    </View>
  );
}

/** Title bar for the four tab screens. Brand violet, white text. */
export function TabHeader({ title, trailing, children }: { title: string; trailing?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabHeader, { paddingTop: insets.top + 14 }]}>
      <View style={styles.tabHeaderRow}>
        <Txt display weight={700} size={22} color={colors.onAccent}>
          {title}
        </Txt>
        {trailing}
      </View>
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected ? styles.chipOn : styles.chipOff, pressed && styles.pressed]}>
      <Txt size={15} weight={500} color={selected ? colors.white : colors.ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Badge({ label, tone = colors.accentSoft, color = colors.accent }: { label: string; tone?: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone }]}>
      <Txt size={13} weight={600} color={color}>
        {label}
      </Txt>
    </View>
  );
}

/** The promise on every store: one number, the latest it will arrive. */
export function GuaranteeChip({ minutes }: { minutes: number }) {
  return (
    <View style={styles.guarantee}>
      <Icon name="shield" size={15} color={colors.success} strokeWidth={2} />
      <Txt size={13} weight={600} color={colors.success}>
        مضمون خلال {minutes} دقيقة
      </Txt>
    </View>
  );
}

/** A tinted strip with an icon, for promises like "same price as the store". */
export function Banner({ icon, tone = colors.accentSoft, iconColor = colors.accent, children, style }: {
  icon: IconName;
  tone?: string;
  iconColor?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.banner, { backgroundColor: tone }, style]}>
      <Icon name={icon} size={24} color={iconColor} />
      <View style={styles.bannerText}>{children}</View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, trailing, onPress, tone = colors.accent, textColor = colors.white, disabled }: {
  label: string;
  trailing?: string;
  onPress: () => void;
  tone?: string;
  textColor?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: tone, justifyContent: trailing ? 'space-between' : 'center' },
        disabled && styles.disabled,
        pressed && styles.pressedButton,
      ]}>
      <Txt weight={600} size={17} color={textColor}>
        {label}
      </Txt>
      {trailing ? (
        <Txt weight={600} size={17} color={textColor}>
          {trailing}
        </Txt>
      ) : null}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, tone = colors.accent }: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { borderColor: tone }, pressed && styles.pressedButton]}>
      {icon ? <Icon name={icon} size={20} color={tone} strokeWidth={2} /> : null}
      <Txt weight={600} size={16} color={tone}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** The operations phone behind «محتاج مساعدة؟»; set EXPO_PUBLIC_SUPPORT_PHONE before any public test. */
export const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '';

export function callNumber(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() => undefined);
}

export function askForHelp() {
  if (SUPPORT_PHONE) callNumber(SUPPORT_PHONE);
  else showComingSoon('خط المساعدة');
}

/** Fixed bar under a screen's scroll area, for its main action. */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>{children}</View>;
}

/** A panel that slides up from the bottom, for choices that need a clear answer. */
export function Sheet({ visible, onClose, title, children }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="اقفل" style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
        <View style={styles.grabber} />
        <Txt display weight={700} size={20}>
          {title}
        </Txt>
        <View style={styles.sheetBody}>{children}</View>
      </View>
    </Modal>
  );
}

/** "Coming soon" for features that aren't open yet, instead of a dead button. */
const useComingSoon = create<{ title: string | null; open: (title: string) => void; close: () => void }>((set) => ({
  title: null,
  open: (title) => set({ title }),
  close: () => set({ title: null }),
}));

export const showComingSoon = (title: string) => useComingSoon.getState().open(title);

export function ComingSoonHost() {
  const title = useComingSoon((s) => s.title);
  const close = useComingSoon((s) => s.close);
  const toast = useToast((s) => s.show);
  return (
    <Sheet visible={!!title} onClose={close} title={title ?? ''}>
      <Txt size={16} color={colors.body}>
        الخدمة دي هتشتغل قريب جداً. نبلّغك أول ما تبقى جاهزة؟
      </Txt>
      <View style={styles.sheetActions}>
        <PrimaryButton
          label="أيوه، بلّغني"
          onPress={() => {
            close();
            toast('تمام، هنبلّغك أول ما تشتغل');
          }}
        />
        <SecondaryButton label="مش دلوقتي" onPress={close} />
      </View>
    </Sheet>
  );
}

export function ToastHost() {
  const message = useToast((s) => s.message);
  const action = useToast((s) => s.action);
  const hide = useToast((s) => s.hide);
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    // Near the bottom, just above the cart bar: close to the finger that caused it, and clear of «رجوع».
    <View pointerEvents="box-none" style={[styles.toastWrap, { bottom: insets.bottom + 150 }]}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}>
        <Txt size={16} color={colors.white} style={styles.toastText}>
          {message}
        </Txt>
        {action ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              action.onPress();
              hide();
            }}
            style={({ pressed }) => [styles.toastAction, pressed && styles.pressed]}>
            <Txt size={16} weight={600} color={colors.mint}>
              {action.label}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Txt weight={600} size={16} align="center">
        {message}
      </Txt>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
        <Txt weight={600} size={16} color={colors.white}>
          جرّب تاني
        </Txt>
      </Pressable>
    </View>
  );
}

export const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  pressedButton: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  retry: { height: 48, paddingHorizontal: 22, borderRadius: radius.md, backgroundColor: colors.accent, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.accent,
  },
  headerTitle: { flex: 1 },
  backButton: { height: 44, paddingHorizontal: 8, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 2 },
  tabHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.accent,
  },
  tabHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipOff: { backgroundColor: colors.card, borderColor: colors.border },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  guarantee: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  bannerText: { flex: 1 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card, ...elevation.card },
  primary: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondary: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  bottomBar: {
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.card,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  sheetBody: { marginTop: 10, gap: 12 },
  sheetActions: { marginTop: 8, gap: 10 },
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    maxWidth: 460,
    ...elevation.raised,
  },
  toastText: { flexShrink: 1 },
  toastAction: { paddingVertical: 4, paddingHorizontal: 6 },
});
