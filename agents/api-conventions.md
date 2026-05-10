# API Conventions

## Response Format

Success: `{ data: object, meta: { page, per_page, total } }`
Success list: `{ data: array, meta: { page, per_page, total, total_pages } }`
Error: `{ error: { code: string, message: string } }`

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| UNAUTHORIZED | 401 | auth_required |
| FORBIDDEN | 403 | insufficient_permissions |
| NOT_FOUND | 404 | resource_not_found |
| VALIDATION_ERROR | 422 | invalid_input |
| RATE_LIMITED | 429 | too_many_requests |
| INTERNAL_ERROR | 500 | server_error |

## Patterns

- Pagination: 24 per page, `from = (page - 1) * per_page`
- Input validation: Zod `safeParse` on every route. Return VALIDATION_ERROR with 422.
- Supabase client: `import { createClient } from '@/lib/supabase/server'` for reads. Use `createAdminClient()` for writes that bypass RLS.
- Route structure: One file per HTTP method in `route.ts`. Export `GET`, `POST`, `PUT`, `DELETE` as named exports.
- Admin routes: All under `/api/admin/*`. Middleware checks admin role. Use admin Supabase client.

## Route Ownership

| Domain | Owner | Routes |
|--------|-------|--------|
| Auth | Alpha | `/api/auth/*` |
| Products | Beta | `/api/products`, `/api/categories` |
| Cart + Checkout | Alpha | `/api/cart`, `/api/checkout` |
| Orders | Beta | `/api/orders` |
| Admin Products | Alpha | `/api/admin/products`, `/api/admin/categories`, `/api/admin/upload` |
| Admin Analytics | Beta | `/api/admin/orders`, `/api/admin/analytics`, `/api/admin/alerts` |
