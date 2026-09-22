"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { getDiscountedPrice } from "@/lib/pricing";
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

export async function setOrderBatchDate(orderId: string, batchDate: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ batch_date: batchDate })
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

export async function updateOrderRecipient(
  orderId: string,
  recipient: {
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
  }
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      delivery_name: recipient.deliveryName.trim() || null,
      delivery_phone: recipient.deliveryPhone.trim() || null,
      delivery_address: recipient.deliveryAddress.trim() || null,
    })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateOrderNotes(orderId: string, notes: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ notes: notes.trim() || null })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

// Minimal order creation for orders taken outside the customer form (e.g.
// by phone/WhatsApp) — no delivery zone, admin fills that in later via
// "Edit items" if needed. Prices are re-read from menu_items rather than
// trusted from the client, same as the customer-facing submitOrder action.
export async function createAdminOrder(input: {
  customerName: string;
  contact: string;
  batchDate: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  items: { menuItemId: string; qty: number }[];
}) {
  await requireAdmin();
  const supabase = await createClient();

  const customerName = input.customerName.trim();
  const contact = input.contact.trim();
  if (!customerName || !contact) {
    return { ok: false, error: "Please provide a customer name and contact." };
  }

  const selectedItems = input.items.filter((i) => i.qty > 0);
  if (selectedItems.length === 0) {
    return { ok: false, error: "Please select at least one item." };
  }

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price, discount_percent")
    .in(
      "id",
      selectedItems.map((i) => i.menuItemId)
    );

  if (menuError || !menuItems) {
    return { ok: false, error: "Could not load menu. Please try again." };
  }

  const items: OrderItem[] = [];
  for (const sel of selectedItems) {
    const menuItem = menuItems.find((m) => m.id === sel.menuItemId);
    if (!menuItem) {
      return { ok: false, error: "One of the selected items is invalid." };
    }
    items.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: getDiscountedPrice(menuItem.price, menuItem.discount_percent),
      qty: sel.qty,
    });
  }

  const items_total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const { error: insertError } = await supabase.from("orders").insert({
    customer_name: customerName,
    contact,
    batch_date: input.batchDate,
    items,
    delivery_fee: 0,
    items_total,
    grand_total: items_total,
    delivery_name: input.deliveryName.trim() || null,
    delivery_phone: input.deliveryPhone.trim() || null,
    delivery_address: input.deliveryAddress.trim() || null,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
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
