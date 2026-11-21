import { QueryClient, useQuery } from '@tanstack/react-query';

import { fetchEarnings, fetchMe, fetchOffers, fetchTrip } from './api';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
});

export const keys = {
  me: ['me'] as const,
  offers: ['offers'] as const,
  trip: ['trip'] as const,
  earnings: ['earnings'] as const,
};

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: fetchMe, staleTime: 30_000 });
}

/** Offers refresh every 8 seconds while the driver is online and free. */
export function useOffers(enabled: boolean) {
  return useQuery({ queryKey: keys.offers, queryFn: fetchOffers, enabled, refetchInterval: 8_000, refetchIntervalInBackground: true });
}

/** The current trip; the shops' «جاهز» shows up within 10 seconds. */
export function useTrip(enabled = true) {
  return useQuery({ queryKey: keys.trip, queryFn: fetchTrip, enabled, refetchInterval: 10_000 });
}

export function useEarnings() {
  return useQuery({ queryKey: keys.earnings, queryFn: fetchEarnings, refetchInterval: 60_000 });
}

export function refreshAll() {
  queryClient.invalidateQueries();
}
