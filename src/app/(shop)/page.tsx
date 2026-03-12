import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { CategoryGrid } from "@/components/shop/CategoryGrid";
import { CollectionsCarousel } from "@/components/shop/CollectionsCarousel";
import { HeroSection } from "@/components/shop/HeroSection";
import { HowItWorks } from "@/components/shop/HowItWorks";
import { ProductCard } from "@/components/shop/ProductCard";
import { SocialProof } from "@/components/shop/SocialProof";
import { TrustBar } from "@/components/shop/TrustBar";
import { UrgencyBanner } from "@/components/shop/UrgencyBanner";
import { createClient } from "@/lib/supabase/server";
import type { PageBlock, Product } from "@/types";

function normalizeHomepageBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as Array<Record<string, unknown>>)
    .filter((item) => Boolean(item && typeof item === "object" && item.id && item.type))
    .map((item, index) => {
      const props =
        item.props && typeof item.props === "object"
          ? (item.props as Record<string, unknown>)
          : Object.fromEntries(
              Object.entries(item).filter(([key]) => !["id", "type", "order", "props"].includes(key)),
            );

      return {
        id: String(item.id),
        type: String(item.type),
        props,
        order: typeof item.order === "number" ? item.order : index,
      };
    })
    .sort((a, b) => a.order - b.order);
}

async function getHomepageProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data ?? []) as Product[];
}

function ConsultBanner() {
  return (
    <section className="rounded-2xl border border-[#E8DED2] bg-white p-6 md:p-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#7EA890]">Consulenza personalizzata</p>
        <h2 className="font-serif text-[38px] italic leading-none text-[#1E1810]">
          Progettiamo insieme il tuo coordinato perfetto
        </h2>
        <p className="max-w-2xl text-sm text-[#5C5048]">
          Raccontaci stile, colori e dettagli del tuo evento: prepariamo una proposta dedicata con bozza gratuita.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="https://effegi-lab2.reservio.com/booking"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-6 text-sm font-medium text-white"
          >
            Prenota consulenza
          </a>
          <a
            href="https://wa.me/393333333333"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E8DED2] px-6 text-sm font-medium text-[#5C5048]"
          >
            Scrivici su WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function ProductGridSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-1 px-4 md:px-0">
        <h2 className="font-serif text-[32px] italic leading-none text-[#1E1810]">{title}</h2>
        {subtitle ? <p className="text-sm text-[#6E635A]">{subtitle}</p> : null}
      </header>
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:px-0 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [contentResponse, products] = await Promise.all([
    supabase
      .from("page_content")
      .select("page, blocks")
      .in("page", ["homepage", "home"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getHomepageProducts(),
  ]);

  const blocks = contentResponse.error ? [] : normalizeHomepageBlocks(contentResponse.data?.blocks);

  if (blocks.length > 0) {
    return (
      <div className="space-y-8">
        <UrgencyBanner type="coupon" expiryDate={new Date("2026-12-31T23:59:59")} />
        <BlockRenderer blocks={blocks} />
      </div>
    );
  }

  const bestsellers = products.slice(0, 8);
  const latestProducts = products.slice(0, 4);

  return (
    <div className="space-y-10 pb-6">
      <UrgencyBanner type="coupon" expiryDate={new Date("2026-12-31T23:59:59")} />
      <HeroSection />
      <TrustBar />
      <CategoryGrid title="Cosa stai cercando?" />
      <CollectionsCarousel title="Le Nostre Collezioni" subtitle="Ogni collezione racconta una storia" />
      <ProductGridSection
        title="I Più Amati"
        subtitle="I prodotti scelti da centinaia di spose"
        products={bestsellers}
      />
      <HowItWorks />
      <SocialProof />
      <ProductGridSection title="Ultimi Arrivi" products={latestProducts} />
      <ConsultBanner />
    </div>
  );
}
