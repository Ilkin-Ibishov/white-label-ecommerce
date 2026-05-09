// Beta Agent - Task B4: Categories Tree API
// Sprint 1.1 | Hierarchical category list

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch all active categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, slug, name, description, parent_id, sort_order, is_active')
      .eq('is_active', true)
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Categories query error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } },
        { status: 500 }
      );
    }
    
    // Build tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];
    
    // First pass: create map
    categories?.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
      });
    });
    
    // Second pass: build tree
    categories?.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });
    
    // Get product counts per category (for display)
    const categoryIds = categories?.map(c => c.id) || [];
    let productCounts: Record<string, number> = {};
    
    if (categoryIds.length > 0) {
      const { data: counts } = await supabase
        .from('products')
        .select('category_id, count', { count: 'exact' })
        .in('category_id', categoryIds)
        .eq('status', 'active');
      
      // Note: Supabase returns grouped counts differently
      // For now, we'll use a simpler approach
      const { data: products } = await supabase
        .from('products')
        .select('category_id')
        .in('category_id', categoryIds)
        .eq('status', 'active');
      
      products?.forEach(p => {
        if (p.category_id) {
          productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
        }
      });
    }
    
    // Add product counts to tree
    const addCounts = (nodes: any[]) => {
      nodes.forEach(node => {
        node.product_count = productCounts[node.id] || 0;
        if (node.children?.length > 0) {
          addCounts(node.children);
        }
      });
    };
    
    addCounts(rootCategories);
    
    return NextResponse.json(
      {
        data: rootCategories,
        meta: {
          total: categories?.length || 0,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
