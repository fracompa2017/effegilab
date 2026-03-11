"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const categoryItems = [
  { href: "/shop", label: "Wedding" },
  { href: "/shop?evento=promessa", label: "Promessa" },
  { href: "/shop?evento=nascita-battesimo", label: "Nascita & Battesimo" },
  { href: "/shop?evento=comunione", label: "Comunione" },
  { href: "/shop?evento=laurea", label: "Laurea" },
  { href: "/shop?evento=compleanni", label: "Compleanni" },
  { href: "/collezioni/amalfi-coast", label: "Collezioni" },
  { href: "/contatti", label: "Assistenza" },
  { href: "https://effegi-lab2.reservio.com/booking", label: "Fissa Appuntamento" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const toggleCart = useCartStore((state) => state.toggleCart);

  return (
    <header className="sticky top-0 z-50 border-b border-[#D9D2C6] bg-white/80 backdrop-blur-md">
      <div className="bg-[#1E1810] px-4 py-2 text-center text-xs font-medium tracking-[0.04em] text-white sm:text-sm">
        Spedizione gratuita da 150€ · <span className="font-semibold text-[#E8B4B4]">LAB15</span>{" "}
        → 15% sconto
      </div>

      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="font-serif text-4xl text-[#1E1810]">
          Effegi<span className="italic text-[#D4918F]">Lab</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" className="text-[#5C5048]" aria-label="Cerca">
            <Search size={18} />
          </Button>
          <Button variant="ghost" className="text-[#5C5048]" aria-label="Wishlist">
            <Heart size={18} />
          </Button>
          <Button
            variant="ghost"
            className="relative text-[#5C5048]"
            aria-label="Apri carrello"
            onClick={() => toggleCart(true)}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4918F] px-1 text-[11px] font-semibold text-white">
                {totalItems}
              </span>
            ) : null}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="text-[#5C5048] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Apri menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <nav className="no-scrollbar overflow-x-auto border-t border-[#EFE8DB] bg-[#F8F6F2] px-4">
        <div className="mx-auto flex w-max min-w-full max-w-7xl items-center gap-2 py-3">
          {categoryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm font-medium text-[#5C5048] transition-colors hover:border-[#E8B4B4] hover:bg-white",
                pathname === item.href && "border-[#D4918F] bg-white text-[#1E1810]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {open ? (
        <div className="border-t border-[#EFE8DB] bg-white p-4 md:hidden">
          <div className="grid grid-cols-1 gap-2">
            {categoryItems.map((item) => (
              <Link
                key={`mobile-${item.label}`}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5C5048] hover:bg-[#F8F6F2]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" className="flex-1">
              Wishlist
            </Button>
            <Button className="flex-1" onClick={() => toggleCart(true)}>
              Carrello ({totalItems})
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
