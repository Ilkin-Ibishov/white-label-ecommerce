'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  addToCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from './api';
import { onCartChanged } from './events';
import type { CartSummary } from './types';

const EMPTY: CartSummary = { items: [], totalCents: 0, count: 0, unitCount: 0 };

export const cartQueryKey = ['cart'] as const;

export function useCart() {
  const queryClient = useQueryClient();

  // Subscribe to cross-island cart events; React Query handles the actual fetch
  // (no synchronous setState in this effect body).
  useEffect(() => {
    return onCartChanged(() => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    });
  }, [queryClient]);

  return useQuery<CartSummary>({
    queryKey: cartQueryKey,
    queryFn: ({ signal }) => fetchCart(signal),
    placeholderData: (previous) => previous ?? EMPTY,
    staleTime: 15_000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });
}
