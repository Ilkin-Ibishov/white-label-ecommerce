// Alpha Agent - Task A5: Signup API Route
// Sprint 1.1 | Customer registration endpoint

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'admin', 'editor', 'viewer']).default('customer'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }

    const { email, password, role } = result.data;
    const supabase = await createClient();

    // Create user with metadata for role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (authError) {
      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: authError.message } },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
        { status: 500 }
      );
    }

    // User profile is auto-created via trigger, but we can verify
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Non-blocking - trigger should have created it
    }

    return NextResponse.json(
      {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: userProfile?.role || role,
          },
          session: authData.session,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
