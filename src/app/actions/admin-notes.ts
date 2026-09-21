"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function updateAdminNotes(
  noteId: string,
  content: string,
  path: string
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("admin_notes")
    .upsert({ id: noteId, content, updated_at: new Date().toISOString() });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(path);
  return { ok: true };
}
