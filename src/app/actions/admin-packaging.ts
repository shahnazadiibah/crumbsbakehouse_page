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

export async function savePackagingRecipe(
  menuItemId: string,
  lines: { packagingItemId: string; qtyPerUnit: number }[]
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("packaging_recipes")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) return { ok: false, error: deleteError.message };

  const rows = lines
    .filter((l) => l.qtyPerUnit > 0)
    .map((l) => ({
      menu_item_id: menuItemId,
      packaging_item_id: l.packagingItemId,
      qty_per_unit: l.qtyPerUnit,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("packaging_recipes")
      .insert(rows);
    if (insertError) return { ok: false, error: insertError.message };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/recipes");
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
