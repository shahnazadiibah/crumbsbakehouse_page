"use client";

import { useState, useTransition } from "react";
import {
  deleteOrder,
  setOrderBatchDate,
  setOrderPaid,
  setOrderStatus,
  updateOrderItems,
  updateOrderNotes,
} from "@/app/actions/admin-orders";
import { downloadCsv } from "@/lib/csv";
import { formatIDR } from "@/lib/format";
import EditableDateField from "@/components/admin/EditableDateField";
import type { OrderItem, OrderStatus } from "@/lib/supabase/types";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderRow {
  id: string;
  customer_name: string;
  contact: string;
  batch_date: string;
  items: OrderItem[];
  delivery_fee: number;
  items_total: number;
  grand_total: number;
  paid: boolean;
  status: OrderStatus;
  notes: string | null;
  greeting_card: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  pickup_time: string | null;
}

const STATUSES: OrderStatus[] = ["Pending", "Done"];

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9 2h6a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-2 2V4a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function buildInvoiceText(order: OrderRow): string {
  const lines = [
    `Invoice — ${order.customer_name}`,
    "",
    ...order.items.map(
      (i) =>
        `${i.qty}x ${i.name}${i.topper ? ` (${i.topper})` : ""} = ${formatIDR(
          i.price * i.qty
        )}`
    ),
    "",
    `Items: ${formatIDR(order.items_total)}`,
    `Delivery: ${formatIDR(order.delivery_fee)}`,
    `Total: ${formatIDR(order.grand_total)}`,
  ];
  return lines.join("\n");
}

function exportOrders(orders: OrderRow[], rangeFrom: string, rangeTo: string) {
  const headers = [
    "Customer name",
    "Contact",
    "Batch date",
    "Delivery name",
    "Delivery phone",
    "Delivery address",
    "Pick up time estimation",
    "Items",
    "Items total",
    "Delivery fee",
    "Grand total",
    "Paid",
    "Status",
    "Greeting card",
    "Notes",
  ];

  const rows = orders.map((order) => [
    order.customer_name,
    order.contact,
    order.batch_date,
    order.delivery_name ?? "",
    order.delivery_phone ?? "",
    order.delivery_address ?? "",
    order.pickup_time ?? "",
    order.items
      .map((i) => `${i.qty}x ${i.name}${i.topper ? ` (${i.topper})` : ""}`)
      .join("; "),
    order.items_total,
    order.delivery_fee,
    order.grand_total,
    order.paid ? "Yes" : "No",
    order.status,
    order.greeting_card ?? "",
    order.notes ?? "",
  ]);

  const filenameDate = rangeFrom === rangeTo ? rangeFrom : `${rangeFrom}_to_${rangeTo}`;
  downloadCsv(`crumbs-orders-${filenameDate}.csv`, headers, rows);
}

