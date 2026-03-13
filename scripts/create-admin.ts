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

async function createAdmin() {
  const email = "effegilab2023@gmail.com";
  const password = "EffegiLab2025!";

  console.log(`\nCreazione utente admin: ${email}`);

  // 1. Crea utente in auth.users
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", name: "Giuseppina" },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("⚠️  Utente già esistente — aggiorno solo il profilo");

      // Recupera utente esistente
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((user) => user.email === email);

      if (!existing) {
        console.error("❌ Utente non trovato");
        process.exit(1);
      }

      // Aggiorna password
      await supabase.auth.admin.updateUserById(existing.id, { password });
      console.log("✅ Password aggiornata");

      // Upsert profilo
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

      console.log("✅ Profilo admin aggiornato");
    } else {
      console.error("❌ Errore creazione utente:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Utente creato:", data.user?.id);

    // Crea profilo admin
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user!.id,
        email,
        name: "Giuseppina",
        role: "admin",
      });

    if (profileError) {
      console.error("❌ Errore profilo:", profileError.message);
      process.exit(1);
    }

    console.log("✅ Profilo admin creato");
  }

  console.log("\n✅ Admin pronto!");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   URL:      https://effegilab.vercel.app/admin/login\n");
}

createAdmin();
