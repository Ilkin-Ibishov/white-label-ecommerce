// Alpha Agent - Task A5: Signup API Route
// Sprint 1.1 | Customer registration endpoint

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'admin', 'editor', 'viewer']).default('customer'),
});

// Shared signup logic
async function processSignup(data: { email: string; password: string; role: string }) {
  const supabase = await createClient();

  // Create user with metadata for role
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        role: data.role,
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
      { error: { code: 'USER_CREATION_FAILED', message: 'Failed to create user' } },
      { status: 500 }
    );
  }

  // Return success response
  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: data.role,
      },
    },
  }, { status: 201 });
}

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

    return processSignup(result.data);
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// GET handler for one-time admin setup via query params
// Usage: /api/auth/signup?email=admin@example.com&password=xxx&role=admin&setup=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const role = searchParams.get('role');
    const setup = searchParams.get('setup');
    
    // Only allow admin setup with flag
    if (setup !== 'true' || role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for regular signup' } },
        { status: 405 }
      );
    }
    
    const result = signupSchema.safeParse({ email, password, role });
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    return processSignup(result.data);
  } catch (error) {
    console.error('Signup GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
