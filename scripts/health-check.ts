import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const requiredEnvs = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const requiredTables = [
  "products",
  "orders",
  "categories",
  "profiles",
  "wishlists",
  "media",
  "page_content",
  "coupons",
] as const;

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const splitIndex = line.indexOf("=");
    if (splitIndex <= 0) {
      continue;
    }

    const key = line.slice(0, splitIndex).trim();
    const value = line.slice(splitIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function printResult(ok: boolean, label: string, detail?: string) {
  if (ok) {
    console.log(`✅ ${label}${detail ? `: ${detail}` : ""}`);
    return;
  }

  console.log(`❌ ${label}${detail ? `: ${detail}` : ""}`);
}

async function run() {
  loadEnvLocal();

  const missingEnvs = requiredEnvs.filter((name) => !process.env[name]);
  printResult(
    missingEnvs.length === 0,
    "ENV",
    missingEnvs.length === 0
      ? `tutte presenti (${requiredEnvs.length}/${requiredEnvs.length})`
      : `mancano ${missingEnvs.length}/${requiredEnvs.length} (${missingEnvs.join(", ")})`,
  );

  const resendFrom = process.env.RESEND_FROM_EMAIL;
  if (!resendFrom) {
    console.log("⚠️ RESEND_FROM_EMAIL: non configurato (userà fallback onboarding@resend.dev)");
  } else {
    console.log("✅ RESEND_FROM_EMAIL: configurato");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    console.log("\nHealth check interrotto: variabili Supabase mancanti.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: pingError } = await supabase.from("products").select("id").limit(1);
  printResult(!pingError, "SUPABASE", !pingError ? "connessione OK" : pingError.message);

  const tableChecks = await Promise.all(
    requiredTables.map(async (table) => {
      const { error } = await supabase.from(table).select("id", { head: true, count: "exact" });
      return {
        table,
        ok: !error,
        error: error?.message,
      };
    }),
  );

  const existingTables = tableChecks.filter((entry) => entry.ok);
  const missingTables = tableChecks.filter((entry) => !entry.ok);

  printResult(
    missingTables.length === 0,
    "TABELLE",
    missingTables.length === 0
      ? `tutte presenti (${existingTables.length}/${requiredTables.length})`
      : `presenti ${existingTables.length}/${requiredTables.length}; mancanti: ${missingTables
          .map((table) => table.table)
          .join(", ")}`,
  );

  const { count: activeProducts, error: productsError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  printResult(
    !productsError,
    "PRODOTTI",
    !productsError
      ? `${activeProducts ?? 0} prodotti attivi`
      : productsError.message,
  );

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  printResult(
    !adminError && Boolean(adminProfile?.id),
    "ADMIN",
    !adminError && adminProfile?.id
      ? `utente admin presente (${adminProfile.email ?? adminProfile.id})`
      : adminError?.message ?? "utente admin non trovato",
  );

  const hasCriticalErrors =
    missingEnvs.length > 0 ||
    Boolean(pingError) ||
    missingTables.length > 0 ||
    Boolean(productsError) ||
    Boolean(adminError) ||
    !adminProfile?.id;

  if (hasCriticalErrors) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("Errore health check:", error instanceof Error ? error.message : error);
  process.exit(1);
});
