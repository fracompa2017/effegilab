import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Carica .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAdminUser(email: string, password: string) {
  console.log(`\nCreazione utente admin: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", name: "Giuseppina" },
  });

  if (!error && data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email,
        name: "Giuseppina",
        role: "admin",
      });

    if (profileError) {
      console.error("❌ Errore profilo:", profileError.message);
      process.exit(1);
    }

    console.log("✅ Utente creato:", data.user.id);
    console.log("✅ Profilo admin creato");
    return;
  }

  if (!error?.message.includes("already been registered")) {
    console.error("❌ Errore creazione utente:", error?.message);
    process.exit(1);
  }

  console.log("⚠️  Utente già esistente — aggiorno solo il profilo");
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Errore lettura utenti:", listError.message);
    process.exit(1);
  }

  const existing = usersData.users.find((user) => user.email === email);
  if (!existing) {
    console.error("❌ Utente non trovato");
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: {
      ...(existing.user_metadata ?? {}),
      role: "admin",
      name: "Giuseppina",
    },
  });

  if (updateError) {
    console.error("❌ Errore aggiornamento utente:", updateError.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: existing.id,
      email,
      name: "Giuseppina",
      role: "admin",
    });

  if (profileError) {
    console.error("❌ Errore profilo:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Password aggiornata");
  console.log("✅ Profilo admin aggiornato");
}

async function createAdmin() {
  const password = "EffegiLab2025!";
  const adminEmails = ["effegilab2023@gmail.com", "admin@effegi-lab.it"];

  for (const email of adminEmails) {
    await ensureAdminUser(email, password);
  }

  console.log("\n✅ Admin pronto!");
  console.log("   Email:    effegilab2023@gmail.com");
  console.log("   Email 2:  admin@effegi-lab.it");
  console.log(`   Password: ${password}`);
  console.log("   URL:      https://effegilab.vercel.app/admin/login\n");
}

void createAdmin();
