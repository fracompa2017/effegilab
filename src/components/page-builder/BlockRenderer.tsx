import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/shop/ProductCard";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Category, PageBlock, Product } from "@/types";

type BlockRendererProps = {
  blocks: PageBlock[];
};

type GradientPreset = "rose" | "sage" | "lavender" | "peach";

const gradientClasses: Record<GradientPreset, string> = {
  rose: "from-[#F8F6F2] via-[#F3E6E3] to-[#E8B4B4]/55",
  sage: "from-[#F8F6F2] via-[#EAF2ED] to-[#A8C4B0]/55",
  lavender: "from-[#F8F6F2] via-[#EEEAF8] to-[#B8B0D4]/55",
  peach: "from-[#F8F6F2] via-[#F9EBDD] to-[#F4C7A1]/55",
};

const emptyText = "in costruzione";

const fallbackReviews = [
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

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asGradient(value: unknown): GradientPreset {
  if (value === "rose" || value === "sage" || value === "lavender" || value === "peach") {
    return value;
  }
  return "rose";
}

function asColumns(value: unknown): 2 | 3 | 4 {
  if (value === 2 || value === 3 || value === 4) {
    return value;
  }
  return 4;
}

function toSteps(value: unknown): Array<{ number: string; title: string; description: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((step, index) => {
      if (!step || typeof step !== "object") {
        return null;
      }

      const record = step as Record<string, unknown>;
      const number = asString(record.number, String(index + 1));
      const title = asString(record.title);
      const description = asString(record.description);

      if (!title && !description) {
        return null;
      }

      return { number, title, description };
    })
    .filter(Boolean) as Array<{ number: string; title: string; description: string }>;
}

function normalizeBlock(block: PageBlock, index: number): PageBlock {
  const source = block as PageBlock & Record<string, unknown>;
  const reservedKeys = new Set(["id", "type", "props", "order"]);
  const existingProps =
    source.props && typeof source.props === "object"
      ? (source.props as Record<string, unknown>)
      : {};
  const hasExistingProps = Object.keys(existingProps).length > 0;

  const topLevelProps = Object.fromEntries(
    Object.entries(source).filter(
      ([key, value]) => !reservedKeys.has(key) && value !== undefined,
    ),
  );

  return {
    id: String(source.id),
    type: String(source.type),
    props: hasExistingProps ? existingProps : topLevelProps,
    order: typeof source.order === "number" ? source.order : index,
  };
}

function normalizeBlocks(blocks: PageBlock[]) {
  return blocks
    .filter((block) => Boolean(block?.id && block?.type))
    .map((block, index) => normalizeBlock(block, index))
    .sort((a, b) => a.order - b.order);
}

function renderHeroBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Ogni storia d'amore merita di essere raccontata");
  const subtitle = asString(block.props?.subtitle, "Wedding stationery artigianale su misura.");
  const ctaText = asString(block.props?.ctaText, "Scopri i prodotti");
  const ctaLink = asString(block.props?.ctaLink, "/shop");
  const ctaSecondaryText = asString(block.props?.ctaSecondaryText, "Contattaci");
  const ctaSecondaryLink = asString(block.props?.ctaSecondaryLink, "/contatti");
  const gradient = asGradient(block.props?.backgroundGradient);
  const emoji = asString(block.props?.emoji, "💍");

  return (
    <section
      key={block.id}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[#E7DFD4] bg-gradient-to-br px-6 py-14 sm:px-10 lg:px-16",
        gradientClasses[gradient],
      )}
    >
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#D4918F] bg-white/75 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#5C5048]">
          <span aria-hidden>{emoji}</span>
          Effegi Lab
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[#1E1810] sm:text-5xl">{title}</h1>
        <p className="max-w-2xl text-base text-[#5C5048] sm:text-lg">{subtitle}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={ctaLink || "/shop"}
            className="inline-flex items-center rounded-full bg-[#D4918F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#c47f7d]"
          >
            {ctaText}
          </Link>
          <Link
            href={ctaSecondaryLink || "/contatti"}
            className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-white px-6 py-3 text-sm font-medium text-[#5C5048] hover:border-[#A8C4B0]"
          >
            {ctaSecondaryText}
          </Link>
        </div>
      </div>
    </section>
  );
}

function renderCategoriesBlock(block: PageBlock, categories: Category[]) {
  const title = asString(block.props?.title, "Categorie evento");
  const subtitle = asString(block.props?.subtitle, "Scegli il tuo momento speciale");
  const showAll = asBoolean(block.props?.showAll, false);
  const visibleCategories = showAll ? categories : categories.slice(0, 7);

  return (
    <section key={block.id} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
        <p className="text-sm text-[#5C5048]">{subtitle}</p>
      </div>

      {visibleCategories.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?categoria=${category.slug}`}
              className="flex h-24 flex-col items-center justify-center rounded-2xl border border-[#E7DFD4] bg-white text-center transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Sparkles size={18} className="text-[#D4918F]" />
              <span className="mt-2 px-2 text-sm font-medium text-[#5C5048]">{category.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-6 text-sm text-[#5C5048]">
          Categorie {emptyText}
        </div>
      )}
    </section>
  );
}

function renderCollectionsBlock(
  block: PageBlock,
  collections: Array<{ name: string; imageUrl?: string }>,
) {
  const title = asString(block.props?.title, "Collezioni");
  const subtitle = asString(block.props?.subtitle, "Scopri le linee più amate");
  const maxItems = Math.max(1, asNumber(block.props?.maxItems, 8));
  const visibleCollections = collections.slice(0, maxItems);

  return (
    <section key={block.id} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
        <p className="text-sm text-[#5C5048]">{subtitle}</p>
      </div>

      {visibleCollections.length ? (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {visibleCollections.map((collection, index) => (
            <Link
              key={collection.name}
              href={`/collezioni/${collection.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "relative min-h-[150px] min-w-[220px] overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-[#1E1810]",
                index % 3 === 0 && "border-[#E8B4B4] from-[#fff] to-[#F8ECEB]",
                index % 3 === 1 && "border-[#A8C4B0] from-[#fff] to-[#EEF5F0]",
                index % 3 === 2 && "border-[#B8B0D4] from-[#fff] to-[#F1EEFA]",
              )}
            >
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  fill
                  loader={cloudinaryLoader}
                  sizes="220px"
                  className="object-cover opacity-15"
                />
              ) : null}
              <div className="relative">
                <p className="font-serif text-2xl">{collection.name}</p>
                <p className="mt-1 text-sm text-[#5C5048]">Scopri la linea completa</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-6 text-sm text-[#5C5048]">
          Collezioni {emptyText}
        </div>
      )}
    </section>
  );
}

