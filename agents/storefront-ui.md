# Storefront UI Context

## Architecture
- Route group: `src/app/(shop)/` with its own layout (separate from admin)
- Server components query Supabase directly via `@/lib/products/server.ts` — NOT self-fetching `/api/*`
- Client components use TanStack Query for cart/checkout state (`src/lib/cart/queries.ts`)
- QueryClientProvider mounted in `(shop)/layout.tsx`

## State Management
- **TanStack Query only.** No Zustand, no Redux, no Context for server state.
- Cart state: `useCart`, `useUpdateCartItem`, `useRemoveCartItem` hooks
- Cart events: `cart_changed` custom event triggers query invalidation

## Key Pages
- Homepage: `src/app/(shop)/page.tsx` — product grid
- Product detail: `src/app/(shop)/products/[slug]/page.tsx` + `ProductGallery.tsx` + `AddToCartForm.tsx`
- Category browse: `src/app/(shop)/category/[slug]/page.tsx` + `CategoryFilters.tsx`
- Cart: `src/app/(shop)/cart/page.tsx`
- Checkout: `src/app/(shop)/checkout/page.tsx` (two-step: init → shipping+confirm)
- Order success: `src/app/(shop)/order/success/page.tsx`

## UI Conventions
- shadcn/ui components + Tailwind CSS 4
- `next/image` set to `unoptimized` (seed data uses arbitrary remote URLs)
- Dark mode variants throughout
- Sonner toasts mounted in root layout via `@/components/providers/Toaster`
- Mobile-first responsive: sm/md/lg/xl breakpoints

## Cart Workaround
- `src/lib/cart/types.ts:normalizeCart` accepts both schema shapes (old Beta columns + live DB columns)
- Cart removal uses PUT with `quantity: 0` (DELETE route not implemented)
- Session ID stored in localStorage as `cart_session`
