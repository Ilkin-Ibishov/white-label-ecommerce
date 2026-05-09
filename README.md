# White-Label E-Commerce

A modern, mobile-first white-label e-commerce platform built with **Next.js 16**, **Supabase**, and **shadcn/ui**.

## 🚀 Hour 1 Scaffold - COMPLETE

**Status**: Build successful, ready for deployment  
**Location**: `C:\Programming\white-label-ecommerce\my-app`  
**Commit**: `f917da8`

### What's Included

- ✅ Next.js 16.2.6 with App Router
- ✅ TypeScript + Tailwind CSS + shadcn/ui
- ✅ Supabase SSR client setup (`@supabase/ssr`)
- ✅ TanStack Query ready (installed)
- ✅ Admin login page (`/admin/login`)
- ✅ Admin dashboard shell (`/admin/dashboard`)
- ✅ API health check (`/api/health`)
- ✅ Database connection test (`/api/db-check`)
- ✅ Store config (`config/store.config.ts`)
- ✅ Sprint tracking (`sprint/current.json`)

## 📋 Remaining Setup (5 minutes)

### 1. Create GitHub Repository

```bash
# In the project directory
git remote add origin https://github.com/YOUR_USERNAME/white-label-ecommerce.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

**Option A: Vercel CLI (requires login)**
```bash
npx vercel login
npx vercel --prod
```

**Option B: GitHub Integration (recommended)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: Next.js
4. Deploy

### 3. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Copy URL and anon key to Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Create database branches:
   ```bash
   supabase branches create alpha-db
   supabase branches create beta-db
   supabase branches create gamma-db
   ```

## 🏗️ Architecture

### Agent Model (Modified Option B)

**Execution Agents (3)**:
- **Alpha**: Auth + Accounts + Admin
- **Beta**: Products + Cart + Checkout + Orders
- **Gamma**: QA + DevOps + Deployment

**Gatekeeper Agents (3)**:
- **SEC**: Reviews auth/RLS/API PRs
- **ARCH**: Reviews schema/migrations
- **UX**: Reviews components/design

### Stack Decisions

| Decision | Choice |
|----------|--------|
| State Management | TanStack Query only (no Zustand) |
| Images | Supabase Storage + transforms |
| Pay-on-delivery | Simple (address + phone, no fraud detection) |
| White-label | `config/store.config.ts` + CSS variables |
| Coordination | Git-native (`sprint/current.json`) |
| Database | Supabase branching per agent |
| Deployment | Every PR = production deploy |

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin routes
│   │   ├── (storefront)/      # Customer routes (coming)
│   │   ├── api/               # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   └── ui/                # shadcn components
│   └── lib/
│       ├── supabase/          # Supabase clients
│       └── utils.ts
├── config/
│   └── store.config.ts        # White-label config
├── sprint/
│   └── current.json           # Sprint coordination
├── handoffs/                  # Agent handoff docs
└── tests/                     # Test suites (coming)
```

## 🎯 Next Steps (Week 1)

### Agent Alpha (Auth)
- Supabase Auth setup
- Users table + RLS policies
- Auth middleware

### Agent Beta (Products)
- Products/categories schema
- 10k synthetic data (Faker.js)
- Basic API routes

### Agent Gamma (CI/CD)
- GitHub Actions setup
- Branch protection
- Vercel auto-deploy

## 📝 Sprint Coordination

Current sprint status is in `sprint/current.json`:

```json
{
  "sprint": "1.1",
  "phase": "Foundation",
  "focus_agents": {
    "alpha": { "status": "active", "task": "Auth system" },
    "beta": { "status": "active", "task": "Product schema" },
    "gamma": { "status": "completed", "task": "Scaffold" }
  }
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:e2e
```

## 📄 License

Private - For white-label e-commerce platform development.
