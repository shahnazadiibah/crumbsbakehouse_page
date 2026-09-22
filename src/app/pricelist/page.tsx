import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/public";
import { formatIDR } from "@/lib/format";

export const revalidate = 60;

const ITEM_ORDER = [
  "Strawberry Tres Leches (Whole)",
  "Strawberry Tres Leches (Slice)",
  "Carrot Cake (Whole)",
  "Carrot Cake (Cup)",
  "Chocolate Banana Bread (Loaf)",
  "Chocolate Banana Bread (Slice)",
];

function PhotoPlaceholder() {
  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-brand-cream sm:h-36 sm:w-36">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10 text-brand-olive/40"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

export default async function PricelistPage() {
  const supabase = createPublicClient();

  const { data: rawMenuItems } = await supabase
    .from("menu_items")
    .select(
      "id, name, price, description, size_label, allergens, image_url"
    )
    .eq("active", true)
    .order("created_at");

  const menuItems = (rawMenuItems ?? [])
    .slice()
    .sort((a, b) => {
      const ai = ITEM_ORDER.indexOf(a.name);
      const bi = ITEM_ORDER.indexOf(b.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

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
        <h1 className="mt-4 font-heading text-3xl font-bold text-brand-olive">
          Menu &amp; Pricelist
        </h1>
      </header>

      <div className="mx-auto max-w-lg">
        {menuItems.length === 0 ? (
          <p className="text-center text-sm text-stone-500">
            No items available right now.
          </p>
        ) : (
          <div className="space-y-10">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <h2
                    style={{ fontFamily: "var(--font-playfair-display)" }}
                    className="text-sm font-semibold text-stone-700 sm:text-base"
                  >
                    {item.name}
                  </h2>
                  {item.description && (
                    <p className="mt-1 text-xs text-stone-700">
                      {item.description}
                    </p>
                  )}
                  {(item.size_label || item.allergens) && (
                    <p className="mt-1 text-[11px] text-stone-500">
                      {[item.size_label, item.allergens]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  )}
                  <p
                    style={{ fontFamily: "var(--font-playfair-display)" }}
                    className="mt-3 text-sm font-semibold text-stone-700 sm:text-base"
                  >
                    {formatIDR(item.price)}
                  </p>
                </div>

                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-32 w-32 shrink-0 rounded-2xl object-cover sm:h-36 sm:w-36"
                  />
                ) : (
                  <PhotoPlaceholder />
                )}
              </div>
            ))}
          </div>
        )}

        <a
          href="/links"
          className="mt-10 block text-center text-sm text-stone-500 underline"
        >
          ← Back
        </a>
      </div>
    </div>
  );
}
