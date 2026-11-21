import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { deliveryDays } from '@/lib/schedule';
import { colors } from '@/theme';

import { Txt } from './txt';
import { Card, Chip } from './ui';

/**
 * «إمتى؟»: now (with today's promise), or a half-hour slot up to 3 days ahead.
 * value = null means now; otherwise the chosen time in ms.
 */
export function WhenPicker({ value, onChange, nowLabel }: { value: number | null; onChange: (at: number | null) => void; nowLabel: string }) {
  const [days] = useState(() => deliveryDays());
  const [dayKey, setDayKey] = useState<number>(() => days[0]?.key ?? 0);
  const later = value != null;
  const day = days.find((d) => d.key === dayKey) ?? days[0];

  return (
    <Card style={styles.card}>
      <Txt display weight={600} size={17}>
        إمتى؟
      </Txt>
      <View style={styles.row}>
        <Chip label={nowLabel} selected={!later} onPress={() => onChange(null)} />
        <Chip label="وقت تاني" selected={later} onPress={() => onChange(day?.slots[0]?.at ?? null)} />
      </View>
      {later && day ? (
        <>
          <View style={styles.row}>
            {days.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                selected={d.key === day.key}
                onPress={() => {
                  setDayKey(d.key);
                  onChange(d.slots[0].at);
                }}
              />
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slots}>
            {day.slots.map((s) => (
              <Chip key={s.at} label={s.label} selected={value === s.at} onPress={() => onChange(s.at)} />
            ))}
          </ScrollView>
          <Txt size={14} color={colors.muted}>
            المحل مش هيشوف الطلب غير قبل ميعادك بساعة، والمندوب يتحرك قبله بشوية.
          </Txt>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slots: { gap: 8, paddingVertical: 2 },
});
