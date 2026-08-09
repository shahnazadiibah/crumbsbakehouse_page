import type { Config } from "@netlify/functions";

// Pings Supabase on a schedule so its compute doesn't cold-start on the
// next real request. Uses the public anon key against an RLS-protected
// table that anon can already read (menu_items), so this needs no
// service-role secret.
export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("keep-warm: missing Supabase env vars");
    return;
  }

  const res = await fetch(`${url}/rest/v1/menu_items?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  console.log(`keep-warm: Supabase ping status ${res.status}`);
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
