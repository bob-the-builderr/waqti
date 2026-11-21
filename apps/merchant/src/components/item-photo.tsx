import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/theme';


const isPackshot = (url: string) => url.includes('/ingredients/') || url.toLowerCase().endsWith('.png');
const BRAND_COLORS = ['#1F5FAD', '#C8102E', '#0E7A4F', '#6B2FB3', '#D35400', '#0B6E8C', '#A6192E', '#2D4A9E', '#7A4B00', '#00796B'];
function brandColor(brand: string) {
  let h = 0;
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0;
  return BRAND_COLORS[h % BRAND_COLORS.length];
}

/** The item's photo as customers see it, or the brand / name card used until it has one. */
export function ItemPhoto({
  image,
  brand,
  name,
  size,
  style,
}: {
  image: string | null;
  brand?: string | null;
  name: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const title = brand?.trim() || name;
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: Math.min(radius.md, size / 4) }, style]}>
      {image ? (
        <Image source={image} contentFit={isPackshot(image) ? 'contain' : 'cover'} transition={120} style={isPackshot(image) ? styles.pack : StyleSheet.absoluteFill} />
      ) : (
        <View style={[styles.named, { backgroundColor: brand ? brandColor(brand) : colors.photo }]}>
          {/* Decorative: the item's name is written beside it, so this label may go below the 13px text floor. */}
          <Text
            accessible={false}
            numberOfLines={1}
            style={[styles.label, { fontSize: Math.max(8, Math.min(22, (size - 8) / (Math.max(title.length, 4) * 0.75))), color: brand ? colors.white : colors.body }]}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.photo },
  pack: { position: 'absolute', top: '8%', bottom: '8%', left: '8%', right: '8%' },
  named: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  label: { fontFamily: fonts.display700, textAlign: 'center' },
});
