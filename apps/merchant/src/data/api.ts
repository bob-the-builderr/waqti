import { supabase } from '@/lib/supabase';

/** Everything the shop app does goes through the merchant_* functions in 005_merchant.sql. */

export type MerchantStore = {
  storeId: string;
  name: string;
  mark: string;
  tint: string;
  category: string;
  isOpen: boolean;
  pausedUntil: string | null;
};

export type OrderLineStatus = 'pending' | 'quoted' | 'accepted' | 'ready' | 'picked_up' | 'rejected' | 'rerouted';

export type MerchantItem = {
  id: string;
  name: string;
  note: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  outOfStock: boolean;
  /** What the customer asked for this dish («من غير بصل»), from 017. */
  customerNote: string | null;
};

export type MerchantOrder = {
  orderStoreId: string;
  number: number;
  placedAt: string;
  status: OrderLineStatus;
  prepMinutes: number | null;
  acceptedAt: string | null;
  subtotal: number;
  commission: number;
  paymentMethod: 'cash' | 'wallet';
  missingPolicy: 'call' | 'substitute' | 'remove';
  storeCount: number;
  customerPhone: string | null;
  items: MerchantItem[];
  /** 'rx' = a prescription photo to price (016). */
  kind: 'shop' | 'rx' | 'errand';
  rxPhotoPath: string | null;
  rxNote: string | null;
  /** Ordered for later (017): the customer's chosen time. */
  scheduledFor: string | null;
};

export type MoneyBlock = { orders: number; sales: number; commission: number; net: number };
export type MerchantMoney = { today: MoneyBlock; week: MoneyBlock };

export type MerchantProduct = {
  id: string;
  name: string;
  note: string;
  price: number;
  isAvailable: boolean;
  image: string | null;
  brand: string | null;
  section: string | null;
  /** Set when the item came from the master catalog (014); null for the shop's own items. */
  catalogItemId: string | null;
};

/** One item of the master catalog for this kind of shop (014). */
export type CatalogItem = {
  id: string;
  name: string;
  brand: string;
  size: string;
  section: string;
  refPrice: number;
  image: string | null;
  /** Already on this shop's shelf. */
  stocked: boolean;
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

/** Signs this phone in as the shop whose staff code was typed. */
export async function linkShop(code: string) {
  await ensureSignedIn();
  return rpc<{ store_id: string; name: string }>('merchant_link', { p_code: code });
}

export async function fetchStore(): Promise<MerchantStore | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const row = await rpc<{
    store_id: string;
    name: string;
    mark: string;
    tint: string;
    category: string;
    is_open: boolean;
    paused_until: string | null;
  } | null>('merchant_store');
  if (!row) return null;
  return {
    storeId: row.store_id,
    name: row.name,
    mark: row.mark,
    tint: row.tint,
    category: row.category,
    isOpen: row.is_open,
    pausedUntil: row.paused_until,
  };
}

type OrderRow = {
  order_store_id: string;
  number: number;
  placed_at: string;
  status: OrderLineStatus;
  prep_minutes: number | null;
  accepted_at: string | null;
  subtotal: number;
  commission: number;
  payment_method: 'cash' | 'wallet';
  missing_policy: 'call' | 'substitute' | 'remove';
  store_count: number;
  customer_phone: string | null;
  kind?: 'shop' | 'rx' | 'errand';
  rx_photo_path?: string | null;
  rx_note?: string | null;
  scheduled_for?: string | null;
  items: { id: string; name: string; note: string; qty: number; unit_price: number; line_total: number; out_of_stock: boolean; customer_note?: string | null }[];
};

export async function fetchOrders(): Promise<MerchantOrder[]> {
  const rows = await rpc<OrderRow[]>('merchant_orders');
  return rows.map((o) => ({
    orderStoreId: o.order_store_id,
    number: o.number,
    placedAt: o.placed_at,
    status: o.status,
    prepMinutes: o.prep_minutes,
    acceptedAt: o.accepted_at,
    subtotal: o.subtotal,
    commission: o.commission,
    paymentMethod: o.payment_method,
    missingPolicy: o.missing_policy,
    storeCount: o.store_count,
    customerPhone: o.customer_phone,
    kind: o.kind ?? 'shop',
    rxPhotoPath: o.rx_photo_path ?? null,
    rxNote: o.rx_note ?? null,
    scheduledFor: o.scheduled_for ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      note: i.note,
      qty: i.qty,
      unitPrice: i.unit_price,
      lineTotal: i.line_total,
      outOfStock: i.out_of_stock,
      customerNote: i.customer_note ?? null,
    })),
  }));
}

export const acceptOrder = (orderStoreId: string, prepMinutes: number) =>
  rpc<void>('merchant_accept', { p_order_store_id: orderStoreId, p_prep_minutes: prepMinutes });
