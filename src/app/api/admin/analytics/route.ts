// Beta Sprint 1.3 B13: Dashboard Analytics API
// GET - Dashboard statistics

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Get 7 days ago
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    
    // Get 30 days ago
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString();
    
    // Fetch stats in parallel
    const [
      todayOrders,
      weekOrders,
      monthOrders,
      statusCounts,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // Today's orders
      supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', todayStr),
      
      // Week orders
      supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', weekAgoStr),
      
      // Month orders
      supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', monthAgoStr),
      
      // Status counts (may fail if RPC doesn't exist, handled below)
      supabase.rpc('get_order_status_counts'),
      
      // Recent 5 orders
      supabase
        .from('orders')
        .select('id, order_number, status, total_amount, customer_email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Low stock products (less than 10)
      supabase
        .from('products')
        .select('id, name_en, stock_available')
        .lte('stock_available', 10)
        .gt('stock_available', 0)
        .order('stock_available', { ascending: true })
        .limit(5),
    ]);
    
    // Calculate totals
    const todayTotal = todayOrders.data?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
    const todayCount = todayOrders.data?.length || 0;
    const weekTotal = weekOrders.data?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
    const weekCount = weekOrders.data?.length || 0;
    const monthTotal = monthOrders.data?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
    const monthCount = monthOrders.data?.length || 0;
    
    // Manual status counts if RPC fails
    let statusBreakdown = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    if (!statusCounts?.data) {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status');
      
      allOrders?.forEach(o => {
        if (o.status in statusBreakdown) {
          statusBreakdown[o.status as keyof typeof statusBreakdown]++;
        }
      });
    }
    
    return NextResponse.json({
      data: {
        sales: {
          today: { amount: todayTotal, count: todayCount },
          this_week: { amount: weekTotal, count: weekCount },
          this_month: { amount: monthTotal, count: monthCount },
        },
        orders: {
          by_status: statusCounts?.data || statusBreakdown,
          pending_count: (statusCounts?.data?.pending || statusBreakdown.pending),
        },
        recent_orders: recentOrders.data || [],
        low_stock: {
          count: lowStockProducts.data?.length || 0,
          products: lowStockProducts.data || [],
        },
      },
    });
    
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
