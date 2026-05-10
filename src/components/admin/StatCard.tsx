// Gamma Sprint 1.3 - G13: Stat card for dashboard summary tiles.

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'destructive';
  isLoading?: boolean;
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-900 dark:text-white',
  positive: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  destructive: 'text-red-700 dark:text-red-400',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  isLoading,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className={cn('mt-1 text-2xl font-bold', TONE_STYLES[tone])}>
              {value}
            </p>
          )}
          {hint ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
