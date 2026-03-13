import { NextRequest, NextResponse } from "next/server";

import { createApiSupabaseClient, validateApiKey } from "@/lib/api-auth";

function toPositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const isValid = await validateApiKey(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createApiSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria")?.trim() || null;
  const collezione = searchParams.get("collezione")?.trim() || null;
  const limit = Math.min(100, toPositiveInt(searchParams.get("limit"), 24));
  const page = toPositiveInt(searchParams.get("page"), 1);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoria) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categoria)
      .maybeSingle();

    if (category?.id) {
      query = query.eq("category_id", category.id);
    }
  }

  if (collezione) {
    const normalizedCollection = collezione.replace(/-/g, " ");
    query = query.ilike("collection", normalizedCollection);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    page,
  });
}
