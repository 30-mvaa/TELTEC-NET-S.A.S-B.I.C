import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente server-side. Usa service role solo en backends/scripts de confianza.
 * Nunca expongas SUPABASE_SERVICE_ROLE_KEY al navegador.
 */
export function getSupabaseServerClient(
  useServiceRole = false
): SupabaseClient {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    : process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

  if (!url || !key) {
    throw new Error(
      "Faltan variables SUPABASE_URL / keys. Revisa .env.local (ver SUPABASE.md)"
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
