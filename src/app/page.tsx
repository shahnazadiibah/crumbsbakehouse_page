import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingBatchDates } from "@/lib/batchDates";
import OrderForm from "@/components/order/OrderForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: menuItems }, { data: deliveryZones }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, price")
      .eq("active", true)
      .order("created_at"),
    supabase
      .from("delivery_zones")
      .select("id, name, fee")
      .order("created_at"),
  ]);

  const batchDates = getUpcomingBatchDates(4).map((b) => ({
    date: b.date,
    label: b.label,
  }));

  const qrisImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-assets/qris.png`;

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10">
      <header className="mx-auto mb-8 max-w-lg text-center">
        <h1 className="sr-only">Crumbs Bakehouse</h1>
        <Image
          src="/page_header.png"
          alt="Crumbs Bakehouse"
          width={600}
          height={200}
          className="h-auto w-full rounded-2xl"
          priority
        />
        <p className="mt-3 text-sm text-stone-600">
          Weekly Saturday pre-order — pick your batch, place your order, pay
          via QRIS.
        </p>
      </header>

      <OrderForm
        menuItems={menuItems ?? []}
        deliveryZones={deliveryZones ?? []}
        batchDates={batchDates}
        qrisImageUrl={qrisImageUrl}
      />
    </div>
  );
}
