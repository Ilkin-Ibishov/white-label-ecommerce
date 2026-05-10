'use client';

// Gamma Sprint 1.3 - G19: Dedicated analytics view.
// Mirrors the dashboard charts with extra context (top low-stock products as a
// stand-in for "top products" until the analytics API exposes a top-sellers
// breakdown).

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { useAdminAnalytics, useLowStock } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/format';

export default function AdminAnalyticsPage() {
  const analyticsQuery = useAdminAnalytics();
  const lowStockQuery = useLowStock(10);

  const summary = analyticsQuery.data?.data.sales;

  const topProducts = (lowStockQuery.data?.data ?? []).map((p) => ({
    id: p.id,
    name: p.name_en,
    revenue: p.price * Math.max(0, p.stock_available),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sales trends and inventory health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Today"
          amount={summary?.today.amount ?? 0}
          count={summary?.today.count ?? 0}
        />
        <SummaryCard
          title="This week"
          amount={summary?.this_week.amount ?? 0}
          count={summary?.this_week.count ?? 0}
        />
        <SummaryCard
          title="This month"
          amount={summary?.this_month.amount ?? 0}
          count={summary?.this_month.count ?? 0}
        />
      </div>

      <AnalyticsCharts topProducts={topProducts} />
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  count,
}: {
  title: string;
  amount: number;
  count: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {formatPrice(amount)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {count} order{count === 1 ? '' : 's'}
        </p>
      </CardContent>
    </Card>
  );
}
