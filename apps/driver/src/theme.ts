import type { ViewStyle } from 'react-native';

/**
 * Color roles for «واو» (و = «وقتي»): Waw Violet for actions, Plum Ink for
 * text, Mint for the "yours / done" highlight, on Lilac White.
 */
export const colors = {
  /** Plum Ink: titles and prices (16:1 on Lilac White). */
  ink: '#1A0F3D',
  body: '#3A3260',
  /** Secondary text. Dark enough for older eyes (about 8:1 on Lilac White). */
  muted: '#4E4A6B',
  /** Lilac White: the screen background. */
  sand: '#F7F4FF',
  card: '#FFFFFF',
  field: '#F1ECFF',
  line: '#E8E2F7',
  border: '#DDD5F2',
  divider: '#EDE8FA',
  radioOff: '#B5ABD3',
  /** Waw Violet: buttons, the active tab, links. White on it is 5.6:1. */
  accent: '#7A35FF',
  accentSoft: '#EEE6FF',
  /** Text and icons on the violet header. */
  onAccent: '#FFFFFF',
  onAccentSoft: 'rgba(255,255,255,0.85)',
  /** Mint: "your shop", undo, delivered. Never white text on it; use ink. */
  mint: '#5CF2C4',
  mintSoft: '#DDFBF2',
  /** The "busy" dot on the violet header. */
  saffronDot: '#FFC94D',
  star: '#D9950F',
  success: '#127A55',
  successSoft: '#E3F3EC',
  warning: '#A85A00',
  warningSoft: '#FFF0D9',
  danger: '#B42318',
  dangerSoft: '#FDE8E7',
  scrim: 'rgba(0,0,0,0.45)',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display600: 'Alexandria_600SemiBold',
  display700: 'Alexandria_700Bold',
  body400: 'ReadexPro_400Regular',
  body500: 'ReadexPro_500Medium',
  body600: 'ReadexPro_600SemiBold',
} as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 20, sheet: 28, pill: 999 } as const;

/** Text below this size is never used; older customers can't read it. */
export const MIN_TEXT = 13;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;
