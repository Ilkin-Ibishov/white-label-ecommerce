// Gamma Sprint 1.3 - G17/G18: Color-coded order status badge.

import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/admin/types';

const VARIANT_BY_STATUS: Record<
  OrderStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'
> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'destructive',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] ?? 'outline'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
