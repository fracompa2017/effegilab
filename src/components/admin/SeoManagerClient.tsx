"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SeoRow = {
  page: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical: string | null;
  robots: string | null;
  updated_at: string | null;
};

type ProductSeoEntry = {
  slug: string;
  name: string;
};

type SeoFormState = {
  title: string;
  description: string;
  og_image: string;
  og_title: string;
  og_description: string;
  canonical: string;
  robots: string;
};

type GlobalSeoState = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  defaultOgImage: string;
  gaId: string;
  gscCode: string;
  schemaOrganization: string;
};

type SeoManagerData = {
  seoRows: SeoRow[];
  products: ProductSeoEntry[];
  globalSeo: GlobalSeoState;
};

type TabKey = "pages" | "global" | "sitemap";

type PageOption = {
  page: string;
  label: string;
  type: "Pagina" | "Prodotto";
};

const pageOptionsBase: PageOption[] = [
  { page: "/", label: "Homepage", type: "Pagina" },
  { page: "/shop", label: "Shop", type: "Pagina" },
  { page: "/chi-siamo", label: "Chi siamo", type: "Pagina" },
  { page: "/come-funziona", label: "Come funziona", type: "Pagina" },
  { page: "/contatti", label: "Contatti", type: "Pagina" },
];

const defaultSeoForm: SeoFormState = {
  title: "",
  description: "",
  og_image: "",
  og_title: "",
  og_description: "",
  canonical: "",
  robots: "index,follow",
};

const defaultGlobalSeo: GlobalSeoState = {
  siteName: "Effegi Lab",
  siteDescription: "Wedding stationery artigianale personalizzata.",
  logoUrl: "",
  defaultOgImage: "",
  gaId: "",
  gscCode: "",
  schemaOrganization: "",
};

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toGlobalSeo(value: unknown): GlobalSeoState {
  if (!value || typeof value !== "object") {
    return defaultGlobalSeo;
  }

  const raw = value as Record<string, unknown>;
  return {
    siteName: toStringValue(raw.siteName, defaultGlobalSeo.siteName),
    siteDescription: toStringValue(raw.siteDescription, defaultGlobalSeo.siteDescription),
    logoUrl: toStringValue(raw.logoUrl),
    defaultOgImage: toStringValue(raw.defaultOgImage),
    gaId: toStringValue(raw.gaId),
    gscCode: toStringValue(raw.gscCode),
    schemaOrganization: toStringValue(raw.schemaOrganization),
  };
}

function toSeoForm(row?: SeoRow | null): SeoFormState {
  if (!row) {
    return defaultSeoForm;
  }

  return {
    title: row.title ?? "",
    description: row.description ?? "",
    og_image: row.og_image ?? "",
    og_title: row.og_title ?? "",
    og_description: row.og_description ?? "",
    canonical: row.canonical ?? "",
    robots: row.robots ?? "index,follow",
  };
}

