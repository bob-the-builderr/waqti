import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AddressCard, PaymentChoice, PhoneField } from '@/components/order-form';
import { Txt, useInputSize } from '@/components/txt';
import { Banner, BottomBar, Chip, PrimaryButton, ScreenHeader } from '@/components/ui';
import { friendlyError, placeErrand } from '@/data/api';
import { keys, queryClient } from '@/data/queries';
import { money } from '@/lib/pricing';
import { latinDigits, normalizePhone, useSettings } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

/** Shown to the customer; the server's own fee (app_settings.errand_fee) is what's charged. */
const ERRAND_FEE = 30;
const BUDGETS = [100, 200, 300, 500];

/**
 * «هاتلي أي حاجة»: write what you need (and from where, if it matters), set the
 * most you want spent. A rider buys it, photographs the receipt, and you pay
 * exactly the receipt plus the errand fee.
 */
export default function ErrandScreen() {
  const savedPhone = useSettings((s) => s.phone);
  const setPhone = useSettings((s) => s.setPhone);
  const toast = useToast((s) => s.show);
  const inputSize = useInputSize(16);

  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [budget, setBudget] = useState(200);
  const [custom, setCustom] = useState('');
  const [payment, setPayment] = useState<'cash' | 'wallet'>('cash');
  const [phone, setPhoneDraft] = useState(savedPhone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const cap = custom ? Number(latinDigits(custom).replace(/[^\d]/g, '')) : budget;

  const send = useMutation({
    mutationFn: (p: string) => placeErrand({ text: text.trim(), from: from.trim(), budget: cap, payment, phone: p }),
    onSuccess: (placed) => {
      queryClient.invalidateQueries({ queryKey: keys.orders });
      router.replace(`/order/${placed.orderId}`);
    },
    onError: (e) => {
      const capNow = (e as { cap?: number }).cap;
      toast(capNow ? `أقصى مبلغ دلوقتي ${money(capNow)}. بيكبر بعد 3 طلبات` : friendlyError(e));
    },
  });

  const submit = () => {
    const p = normalizePhone(phone);
    if (!p) return setPhoneError('اكتب رقم موبايل مصري من 11 رقم، زي 01012345678');
    setPhoneError(null);
    setPhone(p);
    send.mutate(p);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="هاتلي أي حاجة" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.block}>
          <Txt display weight={700} size={19}>
            عايز إيه؟
          </Txt>
          <TextInput
            accessibilityLabel="عايز إيه"
            placeholder={'مثلاً: 2 كيلو برتقال، علبة بنادول، وشاحن موبايل تايب سي'}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            maxLength={500}
            multiline
            style={[styles.area, { fontSize: inputSize }]}
          />
        </View>
        <View style={styles.block}>
          <Txt display weight={600} size={17}>
            من محل معيّن؟ (مش لازم)
          </Txt>
          <TextInput
            accessibilityLabel="من فين"
            placeholder="مثلاً: مكتبة الجامعة اللي جنب البنك"
            placeholderTextColor={colors.muted}
            value={from}
            onChangeText={setFrom}
            maxLength={120}
            style={[styles.input, { fontSize: inputSize }]}
          />
        </View>

        <View style={styles.block}>
          <Txt display weight={600} size={17}>
            أقصى مبلغ يصرفه المندوب
          </Txt>
          <View style={styles.chips}>
            {BUDGETS.map((b) => (
              <Chip
                key={b}
                label={money(b)}
                selected={!custom && budget === b}
                onPress={() => {
                  setCustom('');
                  setBudget(b);
                }}
              />
            ))}
          </View>
          <TextInput
            accessibilityLabel="مبلغ تاني"
            placeholder="أو اكتب مبلغ"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={custom}
            onChangeText={setCustom}
            style={[styles.input, { fontSize: inputSize }]}
          />
          <Txt size={14} color={colors.muted}>
            لو الحاجات أغلى من كده، المندوب هيكلمك الأول.
          </Txt>
        </View>

        <Banner icon="receipt">
          <Txt size={14} color={colors.body}>
            هتدفع تمن الحاجات بالفاتورة اللي المندوب هيصوّرهالك، + {money(ERRAND_FEE)} توصيل.
          </Txt>
        </Banner>

        <AddressCard />
        <PhoneField value={phone} onChange={setPhoneDraft} error={phoneError} />
        <PaymentChoice value={payment} onChange={setPayment} />
      </ScrollView>
      <BottomBar>
        <PrimaryButton
          label={send.isPending ? 'بنبعت…' : 'اطلب مندوب'}
          disabled={text.trim().length < 3 || !cap || send.isPending}
          onPress={submit}
        />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 16, gap: 16, paddingBottom: 130 },
  block: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  area: {
    minHeight: 110,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body400,
    color: colors.ink,
    textAlign: 'right',
    textAlignVertical: 'top',
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body400,
    color: colors.ink,
    textAlign: 'right',
  },
});
