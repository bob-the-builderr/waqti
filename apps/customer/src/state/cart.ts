import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Product, Store } from '@/data/types';
import { MAX_STORES } from '@/lib/pricing';

import { appStorage } from './settings';

/** The cart keeps what the customer saw; the server re-prices it when the order is placed. */
/** note: the customer's line for a restaurant dish («من غير بصل»). */
export type Line = { product: Product; store: Store; qty: number; note?: string };

export type AddResult = 'added' | 'new-store' | 'store-limit';

/** Most a customer can take of one item in one order (the database allows 50). */
export const MAX_QTY = 50;

type CartState = {
  /** Keyed by product id, in the order items were first added. */
  lines: Record<string, Line>;
  add: (product: Product, store: Store) => AddResult;
  /** One less; returns the line when this removed it completely, for "undo". */
  remove: (productId: string) => Line | null;
  /** Puts back a line taken out by mistake. */
  restore: (line: Line) => void;
  /** The customer's note on one dish (restaurants only). */
  setNote: (productId: string, note: string) => void;
  /** Replaces the cart, e.g. for "order the same again". */
  fill: (lines: Line[]) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: {},
      add: (product, store) => {
        const lines = get().lines;
        const storeIds = new Set(Object.values(lines).map((l) => l.store.id));
        const isNewStore = !storeIds.has(store.id);
        if (isNewStore && storeIds.size >= MAX_STORES) return 'store-limit';
        const qty = Math.min((lines[product.id]?.qty ?? 0) + 1, MAX_QTY);
        set({ lines: { ...lines, [product.id]: { product, store, qty } } });
        return isNewStore && storeIds.size > 0 ? 'new-store' : 'added';
      },
      remove: (productId) => {
        const lines = { ...get().lines };
        const line = lines[productId];
        if (!line) return null;
        if (line.qty <= 1) delete lines[productId];
        else lines[productId] = { ...line, qty: line.qty - 1 };
        set({ lines });
        return line.qty <= 1 ? line : null;
      },
      restore: (line) => set({ lines: { ...get().lines, [line.product.id]: line } }),
      setNote: (productId, note) => {
        const line = get().lines[productId];
        if (line) set({ lines: { ...get().lines, [productId]: { ...line, note: note.slice(0, 100) } } });
      },
      fill: (lines) => set({ lines: Object.fromEntries(lines.map((l) => [l.product.id, l])) }),
      clear: () => set({ lines: {} }),
    }),
    // A WhatsApp call or Android closing the app must not wipe a half-built order.
    { name: 'cart', storage: appStorage, partialize: ({ lines }) => ({ lines }) },
  ),
);

export type CartGroup = {
  store: Store;
  items: { product: Product; qty: number; total: number; note?: string }[];
  subtotal: number;
};

/** The cart split by store, in the order the stores were added. */
export function groupCart(lines: Record<string, Line>): CartGroup[] {
  const groups = new Map<string, CartGroup>();
  for (const { product, store, qty, note } of Object.values(lines)) {
    let group = groups.get(store.id);
    if (!group) {
      group = { store, items: [], subtotal: 0 };
      groups.set(store.id, group);
    }
    const total = product.price * qty;
    group.items.push({ product, qty, total, note });
    group.subtotal += total;
  }
  return [...groups.values()];
}

export function cartCount(lines: Record<string, Line>) {
  return Object.values(lines).reduce((sum, l) => sum + l.qty, 0);
}

export function cartStoreIds(lines: Record<string, Line>) {
  return [...new Set(Object.values(lines).map((l) => l.store.id))];
}
