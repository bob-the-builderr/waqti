import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { QtyControl } from '@/components/qty-control';
import { ProductPhoto, StoreThumb } from '@/components/photo';
import { WhenPicker } from '@/components/when-picker';
import { StoreMark } from '@/components/store-tiles';
import { Txt, useInputSize } from '@/components/txt';
import {
  Banner,
  BottomBar,
  Card,
  Chip,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Sheet,
  styles as ui,
} from '@/components/ui';
import { friendlyError, placeOrder, type OrderInput } from '@/data/api';
import { keys, queryClient, useStores } from '@/data/queries';
import type { Product, Store } from '@/data/types';
import { clockTime, EXTRA_STORE_FEE, guaranteeMinutes, MAX_DELIVERY, MAX_STORES, money, storesWord, tripFee } from '@/lib/pricing';
import { whenText } from '@/lib/schedule';
import { promiseFrom, usePromises } from '@/state/promises';
import { useAddress } from '@/state/address';
import { groupCart, useCart } from '@/state/cart';
import { formatPhone, normalizePhone, useSettings } from '@/state/settings';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

type Missing = OrderInput['missing'];
type Payment = OrderInput['payment'];

const NOTES = [50, 100, 200, 500, 1000];

export default function CheckoutScreen() {
  const address = useAddress((s) => s.current);
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const clear = useCart((s) => s.clear);
  const toast = useToast((s) => s.show);
  const stores = useStores();
  const savedPhone = useSettings((s) => s.phone);
  const setPhone = useSettings((s) => s.setPhone);
  const inputSize = useInputSize(18);
  const [missing, setMissing] = useState<Missing>('call');
  const [payment, setPayment] = useState<Payment>('cash');
  const [payWith, setPayWith] = useState<number | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // When the promise was quoted: set on opening the screen, refreshed when the confirm sheet opens.
  const [quotedAt, setQuotedAt] = useState(() => Date.now());
  // null = now; otherwise the chosen time for later (ms).
  const [when, setWhen] = useState<number | null>(null);
  const remember = usePromises((s) => s.remember);

  const order = useMutation({
    mutationFn: (input: OrderInput & { promisedAt: number }) => placeOrder(input),
    onSuccess: (placed, input) => {
      remember(placed.orderId, input.promisedAt);
      setConfirmOpen(false);
      clear();
      queryClient.invalidateQueries({ queryKey: keys.orders });
      router.replace({ pathname: '/order/[id]', params: { id: placed.orderId, fresh: '1' } });
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast(friendlyError(error));
    },
  });

  const groups = groupCart(lines);
  if (groups.length === 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="السلة" />
        <View style={styles.empty}>
          <Icon name="cart" size={48} color={colors.muted} strokeWidth={1.5} />
          <Txt weight={600} size={18} align="center">
            سلتك فاضية
          </Txt>
          <Txt size={15} color={colors.body} align="center">
            ضيف من لحد 3 محلات، وهيجيلك كله مع مندوب واحد.
          </Txt>
          <View style={styles.emptyAction}>
            <PrimaryButton label="شوف المحلات" onPress={() => router.replace('/stores')} />
          </View>
        </View>
      </View>
    );
  }

  const hasPharmacy = groups.some((g) => g.store.isPharmacy);
  const missingChoice: Missing = hasPharmacy && missing === 'substitute' ? 'call' : missing;
  const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const trip = tripFee(groups.map((g) => g.store));
  const fee = trip.total;
  const total = subtotal + fee;
  const minutes = guaranteeMinutes(groups.map((g) => g.store));
  const nowPromise = promiseFrom(minutes, quotedAt);
  const promisedAt = when ?? nowPromise;
  const arrival = clockTime(new Date(promisedAt));
  // «قبل الساعة 7:40» for now; «بكرة الساعة 10:30 ص» for later.
  const promiseText = when ? `هيوصلك ${whenText(when)}` : `قبل الساعة ${arrival}`;
  const notes = NOTES.filter((n) => n > total).slice(0, 3);
  const phone = savedPhone && !editingPhone ? savedPhone : null;

  const inCartIds = groups.map((g) => g.store.id);
  const inCartCategories = groups.map((g) => g.store.categoryId);
  // The nearest shop of each section the cart doesn't have yet (pharmacy, bakery, vegetables…).
  const suggestions: Store[] = [];
  if (groups.length < MAX_STORES) {
    for (const s of stores.data ?? []) {
      if (suggestions.length === 3) break;
      if (inCartIds.includes(s.id) || inCartCategories.includes(s.categoryId)) continue;
      if (suggestions.some((x) => x.categoryId === s.categoryId)) continue;
      suggestions.push(s);
    }
  }

  const onRemove = (product: Product) => {
    const removed = remove(product.id);
    if (removed) toast(`اتشال ${product.name} من السلة`, { label: 'رجّعه', onPress: () => restore(removed) });
  };

  const savePhone = () => {
    const normalized = normalizePhone(phoneDraft);
    if (!normalized) {
      setPhoneError('اكتب رقم موبايل مصري من 11 رقم، زي 01012345678');
      return null;
    }
    setPhone(normalized);
    setPhoneError(null);
    setEditingPhone(false);
    return normalized;
  };

  const review = () => {
    if (order.isPending) return;
    const ready = phone ?? savePhone();
    if (!ready) return;
    setQuotedAt(Date.now());
    setConfirmOpen(true);
  };

  const submit = () => {
    if (order.isPending || !savedPhone) return;
    order.mutate({
      items: Object.values(lines).map((l) => ({ productId: l.product.id, qty: l.qty, note: l.note })),
      scheduledFor: when ? new Date(when).toISOString() : null,
      payment,
      missing: missingChoice,
      phone: savedPhone,
      payWith: payment === 'cash' ? payWith : null,
      promisedAt,
    });
  };

  const payText =
    payment === 'cash'
      ? `هتدفع ${money(total)} كاش للمندوب لما يوصل.`
      : `هتحوّل ${money(total)} للمندوب من موبايلك لما يوصل.`;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="مراجعة الطلب" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Banner icon="shield" tone={colors.successSoft} iconColor={colors.success}>
          <Txt display weight={700} size={18}>
            وعد وقتي: {promiseText}
          </Txt>
          <Txt size={15} color={colors.body}>
            مضمون. لو اتأخرنا، التوصيل الجاي علينا من غير ما تكلم حد.
          </Txt>
        </Banner>

        <Card style={styles.gap}>
          <View style={styles.address}>
            <View style={styles.addressIcon}>
              <Icon name="pin" color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Txt weight={600} size={16}>
                {address.label} · {address.areaName}
              </Txt>
              <Txt size={14} color={colors.body}>
                {address.details}
              </Txt>
              <Txt size={14} color={colors.body}>
                جنب: {address.landmark.replace(/^جنب /, '')}
              </Txt>
            </View>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/address')}>
              <Txt size={15} weight={600} color={colors.accent}>
                تغيير
              </Txt>
            </Pressable>
          </View>
        </Card>

        <View style={styles.gap}>
          <WhenPicker value={when} onChange={setWhen} nowLabel={`دلوقتي · قبل ${clockTime(new Date(nowPromise))}`} />
        </View>

        {groups.map((group) => (
          <Card key={group.store.id} style={styles.gap}>
            <View style={styles.groupHead}>
              <StoreMark store={group.store} size={36} />
              <Txt weight={600} size={16} style={styles.flex} numberOfLines={1}>
                {group.store.name}
              </Txt>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push(`/store/${group.store.id}`)}>
                <Txt size={15} weight={600} color={colors.accent}>
                  + ضيف حاجات
                </Txt>
              </Pressable>
            </View>
            {group.items.map(({ product, qty, total: lineTotal, note }) => (
              <View key={product.id} style={styles.line}>
                <ProductPhoto product={product} rounded={radius.sm} style={styles.thumb} />
                <View style={styles.flex}>
                  <Txt size={15} weight={500}>
                    {product.name}
                  </Txt>
                  <Txt size={14} color={colors.muted}>
                    {product.note ? `${product.note} · ` : ''}
                    {money(lineTotal)}
                  </Txt>
                  {note ? (
                    <Txt size={14} weight={600} color={colors.accent}>
                      ملاحظة: {note}
                    </Txt>
                  ) : null}
                </View>
                <QtyControl
                  qty={qty}
                  label={product.name}
                  onAdd={() => add(product, group.store)}
                  onRemove={() => onRemove(product)}
                />
              </View>
            ))}
          </Card>
        ))}

        {suggestions.length > 0 ? (
          <Card style={styles.gap}>
            <Txt weight={600} size={16}>
              وكمان محل؟
            </Txt>
            <Txt size={14} color={colors.body}>
              نفس المندوب يجيبها معاك بـ{EXTRA_STORE_FEE} جنيه بس زيادة.
            </Txt>
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <Suggestion key={s.id} store={s} />
              ))}
            </View>
          </Card>
        ) : null}

        <Section title="رقم موبايلك">
          {phone ? (
            <View style={styles.phoneRow}>
              <Icon name="phone" size={20} color={colors.accent} />
              <Txt size={16} weight={600} style={styles.flex}>
                هنكلمك على {formatPhone(phone)}
              </Txt>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  setPhoneDraft(phone);
                  setEditingPhone(true);
                }}>
                <Txt size={15} weight={600} color={colors.accent}>
                  تغيير
                </Txt>
              </Pressable>
            </View>
          ) : (
            <>
              <Txt size={14} color={colors.body}>
                عشان المحل والمندوب يقدروا يكلموك لو فيه حاجة.
              </Txt>
              <TextInput
                accessibilityLabel="رقم موبايلك"
                placeholder="01012345678"
                placeholderTextColor={colors.radioOff}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={14}
                value={phoneDraft}
                onChangeText={(t) => {
                  setPhoneDraft(t);
                  if (phoneError) setPhoneError(null);
                }}
                onSubmitEditing={savePhone}
                style={[styles.phoneInput, { fontSize: inputSize }, phoneError ? styles.inputError : null]}
              />
              {phoneError ? (
                <Txt size={15} weight={500} color={colors.danger}>
                  {phoneError}
                </Txt>
              ) : null}
            </>
          )}
        </Section>

        <Section title="لو حاجة مش موجودة في المحل">
          <Option
            label="كلّموني الأول"
            hint="المحل هيتصل بيك قبل ما يكمّل"
            selected={missingChoice === 'call'}
            onPress={() => setMissing('call')}
          />
          {hasPharmacy ? null : (
            <Option
              label="هاتوا زيّها بنفس السعر أو أقل"
              selected={missingChoice === 'substitute'}
              onPress={() => setMissing('substitute')}
            />
          )}
          <Option label="شيلوها من الحساب" selected={missingChoice === 'remove'} onPress={() => setMissing('remove')} />
          {hasPharmacy ? (
            <Txt size={14} color={colors.body}>
              في الدوا مفيش بديل من غير ما الصيدلي يكلمك.
            </Txt>
          ) : null}
        </Section>

        <Section title="الدفع">
          <Option label="كاش للمندوب لما يوصل" selected={payment === 'cash'} onPress={() => setPayment('cash')} />
          <Option
            label="تحويل من الموبايل للمندوب"
            hint="فودافون كاش أو إنستاباي، وهو عندك"
            selected={payment === 'wallet'}
            onPress={() => setPayment('wallet')}
          />
          <Txt size={15} weight={500} color={colors.success}>
            مش هتدفع أي حاجة قبل ما الطلب يوصلك.
          </Txt>
          {payment === 'cash' ? (
            <>
              <Txt size={15} weight={500} style={styles.subTitle}>
                هتدفع بفئة كام؟ عشان المندوب يجيبلك الباقي
              </Txt>
              <View style={styles.chips}>
                <Chip label="المبلغ مظبوط" selected={payWith === null} onPress={() => setPayWith(null)} />
                {notes.map((n) => (
                  <Chip key={n} label={`${n} جنيه`} selected={payWith === n} onPress={() => setPayWith(n)} />
                ))}
              </View>
            </>
          ) : null}
        </Section>

        <Card style={styles.gap}>
          <Row label="حساب الحاجات" value={money(subtotal)} />
          <Row label={trip.km != null ? `التوصيل (${trip.km} كم)` : 'التوصيل'} value={money(trip.base)} />
          {groups.length > 1 ? (
            <Row label={`${storesWord(groups.length - 1)} زيادة × ${EXTRA_STORE_FEE} جنيه`} value={money(trip.extras)} />
          ) : null}
          {trip.capDiscount > 0 ? (
            <Row label={`أقصى توصيل ${MAX_DELIVERY} جنيه`} value={`− ${money(trip.capDiscount)}`} />
          ) : null}
          <View style={styles.totalRow}>
            <Txt weight={700} size={20}>
              الإجمالي
            </Txt>
            <Txt weight={700} size={22}>
              {money(total)}
            </Txt>
          </View>
          <Txt size={15} color={colors.body}>
            .. وبس. من غير رسوم خدمة ولا تغليف، والأسعار هي أسعار الرف في المحل.
          </Txt>
        </Card>
      </ScrollView>
      <BottomBar>
        <PrimaryButton label="وصّلي" trailing={money(total)} onPress={review} />
      </BottomBar>

      <Sheet visible={confirmOpen} onClose={() => (order.isPending ? null : setConfirmOpen(false))} title="نبعت الطلب؟">
        <Txt size={17} weight={500}>
          {payText}
        </Txt>
        <Txt size={17} weight={500}>
          {when ? `${promiseText}.` : `هيوصلك قبل الساعة ${arrival}.`}
        </Txt>
        <Txt size={15} color={colors.body}>
          من: {groups.map((g) => g.store.name).join('، ')}
        </Txt>
        <View style={styles.sheetActions}>
          <PrimaryButton
            label={order.isPending ? 'بنبعت طلبك…' : 'أيوه، وصّلي'}
            disabled={order.isPending}
            onPress={submit}
          />
          <SecondaryButton label="لأ، استنى" onPress={() => setConfirmOpen(false)} />
        </View>
      </Sheet>
    </View>
  );
}

