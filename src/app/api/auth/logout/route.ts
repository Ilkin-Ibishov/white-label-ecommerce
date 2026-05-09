// Alpha Agent - Task A5: Logout API Route
// Sprint 1.1 | Session termination endpoint

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Logged out successfully' } },
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
