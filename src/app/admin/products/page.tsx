'use client';

// Gamma Sprint 1.3 - G14: Admin product list.
// - Sortable, paginated table (image, name, price, stock, category, status,
//   actions) with shadcn-styled table primitives.
// - Filters: search by name (debounced), category dropdown, stock status.
// - Bulk select + bulk delete with confirmation.
// - Per-row Edit / Delete buttons.

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  useAdminCategories,
  useAdminProducts,
  useDeleteProduct,
} from '@/lib/admin/queries';
import { formatPrice } from '@/lib/format';
import type { StockStatus } from '@/lib/admin/types';

const PER_PAGE = 20;

const STOCK_OPTIONS: Array<{ value: '' | StockStatus; label: string }> = [
  { value: '', label: 'All stock' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock (≤10)' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

export default function AdminProductsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const initialSearch = params.get('search') ?? '';
  const initialCategory = params.get('category_id') ?? '';
  const initialStock = (params.get('stock_status') ?? '') as
    | ''
    | StockStatus;
  const initialPage = Number(params.get('page') ?? 1) || 1;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [stockStatus, setStockStatus] = useState<'' | StockStatus>(
    initialStock
  );
  const [page, setPage] = useState(initialPage);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<
    { kind: 'single'; id: string; name: string } | { kind: 'bulk' } | null
  >(null);

  // Debounce search input -> applied search query.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Sync filters to URL so refreshes/back button work.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (categoryId) sp.set('category_id', categoryId);
    if (stockStatus) sp.set('stock_status', stockStatus);
    if (page > 1) sp.set('page', String(page));
    const qs = sp.toString();
    router.replace(qs ? `/admin/products?${qs}` : '/admin/products', {
      scroll: false,
    });
  }, [search, categoryId, stockStatus, page, router]);

  const productsQuery = useAdminProducts({
    page,
    per_page: PER_PAGE,
    search: search || undefined,
    category_id: categoryId || undefined,
    stock_status: stockStatus || undefined,
  });

  const categoriesQuery = useAdminCategories();
  const deleteMutation = useDeleteProduct();

  const items = useMemo(
    () => productsQuery.data?.data ?? [],
    [productsQuery.data]
  );
  const meta = productsQuery.data?.meta;

  const visibleIds = useMemo(() => items.map((p) => p.id), [items]);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const partiallySelected =
    visibleIds.some((id) => selected.has(id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirm) return;
    if (confirm.kind === 'single') {
      try {
        await deleteMutation.mutateAsync(confirm.id);
        toast.success(`Deleted ${confirm.name}`);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(confirm.id);
          return next;
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete product'
        );
      } finally {
        setConfirm(null);
      }
      return;
    }

    // bulk
    const ids = [...selected];
    let success = 0;
    for (const id of ids) {
      try {
        await deleteMutation.mutateAsync(id);
        success++;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Failed to delete ${id}`
        );
      }
    }
    if (success > 0) toast.success(`Deleted ${success} product(s)`);
    setSelected(new Set());
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {meta ? `${meta.total} products` : 'Manage your product catalog'}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add new product
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product name…"
                className="pl-9"
              />
            </div>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categoriesQuery.data?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_en}
                </option>
              ))}
            </Select>
            <Select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value as '' | StockStatus);
                setPage(1);
              }}
              aria-label="Stock status"
            >
              {STOCK_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Button
              variant="destructive"
              disabled={selected.size === 0 || deleteMutation.isPending}
              onClick={() => setConfirm({ kind: 'bulk' })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete selected ({selected.size})
            </Button>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = partiallySelected;
                      }}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQuery.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : productsQuery.error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-red-600">
                      Could not load products:{' '}
                      {productsQuery.error instanceof Error
                        ? productsQuery.error.message
                        : 'Unknown error'}
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No products match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((product) => {
                    const stock = product.stock_available;
                    const stockTone =
                      stock === 0
                        ? 'destructive'
                        : stock <= 10
                          ? 'warning'
                          : 'success';
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={`Select ${product.name_en}`}
                            checked={selected.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative h-10 w-10 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name_en}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-medium text-slate-900 hover:underline dark:text-white"
                          >
                            {product.name_en}
                          </Link>
                          {product.slug ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              /{product.slug}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatPrice(product.price)}</span>
                            {product.original_price &&
                            product.original_price > product.price ? (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(product.original_price)}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={stockTone}
                            className="font-mono text-[11px]"
                          >
                            {stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {product.category?.name_en ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {product.is_featured ? (
                              <Badge variant="info">Featured</Badge>
                            ) : null}
                            {product.is_on_sale ? (
                              <Badge variant="warning">On sale</Badge>
                            ) : null}
                            {!product.is_featured && !product.is_on_sale ? (
                              <Badge variant="outline">—</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${product.name_en}`}
                            >
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete ${product.name_en}`}
                              onClick={() =>
                                setConfirm({
                                  kind: 'single',
                                  id: product.id,
                                  name: product.name_en,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <DialogContent onClose={() => setConfirm(null)}>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === 'bulk'
                ? `Delete ${selected.size} products?`
                : `Delete ${confirm?.kind === 'single' ? confirm.name : ''}?`}
            </DialogTitle>
            <DialogDescription>
              This permanently removes the product
              {confirm?.kind === 'bulk' ? 's' : ''} and any cart line items
              referencing {confirm?.kind === 'bulk' ? 'them' : 'it'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
