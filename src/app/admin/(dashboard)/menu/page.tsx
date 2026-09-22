import { createClient } from "@/lib/supabase/server";
import MenuItemsManager from "@/components/admin/MenuItemsManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const supabase = await createClient();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select(
      "id, name, price, discount_percent, description, size_label, allergens, image_url"
    )
    .order("name");

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-stone-900">
        Menu &amp; Pricelist
      </h1>
      <p className="text-sm text-stone-500">
        Price, discount, description, size/format, allergens, and a photo
        URL for each item on the public{" "}
        <a href="/pricelist" target="_blank" className="underline">
          /pricelist
        </a>{" "}
        page. Saves on blur. Recipes are still managed from the COGS tab.
      </p>
      <MenuItemsManager items={menuItems ?? []} />
    </div>
  );
}
