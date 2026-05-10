// Beta Sprint 1.3 B15: Low Stock Alert API
// GET - Products with low inventory

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const querySchema = z.object({
  threshold: z.coerce.number().min(0).default(10),
  limit: z.coerce.number().min(1).max(50).default(20),
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
    
    const { threshold, limit } = result.data;
    const supabase = await createClient();
    
    const { data, error, count } = await supabase
      .from('products')
      .select(
        'id, name_en, name_az, stock_available, price, category:categories(name_en)',
        { count: 'exact' }
      )
      .lte('stock_available', threshold)
      .gt('stock_available', 0)
      .order('stock_available', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Low stock fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data,
      meta: {
        threshold,
        total_low_stock: count || 0,
        limit,
      },
    });
    
  } catch (error) {
    console.error('Low stock GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch low stock products' } },
      { status: 500 }
    );
  }
}
