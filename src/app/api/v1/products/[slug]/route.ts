import { NextRequest, NextResponse } from "next/server";

import { createApiSupabaseClient, validateApiKey } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const isValid = await validateApiKey(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createApiSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  const { slug } = await context.params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}
