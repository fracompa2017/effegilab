import Link from "next/link";

import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { HeroSection } from "@/components/shop/HeroSection";
import { HowItWorks } from "@/components/shop/HowItWorks";
import { ProductCard } from "@/components/shop/ProductCard";
import { SocialProof } from "@/components/shop/SocialProof";
import { TrustBar } from "@/components/shop/TrustBar";
import { getCollectionsServer, getProductsServer } from "@/lib/server-queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { PageBlock } from "@/types";

const stats = [
  { icon: "🎨", value: "68+", label: "prodotti" },
  { icon: "⭐", value: "500+", label: "spose felici" },
  { icon: "🏆", value: "10+", label: "anni" },
];

const categories = [
  {
    name: "Wedding",
    emoji: "💍",
    href: "/shop?categoria=wedding",
    gradient: "from-[#F9E4E4] to-[#E8B4B4]",
  },
  {
    name: "Promessa",
    emoji: "💑",
    href: "/shop?categoria=promessa",
    gradient: "from-[#EDE8F5] to-[#B8B0D4]",
  },
  {
    name: "Nascita",
    emoji: "👶",
    href: "/shop?categoria=nascita",
    gradient: "from-[#E8F4F9] to-[#B0CED4]",
  },
  {
    name: "Comunione",
    emoji: "✝️",
    href: "/shop?categoria=comunione",
    gradient: "from-[#F5F5F0] to-[#E0DDD5]",
  },
  {
    name: "Laurea",
    emoji: "🎓",
    href: "/shop?categoria=laurea",
    gradient: "from-[#E4F0E8] to-[#A8C4B0]",
  },
  {
    name: "Compleanni",
    emoji: "🎂",
    href: "/shop?categoria=compleanni",
    gradient: "from-[#F9EDE4] to-[#D4B4A0]",
  },
];

const supportedBlockTypes = new Set([
  "hero",
  "categories",
  "collections",
  "products",
  "how-it-works",
  "text-image",
  "banner-promo",
  "instagram",
  "reviews",
  "consult-banner",
  "spacer",
  "text",
]);

function normalizeHomepageBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as Array<Record<string, unknown>>)
    .filter((item) => Boolean(item && typeof item === "object" && item.id && item.type))
    .map((item, index) => ({
      id: String(item.id),
      type: String(item.type),
      props:
        item.props && typeof item.props === "object"
          ? (item.props as Record<string, unknown>)
          : Object.fromEntries(
              Object.entries(item).filter(([key]) => !["id", "type", "order", "props"].includes(key)),
            ),
      order: typeof item.order === "number" ? item.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

export default async function HomePage() {
  const supabase = await createClient();

  const [collections, productsResponse] = await Promise.all([
    getCollectionsServer(),
    getProductsServer({ page: 1, pageSize: 8, sort: "recenti" }),
  ]);

  const loadByPage = async (pageName: string) =>
    supabase
      .from("page_content")
      .select("page, blocks")
      .eq("page", pageName)
      .maybeSingle();

  let contentResponse = await loadByPage("homepage");
  if ((!contentResponse.data || !contentResponse.data.blocks) && !contentResponse.error) {
    contentResponse = await loadByPage("home");
  }

  const blocks = contentResponse.error ? [] : normalizeHomepageBlocks(contentResponse.data?.blocks);
  const supportedBlocks = blocks.filter((block) => supportedBlockTypes.has(block.type));

  if (supportedBlocks.length > 0) {
    return <BlockRenderer blocks={supportedBlocks} />;
  }

  const products = productsResponse.products;

  return (
    <div className="-mx-4 space-y-16 pb-10 md:-mx-8">
      <HeroSection />
      <TrustBar />

      <section className="bg-[#F8F6F2] px-4 md:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-3 border-y border-[#E6DDD2] py-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "text-center",
                index !== stats.length - 1 ? "border-r border-[#E6DDD2]" : "",
              )}
            >
              <p className="text-lg">{stat.icon}</p>
              <p className="font-serif text-[44px] leading-none text-[#D4918F] md:text-[52px]">{stat.value}</p>
              <p className="text-[12px] uppercase tracking-[0.12em] text-[#7A6F66]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 px-4 md:px-8">
        <header className="space-y-2 text-center">
          <h2 className="font-serif text-[32px] text-[#1E1810]">Cosa stai cercando?</h2>
          <p className="mx-auto max-w-xl text-sm text-[#6E635A]">
            Dalla partecipazione al tableau, tutto coordinato per il tuo evento
          </p>
        </header>

        <div className="no-scrollbar overflow-x-auto pb-2 md:hidden">
          <div className="grid w-max grid-flow-col gap-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className={cn(
                  "group relative flex h-[200px] w-[160px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b p-4 transition hover:scale-[1.02] hover:shadow-lg",
                  category.gradient,
                )}
              >
                <span className="text-5xl leading-none">{category.emoji}</span>
                <p className="font-serif text-[22px] italic text-white drop-shadow">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-6 gap-4 md:grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className={cn(
                "group relative flex h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b p-5 transition hover:scale-[1.02] hover:shadow-lg",
                category.gradient,
              )}
            >
              <span className="text-5xl leading-none">{category.emoji}</span>
              <p className="font-serif text-[24px] italic text-white drop-shadow">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 px-4 md:px-8">
        <header className="text-center">
          <h2 className="font-serif text-[36px] italic text-[#1E1810]">Le Nostre Collezioni</h2>
          <p className="text-sm text-[#6E635A]">Ogni collezione racconta una storia d&apos;amore</p>
        </header>

        <div className="no-scrollbar overflow-x-auto pb-1 md:hidden">
          <div className="grid w-max grid-flow-col gap-3">
            {collections.map((collection, index) => (
              <Link
                key={collection.slug}
                href={`/collezioni/${collection.slug}`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-[#E8DFD4] bg-gradient-to-b from-[#F6EFE8] to-[#EADCD3] p-4",
                  index === 0 ? "h-[340px] w-[280px]" : "h-[300px] w-[240px]",
                )}
                style={
                  collection.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(to top, rgba(30,24,16,0.7), rgba(30,24,16,0.1)), url(${collection.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1810]/60 via-transparent to-transparent" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="font-serif text-[22px] italic text-white">{collection.name}</p>
                  <p className="text-xs text-white/85">{collection.count} prodotti</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-4 gap-4 md:grid">
          {collections.map((collection, index) => (
            <Link
              key={collection.slug}
              href={`/collezioni/${collection.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-[#E8DFD4] p-4",
                index % 2 === 0 ? "h-[320px]" : "h-[280px]",
              )}
              style={
                collection.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(to top, rgba(30,24,16,0.72), rgba(30,24,16,0.15)), url(${collection.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {
                      background: "linear-gradient(180deg, #F6EFE8 0%, #EADCD3 100%)",
                    }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1810]/50 via-transparent to-transparent" />
              <div className="relative flex h-full flex-col justify-end">
                <p className="font-serif text-[24px] italic text-white">{collection.name}</p>
                <p className="text-xs text-white/90">{collection.count} prodotti</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 px-4 md:px-8">
        <header className="text-center">
          <h2 className="font-serif text-[36px] text-[#1E1810]">I Più Richiesti</h2>
          <p className="text-sm text-[#6E635A]">I prodotti scelti dalle nostre spose</p>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center">
          <Link href="/shop" className="text-sm font-medium text-[#1E1810] underline underline-offset-4">
            Vedi tutto il catalogo →
          </Link>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <HowItWorks />
      </section>

      <section className="px-4 md:px-8">
        <SocialProof />
      </section>

      <section className="bg-gradient-to-b from-[#F0E8E6] to-[#E8E4F0] px-4 py-[60px] text-center md:px-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="font-serif text-[36px] italic text-[#1E1810]">Non sai da dove iniziare?</h2>
          <p className="mx-auto max-w-md text-[15px] text-[#5C5048]">
            Prenota una consulenza gratuita con Giuseppina. Ti aiutiamo a scegliere lo stile perfetto per il tuo
            evento.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="https://effegi-lab2.reservio.com/booking"
              target="_blank"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-6 text-sm font-medium text-white"
            >
              Prenota Consulenza
            </Link>
            <Link
              href="https://wa.me/393333333333"
              target="_blank"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D4918F] bg-white px-6 text-sm font-medium text-[#D4918F]"
            >
              Scrivici su WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