function renderProductsBlock(block: PageBlock, products: Product[]) {
  const title = asString(block.props?.title, "I più amati");
  const subtitle = asString(block.props?.subtitle, "Prodotti selezionati");
  const columns = asColumns(block.props?.columns);
  const gridClass = columns === 2 ? "lg:grid-cols-2" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <section key={block.id} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
        <p className="text-sm text-[#5C5048]">{subtitle}</p>
      </div>

      {products.length ? (
        <div className={cn("grid gap-5 sm:grid-cols-2", gridClass)}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-6 text-sm text-[#5C5048]">
          Prodotti {emptyText}
        </div>
      )}
    </section>
  );
}

function renderHowItWorksBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Come funziona");
  const steps = toSteps(block.props?.steps);
  const visibleSteps = steps.length
    ? steps
    : [
        { number: "1", title: "Scegli il prodotto", description: "Seleziona inviti o coordinati più adatti." },
        { number: "2", title: "Ricevi la bozza", description: "Ti inviamo la bozza grafica su WhatsApp." },
        { number: "3", title: "Conferma", description: "Approvi il design prima della produzione." },
        { number: "4", title: "Consegna", description: "Produzione artigianale e spedizione rapida." },
      ];

  return (
    <section key={block.id} className="space-y-5">
      <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {visibleSteps.map((step) => (
          <article key={`${block.id}-${step.number}-${step.title}`} className="rounded-2xl border border-[#E7DFD4] bg-white p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-sm font-semibold text-[#D4918F]">
              {step.number}
            </span>
            <p className="mt-3 font-medium text-[#1E1810]">{step.title || emptyText}</p>
            <p className="mt-1 text-sm text-[#5C5048]">{step.description || emptyText}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderTextImageBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Racconta la tua storia");
  const text = asString(block.props?.text, emptyText);
  const imageUrl = asString(block.props?.imageUrl);
  const imagePosition = asString(block.props?.imagePosition, "right") === "left" ? "left" : "right";
  const ctaText = asString(block.props?.ctaText, "Scopri di più");
  const ctaLink = asString(block.props?.ctaLink, "/chi-siamo");

  return (
    <section key={block.id} className="rounded-3xl border border-[#D7CEC1] bg-white p-6 sm:p-8">
      <div
        className={cn(
          "grid gap-6 lg:grid-cols-2 lg:items-center",
          imagePosition === "left" ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : "",
        )}
      >
        <div className="space-y-3">
          <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
          <p className="text-[#5C5048]">{text}</p>
          <Link
            href={ctaLink || "/chi-siamo"}
            className="inline-flex rounded-full bg-[#D4918F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#c47f7d]"
          >
            {ctaText}
          </Link>
        </div>

        <div className="relative h-64 overflow-hidden rounded-2xl border border-[#E7DFD4] bg-[#F3ECE3] sm:h-80">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#5C5048]">Immagine {emptyText}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function renderTextBlock(block: PageBlock) {
  const html = asString(block.props?.content) || asString(block.props?.text);

  return (
    <section key={block.id} className="mx-auto max-w-3xl px-4 py-12">
      <div
        className="prose prose-lg font-jost text-foreground max-w-none text-[#1E1810]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

function renderBannerPromoBlock(block: PageBlock) {
  const text = asString(block.props?.text, "Promo speciale");
  const subtext = asString(block.props?.subtext, "Scopri le offerte attive");
  const backgroundColor = asString(block.props?.backgroundColor, "#E8B4B4");
  const ctaText = asString(block.props?.ctaText, "Scopri ora");
  const ctaLink = asString(block.props?.ctaLink, "/shop");

  return (
    <section
      key={block.id}
      className="rounded-3xl border border-black/5 px-6 py-7 sm:px-8"
      style={{ backgroundColor }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#5C5048]">Promo</p>
          <h2 className="font-serif text-4xl text-[#1E1810]">{text}</h2>
          <p className="mt-1 text-[#5C5048]">{subtext}</p>
        </div>
        <Link
          href={ctaLink || "/shop"}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-[#1E1810] hover:bg-[#f5f1ec]"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  );
}

function renderInstagramBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Instagram");
  const handle = asString(block.props?.handle, "@effegilab");
  const maxItems = Math.max(1, asNumber(block.props?.maxItems, 6));

  return (
    <section key={block.id} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
        <Link
          href={`https://instagram.com/${handle.replace("@", "")}`}
          className="text-sm font-medium text-[#5C5048] underline"
        >
          {handle}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: maxItems }).map((_, index) => (
          <div
            key={`${block.id}-ig-${index}`}
            className="flex aspect-square items-center justify-center rounded-2xl border border-[#E7DFD4] bg-gradient-to-br from-[#F7EFE8] to-[#EFE8DB] text-sm text-[#5C5048]"
          >
            Post {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

function renderReviewsBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Recensioni");
  const subtitle = asString(block.props?.subtitle, "Le parole delle nostre coppie");

  return (
    <section key={block.id} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-4xl text-[#1E1810]">{title}</h2>
        <p className="text-sm text-[#5C5048]">{subtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {fallbackReviews.map((review) => (
          <article key={`${block.id}-${review.name}`} className="rounded-2xl border border-[#E7DFD4] bg-white p-5">
            <BadgeCheck size={18} className="text-[#7EA890]" />
            <p className="mt-3 text-sm leading-relaxed text-[#5C5048]">{review.text}</p>
            <p className="mt-3 font-medium text-[#1E1810]">{review.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderConsultBannerBlock(block: PageBlock) {
  const title = asString(block.props?.title, "Consulenza personalizzata");
  const subtitle = asString(block.props?.subtitle, "Parliamo del tuo progetto");
  const text = asString(
    block.props?.text,
    "Ti aiutiamo a costruire coordinati unici per il tuo evento, dalla palette ai materiali.",
  );
  const ctaText = asString(block.props?.ctaText, "Prenota consulenza");
  const ctaLink = asString(block.props?.ctaLink, "https://effegi-lab2.reservio.com/booking");
  const ctaSecondaryText = asString(block.props?.ctaSecondaryText, "Scrivici su WhatsApp");
  const ctaSecondaryLink = asString(block.props?.ctaSecondaryLink, "https://wa.me/393333333333");

  return (
    <section key={block.id} className="rounded-3xl border border-[#D7CEC1] bg-white p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#7EA890]">{subtitle}</p>
          <h2 className="mt-2 font-serif text-4xl text-[#1E1810]">{title}</h2>
          <p className="mt-2 max-w-2xl text-[#5C5048]">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ctaLink}
            className="inline-flex items-center rounded-full bg-[#D4918F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#c47f7d]"
          >
            {ctaText}
          </Link>
          <Link
            href={ctaSecondaryLink}
            className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-white px-6 py-3 text-sm font-medium text-[#5C5048] hover:border-[#A8C4B0]"
          >
            {ctaSecondaryText}
          </Link>
        </div>
      </div>
    </section>
  );
}

function renderSpacerBlock(block: PageBlock) {
  const height = Math.max(0, asNumber(block.props?.height, 48));
  return <div key={block.id} style={{ height }} aria-hidden />;
}

function renderUnknownBlock(block: PageBlock) {
  return (
    <section key={block.id} className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-4 text-sm text-[#5C5048]">
      Blocco <strong>{block.type}</strong> non supportato.
    </section>
  );
}

async function fetchProductsForBlock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  block: PageBlock,
  categoriesBySlug: Map<string, string>,
) {
  const maxItems = Math.max(1, asNumber(block.props?.maxItems, 8));
  const categorySlug = asString(block.props?.categorySlug);
  const collectionName = asString(block.props?.collectionName);
  const categoryId = categorySlug ? categoriesBySlug.get(categorySlug) : undefined;

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(maxItems);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (collectionName) {
    query = query.eq("collection", collectionName);
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }

  return (data ?? []) as Product[];
}

export async function BlockRenderer({ blocks }: BlockRendererProps) {
  const orderedBlocks = normalizeBlocks(blocks);

  if (!orderedBlocks.length) {
    return null;
  }

  const needsCategories = orderedBlocks.some((block) => block.type === "categories" || block.type === "products");
  const needsCollections = orderedBlocks.some((block) => block.type === "collections");
  const needsProducts = orderedBlocks.some((block) => block.type === "products");

  const supabase = await createClient();

  let categories: Category[] = [];
  if (needsCategories) {
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    categories = (data ?? []) as Category[];
  }
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const collections: Array<{ name: string; imageUrl?: string }> = [];
  if (needsCollections) {
    const { data } = await supabase
      .from("products")
      .select("collection,images,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(120);

    const source = (data ?? []) as Array<{
      collection: string | null;
      images: string[] | null;
      is_active: boolean;
    }>;

    const seen = new Set<string>();
    for (const item of source) {
      if (!item.collection || seen.has(item.collection)) {
        continue;
      }
      seen.add(item.collection);
      collections.push({
        name: item.collection,
        imageUrl: item.images?.[0] ?? undefined,
      });
    }
  }

  const productsByBlockId = new Map<string, Product[]>();
  if (needsProducts) {
    const productBlocks = orderedBlocks.filter((block) => block.type === "products");
    const productsData = await Promise.all(
      productBlocks.map(async (block) => {
        const products = await fetchProductsForBlock(supabase, block, categoriesBySlug);
        return [block.id, products] as const;
      }),
    );

    for (const [blockId, products] of productsData) {
      productsByBlockId.set(blockId, products);
    }
  }

  return (
    <div className="space-y-12">
      {orderedBlocks.map((block) => {
        switch (block.type) {
          case "hero":
            return renderHeroBlock(block);
          case "categories":
            return renderCategoriesBlock(block, categories);
          case "collections":
            return renderCollectionsBlock(block, collections);
          case "products":
            return renderProductsBlock(block, productsByBlockId.get(block.id) ?? []);
          case "how-it-works":
            return renderHowItWorksBlock(block);
          case "text-image":
            return renderTextImageBlock(block);
          case "text":
            return renderTextBlock(block);
          case "banner-promo":
            return renderBannerPromoBlock(block);
          case "instagram":
            return renderInstagramBlock(block);
          case "reviews":
            return renderReviewsBlock(block);
          case "consult-banner":
            return renderConsultBannerBlock(block);
          case "spacer":
            return renderSpacerBlock(block);
          default:
            return renderUnknownBlock(block);
        }
      })}
    </div>
  );
}
