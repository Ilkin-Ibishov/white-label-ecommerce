'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/lib/cart/queries';
import { emitCartChanged } from '@/lib/cart/events';
import { formatPriceCents } from '@/lib/format';

export default function CartPage() {
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const cart = cartQuery.data;
  const isLoading = cartQuery.isPending && !cart;
  const error = cartQuery.error;

  const handleQuantityChange = (itemId: string, nextQuantity: number) => {
    if (nextQuantity < 1) return;
    updateMutation.mutate(
      { itemId, quantity: nextQuantity },
      {
        onSuccess: () => emitCartChanged(),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Could not update item'),
      }
    );
  };

  const handleRemove = (itemId: string) => {
    removeMutation.mutate(itemId, {
      onSuccess: () => {
        emitCartChanged();
        toast.success('Item removed');
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Could not remove item'),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
        <span className="sr-only">Loading cart…</span>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your cart
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Could not load your cart.</p>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void cartQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your cart is empty
        </h1>
        <p className="mb-6 text-slate-600 dark:text-slate-300">
          Browse our products and add something you love.
        </p>
        <Button asChild>
          <Link href="/category/all">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const isMutating = updateMutation.isPending || removeMutation.isPending;
  const updatingId =
    updateMutation.isPending ? updateMutation.variables?.itemId ?? null : null;
  const removingId = removeMutation.isPending ? removeMutation.variables ?? null : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Your cart ({cart.unitCount})
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3" data-testid="cart-items">
          {cart.items.map((item) => {
            const lineTotalCents = item.product.priceCents * item.quantity;
            const isBusy = updatingId === item.id || removingId === item.id;
            return (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.product.slug ? (
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="line-clamp-2 text-base font-medium text-slate-900 hover:underline dark:text-white"
                        >
                          {item.product.title}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-base font-medium text-slate-900 dark:text-white">
                          {item.product.title}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {formatPriceCents(item.product.priceCents)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={isBusy || isMutating || item.quantity <= 1}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          className="inline-flex h-9 w-10 items-center justify-center border-x border-slate-200 text-sm dark:border-slate-700"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={isBusy || isMutating || item.quantity >= 99}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <span className="w-24 text-right text-base font-semibold text-slate-900 dark:text-white">
                        {formatPriceCents(lineTotalCents)}
                      </span>

                      <button
                        type="button"
                        aria-label={`Remove ${item.product.title}`}
                        disabled={isBusy || isMutating}
                        onClick={() => handleRemove(item.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Order summary
              </h2>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Subtotal ({cart.unitCount} item
                  {cart.unitCount === 1 ? '' : 's'})
                </span>
                <span>{formatPriceCents(cart.totalCents)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>Total</span>
                <span data-testid="cart-total">
                  {formatPriceCents(cart.totalCents)}
                </span>
              </div>
              <Button asChild size="lg" className="mt-2 w-full">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/category/all">Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
