"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUpcomingBatchDates } from "@/lib/batchDates";
import {
  isMandatoryWholeCakeZone,
  isWholeCakeItem,
  requiresPickupTime,
} from "@/lib/menuRules";
import type { OrderItem } from "@/lib/supabase/types";

export interface SubmitOrderInput {
  customerName: string;
  contact: string;
  batchDate: string;
  zoneId: string | null;
  notes: string;
  greetingCard: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  pickupTime: string;
  items: { menuItemId: string; qty: number; topper?: string }[];
}

export interface SubmitOrderResult {
  ok: boolean;
  error?: string;
  order?: {
    id: string;
    itemsTotal: number;
    deliveryFee: number;
    grandTotal: number;
    items: OrderItem[];
  };
}

// All pricing is recomputed here from the database rather than trusted
// from the client, and the batch date is re-validated against the
// Friday-16:00 cutoff, so a tampered request can't under-pay or order
// against a closed batch.
export async function submitOrder(
  input: SubmitOrderInput
): Promise<SubmitOrderResult> {
  const customerName = input.customerName.trim();
  const contact = input.contact.trim();

  if (!customerName || !contact) {
    return { ok: false, error: "Please provide your name and WhatsApp number." };
  }

  const deliveryName = input.deliveryName.trim();
  const deliveryPhone = input.deliveryPhone.trim();
  const deliveryAddress = input.deliveryAddress.trim();

  if (!deliveryName || !deliveryPhone || !deliveryAddress) {
    return {
      ok: false,
      error: "Please fill in the delivery name, phone number, and address.",
    };
  }

  const selectedItems = input.items.filter((i) => i.qty > 0);
  if (selectedItems.length === 0) {
    return { ok: false, error: "Please select at least one item." };
  }

  const validBatchDates = getUpcomingBatchDates(12).map((b) => b.date);
  if (!validBatchDates.includes(input.batchDate)) {
    return {
      ok: false,
      error:
        "That batch date is no longer available (the Friday 16:00 cutoff may have passed). Please pick another date.",
    };
  }

  const supabase = createAdminClient();

  const menuItemIds = selectedItems.map((i) => i.menuItemId);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price, active")
    .in("id", menuItemIds);

  if (menuError || !menuItems) {
    return { ok: false, error: "Could not load menu. Please try again." };
  }

  const items: OrderItem[] = [];
  for (const sel of selectedItems) {
    const menuItem = menuItems.find((m) => m.id === sel.menuItemId);
    if (!menuItem || !menuItem.active) {
      return {
        ok: false,
        error: "One of the selected items is no longer available.",
      };
    }
    const topper = sel.topper?.trim();
    items.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: sel.qty,
      ...(topper && isWholeCakeItem(menuItem.name) ? { topper } : {}),
    });
  }

  const { data: allZones, error: zonesError } = await supabase
    .from("delivery_zones")
    .select("id, name, fee");

  if (zonesError || !allZones) {
    return { ok: false, error: "Could not load delivery options. Please try again." };
  }

  const selectedZone = allZones.find((z) => z.id === input.zoneId);

  const hasWholeCake = items.some((i) => isWholeCakeItem(i.name));
  if (hasWholeCake) {
    if (!selectedZone || !isMandatoryWholeCakeZone(selectedZone.name)) {
      return {
        ok: false,
        error:
          "Whole cake orders must use the Grab Instant Car delivery option. Please reselect it.",
      };
    }
  }

  const pickupTime = input.pickupTime.trim();
  if (selectedZone && requiresPickupTime(selectedZone.name) && !pickupTime) {
    return {
      ok: false,
      error: "Please provide a pick-up time estimation.",
    };
  }

  let deliveryFee = 0;
  if (input.zoneId) {
    if (!selectedZone) {
      return { ok: false, error: "Invalid delivery option selected." };
    }
    deliveryFee = selectedZone.fee;
  }

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const grandTotal = itemsTotal + deliveryFee;

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      contact,
      batch_date: input.batchDate,
      items,
      zone_id: input.zoneId,
      delivery_fee: deliveryFee,
      items_total: itemsTotal,
      grand_total: grandTotal,
      notes: input.notes.trim() || null,
      greeting_card: input.greetingCard.trim() || null,
      delivery_name: deliveryName,
      delivery_phone: deliveryPhone,
      delivery_address: deliveryAddress,
      pickup_time: pickupTime || null,
    })
    .select("id")
    .single();

  if (insertError || !order) {
    return { ok: false, error: "Could not submit order. Please try again." };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      itemsTotal,
      deliveryFee,
      grandTotal,
      items,
    },
  };
}
