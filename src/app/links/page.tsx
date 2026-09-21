import Image from "next/image";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const CUSTOM_ORDER_MESSAGE =
  "Halo Crumbs Bakehouse! \u{1F44B} I'd like to ask about ordering for another delivery date.";

const LINKS = [
  {
    label: "Menu & Pricelist",
    sublabel: null,
    href: "/pricelist",
    external: false,
  },
  {
    label: "Pre-Order Here!",
    sublabel: "Delivery every weekend",
    href: "/order",
    external: false,
  },
  {
    label: "WhatsApp Admin",
    sublabel: "(for other delivery date)",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      CUSTOM_ORDER_MESSAGE
    )}`,
    external: true,
  },
];

export default function LinksPage() {
  return (
    <div className="flex min-h-screen justify-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/page_header.jpg"
          alt="Crumbs Bakehouse"
          width={1875}
          height={625}
          className="mx-auto h-auto w-full rounded-2xl"
          priority
        />
        <h1 className="mt-4 font-heading text-2xl font-bold text-brand-olive">
          Crumbs Bakehouse
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Fresh-baked treats, made with love.
        </p>

        <div className="mt-8 space-y-3">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              style={{ fontFamily: "var(--font-dm-sans)" }}
              className="group block rounded-xl border border-brand-olive/30 bg-white px-4 py-3.5 text-sm font-semibold text-stone-900 shadow-sm transition-colors hover:bg-brand-olive hover:text-white"
            >
              {link.label}
              {link.sublabel && (
                <span className="mt-0.5 block text-xs font-normal text-stone-500 group-hover:text-white/80">
                  {link.sublabel}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
