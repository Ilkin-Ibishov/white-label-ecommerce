// Middleware: Session refresh, route protection, role caching
// Caches user role in a cookie to avoid DB query per request.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ROLE_COOKIE = 'x-user-role';
const ROLE_COOKIE_MAX_AGE = 60 * 5; // 5 minutes

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: { path?: string; domain?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Auth error in middleware:', error.message);
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.set({ name: ROLE_COOKIE, value: '', maxAge: 0 });
  }

  // Get user role: cookie first, DB fallback
  let userRole: string | null = null;

  if (session?.user) {
    const cachedRole = request.cookies.get(ROLE_COOKIE)?.value;
    if (cachedRole && ['customer', 'admin', 'editor', 'viewer'].includes(cachedRole)) {
      userRole = cachedRole;
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      userRole = userData?.role || null;
      // Cache role in cookie
      if (userRole) {
        response.cookies.set({
          name: ROLE_COOKIE,
          value: userRole,
          maxAge: ROLE_COOKIE_MAX_AGE,
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
        });
      }
    }
  } else {
    // No session — clear role cookie
    response.cookies.set({ name: ROLE_COOKIE, value: '', maxAge: 0 });
  }

  // Route protection
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!session || userRole !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      );
    }
  }

  if (pathname.startsWith('/api/user/')) {
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
  }

  // Redirect authenticated admins away from login
  if (pathname === '/admin/login' && session && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth/).*)',
  ],
};
