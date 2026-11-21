import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { busyOrder, friendlyError, quoteRx, rxPhotoUrl, type MerchantOrder } from '@/data/api';
import { refreshAll } from '@/data/queries';
import { money } from '@/lib/format';
import { stopRinging } from '@/lib/ring';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

import { Icon } from './icon';
import { Txt, useInputSize } from './txt';
import { PrimaryButton, styles as ui } from './ui';

const QUICK_NOTES = ['متوفر كله', 'فيه بديل بنفس المادة الفعالة', 'فيه صنف ناقص'];

/**
 * A prescription rings like any order. The pharmacy looks at the photo, types
 * the total, picks a line for the customer, and sends the price; the customer
 * agrees in their app before anything is prepared.
 */
export function RxQuote({ order, waiting }: { order: MerchantOrder; waiting: number }) {
  const insets = useSafeAreaInsets();
  const toast = useToast((s) => s.show);
  const priceSize = useInputSize(26);
  const noteSize = useInputSize(16);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState(QUICK_NOTES[0]);
  const photo = useQuery({
    queryKey: ['rx-photo', order.rxPhotoPath],
    queryFn: () => rxPhotoUrl(order.rxPhotoPath as string),
    enabled: !!order.rxPhotoPath,
    staleTime: 30 * 60_000,
  });
  const value = Number(latinDigits(price).replace(/[^\d]/g, ''));

  const send = useMutation({
    mutationFn: () => quoteRx(order.orderStoreId, value, note),
    onSuccess: () => {
      stopRinging();
      refreshAll();
      toast(`بعتنا السعر للزبون: ${money(value)}. أول ما يوافق هيرن تاني`);
    },
    onError: (e) => toast(friendlyError(e)),
  });
  const busy = useMutation({
    mutationFn: () => busyOrder(order.orderStoreId),
    onSuccess: () => {
      stopRinging();
      refreshAll();
      toast('قلنا للزبون إن الدوا مش متوفر');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={() => undefined} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.head}>
          <Icon name="camera" size={28} color={colors.onAccent} />
          <View style={styles.flex}>
            <Txt display weight={700} size={26} color={colors.onAccent}>
              روشتة جديدة
            </Txt>
            <Txt size={16} color={colors.onAccentSoft}>
              رقم {order.number}
              {waiting > 1 ? ` · وفيه ${waiting - 1} كمان` : ''}
            </Txt>
          </View>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.photo}>{photo.data ? <Image source={photo.data} contentFit="contain" style={StyleSheet.absoluteFill} /> : null}</View>
          {order.rxNote ? (
            <Txt size={16} color={colors.body}>
              الزبون بيقول: «{order.rxNote}»
            </Txt>
          ) : null}

          <Txt weight={600} size={17}>
            الحساب كله بالجنيه
          </Txt>
          <TextInput
            accessibilityLabel="الحساب كله بالجنيه"
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.radioOff}
            value={price}
            onChangeText={setPrice}
            style={[styles.price, { fontSize: priceSize }]}
          />

          <Txt weight={600} size={17}>
            كلمة للزبون
          </Txt>
          <View style={styles.chips}>
            {QUICK_NOTES.map((n) => (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityState={{ selected: note === n }}
                onPress={() => setNote(n)}
                style={({ pressed }) => [styles.chip, note === n && styles.chipOn, pressed && ui.pressed]}>
                <Txt size={15} weight={600} color={note === n ? colors.white : colors.ink}>
                  {n}
                </Txt>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="كلمة للزبون"
            value={note}
            onChangeText={setNote}
            maxLength={300}
            style={[styles.note, { fontSize: noteSize }]}
          />
        </ScrollView>

        <View style={styles.foot}>
          <PrimaryButton
            label={send.isPending ? 'بنبعت…' : value ? `ابعت السعر · ${money(value)}` : 'اكتب الحساب الأول'}
            tone={colors.mint}
            textColor={colors.ink}
            disabled={!value || send.isPending}
            onPress={() => send.mutate()}
          />
          <Pressable accessibilityRole="button" onPress={() => busy.mutate()} style={({ pressed }) => [styles.busy, pressed && ui.pressed]}>
            <Txt weight={600} size={17} color={colors.onAccent} align="center">
              {busy.isPending ? 'لحظة…' : 'مش متوفر عندنا'}
            </Txt>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.accent },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  body: { flex: 1, backgroundColor: colors.sand, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  bodyContent: { padding: 16, gap: 10 },
  photo: { width: '100%', height: 320, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  price: {
    height: 66,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.display700,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  note: {
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
  foot: { gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  busy: { minHeight: 52, justifyContent: 'center' },
});
