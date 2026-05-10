# Database Context

## Live Schema (NOT the migrations)

The migration files in `supabase/migrations/` define a different schema than what's running. The seed script created the real tables. The live DB is truth.

### products
- `id` (uuid PK), `name_en`, `name_az`, `name_ru`, `category_id` (uuid FK)
- `price` (numeric, AZN — NOT `price_cents` integer), `original_price` (numeric)
- `discount_percent` (integer), `rating` (numeric), `review_count` (integer)
- `image_url` (text — on products table directly, not separate), `image_gallery` (jsonb[])
- `is_featured`, `is_top_rated`, `is_on_sale`, `is_deal_of_day` (booleans — no `status` enum)
- `stock_available`, `stock_sold` (integers)
- `description_en`, `description_az`, `description_ru` (text)
- `store_id` (uuid, nullable — multi-tenant), `slug` (text)
- 2,021 products seeded

### categories
- `id`, `name_en/az/ru`, `slug`, `icon`, `parent_id` (self-ref), `sort_order`
- 20 categories, all `parent_id = null` (flat, no hierarchy used yet)

### cart_items
- `id`, `session_id` (text), `product_id` (uuid), `quantity`, `added_at`, `updated_at`
- RLS: anon key cannot INSERT. Need admin client or RLS policy fix.

### checkout_sessions, orders, order_items
- Empty. Schema from API code inference, not verified against live DB.

### users
- `id` (uuid FK to auth.users), `email`, `role` (customer/admin/editor/viewer), `created_at`, `updated_at`
- 1 admin user: `admin@whitelabel.dev`

## Supabase Clients

- **Anon client** (`@/lib/supabase/server.ts`): Uses `sb_publishable_` key. Public reads only. Cannot bypass RLS.
- **Admin client** (needs creation): Uses `sb_secret_` key. Bypasses RLS. Required for cart/checkout/order writes.
- **Browser client** (`@/lib/supabase/client.ts`): Uses anon key. For client-side auth and reads.

## RLS Patterns

- `public_read_admin_write`: Everyone selects, only admins modify. Used on products, categories.
- `user_owned`: `user_id = auth.uid()`. Used on users table.
- Cart items: Currently no policy allows anon inserts. This is the cart bug.
