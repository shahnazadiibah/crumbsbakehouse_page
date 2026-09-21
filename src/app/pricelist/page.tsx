import { createPublicClient } from "@/lib/supabase/public";
import { formatIDR } from "@/lib/format";

export const revalidate = 60;

export default async function PricelistPage() {
  const supabase = createPublicClient();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("active", true)
    .order("created_at");

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-olive">
            Crumbs Bakehouse Pricelist
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Fresh-baked treats, made to order.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-brand-olive/30 bg-white shadow-sm">
          {(menuItems ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-500">
              No items available right now.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {(menuItems ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <span className="text-sm font-medium text-stone-900">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-brand-olive">
                    {formatIDR(item.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <a
          href="/links"
          className="mt-6 block text-center text-sm text-stone-500 underline"
        >
          ← Back
        </a>
      </div>
    </div>
  );
}
