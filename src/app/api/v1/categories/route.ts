import { NextRequest, NextResponse } from "next/server";

import { createApiSupabaseClient, validateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const isValid = await validateApiKey(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createApiSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}
