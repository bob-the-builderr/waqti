import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useCart, type Line } from '@/state/cart';
import { useToast } from '@/state/toast';

import { fetchOrder, fetchProductsByIds, friendlyError } from './api';
import { useStores } from './queries';

/**
 * «اطلب نفس الطلب تاني»: puts a past order's items back in the cart at
 * today's prices and opens checkout, where the customer still confirms.
 */
export function useReorder() {
  const stores = useStores();
  const fill = useCart((s) => s.fill);
  const toast = useToast((s) => s.show);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const detail = await fetchOrder(orderId);
      const wanted = (detail?.stores ?? []).flatMap((s) => s.lines).filter((l) => l.productId);
      const products = await fetchProductsByIds(wanted.map((l) => l.productId as string));
      const lines: Line[] = [];
      for (const product of products) {
        const store = stores.data?.find((s) => s.id === product.storeId);
        const qty = wanted.find((l) => l.productId === product.id)?.qty ?? 1;
        if (store) lines.push({ product, store, qty });
      }
      return { lines, missing: wanted.length - lines.length };
    },
    onSuccess: ({ lines, missing }) => {
      if (lines.length === 0) {
        toast('الحاجات دي مش متوفرة دلوقتي في المحلات');
        return;
      }
      fill(lines);
      if (missing > 0) toast('فيه حاجات مش متوفرة النهارده، ضفنا الباقي بأسعار النهارده');
      router.push('/checkout');
    },
    onError: (error) => toast(friendlyError(error)),
  });
}
