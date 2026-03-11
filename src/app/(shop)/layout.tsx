import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Footer } from "@/components/shop/Footer";
import { Navbar } from "@/components/shop/Navbar";

type ShopLayoutProps = {
  children: ReactNode;
};

export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#F8F6F2] text-[#1E1810]">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-10">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </QueryProvider>
  );
}
