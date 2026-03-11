"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Brush,
  HandHeart,
  MessageCircleHeart,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { ProductCard } from "@/components/shop/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

const heroSlides = [
  {
    title: "Ogni storia d'amore merita di essere raccontata",
    subtitle: "Partecipazioni artigianali, create su misura per il vostro giorno.",
    ctaLabel: "Scopri le Partecipazioni",
    ctaHref: "/shop?categoria=partecipazioni",
    bgClass: "from-[#F8F6F2] via-[#F3E6E3] to-[#E8B4B4]/45",
  },
  {
    title: "Kit cerimonia coordinati con stile unico",
    subtitle: "Dalla cerimonia al ricevimento, ogni dettaglio in armonia.",
    ctaLabel: "Vedi i Coordinati",
    ctaHref: "/shop?categoria=coordinati",
    bgClass: "from-[#F8F6F2] via-[#EAF2ED] to-[#A8C4B0]/45",
  },
  {
    title: "Tableaux & ricevimento da sogno",
    subtitle: "Allestimenti grafici eleganti per stupire i tuoi ospiti.",
    ctaLabel: "Esplora il Ricevimento",
    ctaHref: "/shop?categoria=ricevimento",
    bgClass: "from-[#F8F6F2] via-[#EEEAF8] to-[#B8B0D4]/45",
  },
];

const trustBadges = [
  { icon: HandHeart, label: "Handmade" },
  { icon: Brush, label: "Bozza inclusa" },
  { icon: Truck, label: "Spedizione gratis" },
  { icon: PackageCheck, label: "Consegna 7gg" },
  { icon: MessageCircleHeart, label: "Supporto WhatsApp" },
  { icon: ShieldCheck, label: "Pagamento sicuro" },
];

const eventCategories = [
  "Wedding",
  "Promessa",
  "Nascita & Battesimo",
  "Comunione",
  "Laurea",
  "Compleanni",
  "Collezioni",
];

const collections = [
  "Amalfi Coast",
  "Bridgerton",
  "Dreamy Pink Rose",
  "Elegant Green",
  "Flora Edition",
  "Mouline Rouge",
  "Dust Lavender",
  "Sage & Pearl",
  "Classic Ivory",
  "Modern Script",
];

const reviews = [
  {
    name: "Francesca & Luca",
    text: "Servizio impeccabile: bozza rapida su WhatsApp e risultato finale meraviglioso.",
  },
  {
    name: "Ilaria R.",
    text: "Qualità carta altissima e design elegante. Tutti gli invitati ci hanno fatto i complimenti.",
  },
  {
    name: "Valentina M.",
    text: "Consegna precisa in una settimana e supporto sempre presente. Super consigliati.",
  },
];

