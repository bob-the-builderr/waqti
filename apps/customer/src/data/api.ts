import type { IconName } from '@/components/icon';
import { supabase } from '@/lib/supabase';

import { currentAddress } from '@/state/address';

import type { Category, OrderDetail, OrderStatus, OrderSummary, PlacedOrder, Product, SavedAddress, Store, Zone } from './types';

type StoreRow = {
  id: string;
  name: string;
  mark: string;
  category_id: string;
  area: string;
  zone_id: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  eta_min: number;
  eta_max: number;
  tint: string;
  is_pharmacy: boolean;
  daily_prices: boolean;
  /** The shop's counter phone (from 002_launch_fixes.sql). */
  phone?: string | null;
  /** From 005_merchant.sql. */
  is_open?: boolean;
  paused_until?: string | null;
  /** From 010_catalog_photos.sql. */
  cover_url?: string | null;
  rating_count?: number;
  category: { name: string } | null;
};

/** Straight-line distance from the customer's chosen address, to one decimal. */
function distanceFromCustomer(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return null;
  const home = currentAddress();
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat - home.lat);
  const dLng = toRad(lng - home.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(home.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(km * 10) / 10;
}

function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    mark: row.mark,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? '',
    area: row.area,
    zoneId: row.zone_id,
    lat: row.lat,
    lng: row.lng,
    distanceKm: distanceFromCustomer(row.lat, row.lng),
    rating: Number(row.rating),
    ratingCount: row.rating_count ?? 0,
    etaMin: row.eta_min,
    etaMax: row.eta_max,
    tint: row.tint,
    isPharmacy: row.is_pharmacy,
    dailyPrices: row.daily_prices,
    phone: row.phone ?? null,
    isOpen: row.is_open ?? true,
    pausedUntil: row.paused_until ?? null,
    cover: row.cover_url ?? null,
  };
}

const STORE_COLUMNS =
  'id, name, mark, category_id, area, zone_id, lat, lng, rating, eta_min, eta_max, tint, is_pharmacy, daily_prices, category:categories(name)';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name, icon').order('sort');
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, icon: c.icon as IconName }));
}

export async function fetchStores(): Promise<Store[]> {
  // Newer columns first; fall back while a SQL file (002, 005, 010) hasn't been applied yet.
  let { data, error } = await supabase.from('stores').select(`${STORE_COLUMNS}, phone, is_open, paused_until, cover_url, rating_count`);
  if (error?.code === '42703') ({ data, error } = await supabase.from('stores').select(`${STORE_COLUMNS}, phone, is_open, paused_until, cover_url`));
  if (error?.code === '42703') ({ data, error } = await supabase.from('stores').select(`${STORE_COLUMNS}, phone, is_open, paused_until`));
  if (error?.code === '42703') ({ data, error } = await supabase.from('stores').select(`${STORE_COLUMNS}, phone`));
  if (error?.code === '42703') ({ data, error } = await supabase.from('stores').select(STORE_COLUMNS));
  if (error) throw error;
  return ((data ?? []) as unknown as StoreRow[])
    .map(toStore)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}

type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  note: string;
  price: number;
  image_url?: string | null;
  brand?: string | null;
  section?: string | null;
};
const toProduct = (p: ProductRow): Product => ({
  id: p.id,
  storeId: p.store_id,
  name: p.name,
  note: p.note,
  price: p.price,
  image: p.image_url ?? null,
  brand: p.brand || null,
  section: p.section || null,
});

/** Newest columns first; each step back drops what a SQL file not yet applied (012, then 010) adds. */
const PRODUCT_COLUMNS = [
  'id, store_id, name, note, price, image_url, brand, section',
  'id, store_id, name, note, price, image_url',
  'id, store_id, name, note, price',
];

