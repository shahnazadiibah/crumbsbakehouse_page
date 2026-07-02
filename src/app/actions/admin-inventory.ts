"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export interface IngredientInput {
  name: string;
  unit: string;
  costPerUnit: number;
  stock: number;
  reorderThreshold: number;
}

export async function addIngredient(input: IngredientInput) {
  await requireAdmin();
  if (!input.name.trim() || !input.unit.trim()) {
    return { ok: false, error: "Name and unit are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").insert({
    name: input.name.trim(),
    unit: input.unit.trim(),
    cost_per_unit: input.costPerUnit,
    stock: input.stock,
    reorder_threshold: input.reorderThreshold,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function updateIngredient(id: string, input: IngredientInput) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ingredients")
    .update({
      name: input.name.trim(),
      unit: input.unit.trim(),
      cost_per_unit: input.costPerUnit,
      stock: input.stock,
      reorder_threshold: input.reorderThreshold,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function deleteIngredient(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("ingredients").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function saveRecipe(
  menuItemId: string,
  lines: { ingredientId: string; qtyPerUnit: number }[]
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) return { ok: false, error: deleteError.message };

  const rows = lines
    .filter((l) => l.qtyPerUnit > 0)
    .map((l) => ({
      menu_item_id: menuItemId,
      ingredient_id: l.ingredientId,
      qty_per_unit: l.qtyPerUnit,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("recipes").insert(rows);
    if (insertError) return { ok: false, error: insertError.message };
  }

  revalidatePath("/admin/inventory");
  return { ok: true };
}
