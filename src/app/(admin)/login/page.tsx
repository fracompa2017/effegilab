"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const errorMessages: Record<string, string> = {
      db: "Errore database. Riprova.",
      unauthorized: "Account non autorizzato per il pannello admin.",
      unexpected: "Errore imprevisto. Riprova.",
    };

    if (!errorParam) {
      return;
    }

    setErrorMessage(errorMessages[errorParam] ?? "Accesso admin non riuscito.");
  }, [errorParam]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error || !data.user) {
      setIsLoading(false);
      setErrorMessage("Credenziali non valide. Controlla email e password.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrorMessage("Non hai i permessi per accedere al pannello admin.");
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/7 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="font-serif text-5xl text-[#1E1810]">
            Effegi<span className="italic text-[#D4918F]">Lab</span>
          </p>
          <p className="mt-2 text-sm text-[#5C5048]">Accesso amministrazione</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="admin-email"
            type="email"
            label="Email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            id="admin-password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] px-3 py-2 text-sm text-[#A24D49]">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full rounded-full bg-[#D4918F] py-2.5 text-white hover:bg-[#c98482]"
            disabled={isLoading}
          >
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>

        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#5C5048] hover:text-[#1E1810]">
          Torna al sito →
        </Link>
      </div>
    </div>
  );
}
