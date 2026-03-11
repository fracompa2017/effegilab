import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    return null;
  }

  return (data as Product | null) ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Prodotto non trovato | Effegi Lab",
      description: "Il prodotto richiesto non è disponibile.",
    };
  }

  return {
    title: product.seo_title ?? `${product.name} | Effegi Lab`,
    description:
      product.seo_description ??
      product.description ??
      "Wedding stationery artigianale personalizzabile con bozza grafica inclusa.",
    openGraph: {
      title: product.seo_title ?? `${product.name} | Effegi Lab`,
      description:
        product.seo_description ??
        product.description ??
        "Wedding stationery artigianale personalizzabile.",
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.is_active) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductDetailClient product={product} />
    </div>
  );
}

