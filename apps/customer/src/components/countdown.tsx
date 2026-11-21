import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme';

import { Txt } from './txt';

const SIZE = 84;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * R;

/**
 * «باقي 18 دقيقة» inside a ring that empties as the promise runs out.
 * Turns to the warning colour once late (the next delivery is then on us).
 */
export function Countdown({ minutesLeft, totalMinutes, late }: { minutesLeft: number; totalMinutes: number; late: boolean }) {
  const share = late ? 1 : Math.min(1, Math.max(0, minutesLeft / Math.max(1, totalMinutes)));
  const tone = late ? colors.warning : colors.accent;
  return (
    <View style={styles.wrap} accessibilityLabel={late ? 'اتأخرنا' : `باقي ${minutesLeft} دقيقة`}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.accentSoft} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={tone}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${LENGTH * share} ${LENGTH}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <Txt display weight={700} size={22} color={tone} align="center">
        {late ? '!' : minutesLeft}
      </Txt>
      <Txt size={13} color={colors.muted} align="center" style={styles.unit}>
        {late ? 'اتأخرنا' : 'دقيقة'}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  unit: { marginTop: -4 },
});
