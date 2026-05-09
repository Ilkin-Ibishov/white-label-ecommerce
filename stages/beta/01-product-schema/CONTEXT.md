# Stage Contract: Product Catalog Schema

**Agent**: Beta  
**Sprint**: 1.1  
**Stage**: 01-product-schema  
**Goal**: Design products/categories schema, generate 10k synthetic data, create API routes

---

## Inputs

| Source | File/Location | Section | Why |
|--------|--------------|---------|-----|
| Store config | `config/store.config.ts` | Features | Inventory tracking enabled? |
| Alpha output | `stages/alpha/01-auth-scaffold/output/` | RLS patterns | Follow same patterns |
| Design system | `_config/design-tokens.md` | Image specs | Product image requirements |

---

## Process

1. **Database Schema Design**
   - `products`: id, slug, title, description, price (cents), inventory_count, images[], category_id, created_at, updated_at
   - `categories`: id, slug, name, parent_id (hierarchical), sort_order
   - `product_images`: id, product_id, url, alt_text, sort_order

2. **RLS Policies**
   - Products: public read, admin write
   - Categories: public read, admin write
   - Product images: public read, admin write

3. **Synthetic Data Generation** (10,000 products)
   - Use `@faker-js/faker`
   - 50 categories (hierarchical: Electronics > Phones > Smartphones)
   - 10,000 products with realistic data
   - Images: `https://picsum.photos/400/400?random={id}`

4. **API Routes**
   - `GET /api/products` — list with pagination, filters (category, price range, search)
   - `GET /api/products/[slug]` — product detail
   - `GET /api/categories` — category tree
   - `GET /api/categories/[slug]/products` — products by category

5. **Seed Script**
   - `scripts/seed/synthetic-data.ts`
   - Idempotent (can run multiple times)
   - Seeds `beta-db` branch

---

## Checkpoints

- [ ] Schema review with ARCH agent before migration
- [ ] Synthetic data inspected (spot-check 10 products)
- [ ] API response time < 200ms for product list

---

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Schema migrations | `supabase/migrations/beta/01_products.sql` | SQL |
| Seed script | `scripts/seed/synthetic-data.ts` | TypeScript |
| API routes | `src/app/api/products/` | TypeScript |
| Category routes | `src/app/api/categories/` | TypeScript |
| Seed data | `beta-db` branch | PostgreSQL |

---

## Definition of Done

- [ ] Schema approved by ARCH agent
- [ ] 10,000 products seeded in `beta-db`
- [ ] `/api/products` returns paginated list (24 per page)
- [ ] `/api/products/[slug]` returns single product
- [ ] `/api/categories` returns tree structure
- [ ] Query performance < 200ms with 10k products
- [ ] Handoff doc written: `handoffs/beta-2026-05-10.md`
