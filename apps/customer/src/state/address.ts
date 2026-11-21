import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_ADDRESS } from '@/data/address';

import { appStorage } from './settings';

/** Where the order goes. Distances, delivery fees and the promised time all start from here. */
export type DeliveryAddress = {
  /** The saved row, once saved to the account. */
  id: string | null;
  label: string;
  zoneId: string;
  areaName: string;
  details: string;
  landmark: string;
  lat: number;
  lng: number;
};

type AddressState = {
  current: DeliveryAddress;
  setCurrent: (address: DeliveryAddress) => void;
};

export const useAddress = create<AddressState>()(
  persist(
    (set) => ({
      current: { id: null, ...DEFAULT_ADDRESS },
      setCurrent: (address) => set({ current: address }),
    }),
    { name: 'address', storage: appStorage, partialize: ({ current }) => ({ current }) },
  ),
);

/** For code outside React (API calls): the address in use right now. */
export const currentAddress = () => useAddress.getState().current;
