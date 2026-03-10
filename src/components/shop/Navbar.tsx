"use client";

import Link from "next/link";
import { useState } from "react";

import { Heart, Menu, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

const menuItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collezioni/elegance", label: "Collezioni" },
  { href: "/contatti", label: "Contatti" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#C9A96E]/40 bg-[#FDF8F0]/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-bold tracking-wide text-slate-900">
          Effegi <span className="text-[#C9A96E]">Lab</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-700 hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" aria-label="Wishlist">
            <Heart size={18} />
          </Button>
          <Button variant="outline" aria-label="Carrello">
            <ShoppingBag size={18} />
          </Button>
        </div>

        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Apri menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-[#C9A96E]/30 bg-[#FDF8F0] px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-[#f5eddc]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button variant="ghost" className="flex-1">
                Wishlist
              </Button>
              <Button variant="outline" className="flex-1">
                Carrello
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
