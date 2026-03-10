import type { ReactNode } from "react";

import { Footer } from "@/components/shop/Footer";
import { Navbar } from "@/components/shop/Navbar";

type ShopLayoutProps = {
  children: ReactNode;
};

export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FDF8F0] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}
