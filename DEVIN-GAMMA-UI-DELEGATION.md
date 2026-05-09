# Devin Delegation: Gamma Agent - Sprint 1.2 UI

## Task Overview
Implement frontend UI for Core Commerce: product pages, cart, checkout.

## Context Files (READ IN ORDER)
1. `CLAUDE.json` - Project manifest
2. `sprint/current.json` - Sprint 1.2 status
3. `stages/gamma/02-ui/context.json` - Your specific tasks (G6-G11)

## Available APIs (Ready to Use)
- `GET /api/products` - List products with pagination
- `GET /api/products/[slug]` - Product detail
- `GET /api/categories` - Category tree
- `GET /api/cart?session_id=xxx` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart` - Update quantity
- `DELETE /api/cart` - Remove item
- `POST /api/checkout` - Checkout flow (init, shipping, confirm)
- `GET /api/orders?email=xxx` - Order history

## Session Management
Use `localStorage` for session_id:
```typescript
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session', sessionId);
  }
  return sessionId;
};
```

## Your Tasks (G6-G11)

### G6: Product Detail Page
- File: `src/app/(shop)/products/[slug]/page.tsx`
- Show: Product images (from product_images table), name, price, description
- Include: "Add to Cart" button with quantity selector
- Use: `/api/products/[slug]` endpoint

### G7: Category Browse Page
- File: `src/app/(shop)/category/[slug]/page.tsx`
- Show: Product grid, filters, pagination
- Use: `/api/products?category=xxx` endpoint

### G8: Cart Page
- File: `src/app/(shop)/cart/page.tsx`
- Show: Cart items with quantity controls, remove button, total
- Include: "Proceed to Checkout" button
- Use: `/api/cart?session_id=xxx` endpoint

### G9: Checkout Page
- File: `src/app/(shop)/checkout/page.tsx`
- Show: Shipping form (name, address, city, phone), payment method (pay on delivery), order summary
- Use: `/api/checkout` endpoint with actions: init, shipping, confirm

### G10: Order Success Page
- File: `src/app/(shop)/order/success/page.tsx`
- Show: Order confirmation, order number, next steps

### G11: Header Cart Component
- File: `src/components/cart/HeaderCart.tsx`
- Show: Cart icon with item count badge, mini cart preview dropdown
- Include in: `src/app/layout.tsx` or admin layout

## Design Guidelines
- Use existing shadcn components (Button, Card, Input, Label)
- Tailwind CSS for styling
- Mobile responsive
- Dark mode support (already configured)

## Definition of Done
- [ ] Product detail page shows info/images
- [ ] Add to cart button works (updates cart count)
- [ ] Cart page shows items/total
- [ ] Checkout collects shipping/payment
- [ ] Order success shows confirmation
- [ ] Header shows cart count
- [ ] All pages mobile responsive
- [ ] Handoff doc: `handoffs/gamma-2026-05-10-sprint-1-2.json`

## Coordination Notes
- Alpha/Beta APIs are live and tested
- Use session_id from localStorage for all cart/checkout calls
- Pay on delivery is default payment method (card option for future)

## Working Branch
Create: `gamma/sprint-1-2-ui`
PR to: `main`

DELEGATED TO DEVIN: 2026-05-10
ESTIMATED TIME: 6-8 hours
