import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// For public, read-only queries (menu items, delivery zones) on pages
// that should be cacheable. Unlike the cookie-based server client, this
// doesn't call cookies(), so it doesn't force the page into dynamic
// rendering — letting `export const revalidate` actually take effect.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
