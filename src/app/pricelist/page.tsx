import { createPublicClient } from "@/lib/supabase/public";
import { formatIDR } from "@/lib/format";

export const revalidate = 60;

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

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select(
      "id, name, price, description, size_label, allergens, image_url"
    )
    .eq("active", true)
    .order("created_at");

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div className="leading-none">
            <p
              style={{ fontFamily: "var(--font-playfair-display)" }}
              className="text-5xl font-black text-brand-olive-dark sm:text-6xl"
            >
              Menu
            </p>
            <p
              style={{ fontFamily: "var(--font-caveat)" }}
              className="-mt-2 ml-8 text-4xl text-brand-olive sm:text-5xl"
            >
              &amp; Pricelist
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-olive text-xs font-semibold text-white sm:h-20 sm:w-20 sm:text-sm">
            cr.umbs
          </div>
        </header>

        {(menuItems ?? []).length === 0 ? (
          <p className="text-center text-sm text-stone-500">
            No items available right now.
          </p>
        ) : (
          <div className="space-y-10">
            {(menuItems ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <h2
                    style={{ fontFamily: "var(--font-playfair-display)" }}
                    className="text-xl font-semibold text-stone-900 sm:text-2xl"
                  >
                    {item.name}
                  </h2>
                  {item.description && (
                    <p className="mt-1 text-sm text-stone-700">
                      {item.description}
                    </p>
                  )}
                  {(item.size_label || item.allergens) && (
                    <p className="mt-1 text-xs text-stone-400">
                      {[item.size_label, item.allergens]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  )}
                  <p className="mt-3 text-lg font-semibold text-stone-900">
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
