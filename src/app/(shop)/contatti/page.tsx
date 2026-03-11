import Link from "next/link";

import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { createClient } from "@/lib/supabase/server";
import type { PageBlock } from "@/types";

function normalizeBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as Array<Record<string, unknown>>)
    .filter((item) => Boolean(item && typeof item === "object" && item.id && item.type))
    .map((item, index) => ({
      id: String(item.id),
      type: String(item.type),
      props:
        item.props && typeof item.props === "object"
          ? (item.props as Record<string, unknown>)
          : Object.fromEntries(
              Object.entries(item).filter(([key]) => !["id", "type", "order", "props"].includes(key)),
            ),
      order: typeof item.order === "number" ? item.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

export default async function ContattiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_content")
    .select("blocks")
    .eq("page", "contatti")
    .maybeSingle();

  const blocks = normalizeBlocks(data?.blocks);

  return (
    <div className="space-y-10">
      {blocks.length ? <BlockRenderer blocks={blocks} /> : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-[#E7DFD4] bg-white p-6 sm:p-8">
          <h1 className="font-serif text-5xl text-[#1E1810]">Contatti</h1>
          <p className="mt-2 text-[#5C5048]">
            Scrivici per una consulenza personalizzata su partecipazioni, kit cerimonia e coordinati.
          </p>

          <form className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="nome" className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className="h-11 w-full rounded-xl border border-black/10 px-3 outline-none focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="h-11 w-full rounded-xl border border-black/10 px-3 outline-none focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="telefono" className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">
                Telefono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className="h-11 w-full rounded-xl border border-black/10 px-3 outline-none focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="messaggio" className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">
                Messaggio
              </label>
              <textarea
                id="messaggio"
                name="messaggio"
                rows={5}
                className="w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
              />
            </div>

            <button
              type="submit"
              className="inline-flex rounded-full bg-[#D4918F] px-6 py-3 text-sm font-medium text-white hover:bg-[#c47f7d]"
            >
              Invia richiesta
            </button>
          </form>
        </article>

        <article className="space-y-4 rounded-3xl border border-[#E7DFD4] bg-white p-6 sm:p-8">
          <h2 className="font-serif text-4xl text-[#1E1810]">Studio Effegi Lab</h2>

          <dl className="space-y-3 text-sm text-[#5C5048]">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">Indirizzo</dt>
              <dd>Napoli, Italia</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">WhatsApp</dt>
              <dd>
                <Link className="underline" href="https://wa.me/393333333333" target="_blank">
                  +39 333 333 3333
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">Email</dt>
              <dd>
                <Link className="underline" href="mailto:info@effegi-lab.it">
                  info@effegi-lab.it
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#7A6E66]">Orari</dt>
              <dd>Lun - Ven 09:00 - 18:30</dd>
              <dd>Sabato su appuntamento</dd>
            </div>
          </dl>

          <div className="overflow-hidden rounded-2xl border border-black/10">
            <iframe
              title="Mappa Effegi Lab Napoli"
              src="https://www.google.com/maps?q=Napoli&output=embed"
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </article>
      </section>
    </div>
  );
}
