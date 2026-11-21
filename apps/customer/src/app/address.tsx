import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { BottomBar, ErrorState, Loading, PrimaryButton, ScreenHeader, styles as ui } from '@/components/ui';
import { deleteAddress, friendlyError } from '@/data/api';
import { keys, useAddresses, useZones } from '@/data/queries';
import type { SavedAddress } from '@/data/types';
import { useAddress, type DeliveryAddress } from '@/state/address';
import { useToast } from '@/state/toast';
import { colors, elevation, radius } from '@/theme';

/** «عنوان التوصيل»: pick one of your saved addresses, or add one on the map. */
export default function AddressScreen() {
  const current = useAddress((s) => s.current);
  const setCurrent = useAddress((s) => s.setCurrent);
  const addresses = useAddresses();
  const zones = useZones();
  const toast = useToast((s) => s.show);
  const client = useQueryClient();
  const remove = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.addresses }),
    onError: (e) => toast(friendlyError(e)),
  });

  const areaName = (zoneId: string) => zones.data?.find((z) => z.id === zoneId)?.name ?? '';
  const choose = (a: SavedAddress) => {
    const next: DeliveryAddress = {
      id: a.id,
      label: a.label,
      zoneId: a.zoneId,
      areaName: areaName(a.zoneId),
      details: a.details,
      landmark: a.landmark,
      lat: a.lat ?? current.lat,
      lng: a.lng ?? current.lng,
    };
    setCurrent(next);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="عنوان التوصيل" />
      {addresses.isPending ? (
        <Loading />
      ) : addresses.isError ? (
        <ErrorState message={friendlyError(addresses.error)} onRetry={() => addresses.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* The address in use, even before it's saved on the account. */}
          {current.id && addresses.data.some((a) => a.id === current.id) ? null : (
            <Row title={`${current.label} · ${current.areaName}`} body={current.details} selected onPress={() => router.back()} />
          )}
          {addresses.data.map((a) => (
            <Row
              key={a.id}
              title={`${a.label} · ${areaName(a.zoneId)}`}
              body={a.details}
              selected={a.id === current.id}
              onPress={() => choose(a)}
              onDelete={a.id === current.id ? undefined : () => remove.mutate(a.id)}
            />
          ))}
          <Txt size={14} color={colors.muted} align="center" style={styles.hint}>
            حدد مكانك على الخريطة مرة واحدة، والمندوب هيوصلك من غير ما يتصل يسأل.
          </Txt>
        </ScrollView>
      )}
      <BottomBar>
        <PrimaryButton label="+ عنوان جديد على الخريطة" onPress={() => router.replace('/address-new')} />
      </BottomBar>
    </View>
  );
}

function Row({ title, body, selected, onPress, onDelete }: { title: string; body: string; selected: boolean; onPress: () => void; onDelete?: () => void }) {
  return (
    <View style={[styles.row, selected && styles.rowOn]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && ui.pressed]}>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
        <View style={styles.flex}>
          <Txt weight={600} size={16}>
            {title}
          </Txt>
          <Txt size={14} color={colors.body} numberOfLines={2}>
            {body}
          </Txt>
        </View>
      </Pressable>
      {onDelete ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`امسح ${title}`} hitSlop={8} onPress={onDelete} style={({ pressed }) => [styles.delete, pressed && ui.pressed]}>
          <Icon name="trash" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, gap: 10, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.card, ...elevation.card },
  rowOn: { borderColor: colors.accent },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.radioOff, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  delete: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 10 },
});
