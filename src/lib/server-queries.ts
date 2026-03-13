import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/shared";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  getCollectionsWithClient,
  normalizeOrder,
  queryProductsWithClient,
  type CollectionEntry,
  type ProductsQueryResult,
  type ShopFilters,
} from "@/lib/queries";
import type { Category, Order } from "@/types";

function createPublicServerClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getProductsServer(filters: ShopFilters): Promise<ProductsQueryResult> {
  const supabase = createPublicServerClient();
  return queryProductsWithClient(supabase, filters);
}

export async function getCategoriesServer(): Promise<Category[]> {
  const supabase = createPublicServerClient();

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
  const supabase = createPublicServerClient();
  return getCollectionsWithClient(supabase);
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
