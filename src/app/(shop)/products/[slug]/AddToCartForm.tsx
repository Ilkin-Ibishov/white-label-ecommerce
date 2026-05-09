'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/lib/cart/api';
import { emitCartChanged } from '@/lib/cart/events';

interface AddToCartFormProps {
  productId: string;
  inStock: boolean;
  maxQuantity?: number | null;
}

export function AddToCartForm({ productId, inStock, maxQuantity }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const cap = typeof maxQuantity === 'number' && maxQuantity > 0 ? maxQuantity : 99;
  const upperBound = Math.min(99, cap);

  const handleAdd = () => {
    if (!inStock) return;
    startTransition(async () => {
      try {
        await addToCart(productId, quantity);
        emitCartChanged();
        toast.success('Added to cart');
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not add to cart';
        toast.error(message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Quantity
        </span>
        <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={pending || quantity <= 1}
            className="inline-flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={upperBound}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setQuantity(Math.min(upperBound, Math.max(1, Math.floor(next))));
              }
            }}
            aria-label="Quantity"
            className="h-9 w-14 border-x border-slate-200 bg-transparent text-center text-sm focus:outline-none dark:border-slate-700"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(upperBound, q + 1))}
            disabled={pending || quantity >= upperBound}
            className="inline-flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={handleAdd}
        disabled={!inStock || pending}
        data-testid="add-to-cart"
        className="w-full sm:w-auto"
      >
        <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
        {!inStock ? 'Out of stock' : pending ? 'Adding…' : 'Add to cart'}
      </Button>
    </div>
  );
}

export default AddToCartForm;
