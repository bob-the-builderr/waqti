import Svg, { G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/** One calligraphic و, drawn from the brand board's logo (brand/round1/waw-logo.svg). */
const WAW =
  'M132,34C158,34 172,56 170,84C168,120 146,150 108,164C84,172 56,172 26,166C70,160 104,148 124,126C110,128 94,120 92,98C90,62 108,34 132,34ZM132,62C122,62 116,70 116,82C116,94 122,102 132,102C142,102 148,94 148,82C148,70 142,62 132,62Z';

/** The logo: the letter و alone, in a rounded tile (violet و on white, or the reverse). */
export function WawLogo({ size = 40, tile = colors.white, letter = colors.accent }: { size?: number; tile?: string; letter?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityRole="image" accessibilityLabel="وقتي">
      <Rect x={0} y={0} width={200} height={200} rx={52} fill={tile} />
      {/* The glyph spans x 26–170, y 34–172; centre it in the tile. */}
      <G transform="translate(4 -4)">
        <Path d={WAW} fill={letter} fillRule="evenodd" />
      </G>
    </Svg>
  );
}

/** The «واو» wordmark: و ا و, read right to left. */
export function WawMark({ height = 32, color = colors.white }: { height?: number; color?: string }) {
  const width = (height * 304) / 176;
  return (
    <Svg width={width} height={height} viewBox="36 0 304 176" accessibilityRole="image" accessibilityLabel="واو">
      <G transform="translate(16 0)">
        <Path d={WAW} fill={color} fillRule="evenodd" />
      </G>
      <Rect x={190} y={8} width={28} height={120} rx={14} fill={color} />
      <G transform="translate(164 0)">
        <Path d={WAW} fill={color} fillRule="evenodd" />
      </G>
    </Svg>
  );
}
