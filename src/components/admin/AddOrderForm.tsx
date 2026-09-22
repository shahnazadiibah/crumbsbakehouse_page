"use client";

import { useState, useTransition } from "react";
import { createAdminOrder } from "@/app/actions/admin-orders";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function AddOrderForm({
  batchDates,
  menuItems,
}: {
  batchDates: string[];
  menuItems: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [recipientSameAsCustomer, setRecipientSameAsCustomer] =
    useState(true);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [batchDate, setBatchDate] = useState(batchDates[0] ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveDeliveryName = recipientSameAsCustomer
    ? customerName
    : deliveryName;
  const effectiveDeliveryPhone = recipientSameAsCustomer
    ? contact
    : deliveryPhone;

  function reset() {
    setCustomerName("");
    setContact("");
    setRecipientSameAsCustomer(true);
    setDeliveryName("");
    setDeliveryPhone("");
    setDeliveryAddress("");
    setBatchDate(batchDates[0] ?? "");
    setQuantities({});
    setError(null);
  }

  function adjustQty(itemId: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  }

  function handleSubmit() {
    setError(null);

    if (!customerName.trim() || !contact.trim()) {
      setError("Please provide a customer name and contact.");
      return;
    }
    if (!batchDate) {
      setError("Please select a batch date.");
      return;
    }
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, qty]) => ({ menuItemId, qty }));
    if (items.length === 0) {
      setError("Please select at least one item.");
      return;
    }

    startTransition(async () => {
      const result = await createAdminOrder({
        customerName,
        contact,
        batchDate,
        deliveryName: effectiveDeliveryName,
        deliveryPhone: effectiveDeliveryPhone,
        deliveryAddress,
        items,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not create order. Please try again.");
        return;
      }
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
      >
        + Add order
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Add order
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-sm text-stone-500 hover:underline"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-48 rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
        />
        <input
          placeholder="Contact (WhatsApp number)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-48 rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
        />
        <select
          value={batchDate}
          onChange={(e) => setBatchDate(e.target.value)}
          className="rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
        >
          {batchDates.map((date) => (
            <option key={date} value={date}>
              {new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 rounded-lg border border-stone-200 p-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={recipientSameAsCustomer}
            onChange={(e) => setRecipientSameAsCustomer(e.target.checked)}
            className="h-4 w-4 accent-brand-olive"
          />
          Recipient is the same as the orderer
        </label>

        {!recipientSameAsCustomer && (
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Recipient name"
              value={deliveryName}
              onChange={(e) => setDeliveryName(e.target.value)}
              className="w-48 rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
            />
            <input
              placeholder="Recipient phone"
              value={deliveryPhone}
              onChange={(e) => setDeliveryPhone(e.target.value)}
              className="w-48 rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
            />
          </div>
        )}

        <input
          placeholder="Delivery address (optional)"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
        />
      </div>

      <div className="space-y-1.5">
        {menuItems.map((item) => {
          const qty = quantities[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 p-2 text-sm"
            >
              <span className="text-stone-700">{item.name}</span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustQty(item.id, -1)}
                  className="h-7 w-7 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                  −
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => adjustQty(item.id, 1)}
                  className="h-7 w-7 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                  +
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="rounded-lg bg-brand-olive px-4 py-2 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save order"}
      </button>
    </div>
  );
}
