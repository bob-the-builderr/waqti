import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WawLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { Txt, useInputSize } from '@/components/txt';
import { PrimaryButton, styles as ui } from '@/components/ui';
import { friendlyError, register, type Vehicle } from '@/data/api';
import { refreshAll } from '@/data/queries';
import { normalizePhone } from '@/state/settings';
import { colors, fonts, radius } from '@/theme';

const vehicles: { id: Vehicle; label: string; hint: string; icon: IconName }[] = [
  { id: 'motorcycle', label: 'موتوسيكل', hint: 'كل المشاوير', icon: 'moto' },
  { id: 'scooter', label: 'سكوتر', hint: 'كل المشاوير', icon: 'moto' },
  { id: 'bicycle', label: 'عجلة', hint: 'مشاوير لحد 2.5 كم', icon: 'bike' },
];

/** Open sign-up, like Talabat: name, phone, and what you ride. */
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputSize = useInputSize(18);

  const signUp = useMutation({
    mutationFn: () => register(name.trim(), normalizePhone(phone) as string, vehicle as Vehicle),
    onSuccess: () => {
      refreshAll();
      router.replace('/');
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const submit = () => {
    if (name.trim().length < 2) return setError('اكتب اسمك');
    if (!normalizePhone(phone)) return setError('اكتب رقم موبايل مصري من 11 رقم، زي 01012345678');
    if (!vehicle) return setError('اختار هتشتغل بإيه');
    setError(null);
    if (!signUp.isPending) signUp.mutate();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 28 }]}>
        <WawLogo size={60} />
        <Txt display weight={700} size={28} color={colors.onAccent}>
          اشتغل مع وقتي
        </Txt>
        <Txt size={16} color={colors.onAccentSoft} align="center">
          أجرك على كل مشوار، وبيتحوّلك كل أسبوع. والبقشيش كله ليك.
        </Txt>
      </View>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: Math.max(insets.bottom, 20) }]} keyboardShouldPersistTaps="handled">
        <Txt weight={600} size={16}>
          اسمك
        </Txt>
        <TextInput
          accessibilityLabel="اسمك"
          placeholder="محمود أحمد"
          placeholderTextColor={colors.radioOff}
          value={name}
          onChangeText={setName}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <Txt weight={600} size={16}>
          رقم موبايلك
        </Txt>
        <TextInput
          accessibilityLabel="رقم موبايلك"
          placeholder="01012345678"
          placeholderTextColor={colors.radioOff}
          keyboardType="phone-pad"
          maxLength={14}
          value={phone}
          onChangeText={setPhone}
          style={[styles.input, styles.ltr, { fontSize: inputSize }]}
        />
        <Txt weight={600} size={16}>
          هتشتغل بإيه؟
        </Txt>
        <View style={styles.vehicles}>
          {vehicles.map((v) => {
            const on = vehicle === v.id;
            return (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setVehicle(v.id)}
                style={({ pressed }) => [styles.vehicle, on && styles.vehicleOn, pressed && ui.pressed]}>
                <Icon name={v.icon} size={34} color={on ? colors.onAccent : colors.accent} />
                <Txt weight={700} size={16} color={on ? colors.onAccent : colors.ink}>
                  {v.label}
                </Txt>
                <Txt size={13} color={on ? colors.onAccentSoft : colors.muted} align="center">
                  {v.hint}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        {error ? (
          <Txt size={15} weight={500} color={colors.danger}>
            {error}
          </Txt>
        ) : null}
        <PrimaryButton label={signUp.isPending ? 'بنسجّلك…' : 'سجّلني'} disabled={signUp.isPending} onPress={submit} />
        <Txt size={14} color={colors.muted} align="center">
          قبل أول مشوار، فريق وقتي هيكلمك يشوف البطاقة والرخصة.
        </Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  top: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: colors.accent },
  form: { padding: 20, gap: 10 },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body500,
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'right',
  },
  ltr: { textAlign: 'left', writingDirection: 'ltr' },
  vehicles: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  vehicle: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  vehicleOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
