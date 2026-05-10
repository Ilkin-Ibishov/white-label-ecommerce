# Admin UI Context

## Architecture
- Route prefix: `src/app/admin/` (NOT `(admin)` — Gamma renamed it in Sprint 1.3)
- Layout: `src/app/admin/layout.tsx` with `AdminShell.tsx`, `AdminHeader.tsx`, `Sidebar.tsx`
- Sidebar: Dashboard, Products, Categories, Orders, Analytics with active highlighting
- `/admin/login` excluded from admin chrome (hidden sidebar/header)

## Key Pages
- Dashboard: `src/app/admin/dashboard/page.tsx` — 4 stat cards, recent orders, quick actions
- Products: `src/app/admin/products/page.tsx` — sortable table, search, filters, bulk delete
- Product form: `src/app/admin/products/new/page.tsx` + `[id]/edit/page.tsx` + `ProductForm.tsx`
- Categories: `src/app/admin/categories/page.tsx` + `CategoryTree.tsx`
- Orders: `src/app/admin/orders/page.tsx` + `[id]/page.tsx`
- Analytics: `src/app/admin/analytics/page.tsx` + `AnalyticsCharts.tsx`

## Admin Data Layer
- `src/lib/admin/api.ts` — fetch functions for admin APIs
- `src/lib/admin/queries.ts` — TanStack Query hooks
- `src/lib/admin/types.ts` — TypeScript interfaces

## UI Conventions
- shadcn/ui only (Button, Card, Table, Dialog, Form, Input, Select, Tabs, Badge, Toast, Switch, Skeleton)
- Recharts for analytics charts (line chart: revenue, bar chart: orders)
- react-hook-form + zod for product/category forms
- Image upload: currently accepts hosted URLs only (POST `/api/admin/upload` not implemented yet)

## Known Gaps
- `/api/admin/products/[id]` detail endpoint not exposed — edit page hydrates from list
- Top products on analytics mirrors low-stock feed as placeholder
- Image upload endpoint not implemented by Alpha yet
