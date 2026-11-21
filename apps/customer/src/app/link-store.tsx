import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Txt, useInputSize } from '@/components/txt';
import { BottomBar, PrimaryButton, ScreenHeader, SecondaryButton } from '@/components/ui';
import { friendlyError, linkStore } from '@/data/api';
import { keys, queryClient } from '@/data/queries';
import { latinDigits } from '@/state/settings';
import { colors, fonts, radius } from '@/theme';

/** Typing the code from a store's sticker; the phone build will also scan it with the camera. */
export default function LinkStoreScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<{ storeId: string; name: string } | null>(null);
  const inputSize = useInputSize(20);

  const link = useMutation({
    mutationFn: linkStore,
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: keys.linked });
      setLinked(store);
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const submit = () => {
    const value = latinDigits(code).trim();
    if (!value) return setError('اكتب الكود الأول');
    if (!link.isPending) link.mutate(value);
  };

  if (linked) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="ضيف محلك" />
        <View style={styles.body}>
          <View style={[styles.icon, { backgroundColor: colors.successSoft }]}>
            <Icon name="check" size={44} color={colors.success} strokeWidth={2.4} />
          </View>
          <Txt display weight={700} size={20} align="center">
            {linked.name} بقى من محلاتك
          </Txt>
          <Txt size={16} color={colors.body} align="center">
            نفس أسعاره ونفس معاملته، وهيفضل أول محل قدامك.
          </Txt>
        </View>
        <BottomBar>
          <View style={styles.actions}>
            <PrimaryButton label={`اطلب من ${linked.name}`} onPress={() => router.replace(`/store/${linked.storeId}`)} />
            <SecondaryButton label="ارجع للرئيسية" onPress={() => router.replace('/')} />
          </View>
        </BottomBar>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="ضيف محلك" />
      <View style={styles.body}>
        <View style={styles.icon}>
          <Icon name="qr" size={40} color={colors.accent} strokeWidth={1.6} />
        </View>
        <Txt weight={600} size={18} align="center">
          اكتب الرقم المكتوب على ورقة المحل
        </Txt>
        <Txt size={15} color={colors.body} align="center">
          محلك هيفضل أول حاجة قدامك، وصاحب المحل يعرف إن الطلب منك.
        </Txt>
        <Txt size={15} weight={500} style={styles.label}>
          رقم المحل (4 أرقام)
        </Txt>
        <TextInput
          accessibilityLabel="كود المحل"
          placeholder="4821"
          placeholderTextColor={colors.radioOff}
          autoCapitalize="characters"
          autoCorrect={false}
          value={code}
          onChangeText={(t) => {
            setCode(t);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          style={[styles.input, { fontSize: inputSize }, code ? styles.spaced : null, error ? styles.inputError : null]}
        />
        {error ? (
          <Txt size={15} weight={500} color={colors.danger} align="center">
            {error}
          </Txt>
        ) : null}
      </View>
      <BottomBar>
        <PrimaryButton label={link.isPending ? 'بنضيف المحل…' : 'ضيف المحل'} disabled={link.isPending} onPress={submit} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  body: { flex: 1, alignItems: 'center', gap: 10, padding: 24 },
  icon: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  label: { alignSelf: 'stretch', marginTop: 12 },
  input: {
    alignSelf: 'stretch',
    height: 60,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body600,
    textAlign: 'center',
    writingDirection: 'ltr',
    color: colors.ink,
  },
  // Letter spacing only once there is text: on an Arabic placeholder it breaks the joining.
  spaced: { letterSpacing: 3 },
  inputError: { borderColor: colors.danger },
  actions: { gap: 10 },
});
