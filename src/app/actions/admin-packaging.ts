"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export interface PackagingInput {
  name: string;
  unit: string;
  costPerUnit: number;
  stock: number;
}

export async function addPackagingItem(input: PackagingInput) {
  await requireAdmin();
  if (!input.name.trim()) {
    return { ok: false, error: "Name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("packaging_items").insert({
    name: input.name.trim(),
    unit: input.unit.trim(),
    cost_per_unit: input.costPerUnit,
    stock: input.stock,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function updatePackagingStock(id: string, stock: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("packaging_items")
    .update({ stock })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function deletePackagingItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("packaging_items")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}
