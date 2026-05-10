// Gamma Sprint 1.3 - G12: Admin route group layout.
// - Wraps every admin page in QueryProvider (for TanStack Query) and the
//   AdminShell client component (sidebar + header + responsive drawer).
// - The login page renders inside this layout but the shell suppresses its
//   chrome so the unauthenticated form stays full-bleed.
// - User email is fetched server-side and passed down to the header.

import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/server';

// Admin pages depend on the authenticated session and on URL search params
// for filters/pagination, so they must always render dynamically.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    userEmail = null;
  }

  return (
    <QueryProvider>
      <AdminShell userEmail={userEmail}>{children}</AdminShell>
    </QueryProvider>
  );
}
