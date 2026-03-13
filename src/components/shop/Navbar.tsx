"use client";

import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";

import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MenuItem = {
  label: string;
  href: string;
};

type MenuSection = {
  title: string;
  href: string;
  items: MenuItem[];
};

const menuStructure = {
  wedding: {
    label: "Wedding",
    icon: "💍",
    href: "/shop?categoria=wedding",
    sections: [
      {
        title: "Partecipazioni",
        href: "/shop?categoria=partecipazioni",
        items: [
          { label: "Inviti in carta", href: "/shop?categoria=inviti-in-carta" },
          { label: "Inviti in carta Amalfi", href: "/shop?categoria=inviti-in-carta-amalfi" },
          { label: "Inviti in Plexiglass", href: "/shop?categoria=inviti-in-plexiglass" },
          { label: "Inviti in scatola", href: "/shop?categoria=inviti-in-scatola" },
          { label: "Campioni", href: "/shop?categoria=campioni" },
        ],
      },
      {
        title: "Cerimonia",
        href: "/shop?categoria=cerimonia",
        items: [
          { label: "Wedding Bags o Boxes", href: "/shop?categoria=wedding-bags-o-boxes" },
          { label: "Libri messa", href: "/shop?categoria=libri-messa" },
          { label: "Portariso o portapetali", href: "/shop?categoria=portariso-o-portapetali" },
          { label: "Lacrime di gioia", href: "/shop?categoria=lacrime-di-gioia" },
          { label: "Ventagli", href: "/shop?categoria=ventagli" },
          { label: "Portafedi", href: "/shop?categoria=portafedi" },
          { label: "Targhe paggetto", href: "/shop?categoria=targhe-paggetto" },
        ],
      },
      {
        title: "Ricevimento",
        href: "/shop?categoria=ricevimento",
        items: [
          { label: "Tableaux de mariage", href: "/shop?categoria=tableaux-de-mariage" },
          { label: "Segnatavolo", href: "/shop?categoria=segnatavolo" },
          { label: "Segnaposto", href: "/shop?categoria=segnaposto" },
          { label: "Menù", href: "/shop?categoria=menu" },
          { label: "Cake topper", href: "/shop?categoria=cake-topper" },
          { label: "Targhe", href: "/shop?categoria=targhe" },
        ],
      },
      {
        title: "Dettagli",
        href: "/shop?categoria=dettagli",
        items: [
          { label: "Fuoriporta", href: "/shop?categoria=fuoriporta" },
          { label: "Grucce", href: "/shop?categoria=grucce" },
        ],
      },
      {
        title: "Sweet Table",
        href: "/shop?categoria=sweet-table",
        items: [
          { label: "Segnagusto", href: "/shop?categoria=segnagusto" },
          { label: "Portaconfetti", href: "/shop?categoria=portaconfetti" },
          { label: "Scatole soft packaging", href: "/shop?categoria=scatole-soft-packaging" },
          { label: "Scatole rigide", href: "/shop?categoria=scatole-rigide" },
        ],
      },
      {
        title: "Coordinati",
        href: "/shop?categoria=coordinati",
        items: [
          { label: "Kit cerimonia", href: "/shop?categoria=kit-cerimonia" },
          { label: "Kit location", href: "/shop?categoria=kit-location" },
        ],
      },
      {
        title: "Gift Ideas",
        href: "/shop?categoria=gift-ideas",
        items: [
          { label: "Testimoni", href: "/shop?categoria=testimoni" },
          { label: "Sposi", href: "/shop?categoria=sposi" },
        ],
      },
    ] as MenuSection[],
  },
  collezioni: {
    label: "Collezioni",
    href: "/shop?collezione=amalfi-coast",
    items: [
      { label: "Amalfi Coast", href: "/collezioni/amalfi-coast" },
      { label: "Bridgerton", href: "/collezioni/bridgerton" },
      { label: "Dreamy Pink Rose", href: "/collezioni/dreamy-pink-rose" },
      { label: "Elegant Green", href: "/collezioni/elegant-green" },
      { label: "Flora Edition", href: "/collezioni/flora-edition" },
      { label: "Garden Passion", href: "/collezioni/garden-passion" },
      { label: "Lovely Sun", href: "/collezioni/lovely-sun" },
      { label: "Magic Travel", href: "/collezioni/magic-travel" },
      { label: "Mouline Rouge", href: "/collezioni/mouline-rouge" },
      { label: "Soft Blue Lovely", href: "/collezioni/soft-blue-lovely" },
    ] as MenuItem[],
  },
} as const;

const baseMobileLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Chi Siamo", href: "/chi-siamo" },
  { label: "Come Funziona", href: "/come-funziona" },
  { label: "Contatti", href: "/contatti" },
];

function BottomMobileNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const toggleCart = useCartStore((state) => state.toggleCart);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F0EDE8] bg-white/98 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="grid grid-cols-4 px-2">
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]",
            pathname === "/" ? "bg-[#F6EFEB] text-[#1E1810]" : "",
          )}
        >
          Home
        </Link>
        <Link
          href="/shop"
          className={cn(
            "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]",
            pathname.startsWith("/shop") ? "bg-[#F6EFEB] text-[#1E1810]" : "",
          )}
        >
          Shop
        </Link>
        <Link
          href="/collezioni/amalfi-coast"
          className={cn(
            "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]",
            pathname.startsWith("/collezioni") ? "bg-[#F6EFEB] text-[#1E1810]" : "",
          )}
        >
          Collezioni
        </Link>
        <button
          type="button"
          onClick={() => toggleCart(true)}
          className="relative inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xs font-medium text-[#5C5048]"
          aria-label="Apri carrello"
        >
          Carrello
          {totalItems > 0 ? (
            <span className="absolute right-2 top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4918F] px-1 text-[11px] font-semibold text-white">
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

  const firstName = typeof metadata.first_name === "string" ? metadata.first_name : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name : "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName.length > 0) {
    return fullName;
  }

  if (typeof metadata.name === "string" && metadata.name.trim().length > 0) {
    return metadata.name.trim();
  }

  return "Account";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalItems = useCartStore((state) => state.totalItems);

  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [openDesktopMenu, setOpenDesktopMenu] = useState<"wedding" | "collezioni" | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const [drawerLevel, setDrawerLevel] = useState<0 | 1 | 2>(0);
  const [activeRoot, setActiveRoot] = useState<"wedding" | "collezioni" | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [userName, setUserName] = useState("Account");
  const [userInitial, setUserInitial] = useState<string | null>(null);

  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const isLoggedIn = Boolean(userInitial);

  const selectedSection = useMemo(
    () => menuStructure.wedding.sections.find((section) => section.title === activeSection) ?? null,
    [activeSection],
  );

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen && !mobileSearchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, mobileSearchOpen]);

  useEffect(() => {
    if (mobileSearchOpen) {
      window.setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 20);
    }
  }, [mobileSearchOpen]);

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
    setDrawerLevel(0);
    setActiveRoot(null);
    setActiveSection(null);
  }

  function openRoot(root: "wedding" | "collezioni") {
    setActiveRoot(root);
    setActiveSection(null);
    setDrawerLevel(1);
  }

  function handleDrawerBack() {
    if (drawerLevel === 2) {
      setDrawerLevel(1);
      setActiveSection(null);
      return;
    }
    if (drawerLevel === 1) {
      setDrawerLevel(0);
      setActiveRoot(null);
      return;
    }
    closeMenu();
  }

  function handleDrawerTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartY(event.changedTouches[0]?.clientY ?? null);
  }

  function handleDrawerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const endY = event.changedTouches[0]?.clientY;
    if (touchStartY !== null && endY - touchStartY > 90) {
      closeMenu();
    }
    setTouchStartY(null);
  }

  function submitSearch(rawQuery: string) {
    const query = rawQuery.trim();
    const destination = query.length > 0 ? `/shop?q=${encodeURIComponent(query)}` : "/shop";

    setMobileSearchOpen(false);
    setDesktopSearchQuery(query);
    setMobileSearchQuery(query);
    router.push(destination);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    closeMenu();
    router.push("/auth");
    router.refresh();
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[#F0EDE8] bg-white/90 backdrop-blur-md transition-all",
          compact ? "shadow-[0_10px_28px_rgba(30,24,16,0.08)]" : "",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl items-center justify-between px-4 transition-all",
            compact ? "h-12 md:h-[60px]" : "h-14 md:h-[72px]",
          )}
        >
          <Link href="/" className="inline-flex min-h-12 min-w-12 items-center">
            <span className="font-serif text-[20px] leading-none text-[#1E1810] md:text-[30px]">
              Effegi<span className="italic text-[#D4918F]">Lab</span>
            </span>
          </Link>

          <nav className="relative hidden items-center gap-6 md:flex" onMouseLeave={() => setOpenDesktopMenu(null)}>
            <Link
              href="/"
              className={cn(
                "inline-flex min-h-12 min-w-12 items-center px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]",
                pathname === "/" ? "text-[#1E1810]" : "",
              )}
            >
              Home
            </Link>

            <button
              type="button"
              onMouseEnter={() => setOpenDesktopMenu("wedding")}
              onFocus={() => setOpenDesktopMenu("wedding")}
              className="inline-flex min-h-12 min-w-12 items-center gap-1 px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]"
            >
              Wedding
            </button>

            <button
              type="button"
              onMouseEnter={() => setOpenDesktopMenu("collezioni")}
              onFocus={() => setOpenDesktopMenu("collezioni")}
              className="inline-flex min-h-12 min-w-12 items-center gap-1 px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]"
            >
              Collezioni
            </button>

            <Link
              href="/chi-siamo"
              className="inline-flex min-h-12 min-w-12 items-center px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]"
            >
              Chi Siamo
            </Link>
            <Link
              href="/come-funziona"
              className="inline-flex min-h-12 min-w-12 items-center px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]"
            >
              Come Funziona
            </Link>
            <Link
              href="/contatti"
              className="inline-flex min-h-12 min-w-12 items-center px-1 text-sm font-medium text-[#5C5048] transition-colors hover:text-[#1E1810]"
            >
              Contatti
            </Link>

            <Link
              href="https://effegi-lab2.reservio.com/booking"
              target="_blank"
              className="inline-flex min-h-12 min-w-12 items-center rounded-full border border-[#E9D9D2] bg-[#FAF2EF] px-4 text-sm font-semibold text-[#1E1810]"
            >
              PRENDI UN APPUNTAMENTO
            </Link>

            {openDesktopMenu === "wedding" ? (
              <div className="absolute left-0 top-full z-40 mt-1 w-[960px] rounded-2xl border border-[#E8E0D6] bg-white p-6 shadow-2xl">
                <div className="grid grid-cols-[1fr_1fr_280px] gap-6">
                  <div className="grid gap-4">
                    {menuStructure.wedding.sections.slice(0, 4).map((section) => (
                      <div key={section.title}>
                        <Link href={section.href} className="inline-flex min-h-12 items-center font-serif text-[26px] italic text-[#1E1810]">
                          {section.title}
                        </Link>
                        <div className="mt-1 space-y-0.5">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex min-h-12 min-w-12 items-center rounded-xl px-3 text-sm text-[#5C5048] hover:bg-[#F8F6F2]"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4">
                    {menuStructure.wedding.sections.slice(4).map((section) => (
                      <div key={section.title}>
                        <Link href={section.href} className="inline-flex min-h-12 items-center font-serif text-[26px] italic text-[#1E1810]">
                          {section.title}
                        </Link>
                        <div className="mt-1 space-y-0.5">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex min-h-12 min-w-12 items-center rounded-xl px-3 text-sm text-[#5C5048] hover:bg-[#F8F6F2]"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/collezioni/amalfi-coast"
                    className="rounded-2xl border border-[#E8E0D6] bg-gradient-to-br from-[#F8F6F2] via-[#F4ECEB] to-[#E8B4B4]/50 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-[#9C9088]">Featured Collection</p>
                    <p className="mt-2 font-serif text-4xl italic leading-none text-[#1E1810]">Amalfi Coast</p>
                    <p className="mt-3 text-sm text-[#5C5048]">Partecipazioni, coordinati e dettagli artigianali per il tuo giorno speciale.</p>
                    <p className="mt-4 text-sm font-semibold text-[#1E1810] underline">Scopri la collezione</p>
                  </Link>
                </div>
              </div>
            ) : null}

            {openDesktopMenu === "collezioni" ? (
              <div className="absolute left-[120px] top-full z-40 mt-1 w-[320px] rounded-2xl border border-[#E8E0D6] bg-white p-3 shadow-xl">
                {menuStructure.collezioni.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-12 min-w-12 items-center rounded-xl px-3 text-sm text-[#5C5048] hover:bg-[#F8F6F2]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-[#5C5048] md:hidden"
              aria-label="Apri ricerca"
            >
              <Search size={18} />
            </button>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch(desktopSearchQuery);
              }}
              className="hidden md:block"
            >
              <div className="flex h-12 min-w-[220px] items-center rounded-full border border-[#ECE4D9] bg-[#FAF8F4] px-4">
                <Search size={16} className="text-[#8B7E74]" />
                <input
                  aria-label="Cerca prodotti"
                  type="text"
                  value={desktopSearchQuery}
                  onChange={(event) => setDesktopSearchQuery(event.target.value)}
                  placeholder="Cerca partecipazioni"
                  className="ml-2 w-full bg-transparent text-[16px] text-[#1E1810] outline-none placeholder:text-[#9C9088]"
                />
              </div>
            </form>

            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((current) => !current)}
                  className="inline-flex min-h-12 min-w-12 items-center gap-2 rounded-full border border-[#E8DED2] bg-white px-4 text-sm font-medium text-[#1E1810]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F6E9E8] text-xs font-semibold">
                    {userInitial}
                  </span>
                  <span className="max-w-[100px] truncate">{userName}</span>
                </button>

                {accountMenuOpen ? (
                  <div className="absolute right-0 top-[56px] w-52 rounded-2xl border border-[#E8DED2] bg-white p-2 shadow-lg">
                    <Link href="/account" className="flex min-h-12 items-center rounded-xl px-3 text-sm text-[#1E1810] hover:bg-[#F8F4EE]">
                      Account
                    </Link>
                    <Link href="/account?tab=ordini" className="flex min-h-12 items-center rounded-xl px-3 text-sm text-[#1E1810] hover:bg-[#F8F4EE]">
                      Ordini
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-[#A24D49] hover:bg-[#FDF0EF]"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/auth" className="hidden min-h-12 min-w-12 items-center px-2 text-sm font-semibold text-[#5C5048] hover:text-[#1E1810] md:inline-flex">
                Accedi
              </Link>
            )}

            <button
              type="button"
              onClick={() => toggleCart(true)}
              className="relative inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-[#5C5048]"
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
              onClick={() => {
                setMenuOpen(true);
                setDrawerLevel(0);
                setActiveRoot(null);
                setActiveSection(null);
              }}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-[#5C5048] md:hidden"
              aria-label="Apri menu"
            >
              <Menu size={20} />
            </button>
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
          "fixed inset-x-0 bottom-0 z-[71] h-[95vh] max-h-[95vh] rounded-t-[24px] border-t border-[#EFE8DE] bg-white transition-transform duration-300 ease-out md:hidden",
          menuOpen ? "translate-y-0" : "translate-y-full",
        )}
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
      >
        <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#DDD4C9]" />
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDrawerBack}
              className={cn(
                "inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#EFE6DC] text-[#5C5048]",
                drawerLevel === 0 ? "pointer-events-none opacity-0" : "",
              )}
              aria-label="Torna indietro"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#EFE6DC] text-[#5C5048]"
              aria-label="Chiudi menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative h-[calc(95vh-120px)] overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${drawerLevel * 100}%)` }}
            >
              <div className="w-full shrink-0 overflow-y-auto pb-6 pr-2">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => openRoot("wedding")}
                    className="flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-left font-serif text-[22px] italic text-[#1E1810]"
                  >
                    <span>WEDDING</span>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openRoot("collezioni")}
                    className="flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-left font-serif text-[22px] italic text-[#1E1810]"
                  >
                    <span>COLLEZIONI</span>
                    <ChevronRight size={18} />
                  </button>
                  {baseMobileLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className="flex min-h-12 items-center rounded-xl px-2 text-[22px] font-serif italic text-[#1E1810]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t border-[#EFE7DD] pt-4">
                  <Link
                    href={isLoggedIn ? "/account" : "/auth"}
                    onClick={closeMenu}
                    className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-[#E8DED2] px-4 text-[15px] font-medium text-[#1E1810]"
                  >
                    <UserRound size={16} />
                    {isLoggedIn ? "Il mio account" : "Accedi / Registrati"}
                  </Link>
                  <Link
                    href="https://wa.me/393333333333"
                    target="_blank"
                    className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[#25D366] px-5 text-[15px] font-semibold text-white"
                  >
                    WhatsApp
                  </Link>
                  <Link
                    href="https://effegi-lab2.reservio.com/booking"
                    target="_blank"
                    className="flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#E8D6D0] bg-[#FAF2EF] px-5 text-[15px] font-semibold text-[#1E1810]"
                  >
                    Prenota Appuntamento
                  </Link>
                  <p className="text-center text-xs text-[#7F736A]">Spedizione gratuita da 150€</p>
                </div>
              </div>

              <div className="w-full shrink-0 overflow-y-auto pb-6 pl-2 pr-2">
                {activeRoot === "wedding" ? (
                  <>
                    <p className="mb-3 px-1 font-serif text-[26px] italic text-[#1E1810]">Wedding</p>
                    <div className="space-y-1">
                      {menuStructure.wedding.sections.map((section) => (
                        <button
                          key={section.title}
                          type="button"
                          onClick={() => {
                            setActiveSection(section.title);
                            setDrawerLevel(2);
                          }}
                          className="flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-left text-[15px] font-medium text-[#1E1810]"
                        >
                          <span>{section.title}</span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {activeRoot === "collezioni" ? (
                  <>
                    <p className="mb-3 px-1 font-serif text-[26px] italic text-[#1E1810]">Collezioni</p>
                    <div className="space-y-1">
                      {menuStructure.collezioni.items.map((collection) => (
                        <Link
                          key={collection.href}
                          href={collection.href}
                          onClick={closeMenu}
                          className="flex min-h-12 items-center rounded-xl px-2 text-[15px] font-medium text-[#1E1810]"
                        >
                          {collection.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="w-full shrink-0 overflow-y-auto pb-6 pl-2 pr-2">
                {selectedSection ? (
                  <>
                    <p className="mb-3 px-1 font-serif text-[26px] italic text-[#1E1810]">{selectedSection.title}</p>
                    <Link
                      href={selectedSection.href}
                      onClick={closeMenu}
                      className="mb-2 flex min-h-12 items-center rounded-xl border border-[#ECE2D8] px-3 text-[15px] font-semibold text-[#1E1810]"
                    >
                      Vedi tutti {selectedSection.title}
                    </Link>
                    <div className="space-y-1">
                      {selectedSection.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          className="flex min-h-12 items-center rounded-xl px-2 text-[15px] font-normal text-[#5C5048]"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-[75] bg-black/50 transition-opacity md:hidden",
          mobileSearchOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileSearchOpen(false)}
        role="presentation"
      />
      <div
        className={cn(
          "fixed inset-0 z-[76] bg-white transition-transform duration-300 ease-out md:hidden",
          mobileSearchOpen ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(mobileSearchQuery);
          }}
          className="flex h-full flex-col px-4 pt-[max(16px,env(safe-area-inset-top))]"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="font-serif text-[28px] italic text-[#1E1810]">Cerca</p>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#EFE6DC] text-[#5C5048]"
              aria-label="Chiudi ricerca"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center rounded-2xl border border-[#ECE2D7] bg-[#FAF8F4] px-4">
            <Search size={18} className="text-[#8B7E74]" />
            <input
              ref={mobileSearchInputRef}
              type="search"
              value={mobileSearchQuery}
              onChange={(event) => setMobileSearchQuery(event.target.value)}
              placeholder="Cerca prodotti, collezioni..."
              className="ml-3 h-14 w-full bg-transparent text-[16px] text-[#1E1810] outline-none placeholder:text-[#9C9088]"
            />
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[#D4918F] px-6 text-[15px] font-semibold text-white"
          >
            Cerca
          </button>
        </form>
      </div>

      <BottomMobileNav />
    </>
  );
}
