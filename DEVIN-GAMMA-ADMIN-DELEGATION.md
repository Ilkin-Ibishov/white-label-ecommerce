# Devin Delegation: Gamma Sprint 1.3 - Admin Dashboard UI

**Project:** White-Label E-Commerce Platform  
**Branch:** `gamma/sprint-1-3-admin` (create from `main`)  
**Deadline:** 8 hours from start  
**Production URL:** https://white-label-ecommerce-git-main-ilkin-ibishovs-projects.vercel.app  

---

## 🎯 Mission

Implement the **Admin Dashboard UI** for Sprint 1.3. This is the control panel where store administrators manage products, view orders, and see business analytics.

**Key Deliverable:** A fully functional admin dashboard with product management, order management, and analytics visualization.

---

## 📋 Your Tasks (G12-G19)

### G12: Admin Layout with Navigation
**Files:** `src/app/(admin)/layout.tsx`, `src/components/admin/Sidebar.tsx`

Create the main admin shell:
- Sidebar navigation with: Dashboard, Products, Orders, Categories
- Header with user info and logout button
- Collapsible sidebar for mobile (hamburger menu)
- Active menu item highlighting
- Use existing auth context from Sprint 1.1

### G13: Dashboard Overview Page
**File:** `src/app/(admin)/dashboard/page.tsx`

The landing page after admin login:
- 4 stat cards at top:
  - Total Sales (today)
  - Orders Today
  - Pending Orders
  - Low Stock Items
- Recent Orders table (last 5 orders)
- Quick action buttons: "Add Product", "View All Orders"
- Responsive grid layout

### G14: Product List Page
**File:** `src/app/(admin)/products/page.tsx`

Main product management interface:
- Data table with columns:
  - Product image (thumbnail)
  - Name
  - Price
  - Stock Available
  - Category
  - Status (featured/on sale indicators)
  - Actions (Edit, Delete buttons)
- Pagination controls
- Search input (filters by product name)
- Filter dropdowns: Category, Stock Status
- "Add New Product" button (top right)
- Bulk delete checkbox option

### G15: Product Create/Edit Form
**Files:** 
- `src/app/(admin)/products/new/page.tsx` (create)
- `src/app/(admin)/products/[id]/edit/page.tsx` (edit)

Form fields needed:
- **Name fields:** Name EN, Name AZ, Name RU (3 separate inputs)
- **Description:** Textarea for each language
- **Price:** Numeric input (in dollars, API converts)
- **Original Price:** For showing discounts
- **Stock:** Numeric input
- **Category:** Dropdown (fetch from `/api/categories`)
- **Images:** Image upload with preview (multiple allowed)
- **Toggles:** Is Featured, Is On Sale
- **Submit button:** Creates/updates via API
- **Validation:** Show inline errors

### G16: Category Management Page
**File:** `src/app/(admin)/categories/page.tsx`

Simple CRUD for categories:
- Tree/list view of all categories
- Show: Name, Slug, Parent Category
- "Add Category" button → Modal with form
- Edit button → Modal
- Delete button → Confirmation dialog
- Handle parent-child relationships in dropdown

### G17: Orders List Page
**File:** `src/app/(admin)/orders/page.tsx`

Order management interface:
- Data table columns:
  - Order Number
  - Date
  - Customer Email
  - Total Amount
  - Status (with color-coded badge)
  - Actions (View Details)
- Filters:
  - Status dropdown (All, Pending, Confirmed, etc.)
  - Date range picker
- Search by order number or email
- Pagination
- Sort by date

### G18: Order Detail Page
**File:** `src/app/(admin)/orders/[id]/page.tsx`

Full order view:
- Order header: Number, Date, Status dropdown (to update status)
- Customer section: Name, Email, Phone
- Shipping Address: Full formatted address
- Order Items: Table with image, product name, price, quantity, subtotal
- Payment Info: Method (Pay on Delivery), Total
- Print Order button (basic print styles)

