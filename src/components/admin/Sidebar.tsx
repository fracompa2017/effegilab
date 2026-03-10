"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/prodotti", label: "Prodotti" },
  { href: "/admin/ordini", label: "Ordini" },
  { href: "/admin/pagine", label: "Page Builder" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Admin</h2>
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
