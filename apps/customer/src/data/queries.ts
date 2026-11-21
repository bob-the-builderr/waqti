import { QueryClient, useQuery } from '@tanstack/react-query';

import { useAddress } from '@/state/address';
import {
  fetchAllProducts,
  fetchCategories,
  fetchLinkedStoreIds,
  fetchMyOrders,
  fetchOrder,
  fetchOrderDriver,
  fetchProducts,
  fetchStores,
  fetchZone,
  fetchAddresses,
  fetchFavorites,
  fetchVerifiedPhone,
  fetchZones,
} from './api';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export const keys = {
  verifiedPhone: ['verified-phone'] as const,
  favorites: ['favorites'] as const,
  zones: ['zones'] as const,
  addresses: ['addresses'] as const,
  categories: ['categories'] as const,
  stores: ['stores'] as const,
  products: (storeId: string) => ['products', storeId] as const,
  allProducts: ['products', 'all'] as const,
  zone: (id: string) => ['zone', id] as const,
  linked: ['linked-stores'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
};

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: fetchCategories, staleTime: 10 * 60_000 });
}

/** Stores with their distance from the chosen address; refetched when the address changes. */
export function useStores() {
  const { lat, lng } = useAddress((s) => s.current);
  return useQuery({ queryKey: [...keys.stores, lat, lng], queryFn: fetchStores });
}

export function useStore(id: string | undefined) {
  const stores = useStores();
  return { ...stores, data: stores.data?.find((s) => s.id === id) };
}

export function useProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: keys.products(storeId ?? ''),
    queryFn: () => fetchProducts(storeId as string),
    enabled: !!storeId,
  });
}

/** Every item in every store, for searching items ("رز", "بنادول") across shops. */
export function useAllProducts(enabled = true) {
  return useQuery({ queryKey: keys.allProducts, queryFn: fetchAllProducts, enabled, staleTime: 5 * 60_000 });
}

/** The delivery zone of the customer's current address. */
export function useDeliveryZone() {
  const zoneId = useAddress((s) => s.current.zoneId);
  return useQuery({ queryKey: keys.zone(zoneId), queryFn: () => fetchZone(zoneId), staleTime: 10 * 60_000 });
}

export function useLinkedStoreIds() {
  return useQuery({ queryKey: keys.linked, queryFn: fetchLinkedStoreIds });
}

export function useMyOrders() {
  return useQuery({ queryKey: keys.orders, queryFn: fetchMyOrders, staleTime: 0 });
}

/** One order; refreshes every 20 seconds while it is still on its way. */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: keys.order(id ?? ''),
    queryFn: () => fetchOrder(id as string),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'delivered' && status !== 'cancelled' ? 20_000 : false;
    },
  });
}

/** The driver bringing an order; checked every 20 seconds while it is on its way. */
export function useOrderDriver(orderId: string | undefined, active: boolean) {
  return useQuery({
    queryKey: ['orders', orderId ?? '', 'driver'],
    queryFn: () => fetchOrderDriver(orderId as string),
    enabled: !!orderId && active,
    refetchInterval: 20_000,
  });
}

/** Linked stores first (the shop that brought the customer always leads), then by distance. */
export function linkedFirst<T extends { id: string }>(list: T[], linkedIds: string[] | undefined) {
  if (!linkedIds?.length) return list;
  return [...list.filter((s) => linkedIds.includes(s.id)), ...list.filter((s) => !linkedIds.includes(s.id))];
}

/** Every delivery area (for the address picker). */
export function useZones() {
  return useQuery({ queryKey: keys.zones, queryFn: fetchZones, staleTime: 60 * 60_000 });
}

/** Addresses saved on this account. */
export function useAddresses() {
  return useQuery({ queryKey: keys.addresses, queryFn: fetchAddresses });
}

/** Hearted shops (ids). */
export function useFavorites() {
  return useQuery({ queryKey: keys.favorites, queryFn: fetchFavorites });
}

/** The phone confirmed by SMS on this account, or null. */
export function useVerifiedPhone() {
  return useQuery({ queryKey: keys.verifiedPhone, queryFn: fetchVerifiedPhone });
}
