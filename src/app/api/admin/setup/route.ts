// One-time admin setup - creates admin user with password
// DELETE THIS FILE AFTER FIRST USE
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456'; // Change after first login

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if admin already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        email: ADMIN_EMAIL,
        note: 'Use /login with these credentials'
      });
    }
    
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: { role: 'admin' }
      }
    });
    
    if (authError) throw authError;
    
    // Force admin role in profile
    if (authData.user) {
      await supabase.from('users').upsert({
        id: authData.user.id,
        email: ADMIN_EMAIL,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      warning: 'DELETE THIS API FILE AFTER USE'
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Also allow GET for easy browser access
export async function GET() {
  return POST();
}
