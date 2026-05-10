import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client that bypasses RLS.
 * Uses the secret key — only call this from server-side API routes.
 * NEVER expose this client or the secret key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Admin operations require this env var."
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
