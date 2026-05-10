'use client';

// Gamma Sprint 1.3 - G18: Order detail page.
// - Header with order number, date, current status + status update dropdown.
// - Customer + shipping address blocks.
// - Order items table with thumbnail, name, unit price, qty, line total.
// - Payment & total breakdown.
// - Print button uses window.print(); print styles below.

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Mail, Phone, Printer, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import {
  useAdminOrder,
  useUpdateOrderStatus,
} from '@/lib/admin/queries';
import {
  ORDER_STATUSES,
  type AdminShippingAddress,
  type OrderStatus,
} from '@/lib/admin/types';
import { formatPrice } from '@/lib/format';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = use(params);
  const orderQuery = useAdminOrder(id);
  const statusMutation = useUpdateOrderStatus(id);

  if (orderQuery.isPending) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-600 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading order…
      </div>
    );
  }

  if (orderQuery.error || !orderQuery.data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40">
        <CardContent className="p-4 text-sm text-red-800 dark:text-red-200">
          {orderQuery.error instanceof Error
            ? orderQuery.error.message
            : 'Order not found.'}
        </CardContent>
      </Card>
    );
  }

  const order = orderQuery.data;
  const items = order.order_items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.price_at_purchase * item.quantity,
    0
  );

  const handleStatusChange = async (next: OrderStatus) => {
    if (next === order.status) return;
    try {
      await statusMutation.mutateAsync(next);
      toast.success(`Status updated to ${next}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update status'
      );
    }
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <PrintStyles />

      <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/orders">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to orders
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Order {order.order_number}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Status</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current status: <OrderStatusBadge status={order.status} />
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <label
                htmlFor="status-select"
                className="text-sm text-slate-600 dark:text-slate-300"
              >
                Update status
              </label>
              <Select
                id="status-select"
                value={order.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as OrderStatus)
                }
                disabled={statusMutation.isPending}
                className="w-44"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-slate-500"
                    >
                      No line items.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                            {item.product?.image_url ? (
                              <Image
                                src={item.product.image_url}
                                alt={item.product.name_en ?? 'Product'}
                                fill
                                sizes="40px"
                                unoptimized
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.product?.name_en ?? `Product ${item.product_id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.price_at_purchase)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.price_at_purchase * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex flex-col items-end gap-1 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row
                label="Total"
                value={formatPrice(order.total_amount)}
                bold
              />
              <Row
                label="Payment"
                value={describePayment(order.payment_method)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <User className="h-4 w-4 text-slate-400" />
                {order.customer_name ?? '—'}
              </p>
              <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Mail className="h-4 w-4 text-slate-400" />
                {order.customer_email ?? '—'}
              </p>
              <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Phone className="h-4 w-4 text-slate-400" />
                {order.customer_phone ?? '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 dark:text-slate-200">
              <ShippingAddressBlock address={order.shipping_address} />
            </CardContent>
          </Card>

          {order.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                {order.notes}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex w-full max-w-xs justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={
          bold
            ? 'font-semibold text-slate-900 dark:text-white'
            : 'text-slate-700 dark:text-slate-200'
        }
      >
        {value}
      </span>
    </div>
  );
}

function describePayment(method?: string | null) {
  if (!method) return '—';
  if (method === 'cod' || method === 'pay_on_delivery') return 'Pay on delivery';
  return method;
}

function ShippingAddressBlock({
  address,
}: {
  address: AdminShippingAddress | string | null | undefined;
}) {
  if (!address) {
    return <p className="text-slate-500 dark:text-slate-400">No address provided.</p>;
  }
  if (typeof address === 'string') {
    return <p className="whitespace-pre-line">{address}</p>;
  }
  const lines = [
    address.line1,
    address.line2,
    [address.city, address.region, address.postal_code]
      .filter(Boolean)
      .join(', '),
    address.country,
  ].filter(Boolean) as string[];
  if (lines.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">No address provided.</p>;
  }
  return (
    <address className="not-italic">
      {lines.map((line, idx) => (
        <span key={idx} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: #fff !important;
        }
        aside,
        header.sticky,
        nav {
          display: none !important;
        }
        main {
          padding: 0 !important;
        }
        .print\\:hidden {
          display: none !important;
        }
      }
    `}</style>
  );
}
