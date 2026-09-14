"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function addOpenBatchDate(date: string) {
  await requireAdmin();
  if (!date) return { ok: false, error: "Please pick a date." };

  const supabase = await createClient();
  const { error } = await supabase.from("open_batch_dates").insert({ date });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function removeOpenBatchDate(date: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("open_batch_dates")
    .delete()
    .eq("date", date);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
