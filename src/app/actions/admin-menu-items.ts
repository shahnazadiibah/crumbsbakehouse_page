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
  revalidatePath("/admin/menu");
  revalidatePath("/order");
  revalidatePath("/pricelist");
  return { ok: true };
}

export async function updateMenuItemDiscount(
  id: string,
  discountPercent: number
) {
  await requireAdmin();
  const supabase = await createClient();

  const clamped = Math.min(100, Math.max(0, discountPercent));

  const { error } = await supabase
    .from("menu_items")
    .update({ discount_percent: clamped })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/menu");
  revalidatePath("/order");
  revalidatePath("/pricelist");
  return { ok: true };
}

export async function updateMenuItemDetails(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    sizeLabel: string;
    allergens: string;
    imageUrl: string;
  }>
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_items")
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && {
        description: updates.description.trim() || null,
      }),
      ...(updates.sizeLabel !== undefined && {
        size_label: updates.sizeLabel.trim() || null,
      }),
      ...(updates.allergens !== undefined && {
        allergens: updates.allergens.trim() || null,
      }),
      ...(updates.imageUrl !== undefined && {
        image_url: updates.imageUrl.trim() || null,
      }),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/menu");
  revalidatePath("/order");
  revalidatePath("/pricelist");
  return { ok: true };
}
