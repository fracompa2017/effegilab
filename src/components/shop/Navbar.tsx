"use client";

import { LogOut, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type TouchEvent } from "react";

import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type EventLink = {
  label: string;
  href: string;
  icon: string;
};

const eventLinks: EventLink[] = [
  { label: "Wedding", href: "/shop?evento=wedding", icon: "💍" },
  { label: "Promessa", href: "/shop?evento=promessa", icon: "💑" },
  { label: "Nascita", href: "/shop?evento=nascita", icon: "👶" },
  { label: "Comunione", href: "/shop?evento=comunione", icon: "✝️" },
  { label: "Laurea", href: "/shop?evento=laurea", icon: "🎓" },
  { label: "Compleanni", href: "/shop?evento=compleanni", icon: "🎂" },
];

const desktopNavLinks = [
  { label: "Collezioni", href: "/collezioni/amalfi-coast" },
  { label: "Chi Siamo", href: "/chi-siamo" },
  { label: "Come Funziona", href: "/come-funziona" },
  { label: "Contatti", href: "/contatti" },
];

const mobileMenuLinks = [
  {
    title: "Per Evento",
    links: eventLinks,
  },
  {
    title: "Scopri",
    links: [
      { label: "Collezioni", href: "/collezioni/amalfi-coast", icon: "✨" },
      { label: "Chi Siamo", href: "/chi-siamo", icon: "🤍" },
      { label: "Contatti", href: "/contatti", icon: "📍" },
    ],
  },
];

function BottomMobileNav() {
  const pathname = usePathname();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalItems = useCartStore((state) => state.totalItems);

  const items = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Collezioni", href: "/collezioni/amalfi-coast" },
    ],
    [],
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#F0EDE8] bg-white/98 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="grid grid-cols-4 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]",
              pathname === item.href ? "bg-[#F6EFEB] text-[#1E1810]" : "",
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => toggleCart(true)}
          className="relative inline-flex min-h-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]"
          aria-label="Apri carrello"
        >
          Carrello
          {totalItems > 0 ? (
            <span className="absolute right-3 top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4918F] px-1 text-[11px] font-semibold text-white">
              {totalItems}
            </span>
          ) : null}
        </button>
      </div>
    </nav>
  );
}

