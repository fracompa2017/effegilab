import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type WooCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  menu_order: number;
};

type WooImage = {
  id: number;
  src: string;
};

type WooTag = {
  id: number;
  name: string;
  slug: string;
};

type WooMetaData = {
  id: number;
  key: string;
  value: unknown;
};

type WooProductCategoryRef = {
  id: number;
  slug: string;
  name: string;
};

type WooProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  price_html: string;
  images: WooImage[];
  categories: WooProductCategoryRef[];
  tags: WooTag[];
  status: string;
  virtual: boolean;
  manage_stock: boolean;
  stock_quantity: number | null;
  meta_data: WooMetaData[];
  type: "simple" | "variable" | string;
};

type ImportStats = {
  categoriesImported: number;
  productsImported: number;
  totalProducts: number;
  errorSlugs: string[];
};

type WooConfig = {
  url: string;
  key: string;
  secret: string;
};

type CategoryMaps = {
  byWooId: Map<number, string>;
  bySlug: Map<string, string>;
};

// Supabase JS generic schema typing is not configured in this repository.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdminClient = ReturnType<typeof createClient<any>>;

const BATCH_SIZE = 10;
const WOO_PER_PAGE = 100;

const supportedCollections = [
  "Amalfi Coast",
  "Bridgerton",
  "Dreamy Pink Rose",
  "Elegant Green",
  "Flora Edition",
  "Mouline Rouge",
  "Dust Lavender",
  "Sage & Pearl",
  "Springtime",
  "Classic Boho",
];

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const splitIndex = line.indexOf("=");
    if (splitIndex <= 0) {
      continue;
    }

    const key = line.slice(0, splitIndex).trim();
    const value = line.slice(splitIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile ambiente mancante: ${name}`);
  }
  return value;
}

function getWooConfig(): WooConfig {
  return {
    url: getRequiredEnv("WOOCOMMERCE_URL"),
    key: getRequiredEnv("WOOCOMMERCE_KEY"),
    secret: getRequiredEnv("WOOCOMMERCE_SECRET"),
  };
}

// Strip HTML tags dalla descrizione
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function parsePriceToken(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return 0;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePrice(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return 0;
  }
  return parsePriceToken(value);
}

// Estrai prezzo minimo e massimo da stringa HTML prezzo
function extractPrices(priceHtml: string): { min: number; max: number } {
  const matches = priceHtml.match(/[\d,.]+/g);
  if (!matches) {
    return { min: 0, max: 0 };
  }

  const prices = matches.map((price) => parsePriceToken(price)).filter((price) => price > 0);
  if (!prices.length) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// Trova collezione dai tag del prodotto
function findCollection(tags: { name: string }[]): string | null {
  for (const tag of tags) {
    const match = supportedCollections.find(
      (collection) => collection.toLowerCase() === tag.name.toLowerCase(),
    );
    if (match) {
      return match;
    }
  }
  return null;
}

function findCollectionFromMeta(metaData: WooMetaData[]): string | null {
  for (const item of metaData) {
    const key = (item.key ?? "").toLowerCase();
    if (key !== "collezione" && key !== "collection") {
      continue;
    }

    if (typeof item.value === "string") {
      const valueLower = item.value.toLowerCase();
      const match = supportedCollections.find(
        (collection) => collection.toLowerCase() === valueLower,
      );
      if (match) {
        return match;
      }
    }
  }

  return null;
}

function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function fetchWooCollection<T>(resource: "products" | "products/categories", config: WooConfig) {
  const allItems: T[] = [];
  let page = 1;
  let totalPages: number | null = null;

  while (totalPages === null || page <= totalPages) {
    const url = new URL(`/wp-json/wc/v3/${resource}`, config.url);
    url.searchParams.set("consumer_key", config.key);
    url.searchParams.set("consumer_secret", config.secret);
    url.searchParams.set("per_page", String(WOO_PER_PAGE));
    url.searchParams.set("page", String(page));

    const response = await fetch(url);

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(
        `WooCommerce ${resource} pagina ${page} errore ${response.status}: ${errorPayload}`,
      );
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error(`Risposta WooCommerce non valida su ${resource} pagina ${page}.`);
    }

    const rows = payload as T[];
    if (!rows.length) {
      break;
    }

    allItems.push(...rows);

    const totalPagesHeader = response.headers.get("x-wp-totalpages");
    if (totalPagesHeader) {
      const parsed = Number.parseInt(totalPagesHeader, 10);
      if (Number.isFinite(parsed)) {
        totalPages = parsed;
      }
    }

    console.log(
      `[Woo] ${resource}: pagina ${page}${totalPages ? `/${totalPages}` : ""} (${allItems.length})`,
    );

    if (rows.length < WOO_PER_PAGE && totalPages === null) {
      break;
    }

    page += 1;
  }

  return allItems;
}

async function importCategories(
  wooCategories: WooCategory[],
  supabase: SupabaseAdminClient,
): Promise<{ maps: CategoryMaps; imported: number }> {
  if (!wooCategories.length) {
    return {
      maps: { byWooId: new Map(), bySlug: new Map() },
      imported: 0,
    };
  }

  const payload = wooCategories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: stripHtml(category.description ?? ""),
    sort_order: Number.isFinite(category.menu_order) ? category.menu_order : 0,
  }));

  const { error: upsertError } = await supabase
    .from("categories")
    .upsert(payload, { onConflict: "slug" });

  if (upsertError) {
    throw new Error(`Errore upsert categorie: ${upsertError.message}`);
  }

  const slugChunks = chunkArray(
    [
      ...new Set(
        wooCategories
          .map((category) => category.slug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ],
    100,
  );

  const bySlug = new Map<string, string>();
  for (const chunk of slugChunks) {
    const { data, error } = await supabase.from("categories").select("id,slug").in("slug", chunk);
    if (error) {
      throw new Error(`Errore lettura categorie importate: ${error.message}`);
    }

    for (const row of data ?? []) {
      bySlug.set(String(row.slug), String(row.id));
    }
  }

  const byWooId = new Map<number, string>();
  for (const category of wooCategories) {
    const supabaseId = bySlug.get(category.slug);
    if (supabaseId) {
      byWooId.set(category.id, supabaseId);
    }
  }

  for (const category of wooCategories) {
    if (!category.parent || category.parent <= 0) {
      continue;
    }

    const childId = byWooId.get(category.id);
    const parentId = byWooId.get(category.parent);
    if (!childId || !parentId) {
      continue;
    }

    const { error } = await supabase
      .from("categories")
      .update({ parent_id: parentId })
      .eq("id", childId);

    if (error) {
      console.warn(`Impossibile aggiornare parent per categoria ${category.slug}: ${error.message}`);
    }
  }

  return {
    maps: { byWooId, bySlug },
    imported: wooCategories.length,
  };
}

function transformWooProduct(
  product: WooProduct,
  maps: CategoryMaps,
) {
  const cleanedDescription = stripHtml(product.description ?? "");
  const fallbackDescription = stripHtml(product.short_description ?? "");
  const finalDescription = cleanedDescription || fallbackDescription;

  const regularPrice = normalizePrice(product.regular_price);
  const salePrice = normalizePrice(product.sale_price);
  const effectivePrice = salePrice > 0 ? salePrice : regularPrice;

  const hasVariants = product.type === "variable";
  const extracted = extractPrices(product.price_html ?? "");
  const rangeMin = hasVariants ? (extracted.min > 0 ? extracted.min : effectivePrice) : effectivePrice;
  const rangeMax = hasVariants ? (extracted.max > 0 ? extracted.max : effectivePrice) : effectivePrice;

  const images = (product.images ?? []).map((image) => image.src).filter(Boolean);
  const firstCategory = product.categories?.[0];

  let categoryId: string | null = null;
  if (firstCategory) {
    categoryId =
      maps.byWooId.get(firstCategory.id) ??
      maps.bySlug.get(firstCategory.slug) ??
      null;
  }

  const collectionFromMeta = findCollectionFromMeta(product.meta_data ?? []);
  const collection = collectionFromMeta ?? findCollection(product.tags ?? []);

  const stock = product.manage_stock ? Math.max(product.stock_quantity ?? 0, 0) : 999;
  const slug = product.slug?.trim() || `woo-${product.id}`;

  return {
    name: product.name?.trim() || `Prodotto Woo ${product.id}`,
    slug,
    description: finalDescription || null,
    price: effectivePrice,
    price_min: rangeMin,
    price_max: rangeMax,
    images,
    category_id: categoryId,
    collection,
    is_customizable: true,
    has_variants: hasVariants,
    stock,
    is_active: product.status === "publish",
    seo_title: product.name?.trim() || null,
    seo_description: finalDescription ? finalDescription.slice(0, 320) : null,
  };
}

async function importProducts(
  wooProducts: WooProduct[],
  maps: CategoryMaps,
  supabase: SupabaseAdminClient,
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  let processed = 0;
  const errors: string[] = [];

  for (const batch of chunkArray(wooProducts, BATCH_SIZE)) {
    await Promise.all(
      batch.map(async (product) => {
        const payload = transformWooProduct(product, maps);

        try {
          const { error } = await supabase
            .from("products")
            .upsert(payload, { onConflict: "slug" });

          if (error) {
            errors.push(payload.slug);
            console.error(`[Errore prodotto] ${payload.slug}: ${error.message}`);
          } else {
            imported += 1;
          }
        } catch (error) {
          errors.push(payload.slug);
          console.error(
            `[Errore prodotto] ${payload.slug}: ${
              error instanceof Error ? error.message : "errore sconosciuto"
            }`,
          );
        } finally {
          processed += 1;
          console.log(`Importato ${processed}/${wooProducts.length} prodotti...`);
        }
      }),
    );
  }

  return { imported, errors };
}

async function run() {
  const startedAt = Date.now();
  loadEnvLocal();

  const wooConfig = getWooConfig();
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRole = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
  });

  console.log("Inizio import WooCommerce → Supabase...");
  const wooCategories = await fetchWooCollection<WooCategory>("products/categories", wooConfig);
  const wooProducts = await fetchWooCollection<WooProduct>("products", wooConfig);

  console.log(`Categorie WooCommerce trovate: ${wooCategories.length}`);
  console.log(`Prodotti WooCommerce trovati: ${wooProducts.length}`);

  const categoriesResult = await importCategories(wooCategories, supabase);
  const productsResult = await importProducts(wooProducts, categoriesResult.maps, supabase);

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const stats: ImportStats = {
    categoriesImported: categoriesResult.imported,
    productsImported: productsResult.imported,
    totalProducts: wooProducts.length,
    errorSlugs: productsResult.errors,
  };

  console.log("----- REPORT FINALE -----");
  console.log(`Totale categorie importate: ${stats.categoriesImported}`);
  console.log(`Totale prodotti importati: ${stats.productsImported}/${stats.totalProducts}`);
  if (stats.errorSlugs.length) {
    console.log("Prodotti con errore:");
    for (const slug of stats.errorSlugs) {
      console.log(`- ${slug}`);
    }
  } else {
    console.log("Prodotti con errore: nessuno");
  }
  console.log(`Tempo totale: ${elapsedSeconds}s`);
}

run().catch((error) => {
  console.error("Import WooCommerce fallito:", error instanceof Error ? error.message : error);
  process.exit(1);
});
