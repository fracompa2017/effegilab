import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import { slugify } from "@/lib/utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://effegi-lab.it";

type ProductSitemapRow = {
  slug: string;
  created_at: string | null;
};

type CollectionSitemapRow = {
  collection: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, priority: 1 },
    { url: `${siteUrl}/shop`, priority: 0.9 },
    { url: `${siteUrl}/collezioni`, priority: 0.8 },
    { url: `${siteUrl}/chi-siamo`, priority: 0.8 },
    { url: `${siteUrl}/come-funziona`, priority: 0.8 },
    { url: `${siteUrl}/contatti`, priority: 0.8 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return entries;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const [productsRes, collectionsRes] = await Promise.all([
    supabase
      .from("products")
      .select("slug,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("collection")
      .eq("is_active", true)
      .not("collection", "is", null),
  ]);

  if (!productsRes.error) {
    const products = (productsRes.data ?? []) as ProductSitemapRow[];
    entries.push(
      ...products.map((product) => ({
        url: `${siteUrl}/prodotto/${product.slug}`,
        lastModified: product.created_at ? new Date(product.created_at) : undefined,
        priority: 0.7,
      })),
    );
  }

  if (!collectionsRes.error) {
    const rows = (collectionsRes.data ?? []) as CollectionSitemapRow[];
    const uniqueCollections = Array.from(
      new Set(
        rows
          .map((row) => row.collection)
          .filter((collection): collection is string => Boolean(collection)),
      ),
    );

    entries.push(
      ...uniqueCollections.map((collection) => ({
        url: `${siteUrl}/collezioni/${slugify(collection)}`,
        priority: 0.75,
      })),
    );
  }

  return entries;
}
