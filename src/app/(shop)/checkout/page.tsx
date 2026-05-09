'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  confirmOrder,
  initCheckout,
  saveShipping,
  type CheckoutSummary,
  type ShippingAddressInput,
} from '@/lib/cart/checkout';
import { cartQueryKey } from '@/lib/cart/queries';
import { emitCartChanged } from '@/lib/cart/events';
import { formatPrice } from '@/lib/format';
import { storeConfig } from '../../../../config/store.config';

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  payment_method: 'pay_on_delivery' | 'card';
}

const INITIAL_STATE: FormState = {
  full_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: 'AZ',
  payment_method: 'pay_on_delivery',
};

const checkoutInitKey = ['checkout', 'init'] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [formError, setFormError] = useState<string | null>(null);

  const summaryQuery = useQuery<CheckoutSummary>({
    queryKey: checkoutInitKey,
    queryFn: () => initCheckout(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (input: {
      shippingPayload: Parameters<typeof saveShipping>[0];
    }) => {
      await saveShipping(input.shippingPayload);
      return confirmOrder();
    },
  });

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = useCallback((): string | null => {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim() || !/.+@.+\..+/.test(form.email)) {
      return 'A valid email address is required.';
    }
    if (form.phone.trim().length < 10) {
      return 'Phone number must be at least 10 characters.';
    }
    if (!form.address_line1.trim()) return 'Street address is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.postal_code.trim()) return 'Postal code is required.';
    if (!form.country.trim()) return 'Country is required.';
    return null;
  }, [form]);

  const allowCardPayment = false;

  const summary = summaryQuery.data;

  const summaryRows = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: `Subtotal (${summary.item_count} item${summary.item_count === 1 ? '' : 's'})`,
        value: formatPrice(summary.subtotal),
      },
      {
        label: 'Shipping',
        value: summary.shipping > 0 ? formatPrice(summary.shipping) : 'Free',
      },
    ];
  }, [summary]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setFormError(validation);
      toast.error(validation);
      return;
    }
    setFormError(null);

    if (!summary || summary.item_count === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    const shipping_address: ShippingAddressInput = {
      full_name: form.full_name.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || undefined,
      city: form.city.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
    };

    placeOrderMutation.mutate(
      {
        shippingPayload: {
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim(),
          shipping_address,
          payment_method: form.payment_method,
        },
      },
      {
        onSuccess: (result) => {
          emitCartChanged();
          void queryClient.invalidateQueries({ queryKey: cartQueryKey });
          const params = new URLSearchParams({
            order_number: String(result.order_number),
            total: String(result.total),
            email: form.email.trim(),
          });
          router.replace(`/order/success?${params.toString()}`);
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Checkout failed';
          setFormError(message);
          toast.error(message);
        },
      }
    );
  };

  if (summaryQuery.isPending && !summary) {
    return (
      <div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
        <span className="sr-only">Loading checkout…</span>
      </div>
    );
  }

  if (summaryQuery.error || !summary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Checkout
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Could not start checkout.</p>
          <p className="mt-1">
            {summaryQuery.error instanceof Error
              ? summaryQuery.error.message
              : 'Unknown error.'}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void summaryQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (summary.item_count === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your cart is empty
        </h1>
        <p className="mb-6 text-slate-600 dark:text-slate-300">
          Add a product before checking out.
        </p>
        <Button asChild>
          <Link href="/category/all">Browse products</Link>
        </Button>
      </div>
    );
  }

  const submitting = placeOrderMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
        data-testid="checkout-form"
        noValidate
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  required
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address_line1">Address</Label>
                <Input
                  id="address_line1"
                  required
                  autoComplete="address-line1"
                  value={form.address_line1}
                  onChange={(e) => update('address_line1', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address_line2">Apartment / suite (optional)</Label>
                <Input
                  id="address_line2"
                  autoComplete="address-line2"
                  value={form.address_line2}
                  onChange={(e) => update('address_line2', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal code</Label>
                <Input
                  id="postal_code"
                  required
                  autoComplete="postal-code"
                  value={form.postal_code}
                  onChange={(e) => update('postal_code', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  required
                  autoComplete="country"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary bg-primary/5 p-3">
                <input
                  type="radio"
                  name="payment_method"
                  value="pay_on_delivery"
                  className="mt-1"
                  checked={form.payment_method === 'pay_on_delivery'}
                  onChange={() => update('payment_method', 'pay_on_delivery')}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Pay on delivery
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Pay with cash when your order arrives. {storeConfig.currency.symbol}{' '}
                    only.
                  </p>
                </div>
              </label>
              <label
                className={
                  'flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900' +
                  (allowCardPayment ? ' cursor-pointer' : ' cursor-not-allowed opacity-60')
                }
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  className="mt-1"
                  disabled={!allowCardPayment}
                  checked={form.payment_method === 'card'}
                  onChange={() => allowCardPayment && update('payment_method', 'card')}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Card payment
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Coming soon.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {formError}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-sm text-slate-600 dark:text-slate-300"
                >
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>Total</span>
                <span data-testid="checkout-total">{formatPrice(summary.total)}</span>
              </div>
              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full"
                disabled={submitting}
                data-testid="place-order"
              >
                {submitting ? 'Placing order…' : 'Place order'}
              </Button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                You will not be charged until your order is delivered.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
