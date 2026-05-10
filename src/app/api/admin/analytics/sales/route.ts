// Beta Sprint 1.3 B14: Sales Chart Data API
// GET - Time-series sales data for charts

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = querySchema.safeParse(params);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const { period, group_by } = result.data;
    const supabase = await createClient();
    
    // Calculate date range
    const now = new Date();
    let fromDate = new Date();
    
    switch (period) {
      case '7d':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        fromDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const fromStr = fromDate.toISOString();
    
    // Fetch orders in date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', fromStr)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Sales data fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    // Group data
    const groupedData: Record<string, { date: string; revenue: number; orders: number }> = {};
    
    orders?.forEach((order: any) => {
      const date = new Date(order.created_at);
      let key: string;
      
      if (group_by === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (group_by === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { date: key, revenue: 0, orders: 0 };
      }
      
      groupedData[key].revenue += order.total_amount || 0;
      groupedData[key].orders += 1;
    });
    
    const chartData = Object.values(groupedData);
    
    // Calculate totals
    const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return NextResponse.json({
      data: {
        chart_data: chartData,
        summary: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          avg_order_value: avgOrderValue,
          period,
          group_by,
        },
      },
    });
    
  } catch (error) {
    console.error('Sales analytics error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch sales data' } },
      { status: 500 }
    );
  }
}
