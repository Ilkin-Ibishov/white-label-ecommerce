'use client';

// Gamma Sprint 1.3 - TanStack Query hooks for the admin dashboard.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type AdminOrderListParams,
  type AdminProductListParams,
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  fetchAdminAnalytics,
  fetchAdminCategories,
  fetchAdminOrder,
  fetchAdminOrders,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchAdminSales,
  fetchLowStock,
  updateAdminCategory,
  updateAdminProduct,
  updateOrderStatus,
} from './api';
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
} from './types';

// ---------- Query keys ----------

export const adminQueryKeys = {
  all: ['admin'] as const,
  products: (params?: AdminProductListParams) =>
    ['admin', 'products', params ?? {}] as const,
  product: (id: string) => ['admin', 'product', id] as const,
  categories: () => ['admin', 'categories'] as const,
  orders: (params?: AdminOrderListParams) =>
    ['admin', 'orders', params ?? {}] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  analytics: () => ['admin', 'analytics'] as const,
  sales: (period?: string, group?: string) =>
    ['admin', 'analytics', 'sales', period ?? '30d', group ?? 'day'] as const,
  lowStock: (threshold?: number) =>
    ['admin', 'low-stock', threshold ?? 10] as const,
};

// ---------- Products ----------

export function useAdminProducts(
  params: AdminProductListParams,
  options?: Omit<
    UseQueryOptions<{ data: AdminProductListItem[]; meta: ListMeta }>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: adminQueryKeys.products(params),
    queryFn: ({ signal }) => fetchAdminProducts(params, signal),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery<AdminProductDetail>({
    queryKey: id ? adminQueryKeys.product(id) : ['admin', 'product', 'none'],
    queryFn: ({ signal }) => fetchAdminProduct(id!, signal),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminProductInput) => createAdminProduct(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: adminQueryKeys.analytics() });
      void qc.invalidateQueries({ queryKey: ['admin', 'low-stock'] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AdminProductInput>) =>
      updateAdminProduct(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: adminQueryKeys.product(id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'low-stock'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: adminQueryKeys.analytics() });
    },
  });
}

// ---------- Categories ----------

export function useAdminCategories() {
  return useQuery<{ data: AdminCategory[] }>({
    queryKey: adminQueryKeys.categories(),
    queryFn: ({ signal }) => fetchAdminCategories(signal),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCategoryInput) => createAdminCategory(input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminQueryKeys.categories() }),
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCategoryInput) => updateAdminCategory(id, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminQueryKeys.categories() }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminQueryKeys.categories() }),
  });
}

// ---------- Orders ----------

export function useAdminOrders(params: AdminOrderListParams) {
  return useQuery<{ data: AdminOrderListItem[]; meta: ListMeta }>({
    queryKey: adminQueryKeys.orders(params),
    queryFn: ({ signal }) => fetchAdminOrders(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery<AdminOrderDetail>({
    queryKey: id ? adminQueryKeys.order(id) : ['admin', 'order', 'none'],
    queryFn: ({ signal }) => fetchAdminOrder(id!, signal),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminQueryKeys.order(id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void qc.invalidateQueries({ queryKey: adminQueryKeys.analytics() });
    },
  });
}

// ---------- Analytics / alerts ----------

export function useAdminAnalytics() {
  return useQuery<{ data: AnalyticsSummary }>({
    queryKey: adminQueryKeys.analytics(),
    queryFn: ({ signal }) => fetchAdminAnalytics(signal),
    staleTime: 30_000,
  });
}

export function useAdminSales(
  period: '7d' | '30d' | '90d' | '1y',
  groupBy: 'day' | 'week' | 'month'
) {
  return useQuery<{ data: SalesChartData }>({
    queryKey: adminQueryKeys.sales(period, groupBy),
    queryFn: ({ signal }) =>
      fetchAdminSales({ period, group_by: groupBy }, signal),
    placeholderData: (previous) => previous,
  });
}

export function useLowStock(threshold = 10) {
  return useQuery<{ data: LowStockProduct[]; meta: { threshold: number; total_low_stock: number; limit: number } }>({
    queryKey: adminQueryKeys.lowStock(threshold),
    queryFn: ({ signal }) => fetchLowStock(threshold, signal),
    staleTime: 30_000,
  });
}
