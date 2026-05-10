'use client';

// Gamma Sprint 1.3 - G19: Sales analytics visualizations.
// Lazy-loaded via next/dynamic on the dashboard page so recharts only ships
// in the bundle when an admin actually views analytics.

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSales } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/format';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIOD_OPTIONS: { value: Period; label: string; group: 'day' | 'week' | 'month' }[] = [
  { value: '7d', label: 'Last 7 days', group: 'day' },
  { value: '30d', label: 'Last 30 days', group: 'day' },
  { value: '90d', label: 'Last 90 days', group: 'week' },
  { value: '1y', label: 'Last year', group: 'month' },
];

interface AnalyticsChartsProps {
  topProducts?: Array<{ id: string; name: string; revenue: number; orders?: number }>;
  defaultPeriod?: Period;
}

export function AnalyticsCharts({
  topProducts = [],
  defaultPeriod = '30d',
}: AnalyticsChartsProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const groupBy =
    PERIOD_OPTIONS.find((p) => p.value === period)?.group ?? 'day';
  const salesQuery = useAdminSales(period, groupBy);

  const chartPoints = useMemo(() => {
    return (salesQuery.data?.data.chart_data ?? []).map((point) => ({
      date: point.date,
      revenue: Number(point.revenue) || 0,
      orders: Number(point.orders) || 0,
    }));
  }, [salesQuery.data]);

  const summary = salesQuery.data?.data.summary;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Revenue</CardTitle>
            {summary ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatPrice(summary.total_revenue)} across{' '}
                {summary.total_orders} order
                {summary.total_orders === 1 ? '' : 's'} · avg{' '}
                {formatPrice(summary.avg_order_value)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={period === option.value ? 'default' : 'outline'}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-72">
          {salesQuery.isPending ? (
            <Skeleton className="h-full w-full" />
          ) : salesQuery.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Couldn&apos;t load sales chart:{' '}
              {salesQuery.error instanceof Error
                ? salesQuery.error.message
                : 'Unknown error'}
            </p>
          ) : chartPoints.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => formatPrice(value)}
                  width={80}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? formatPrice(value) : String(value)
                  }
                  labelClassName="text-xs"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(222.2 47.4% 11.2%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily order count
          </p>
        </CardHeader>
        <CardContent className="h-72">
          {salesQuery.isPending ? (
            <Skeleton className="h-full w-full" />
          ) : chartPoints.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill="hsl(222.2 47.4% 11.2%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top products</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Best-selling products in the selected window
          </p>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No sales data in this period yet.
            </p>
          ) : (
            <ol className="divide-y divide-slate-200 dark:divide-slate-800">
              {topProducts.slice(0, 5).map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {formatPrice(product.revenue)}
                    {typeof product.orders === 'number'
                      ? ` · ${product.orders} orders`
                      : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      No data in this period
    </div>
  );
}
