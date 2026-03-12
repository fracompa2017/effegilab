import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Category, Order, Product } from "@/types";

export const SHOP_PAGE_SIZE = 24;

export type ShopSort =
  | "recenti"
  | "prezzo-asc"
  | "prezzo-desc"
  | "nome-asc"
  | "nome-desc";

export type ShopFilters = {
  categoria?: string;
  collezione?: string;
  min?: number;
  max?: number;
  sort?: ShopSort;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type ShopSearchParams = {
  categoria?: string;
  collezione?: string;
  min?: string;
  max?: string;
  sort?: string;
  q?: string;
  page?: string;
};

export type ProductsQueryResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
};

export type CollectionEntry = {
  name: string;
  slug: string;
  count: number;
  imageUrl: string | null;
};

type ProductRow = Partial<Product> & {
  images?: unknown;
  price?: unknown;
  price_min?: unknown;
  price_max?: unknown;
  stock?: unknown;
  has_variants?: unknown;
  is_customizable?: unknown;
  is_active?: unknown;
};

const validSorts: ShopSort[] = ["recenti", "prezzo-asc", "prezzo-desc", "nome-asc", "nome-desc"];

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function normalizeProduct(row: ProductRow): Product {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Prodotto"),
    slug: String(row.slug ?? "prodotto"),
    description: row.description ? String(row.description) : null,
    price: row.price === null || row.price === undefined ? null : asNumber(row.price, 0),
    price_min: row.price_min === null || row.price_min === undefined ? null : asNumber(row.price_min, 0),
    price_max: row.price_max === null || row.price_max === undefined ? null : asNumber(row.price_max, 0),
    images: toImages(row.images),
    category_id: row.category_id ? String(row.category_id) : null,
    collection: row.collection ? String(row.collection) : null,
    is_customizable: row.is_customizable !== false,
    has_variants: Boolean(row.has_variants),
    stock: asNumber(row.stock, 0),
    is_active: row.is_active !== false,
    seo_title: row.seo_title ? String(row.seo_title) : null,
    seo_description: row.seo_description ? String(row.seo_description) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    total: asNumber(order.total, 0),
  };
}

function toPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function toNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function cleanText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length ? cleaned : undefined;
}

function normalizeSort(value: string | undefined): ShopSort {
  if (!value) {
    return "recenti";
  }

  return validSorts.includes(value as ShopSort) ? (value as ShopSort) : "recenti";
}

function normalizeCollectionSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function parsePageSize(pageSize?: number): number {
  if (!pageSize || Number.isNaN(pageSize) || pageSize < 1) {
    return SHOP_PAGE_SIZE;
  }

  return Math.min(pageSize, 60);
}

function applySort(
  query: ReturnType<SupabaseClient["from"]>["select"],
  sort: ShopSort,
): ReturnType<SupabaseClient["from"]>["select"] {
  switch (sort) {
    case "prezzo-asc":
      return query.order("price", { ascending: true, nullsFirst: false });
    case "prezzo-desc":
      return query.order("price", { ascending: false, nullsFirst: false });
    case "nome-asc":
      return query.order("name", { ascending: true });
    case "nome-desc":
      return query.order("name", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

async function resolveCategoryId(
  supabase: SupabaseClient,
  categorySlug?: string,
): Promise<string | null> {
  if (!categorySlug) {
    return null;
  }

  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  return data?.id ?? null;
}

async function resolveCollectionName(
  supabase: SupabaseClient,
  collectionSlug?: string,
): Promise<string | null> {
  if (!collectionSlug) {
    return null;
  }

  const { data } = await supabase
    .from("products")
    .select("collection")
    .eq("is_active", true)
    .not("collection", "is", null)
    .limit(500);

  const collection = (data ?? [])
    .map((entry) => (typeof entry.collection === "string" ? entry.collection.trim() : ""))
    .filter(Boolean)
    .find((name) => normalizeCollectionSlug(name) === collectionSlug);

  return collection ?? null;
}

async function queryProducts(
  supabase: SupabaseClient,
  filters: ShopFilters,
): Promise<ProductsQueryResult> {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = parsePageSize(filters.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const categoryId = await resolveCategoryId(supabase, filters.categoria);
  const collectionName = await resolveCollectionName(supabase, filters.collezione);

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (filters.categoria && categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (filters.collezione) {
    query = query.ilike("collection", collectionName ?? filters.collezione.replace(/-/g, " "));
  }

  if (typeof filters.min === "number") {
    query = query.gte("price", filters.min);
  }

  if (typeof filters.max === "number") {
    query = query.lte("price", filters.max);
  }

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  query = applySort(query, filters.sort ?? "recenti").range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    products: (data ?? []).map((row) => normalizeProduct(row as ProductRow)),
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function parseShopFilters(searchParams: ShopSearchParams): ShopFilters {
  return {
    categoria: cleanText(searchParams.categoria),
    collezione: cleanText(searchParams.collezione),
    min: toNonNegativeNumber(searchParams.min),
    max: toNonNegativeNumber(searchParams.max),
    sort: normalizeSort(searchParams.sort),
    q: cleanText(searchParams.q),
    page: toPositiveInteger(searchParams.page, 1),
    pageSize: SHOP_PAGE_SIZE,
  };
}

export async function getProductsServer(filters: ShopFilters): Promise<ProductsQueryResult> {
  const supabase = await createServerClient();
  return queryProducts(supabase, filters);
}

export async function getProductsClient(filters: ShopFilters): Promise<ProductsQueryResult> {
  const supabase = createBrowserClient();
  return queryProducts(supabase, filters);
}

export async function getCategoriesServer(): Promise<Category[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export async function getCategoriesClient(): Promise<Category[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export async function getCollectionsServer(): Promise<CollectionEntry[]> {
  const supabase = await createServerClient();
  return getCollectionsWithClient(supabase);
}

export async function getCollectionsClient(): Promise<CollectionEntry[]> {
  const supabase = createBrowserClient();
  return getCollectionsWithClient(supabase);
}

async function getCollectionsWithClient(supabase: SupabaseClient): Promise<CollectionEntry[]> {
  const { data, error } = await supabase
    .from("products")
    .select("collection, images")
    .eq("is_active", true)
    .not("collection", "is", null)
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, CollectionEntry>();

  for (const row of data ?? []) {
    const rawName = typeof row.collection === "string" ? row.collection.trim() : "";
    if (!rawName) {
      continue;
    }

    const key = normalizeCollectionSlug(rawName);
    const firstImage = toImages(row.images)[0] ?? null;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: rawName,
        slug: key,
        count: 1,
        imageUrl: firstImage,
      });
      continue;
    }

    existing.count += 1;
    if (!existing.imageUrl && firstImage) {
      existing.imageUrl = firstImage;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "it"));
}

export async function getAccountOrdersByEmail(email: string): Promise<Order[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Order[]).map(normalizeOrder);
}

export async function getAccountOrderById(id: string, email: string): Promise<Order | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_email", email)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data ? normalizeOrder(data as Order) : null;
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((entry) => String(entry.product_id));
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id, products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((entry) => entry.products as ProductRow | null)
    .filter(Boolean)
    .map((product) => normalizeProduct(product as ProductRow));
}
