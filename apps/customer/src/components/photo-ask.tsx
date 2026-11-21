import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { friendlyError, submitProductPhoto } from '@/data/api';
import type { Product } from '@/data/types';
import { useToast } from '@/state/toast';
import { colors, radius } from '@/theme';

import { Icon } from './icon';
import { Txt } from './txt';
import { SecondaryButton } from './ui';

/**
 * Under a product with no photo yet: «عندك صورة؟». The customer snaps or picks one,
 * it goes to us for review, and once approved every shop selling it shows it.
 */
export function PhotoAsk({ product }: { product: Product }) {
  const [sent, setSent] = useState(false);
  const toast = useToast((s) => s.show);

  const send = useMutation({
    mutationFn: ({ uri, mimeType }: { uri: string; mimeType?: string | null }) => submitProductPhoto(product.id, uri, mimeType),
    onSuccess: () => {
      setSent(true);
      toast('شكراً! هنراجع الصورة ونحطها للناس كلها');
    },
    onError: (e) =>
      toast(e instanceof Error && e.message.includes('too many tries') ? 'بعت صور كتير النهارده، شكراً. كمّل بكرة' : friendlyError(e)),
  });

  const pick = async (from: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    if (from === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast('اسمح للتطبيق يستخدم الكاميرا، أو اختار صورة من صورك');
        return;
      }
    }
    const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    send.mutate({ uri: asset.uri, mimeType: asset.mimeType });
  };

  if (sent) {
    return (
      <View style={[styles.box, styles.sent]}>
        <Icon name="check" size={22} color={colors.success} strokeWidth={2.2} />
        <Txt size={15} weight={600} color={colors.success} style={styles.flex}>
          وصلتنا صورتك، شكراً. هتظهر بعد ما نراجعها
        </Txt>
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <Txt size={15} weight={600}>
        المنتج ده لسه مالوش صورة. عندك صورة له؟
      </Txt>
      <Txt size={14} color={colors.body}>
        صوّره أو اختار صورة، وإحنا هنراجعها ونحطها لكل الناس.
      </Txt>
      <View style={styles.actions}>
        <View style={styles.flex}>
          <SecondaryButton label={send.isPending ? 'بنبعت…' : 'صوّره'} icon="camera" onPress={() => pick('camera')} />
        </View>
        <View style={styles.flex}>
          <SecondaryButton label="من صورك" onPress={() => pick('library')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  box: { gap: 6, padding: 14, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successSoft },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
