import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { MapView, type MapHandle } from '@/components/map';
import { Txt, useInputSize } from '@/components/txt';
import { BottomBar, Chip, PrimaryButton, ScreenHeader, styles as ui } from '@/components/ui';
import { friendlyError, saveAddress } from '@/data/api';
import { keys, useZones } from '@/data/queries';
import { nearestZone } from '@/lib/geo';
import { useAddress } from '@/state/address';
import { useToast } from '@/state/toast';
import { colors, elevation, fonts, radius } from '@/theme';

const LABELS = ['البيت', 'الشغل', 'بيت العيلة'];

/** New address: drag the map under the pin, the area fills itself, then the building and a landmark. */
export default function NewAddressScreen() {
  const current = useAddress((s) => s.current);
  const setCurrent = useAddress((s) => s.setCurrent);
  const zones = useZones();
  const toast = useToast((s) => s.show);
  const client = useQueryClient();
  const map = useRef<MapHandle>(null);
  const inputSize = useInputSize(16);

  const [point, setPoint] = useState({ lat: current.lat, lng: current.lng });
  const [zonePicked, setZonePicked] = useState<string | null>(null);
  const [label, setLabel] = useState(LABELS[0]);
  const [details, setDetails] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locating, setLocating] = useState(false);

  // The area follows the pin until the customer picks one by hand.
  const autoZone = nearestZone(zones.data ?? [], point.lat, point.lng);
  const zoneId = zonePicked ?? autoZone?.id ?? current.zoneId;
  const zone = zones.data?.find((z) => z.id === zoneId);
  const ready = details.trim().length >= 4 && !!zone;

  const save = useMutation({
    mutationFn: () =>
      saveAddress({ label, zoneId, details: details.trim(), landmark: landmark.trim(), lat: point.lat, lng: point.lng }),
    onSuccess: (saved) => {
      setCurrent({ ...saved, areaName: zone?.name ?? '', lat: point.lat, lng: point.lng });
      client.invalidateQueries({ queryKey: keys.addresses });
      toast(`هنوصّل على ${label} من هنا ورايح`);
      // The list was replaced by this screen, so one step back is where the customer came from.
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  const locateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('اسمح للتطبيق يعرف مكانك، أو حرّك الخريطة بإيدك');
        return;
      }
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPoint({ lat: here.coords.latitude, lng: here.coords.longitude });
      map.current?.recenter(here.coords.latitude, here.coords.longitude);
    } catch {
      toast('مقدرناش نعرف مكانك. حرّك الخريطة لحد ما الدبوس يبقى على بيتك');
    } finally {
      setLocating(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="عنوان جديد" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <MapView ref={map} lat={point.lat} lng={point.lng} zoom={17} picker onCenter={(lat, lng) => setPoint({ lat, lng })} style={styles.map} />
          {/* The pin stays in the middle; the map moves under it. */}
          <View pointerEvents="none" style={styles.pinWrap}>
            <Icon name="pin" size={46} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حدد مكاني"
            disabled={locating}
            onPress={locateMe}
            style={({ pressed }) => [styles.locate, pressed && ui.pressed]}>
            <Icon name="pin" size={18} color={colors.accent} strokeWidth={2.2} />
            <Txt size={15} weight={600} color={colors.accent}>
              {locating ? 'لحظة…' : 'مكاني'}
            </Txt>
          </Pressable>
        </View>
        <Txt size={14} color={colors.muted} align="center">
          حرّك الخريطة لحد ما الدبوس يبقى على باب بيتك
        </Txt>

        <Txt display weight={600} size={17}>
          المنطقة
        </Txt>
        <View style={styles.chips}>
          {(zones.data ?? []).map((z) => (
            <Chip key={z.id} label={z.name} selected={z.id === zoneId} onPress={() => setZonePicked(z.id)} />
          ))}
        </View>

        <Txt display weight={600} size={17}>
          اسم العنوان
        </Txt>
        <View style={styles.chips}>
          {LABELS.map((l) => (
            <Chip key={l} label={l} selected={l === label} onPress={() => setLabel(l)} />
          ))}
        </View>

        <Txt display weight={600} size={17}>
          الشارع والعمارة والدور
        </Txt>
        <TextInput
          accessibilityLabel="الشارع والعمارة والدور"
          placeholder="مثلاً: شارع الجامعة، عمارة 12، الدور التالت"
          placeholderTextColor={colors.muted}
          value={details}
          onChangeText={setDetails}
          style={[styles.input, { fontSize: inputSize }]}
        />
        <Txt display weight={600} size={17}>
          علامة مميزة (لو فيه)
        </Txt>
        <TextInput
          accessibilityLabel="علامة مميزة"
          placeholder="مثلاً: جنب الجامع الكبير"
          placeholderTextColor={colors.muted}
          value={landmark}
          onChangeText={setLandmark}
          style={[styles.input, { fontSize: inputSize }]}
        />
      </ScrollView>
      <BottomBar>
        <PrimaryButton
          label={save.isPending ? 'بنحفظ…' : 'احفظ العنوان'}
          disabled={!ready || save.isPending}
          onPress={() => save.mutate()}
        />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: 16, gap: 12, paddingBottom: 130 },
  map: { height: 300 },
  pinWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  locate: {
    position: 'absolute',
    bottom: 12,
    start: 12,
    height: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...elevation.raised,
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
