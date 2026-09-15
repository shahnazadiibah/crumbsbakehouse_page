"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function updateAdminNotes(content: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("admin_notes")
    .upsert({ id: "main", content, updated_at: new Date().toISOString() });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
