import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  if (!apiKey) {
    return false;
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id,enabled")
    .eq("key", apiKey)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data?.id) {
    return false;
  }

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}
