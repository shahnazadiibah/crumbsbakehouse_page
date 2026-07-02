"use client";

import { useTransition } from "react";
import { setOrderPaid, setOrderStatus } from "@/app/actions/admin-orders";
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
}

const STATUSES: OrderStatus[] = ["Pending", "Ready", "Done"];

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
        No orders for this batch yet.
      </p>
    );
  }

  return (
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
                      setOrderStatus(order.id, e.target.value as OrderStatus);
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
