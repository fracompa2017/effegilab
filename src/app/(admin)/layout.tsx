"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/admin/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { createClient } from "@/lib/supabase/client";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isLoginPage = pathname === "/admin/login" || pathname === "/login";

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session);

      if (!isMounted) {
        return;
      }

      if (!hasSession && !isLoginPage) {
        router.replace("/admin/login");
      } else if (hasSession && isLoginPage) {
        router.replace("/admin/dashboard");
      }

      setIsCheckingSession(false);
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace("/admin/login");
      }
      if (session && isLoginPage) {
        router.replace("/admin/dashboard");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, isLoginPage]);

  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#F8F6F2] text-[#1E1810]">
        {isCheckingSession ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="rounded-2xl border border-black/7 bg-white px-6 py-4 text-sm text-[#5C5048] shadow-sm">
              Verifica sessione admin...
            </div>
          </div>
        ) : isLoginPage ? (
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
