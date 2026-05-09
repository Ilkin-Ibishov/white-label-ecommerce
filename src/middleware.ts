// Alpha Agent - Task A4: Supabase SSR Middleware
// Sprint 1.1 | Handles session refresh and route protection

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create initial response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          // Set cookie on the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: { path?: string; domain?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          // Remove cookie by setting maxAge to 0
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle auth errors by clearing session
  if (error) {
    console.error('Auth error in middleware:', error.message);
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
  }

  // Get user role if authenticated
  let userRole: string | null = null;
  if (session?.user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    userRole = userData?.role || null;
  }

  // Route protection logic
  const pathname = request.nextUrl.pathname;

  // Admin routes require admin role
  if (pathname.startsWith('/(admin)') || pathname.startsWith('/admin')) {
    if (!session || userRole !== 'admin') {
      // Redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // API admin routes require admin role
  if (pathname.startsWith('/api/admin')) {
    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      );
    }
  }

  // Protected API routes require authentication
  if (pathname.startsWith('/api/user/')) {
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login' && session && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

// Configure matcher for middleware routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth/* (auth API routes)
     * - api/admin/setup (one-time setup route)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth/|api/admin/setup).*)',
  ],
};