async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export function HomepageClient() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const productsQuery = useQuery({
    queryKey: ["home-products"],
    queryFn: fetchProducts,
  });

  const categoriesQuery = useQuery({
    queryKey: ["home-categories"],
    queryFn: fetchCategories,
  });

  const slidesCount = heroSlides.length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [slidesCount]);

  const featuredProducts = useMemo(
    () => (productsQuery.data ?? []).slice(0, 8),
    [productsQuery.data],
  );

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#E7DFD4] bg-white">
        <div className="relative h-[440px]">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.title}
              className={cn(
                "absolute inset-0 flex items-center bg-gradient-to-br px-6 transition-opacity duration-700 sm:px-10 lg:px-16",
                slide.bgClass,
                currentSlide === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className="max-w-2xl space-y-4">
                <p className="inline-flex rounded-full border border-[#D4918F] bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#5C5048]">
                  Wedding Stationery Artigianale
                </p>
                <h1 className="font-serif text-4xl leading-tight text-[#1E1810] sm:text-5xl">
                  {slide.title}
                </h1>
                <p className="max-w-xl text-base text-[#5C5048] sm:text-lg">{slide.subtitle}</p>
                <Link
                  href={slide.ctaHref}
                  className="inline-flex items-center rounded-full bg-[#D4918F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#c57f7d]"
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "h-2.5 w-8 rounded-full transition",
                currentSlide === index ? "bg-[#1E1810]" : "bg-[#1E1810]/25",
              )}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Vai alla slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-[#E7DFD4] bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        {trustBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex items-center gap-2 rounded-xl bg-[#F8F6F2] px-3 py-2">
              <Icon size={16} className="text-[#7EA890]" />
              <span className="text-sm font-medium text-[#5C5048]">{badge.label}</span>
            </div>
          );
        })}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-4xl text-[#1E1810]">Categorie evento</h2>
          <p className="text-sm text-[#5C5048]">Scegli il tuo momento speciale</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {eventCategories.map((category) => (
            <Link
              key={category}
              href="/shop"
              className="flex h-24 flex-col items-center justify-center rounded-2xl border border-[#E7DFD4] bg-white text-center transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Sparkles size={18} className="text-[#D4918F]" />
              <span className="mt-2 text-sm font-medium text-[#5C5048]">{category}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(categoriesQuery.data ?? []).map((category) => (
            <span
              key={category.id}
              className="rounded-full border border-[#D7CEC1] bg-white px-3 py-1 text-xs font-medium text-[#5C5048]"
            >
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-serif text-4xl text-[#1E1810]">Collezioni</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {collections.map((collection, index) => (
            <Link
              key={collection}
              href={`/collezioni/${collection.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "min-w-[220px] rounded-2xl border bg-gradient-to-br p-5 text-[#1E1810]",
                index % 3 === 0 && "border-[#E8B4B4] from-[#fff] to-[#F8ECEB]",
                index % 3 === 1 && "border-[#A8C4B0] from-[#fff] to-[#EEF5F0]",
                index % 3 === 2 && "border-[#B8B0D4] from-[#fff] to-[#F1EEFA]",
              )}
            >
              <p className="font-serif text-2xl">{collection}</p>
              <p className="mt-1 text-sm text-[#5C5048]">Scopri la linea completa</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-4xl text-[#1E1810]">I più amati</h2>
          <p className="text-sm text-[#5C5048]">Dati live da Supabase</p>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-[#E7DFD4] bg-white">
                <div className="h-56 animate-pulse bg-[#EFE8DB]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#EFE8DB]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#EFE8DB]" />
                </div>
              </div>
            ))}
          </div>
        ) : productsQuery.error ? (
          <div className="rounded-2xl border border-[#E8B4B4] bg-[#FFF5F5] p-5 text-[#5C5048]">
            Non sono riuscito a caricare i prodotti in questo momento.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="font-serif text-4xl text-[#1E1810]">Come funziona</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            "Scegli il prodotto",
            "Ricevi la bozza grafica",
            "Confermi su WhatsApp",
            "Produzione e consegna",
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-[#E7DFD4] bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-sm font-semibold text-[#D4918F]">
                {index + 1}
              </span>
              <p className="mt-3 font-medium text-[#1E1810]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-4xl text-[#1E1810]">Instagram</h2>
          <Link href="https://instagram.com" className="text-sm font-medium text-[#5C5048] underline">
            @effegilab
          </Link>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex aspect-square items-center justify-center rounded-2xl border border-[#E7DFD4] bg-gradient-to-br from-[#F7EFE8] to-[#EFE8DB] text-sm text-[#5C5048]"
            >
              Post {index + 1}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-serif text-4xl text-[#1E1810]">Recensioni</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-2xl border border-[#E7DFD4] bg-white p-5">
              <BadgeCheck size={18} className="text-[#7EA890]" />
              <p className="mt-3 text-sm leading-relaxed text-[#5C5048]">{review.text}</p>
              <p className="mt-3 font-medium text-[#1E1810]">{review.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#D7CEC1] bg-white p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#7EA890]">Consulenza personalizzata</p>
            <h2 className="mt-2 font-serif text-4xl text-[#1E1810]">Prenota una call creativa con Effegi Lab</h2>
            <p className="mt-2 max-w-2xl text-[#5C5048]">
              Ti aiutiamo a costruire coordinati unici per il tuo evento. Dalla palette ai materiali,
              ogni dettaglio viene definito insieme.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://effegi-lab2.reservio.com/booking"
              className="inline-flex items-center rounded-full bg-[#D4918F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#c47f7d]"
            >
              Prenota consulenza
            </Link>
            <Link
              href="https://wa.me/393333333333"
              className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-white px-6 py-3 text-sm font-medium text-[#5C5048] hover:border-[#A8C4B0]"
            >
              Scrivici su WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
