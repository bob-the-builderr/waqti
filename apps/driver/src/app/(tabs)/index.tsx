import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WawLogo } from '@/components/brand';
import { Icon, type IconName } from '@/components/icon';
import { ErrandBuy } from '@/components/errand-buy';
import { StoreListSkeleton } from '@/components/skeleton';
import { Txt } from '@/components/txt';
import { Card, ErrorState, PrimaryButton, SecondaryButton, Sheet, styles as ui } from '@/components/ui';
import { acceptTrip, declineTrip, deliver, friendlyError, pickUp, setOnline, type Offer, type Trip, type TripStore } from '@/data/api';
import { keys, queryClient, refreshAll, useMe, useOffers, useTrip } from '@/data/queries';
import { clockTime, formatPhone, itemsWord, money } from '@/lib/format';
import { ping } from '@/lib/ring';
import { useToast } from '@/state/toast';
import { colors, elevation, radius } from '@/theme';

const open = (url: string) => Linking.openURL(url).catch(() => undefined);
const mapUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const whatsapp = (phone: string, text: string) => `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;

export default function WorkScreen() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const trip = useTrip();
  const online = !!me.data?.isOnline;
  const free = trip.isSuccess && !trip.data;
  const offers = useOffers(online && free);
  const toast = useToast((s) => s.show);

  const toggle = useMutation({
    mutationFn: (next: boolean) => setOnline(next),
    onSuccess: (_, next) => {
      queryClient.invalidateQueries({ queryKey: keys.me });
      toast(next ? 'انت متاح دلوقتي. المشاوير هتظهرلك هنا' : 'وقّفت الشغل. مش هتوصلك مشاوير');
    },
    onError: (e) => toast(friendlyError(e)),
  });

  // A short alert whenever a new trip shows up.
  const seen = useRef(0);
  const count = offers.data?.length ?? 0;
  useEffect(() => {
    if (count > seen.current) ping();
    seen.current = count;
  }, [count]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brand}>
          <WawLogo size={38} />
          <View>
            <Txt display weight={700} size={22} color={colors.onAccent}>
              الشغل
            </Txt>
            <Txt size={14} color={colors.onAccentSoft}>
              {me.data?.name ?? ''}
            </Txt>
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: online }}
          accessibilityLabel="متاح للشغل"
          disabled={toggle.isPending || !!trip.data}
          onPress={() => toggle.mutate(!online)}
          style={({ pressed }) => [styles.toggle, online ? styles.toggleOn : null, pressed && ui.pressed]}>
          <View style={[styles.dot, { backgroundColor: online ? colors.ink : '#FF8A8A' }]} />
          <Txt size={15} weight={700} color={online ? colors.ink : colors.onAccent}>
            {online ? 'متاح' : 'مش متاح'}
          </Txt>
        </Pressable>
      </View>

      {trip.isPending || me.isPending ? (
        <StoreListSkeleton rows={2} />
      ) : trip.isError ? (
        <ErrorState message={friendlyError(trip.error)} onRetry={() => trip.refetch()} />
      ) : trip.data ? (
        <TripView trip={trip.data} />
      ) : !online ? (
        <View style={styles.center}>
          <Icon name="moto" size={56} color={colors.accent} strokeWidth={1.6} />
          <Txt weight={600} size={20} align="center">
            انت مش متاح دلوقتي
          </Txt>
          <Txt size={16} color={colors.body} align="center">
            افتح الشغل، والمشاوير اللي حواليك هتظهرلك هنا.
          </Txt>
          <View style={styles.wide}>
            <PrimaryButton label="ابدأ الشغل" onPress={() => toggle.mutate(true)} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {offers.isPending ? (
            <StoreListSkeleton rows={2} />
          ) : count === 0 ? (
            <View style={styles.center}>
              <Icon name="clock" size={52} color={colors.accent} strokeWidth={1.6} />
              <Txt weight={600} size={19} align="center">
                مستني مشاوير…
              </Txt>
              <Txt size={16} color={colors.body} align="center">
                أول ما مشوار يجهز، هيتعرض عليك انت لوحدك 45 ثانية وهينبّهك.
              </Txt>
            </View>
          ) : (
            offers.data?.map((o) => <OfferCard key={o.orderId} offer={o} fetchedAt={offers.dataUpdatedAt} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

/** Everything a driver needs before saying yes: pay, shops, where to, cash to collect. Yours alone for 45 seconds. */
function OfferCard({ offer, fetchedAt }: { offer: Offer; fetchedAt: number }) {
  const toast = useToast((s) => s.show);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, offer.secondsLeft - Math.floor((now - fetchedAt) / 1000));
  useEffect(() => {
    if (left === 0) queryClient.invalidateQueries({ queryKey: keys.offers });
  }, [left]);
  const pass = useMutation({
    mutationFn: () => declineTrip(offer.orderId),
    onSuccess: () => {
      refreshAll();
      toast('تمام، مفيش مشكلة. هيجيلك غيره');
    },
    onError: (e) => toast(friendlyError(e)),
  });
  const accept = useMutation({
    mutationFn: () => acceptTrip(offer.orderId),
    onSuccess: () => {
      refreshAll();
      toast('المشوار بتاعك. روح على المحل');
    },
    onError: (e) => {
      refreshAll();
      toast(friendlyError(e));
    },
  });

  return (
    <Card style={styles.offer}>
      <View style={styles.offerHead}>
        <Txt display weight={700} size={30} color={colors.accent}>
          {money(offer.pay)}
        </Txt>
        <Txt size={15} color={colors.body}>
          {offer.distanceKm != null ? `${offer.distanceKm} كم · ` : ''}
          {itemsWord(offer.pieces)}
        </Txt>
      </View>
      {offer.kind === 'errand' ? (
        <Step icon="bag" title="هاتلي أي حاجة" note={`${offer.errandText ?? ''}${offer.errandFrom ? ` · من: ${offer.errandFrom}` : ''}`} badge={`لحد ${money(offer.errandBudget ?? 0)}`} />
      ) : (
        offer.stores.map((s, i) => (
          <Step key={`${s.name}-${i}`} icon="store" title={`من: ${s.name}`} note={s.area} badge={s.ready ? 'جاهز' : 'بيتجهّز'} good={s.ready} />
        ))
      )}
      <Step icon="pin" title={`لـ: ${offer.dropArea}`} note={offer.landmark} />
      <View style={styles.cashRow}>
        <Icon name="cash" size={22} color={colors.success} />
        <Txt size={17} weight={600} style={styles.flex}>
          {offer.kind === 'errand'
            ? `هتشتري من جيبك وتحصّل الفاتورة + ${money(offer.total)}`
            : offer.paymentMethod === 'cash'
              ? `حصّل كاش ${money(offer.total)}`
              : `تحويل ${money(offer.total)} عند الباب`}
        </Txt>
      </View>
      <View style={styles.timer}>
        <View style={[styles.timerFill, { width: `${Math.round((left / 45) * 100)}%` }]} />
      </View>
      <PrimaryButton
        label={accept.isPending ? 'لحظة…' : `اقبل المشوار · ${left} ثانية`}
        disabled={accept.isPending || left === 0}
        onPress={() => accept.mutate()}
      />
      <SecondaryButton label={pass.isPending ? 'لحظة…' : 'مش دلوقتي'} onPress={() => pass.mutate()} />
    </Card>
  );
}

/** The trip in order: each shop, then the customer, then «وصّلت». */
function TripView({ trip }: { trip: Trip }) {
  const toast = useToast((s) => s.show);
  const me = useMe();
  const [confirm, setConfirm] = useState(false);
  const errand = trip.kind === 'errand';
  // An errand can be delivered once it's bought; a shop trip once every shop is picked up.
  const allPicked = errand ? trip.status === 'on_the_way' : trip.stores.every((s) => s.status === 'picked_up');
  // Rounded up to 5 minutes, exactly like the customer app, so both see the same time.
  const FIVE = 5 * 60_000;
  const promise = new Date(Math.ceil((new Date(trip.placedAt).getTime() + trip.guaranteedMinutes * 60_000) / FIVE) * FIVE);
  const change = trip.paymentMethod === 'cash' && trip.payWith && trip.payWith > trip.total ? trip.payWith - trip.total : 0;

  const done = useMutation({
    mutationFn: () => deliver(trip.orderId),
    onSuccess: () => {
      setConfirm(false);
      refreshAll();
      toast(`تمام، المشوار خلص. +${money(trip.pay)}`);
    },
    onError: (e) => {
      setConfirm(false);
      toast(friendlyError(e));
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.tripHead}>
        <View style={styles.flex}>
          <Txt display weight={700} size={22} color={colors.onAccent}>
            مشوار رقم {trip.number}
          </Txt>
          <Txt size={15} color={colors.onAccentSoft}>
            وعد للزبون: قبل الساعة {clockTime(promise)}
          </Txt>
        </View>
        <Txt display weight={700} size={24} color={colors.mint}>
          {money(trip.pay)}
        </Txt>
      </View>

      {errand ? (
        allPicked ? (
          <Step icon="check" title={`اشتريت بـ${money(trip.subtotal)}`} note={trip.errandText ?? ''} good />
        ) : (
          <ErrandBuy trip={trip} />
        )
      ) : (
        <>
          <Txt display weight={600} size={18} style={styles.sectionTitle}>
            {allPicked ? 'استلمت من كل المحلات' : `استلم من ${trip.stores.length > 1 ? `${trip.stores.length} محلات` : 'المحل'}`}
          </Txt>
          {trip.stores.map((s) => (
            <StoreStep key={s.orderStoreId} store={s} />
          ))}
        </>
      )}

      <Txt display weight={600} size={18} style={styles.sectionTitle}>
        وصّل للزبون
      </Txt>
      <Card style={styles.customer}>
        <Txt weight={600} size={18}>
          {trip.dropArea}
        </Txt>
        <Txt size={16} color={colors.body}>
          {trip.address}
        </Txt>
        {trip.landmark ? (
          <Txt size={16} weight={600}>
            جنب: {trip.landmark.replace(/^جنب /, '')}
          </Txt>
        ) : null}
        <View style={styles.buttons}>
          {trip.customerPhone ? (
            <>
              <Small icon="phone" label="كلّمه" onPress={() => open(`tel:${trip.customerPhone}`)} />
              <Small
                icon="chat"
                label="واتساب"
                onPress={() =>
                  open(whatsapp(trip.customerPhone as string, `أنا ${me.data?.name ?? 'المندوب'} من وقتي، معايا طلبك رقم ${trip.number}.`))
                }
              />
            </>
          ) : null}
          {trip.lat != null && trip.lng != null ? <Small icon="map" label="الخريطة" onPress={() => open(mapUrl(trip.lat as number, trip.lng as number))} /> : null}
        </View>
        {trip.customerPhone ? (
          <Txt size={14} color={colors.muted}>
            رقم الزبون: {formatPhone(trip.customerPhone)}
          </Txt>
        ) : null}
      </Card>

      <View style={styles.collect}>
        <Txt size={16} color={colors.onAccentSoft}>
          {trip.paymentMethod === 'cash' ? 'حصّل كاش' : 'الزبون هيحوّلك'}
        </Txt>
        <Txt display weight={700} size={34} color={colors.onAccent}>
          {money(trip.total)}
        </Txt>
        {change ? (
          <Txt size={16} weight={600} color={colors.mint}>
            معاه {money(trip.payWith as number)}، هاتله باقي {money(change)}
          </Txt>
        ) : null}
      </View>

      <PrimaryButton
        label={allPicked ? 'وصّلت' : errand ? 'اشتري الأول' : 'استلم من المحلات الأول'}
        disabled={!allPicked || done.isPending}
        onPress={() => setConfirm(true)}
      />

      <Sheet visible={confirm} onClose={() => setConfirm(false)} title="سلّمت الطلب؟">
        <Txt size={17} weight={500}>
          {trip.paymentMethod === 'cash' ? `استلمت ${money(trip.total)} كاش من الزبون؟` : `الزبون حوّلك ${money(trip.total)}؟`}
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton label={done.isPending ? 'لحظة…' : 'أيوه، سلّمت'} disabled={done.isPending} onPress={() => done.mutate()} />
          <SecondaryButton label="لسه" onPress={() => setConfirm(false)} />
        </View>
      </Sheet>
    </ScrollView>
  );
}

function StoreStep({ store }: { store: TripStore }) {
  const toast = useToast((s) => s.show);
  const picked = store.status === 'picked_up';
  const ready = store.status === 'ready';
  const pick = useMutation({
    mutationFn: () => pickUp(store.orderStoreId),
    onSuccess: () => {
      refreshAll();
      toast(`استلمت من ${store.name}`);
    },
    onError: (e) => toast(friendlyError(e)),
  });

  return (
    <Card style={picked ? styles.storeDone : styles.store}>
      <View style={styles.storeHead}>
        <View style={styles.flex}>
          <Txt weight={700} size={18}>
            {store.name}
          </Txt>
          <Txt size={15} color={colors.body}>
            {store.area} · {itemsWord(store.pieces)} · {money(store.subtotal)}
          </Txt>
        </View>
        <View style={[styles.pill, { backgroundColor: picked ? colors.successSoft : ready ? colors.mintSoft : colors.warningSoft }]}>
          <Txt size={14} weight={600} color={picked ? colors.success : ready ? colors.ink : colors.warning}>
            {picked ? 'استلمت' : ready ? 'جاهز' : 'بيتجهّز'}
          </Txt>
        </View>
      </View>
      {picked ? null : (
        <>
          <View style={styles.buttons}>
            {store.phone ? <Small icon="phone" label="كلّم المحل" onPress={() => open(`tel:${store.phone}`)} /> : null}
            {store.lat != null && store.lng != null ? <Small icon="map" label="الخريطة" onPress={() => open(mapUrl(store.lat as number, store.lng as number))} /> : null}
          </View>
          <PrimaryButton
            label={pick.isPending ? 'لحظة…' : ready ? 'استلمت من المحل' : 'استلمت (المحل لسه مقالش جاهز)'}
            tone={ready ? colors.accent : colors.body}
            disabled={pick.isPending}
            onPress={() => pick.mutate()}
          />
        </>
      )}
    </Card>
  );
}

function Step({ icon, title, note, badge, good = false }: { icon: IconName; title: string; note?: string; badge?: string; good?: boolean }) {
  return (
    <View style={styles.step}>
      <Icon name={icon} size={22} color={colors.accent} />
      <View style={styles.flex}>
        <Txt weight={600} size={16}>
          {title}
        </Txt>
        {note ? (
          <Txt size={14} color={colors.muted} numberOfLines={1}>
            {note}
          </Txt>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.pill, { backgroundColor: good ? colors.mintSoft : colors.warningSoft }]}>
          <Txt size={13} weight={600} color={good ? colors.ink : colors.warning}>
            {badge}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

function Small({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.small, pressed && ui.pressed]}>
      <Icon name={icon} size={20} color={colors.accent} />
      <Txt size={15} weight={600} color={colors.accent}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  wide: { alignSelf: 'stretch', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.accent },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' },
  toggleOn: { backgroundColor: colors.mint },
  dot: { width: 10, height: 10, borderRadius: 5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { marginTop: 14, marginBottom: 10 },
  offer: { marginBottom: 14, gap: 8 },
  offerHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  timer: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.accentSoft },
  timerFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  cashRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.successSoft, marginBottom: 4 },
  tripHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.ink, ...elevation.raised },
  store: { marginBottom: 12, gap: 10 },
  storeDone: { marginBottom: 12, gap: 10, opacity: 0.6 },
  storeHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  small: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  customer: { gap: 6 },
  collect: { alignItems: 'center', gap: 2, marginVertical: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.accent },
  sheetActions: { gap: 10, marginTop: 4 },
});
