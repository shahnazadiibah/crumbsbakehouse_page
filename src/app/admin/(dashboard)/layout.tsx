import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/recipes", label: "Recipes" },
  { href: "/admin/bake-list", label: "Bake list" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/batches", label: "Batches" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm font-medium text-stone-600">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
