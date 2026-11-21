import { supabase } from '@/lib/supabase';

/** Everything the driver app does goes through the driver_* functions in 006_driver.sql. */

export type Vehicle = 'bicycle' | 'scooter' | 'motorcycle';

export type Driver = { name: string; phone: string; vehicle: Vehicle; status: 'pending' | 'active' | 'suspended'; isOnline: boolean };

export type Offer = {
  orderId: string;
  number: number;
  placedAt: string;
  pay: number;
  total: number;
  paymentMethod: 'cash' | 'wallet';
  distanceKm: number | null;
  storeCount: number;
  dropArea: string;
  landmark: string;
  pieces: number;
  stores: { name: string; area: string; ready: boolean }[];
  /** How long this offer stays yours (it is offered to one driver at a time). */
  secondsLeft: number;
  /** 'errand' = «هاتلي أي حاجة»: buy it, then deliver (016). */
  kind: 'shop' | 'rx' | 'errand';
  errandText: string | null;
  errandFrom: string | null;
  errandBudget: number | null;
};

export type TripStore = {
  orderStoreId: string;
  name: string;
  area: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  status: 'accepted' | 'ready' | 'picked_up' | 'pending' | 'rejected' | 'rerouted';
  subtotal: number;
  pieces: number;
};

export type Trip = {
  orderId: string;
  number: number;
  status: 'placed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';
  placedAt: string;
  guaranteedMinutes: number;
  pay: number;
  total: number;
  paymentMethod: 'cash' | 'wallet';
  payWith: number | null;
  customerPhone: string | null;
  address: string;
  landmark: string;
  dropArea: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  stores: TripStore[];
  /** Before an errand is bought: 0 and the fee. */
  subtotal: number;
  deliveryFee: number;
  /** 'errand' = «هاتلي أي حاجة»: buy it, then deliver (016). */
  kind: 'shop' | 'rx' | 'errand';
  errandText: string | null;
  errandFrom: string | null;
  errandBudget: number | null;
};

export type EarningsBlock = { trips: number; earned: number; cash: number };
export type Earnings = {
  today: EarningsBlock;
  week: EarningsBlock;
  /** Cash collected minus deposits. */
  cashHeld: number;
  /** Above this, only orders paid by transfer are offered. */
  cashLimit: number;
};

async function ensureSignedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') throw new Error(data.error);
  return data as T;
}

export async function register(name: string, phone: string, vehicle: Vehicle) {
  await ensureSignedIn();
  return rpc<{ ok: boolean }>('driver_register', { p_name: name, p_phone: phone, p_vehicle: vehicle });
}

export async function fetchMe(): Promise<Driver | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const row = await rpc<{ name: string; phone: string; vehicle: Vehicle; status: Driver['status']; is_online: boolean } | null>('driver_me');
  return row ? { name: row.name, phone: row.phone, vehicle: row.vehicle, status: row.status, isOnline: row.is_online } : null;
}

export const setOnline = (online: boolean) => rpc<void>('driver_set_online', { p_online: online });

type OfferRow = {
  order_id: string;
  number: number;
  placed_at: string;
  driver_pay: number;
  total: number;
  payment_method: 'cash' | 'wallet';
  distance_km: number | null;
  store_count: number;
  drop_area: string;
  landmark: string;
  pieces: number;
  stores: { name: string; area: string; ready: boolean }[];
  seconds_left: number;
  kind?: 'shop' | 'rx' | 'errand';
  errand_text?: string | null;
  errand_from?: string | null;
  errand_budget?: number | null;
};

export async function fetchOffers(): Promise<Offer[]> {
  const rows = await rpc<OfferRow[]>('driver_offers');
  return rows.map((o) => ({
    orderId: o.order_id,
    number: o.number,
    placedAt: o.placed_at,
    pay: o.driver_pay ?? 0,
    total: o.total,
    paymentMethod: o.payment_method,
    distanceKm: o.distance_km,
    storeCount: o.store_count,
    dropArea: o.drop_area,
    landmark: o.landmark,
    pieces: o.pieces,
    stores: o.stores ?? [],
    secondsLeft: o.seconds_left ?? 0,
    kind: o.kind ?? 'shop',
    errandText: o.errand_text ?? null,
    errandFrom: o.errand_from ?? null,
    errandBudget: o.errand_budget ?? null,
  }));
}

export const acceptTrip = (orderId: string) => rpc<void>('driver_accept', { p_order_id: orderId });
/** «مش دلوقتي»: free to say no; the trip goes to the next driver. */
export const declineTrip = (orderId: string) => rpc<void>('driver_decline', { p_order_id: orderId });

