// Alpha Agent - Task A5: Password Reset API Route
// Sprint 1.1 | Password reset request endpoint

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    const result = resetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }

    const { email } = result.data;
    const supabase = await createClient();

    // Request password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=recovery`,
    });

    if (error) {
      // Don't reveal if email exists (security)
      console.error('Password reset error:', error);
    }

    // Always return success (prevent email enumeration)
    return NextResponse.json(
      { data: { message: 'If an account exists, a reset email has been sent' } },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
