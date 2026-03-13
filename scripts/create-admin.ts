import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile ambiente mancante: ${name}`);
  }
  return value;
}

async function run() {
  loadEnvLocal();

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminEmail = "admin@effegi-lab.it";
  const adminPassword = "EffegiLab2025!";

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      role: "admin",
      name: "Giuseppina",
    },
  });

  if (error && !error.message.toLowerCase().includes("already")) {
    throw new Error(`Errore creazione utente admin: ${error.message}`);
  }

  let adminId = data.user?.id;

  if (!adminId) {
    const listResponse = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listResponse.error) {
      throw new Error(`Errore recupero utenti: ${listResponse.error.message}`);
    }

    const existing = listResponse.data.users.find(
      (user) => user.email?.toLowerCase() === adminEmail,
    );

    if (!existing?.id) {
      throw new Error("Utente admin non trovato dopo la creazione.");
    }

    adminId = existing.id;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: adminId,
    email: adminEmail,
    role: "admin",
    name: "Giuseppina",
  });

  if (profileError) {
    throw new Error(`Errore upsert profilo admin: ${profileError.message}`);
  }

  console.log("Admin creato/aggiornato correttamente:");
  console.log(`- email: ${adminEmail}`);
  console.log(`- id: ${adminId}`);
}

run().catch((error) => {
  console.error("Errore script create-admin:", error);
  process.exit(1);
});
