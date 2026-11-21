import { supabase } from '@/lib/supabase';

/** Everything the panel does goes through the admin_* functions in 018_admin.sql (admins only). */

export type LiveOrder = {
  id: string;
  number: number;
  kind: 'shop' | 'rx' | 'errand';
  status: 'placed' | 'preparing' | 'picked_up' | 'on_the_way';
  placedAt: string;
  scheduledFor: string | null;
  total: number;
  paymentMethod: 'cash' | 'wallet';
  area: string;
  customerPhone: string | null;
  driver: string | null;
  driverPhone: string | null;
  stores: { name: string; status: string; phone: string | null }[];
  late: boolean;
};

export type AdminDriver = {
  userId: string;
  name: string;
  phone: string;
  vehicle: 'bicycle' | 'scooter' | 'motorcycle';
  status: 'pending' | 'active' | 'suspended';
  isOnline: boolean;
  appOpen: boolean;
  cashHeld: number;
  cashLimit: number;
  rating: number;
  ratingCount: number;
  tripsToday: number;
  createdAt: string;
};

export type PhotoSubmission = { id: string; product: string; store: string; photo: string; createdAt: string };
export type ShopProduct = { id: string; name: string; size: string; section: string | null; price: number; photo: string | null; store: string; isAvailable: boolean };

export type Overview = {
  today: { orders: number; delivered: number; cancelled: number; sales: number; deliveryFees: number; driverPay: number; commission: number };
  live: LiveOrder[];
  drivers: AdminDriver[];
  photos: PhotoSubmission[];
  shopProducts: ShopProduct[];
  settings: Record<string, string>;
};

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') throw new Error(data.error);
  return data as T;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (!(await rpc<boolean>('is_admin'))) {
    await supabase.auth.signOut();
    throw new Error('not admin');
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Signed in as an admin? (false before sign-in or for anyone else) */
export async function fetchIsAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session || data.session.user.is_anonymous) return false;
  return rpc<boolean>('is_admin');
}

type Raw = {
  today: { orders: number; delivered: number; cancelled: number; sales: number; delivery_fees: number; driver_pay: number; commission: number };
  live: {
    id: string;
    number: number;
    kind: LiveOrder['kind'];
    status: LiveOrder['status'];
    placed_at: string;
    scheduled_for: string | null;
    total: number;
    payment_method: 'cash' | 'wallet';
    area: string;
    customer_phone: string | null;
    driver: string | null;
    driver_phone: string | null;
    stores: { name: string; status: string; phone: string | null }[];
    late: boolean;
  }[];
  drivers: {
    user_id: string;
    name: string;
    phone: string;
    vehicle: AdminDriver['vehicle'];
    status: AdminDriver['status'];
    is_online: boolean;
    app_open: boolean;
    cash_held: number;
    cash_limit: number;
    rating: number;
    rating_count: number;
    trips_today: number;
    created_at: string;
  }[];
  photos: { id: string; product: string; store: string; photo: string; created_at: string }[];
  shop_products: { id: string; name: string; size: string; section: string | null; price: number; photo: string | null; store: string; is_available: boolean }[];
  settings: Record<string, string>;
};

export async function fetchOverview(): Promise<Overview> {
  const r = await rpc<Raw>('admin_overview');
  return {
    today: {
      orders: r.today.orders,
      delivered: r.today.delivered,
      cancelled: r.today.cancelled,
      sales: r.today.sales,
      deliveryFees: r.today.delivery_fees,
      driverPay: r.today.driver_pay,
      commission: r.today.commission,
    },
    live: r.live.map((o) => ({
      id: o.id,
      number: o.number,
      kind: o.kind,
      status: o.status,
      placedAt: o.placed_at,
      scheduledFor: o.scheduled_for,
      total: o.total,
      paymentMethod: o.payment_method,
      area: o.area,
      customerPhone: o.customer_phone,
      driver: o.driver,
      driverPhone: o.driver_phone,
      stores: o.stores ?? [],
      late: o.late,
    })),
    drivers: r.drivers.map((d) => ({
      userId: d.user_id,
      name: d.name,
      phone: d.phone,
      vehicle: d.vehicle,
      status: d.status,
      isOnline: d.is_online,
      appOpen: d.app_open,
      cashHeld: d.cash_held,
      cashLimit: d.cash_limit,
      rating: Number(d.rating),
      ratingCount: d.rating_count,
      tripsToday: d.trips_today,
      createdAt: d.created_at,
    })),
    photos: r.photos.map((p) => ({ id: p.id, product: p.product, store: p.store, photo: p.photo, createdAt: p.created_at })),
    shopProducts: r.shop_products.map((p) => ({
      id: p.id,
      name: p.name,
      size: p.size,
      section: p.section,
      price: p.price,
      photo: p.photo,
      store: p.store,
      isAvailable: p.is_available,
    })),
    settings: r.settings ?? {},
  };
}

export const setDriverStatus = (driverId: string, status: AdminDriver['status']) =>
  rpc<{ ok: boolean }>('admin_set_driver_status', { p_driver: driverId, p_status: status });

export const recordDeposit = (driverId: string, amount: number, method: 'instapay' | 'vodafone_cash' | 'fawry' | 'office', reference: string) =>
  rpc<{ ok: boolean; cash_held: number }>('admin_record_deposit', { p_driver: driverId, p_amount: amount, p_method: method, p_reference: reference });

export const reviewPhoto = (submissionId: string, approve: boolean) => rpc<{ ok: boolean }>('admin_review_photo', { p_submission: submissionId, p_approve: approve });
export const hideProduct = (productId: string) => rpc<{ ok: boolean }>('admin_hide_product', { p_product: productId });
export const cancelOrder = (orderId: string) => rpc<{ ok: boolean }>('admin_cancel_order', { p_order: orderId });
export const setSetting = (key: string, value: string) => rpc<{ ok: boolean }>('admin_set_setting', { p_key: key, p_value: value });

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (message.includes('Invalid login credentials')) return 'الإيميل أو الباسورد غلط';
  if (message.includes('not admin')) return 'الحساب ده مش متسجّل كمدير. ضيفه في جدول admins (الخطوات في ملف 018)';
  if (message.includes('admin_overview') || message.includes('Could not find the function')) return 'السيرفر لسه مش جاهز للوحة (ملف 018)';
  if (message.includes('bad amount')) return 'اكتب المبلغ بالأرقام';
  if (message.includes('bad value')) return 'القيمة دي مش مظبوطة';
  if (message.toLowerCase().includes('network') || message.includes('Failed to fetch')) return 'مفيش إنترنت، جرّب تاني';
  return 'حصلت مشكلة، جرّب تاني';
}
