import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appStorage } from './settings';

const FIVE_MINUTES = 5 * 60_000;

/** The promised arrival: now + the guarantee, rounded up to the next 5 minutes. */
export function promiseFrom(minutes: number, now: number) {
  return Math.ceil((now + minutes * 60_000) / FIVE_MINUTES) * FIVE_MINUTES;
}

type PromisesState = {
  /** Order id → the arrival time the customer was shown before confirming (ms). */
  byOrder: Record<string, number>;
  remember: (orderId: string, at: number) => void;
};

/**
 * Keeps the exact time quoted at checkout, so the confirm sheet, the order
 * page and «طلباتي» all show the same «قبل الساعة 5:00».
 */
export const usePromises = create<PromisesState>()(
  persist(
    (set, get) => ({
      byOrder: {},
      remember: (orderId, at) => {
        // Keep the 50 most recent orders only.
        const entries = Object.entries({ ...get().byOrder, [orderId]: at }).sort((a, b) => b[1] - a[1]).slice(0, 50);
        set({ byOrder: Object.fromEntries(entries) });
      },
    }),
    { name: 'promises', storage: appStorage, partialize: ({ byOrder }) => ({ byOrder }) },
  ),
);
