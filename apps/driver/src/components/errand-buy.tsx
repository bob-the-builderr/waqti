import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { errandBought, friendlyError, type Trip } from '@/data/api';
import { refreshAll } from '@/data/queries';
import { money } from '@/lib/format';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

import { Icon } from './icon';
import { Txt, useInputSize } from './txt';
import { Card, PrimaryButton, styles as ui } from './ui';

/**
 * «هاتلي أي حاجة»: what the customer wants, the most to spend, then «اشتريت»
 * with what was paid and a photo of the receipt. The customer pays that plus the fee.
 */
export function ErrandBuy({ trip }: { trip: Trip }) {
  const toast = useToast((s) => s.show);
  const amountSize = useInputSize(24);
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<{ uri: string; mimeType?: string | null } | null>(null);
  const value = Number(latinDigits(amount).replace(/[^\d]/g, ''));
  const over = !!trip.errandBudget && value > trip.errandBudget;

  const bought = useMutation({
    mutationFn: () => errandBought(trip.orderId, value, receipt!.uri, receipt!.mimeType),
    onSuccess: () => {
      refreshAll();
      toast(`تمام. حصّل ${money(value + trip.deliveryFee)} من الزبون`);
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const snap = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.6 };
    const result = permission.granted ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]) setReceipt({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="bag" size={24} color={colors.accent} />
        <Txt display weight={700} size={18} style={styles.flex}>
          اشتري للزبون
        </Txt>
      </View>
      <Txt size={18} weight={600}>
        {trip.errandText}
      </Txt>
      {trip.errandFrom ? (
        <Txt size={15} color={colors.body}>
          من: {trip.errandFrom}
        </Txt>
      ) : null}
      <Txt size={15} weight={600} color={colors.warning}>
        اصرف لحد {money(trip.errandBudget ?? 0)} بس. لو أغلى، كلّم الزبون الأول.
      </Txt>

      <Txt weight={600} size={16}>
        دفعت كام بالفاتورة؟
      </Txt>
      <TextInput
        accessibilityLabel="دفعت كام بالفاتورة"
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.radioOff}
        value={amount}
        onChangeText={setAmount}
        style={[styles.amount, { fontSize: amountSize }, over && styles.amountOver]}
      />
      {over ? (
        <Txt size={14} color={colors.danger}>
          أكبر من اللي الزبون سمح بيه ({money(trip.errandBudget ?? 0)}). كلّمه الأول.
        </Txt>
      ) : null}

      {receipt ? (
        <Pressable accessibilityRole="button" accessibilityLabel="صوّر الفاتورة تاني" onPress={snap}>
          <Image source={receipt.uri} contentFit="cover" style={styles.receipt} />
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={snap} style={({ pressed }) => [styles.snap, pressed && ui.pressed]}>
          <Icon name="camera" size={26} color={colors.accent} />
          <Txt weight={600} size={16} color={colors.accent}>
            صوّر الفاتورة
          </Txt>
        </Pressable>
      )}

      <PrimaryButton
        label={bought.isPending ? 'بنبعت…' : value ? `اشتريت · ${money(value)}` : 'اكتب المبلغ وصوّر الفاتورة'}
        disabled={!value || !receipt || over || bought.isPending}
        onPress={() => bought.mutate()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 10, borderWidth: 1.5, borderColor: colors.accent },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: {
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.display700,
    color: colors.ink,
  },
  amountOver: { borderColor: colors.danger },
  snap: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  receipt: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.field },
});