/** Runs a products query with the newest columns the database has. */
async function queryProducts(build: (columns: string) => PromiseLike<{ data: unknown; error: { code?: string } | null }>) {
  let { data, error } = await build(PRODUCT_COLUMNS[0]);
  for (const columns of PRODUCT_COLUMNS.slice(1)) {
    if (error?.code !== '42703') break;
    ({ data, error } = await build(columns));
  }
  if (error) throw error;
  return ((data ?? []) as ProductRow[]).map(toProduct);
}

export function fetchProducts(storeId: string): Promise<Product[]> {
  return queryProducts((columns) =>
    supabase.from('products').select(columns).eq('store_id', storeId).eq('is_available', true).order('sort'),
  );
}

/** Every available item in every open store, for searching items across shops. */
export function fetchAllProducts(): Promise<Product[]> {
  return queryProducts((columns) => supabase.from('products').select(columns).eq('is_available', true).order('sort').limit(2000));
}

/** Items by id, to rebuild a past order into the cart at today's prices. */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  return queryProducts((columns) => supabase.from('products').select(columns).in('id', ids).eq('is_available', true));
}

/** Every delivery area, with its centre when 011 is in. */
export async function fetchZones(): Promise<Zone[]> {
  const query = (columns: string) => supabase.from('zones').select(columns).order('name');
  let { data, error } = await query('id, name, base_fee, extra_store_fee, lat, lng');
  if (error?.code === '42703') ({ data, error } = await query('id, name, base_fee, extra_store_fee'));
  if (error) throw error;
  return ((data ?? []) as unknown as { id: string; name: string; base_fee: number; extra_store_fee: number; lat?: number | null; lng?: number | null }[]).map((z) => ({
    id: z.id,
    name: z.name,
    baseFee: z.base_fee,
    extraStoreFee: z.extra_store_fee,
    lat: z.lat ?? null,
    lng: z.lng ?? null,
  }));
}

type AddressRow = { id: string; label: string; zone_id: string; details: string; landmark: string; lat: number | null; lng: number | null };
const toSaved = (r: AddressRow): SavedAddress => ({ id: r.id, label: r.label, zoneId: r.zone_id, details: r.details, landmark: r.landmark, lat: r.lat, lng: r.lng });

/** The customer's saved addresses, newest first. */
export async function fetchAddresses(): Promise<SavedAddress[]> {
  const session = await currentSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('addresses')
    .select('id, label, zone_id, details, landmark, lat, lng')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AddressRow[]).map(toSaved);
}

