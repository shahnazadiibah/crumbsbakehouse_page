import "server-only";
import { createClient } from "@/lib/supabase/server";

// proxy.ts already blocks unauthenticated visits to /admin/* pages (and
// that check does hit Supabase's Auth server), but Server Actions are
// invoked via their own request and shouldn't rely solely on that —
// every privileged admin action re-checks here before touching the
// database. Uses getSession() (reads the JWT from cookies, no network
// call) rather than getUser() (which re-verifies against Supabase's Auth
// server every time) — chosen for speed on actions clicked frequently
// (marking orders paid, editing quantities, etc.). Trade-off: a
// revoked/logged-out-elsewhere session keeps working here until the JWT
// itself expires (~1hr), instead of failing on the next click.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  return session.user;
}
