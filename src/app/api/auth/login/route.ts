// Alpha Agent - Task A5: Login API Route
// Sprint 1.1 | Authentication endpoint

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    // Sign in with email/password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Handle invalid credentials
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: authError.message } },
        { status: 400 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Login failed' } },
        { status: 500 }
      );
    }

    // Fetch user role from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return NextResponse.json(
      {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: userProfile?.role || 'customer',
          },
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
          },
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