export async function saveAddress(input: Omit<SavedAddress, 'id'>): Promise<SavedAddress> {
  const session = await ensureSignedIn();
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: session?.user.id,
      label: input.label,
      zone_id: input.zoneId,
      details: input.details,
      landmark: input.landmark,
      lat: input.lat,
      lng: input.lng,
    })
    .select('id, label, zone_id, details, landmark, lat, lng')
    .single();
  if (error) throw error;
  return toSaved(data as AddressRow);
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchZone(id: string): Promise<Zone> {
  const { data, error } = await supabase.from('zones').select('id, name, base_fee, extra_store_fee').eq('id', id).single();
  if (error) throw error;
  return { id: data.id, name: data.name, baseFee: data.base_fee, extraStoreFee: data.extra_store_fee };
}

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Placing an order needs a user; until phone sign-in lands, that is an anonymous one. */
async function ensureSignedIn() {
  const session = await currentSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function fetchLinkedStoreIds(): Promise<string[]> {
  if (!(await currentSession())) return [];
  const { data, error } = await supabase.from('customer_stores').select('store_id');
  if (error) throw error;
  return (data ?? []).map((row) => row.store_id);
}

export async function linkStore(code: string): Promise<{ storeId: string; name: string }> {
  await ensureSignedIn();
  const { data, error } = await supabase.rpc('link_store', { p_code: code });
  if (error) throw error;
  // Since 003, a wrong code comes back as {error} (so the attempt still counts) instead of an exception.
  if (data?.error) throw new Error(data.error);
  return { storeId: data.store_id, name: data.name };
}

export type OrderInput = {
  items: { productId: string; qty: number; note?: string }[];
  /** For later (ISO time), or null for now. */
  scheduledFor?: string | null;
  payment: 'cash' | 'wallet';
  missing: 'call' | 'substitute' | 'remove';
  /** The customer's mobile, for the shop and the driver. */
  phone: string;
  /** The note the customer will pay with, so the driver brings change; null = exact amount. */
  payWith: number | null;
};

export async function placeOrder(input: OrderInput): Promise<PlacedOrder> {
  await ensureSignedIn();
  // Notes or a later time need place_order_v2 (017); a plain order works on either.
  const v2 = !!input.scheduledFor || input.items.some((i) => i.note?.trim());
  const { data, error } = await supabase.rpc(v2 ? 'place_order_v2' : 'place_order', {
    ...(v2 ? { p_scheduled_for: input.scheduledFor ?? null } : {}),
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty, ...(i.note?.trim() ? { note: i.note.trim() } : {}) })),
    p_payment: input.payment,
    p_missing: input.missing,
    // phone and pay_with ride in the address object: 001 ignores them,
    // 002_launch_fixes.sql stores them on the order.
    p_address: {
      zone_id: currentAddress().zoneId,
      details: currentAddress().details,
      landmark: currentAddress().landmark,
      lat: currentAddress().lat,
      lng: currentAddress().lng,
      phone: input.phone,
      pay_with: input.payWith,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    orderId: data.order_id,
    number: data.number,
    storeCount: data.store_count,
    subtotal: data.subtotal,
    deliveryFee: data.delivery_fee,
    total: data.total,
    guaranteedMinutes: data.guaranteed_minutes,
  };
}

type OrderRow = {
  order_ratings?: { store_stars: number } | { store_stars: number }[] | null;
  id: string;
  number: number;
  status: OrderStatus;
  total: number;
  store_count: number;
  placed_at: string;
  guaranteed_minutes: number;
  order_stores: { store: { name: string } | null }[];
};

export async function fetchMyOrders(): Promise<OrderSummary[]> {
  if (!(await currentSession())) return [];
  // order_stores points at stores twice (store_id and rerouted_from), so name the link.
  const columns = 'id, number, status, total, store_count, placed_at, guaranteed_minutes, order_stores(store:stores!order_stores_store_id_fkey(name))';
  const query = (select: string) => supabase.from('orders').select(select).order('placed_at', { ascending: false }).limit(30);
  // With the stars given (011); without them before 011 is applied.
  let { data, error } = await query(`${columns}, order_ratings(store_stars)`);
  if (error) ({ data, error } = await query(columns));
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    total: o.total,
    storeCount: o.store_count,
    storeNames: o.order_stores.map((s) => s.store?.name ?? '').filter(Boolean),
    placedAt: o.placed_at,
    guaranteedMinutes: o.guaranteed_minutes,
    rated: Array.isArray(o.order_ratings) ? o.order_ratings.length > 0 : !!o.order_ratings,
  }));
}