type TripRow = {
  order_id: string;
  number: number;
  status: Trip['status'];
  placed_at: string;
  guaranteed_minutes: number;
  driver_pay: number;
  total: number;
  payment_method: 'cash' | 'wallet';
  pay_with: number | null;
  customer_phone: string | null;
  address: string;
  landmark: string;
  drop_area: string;
  lat: number | null;
  lng: number | null;
  distance_km: number | null;
  subtotal?: number;
  delivery_fee?: number;
  kind?: 'shop' | 'rx' | 'errand';
  errand_text?: string | null;
  errand_from?: string | null;
  errand_budget?: number | null;
  stores: {
    order_store_id: string;
    name: string;
    area: string;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    status: TripStore['status'];
    subtotal: number;
    pieces: number;
  }[];
};

export async function fetchTrip(): Promise<Trip | null> {
  const t = await rpc<TripRow | null>('driver_trip');
  if (!t) return null;
  return {
    orderId: t.order_id,
    number: t.number,
    status: t.status,
    placedAt: t.placed_at,
    guaranteedMinutes: t.guaranteed_minutes,
    pay: t.driver_pay ?? 0,
    total: t.total,
    paymentMethod: t.payment_method,
    payWith: t.pay_with,
    customerPhone: t.customer_phone,
    address: t.address,
    landmark: t.landmark,
    dropArea: t.drop_area,
    lat: t.lat,
    lng: t.lng,
    distanceKm: t.distance_km,
    subtotal: t.subtotal ?? 0,
    deliveryFee: t.delivery_fee ?? 0,
    kind: t.kind ?? 'shop',
    errandText: t.errand_text ?? null,
    errandFrom: t.errand_from ?? null,
    errandBudget: t.errand_budget ?? null,
    stores: (t.stores ?? []).map((s) => ({
      orderStoreId: s.order_store_id,
      name: s.name,
      area: s.area,
      phone: s.phone,
      lat: s.lat,
      lng: s.lng,
      status: s.status,
      subtotal: s.subtotal,
      pieces: s.pieces,
    })),
  };
}

/** «اشتريت»: the receipt photo goes to the private bucket, then the amount to the order. */
export async function errandBought(orderId: string, amount: number, uri: string, mimeType: string | null | undefined) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('not signed in');
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `receipts/${uid}/${orderId}-${Date.now()}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('order-photos').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return rpc<{ ok: boolean; total: number }>('driver_errand_bought', { p_order_id: orderId, p_amount: amount, p_receipt_path: path });
}

export const pickUp = (orderStoreId: string) => rpc<void>('driver_pickup', { p_order_store_id: orderStoreId });
export const deliver = (orderId: string) => rpc<void>('driver_deliver', { p_order_id: orderId });
export async function fetchEarnings(): Promise<Earnings> {
  const e = await rpc<{ today: EarningsBlock; week: EarningsBlock; cash_held?: number; cash_limit?: number }>('driver_earnings');
  return { today: e.today, week: e.week, cashHeld: e.cash_held ?? 0, cashLimit: e.cash_limit ?? 600 };
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (message.includes('over budget')) return 'المبلغ أكبر من اللي الزبون سمح بيه. كلّمه الأول';
  if (message.includes('bad price')) return 'اكتب المبلغ بالأرقام';
  if (message.includes('offer expired')) return 'العرض خلص وقته وراح لمندوب تاني. هيجيلك غيره';
  if (message.includes('trip taken')) return 'مندوب تاني لحق ياخده. فيه غيره جاي';
  if (message.includes('finish your trip first')) return 'خلّص المشوار اللي معاك الأول';
  if (message.includes('pickup not available')) return 'الطلب ده مش جاهز للاستلام دلوقتي';
  if (message.includes('deliver not available')) return 'لازم تستلم من كل المحلات الأول';
  if (message.includes('not an active driver')) return 'حسابك لسه مش متفعّل. فريق وقتي هيكلمك';
  if (message.includes('bad phone number')) return 'اكتب رقم موبايل مصري من 11 رقم، زي 01012345678';
  if (message.includes('bad name')) return 'اكتب اسمك';
  if (message.includes('Could not find the function')) return 'السيرفر لسه مش جاهز لتطبيق المندوب (ملف 006)';
  if (message.toLowerCase().includes('network') || message.includes('Failed to fetch')) return 'مفيش إنترنت، جرّب تاني';
  return 'حصلت مشكلة، جرّب تاني';
}
