import { latinDigits } from '@/state/settings';

/**
 * Makes Arabic text comparable the way people type it: «بقاله» finds «بقالة»,
 * «اسكندرانى» finds «اسكندراني», and hamza or tashkeel never get in the way.
 */
export function normalizeArabic(text: string) {
  return latinDigits(text)
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // tashkeel and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 0 = the name is the query, 1 = starts with it, 2 = contains it, 3 = only the description matches. */
export function rankMatch(name: string, query: string) {
  const n = normalizeArabic(name);
  const q = normalizeArabic(query);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

/** True when every word of the query appears in the text. */
export function matches(text: string, query: string) {
  const haystack = normalizeArabic(text);
  return normalizeArabic(query)
    .split(' ')
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
