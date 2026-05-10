'use client';

// Gamma Sprint 1.3 - G17: Orders list page.
// - Filters: status, date range, search by order # / email.
// - Sort by created_at / total_amount (toggle desc/asc).
// - Pagination identical to product list.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useAdminOrders } from '@/lib/admin/queries';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/admin/types';
import { formatPrice } from '@/lib/format';

const PER_PAGE = 20;

export default function AdminOrdersPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState<OrderStatus | ''>(
    (params.get('status') as OrderStatus | null) ?? ''
  );
  const [dateFrom, setDateFrom] = useState(params.get('date_from') ?? '');
  const [dateTo, setDateTo] = useState(params.get('date_to') ?? '');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'status'>(
    (params.get('sort_by') as 'created_at' | 'total_amount' | 'status' | null) ??
      'created_at'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (params.get('sort_order') as 'asc' | 'desc' | null) ?? 'desc'
  );
  const [page, setPage] = useState(Number(params.get('page') ?? 1) || 1);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (status) sp.set('status', status);
    if (dateFrom) sp.set('date_from', dateFrom);
    if (dateTo) sp.set('date_to', dateTo);
    sp.set('sort_by', sortBy);
    sp.set('sort_order', sortOrder);
    if (page > 1) sp.set('page', String(page));
    router.replace(`/admin/orders?${sp.toString()}`, { scroll: false });
  }, [search, status, dateFrom, dateTo, sortBy, sortOrder, page, router]);

  const ordersQuery = useAdminOrders({
    page,
    per_page: PER_PAGE,
    search: search || undefined,
    status: status || undefined,
    date_from: dateFrom ? toIsoStart(dateFrom) : undefined,
    date_to: dateTo ? toIsoEnd(dateTo) : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const items = ordersQuery.data?.data ?? [];
  const meta = ordersQuery.data?.meta;

  const toggleSort = (column: 'created_at' | 'total_amount' | 'status') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Orders
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {meta ? `${meta.total} orders` : 'All customer orders'}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by order # or email…"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              aria-label="Status"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Date from"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="Date to"
            />
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>
                    <SortButton
                      label="Date"
                      active={sortBy === 'created_at'}
                      direction={sortOrder}
                      onClick={() => toggleSort('created_at')}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>
                    <SortButton
                      label="Total"
                      active={sortBy === 'total_amount'}
                      direction={sortOrder}
                      onClick={() => toggleSort('total_amount')}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Status"
                      active={sortBy === 'status'}
                      direction={sortOrder}
                      onClick={() => toggleSort('status')}
                    />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : ordersQuery.error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-red-600">
                      Could not load orders:{' '}
                      {ordersQuery.error instanceof Error
                        ? ordersQuery.error.message
                        : 'Unknown error'}
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No orders match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {order.customer_name ?? '—'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {order.customer_email ?? ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta ? (
              <AdminPagination
                page={meta.page}
                totalPages={meta.total_pages}
                onPageChange={(next) => setPage(next)}
                total={meta.total}
                perPage={meta.per_page}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-slate-900 dark:hover:text-white"
    >
      {label}
      {active ? (
        <ArrowDownUp
          className={`h-3 w-3 ${direction === 'asc' ? '' : 'rotate-180'}`}
        />
      ) : null}
    </button>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function toIsoStart(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoEnd(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
