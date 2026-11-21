import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { authStorage } from '@/lib/storage';

/** Used only where no storage exists (server rendering). */
const memory = new Map<string, string>();
export const memoryStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
};

/** Device storage for small app state (cart, settings); same store as the session. */
export const appStorage = createJSONStorage(() => authStorage ?? memoryStorage);

type SettingsState = {
  /** Everything a little bigger, for customers who read with glasses. */
  bigText: boolean;
  /** Whether we already asked «الكلام صغير؟» on the home screen. */
  askedText: boolean;
  /** The customer's mobile number, so the shop and the driver can call. */
  phone: string;
  setBigText: (on: boolean) => void;
  setAskedText: () => void;
  setPhone: (phone: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      bigText: false,
      askedText: false,
      phone: '',
      setBigText: (bigText) => set({ bigText, askedText: true }),
      setAskedText: () => set({ askedText: true }),
      setPhone: (phone) => set({ phone }),
    }),
    {
      name: 'settings',
      storage: appStorage,
      partialize: ({ bigText, askedText, phone }) => ({ bigText, askedText, phone }),
    },
  ),
);

/** Turns Arabic-Indic digits into Latin ones, so ٠١٠ and 010 mean the same. */
export function latinDigits(text: string) {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** An Egyptian mobile number: 11 digits starting 010, 011, 012 or 015. */
export function normalizePhone(input: string) {
  const digits = latinDigits(input).replace(/\D/g, '');
  const local = digits.startsWith('20') && digits.length === 12 ? `0${digits.slice(2)}` : digits;
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

/** "010 1234 5678", isolated left-to-right so Arabic text around it can't reverse the groups. */
export function formatPhone(phone: string) {
  return `⁦${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}⁩`;
}
