"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function closeBatch(
  batchDate: string,
  otherCosts: number,
  otherCostsNote: string
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("close_batch", {
    p_batch_date: batchDate,
    p_other_costs: otherCosts,
    p_other_costs_note: otherCostsNote.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/batches");
  return { ok: true, batch: data };
}
