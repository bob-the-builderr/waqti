import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { WawLogo } from '@/components/brand';
import { Txt, useInputSize } from '@/components/txt';
import { PrimaryButton } from '@/components/ui';
import { friendlyError, signIn } from '@/data/api';
import { keys, queryClient } from '@/data/queries';
import { colors, fonts, radius } from '@/theme';

/** Sign in with the admin email and password made in Supabase (steps at the top of 018_admin.sql). */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputSize = useInputSize(16);

  const login = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.isAdmin });
      router.replace('/');
    },
    onError: (e) => setError(friendlyError(e)),
  });

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.brand}>
          <WawLogo size={48} />
          <Txt display weight={700} size={24}>
            وقتي — الإدارة
          </Txt>
        </View>
        <TextInput
          accessibilityLabel="الإيميل"
          placeholder="الإيميل"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <TextInput
          accessibilityLabel="الباسورد"
          placeholder="الباسورد"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => login.mutate()}
          style={[styles.input, { fontSize: inputSize }]}
        />
        {error ? (
          <Txt size={14} color={colors.danger}>
            {error}
          </Txt>
        ) : null}
        <PrimaryButton label={login.isPending ? 'لحظة…' : 'ادخل'} disabled={!email || !password || login.isPending} onPress={() => login.mutate()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.accent },
  card: { width: '100%', maxWidth: 400, gap: 12, padding: 24, borderRadius: radius.xl, backgroundColor: colors.card },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
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
