"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function updateMenuItemPrice(id: string, price: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_items")
    .update({ price })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/recipes");
  revalidatePath("/");
  return { ok: true };
}
