// Gamma Sprint 1.3 - Admin Dashboard UI types
// Shapes are aligned with Alpha/Beta admin API contracts documented in the
// Sprint 1.3 delegation prompt. Where the API may evolve we keep fields
// optional / nullable so the UI degrades gracefully.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AdminCategoryRef {
  id: string;
  name_en?: string | null;
}

export interface AdminProductListItem {
  id: string;
  slug?: string | null;
  name_en: string;
  name_az?: string | null;
  name_ru?: string | null;
  price: number;
  original_price?: number | null;
  stock_available: number;
  is_featured?: boolean | null;
  is_on_sale?: boolean | null;
  created_at?: string | null;
  image_url?: string | null;
  category?: AdminCategoryRef | null;
}

export interface AdminProductDetail extends AdminProductListItem {
  description_en?: string | null;
  description_az?: string | null;
  description_ru?: string | null;
  category_id?: string | null;
  image_gallery?: string[] | null;
}

export interface AdminProductInput {
  name_en: string;
  name_az?: string;
  name_ru?: string;
  description_en?: string;
  description_az?: string;
  description_ru?: string;
  price: number;
  original_price?: number;
  stock_available: number;
  category_id?: string | null;
  is_featured: boolean;
  is_on_sale: boolean;
  image_url?: string;
  image_gallery: string[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  name_en: string;
  name_az?: string | null;
  name_ru?: string | null;
  description_en?: string | null;
  parent_id?: string | null;
  sort_order: number;
  created_at?: string | null;
}

export interface AdminCategoryInput {
  name_en: string;
  name_az?: string;
  name_ru?: string;
  description_en?: string;
  parent_id?: string | null;
  sort_order: number;
}

export interface ListMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  currency?: string | null;
  payment_method?: string | null;
  created_at: string;
  customer_email?: string | null;
  customer_name?: string | null;
}

export interface AdminOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: {
    name_en?: string | null;
    image_url?: string | null;
  } | null;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  currency?: string | null;
  payment_method?: string | null;
  shipping_address?: AdminShippingAddress | string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  order_items: AdminOrderItem[];
}

export interface AdminShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface AnalyticsSummary {
  sales: {
    today: { amount: number; count: number };
    this_week: { amount: number; count: number };
    this_month: { amount: number; count: number };
  };
  orders: {
    by_status: Record<OrderStatus, number> | Record<string, number>;
    pending_count: number;
  };
  recent_orders: AdminOrderListItem[];
  low_stock: {
    count: number;
    products: Array<{
      id: string;
      name_en: string;
      stock_available: number;
    }>;
  };
}

export interface SalesChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesChartData {
  chart_data: SalesChartPoint[];
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    period: '7d' | '30d' | '90d' | '1y';
    group_by: 'day' | 'week' | 'month';
  };
}

export interface LowStockProduct {
  id: string;
  name_en: string;
  name_az?: string | null;
  stock_available: number;
  price: number;
  category?: { name_en?: string | null } | null;
}
