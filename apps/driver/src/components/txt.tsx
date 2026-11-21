import { Text, type TextProps, type TextStyle } from 'react-native';

import { useSettings } from '@/state/settings';
import { colors, fonts, MIN_TEXT } from '@/theme';

type Weight = 400 | 500 | 600 | 700;

type Props = TextProps & {
  size?: number;
  weight?: Weight;
  /** Alexandria for titles; Readex Pro otherwise. */
  display?: boolean;
  color?: string;
  align?: TextStyle['textAlign'];
};

function familyFor(weight: Weight, display: boolean) {
  if (display) return weight >= 700 ? fonts.display700 : fonts.display600;
  if (weight >= 600) return fonts.body600;
  if (weight === 500) return fonts.body500;
  return fonts.body400;
}

/** All text in the app. Sizes never go below MIN_TEXT, and grow with "big text". */
export function Txt({ size = 15, weight = 400, display = false, color = colors.ink, align, style, ...rest }: Props) {
  const scale = useSettings((s) => (s.bigText ? 1.2 : 1));
  const fontSize = Math.round(Math.max(size, MIN_TEXT) * scale * 2) / 2;
  const lineHeight = Math.round(fontSize * (display ? 1.4 : 1.55));
  return (
    <Text
      {...rest}
      style={[{ fontFamily: familyFor(weight, display), fontSize, color, lineHeight }, align ? { textAlign: align } : null, style]}
    />
  );
}

/** Font size for TextInputs, which don't go through Txt. */
export function useInputSize(size: number) {
  const scale = useSettings((s) => (s.bigText ? 1.2 : 1));
  return Math.round(size * scale);
}