function Suggestion({ store }: { store: Store }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={store.name}
      onPress={() => router.push(`/store/${store.id}`)}
      style={({ pressed }) => [styles.suggestion, pressed && ui.pressed]}>
      <StoreThumb store={store} size={56} />
      <Txt size={14} weight={500} align="center" numberOfLines={2}>
        {store.name}
      </Txt>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt display weight={600} size={17}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

function Option({ label, hint, selected, onPress }: { label: string; hint?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentSoft : colors.card },
        pressed && ui.pressed,
      ]}>
      <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.radioOff }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.flex}>
        <Txt size={16} weight={selected ? 600 : 400}>
          {label}
        </Txt>
        {hint ? (
          <Txt size={14} color={colors.body}>
            {hint}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Txt size={16} style={styles.flex}>
        {label}
      </Txt>
      <Txt size={16} weight={500}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 48, height: 48 },
  screen: { flex: 1, backgroundColor: colors.sand },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 28 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyAction: { alignSelf: 'stretch', marginTop: 10 },
  address: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  gap: { marginTop: 12 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider },
  suggestions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  suggestion: { flex: 1, alignItems: 'center', gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: colors.field },
  section: { marginTop: 22, gap: 8 },
  subTitle: { marginTop: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.card },
  phoneInput: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.body600,
    color: colors.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  inputError: { borderColor: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  summaryRow: { flexDirection: 'row', gap: 10, paddingVertical: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  sheetActions: { marginTop: 6, gap: 10 },
});
