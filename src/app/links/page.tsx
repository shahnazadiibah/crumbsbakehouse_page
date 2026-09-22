import Image from "next/image";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const CUSTOM_ORDER_MESSAGE = "Halo Crumbs \u{1F44B} I'd like to order";

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-current"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.484 1.34 4.997L2 22l5.117-1.332a9.96 9.96 0 0 0 4.887 1.28h.004c5.514 0 9.997-4.483 9.997-9.997 0-2.67-1.04-5.181-2.929-7.07a9.933 9.933 0 0 0-7.072-2.878zm5.858 15.855a8.28 8.28 0 0 1-5.858 2.427h-.003a8.266 8.266 0 0 1-4.212-1.153l-.302-.18-3.037.79.81-2.96-.197-.304a8.244 8.244 0 0 1-1.267-4.417c0-4.582 3.73-8.312 8.315-8.312a8.26 8.26 0 0 1 5.877 2.435 8.253 8.253 0 0 1 2.432 5.876 8.28 8.28 0 0 1-2.428 5.798z" />
    </svg>
  );
}

const LINKS = [
  {
    label: "Menu & Pricelist",
    sublabel: null,
    href: "/pricelist",
    external: false,
    icon: null,
  },
  {
    label: "Order Here!",
    sublabel: "Delivery every weekend",
    href: "/order",
    external: false,
    icon: <CartIcon />,
  },
  {
    label: "WhatsApp Admin",
    sublabel: "(for other delivery date)",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      CUSTOM_ORDER_MESSAGE
    )}`,
    external: true,
    icon: <WhatsAppIcon />,
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
              className="group flex items-center justify-center gap-2 rounded-xl border border-brand-olive/30 bg-white px-4 py-3.5 text-sm font-semibold text-[#5a6032] shadow-sm transition-colors hover:bg-brand-olive hover:text-white"
            >
              {link.icon}
              <span>
                {link.label}
                {link.sublabel && (
                  <span className="mt-0.5 block text-xs font-normal text-stone-500 group-hover:text-white/80">
                    {link.sublabel}
                  </span>
                )}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
