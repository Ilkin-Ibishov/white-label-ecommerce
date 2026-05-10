// Create admin user locally
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://foiktbisxazqxztbammn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaWt0YmlzeGF6cXh6dGJhbW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjUyNjE4MCwiZXhwIjoyMDYyMTAyMTgwfQ.Zq5EW52QZwXMHvAG90pHKpPtpKBmUEIJNmCD2pvCEqg';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456';

async function createAdmin() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Check if exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const admin = existing.users.find(u => u.email === ADMIN_EMAIL);
  
  if (admin) {
    console.log('Admin already exists:', admin.id);
    
    // Update password
    const { error } = await supabase.auth.admin.updateUserById(
      admin.id,
      { password: ADMIN_PASSWORD }
    );
    if (error) {
      console.error('Password update failed:', error);
    } else {
      console.log('Password updated');
    }
    return;
  }

  // Create new admin
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) {
    console.error('Creation failed:', error);
    return;
  }

  console.log('Admin created:', data.user?.id);

  // Create profile
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: data.user!.id,
      email: ADMIN_EMAIL,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('Profile created');
  }
}

createAdmin();
