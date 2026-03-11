import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

type AdminEditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (error) {
    return null;
  }

  return (data as Product | null) ?? null;
}

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductForm mode="edit" product={product} />;
}

