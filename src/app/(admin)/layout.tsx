"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Sidebar } from "@/components/admin/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login" || pathname === "/login";

  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#F8F6F2] text-[#1E1810]">
        {isLoginPage ? (
          <div className="min-h-screen">{children}</div>
        ) : (
          <div className="min-h-screen md:pl-60">
            <Sidebar currentPath={pathname} />
            <main className="min-h-screen px-4 pb-8 pt-16 md:px-8 md:pt-8">{children}</main>
          </div>
        )}
      </div>
    </QueryProvider>
  );
}
