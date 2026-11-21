import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAddress } from '@/state/address';
import { colors, fonts, radius } from '@/theme';

import { Icon } from './icon';
import { Txt, useInputSize } from './txt';
import { Card, styles as ui } from './ui';

/** Where it's going, with «تغيير». */
export function AddressCard() {
  const address = useAddress((s) => s.current);
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name="pin" color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Txt weight={600} size={16}>
            {address.label} · {address.areaName}
          </Txt>
          <Txt size={14} color={colors.body} numberOfLines={2}>
            {address.details}
          </Txt>
        </View>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/address')}>
          <Txt size={15} weight={600} color={colors.accent}>
            تغيير
          </Txt>
        </Pressable>
      </View>
    </Card>
  );
}

/** The customer's mobile, so the shop and the rider can call. */
export function PhoneField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string | null }) {
  const inputSize = useInputSize(18);
  return (
    <View style={styles.block}>
      <Txt display weight={600} size={17}>
        رقم موبايلك
      </Txt>
      <TextInput
        accessibilityLabel="رقم موبايلك"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        placeholder="01012345678"
        placeholderTextColor={colors.radioOff}
        value={value}
        onChangeText={onChange}
        style={[styles.input, { fontSize: inputSize }, error ? styles.inputError : null]}
      />
      {error ? (
        <Txt size={14} color={colors.danger}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

/** Cash to the rider, or a transfer from the phone. */
export function PaymentChoice({ value, onChange }: { value: 'cash' | 'wallet'; onChange: (v: 'cash' | 'wallet') => void }) {
  const options: { id: 'cash' | 'wallet'; title: string; body?: string }[] = [
    { id: 'cash', title: 'كاش للمندوب لما يوصل' },
    { id: 'wallet', title: 'تحويل من الموبايل للمندوب', body: 'فودافون كاش أو إنستاباي، وهو عندك' },
  ];
  return (
    <View style={styles.block}>
      <Txt display weight={600} size={17}>
        الدفع
      </Txt>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && ui.pressed]}>
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                {o.title}
              </Txt>
              {o.body ? (
                <Txt size={14} color={colors.muted}>
                  {o.body}
                </Txt>
              ) : null}
            </View>
            <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  block: { gap: 8 },
  input: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body500,
    color: colors.ink,
    textAlign: 'center',
  },
  inputError: { borderColor: colors.danger },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.radioOff, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
});