/** Stars after delivery: for the shop(s) and the rider (011). */
export async function rateOrder(orderId: string, storeStars: number, driverStars: number | null, comment: string) {
  const { data, error } = await supabase.rpc('rate_order', {
    p_order_id: orderId,
    p_store_stars: storeStars,
    p_driver_stars: driverStars,
    p_comment: comment,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** Shops the customer hearted. Empty before sign-in or before 011. */
export async function fetchFavorites(): Promise<string[]> {
  if (!(await currentSession())) return [];
  const { data, error } = await supabase.from('favorite_stores').select('store_id');
  if (error) return [];
  return (data ?? []).map((r) => r.store_id as string);
}

export async function setFavorite(storeId: string, on: boolean) {
  const session = await ensureSignedIn();
  const { error } = on
    ? await supabase.from('favorite_stores').insert({ user_id: session?.user.id, store_id: storeId })
    : await supabase.from('favorite_stores').delete().eq('store_id', storeId);
  if (error && error.code !== '23505') throw error;
}

type OrderDetailRow = Omit<OrderRow, 'order_stores'> & {
  subtotal: number;
  delivery_fee: number;
  payment_method: 'cash' | 'wallet';
  missing_policy: 'call' | 'substitute' | 'remove';
  lat: number | null;
  lng: number | null;
  kind?: 'shop' | 'rx' | 'errand';
  rx_photo_path?: string | null;
  rx_note?: string | null;
  rx_quote_note?: string | null;
  errand_text?: string | null;
  errand_from?: string | null;
  errand_budget?: number | null;
  receipt_path?: string | null;
  scheduled_for?: string | null;
  order_stores: {
    id: string;
    status: OrderDetail['stores'][number]['status'];
    subtotal: number;
    store: { id: string; name: string } | null;
  }[];
  order_items: {
    order_store_id: string;
    product_id: string | null;
    name: string;
    note: string;
    qty: number;
    unit_price: number;
    line_total: number;
    customer_note?: string | null;
  }[];
};

export async function fetchOrder(id: string): Promise<OrderDetail | null> {
  if (!(await currentSession())) return null;
  const base = 'id, number, status, total, subtotal, delivery_fee, payment_method, missing_policy, store_count, placed_at, guaranteed_minutes, lat, lng, ' +
        'order_stores(id, status, subtotal, store:stores!order_stores_store_id_fkey(id, name)), ' +
        'order_items(order_store_id, product_id, name, note, qty, unit_price, line_total)';
  const extra = ', kind, rx_photo_path, rx_note, rx_quote_note, errand_text, errand_from, errand_budget, receipt_path';
  const query = (columns: string) => supabase.from('orders').select(columns).eq('id', id).maybeSingle();
  const with017 = base.replace('lat, lng, ', `lat, lng${extra}, scheduled_for, `).replace('unit_price, line_total)', 'unit_price, line_total, customer_note)');
  let { data, error } = await query(with017);
  if (error?.code === '42703') ({ data, error } = await query(base.replace('lat, lng, ', `lat, lng${extra}, `)));
  if (error?.code === '42703') ({ data, error } = await query(base));
  if (error) throw error;
  if (!data) return null;
  const o = data as unknown as OrderDetailRow;
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    total: o.total,
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    paymentMethod: o.payment_method,
    missingPolicy: o.missing_policy,
    storeCount: o.store_count,
    storeNames: o.order_stores.map((s) => s.store?.name ?? '').filter(Boolean),
    placedAt: o.placed_at,
    guaranteedMinutes: o.guaranteed_minutes,
    dropLat: o.lat,
    dropLng: o.lng,
    kind: o.kind ?? 'shop',
    rxPhotoPath: o.rx_photo_path ?? null,
    rxNote: o.rx_note ?? null,
    rxQuoteNote: o.rx_quote_note ?? null,
    errandText: o.errand_text ?? null,
    errandFrom: o.errand_from ?? null,
    errandBudget: o.errand_budget ?? null,
    receiptPath: o.receipt_path ?? null,
    scheduledFor: o.scheduled_for ?? null,
    stores: o.order_stores.map((s) => ({
      storeId: s.store?.id ?? '',
      name: s.store?.name ?? '',
      status: s.status,
      subtotal: s.subtotal,
      lines: o.order_items
        .filter((i) => i.order_store_id === s.id)
        .map((i) => ({
          productId: i.product_id,
          name: i.name,
          note: i.note,
          qty: i.qty,
          unitPrice: i.unit_price,
          lineTotal: i.line_total,
          customerNote: i.customer_note ?? null,
        })),
    })),
  };
}

export type OrderDriver = { name: string; phone: string; vehicle: 'bicycle' | 'scooter' | 'motorcycle' };

/** Who is bringing the order (006_driver.sql); null before a driver takes it. */
export async function fetchOrderDriver(orderId: string): Promise<OrderDriver | null> {
  const { data, error } = await supabase.rpc('order_driver', { p_order_id: orderId });
  if (error) {
    if (error.message.includes('Could not find the function')) return null;
    throw error;
  }
  return (data as OrderDriver | null) ?? null;
}

/** Cancels an order while no shop has accepted it yet (cancel_order in 002_launch_fixes.sql). */
export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
  if (error) throw error;
}

/** Turns server errors into something the customer can act on. */
export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (message.includes('at most 3 stores')) return 'المندوب بيجيب من 3 محلات بس في المشوار الواحد';
  if (message.includes('item unavailable')) return 'فيه حاجة في السلة خلصت من المحل، راجع السلة';
  if (message.includes('unknown store code')) return 'الكود ده مش مظبوط. بص على الورقة اللي في المحل وجرّب تاني';
  if (message.includes('store closed')) return 'فيه محل في السلة قفل دلوقتي. شيل حاجاته من السلة أو جرّب كمان شوية';
  if (message.includes('too many tries')) return 'جرّبت أرقام كتير. استنى ساعة وجرّب تاني، أو اسأل صاحب المحل';
  if (message.includes('already accepted')) return 'المحل بدأ يجهّز طلبك خلاص، كلّمنا لو محتاج تغيّر حاجة';
  if (message.includes('cancel_order')) return 'الإلغاء من التطبيق لسه مش شغال، كلّمنا وهنلغيه';
  if (message.includes('already rated')) return 'قيّمت الطلب ده قبل كده، شكراً';
  if (message.includes('bad time')) return 'اختار وقت بعد ساعة على الأقل، وفي خلال 3 أيام';
  if (message.includes('place_order_v2')) return 'الحجز لوقت تاني والملاحظات لسه بيتجهزوا. اطلب دلوقتي من غير ملاحظة';
  if (message.includes('not a pharmacy')) return 'الروشتة بتتبعت لصيدلية بس';
  if (message.includes('bad errand')) return 'اكتب انت عايز إيه (3 حروف على الأقل)';
  if (message.includes('over cap')) return 'المبلغ ده أكبر من المسموح لحد دلوقتي';
  if (message.includes('bad phone number')) return 'اكتب رقم موبايل مصري من 11 رقم، زي 01012345678';
  if (message.includes('nothing to answer')) return 'الطلب ده اتغيّر، افتحه تاني';
  if (message.includes('not rateable')) return 'تقدر تقيّم بعد ما الطلب يوصلك';
  if (message.includes('Could not find the function') || message.includes('Bucket not found') || message.includes('does not exist')) {
    return 'الخدمة دي لسه بتتجهز، جرّب كمان شوية';
  }
  if (message.toLowerCase().includes('network') || message.includes('Failed to fetch')) return 'مفيش إنترنت، جرّب تاني';
  return 'حصلت مشكلة، جرّب تاني';
}

