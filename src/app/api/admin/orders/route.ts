// Beta Sprint 1.3 B10: Admin Orders List API
// GET - List all orders with filters

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'total_amount', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
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
    
    const { page, per_page, status, date_from, date_to, search, sort_by, sort_order } = result.data;
    
    const supabase = await createClient();
    
    // Build query with order items
    let query = supabase
      .from('orders')
      .select(
        'id, order_number, status, total_amount, currency, payment_method, created_at, customer_email, customer_name',
        { count: 'exact' }
      );
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    if (search) {
      // Search by order number or email
      query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });
    
    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Admin orders fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data,
      meta: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
    
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } },
      { status: 500 }
    );
  }
}
