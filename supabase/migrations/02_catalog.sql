-- Migration: 02 - Categories and Products
-- Matches the LIVE database schema.
-- Products use name_en/name_az/name_ru (i18n), price as numeric AZN (not cents),
-- and boolean flags (is_featured, is_on_sale, etc.) instead of status enum.

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_az TEXT,
    name_ru TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_az TEXT,
    name_ru TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10,2) CHECK (original_price >= 0),
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    image_url TEXT,
    image_gallery JSONB[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_top_rated BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    is_deal_of_day BOOLEAN DEFAULT false,
    stock_available INTEGER NOT NULL DEFAULT 0 CHECK (stock_available >= 0),
    stock_sold INTEGER DEFAULT 0 CHECK (stock_sold >= 0),
    description_en TEXT,
    description_az TEXT,
    description_ru TEXT,
    store_id UUID DEFAULT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(is_on_sale) WHERE is_on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_deal ON public.products(is_deal_of_day) WHERE is_deal_of_day = true;
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);

-- Product images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON public.product_images(product_id, sort_order);
