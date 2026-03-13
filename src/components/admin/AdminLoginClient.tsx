"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type AdminLoginClientProps = {
  errorParam?: string | null;
};

export function AdminLoginClient({ errorParam }: AdminLoginClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorMessages: Record<string, string> = {
    db: "Errore database. Riprova.",
    unauthorized: "Account non autorizzato per il pannello admin.",
    unexpected: "Errore imprevisto. Riprova.",
  };
  const queryErrorMessage = errorParam ? errorMessages[errorParam] ?? "Accesso admin non riuscito." : null;
  const activeErrorMessage = errorMessage ?? queryErrorMessage;

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

          {activeErrorMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] px-3 py-2 text-sm text-[#A24D49]">
              <AlertCircle size={14} />
              {activeErrorMessage}
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
