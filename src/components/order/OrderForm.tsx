"use client";

import { useMemo, useState, useTransition } from "react";
import { submitOrder } from "@/app/actions/orders";
import { formatIDR } from "@/lib/format";
import { isMandatoryWholeCakeZone, isWholeCakeItem } from "@/lib/menuRules";
import type { OrderItem } from "@/lib/supabase/types";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
}

interface BatchDateOption {
  date: string;
  label: string;
}

interface OrderFormProps {
  menuItems: MenuItem[];
  deliveryZones: DeliveryZone[];
  batchDates: BatchDateOption[];
  qrisImageUrl: string;
}

interface ConfirmedOrder {
  id: string;
  items: OrderItem[];
  itemsTotal: number;
  deliveryFee: number;
  grandTotal: number;
  batchLabel: string;
  zoneName: string;
  deliveryNeedsConfirmation: boolean;
  customerName: string;
  contact: string;
  notes: string;
  greetingCard: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

function buildWhatsAppMessage(order: ConfirmedOrder): string {
  const lines = [
    "Halo Crumbs Bakehouse! \u{1F44B}",
    "",
    "Saya ingin konfirmasi pesanan & pembayaran berikut:",
    "",
    `Nama: ${order.customerName}`,
    `No. HP: ${order.contact}`,
    `Tanggal Batch: ${order.batchLabel}`,
    "",
    "Pesanan:",
    ...order.items.map(
      (i) =>
        `- ${i.qty}x ${i.name} = ${formatIDR(i.price * i.qty)}` +
        (i.topper ? ` (Topper: "${i.topper}")` : "")
    ),
    "",
    `Pengiriman (${order.zoneName}): ${formatIDR(order.deliveryFee)}${
      order.deliveryNeedsConfirmation ? " (harga dikonfirmasi terpisah)" : ""
    }`,
    `Total: ${formatIDR(order.grandTotal)}${
      order.deliveryNeedsConfirmation
        ? " + ongkir (menyusul konfirmasi)"
        : ""
    }`,
  ];

  lines.push(
    "",
    "Detail pengiriman:",
    `Nama penerima: ${order.deliveryName}`,
    `No. HP penerima: ${order.deliveryPhone}`,
    `Alamat: ${order.deliveryAddress}`
  );

  if (order.greetingCard) {
    lines.push("", `Kartu ucapan: "${order.greetingCard}"`);
  }

  if (order.notes) {
    lines.push("", `Catatan: ${order.notes}`);
  }

  lines.push(
    "",
    `Order ID: ${order.id}`,
    "",
    "Saya sudah transfer via QRIS sesuai jumlah di atas. Mohon dikonfirmasi ya. Terima kasih! \u{1F64F}"
  );

  return lines.join("\n");
}

export default function OrderForm({
  menuItems,
  deliveryZones,
  batchDates,
  qrisImageUrl,
}: OrderFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [batchDate, setBatchDate] = useState(batchDates[0]?.date ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cakeTopper, setCakeTopper] = useState("");
  const [zoneId, setZoneId] = useState(deliveryZones[0]?.id ?? "");
  const [greetingCard, setGreetingCard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const itemsTotal = useMemo(() => {
    return menuItems.reduce(
      (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
      0
    );
  }, [menuItems, quantities]);

  const hasWholeCake = menuItems.some(
    (item) => (quantities[item.id] ?? 0) > 0 && isWholeCakeItem(item.name)
  );
  const mandatoryZone = deliveryZones.find((z) =>
    isMandatoryWholeCakeZone(z.name)
  );
  const effectiveZoneId =
    hasWholeCake && mandatoryZone ? mandatoryZone.id : zoneId;

  const selectedZone = deliveryZones.find((z) => z.id === effectiveZoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const grandTotal = itemsTotal + deliveryFee;
  const hasItems = Object.values(quantities).some((qty) => qty > 0);
  const deliveryNeedsConfirmation =
    selectedZone?.name.toLowerCase().includes("confirm") ?? false;

  function adjustQty(itemId: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !contact.trim()) {
      setError("Please fill in your name and WhatsApp number.");
      return;
    }
    if (
      !deliveryName.trim() ||
      !deliveryPhone.trim() ||
      !deliveryAddress.trim()
    ) {
      setError("Please fill in the delivery name, phone number, and address.");
      return;
    }
    if (!batchDate) {
      setError("Please select a batch date.");
      return;
    }
    if (!hasItems) {
      setError("Please select at least one item.");
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, qty]) => {
        const menuItem = menuItems.find((m) => m.id === menuItemId);
        const topper =
          menuItem && isWholeCakeItem(menuItem.name) && cakeTopper.trim()
            ? cakeTopper.trim()
            : undefined;
        return { menuItemId, qty, topper };
      });

    startTransition(async () => {
      const result = await submitOrder({
        customerName,
        contact,
        batchDate,
        zoneId: effectiveZoneId || null,
        notes,
        greetingCard,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        items,
      });

      if (!result.ok || !result.order) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setConfirmedOrder({
        id: result.order.id,
        items: result.order.items,
        itemsTotal: result.order.itemsTotal,
        deliveryFee: result.order.deliveryFee,
        grandTotal: result.order.grandTotal,
        batchLabel:
          batchDates.find((b) => b.date === batchDate)?.label ?? batchDate,
        zoneName: selectedZone?.name ?? "N/A",
        deliveryNeedsConfirmation,
        customerName,
        contact,
        notes,
        greetingCard,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
      });
    });
  }

  if (confirmedOrder) {
    const message = buildWhatsAppMessage(confirmedOrder);
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-brand-olive/30 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            Order received! 🎉
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {confirmedOrder.deliveryNeedsConfirmation
              ? "The delivery fee isn't included yet, so send the confirmation message below on WhatsApp first — you can pay via QRIS once we confirm the final amount."
              : "Please pay the exact amount below via QRIS, then send us the confirmation message on WhatsApp."}
          </p>
        </div>

        <div className="rounded-xl bg-brand-cream p-4 text-center">
          <p className="text-sm text-stone-600">
            {confirmedOrder.deliveryNeedsConfirmation
              ? "Amount to pay (items only)"
              : "Amount to pay"}
          </p>
          <p className="text-3xl font-bold text-stone-900">
            {formatIDR(confirmedOrder.grandTotal)}
          </p>
          {confirmedOrder.deliveryNeedsConfirmation && (
            <p className="mt-1 text-xs text-stone-700">
              Delivery fee not yet included — we&apos;ll confirm it with you
              on WhatsApp.
            </p>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrisImageUrl}
          alt="QRIS payment code"
          className="mx-auto w-64 rounded-lg border border-stone-200"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">
            Confirmation message
          </p>
          <textarea
            readOnly
            value={message}
            rows={10}
            className="w-full rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm text-stone-800"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(message);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              {copied ? "Copied!" : "Copy message"}
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              Open WhatsApp
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmedOrder(null);
            setQuantities({});
            setCakeTopper("");
            setGreetingCard("");
            setCustomerName("");
            setContact("");
            setNotes("");
            setDeliveryName("");
            setDeliveryPhone("");
            setDeliveryAddress("");
          }}
          className="w-full text-center text-sm text-stone-500 underline"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-8 rounded-2xl border border-brand-olive/30 bg-white p-6 shadow-sm"
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          1. Your details
        </h2>
        <input
          type="text"
          placeholder="Full name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
        <input
          type="text"
          placeholder="WhatsApp number"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          2. Delivery details
        </h2>
        <input
          type="text"
          placeholder="Recipient name"
          value={deliveryName}
          onChange={(e) => setDeliveryName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
        <input
          type="text"
          placeholder="Recipient phone number"
          value={deliveryPhone}
          onChange={(e) => setDeliveryPhone(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
        <textarea
          placeholder="Delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          3. Batch date
        </h2>
        {batchDates.length === 0 ? (
          <p className="text-sm text-stone-500">
            No upcoming batches are open for ordering right now. Please check
            back later.
          </p>
        ) : (
          <select
            value={batchDate}
            onChange={(e) => setBatchDate(e.target.value)}
            className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
          >
            {batchDates.map((b) => (
              <option key={b.date} value={b.date}>
                {b.label}
              </option>
            ))}
          </select>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          4. Menu
        </h2>
        <div className="space-y-3">
          {menuItems.map((item) => {
            const qty = quantities[item.id] ?? 0;
            const isWholeCake = isWholeCakeItem(item.name);
            return (
              <div
                key={item.id}
                className="rounded-lg border border-stone-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {item.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      {formatIDR(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQty(item.id, -1)}
                      className="h-8 w-8 rounded-full border border-stone-300 text-stone-600"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => adjustQty(item.id, 1)}
                      className="h-8 w-8 rounded-full border border-stone-300 text-stone-600"
                    >
                      +
                    </button>
                  </div>
                </div>
                {isWholeCake && qty > 0 && (
                  <input
                    type="text"
                    placeholder="Cake topper text (optional)"
                    value={cakeTopper}
                    onChange={(e) => setCakeTopper(e.target.value)}
                    className="mt-3 w-full rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          5. Delivery
        </h2>
        {hasWholeCake && (
          <p className="mb-2 rounded-lg bg-brand-cream p-3 text-sm text-stone-700">
            Whole cake orders require Grab Instant Car delivery to arrive
            undamaged, so it&apos;s selected automatically below.
          </p>
        )}
        <div className="space-y-2">
          {deliveryZones.map((zone) => {
            const disabled = hasWholeCake && zone.id !== mandatoryZone?.id;
            return (
              <label
                key={zone.id}
                className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${
                  effectiveZoneId === zone.id
                    ? "border-brand-olive bg-brand-cream"
                    : "border-stone-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="zone"
                    value={zone.id}
                    checked={effectiveZoneId === zone.id}
                    disabled={disabled}
                    onChange={() => setZoneId(zone.id)}
                    className="accent-brand-olive"
                  />
                  {zone.name}
                </span>
                <span className="text-stone-500">{formatIDR(zone.fee)}</span>
              </label>
            );
          })}
        </div>
        {deliveryNeedsConfirmation && (
          <p className="mt-2 rounded-lg bg-brand-cream p-3 text-sm text-stone-700">
            The delivery fee for this option isn&apos;t fixed — we&apos;ll
            confirm the exact price with you on WhatsApp. It isn&apos;t
            included in the QRIS amount below.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          6. Greeting card
        </h2>
        <textarea
          placeholder="Write a short message for the greeting card (optional)"
          value={greetingCard}
          onChange={(e) => setGreetingCard(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
        />
      </section>

      <section className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">Items</span>
          <span>{formatIDR(itemsTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Delivery</span>
          <span>
            {formatIDR(deliveryFee)}
            {deliveryNeedsConfirmation && " (TBC)"}
          </span>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-semibold text-stone-900">
          <span>Total</span>
          <span>{formatIDR(grandTotal)}</span>
        </div>
        {deliveryNeedsConfirmation && (
          <p className="pt-1 text-xs text-stone-500">
            TBC = delivery fee to be confirmed separately via WhatsApp.
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || batchDates.length === 0}
        className="w-full rounded-lg bg-brand-olive px-4 py-3 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Place order"}
      </button>
    </form>
  );
}