/** The pharmacy's price for a prescription; the customer agrees in their app. */
export const quoteRx = (orderStoreId: string, total: number, note: string) =>
  rpc<{ ok: boolean }>('merchant_rx_quote', { p_order_store_id: orderStoreId, p_total: total, p_note: note });

/** A short-lived link to the prescription photo (private bucket). */
export async function rxPhotoUrl(path: string) {
  const { data, error } = await supabase.storage.from('order-photos').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export const busyOrder = (orderStoreId: string) => rpc<void>('merchant_busy', { p_order_store_id: orderStoreId });
export const readyOrder = (orderStoreId: string) => rpc<void>('merchant_ready', { p_order_store_id: orderStoreId });
export const itemOut = (itemId: string) => rpc<void>('merchant_item_out', { p_item_id: itemId });

export const fetchMoney = () => rpc<MerchantMoney>('merchant_money');

type ProductRow = {
  id: string;
  name: string;
  note: string;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  brand?: string | null;
  section?: string | null;
  catalog_item_id?: string | null;
};

export async function fetchProducts(): Promise<MerchantProduct[]> {
  const rows = await rpc<ProductRow[]>('merchant_products');
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    note: p.note,
    price: p.price,
    isAvailable: p.is_available,
    image: p.image_url ?? null,
    brand: p.brand || null,
    section: p.section || null,
    catalogItemId: p.catalog_item_id ?? null,
  }));
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const rows = await rpc<{ id: string; name: string; brand: string; size: string; section: string; ref_price: number; image_url: string | null; stocked: boolean }[]>(
    'merchant_catalog',
  );
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    size: c.size,
    section: c.section,
    refPrice: c.ref_price,
    image: c.image_url,
    stocked: c.stocked,
  }));
}

/** «ضيف»: a catalog item goes on the shelf at the shop's own price. */
export const stockItem = (catalogItemId: string, price: number) => rpc<{ ok: boolean }>('merchant_stock', { p_catalog_item_id: catalogItemId, p_price: price });

/** Uploads a photo taken in the shop; returns its storage path (product-photos/shops/<user>/...). */
export async function uploadShopPhoto(uri: string, mimeType: string | null | undefined): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('not signed in');
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `shops/${uid}/${Date.now()}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('product-photos').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}

/** «منتج جديد»: something the catalog doesn't have, with the shop's own photo if any. */
export const addProduct = (input: { name: string; size: string; section: string; price: number; imagePath: string | null }) =>
  rpc<{ ok: boolean }>('merchant_add_product', {
    p_name: input.name,
    p_size: input.size,
    p_section: input.section,
    p_price: input.price,
    p_image_path: input.imagePath,
  });

/** A photo for one of the shop's own items. */
export const setProductPhoto = (productId: string, imagePath: string) =>
  rpc<{ ok: boolean }>('merchant_set_photo', { p_product_id: productId, p_image_path: imagePath });

export const updateProduct = (productId: string, price: number | null, available: boolean | null) =>
  rpc<void>('merchant_update_product', { p_product_id: productId, p_price: price, p_available: available });

/** open = false closes the shop; pauseMinutes > 0 keeps it open but stops new orders for a while. */
export const setOpen = (open: boolean, pauseMinutes = 0) => rpc<void>('merchant_set_open', { p_open: open, p_pause_minutes: pauseMinutes });

export async function signOut() {
  await supabase.auth.signOut();
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (message.includes('bad price')) return 'اكتب السعر بالأرقام، من 1 جنيه';
  if (message.includes('quote first')) return 'الروشتة محتاجة سعر الأول';
  if (message.includes('bad name')) return 'اكتب اسم المنتج (حرفين على الأقل)';
  if (message.includes('not in catalog')) return 'المنتج ده مش في كتالوج نوع محلك';
  if (message.includes('merchant_catalog') || message.includes('merchant_stock') || message.includes('merchant_add_product')) return 'السيرفر لسه مش جاهز للكتالوج (ملف 014)';
  if (message.includes('unknown staff code')) return 'الكود ده مش مظبوط. اتأكد من الرقم اللي إداهولك فريق وقتي';
  if (message.includes('too many tries')) return 'جرّبت أرقام كتير. استنى ساعة وجرّب تاني، أو كلّم فريق وقتي';
  if (message.includes('order not available')) return 'الطلب ده اتغيّر، اتلغى أو اتاخد خلاص';
  if (message.includes('item not available')) return 'الصنف ده مش في طلب مفتوح';
  if (message.includes('bad price')) return 'السعر لازم يبقى رقم من 1 لحد 100,000';
  if (message.includes('Could not find the function')) return 'السيرفر لسه مش جاهز لتطبيق المحل (ملف 005)';
  if (message.toLowerCase().includes('network') || message.includes('Failed to fetch')) return 'مفيش إنترنت، جرّب تاني';
  return 'حصلت مشكلة، جرّب تاني';
}
