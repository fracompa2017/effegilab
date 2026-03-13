function readEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (value) {
    return value;
  }

  // On browser runtime, avoid a hard crash and let the UI load with degraded behavior.
  if (typeof window !== "undefined") {
    console.error(`[supabase] Missing environment variable: ${name}`);
    return name === "NEXT_PUBLIC_SUPABASE_URL"
      ? "https://example.supabase.co"
      : "public-anon-key-missing";
  }

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseConfig() {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
