import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WawLogo } from '@/components/brand';
import { Txt, useInputSize } from '@/components/txt';
import { PrimaryButton } from '@/components/ui';
import { friendlyError, linkShop } from '@/data/api';
import { refreshAll } from '@/data/queries';
import { latinDigits } from '@/state/settings';
import { colors, fonts, radius } from '@/theme';

/** First launch: the shop types the staff code our field team gave it. */
export default function LinkScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputSize = useInputSize(26);

  const link = useMutation({
    mutationFn: linkShop,
    onSuccess: () => {
      refreshAll();
      router.replace('/');
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const submit = () => {
    const value = latinDigits(code).replace(/\D/g, '');
    if (value.length < 6) return setError('الكود 6 أرقام');
    if (!link.isPending) link.mutate(value);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 48, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.top}>
        <WawLogo size={72} />
        <Txt display weight={700} size={30} color={colors.onAccent}>
          وقتي للمحلات
        </Txt>
        <Txt size={17} color={colors.onAccentSoft} align="center">
          الطلبات بترن عندك، تدوس «قبول» وخلاص.
        </Txt>
      </View>

      <View style={styles.card}>
        <Txt weight={600} size={18}>
          اكتب كود المحل
        </Txt>
        <Txt size={15} color={colors.body}>
          الكود 6 أرقام، بيديهولك فريق وقتي لما يسجّل محلك.
        </Txt>
        <TextInput
          accessibilityLabel="كود المحل"
          placeholder="000000"
          placeholderTextColor={colors.radioOff}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(t) => {
            setCode(t);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          style={[styles.input, { fontSize: inputSize }, error ? styles.inputError : null]}
        />
        {error ? (
          <Txt size={15} weight={500} color={colors.danger}>
            {error}
          </Txt>
        ) : null}
        <PrimaryButton label={link.isPending ? 'بنفتح المحل…' : 'ادخل'} disabled={link.isPending} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, backgroundColor: colors.accent, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: 12 },
  card: { gap: 12, padding: 20, borderRadius: radius.xl, backgroundColor: colors.card },
  input: {
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body600,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 8,
    writingDirection: 'ltr',
  },
  inputError: { borderColor: colors.danger },
});
