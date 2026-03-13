"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Edit3,
  FolderTree,
  Grid2x2,
  Image,
  Link2,
  ListTree,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  Tag,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SidebarProps = {
  currentPath: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  withPendingBadge?: boolean;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Grid2x2 },
  { href: "/admin/ordini", label: "Ordini", icon: Package, withPendingBadge: true },
  { href: "/admin/prodotti", label: "Prodotti", icon: ListTree },
  { href: "/admin/categorie", label: "Categorie", icon: FolderTree },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/coupon", label: "Coupon", icon: Tag },
  { href: "/admin/pagine", label: "Pagine", icon: Edit3 },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/integrazioni", label: "Integrazioni", icon: Link2 },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export function Sidebar({ currentPath }: SidebarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: pendingOrders = 0 } = useQuery({
    queryKey: ["admin-pending-orders-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending");

      if (error) {
        return 0;
      }

      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#5C5048] shadow-sm md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Apri menu admin"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/25 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        role="presentation"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-black/7 bg-[#F8F6F2] px-4 pb-4 pt-6 transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="space-y-2 border-b border-black/7 pb-4">
          <p className="font-serif text-3xl leading-none text-[#1E1810]">
            Effegi<span className="italic text-[#D4918F]">Lab</span> Admin
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE2D5] bg-white px-2.5 py-1 text-xs font-medium text-[#3C6E4E]">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#57A870]">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#57A870]" />
            </span>
            Live
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-[#1E1810] shadow-sm"
                    : "text-[#5C5048] hover:bg-white/80",
                )}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Icon size={16} className={active ? "text-[#D4918F]" : "text-[#7A6E66]"} />
                  {item.label}
                </span>
                {item.withPendingBadge && pendingOrders > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#D4918F] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {pendingOrders}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-black/7 bg-white p-3">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE8DB] text-sm font-semibold text-[#5C5048]">
              EG
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E1810]">Effegi Admin</p>
              <p className="text-xs text-[#9C9088]">admin@effegi-lab.it</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-[#5C5048] hover:bg-[#F8F6F2]"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
