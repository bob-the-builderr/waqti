import { QueryClient, useQuery } from '@tanstack/react-query';

import { fetchIsAdmin, fetchOverview } from './api';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
});

export const keys = {
  isAdmin: ['is-admin'] as const,
  overview: ['overview'] as const,
};

export function useIsAdmin() {
  return useQuery({ queryKey: keys.isAdmin, queryFn: fetchIsAdmin, staleTime: 60_000 });
}

/** The whole panel refreshes every 15 seconds. */
export function useOverview() {
  return useQuery({ queryKey: keys.overview, queryFn: fetchOverview, refetchInterval: 15_000 });
}

export function refreshAll() {
  queryClient.invalidateQueries();
}
