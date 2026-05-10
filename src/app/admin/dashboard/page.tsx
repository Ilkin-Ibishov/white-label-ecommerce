'use client';

// Gamma Sprint 1.3 - G13: Admin dashboard overview.
// - Four stat cards (today's sales, orders today, pending orders, low stock)
//   wired to /api/admin/analytics.
// - Recent orders table (last 5) with status badges and view links.
// - Quick actions: "Add product" + "View all orders".
// - Sales analytics charts (G19) live below the recent orders.

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  Eye,
  ListOrdered,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { useAdminAnalytics, useLowStock } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/format';

export default function AdminDashboardPage() {
  const analyticsQuery = useAdminAnalytics();
  const lowStockQuery = useLowStock(10);

  const analytics = analyticsQuery.data?.data;
  const recentOrders = analytics?.recent_orders ?? [];

  const lowStockCount =
    lowStockQuery.data?.meta.total_low_stock ??
    analytics?.low_stock.count ??
    0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Today&apos;s revenue, orders, and inventory at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/orders">
              <Eye className="mr-2 h-4 w-4" />
              View all orders
            </Link>
          </Button>
        </div>
      </div>

      {analyticsQuery.error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40">
          <CardContent className="p-4 text-sm text-red-800 dark:text-red-200">
            Failed to load dashboard analytics:{' '}
            {analyticsQuery.error instanceof Error
              ? analyticsQuery.error.message
              : 'Unknown error'}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total sales (today)"
          value={formatPrice(analytics?.sales.today.amount ?? 0)}
          hint={
            analytics
              ? `${analytics.sales.today.count} order${
                  analytics.sales.today.count === 1 ? '' : 's'
                }`
              : undefined
          }
          icon={<CircleDollarSign className="h-4 w-4" />}
          tone="positive"
          isLoading={analyticsQuery.isPending}
        />
        <StatCard
          label="Orders today"
          value={String(analytics?.sales.today.count ?? 0)}
          hint={
            analytics
              ? `${formatPrice(analytics.sales.this_week.amount)} this week`
              : undefined
          }
          icon={<ShoppingCart className="h-4 w-4" />}
          isLoading={analyticsQuery.isPending}
        />
        <StatCard
          label="Pending orders"
          value={String(analytics?.orders.pending_count ?? 0)}
          hint="Awaiting confirmation"
          icon={<ListOrdered className="h-4 w-4" />}
          tone={
            (analytics?.orders.pending_count ?? 0) > 0 ? 'warning' : 'default'
          }
          isLoading={analyticsQuery.isPending}
        />
        <StatCard
          label="Low stock items"
          value={String(lowStockCount)}
          hint="Stock ≤ 10"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={lowStockCount > 0 ? 'destructive' : 'default'}
          isLoading={analyticsQuery.isPending && lowStockQuery.isPending}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent orders</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last 5 orders received
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              All orders <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {analyticsQuery.isPending ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              No orders yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {order.customer_email ?? '—'}
                    </TableCell>
                    <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AnalyticsCharts />
    </div>
  );
}
