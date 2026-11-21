import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Txt, useInputSize } from '@/components/txt';
import { BottomBar, PrimaryButton, ScreenHeader, SecondaryButton } from '@/components/ui';
import { phoneError, sendPhoneCode, verifyPhoneCode, type PhoneCodeKind } from '@/data/api';
import { keys } from '@/data/queries';
import { formatPhone, latinDigits, normalizePhone, useSettings } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

const RESEND_AFTER = 60;

/** «أكّد رقمك»: a 6-digit SMS code ties the number to this account (orders stay as they are). */
export default function VerifyPhoneScreen() {
  const savedPhone = useSettings((s) => s.phone);
  const setPhone = useSettings((s) => s.setPhone);
  const toast = useToast((s) => s.show);
  const client = useQueryClient();
  const inputSize = useInputSize(20);

  const [draft, setDraft] = useState(savedPhone ?? '');
  const [sentTo, setSentTo] = useState<{ phone: string; kind: PhoneCodeKind } | null>(null);
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const phone = normalizePhone(draft);

  const send = useMutation({
    mutationFn: (p: string) => sendPhoneCode(p),
    onSuccess: (kind, p) => {
      setSentTo({ phone: p, kind });
      setWait(RESEND_AFTER);
      toast(`بعتنالك كود على ${formatPhone(p)}`);
    },
    onError: (e) => toast(phoneError(e)),
  });

  const verify = useMutation({
    mutationFn: () => verifyPhoneCode(sentTo!.phone, code, sentTo!.kind),
    onSuccess: () => {
      setPhone(sentTo!.phone);
      client.invalidateQueries({ queryKey: keys.verifiedPhone });
      toast('رقمك اتأكد');
      if (router.canGoBack()) router.back();
      else router.replace('/account');
    },
    onError: (e) => toast(phoneError(e)),
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="أكّد رقمك" />
      <View style={styles.content}>
        <View style={styles.icon}>
          <Icon name="phone" size={34} color={colors.accent} />
        </View>
        {sentTo ? (
          <>
            <Txt display weight={700} size={20} align="center">
              اكتب الكود اللي وصلك
            </Txt>
            <Txt size={15} color={colors.body} align="center">
              بعتناه في رسالة على {formatPhone(sentTo.phone)}
            </Txt>
            <TextInput
              accessibilityLabel="كود التأكيد"
              value={code}
              onChangeText={(t) => setCode(latinDigits(t).replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              placeholder="● ● ● ● ● ●"
              placeholderTextColor={colors.radioOff}
              style={[styles.input, styles.code, { fontSize: inputSize + 6 }]}
            />
            <SecondaryButton
              label={wait > 0 ? `تقدر تطلب كود تاني بعد ${wait} ثانية` : 'ابعتلي كود تاني'}
              onPress={() => (wait > 0 ? undefined : send.mutate(sentTo.phone))}
            />
            <SecondaryButton label="غيّر الرقم" onPress={() => setSentTo(null)} />
          </>
        ) : (
          <>
            <Txt display weight={700} size={20} align="center">
              رقم موبايلك
            </Txt>
            <Txt size={15} color={colors.body} align="center">
              هنبعتلك كود في رسالة. رقمك بيخلّي طلباتك وعناوينك معاك لو غيّرت الموبايل، والمحل والمندوب يقدروا يكلموك.
            </Txt>
            <TextInput
              accessibilityLabel="رقم الموبايل"
              value={draft}
              onChangeText={setDraft}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              placeholder="01012345678"
              placeholderTextColor={colors.radioOff}
              style={[styles.input, { fontSize: inputSize }]}
            />
            {draft && !phone ? (
              <Txt size={14} color={colors.danger} align="center">
                اكتب رقم موبايل مصري من 11 رقم، زي 01012345678
              </Txt>
            ) : null}
          </>
        )}
      </View>
      <BottomBar>
        {sentTo ? (
          <PrimaryButton label={verify.isPending ? 'لحظة…' : 'تأكيد'} disabled={code.length !== 6 || verify.isPending} onPress={() => verify.mutate()} />
        ) : (
          <PrimaryButton label={send.isPending ? 'بنبعت…' : 'ابعتلي كود'} disabled={!phone || send.isPending} onPress={() => phone && send.mutate(phone)} />
        )}
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { flex: 1, padding: 20, gap: 12, alignItems: 'stretch' },
  icon: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, marginTop: 12 },
  input: {
    height: 58,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body500,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 1,
  },
  code: { letterSpacing: 10 },
});
