# API Conventions

**Layer 3 Reference**: All agents must follow these patterns when building API routes.

---

## Route Structure

```
src/app/api/
├── auth/           # Alpha owns
│   ├── signup/route.ts
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── reset-password/route.ts
├── products/       # Beta owns
│   ├── route.ts           # GET list, POST create
│   └── [slug]/route.ts    # GET detail, PUT update, DELETE
├── categories/     # Beta owns
│   ├── route.ts
│   └── [slug]/route.ts
├── cart/           # Beta owns (sprint 1.2)
├── orders/         # Beta owns (sprint 1.2)
└── health/route.ts # Gamma owns (monitoring)
```

---

## Response Format

### Success (200 OK)
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 24,
    "total": 10000
  }
}
```

### Success List (200 OK)
```json
{
  "data": [{ ... }, { ... }],
  "meta": {
    "page": 1,
    "per_page": 24,
    "total": 10000,
    "total_pages": 417
  }
}
```

### Error (4xx/5xx)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found"
  }
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Auth required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## RLS Patterns

### Public Read, Admin Write
```sql
-- Everyone can read
CREATE POLICY "Products are viewable by everyone" ON products
FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "Products are editable by admins" ON products
FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
```

### User-Owned Data
```sql
-- Users can only access their own data
CREATE POLICY "Users can access own orders" ON orders
FOR ALL USING (user_id = auth.uid());
```

---

## Query Patterns

### Pagination
```typescript
const page = Number(searchParams.get('page')) || 1;
const perPage = 24;
const from = (page - 1) * perPage;
const to = from + perPage - 1;

const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### Filtering
```typescript
// Category filter
if (categorySlug) {
  query = query.eq('category.slug', categorySlug);
}

// Price range
if (minPrice) {
  query = query.gte('price', minPrice);
}
if (maxPrice) {
  query = query.lte('price', maxPrice);
}

// Search (full-text)
if (searchQuery) {
  query = query.ilike('title', `%${searchQuery}%`);
}
```

---

## Performance Requirements

- API response time < 200ms for simple queries
- API response time < 500ms for complex queries (with filters)
- Use Supabase indexes for frequently filtered columns
- Implement cursor-based pagination for > 10k items

---

## Testing Requirements

Every API route must have:
1. Unit test (Vitest) for business logic
2. Integration test for Supabase query
3. E2E test (Playwright) for critical paths