/**
 * A customer's photo for a product that has none: uploaded to the product-photos
 * bucket under their own folder, then recorded for our review (011).
 */
export async function submitProductPhoto(productId: string, uri: string, mimeType: string | null | undefined) {
  const session = await ensureSignedIn();
  const uid = session?.user.id;
  if (!uid) throw new Error('not signed in');
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `submissions/${uid}/${productId}-${Date.now()}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, body, { contentType: type, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.rpc('submit_product_photo', { p_product_id: productId, p_path: path });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** Egyptian 01XXXXXXXXX → +201XXXXXXXXX */
const e164 = (local: string) => `+20${local.slice(1)}`;

export type PhoneCodeKind = 'phone_change' | 'sms';

/**
 * Sends the 6-digit SMS code. An anonymous customer (the usual case) keeps the
 * same account and orders; the number is just attached to it once confirmed.
 */
export async function sendPhoneCode(local: string): Promise<PhoneCodeKind> {
  const session = await currentSession();
  if (session) {
    const { error } = await supabase.auth.updateUser({ phone: e164(local) });
    if (error) throw error;
    return 'phone_change';
  }
  const { error } = await supabase.auth.signInWithOtp({ phone: e164(local) });
  if (error) throw error;
  return 'sms';
}

export async function verifyPhoneCode(local: string, token: string, kind: PhoneCodeKind) {
  const { error } = await supabase.auth.verifyOtp({ phone: e164(local), token, type: kind });
  if (error) throw error;
}

/** The confirmed phone on the account, or null. */
export async function fetchVerifiedPhone(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  // Supabase keeps the number without "+": 201012345678 → 01012345678
  return user?.phone && user.phone_confirmed_at ? `0${user.phone.replace(/^\+?20/, '')}` : null;
}

/** Errors from the SMS sign-in, in plain words. */
export function phoneError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (/provider|sms|twilio|messagebird|vonage/i.test(message)) return 'التأكيد بكود SMS هيشتغل أول ما نفعّل خدمة الرسايل. رقمك محفوظ عادي لحد كده';
  if (/expired|invalid/i.test(message)) return 'الكود غلط أو خلص وقته. اطلب كود جديد';
  if (/rate|seconds/i.test(message)) return 'استنى دقيقة وبعدين اطلب كود تاني';
  if (/already/i.test(message)) return 'الرقم ده متسجّل على حساب تاني';
  return friendlyError(error);
}

/** Uploads a prescription photo to the private order-photos bucket; returns its path. */
async function uploadOrderPhoto(folder: 'rx', uri: string, mimeType: string | null | undefined) {
  const session = await ensureSignedIn();
  const uid = session?.user.id;
  if (!uid) throw new Error('not signed in');
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${folder}/${uid}/${Date.now()}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('order-photos').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}

/** A short-lived link to a private order photo (prescription or receipt). */
export async function orderPhotoUrl(path: string) {
  const { data, error } = await supabase.storage.from('order-photos').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

function addressPayload(phone: string) {
  const a = currentAddress();
  return { zone_id: a.zoneId, details: a.details, landmark: a.landmark, lat: a.lat, lng: a.lng, phone };
}

/** «صوّر الروشتة»: sends the photo to one pharmacy, which answers with a price. */
export async function placeRxOrder(input: { storeId: string; uri: string; mimeType?: string | null; note: string; payment: 'cash' | 'wallet'; phone: string }) {
  const photo = await uploadOrderPhoto('rx', input.uri, input.mimeType);
  const { data, error } = await supabase.rpc('place_rx_order', {
    p_store_id: input.storeId,
    p_photo_path: photo,
    p_note: input.note,
    p_payment: input.payment,
    p_address: addressPayload(input.phone),
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { orderId: data.order_id as string, number: data.number as number };
}

/** The customer's answer to the pharmacy's price. */
export async function answerRx(orderId: string, accept: boolean) {
  const { data, error } = await supabase.rpc('rx_answer', { p_order_id: orderId, p_accept: accept });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** «هاتلي أي حاجة»: a rider buys it and shows the receipt. */
export async function placeErrand(input: { text: string; from: string; budget: number; payment: 'cash' | 'wallet'; phone: string }) {
  await ensureSignedIn();
  const { data, error } = await supabase.rpc('place_errand', {
    p_text: input.text,
    p_from: input.from,
    p_budget: input.budget,
    p_payment: input.payment,
    p_address: addressPayload(input.phone),
  });
  if (error) throw error;
  if (data?.error) {
    const e = new Error(data.error) as Error & { cap?: number };
    e.cap = data.cap;
    throw e;
  }
  return { orderId: data.order_id as string, number: data.number as number, fee: data.fee as number };
}
