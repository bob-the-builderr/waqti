import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ItemPhoto } from '@/components/item-photo';
import { Txt, useInputSize } from '@/components/txt';
import { BottomBar, Chip, PrimaryButton, ScreenHeader, styles as ui } from '@/components/ui';
import { addProduct, friendlyError, uploadShopPhoto } from '@/data/api';
import { keys, queryClient, useCatalog, useProducts } from '@/data/queries';
import { latinDigits } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

/**
 * «منتج جديد»: for what the catalog doesn't have. Name, size, aisle, price,
 * and a photo if the shop wants one (a clean name card shows until then).
 */
export default function NewProductScreen() {
  const toast = useToast((s) => s.show);
  const products = useProducts();
  const catalog = useCatalog();
  const inputSize = useInputSize(17);

  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [section, setSection] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mimeType?: string | null } | null>(null);

  // Aisles the shop already uses, then the catalog's, so items land in familiar places.
  const aisles = [
    ...new Set([...(products.data ?? []).map((p) => p.section), ...(catalog.data ?? []).map((c) => c.section)].filter((x): x is string => !!x)),
  ];
  const value = Number(latinDigits(price).replace(/[^\d]/g, ''));
  const ready = name.trim().length >= 2 && value > 0;

  const save = useMutation({
    mutationFn: async () => {
      const imagePath = photo ? await uploadShopPhoto(photo.uri, photo.mimeType) : null;
      await addProduct({ name: name.trim(), size: size.trim(), section: section.trim(), price: value, imagePath });
    },
    onSuccess: () => {
      toast(`${name.trim()} بقى في محلك`);
      queryClient.invalidateQueries({ queryKey: keys.products });
      if (router.canGoBack()) router.back();
      else router.replace('/items');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const pick = async (from: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.7, allowsEditing: true, aspect: [1, 1] };
    if (from === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return toast('اسمح للتطبيق يستخدم الكاميرا، أو اختار صورة من صورك');
    }
    const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]) setPhoto({ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="منتج جديد" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoRow}>
          <ItemPhoto image={photo?.uri ?? null} name={name.trim() || 'صورة'} size={112} />
          <View style={styles.photoActions}>
            <Txt size={15} weight={600}>
              صورة المنتج (مش لازم)
            </Txt>
            <Txt size={13} color={colors.muted}>
              صوّره على خلفية فاتحة ونور كويس.
            </Txt>
            <View style={styles.photoButtons}>
              <Pressable accessibilityRole="button" onPress={() => pick('camera')} style={({ pressed }) => [styles.photoButton, pressed && ui.pressed]}>
                <Icon name="camera" size={18} color={colors.accent} />
                <Txt size={15} weight={600} color={colors.accent}>
                  صوّره
                </Txt>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => pick('library')} style={({ pressed }) => [styles.photoButton, pressed && ui.pressed]}>
                <Txt size={15} weight={600} color={colors.accent}>
                  من صورك
                </Txt>
              </Pressable>
            </View>
          </View>
        </View>

        <Txt display weight={600} size={16}>
          اسم المنتج
        </Txt>
        <TextInput
          accessibilityLabel="اسم المنتج"
          placeholder="مثلاً: جبنة بيضاء بلدي"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          maxLength={80}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <Txt display weight={600} size={16}>
          الحجم أو الوزن
        </Txt>
        <TextInput
          accessibilityLabel="الحجم أو الوزن"
          placeholder="مثلاً: نص كيلو، 1 لتر، قطعة"
          placeholderTextColor={colors.muted}
          value={size}
          onChangeText={setSize}
          maxLength={40}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <Txt display weight={600} size={16}>
          السعر بالجنيه
        </Txt>
        <TextInput
          accessibilityLabel="السعر بالجنيه"
          placeholder="نفس سعر الرف"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={price}
          onChangeText={setPrice}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <Txt display weight={600} size={16}>
          القسم
        </Txt>
        <View style={styles.chips}>
          {aisles.map((a) => (
            <Chip key={a} label={a} selected={section === a} onPress={() => setSection(a)} />
          ))}
        </View>
        <TextInput
          accessibilityLabel="قسم تاني"
          placeholder="أو اكتب قسم جديد"
          placeholderTextColor={colors.muted}
          value={aisles.includes(section) ? '' : section}
          onChangeText={setSection}
          maxLength={40}
          style={[styles.input, { fontSize: inputSize }]}
        />
      </ScrollView>
      <BottomBar>
        <PrimaryButton label={save.isPending ? 'بنحفظ…' : 'ضيفه للمحل'} disabled={!ready || save.isPending} onPress={() => save.mutate()} />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 16, gap: 10, paddingBottom: 130 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  photoActions: { flex: 1, minWidth: 0, gap: 4 },
  photoButtons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  photoButton: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