### G19: Sales Analytics Charts
**File:** `src/components/admin/AnalyticsCharts.tsx`

Visual charts for dashboard:
- Revenue line chart (last 7/30/90 days)
- Orders count bar chart
- Top 5 products list
- Date range selector (Today, Week, Month, Custom)
- Use `recharts` library (install if needed)

---

## 🔌 API Endpoints (Available)

Alpha and Beta will build these concurrently. Use mock data initially, then integrate:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/products` | GET | List products with pagination |
| `/api/admin/products` | POST | Create new product |
| `/api/admin/products/[id]` | PUT | Update product |
| `/api/admin/products/[id]` | DELETE | Delete product |
| `/api/admin/categories` | GET/POST/PUT/DELETE | Category CRUD |
| `/api/admin/upload` | POST | Image upload |
| `/api/admin/orders` | GET | List all orders |
| `/api/admin/orders/[id]` | GET | Order details |
| `/api/admin/orders/[id]/status` | PUT | Update status |
| `/api/admin/analytics` | GET | Dashboard stats |
| `/api/admin/analytics/sales` | GET | Chart data |
| `/api/admin/alerts/low-stock` | GET | Low stock products |

**Use TanStack Query** for all data fetching (already set up in `src/lib/cart/queries.ts` as reference).

---

## 🎨 UI Guidelines

### Design System
- Use **shadcn/ui** components exclusively
- Components available: Button, Card, Table, Dialog, Form, Input, Select, Tabs, Badge, Toast
- **Color scheme:** Dark admin theme (already in place from Sprint 1.1 login)
- **Layout:** Sidebar (240px) + Main content area

### Responsive Breakpoints
- Desktop: Full sidebar visible
- Tablet (< 1024px): Collapsible sidebar
- Mobile (< 768px): Hidden sidebar, hamburger menu

### Key Components to Build
```
src/components/admin/
├── Sidebar.tsx           # Navigation sidebar
├── StatCard.tsx          # Dashboard stat cards
├── DataTable.tsx         # Reusable sortable table
├── ProductForm.tsx       # Create/edit product form
├── CategoryTree.tsx      # Category hierarchy display
├── OrderStatusBadge.tsx  # Color-coded status
├── AnalyticsCharts.tsx   # Recharts wrappers
└── ImageUploader.tsx     # Multi-image upload with preview
```

---

## 🔐 Authentication

Admin routes are protected by middleware. The session is available via:
```typescript
import { createClient } from '@/lib/supabase/server';
// Use this to get current user in server components
```

All admin API calls automatically check for admin role.

---

## 📝 Session Management Notes

- Session ID stored in localStorage: `cart_session` (for cart)
- Admin session handled by Supabase Auth
- No need to manage tokens manually

---

## 🧪 Testing Checklist

Before submitting PR, verify:
- [ ] All navigation links work
- [ ] Dashboard stats load
- [ ] Can create a new product
- [ ] Can edit an existing product
- [ ] Can delete a product
- [ ] Can manage categories
- [ ] Orders list loads with filters
- [ ] Can view order details
- [ ] Can update order status
- [ ] Charts render with data
- [ ] Mobile responsive works
- [ ] No console errors

---

## 📁 Context Files

- **Task details:** `stages/gamma/03-admin-ui/context.json`
- **Sprint status:** `sprint/current.json`
- **Audit report:** `AUDIT-REPORT-SPRINT-1-1-1-2.md`

---

## 🚀 Submission

1. Create branch: `gamma/sprint-1-3-admin` from `main`
2. Implement all G12-G19 tasks
3. Test all functionality
4. Create PR to `main`
5. Update handoff: `handoffs/gamma-2026-05-10-sprint-1-3.json`

**Questions?** Reference the context files or check the existing codebase patterns from Sprint 1.2.

---

**Ready to start?** Check out the existing admin login page at `src/app/(admin)/login/page.tsx` for the auth flow, and `src/app/(admin)/dashboard/page.tsx` for the current (basic) dashboard structure.
