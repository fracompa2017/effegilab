import Link from "next/link";
import { Edit3, ExternalLink, LayoutTemplate } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { PageBlock } from "@/types";

type ManagedPage = {
  page: string;
  label: string;
  previewHref: string;
  description: string;
};

const managedPages: ManagedPage[] = [
  {
    page: "homepage",
    label: "Homepage",
    previewHref: "/",
    description: "Pagina principale con hero, categorie, prodotti e recensioni.",
  },
  {
    page: "chi-siamo",
    label: "Chi siamo",
    previewHref: "/chi-siamo",
    description: "Storia, valori e approccio artigianale di Effegi Lab.",
  },
  {
    page: "come-funziona",
    label: "Come funziona",
    previewHref: "/come-funziona",
    description: "Flusso ordine, bozza grafica e conferma prima della produzione.",
  },
  {
    page: "contatti",
    label: "Contatti",
    previewHref: "/contatti",
    description: "Canali diretti: email, WhatsApp, indirizzo e orari studio.",
  },
];

function getBlocksCount(blocks: unknown): number {
  if (!Array.isArray(blocks)) {
    return 0;
  }
  return (blocks as PageBlock[]).length;
}

export default async function AdminPagesBuilderPage() {
  const supabase = await createClient();
  const pageKeys = managedPages.map((item) => item.page);

  const { data } = await supabase
    .from("page_content")
    .select("page, updated_at, blocks")
    .in("page", pageKeys);

  const contentMap = new Map(
    (data ?? []).map((entry) => [
      entry.page as string,
      {
        updatedAt: String(entry.updated_at ?? ""),
        blocksCount: getBlocksCount(entry.blocks),
      },
    ]),
  );

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Page Builder</h1>
        <p className="text-sm text-[#5C5048]">
          Gestisci i blocchi delle pagine pubbliche senza toccare codice.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {managedPages.map((page) => {
          const info = contentMap.get(page.page);
          const blocksCount = info?.blocksCount ?? 0;
          const updatedAt = info?.updatedAt;

          return (
            <article key={page.page} className="rounded-2xl border border-black/7 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#9C9088]">Pagina</p>
                  <h2 className="font-serif text-3xl text-[#1E1810]">{page.label}</h2>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EBE3] text-[#5C5048]">
                  <LayoutTemplate size={16} />
                </span>
              </div>

              <p className="min-h-11 text-sm text-[#5C5048]">{page.description}</p>

              <dl className="mt-4 space-y-2 rounded-xl border border-black/7 bg-[#FBF9F6] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#7C6F66]">Ultima modifica</dt>
                  <dd className="font-medium text-[#1E1810]">
                    {updatedAt ? formatDate(updatedAt) : "Mai pubblicata"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#7C6F66]">Blocchi attivi</dt>
                  <dd className="inline-flex min-w-8 items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#5C5048]">
                    {blocksCount}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/pagine/${page.page}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#D4918F] px-4 py-2 text-sm font-medium text-white hover:bg-[#c47f7d]"
                >
                  <Edit3 size={14} />
                  Modifica
                </Link>
                <Link
                  href={page.previewHref}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[#5C5048] hover:bg-[#F8F6F2]"
                >
                  <ExternalLink size={14} />
                  Anteprima
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
