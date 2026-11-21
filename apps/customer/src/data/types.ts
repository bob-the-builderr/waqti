import type { IconName } from '@/components/icon';

export type Category = {
  id: string;
  name: string;
  icon: IconName;
};

export type Store = {
  id: string;
  name: string;
  /** One letter shown in the store's tile until it has a logo. */
  mark: string;
  categoryId: string;
  categoryName: string;
  area: string;
  zoneId: string | null;
  lat: number | null;
  lng: number | null;
  /** From the customer's address; null when the store has no location yet. */
  distanceKm: number | null;
  rating: number;
  /** How many ratings (011); 0 when unknown. */
  ratingCount: number;
  etaMin: number;
  etaMax: number;
  tint: string;
  isPharmacy: boolean;
  /** Produce and meat shops update prices every morning. */
  dailyPrices: boolean;
  /** The shop's counter phone, for «اتصل بالمحل»; null until the shop gives one. */
  phone: string | null;
  /** Set by the shop app; a closed or paused shop takes no new orders. */
  isOpen: boolean;
  pausedUntil: string | null;
  /** Cover photo (restaurants, sweets); other shops show a cover made of their products. */
  cover: string | null;
};

export type Product = {
  id: string;
  storeId: string;
  name: string;
  /** Size or description, e.g. "1 كيلو". */
  note: string;
  price: number;
  /** One shared catalog photo; null until the catalog has one. */
  image: string | null;
  /** From the master catalog (012): «جهينة», and the aisle, «ألبان وبيض». */
  brand?: string | null;
  section?: string | null;
};

export type Zone = {
  id: string;
  name: string;
  /** Centre of the area (from 011); a pin on the map takes the nearest area. */
  lat?: number | null;
  lng?: number | null;
  baseFee: number;
  extraStoreFee: number;
};

export type OrderStatus = 'placed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';

export type OrderSummary = {
  id: string;
  number: number;
  status: OrderStatus;
  total: number;
  storeCount: number;
  storeNames: string[];
  placedAt: string;
  guaranteedMinutes: number;
  /** Stars already given after delivery. */
  rated?: boolean;
};

export type OrderStoreStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'ready' | 'picked_up' | 'rerouted';

export type OrderLine = {
  productId: string | null;
  name: string;
  note: string;
  /** What the customer asked for this dish («من غير بصل»). */
  customerNote?: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderDetail = OrderSummary & {
  subtotal: number;
  deliveryFee: number;
  paymentMethod: 'cash' | 'wallet';
  missingPolicy: 'call' | 'substitute' | 'remove';
  /** Where it's going (the pin the customer chose). */
  dropLat: number | null;
  dropLng: number | null;
  /** 'shop' (from the shelves), 'rx' (a prescription photo) or 'errand' («هاتلي أي حاجة»), from 016. */
  kind: 'shop' | 'rx' | 'errand';
  /** Delivery for later (017): the chosen time. */
  scheduledFor: string | null;
  rxPhotoPath: string | null;
  rxNote: string | null;
  /** The pharmacy's line with its price, e.g. «متوفر كله». */
  rxQuoteNote: string | null;
  errandText: string | null;
  errandFrom: string | null;
  errandBudget: number | null;
  receiptPath: string | null;
  stores: { storeId: string; name: string; status: OrderStoreStatus; subtotal: number; lines: OrderLine[] }[];
};

export type PlacedOrder = {
  orderId: string;
  number: number;
  storeCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  guaranteedMinutes: number;
};

/** A saved delivery address («البيت»، «الشغل»). */
export type SavedAddress = {
  id: string;
  label: string;
  zoneId: string;
  details: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
};
