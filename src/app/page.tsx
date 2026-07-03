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

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <header className="mx-auto mb-8 max-w-lg text-center">
        <Image
          src="/page_header.png"
          alt="Crumbs Bakehouse"
          width={1875}
          height={625}
          className="h-auto w-full rounded-2xl"
          priority
        />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          Crumbs Bakehouse Pre-Order Page
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          You&apos;re one step away from our warm, freshly baked treat! Fill
          out the form below and let us know what we&apos;d love to bake
          fresh for you.
        </p>
      </header>

      <OrderForm
        menuItems={menuItems ?? []}
        deliveryZones={deliveryZones ?? []}
        batchDates={batchDates}
      />
    </div>
  );
}
