import "server-only";
import { createClient } from "@/lib/supabase/server";

// proxy.ts already blocks unauthenticated visits to /admin/* pages, but
// Server Actions are invoked via their own request and shouldn't rely
// solely on that — every privileged admin action re-checks the session
// here before touching the database.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user;
}
