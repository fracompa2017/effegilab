import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Footer } from "@/components/shop/Footer";
import { Navbar } from "@/components/shop/Navbar";
import { UrgencyBanner } from "@/components/shop/UrgencyBanner";

type ShopLayoutProps = {
  children: ReactNode;
};

export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#F8F6F2] text-[#1E1810]">
        <UrgencyBanner type="coupon" expiryDate={new Date("2026-12-31T23:59:59")} />
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 md:pb-10 md:pt-10">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </QueryProvider>
  );
}
