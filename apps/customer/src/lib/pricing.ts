import type { Store } from '@/data/types';

/*
 * Delivery, like Talabat: by distance, the same rules as public.delivery_fee()
 * in supabase/004_money_like_talabat.sql (the server prices the real order).
 */
export const EXTRA_STORE_FEE = 7;
/** The most a customer ever pays for one trip. */
export const MAX_DELIVERY = 30;
/** One trip collects from at most this many stores. */
export const MAX_STORES = 3;

/** 15 up to 1 km, 20 up to 2.5 km, 25 beyond; 20 when the shop has no location yet. */
export function baseFee(km: number | null) {
  if (km == null) return 20;
  if (km <= 1) return 15;
  if (km <= 2.5) return 20;
  return 25;
}

export type TripFee = {
  /** Fee for the farthest shop. */
  base: number;
  /** 7 for each extra shop. */
  extras: number;
  /** What the customer pays, capped at MAX_DELIVERY. */
  total: number;
  /** Distance to the farthest shop, km. */
  km: number | null;
  /** How much the cap took off. */
  capDiscount: number;
};

/** The delivery fee for a trip through these shops. */
export function tripFee(stores: Pick<Store, 'distanceKm'>[]): TripFee {
  if (stores.length === 0) return { base: 0, extras: 0, total: 0, km: null, capDiscount: 0 };
  // Like SQL max(): shops without a location are skipped.
  const known = stores.map((s) => s.distanceKm).filter((d): d is number => d != null);
  const km = known.length ? Math.max(...known) : null;
  const base = baseFee(km);
  const extras = EXTRA_STORE_FEE * (stores.length - 1);
  const total = Math.min(MAX_DELIVERY, base + extras);
  return { base, extras, total, km, capDiscount: base + extras - total };
}

/** Whether a shop takes orders right now (the shop app can close or pause it). */
export function storeOpen(store: Pick<Store, 'isOpen' | 'pausedUntil'>, now = Date.now()) {
  return store.isOpen && !(store.pausedUntil && new Date(store.pausedUntil).getTime() > now);
}

/** Minutes we promise; late orders get the next delivery free. */
export function guaranteeMinutes(stores: Store[]) {
  if (stores.length === 0) return 0;
  const slowest = Math.max(...stores.map((s) => s.etaMax));
  return slowest + 5 + 5 * Math.max(0, stores.length - 1);
}

const NBSP = ' ';
const FIVE_MINUTES = 5 * 60_000;

/** "8:40 م": the promise as a clock time, which older customers act on. Never splits across lines. */
export function clockTime(date: Date) {
  return date.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, NBSP);
}

/**
 * The promised arrival, rounded up to the next 5 minutes, so checkout, the
 * confirm sheet and the order page all show the same time («قبل 5:00»).
 */
export function arrivalBy(minutes: number, from = new Date()) {
  const at = from.getTime() + minutes * 60_000;
  return clockTime(new Date(Math.ceil(at / FIVE_MINUTES) * FIVE_MINUTES));
}

/** The time quoted at checkout when this device has it, otherwise placed time + guarantee. */
export function promisedArrival(quoted: number | undefined, minutes: number, placedAt: string) {
  return quoted ? clockTime(new Date(quoted)) : arrivalBy(minutes, new Date(placedAt));
}

export function money(amount: number) {
  return `${amount}${NBSP}جنيه`;
}

/** Arabic counting: one, two, 3–10 take the plural, 11+ the singular. */
function counted(count: number, one: string, two: string, plural: string, single: string) {
  if (count === 1) return one;
  if (count === 2) return two;
  if (count <= 10) return `${count} ${plural}`;
  return `${count} ${single}`;
}

export function storesWord(count: number) {
  return counted(count, 'محل واحد', 'محلين', 'محلات', 'محل');
}

/** Counts pieces in the cart; «صنف» means a kind of item, so we say «حاجة». */
export function itemsWord(count: number) {
  return counted(count, 'حاجة واحدة', 'حاجتين', 'حاجات', 'حاجة');
}