async function fetchSeoManagerData(): Promise<SeoManagerData> {
  try {
    const supabase = createClient();

    const [seoResponse, productsResponse, globalSeoResponse] = await Promise.all([
      supabase
        .from("seo_settings")
        .select("page,title,description,og_image,og_title,og_description,canonical,robots,updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("products")
        .select("slug,name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("settings").select("value").eq("key", "seo_global").maybeSingle(),
    ]);

    if (seoResponse.error) {
      throw new Error(seoResponse.error.message);
    }

    if (productsResponse.error) {
      throw new Error(productsResponse.error.message);
    }

    const globalSeo = toGlobalSeo(globalSeoResponse.data?.value);

    return {
      seoRows: (seoResponse.data ?? []) as SeoRow[],
      products: ((productsResponse.data ?? []) as Array<{ slug: string; name: string }>).map((item) => ({
        slug: item.slug,
        name: item.name,
      })),
      globalSeo,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore caricamento SEO manager.";
    throw new Error(message);
  }
}

function SerpPreview({ page, form, siteUrl }: { page: string; form: SeoFormState; siteUrl: string }) {
  const normalizedPage = page === "/" ? "" : page;
  const previewUrl = `${siteUrl}${normalizedPage}`;

  return (
    <div className="rounded-2xl border border-black/7 bg-[#FBF9F6] p-4">
      <p className="text-xs text-[#6A5E53]">{previewUrl.replace(/^https?:\/\//, "")}</p>
      <p className="mt-1 text-base font-medium text-[#1a0dab] line-clamp-1">
        {form.title || "Titolo SEO non impostato"}
      </p>
      <p className="mt-1 text-sm text-[#4d5156] line-clamp-2">
        {form.description || "Descrizione SEO non impostata."}
      </p>
    </div>
  );
}

export function SeoManagerClient() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("pages");
  const [search, setSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState<string>("/");
  const [seoForm, setSeoForm] = useState<SeoFormState>(defaultSeoForm);
  const [globalForm, setGlobalForm] = useState<GlobalSeoState>(defaultGlobalSeo);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://effegilab.vercel.app").replace(/\/$/, "");

  const seoQuery = useQuery({
    queryKey: ["admin-seo-manager"],
    queryFn: fetchSeoManagerData,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (seoQuery.isLoading) {
      setIsLoadingState(true);
      setError(null);
      return;
    }

    setIsLoadingState(false);
    if (seoQuery.isError) {
      setError(seoQuery.error instanceof Error ? seoQuery.error.message : "Errore sconosciuto.");
      return;
    }
    setError(null);
  }, [seoQuery.error, seoQuery.isError, seoQuery.isLoading]);

  const seoMap = useMemo(() => {
    const map = new Map<string, SeoRow>();
    for (const row of seoQuery.data?.seoRows ?? []) {
      map.set(row.page, row);
    }
    return map;
  }, [seoQuery.data?.seoRows]);

  const pageOptions = useMemo(() => {
    const productPages: PageOption[] = (seoQuery.data?.products ?? []).map((product) => ({
      page: `/prodotto/${product.slug}`,
      label: product.name,
      type: "Prodotto",
    }));

    return [...pageOptionsBase, ...productPages];
  }, [seoQuery.data?.products]);

  const filteredPages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return pageOptions;
    }

    return pageOptions.filter((option) => {
      return option.label.toLowerCase().includes(term) || option.page.toLowerCase().includes(term);
    });
  }, [pageOptions, search]);

  const sitemapUrls = useMemo(() => pageOptions.map((option) => `${siteUrl}${option.page === "/" ? "" : option.page}`), [pageOptions, siteUrl]);

  useEffect(() => {
    setSeoForm(toSeoForm(seoMap.get(selectedPage)));
  }, [selectedPage, seoMap]);

  useEffect(() => {
    if (seoQuery.data?.globalSeo) {
      setGlobalForm(seoQuery.data.globalSeo);
    }
  }, [seoQuery.data?.globalSeo]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2600);
  }

  const savePageSeo = useMutation({
    mutationFn: async () => {
      const payload = {
        page: selectedPage,
        title: seoForm.title || null,
        description: seoForm.description || null,
        og_image: seoForm.og_image || null,
        og_title: seoForm.og_title || null,
        og_description: seoForm.og_description || null,
        canonical: seoForm.canonical || null,
        robots: seoForm.robots || "index,follow",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("seo_settings").upsert(payload, { onConflict: "page" });
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      showToast("SEO pagina salvato.");
      await queryClient.invalidateQueries({ queryKey: ["admin-seo-manager"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore salvataggio SEO pagina.");
    },
  });

  const saveGlobalSeo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").upsert(
        {
          key: "seo_global",
          value: globalForm,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      showToast("Impostazioni SEO globali salvate.");
      await queryClient.invalidateQueries({ queryKey: ["admin-seo-manager"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore salvataggio impostazioni globali.");
    },
  });

  const revalidateSitemap = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "/sitemap.xml" }),
      });

      if (!response.ok) {
        throw new Error("Revalidation sitemap non riuscita.");
      }
    },
    onSuccess: () => {
      showToast("Sitemap rigenerata.");
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore durante la rigenerazione sitemap.");
    },
  });

  const loadErrorMessage = error ?? "Errore sconosciuto.";
  const isMissingSchema =
    loadErrorMessage.includes("Could not find the table") ||
    loadErrorMessage.includes("schema cache");

  if (isLoadingState) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="font-serif text-5xl text-[#1E1810]">SEO Manager</h1>
          <p className="text-sm text-[#5C5048]">Caricamento impostazioni SEO in corso...</p>
        </header>
        <div className="h-48 animate-pulse rounded-2xl border border-black/7 bg-white" />
      </div>
    );
  }

  if (error || !seoQuery.data) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="font-serif text-5xl text-[#1E1810]">SEO Manager</h1>
          <p className="text-sm text-[#5C5048]">Impossibile caricare i dati SEO.</p>
        </header>
        <div className="space-y-2 rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
          <p>Errore nel caricamento SEO manager.</p>
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
        <h1 className="font-serif text-5xl text-[#1E1810]">SEO Manager</h1>
        <p className="text-sm text-[#5C5048]">Gestisci metadata pagine, global settings e sitemap.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "pages" as const, label: "Pagine" },
            { id: "global" as const, label: "Impostazioni Globali" },
            { id: "sitemap" as const, label: "Sitemap" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                activeTab === tab.id
                  ? "border-[#D4918F] bg-[#FDF4F3] text-[#1E1810]"
                  : "border-black/10 bg-white text-[#5C5048] hover:border-[#D4918F]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "pages" ? (
        <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-2xl border border-black/7 bg-white p-4">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9088]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cerca pagina..."
                className="h-11 w-full rounded-full border border-black/10 pl-9 pr-4 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
              {filteredPages.map((option) => {
                const hasSeo = seoMap.has(option.page);
                const isSelected = selectedPage === option.page;

                return (
                  <button
                    key={option.page}
                    type="button"
                    onClick={() => setSelectedPage(option.page)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left transition",
                      isSelected
                        ? "border-[#D4918F] bg-[#FEF4F3]"
                        : "border-black/10 bg-white hover:border-[#D4918F]/60",
                    )}
                  >
                    <p className="text-sm font-medium text-[#1E1810] line-clamp-1">{option.label}</p>
                    <p className="text-xs text-[#7A6E66]">{option.page}</p>
                    <span className="mt-1 inline-flex rounded-full bg-[#F2ECE4] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#6F645A]">
                      {option.type} · {hasSeo ? "SEO OK" : "Da configurare"}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[#9C9088]">Pagina selezionata</p>
                <h2 className="font-serif text-3xl text-[#1E1810]">{selectedPage}</h2>
              </div>
              <button
                type="button"
                onClick={() => savePageSeo.mutate()}
                disabled={savePageSeo.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {savePageSeo.isPending ? "Salvataggio..." : "Salva SEO"}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                Title tag
                <input
                  value={seoForm.title}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
                <span className="text-[10px] text-[#9C9088]">{seoForm.title.length}/60</span>
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                Canonical URL
                <input
                  value={seoForm.canonical}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, canonical: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
                Meta description
                <textarea
                  value={seoForm.description}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
                <span className="text-[10px] text-[#9C9088]">{seoForm.description.length}/160</span>
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                OG Image URL
                <input
                  value={seoForm.og_image}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, og_image: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                Robots
                <select
                  value={seoForm.robots}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, robots: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                >
                  <option value="index,follow">index,follow</option>
                  <option value="index,nofollow">index,nofollow</option>
                  <option value="noindex,follow">noindex,follow</option>
                  <option value="noindex,nofollow">noindex,nofollow</option>
                </select>
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                OG Title
                <input
                  value={seoForm.og_title}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, og_title: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
                OG Description
                <input
                  value={seoForm.og_description}
                  onChange={(event) => setSeoForm((prev) => ({ ...prev, og_description: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
                />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.12em] text-[#9C9088]">Preview Google SERP</p>
              <SerpPreview page={selectedPage} form={seoForm} siteUrl={siteUrl} />
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "global" ? (
        <section className="rounded-2xl border border-black/7 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-3xl text-[#1E1810]">Impostazioni SEO Globali</h2>
            <button
              type="button"
              onClick={() => saveGlobalSeo.mutate()}
              disabled={saveGlobalSeo.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={15} />
              {saveGlobalSeo.isPending ? "Salvataggio..." : "Salva impostazioni"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Nome sito
              <input
                value={globalForm.siteName}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, siteName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Google Analytics ID
              <input
                value={globalForm.gaId}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, gaId: event.target.value }))}
                placeholder="G-XXXXXXXXXX"
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Logo URL
              <input
                value={globalForm.logoUrl}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              OG Image di default
              <input
                value={globalForm.defaultOgImage}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, defaultOgImage: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Descrizione sito
              <textarea
                value={globalForm.siteDescription}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, siteDescription: event.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Search Console verification code
              <input
                value={globalForm.gscCode}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, gscCode: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Schema.org Organization (JSON)
              <textarea
                value={globalForm.schemaOrganization}
                onChange={(event) => setGlobalForm((prev) => ({ ...prev, schemaOrganization: event.target.value }))}
                rows={6}
                className="w-full rounded-xl border border-black/10 px-3 py-2 font-mono text-xs text-[#1E1810] outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>
        </section>
      ) : null}

      {activeTab === "sitemap" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl text-[#1E1810]">Sitemap</h2>
              <p className="text-sm text-[#5C5048]">URL sitemap: {siteUrl}/sitemap.xml</p>
            </div>
            <button
              type="button"
              onClick={() => revalidateSitemap.mutate()}
              disabled={revalidateSitemap.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 px-4 text-sm text-[#5C5048] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={14} className={revalidateSitemap.isPending ? "animate-spin" : ""} />
              {revalidateSitemap.isPending ? "Rigenerazione..." : "Rigenera Sitemap"}
            </button>
          </div>

          <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-xl border border-black/7 bg-[#FBF9F6] p-3 text-sm text-[#5C5048]">
            {sitemapUrls.map((url) => (
              <p key={url} className="truncate">
                {url}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
