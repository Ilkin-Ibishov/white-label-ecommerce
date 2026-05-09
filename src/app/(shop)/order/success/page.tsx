'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';

function SuccessBody() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order_number');
  const totalRaw = searchParams.get('total');
  const email = searchParams.get('email');

  const total = totalRaw ? Number(totalRaw) : null;
  const totalLabel = total !== null && Number.isFinite(total) ? formatPrice(total) : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="text-center">
        <CardContent className="flex flex-col items-center gap-4 p-10">
          <CheckCircle2
            className="h-14 w-14 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Thank you for your order!
          </h1>
          <p className="max-w-md text-slate-600 dark:text-slate-300">
            Your order has been placed. We&apos;ll contact you shortly to confirm
            delivery details. You&apos;ll pay on delivery in cash.
          </p>

          {(orderNumber || totalLabel || email) && (
            <dl
              data-testid="order-summary"
              className="mx-auto grid w-full max-w-md grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left text-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2"
            >
              {orderNumber && (
                <>
                  <dt className="text-slate-500 dark:text-slate-400">Order number</dt>
                  <dd className="font-medium text-slate-900 dark:text-white" data-testid="order-number">
                    {orderNumber}
                  </dd>
                </>
              )}
              {totalLabel && (
                <>
                  <dt className="text-slate-500 dark:text-slate-400">Total</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{totalLabel}</dd>
                </>
              )}
              {email && (
                <>
                  <dt className="text-slate-500 dark:text-slate-400">Confirmation email</dt>
                  <dd className="break-all font-medium text-slate-900 dark:text-white">
                    {email}
                  </dd>
                </>
              )}
            </dl>
          )}

          <div className="mt-2 w-full max-w-md text-left text-sm text-slate-600 dark:text-slate-300">
            <p className="mb-2 font-semibold text-slate-900 dark:text-white">What&apos;s next?</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Our team will call to confirm your delivery address.</li>
              <li>Have your cash payment ready when the courier arrives.</li>
              {email && <li>Order updates will be sent to {email}.</li>}
            </ul>
          </div>

          <div className="mt-2 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/category/all">Continue shopping</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center text-slate-500">
          Loading…
        </div>
      }
    >
      <SuccessBody />
    </Suspense>
  );
}
