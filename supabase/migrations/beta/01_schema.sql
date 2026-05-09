-- Migration: Beta - Product Catalog Schema
-- Sprint: 1.1 | Agent: Beta | Task: B1
-- Research: store_id added for multi-tenant scaling, indexes on filtered columns

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);

-- Recursive index for tree traversal
CREATE INDEX IF NOT EXISTS idx_categories_tree ON public.categories(parent_id, sort_order) WHERE is_active = true;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID DEFAULT NULL, -- For future multi-tenant scaling (research finding)
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    compare_at_price_cents INTEGER CHECK (compare_at_price_cents >= 0),
    inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
    inventory_track BOOLEAN DEFAULT true,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    seo_title TEXT,
    seo_description TEXT,
    weight_grams INTEGER,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for products (research: index filtered columns for 10k+ SKUs)
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price_cents);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(category_id, price_cents) WHERE status = 'active';

-- Full-text search index (for future search implementation)
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for product images
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary) WHERE is_primary = true;

-- Ensure only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_single_primary ON public.product_images(product_id, is_primary) WHERE is_primary = true;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Reuse function from alpha migration if exists, otherwise create
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Category updated_at trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Product updated_at trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get category tree (recursive CTE helper)
CREATE OR REPLACE FUNCTION get_category_tree(root_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    name TEXT,
    parent_id UUID,
    level INTEGER,
    path TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Base case: root categories or specific root
        SELECT 
            c.id,
            c.slug,
            c.name,
            c.parent_id,
            0 as level,
            ARRAY[c.slug] as path
        FROM public.categories c
        WHERE (root_id IS NULL AND c.parent_id IS NULL)
           OR (root_id IS NOT NULL AND c.id = root_id)
        
        UNION ALL
        
        -- Recursive case: children
        SELECT 
            c.id,
            c.slug,
            c.name,
            c.parent_id,
            ct.level + 1,
            ct.path || c.slug
        FROM public.categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree
    ORDER BY path;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get product with primary image (common query pattern)
CREATE OR REPLACE FUNCTION get_product_with_primary_image(product_slug TEXT)
RETURNS TABLE (
    product JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'title', p.title,
        'description', p.description,
        'price_cents', p.price_cents,
        'inventory_count', p.inventory_count,
        'category', jsonb_build_object(
            'id', c.id,
            'slug', c.slug,
            'name', c.name
        ),
        'primary_image', (
            SELECT jsonb_build_object('url', pi.url, 'alt_text', pi.alt_text)
            FROM public.product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = true
            LIMIT 1
        ),
        'images', (
            SELECT jsonb_agg(jsonb_build_object('url', pi.url, 'alt_text', pi.alt_text, 'sort_order', pi.sort_order))
            FROM public.product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.sort_order
        )
    )
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.slug = product_slug AND p.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.categories IS 'Product categories with hierarchical support';
COMMENT ON TABLE public.products IS 'Product catalog with multi-tenant support (store_id)';
COMMENT ON TABLE public.product_images IS 'Product images with primary/secondary distinction';
COMMENT ON FUNCTION get_category_tree IS 'Get hierarchical category tree with levels and paths';
COMMENT ON FUNCTION get_product_with_primary_image IS 'Get product details with primary image for product detail page';
