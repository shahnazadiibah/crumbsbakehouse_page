"use client";

import { useTransition } from "react";
import {
  deleteOrder,
  setOrderPaid,
  setOrderStatus,
} from "@/app/actions/admin-orders";
import { downloadCsv } from "@/lib/csv";
import { formatIDR } from "@/lib/format";
import type { OrderStatus } from "@/lib/supabase/types";

interface OrderRow {
  id: string;
  customer_name: string;
  contact: string;
  items: { name: string; price: number; qty: number; topper?: string }[];
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

const STATUSES: OrderStatus[] = ["Pending", "Ready", "Done"];

function exportOrders(orders: OrderRow[], batchDate: string) {
  const headers = [
    "Customer name",
    "Contact",
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

  downloadCsv(`crumbs-orders-${batchDate}.csv`, headers, rows);
}

export default function OrdersTable({
  orders,
  batchDate,
}: {
  orders: OrderRow[];
  batchDate: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
        No orders for this batch yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => exportOrders(orders, batchDate)}
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
                  {order.items.map((item, i) => (
                    <div key={i}>
                      {item.qty}x {item.name}
                      {item.topper && (
                        <span className="font-medium text-stone-700">
                          {" "}
                          — Topper: &quot;{item.topper}&quot;
                        </span>
                      )}
                    </div>
                  ))}
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
                  {order.notes && <p>{order.notes}</p>}
                  {!order.greeting_card && !order.notes && "—"}
                </td>
                <td className="px-4 py-3 align-top">
                  <button
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
