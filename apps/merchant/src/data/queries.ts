import { QueryClient, useQuery } from '@tanstack/react-query';

import { fetchCatalog, fetchMoney, fetchOrders, fetchProducts, fetchStore } from './api';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
});

export const keys = {
  store: ['store'] as const,
  orders: ['orders'] as const,
  money: ['money'] as const,
  products: ['products'] as const,
  catalog: ['catalog'] as const,
};

export function useShop() {
  return useQuery({ queryKey: keys.store, queryFn: fetchStore, staleTime: 30_000 });
}

/** New orders must ring within seconds, so the list refreshes every 8 seconds. */
export function useOrders(enabled = true) {
  return useQuery({ queryKey: keys.orders, queryFn: fetchOrders, enabled, refetchInterval: 8_000, refetchIntervalInBackground: true });
}

export function useMoney() {
  return useQuery({ queryKey: keys.money, queryFn: fetchMoney, refetchInterval: 30_000 });
}

export function useCatalog() {
  return useQuery({ queryKey: keys.catalog, queryFn: fetchCatalog });
}

export function useProducts() {
  return useQuery({ queryKey: keys.products, queryFn: fetchProducts });
}

/** After any change, refresh everything the shop sees. */
export function refreshAll() {
  queryClient.invalidateQueries();
}
