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

export async function updateOrderItems(orderId: string, items: OrderItem[]) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("delivery_fee")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { ok: false, error: fetchError?.message ?? "Order not found" };
  }

  const items_total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grand_total = items_total + order.delivery_fee;

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
