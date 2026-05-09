# Security Rules

**Layer 3 Reference**: Mandatory security requirements. SEC gatekeeper enforces these.

---

## Authentication

### Session Management
- Use Supabase Auth sessions (JWT)
- Sessions expire after 7 days of inactivity
- Refresh tokens rotated on every access
- Store session in httpOnly cookie

### Password Policy
- Minimum 8 characters
- No complexity requirements (NIST guidelines)
- Rate limit: 5 attempts per 15 minutes per IP

### Admin Access
- Admin role stored in `users.role` column
- All admin routes check role in middleware
- No client-side role checks (bypassable)

---

## Authorization (RLS)

### Pattern 1: Public Read + Admin Write
```sql
-- Everyone can read products
CREATE POLICY "Products viewable by all" ON products FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Products editable by admins" ON products
FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
```

### Pattern 2: User-Owned Data
```sql
-- Users can only access their own data
CREATE POLICY "Orders are user-owned" ON orders
FOR ALL USING (user_id = auth.uid());
```

### Pattern 3: Role Hierarchy
```sql
-- Admin > Editor > Viewer
CREATE POLICY "Editors and admins can modify" ON products
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('admin', 'editor')
  )
);

-- Viewers can only read
CREATE POLICY "Viewers can read" ON products
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('admin', 'editor', 'viewer')
  )
);
```

---

## Input Validation

### Zod Schemas (Required)
Every API route must validate input with Zod:

```typescript
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Validate
const result = signupSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message: result.error.format() } },
    { status: 422 }
  );
}
```

---

## Rate Limiting

### Checkout (Pay-on-Delivery)
- 5 orders per hour per IP
- Applies to guest checkout too
- Store rate limit in Redis or Supabase (with TTL)

### Auth Endpoints
- Login: 5 attempts per 15 minutes per IP
- Signup: 3 accounts per hour per IP
- Password reset: 3 requests per hour per email

---

## SQL Injection Prevention

### NEVER
```typescript
// ❌ NEVER concatenate user input into SQL
const query = `SELECT * FROM products WHERE name = '${userInput}'`;
```

### ALWAYS
```typescript
// ✅ Use Supabase query builder (parameterized)
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('name', userInput);
```

---

## XSS Prevention

### React/Next.js
- React escapes content by default
- Use `dangerouslySetInnerHTML` ONLY for rich text from Lexical
- Sanitize any HTML from external sources

### API Responses
- Never return HTML in API responses
- Return plain text or markdown
- Client renders markdown safely

---

## CSRF Protection

### SameSite Cookies
- All auth cookies: `SameSite=Lax`
- No CSRF tokens needed for API routes (CORS + SameSite sufficient)

### CORS
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};
```

---

## Secrets Management

### Environment Variables
- `NEXT_PUBLIC_*`: Safe for client (Supabase URL, anon key)
- Server-only: Service role key, database passwords
- Never commit `.env.local` to git
- Use Vercel environment variables for production

### Supabase Service Role Key
- ONLY use on server (API routes, server components)
- NEVER expose to client
- Store in `SUPABASE_SERVICE_ROLE_KEY` env var

---

## Security Checklist (SEC Gatekeeper)

Before approving any PR touching auth/RLS/API:

- [ ] RLS policies prevent unauthorized access
- [ ] Input validation with Zod on all API routes
- [ ] No secrets in code (check with `git diff`)
- [ ] Rate limiting configured for sensitive endpoints
- [ ] SQL injection impossible (query builder used)
- [ ] XSS vectors reviewed (no dangerous innerHTML)
- [ ] Chaos tests pass (auth bypass attempts fail)
