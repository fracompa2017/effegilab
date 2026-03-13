"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type IntegrationName =
  | "facebook_pixel"
  | "google_analytics"
  | "google_tag_manager"
  | "tiktok_pixel";

type IntegrationRow = {
  id: string;
  name: IntegrationName;
  enabled: boolean;
  config: Record<string, string>;
  updated_at: string;
};

type IntegrationState = {
  enabled: boolean;
  value: string;
};

type IntegrationDefinition = {
  name: IntegrationName;
  title: string;
  field: string;
  placeholder: string;
  helper: string;
};

const integrationDefinitions: IntegrationDefinition[] = [
  {
    name: "facebook_pixel",
    title: "Facebook Pixel",
    field: "pixel_id",
    placeholder: "123456789012345",
    helper: "Business Manager → Events Manager → copia Pixel ID.",
  },
  {
    name: "google_analytics",
    title: "Google Analytics 4",
    field: "measurement_id",
    placeholder: "G-XXXXXXXXXX",
    helper: "Google Analytics → Admin → Data Streams → Measurement ID.",
  },
  {
    name: "google_tag_manager",
    title: "Google Tag Manager",
    field: "container_id",
    placeholder: "GTM-XXXXXXX",
    helper: "Tag Manager → Workspace → copia Container ID.",
  },
  {
    name: "tiktok_pixel",
    title: "TikTok Pixel",
    field: "pixel_id",
    placeholder: "TikTok Pixel ID",
    helper: "TikTok Ads Manager → Events → Web Events.",
  },
];

async function fetchIntegrations(): Promise<IntegrationRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("integrations")
      .select("id,name,enabled,config,updated_at")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      name: row.name as IntegrationName,
      enabled: Boolean(row.enabled),
      config: (row.config as Record<string, string>) ?? {},
      updated_at: String(row.updated_at ?? new Date().toISOString()),
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore caricamento integrazioni.";
    throw new Error(message);
  }
}

export function IntegrationManagerClient() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, IntegrationState>>({});
  const [toast, setToast] = useState<string | null>(null);

  const integrationsQuery = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: fetchIntegrations,
    refetchInterval: 30_000,
  });
  const isLoadingState = integrationsQuery.isLoading;
  const error = integrationsQuery.isError
    ? integrationsQuery.error instanceof Error
      ? integrationsQuery.error.message
      : "Errore sconosciuto."
    : null;
  const loadErrorMessage = error ?? "Errore sconosciuto.";
  const isMissingSchema =
    loadErrorMessage.includes("Could not find the table") ||
    loadErrorMessage.includes("schema cache");

  const integrationMap = useMemo(() => {
    return new Map((integrationsQuery.data ?? []).map((row) => [row.name, row]));
  }, [integrationsQuery.data]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2400);
  }

  function resolveState(definition: IntegrationDefinition): IntegrationState {
    const saved = integrationMap.get(definition.name);
    const draft = drafts[definition.name];

    return {
      enabled: draft?.enabled ?? saved?.enabled ?? false,
      value: draft?.value ?? saved?.config?.[definition.field] ?? "",
    };
  }

  const saveMutation = useMutation({
    mutationFn: async (definition: IntegrationDefinition) => {
      const draft = resolveState(definition);
      const payload = {
        name: definition.name,
        enabled: draft.enabled,
        config: {
          [definition.field]: draft.value,
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("integrations").upsert(payload, { onConflict: "name" });
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      showToast("Integrazione salvata.");
      await queryClient.invalidateQueries({ queryKey: ["admin-integrations"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore salvataggio integrazione.");
    },
  });

  function updateDraft(name: IntegrationName, next: Partial<IntegrationState>) {
    const definition = integrationDefinitions.find((item) => item.name === name);
    const fallback = definition ? resolveState(definition) : { enabled: false, value: "" };

    setDrafts((prev) => ({
      ...prev,
      [name]: {
        enabled: prev[name]?.enabled ?? fallback.enabled,
        value: prev[name]?.value ?? fallback.value,
        ...next,
      },
    }));
  }

  if (isLoadingState) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="font-serif text-5xl text-[#1E1810]">Integrazioni</h1>
          <p className="text-sm text-[#5C5048]">Caricamento integrazioni in corso...</p>
        </header>
        <div className="h-48 animate-pulse rounded-2xl border border-black/7 bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="font-serif text-5xl text-[#1E1810]">Integrazioni</h1>
          <p className="text-sm text-[#5C5048]">Impossibile caricare i dati integrazione.</p>
        </header>
        <div className="space-y-2 rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
          <p>Errore nel caricamento integrazioni.</p>
          <p className="break-words text-xs">{loadErrorMessage}</p>
          {isMissingSchema ? (
            <p className="text-xs text-[#7A3A37]">
              Schema mancante su Supabase: esegui la migration admin core
              (<code>supabase/migrations/20260313_000007_admin_core.sql</code>).
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-[#E6D6C8] bg-white px-4 py-2 text-sm text-[#5C5048] shadow-lg">
          {toast}
        </div>
      ) : null}

      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Integrazioni</h1>
        <p className="text-sm text-[#5C5048]">Gestisci Pixel, GA4 e Tag Manager senza toccare codice.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {integrationDefinitions.map((definition) => {
          const draft = resolveState(definition);
          const isSaving = saveMutation.isPending && saveMutation.variables?.name === definition.name;

          return (
            <article key={definition.name} className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl text-[#1E1810]">{definition.title}</h2>
                  <p className="text-sm text-[#6F645A]">{definition.helper}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateDraft(definition.name, { enabled: !draft.enabled })}
                  className={cn(
                    "inline-flex h-8 w-14 items-center rounded-full border px-1 transition",
                    draft.enabled
                      ? "border-[#D4918F] bg-[#FCEEEE]"
                      : "border-black/10 bg-[#F3EFE8]",
                  )}
                  aria-label={`Abilita ${definition.title}`}
                  role="switch"
                  aria-checked={draft.enabled}
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full bg-white shadow transition",
                      draft.enabled ? "translate-x-6" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                {definition.field.replace("_", " ")}
                <input
                  value={draft.value}
                  onChange={(event) => updateDraft(definition.name, { value: event.target.value })}
                  placeholder={definition.placeholder}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
              </label>

              <button
                type="button"
                onClick={() => saveMutation.mutate(definition)}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {isSaving ? "Salvataggio..." : "Salva"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
