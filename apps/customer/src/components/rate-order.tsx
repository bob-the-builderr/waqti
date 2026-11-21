import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { friendlyError, rateOrder } from '@/data/api';
import { keys } from '@/data/queries';
import { useToast } from '@/state/toast';
import { colors, fonts, radius } from '@/theme';

import { Star } from './icon';
import { Txt, useInputSize } from './txt';
import { Card, PrimaryButton } from './ui';

const words = ['', 'وحش', 'مش أحسن حاجة', 'كويس', 'حلو', 'ممتاز'];

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 5, now: value }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} من 5`} hitSlop={4} onPress={() => onChange(n)} style={styles.star}>
          <Star size={34} off={n > value} />
        </Pressable>
      ))}
    </View>
  );
}

/** «قيّم طلبك»: stars for the shop(s) and the rider, and a line if they want. */
export function RateOrderCard({ orderId, storeNames }: { orderId: string; storeNames: string[] }) {
  const [shop, setShop] = useState(0);
  const [rider, setRider] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const toast = useToast((s) => s.show);
  const client = useQueryClient();
  const inputSize = useInputSize(15);

  const send = useMutation({
    mutationFn: () => rateOrder(orderId, shop, rider || null, comment),
    onSuccess: () => {
      setDone(true);
      toast('شكراً! كلامك بيوصل للمحل وللمندوب');
      client.invalidateQueries({ queryKey: keys.orders });
    },
    onError: (e) => toast(friendlyError(e)),
  });

  if (done) return null;
  return (
    <Card style={styles.card}>
      <Txt display weight={700} size={18}>
        إزاي كان طلبك؟
      </Txt>
      <View style={styles.block}>
        <Txt size={15} weight={600}>
          {storeNames.join(' + ')}
        </Txt>
        <Stars value={shop} onChange={setShop} label="تقييم المحل" />
        {shop ? (
          <Txt size={14} color={colors.muted}>
            {words[shop]}
          </Txt>
        ) : null}
      </View>
      <View style={styles.block}>
        <Txt size={15} weight={600}>
          المندوب
        </Txt>
        <Stars value={rider} onChange={setRider} label="تقييم المندوب" />
      </View>
      {shop ? (
        <TextInput
          accessibilityLabel="عايز تقول حاجة؟"
          placeholder="عايز تقول حاجة؟ (مش لازم)"
          placeholderTextColor={colors.muted}
          value={comment}
          onChangeText={setComment}
          maxLength={500}
          style={[styles.input, { fontSize: inputSize }]}
        />
      ) : null}
      <PrimaryButton label={send.isPending ? 'لحظة…' : 'ابعت التقييم'} disabled={!shop || send.isPending} onPress={() => send.mutate()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, borderWidth: 1.5, borderColor: colors.accent },
  block: { gap: 4 },
  stars: { flexDirection: 'row', gap: 2 },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    height: 50,
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
