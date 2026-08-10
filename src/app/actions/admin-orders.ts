"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import type { OrderItem, OrderStatus } from "@/lib/supabase/types";

export async function setOrderPaid(orderId: string, paid: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ paid })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateOrderItems(
  orderId: string,
  items: OrderItem[],
  deliveryFee: number
) {
  await requireAdmin();
  const supabase = await createClient();

  const items_total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grand_total = items_total + deliveryFee;

  const { error } = await supabase
    .from("orders")
    .update({ items, items_total, grand_total })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteOrder(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
