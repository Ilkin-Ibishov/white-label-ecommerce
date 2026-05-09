'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart/queries';
import { formatPriceCents } from '@/lib/format';

export function HeaderCart() {
  const { data: cart } = useCart();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const items = cart?.items ?? [];
  const unitCount = cart?.unitCount ?? 0;
  const totalCents = cart?.totalCents ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Cart${unitCount > 0 ? ` (${unitCount} item${unitCount === 1 ? '' : 's'})` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="header-cart-button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {unitCount > 0 && (
          <span
            data-testid="header-cart-count"
            className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
          >
            {unitCount > 99 ? '99+' : unitCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Mini cart"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Your Cart {unitCount > 0 ? `(${unitCount})` : ''}
            </p>
            <button
              type="button"
              aria-label="Close mini cart"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Your cart is empty.
            </p>
          ) : (
            <>
              <ul className="max-h-64 space-y-3 overflow-y-auto">
                {items.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {item.product.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.quantity} × {formatPriceCents(item.product.priceCents)}
                      </p>
                    </div>
                  </li>
                ))}
                {items.length > 4 && (
                  <li className="text-center text-xs text-slate-500 dark:text-slate-400">
                    + {items.length - 4} more item{items.length - 4 === 1 ? '' : 's'}
                  </li>
                )}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Subtotal</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatPriceCents(totalCents)}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <Button asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/cart">View cart</Link>
                </Button>
                <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderCart;
