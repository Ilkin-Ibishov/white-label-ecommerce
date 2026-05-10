// One-time admin setup - creates admin user via signup API
// DELETE THIS FILE AFTER FIRST USE
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456';
const SETUP_SECRET = 'setup-2026'; // Simple secret to prevent abuse

export async function POST(request: Request) {
  try {
    // Check secret
    const { secret } = await request.json().catch(() => ({}));
    if (secret !== SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    // Call the signup API internally
    const signupResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: 'admin'
        })
      }
    );

    const result = await signupResponse.json();

    if (!signupResponse.ok) {
      // If user exists, maybe just return success
      if (result.error?.message?.includes('already')) {
        return NextResponse.json({
          message: 'Admin user already exists',
          email: ADMIN_EMAIL,
          note: 'Try logging in'
        });
      }
      return NextResponse.json(
        { error: result.error?.message || 'Signup failed' },
        { status: signupResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      warning: 'DELETE THIS API FILE AFTER USE'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}
