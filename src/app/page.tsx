import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/public";
import { getUpcomingBatchDates } from "@/lib/batchDates";
import OrderForm from "@/components/order/OrderForm";

// Menu/delivery-zone data and the upcoming batch dates change rarely, so
// a short revalidation window avoids hitting Supabase on every request
// while still staying fresh well within the Friday-16:00-WIB cutoff.
// Uses the cookie-free public client (see src/lib/supabase/public.ts) so
// this actually gets cached instead of being forced dynamic.
export const revalidate = 60;

export default async function Home() {
  const supabase = createPublicClient();

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
          src="/page_header.jpg"
          alt="Crumbs Bakehouse"
          width={1875}
          height={625}
          className="h-auto w-full rounded-2xl"
          priority
        />
        <h1 className="mt-4 font-heading text-2xl font-bold text-brand-olive">
          Crumbs Bakehouse Pre-Order
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