function getUserLabel(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return "Account";
  }

  const name = typeof metadata.first_name === "string" ? metadata.first_name : "";
  const surname = typeof metadata.last_name === "string" ? metadata.last_name : "";
  const fullName = `${name} ${surname}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  if (typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0) {
    return metadata.full_name.trim();
  }

  return "Account";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalItems = useCartStore((state) => state.totalItems);
  const supabase = useMemo(() => createClient(), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showMega, setShowMega] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Account");
  const [userInitial, setUserInitial] = useState<string | null>(null);

  const isLoggedIn = Boolean(userInitial);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 80);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserInitial(user?.email?.charAt(0).toUpperCase() ?? null);
      setUserName(getUserLabel((user?.user_metadata ?? undefined) as Record<string, unknown> | undefined));
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUserInitial(nextUser?.email?.charAt(0).toUpperCase() ?? null);
      setUserName(getUserLabel((nextUser?.user_metadata ?? undefined) as Record<string, unknown> | undefined));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);
  function closeMenu() {
    setMenuOpen(false);
  }

  function handleDrawerTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartY(event.changedTouches[0]?.clientY ?? null);
  }

  function handleDrawerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const endY = event.changedTouches[0]?.clientY;
    if (touchStartY !== null && endY - touchStartY > 85) {
      closeMenu();
    }
    setTouchStartY(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setAccountMenuOpen(false);
    router.push("/auth");
    router.refresh();
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[#F0EDE8] bg-white/92 backdrop-blur-md transition-all",
          compact ? "shadow-[0_8px_26px_rgba(30,24,16,0.06)]" : "",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl items-center justify-between px-4 transition-all",
            compact ? "h-12 md:h-[60px]" : "h-14 md:h-[72px]",
          )}
        >
          <Link href="/" className="min-h-12 min-w-12 py-2 text-left">
            <span className="font-serif text-[20px] leading-none text-[#1E1810] md:text-[30px]">
              Effegi<span className="italic text-[#D4918F]">Lab</span>
            </span>
          </Link>

          <nav
            className="relative hidden items-center gap-7 md:flex"
            onMouseLeave={() => setShowMega(false)}
          >
            <button
              type="button"
              onMouseEnter={() => setShowMega(true)}
              onFocus={() => setShowMega(true)}
              className="inline-flex min-h-12 items-center text-sm font-medium text-[#1E1810]"
            >
              Per Evento
            </button>
            {desktopNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-12 items-center text-sm font-medium text-[#5C5048]",
                  pathname.startsWith(item.href) ? "text-[#1E1810]" : "",
                )}
              >
                {item.label}
              </Link>
            ))}

            {showMega ? (
              <div className="absolute left-0 top-full mt-1 grid min-w-[620px] grid-cols-[1.3fr_1fr] gap-5 rounded-2xl border border-[#E8E0D6] bg-white p-5 shadow-xl">
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#9C9088]">
                    Per Evento
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {eventLinks.map((eventLink) => (
                      <Link
                        key={eventLink.href}
                        href={eventLink.href}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm text-[#5C5048] hover:bg-[#F8F6F2]"
                      >
                        <span aria-hidden>{eventLink.icon}</span>
                        {eventLink.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  href="/collezioni/amalfi-coast"
                  className="rounded-2xl border border-[#E8E0D6] bg-gradient-to-br from-[#F8F6F2] via-[#F4ECEB] to-[#E8B4B4]/40 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[#9C9088]">Featured Collection</p>
                  <p className="mt-2 font-serif text-3xl italic text-[#1E1810]">Amalfi Coast</p>
                  <p className="mt-2 text-sm text-[#5C5048]">Partecipazioni, coordinati e dettagli eleganti.</p>
                  <p className="mt-4 text-sm font-medium text-[#1E1810] underline">Vedi tutto</p>
                </Link>
              </div>
            ) : null}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#5C5048] md:hidden"
              aria-label="Apri ricerca"
            >
              <Search size={18} />
            </button>

            <div className="hidden md:flex md:items-center md:gap-2">
              <div className="flex h-12 min-w-[210px] items-center rounded-full border border-[#ECE4D9] bg-[#FAF8F4] px-4">
                <Search size={16} className="text-[#8B7E74]" />
                <input
                  aria-label="Cerca prodotti"
                  type="text"
                  placeholder="Cerca partecipazioni"
                  className="ml-2 w-full bg-transparent text-sm text-[#1E1810] outline-none placeholder:text-[#9C9088]"
                />
              </div>
            </div>

            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((current) => !current)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#E8DED2] bg-white px-4 text-sm font-medium text-[#1E1810]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F6E9E8] text-xs font-semibold">
                    {userInitial}
                  </span>
                  <span className="max-w-[92px] truncate">{userName}</span>
                </button>

                {accountMenuOpen ? (
                  <div className="absolute right-0 top-[56px] w-48 rounded-2xl border border-[#E8DED2] bg-white p-2 shadow-lg">
                    <Link
                      href="/account"
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm text-[#1E1810] hover:bg-[#F8F4EE]"
                    >
                      Account
                    </Link>
                    <Link
                      href="/account"
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm text-[#1E1810] hover:bg-[#F8F4EE]"
                    >
                      Ordini
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-[#A24D49] hover:bg-[#FDF0EF]"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden min-h-12 items-center px-2 text-sm font-medium text-[#5C5048] hover:text-[#1E1810] md:inline-flex"
              >
                Accedi
              </Link>
            )}

            <button
              type="button"
              onClick={() => toggleCart(true)}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-full text-[#5C5048]"
              aria-label="Apri carrello"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 ? (
                <span className="absolute right-1.5 top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4918F] px-1 text-[11px] font-semibold text-white">
                  {totalItems}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#5C5048] md:hidden"
              aria-label="Apri menu"
            >
              <Menu size={20} />
            </button>

            <Link
              href="https://effegi-lab2.reservio.com/booking"
              target="_blank"
              className="hidden min-h-12 items-center rounded-full border border-[#E8D6D0] bg-[#FAF2EF] px-5 text-sm font-medium text-[#1E1810] md:inline-flex"
            >
              Richiedi Consulenza
            </Link>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/50 transition-opacity md:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMenu}
        role="presentation"
      />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[71] max-h-[92vh] rounded-t-[24px] border-t border-[#EFE8DE] bg-white p-4 pb-[max(20px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out md:hidden",
          menuOpen ? "translate-y-0" : "translate-y-full",
        )}
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
      >
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#DDD4C9]" />
        <div className="mb-5 flex items-center justify-between">
          <p className="font-serif text-[28px] italic text-[#1E1810]">Menu</p>
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#EFE6DC] text-[#5C5048]"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto pb-4">
          {mobileMenuLinks.map((group) => (
            <section key={group.title}>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9C9088]">{group.title}</p>
              <div className="space-y-1">
                {group.links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 text-[22px] leading-tight text-[#1E1810]"
                  >
                    <span className="text-base" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="font-serif">{item.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="space-y-3 border-t border-[#EFE7DD] pt-4">
          <Link
            href={isLoggedIn ? "/account" : "/auth"}
            onClick={closeMenu}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#E8DED2] bg-white px-4 text-sm font-medium text-[#1E1810]"
          >
            <UserRound size={16} />
            {isLoggedIn ? "Il mio account" : "Accedi / Registrati"}
          </Link>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#EDC6C3] px-4 text-sm font-medium text-[#A24D49]"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : null}

          <Link
            href="https://wa.me/393333333333"
            target="_blank"
            className="flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white"
          >
            WhatsApp Assistenza
          </Link>
          <p className="text-center text-xs text-[#7F736A]">Spedizione gratuita da 150€ · Coupon LAB15 attivo</p>
        </div>
      </div>

      <BottomMobileNav />
    </>
  );
}
