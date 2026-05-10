'use client';

// Gamma Sprint 1.3 - Admin API client
// Thin typed fetchers around the Alpha/Beta admin API contract documented in
// the Sprint 1.3 delegation prompt. The middleware enforces admin role for
// every /api/admin/* route, so credentials are sent via session cookies
// automatically.

import type {
  AdminCategory,
  AdminCategoryInput,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminProductDetail,
  AdminProductInput,
  AdminProductListItem,
  AnalyticsSummary,
  ListMeta,
  LowStockProduct,
  OrderStatus,
  SalesChartData,
  StockStatus,
} from './types';

interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

interface SingleResponse<T> {
  data: T;
  message?: string;
}

async function request<T>(
  url: string,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* empty body */
  }

  if (!response.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

function buildQuery(params: object): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ---------- Products ----------

export interface AdminProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: string;
  stock_status?: StockStatus;
  is_featured?: boolean;
  sort_by?: 'name' | 'price' | 'stock' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export async function fetchAdminProducts(
  params: AdminProductListParams,
  signal?: AbortSignal
): Promise<ListResponse<AdminProductListItem>> {
  return request<ListResponse<AdminProductListItem>>(
    `/api/admin/products${buildQuery(params)}`,
    { signal }
  );
}

export async function fetchAdminProduct(
  id: string,
  signal?: AbortSignal
): Promise<AdminProductDetail> {
  // GET /api/admin/products/[id] is not part of the documented contract; the
  // list endpoint is the canonical source so we hydrate edit forms from it.
  const list = await fetchAdminProducts({ per_page: 100 }, signal);
  const found = list.data.find((p) => p.id === id);
  if (!found) {
    throw new Error('Product not found');
  }
  return found as AdminProductDetail;
}

export async function createAdminProduct(
  input: AdminProductInput
): Promise<SingleResponse<AdminProductDetail>> {
  return request<SingleResponse<AdminProductDetail>>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminProduct(
  id: string,
  input: Partial<AdminProductInput>
): Promise<SingleResponse<AdminProductDetail>> {
  return request<SingleResponse<AdminProductDetail>>(
    `/api/admin/products/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await request<{ message: string }>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Categories ----------

export async function fetchAdminCategories(
  signal?: AbortSignal
): Promise<{ data: AdminCategory[] }> {
  return request<{ data: AdminCategory[] }>('/api/admin/categories', { signal });
}

export async function createAdminCategory(
  input: AdminCategoryInput
): Promise<SingleResponse<AdminCategory>> {
  return request<SingleResponse<AdminCategory>>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminCategory(
  id: string,
  input: AdminCategoryInput
): Promise<SingleResponse<AdminCategory>> {
  return request<SingleResponse<AdminCategory>>(
    `/api/admin/categories/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await request<{ message: string }>(`/api/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Orders ----------

export interface AdminOrderListParams {
  page?: number;
  per_page?: number;
  status?: OrderStatus;
  date_from?: string; // ISO datetime
  date_to?: string;
  search?: string;
  sort_by?: 'created_at' | 'total_amount' | 'status';
  sort_order?: 'asc' | 'desc';
}

export async function fetchAdminOrders(
  params: AdminOrderListParams,
  signal?: AbortSignal
): Promise<ListResponse<AdminOrderListItem>> {
  return request<ListResponse<AdminOrderListItem>>(
    `/api/admin/orders${buildQuery(params)}`,
    { signal }
  );
}

export async function fetchAdminOrder(
  id: string,
  signal?: AbortSignal
): Promise<AdminOrderDetail> {
  const res = await request<{ data: AdminOrderDetail }>(
    `/api/admin/orders/${id}`,
    { signal }
  );
  return res.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<SingleResponse<AdminOrderDetail>> {
  return request<SingleResponse<AdminOrderDetail>>(
    `/api/admin/orders/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }
  );
}

// ---------- Analytics ----------

export async function fetchAdminAnalytics(
  signal?: AbortSignal
): Promise<{ data: AnalyticsSummary }> {
  return request<{ data: AnalyticsSummary }>('/api/admin/analytics', { signal });
}

export async function fetchAdminSales(
  params: { period?: '7d' | '30d' | '90d' | '1y'; group_by?: 'day' | 'week' | 'month' },
  signal?: AbortSignal
): Promise<{ data: SalesChartData }> {
  return request<{ data: SalesChartData }>(
    `/api/admin/analytics/sales${buildQuery(params)}`,
    { signal }
  );
}

export async function fetchLowStock(
  threshold = 10,
  signal?: AbortSignal
): Promise<{ data: LowStockProduct[]; meta: { threshold: number; total_low_stock: number; limit: number } }> {
  return request<{
    data: LowStockProduct[];
    meta: { threshold: number; total_low_stock: number; limit: number };
  }>(`/api/admin/alerts/low-stock${buildQuery({ threshold })}`, { signal });
}

// ---------- Auth helper ----------

export async function adminLogout(): Promise<void> {
  await request<{ data: { message: string } }>('/api/auth/logout', {
    method: 'POST',
  });
}
