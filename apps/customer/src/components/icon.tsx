import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

const shapes = {
  pin: (
    <>
      <Path d="M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
      <Circle cx="12" cy="9.6" r="2.4" />
    </>
  ),
  chevronDown: <Path d="M6 9l6 6 6-6" />,
  /** Back in a right-to-left app points right. */
  back: <Path d="M9 6l6 6-6 6" />,
  /** "Go into" in a right-to-left app points left. */
  forward: <Path d="M15 6l-6 6 6 6" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="M20 20l-4.2-4.2" />
    </>
  ),
  home: (
    <>
      <Path d="M4 11l8-6.5 8 6.5" />
      <Path d="M6 9.8V20h12V9.8" />
      <Path d="M10 20v-5h4v5" />
    </>
  ),
  store: (
    <>
      <Path d="M4 9.5L5.5 4h13L20 9.5" />
      <Path d="M5 9.5V20h14V9.5" />
      <Path d="M4 9.5h16" />
      <Path d="M10 20v-5.5h4V20" />
    </>
  ),
  receipt: (
    <>
      <Path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.4z" />
      <Path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="3.8" />
      <Path d="M4.5 20.5c1.4-3.7 4.3-5.6 7.5-5.6s6.1 1.9 7.5 5.6" />
    </>
  ),
  bowl: (
    <>
      <Path d="M3 11h18a9 9 0 0 1-18 0z" />
      <Path d="M8 7.5c0-1.2.8-1.6.8-3M12 7.5c0-1.2.8-1.6.8-3M16 7.5c0-1.2.8-1.6.8-3" />
    </>
  ),
  cart: (
    <>
      <Path d="M3 4h2.2l2.3 10.5h10.8L20.5 7H6.4" />
      <Circle cx="9" cy="19" r="1.4" />
      <Circle cx="17" cy="19" r="1.4" />
    </>
  ),
  pharmacy: (
    <>
      <Rect x="4" y="4" width="16" height="16" rx="4" />
      <Path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  produce: (
    <>
      <Path d="M12 8c-3.5-2-8-.5-7.5 4.5.4 4.2 3.4 8 6 7.3.9-.2 1.1-.4 1.5-.4s.6.2 1.5.4c2.6.7 5.6-3.1 6-7.3C20 7.5 15.5 6 12 8z" />
      <Path d="M12 8c0-2 .8-3.6 2.8-4.6" />
    </>
  ),
  meat: (
    <>
      <Path d="M5 9.5C5 6.5 8 4.5 12 4.5c5 0 8 3 8 7 0 5-4 8.5-9 8.5-4 0-6-2-6-5 0-2 1.4-3 1.4-4.5S5 10.5 5 9.5z" />
      <Circle cx="14" cy="11.5" r="2" />
    </>
  ),
  bread: (
    <>
      <Path d="M4 11.5C4 8 7.6 6 12 6s8 2 8 5.5c0 1-.6 1.6-1.5 1.8V19a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-5.7C4.6 13.1 4 12.5 4 11.5z" />
      <Path d="M9.5 10.5l-1 2M13 10.5l-1 2M16.5 10.5l-1 2" />
    </>
  ),
  bag: (
    <>
      <Path d="M5 8h14l-1.2 12H6.2z" />
      <Path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  qr: (
    <>
      <Rect x="4" y="4" width="6" height="6" rx="1" />
      <Rect x="14" y="4" width="6" height="6" rx="1" />
      <Rect x="4" y="14" width="6" height="6" rx="1" />
      <Path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18v2M18 14h2" />
    </>
  ),
  moto: (
    <>
      <Circle cx="6" cy="16" r="3" />
      <Circle cx="18" cy="16" r="3" />
      <Path d="M9 16h5.5l2.5-5.5H13M14.5 6.5h2.5l2 5" />
    </>
  ),
  shield: (
    <>
      <Path d="M12 3l7.5 3v5.5c0 4.7-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.8-7.5-9.5V6z" />
      <Path d="M8.8 12.2l2.2 2.2 4.4-4.6" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7.5V12l3 2" />
    </>
  ),
  trash: (
    <>
      <Path d="M4.5 7h15" />
      <Path d="M9.5 7V4.8h5V7" />
      <Path d="M6.5 7l.9 12.2a1 1 0 0 0 1 .8h7.2a1 1 0 0 0 1-.8L17.5 7" />
      <Path d="M10.2 11v5.5M13.8 11v5.5" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2.3L9.3 5h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" />
      <Circle cx="12" cy="13" r="3.4" />
    </>
  ),
  phone: (
    <Path d="M6.6 3.8l2.6-.3 1.5 4-1.9 1.4a11 11 0 0 0 6.3 6.3l1.4-1.9 4 1.5-.3 2.6a2 2 0 0 1-2.2 1.7C10.6 18.6 5.4 13.4 4.9 6a2 2 0 0 1 1.7-2.2z" />
  ),
  repeat: (
    <>
      <Path d="M17 4.5l2.5 2.5L17 9.5" />
      <Path d="M19.5 7H9a4.5 4.5 0 0 0-4.5 4.5V12" />
      <Path d="M7 19.5L4.5 17 7 14.5" />
      <Path d="M4.5 17H15a4.5 4.5 0 0 0 4.5-4.5V12" />
    </>
  ),
  text: (
    <>
      <Path d="M4 18L8.5 6h1L14 18M5.6 14h6.8" />
      <Path d="M15.5 18l2.5-6.5h.6L21 18M16.3 16h4" />
    </>
  ),
  plus: <Path d="M12 5.5v13M5.5 12h13" />,
  minus: <Path d="M5.5 12h13" />,
  close: <Path d="M7 7l10 10M17 7L7 17" />,
  check: <Path d="M5.5 12.5l4.2 4.2 8.8-9.4" />,
  heart: <Path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof shapes;

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number; fill?: string };

export function Icon({ name, size = 22, color = colors.ink, strokeWidth = 1.8, fill = 'none' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {shapes[name]}
    </Svg>
  );
}

export function Star({ size = 13, off = false }: { size?: number; off?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill={off ? colors.line : colors.star} />
    </Svg>
  );
}