export default function OrdersTable({
  orders,
  rangeFrom,
  rangeTo,
  menuItems,
}: {
  orders: OrderRow[];
  rangeFrom: string;
  rangeTo: string;
  menuItems: MenuItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [addItemId, setAddItemId] = useState(menuItems[0]?.id ?? "");
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
        No orders for this batch yet.
      </p>
    );
  }

  const itemTotals = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemTotals.set(item.name, (itemTotals.get(item.name) ?? 0) + item.qty);
    }
  }
  const itemSummary = Array.from(itemTotals.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Order summary ({orders.length} order{orders.length === 1 ? "" : "s"})
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {itemSummary.map(([name, qty]) => (
            <div key={name} className="text-stone-700">
              <span className="font-semibold text-stone-900">{qty}x</span>{" "}
              {name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <a
          href={`/admin/print-labels?from=${rangeFrom}&to=${rangeTo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Print delivery labels
        </a>
        <button
          onClick={() => exportOrders(orders, rangeFrom, rangeTo)}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Export to Excel (CSV)
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery date</th>
              <th className="px-4 py-3">Deliver to</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Card / notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-stone-900">
                    {order.customer_name}
                  </p>
                  <p className="text-stone-500">{order.contact}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <EditableDateField
                    value={order.batch_date}
                    disabled={isPending}
                    onChange={(date) =>
                      startTransition(() => {
                        setOrderBatchDate(order.id, date);
                      })
                    }
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-stone-900">
                    {order.delivery_name ?? "—"}
                  </p>
                  <p className="text-stone-500">{order.delivery_phone}</p>
                  <p className="text-stone-500">{order.delivery_address}</p>
                  {order.pickup_time && (
                    <p className="text-stone-500">
                      Pick-up: {order.pickup_time}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {editingId === order.id ? (
                    <div className="space-y-1.5">
                      {editItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={item.qty}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              setEditItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === i ? { ...it, qty } : it
                                )
                              );
                            }}
                            className="w-16 rounded-lg border border-stone-300 p-1 text-sm text-stone-900"
                          />
                          <span>x {item.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditItems((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                            className="text-red-600 hover:underline"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {menuItems.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={addItemId}
                            onChange={(e) => setAddItemId(e.target.value)}
                            className="rounded-lg border border-stone-300 p-1 text-xs text-stone-700"
                          >
                            {menuItems.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const menuItem = menuItems.find(
                                (m) => m.id === addItemId
                              );
                              if (!menuItem) return;
                              setEditItems((prev) => [
                                ...prev,
                                {
                                  menu_item_id: menuItem.id,
                                  name: menuItem.name,
                                  price: menuItem.price,
                                  qty: 1,
                                },
                              ]);
                            }}
                            className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                          >
                            + Add item
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    order.items.map((item, i) => (
                      <div key={i}>
                        {item.qty}x {item.name}
                        {item.topper && (
                          <span className="font-medium text-stone-700">
                            {" "}
                            — Topper: &quot;{item.topper}&quot;
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-stone-900">
                    {formatIDR(order.grand_total)}
                  </p>
                  <p className="text-stone-500">
                    incl. {formatIDR(order.delivery_fee)} delivery
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={order.paid}
                    disabled={isPending}
                    onChange={(e) =>
                      startTransition(() => {
                        setOrderPaid(order.id, e.target.checked);
                      })
                    }
                    className="h-4 w-4 accent-brand-olive"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    value={order.status}
                    disabled={isPending}
                    onChange={(e) =>
                      startTransition(() => {
                        setOrderStatus(
                          order.id,
                          e.target.value as OrderStatus
                        );
                      })
                    }
                    className="rounded-lg border border-stone-300 p-1.5 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 align-top text-stone-500">
                  {order.greeting_card && (
                    <p className="text-stone-900">
                      Card: &quot;{order.greeting_card}&quot;
                    </p>
                  )}
                  {editingId === order.id ? (
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-stone-300 p-1.5 text-sm text-stone-900"
                    />
                  ) : (
                    <>
                      {order.notes && <p>{order.notes}</p>}
                      {!order.greeting_card && !order.notes && "—"}
                    </>
                  )}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {editingId === order.id ? (
                    <>
                      <button
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await Promise.all([
                              updateOrderItems(
                                order.id,
                                editItems,
                                order.delivery_fee
                              ),
                              updateOrderNotes(order.id, editNotes),
                            ]);
                            setEditingId(null);
                          })
                        }
                        className="mr-3 font-medium text-brand-olive hover:underline"
                      >
                        Save
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => setEditingId(null)}
                        className="font-medium text-stone-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        title="Edit items"
                        onClick={() => {
                          setEditingId(order.id);
                          setEditItems(order.items);
                          setEditNotes(order.notes ?? "");
                        }}
                        className="text-stone-500 hover:text-stone-800"
                      >
                        <EditIcon />
                      </button>
                      <button
                        title={
                          copiedInvoiceId === order.id
                            ? "Copied!"
                            : "Copy invoice"
                        }
                        onClick={() => {
                          navigator.clipboard.writeText(
                            buildInvoiceText(order)
                          );
                          setCopiedInvoiceId(order.id);
                          setTimeout(
                            () =>
                              setCopiedInvoiceId((prev) =>
                                prev === order.id ? null : prev
                              ),
                            2000
                          );
                        }}
                        className={
                          copiedInvoiceId === order.id
                            ? "text-green-600"
                            : "text-stone-500 hover:text-stone-800"
                        }
                      >
                        <InvoiceIcon />
                      </button>
                      <button
                        title="Delete"
                        disabled={isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete ${order.customer_name}'s order? This can't be undone.`
                            )
                          ) {
                            startTransition(() => {
                              deleteOrder(order.id);
                            });
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
