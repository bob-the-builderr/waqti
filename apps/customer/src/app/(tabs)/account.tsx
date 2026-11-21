import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Txt, useInputSize } from '@/components/txt';
import { Card, PrimaryButton, TabHeader, showComingSoon, styles as ui } from '@/components/ui';
import { useVerifiedPhone } from '@/data/queries';
import { formatPhone, normalizePhone, useSettings } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

export default function AccountScreen() {
  const bigText = useSettings((s) => s.bigText);
  const setBigText = useSettings((s) => s.setBigText);
  const phone = useSettings((s) => s.phone);
  const setPhone = useSettings((s) => s.setPhone);
  const toast = useToast((s) => s.show);
  const verified = useVerifiedPhone();
  const inputSize = useInputSize(18);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const normalized = normalizePhone(draft);
    if (!normalized) return setError('اكتب رقم موبايل مصري من 11 رقم، زي 01012345678');
    setPhone(normalized);
    setEditing(false);
    setError(null);
    toast('رقمك اتحفظ');
  };

  return (
    <View style={styles.screen}>
      <TabHeader title="حسابي" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Txt weight={600} size={16}>
            رقم موبايلك
          </Txt>
          {editing || !phone ? (
            <>
              <Txt size={14} color={colors.body}>
                عشان المحل والمندوب يقدروا يكلموك.
              </Txt>
              <TextInput
                accessibilityLabel="رقم موبايلك"
                placeholder="01012345678"
                placeholderTextColor={colors.radioOff}
                keyboardType="phone-pad"
                maxLength={14}
                value={draft}
                onChangeText={(t) => {
                  setDraft(t);
                  if (error) setError(null);
                }}
                onSubmitEditing={save}
                style={[styles.input, { fontSize: inputSize }, error ? styles.inputError : null]}
              />
              {error ? (
                <Txt size={15} weight={500} color={colors.danger}>
                  {error}
                </Txt>
              ) : null}
              <PrimaryButton label="احفظ الرقم" onPress={save} />
            </>
          ) : (
            <View style={styles.row}>
              <Txt size={18} weight={600} style={styles.flex}>
                {formatPhone(phone)}
              </Txt>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  setDraft(phone);
                  setEditing(true);
                }}>
                <Txt size={15} weight={600} color={colors.accent}>
                  تغيير
                </Txt>
              </Pressable>
            </View>
          )}
          {/* Confirmed by SMS: the number is tied to the account, so orders follow the customer to a new phone. */}
          {verified.data && verified.data === phone ? (
            <View style={styles.verified}>
              <Icon name="check" size={18} color={colors.success} strokeWidth={2.4} />
              <Txt size={14} weight={600} color={colors.success}>
                رقمك متأكد بكود
              </Txt>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push('/verify-phone')} style={({ pressed }) => [styles.verify, pressed && ui.pressed]}>
              <Icon name="shield" size={20} color={colors.accent} />
              <Txt size={15} weight={600} color={colors.accent} style={styles.flex}>
                أكّد رقمك بكود عشان طلباتك تفضل معاك
              </Txt>
              <Icon name="forward" size={18} color={colors.accent} />
            </Pressable>
          )}
        </Card>

        <Card style={styles.gap}>
          <View style={styles.row}>
            <Icon name="text" size={26} color={colors.accent} />
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                خط كبير
              </Txt>
              <Txt size={14} color={colors.body}>
                كل الكلام في التطبيق يكبر شوية.
              </Txt>
            </View>
            <Switch
              accessibilityLabel="خط كبير"
              value={bigText}
              onValueChange={setBigText}
              trackColor={{ true: colors.accent, false: colors.radioOff }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <View style={styles.gap}>
          <Item icon="pin" label="عناويني" onPress={() => router.push('/address')} />
          <Item icon="phone" label="كلّمنا على واتساب" onPress={() => showComingSoon('الدعم على واتساب')} />
        </View>
      </ScrollView>
    </View>
  );
}

function Item({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.item, pressed && ui.pressed]}>
      <Icon name={icon} size={22} color={colors.accent} />
      <Txt size={16} weight={500} style={styles.flex}>
        {label}
      </Txt>
      <Icon name="forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 32 },
  gap: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  input: {
    marginVertical: 10,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body600,
    color: colors.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  inputError: { borderColor: colors.danger },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
});
