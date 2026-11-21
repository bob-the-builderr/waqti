import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { AddressCard, PaymentChoice, PhoneField } from '@/components/order-form';
import { Txt, useInputSize } from '@/components/txt';
import { Banner, BottomBar, PrimaryButton, ScreenHeader, styles as ui } from '@/components/ui';
import { friendlyError, placeRxOrder } from '@/data/api';
import { keys, queryClient, useStore } from '@/data/queries';
import { money, baseFee } from '@/lib/pricing';
import { normalizePhone, useSettings } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

/**
 * «صوّر الروشتة»: one photo of the prescription (or the empty box) goes to the
 * pharmacy, which sends back the price. Nothing is charged until the customer agrees.
 */
export default function RxScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const store = useStore(storeId);
  const savedPhone = useSettings((s) => s.phone);
  const setPhone = useSettings((s) => s.setPhone);
  const toast = useToast((s) => s.show);
  const inputSize = useInputSize(16);

  const [photo, setPhoto] = useState<{ uri: string; mimeType?: string | null } | null>(null);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<'cash' | 'wallet'>('cash');
  const [phone, setPhoneDraft] = useState(savedPhone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (p: string) => placeRxOrder({ storeId: storeId as string, uri: photo!.uri, mimeType: photo!.mimeType, note, payment, phone: p }),
    onSuccess: (placed) => {
      queryClient.invalidateQueries({ queryKey: keys.orders });
      router.replace(`/order/${placed.orderId}`);
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const pick = async (from: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.7 };
    if (from === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return toast('اسمح للتطبيق يستخدم الكاميرا، أو اختار الصورة من صورك');
    }
    const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]) setPhoto({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
  };

  const submit = () => {
    const p = normalizePhone(phone);
    if (!p) return setPhoneError('اكتب رقم موبايل مصري من 11 رقم، زي 01012345678');
    setPhoneError(null);
    setPhone(p);
    send.mutate(p);
  };

  const shop = store.data;
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="صوّر الروشتة" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Txt size={15} color={colors.body}>
          {shop ? `${shop.name} هتشوف الصورة وتبعتلك السعر هنا. مش هتدفع حاجة غير لما توافق.` : ''}
        </Txt>

        {photo ? (
          <View>
            <Image source={photo.uri} contentFit="cover" style={styles.preview} />
            <Pressable accessibilityRole="button" accessibilityLabel="غيّر الصورة" onPress={() => setPhoto(null)} style={({ pressed }) => [styles.change, pressed && ui.pressed]}>
              <Icon name="close" size={18} color={colors.ink} />
              <Txt size={14} weight={600}>
                صورة تانية
              </Txt>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickRow}>
            <Pressable accessibilityRole="button" onPress={() => pick('camera')} style={({ pressed }) => [styles.pick, styles.pickMain, pressed && ui.pressed]}>
              <Icon name="camera" size={34} color={colors.white} />
              <Txt weight={700} size={16} color={colors.white}>
                صوّرها دلوقتي
              </Txt>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => pick('library')} style={({ pressed }) => [styles.pick, pressed && ui.pressed]}>
              <Icon name="bag" size={30} color={colors.accent} />
              <Txt weight={600} size={16} color={colors.accent}>
                من صورك
              </Txt>
            </Pressable>
          </View>
        )}

        <Banner icon="shield">
          <Txt size={14} color={colors.body}>
            صورة الروشتة بتتحفظ مقفولة: محدش يشوفها غيرك وغير الصيدلية.
          </Txt>
        </Banner>

        <View style={styles.block}>
          <Txt display weight={600} size={17}>
            عايز تقول حاجة للصيدلية؟ (مش لازم)
          </Txt>
          <TextInput
            accessibilityLabel="ملاحظة للصيدلية"
            placeholder="مثلاً: علبة واحدة بس من كل دوا"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            maxLength={300}
            multiline
            style={[styles.note, { fontSize: inputSize }]}
          />
        </View>

        <AddressCard />
        <PhoneField value={phone} onChange={setPhoneDraft} error={phoneError} />
        <PaymentChoice value={payment} onChange={setPayment} />
        {shop ? (
          <Txt size={14} color={colors.muted} align="center">
            التوصيل {money(baseFee(shop.distanceKm))} زيادة على تمن الدوا
          </Txt>
        ) : null}
      </ScrollView>
      <BottomBar>
        <PrimaryButton
          label={send.isPending ? 'بنبعت…' : 'ابعت للصيدلية'}
          disabled={!photo || send.isPending || !shop}
          onPress={submit}
        />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 16, gap: 14, paddingBottom: 130 },
  pickRow: { flexDirection: 'row', gap: 10 },
  pick: {
    flex: 1,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  pickMain: { backgroundColor: colors.accent },
  preview: { width: '100%', height: 280, borderRadius: radius.lg, backgroundColor: colors.photo },
  change: {
    position: 'absolute',
    top: 10,
    end: 10,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  block: { gap: 8 },
  note: {
    minHeight: 80,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body400,
    color: colors.ink,
    textAlign: 'right',
    textAlignVertical: 'top',
  },
});
