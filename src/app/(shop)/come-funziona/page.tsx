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

export default async function ComeFunzionaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_content")
    .select("blocks")
    .eq("page", "come-funziona")
    .maybeSingle();

  const blocks = normalizeBlocks(data?.blocks);

  if (blocks.length) {
    return <BlockRenderer blocks={blocks} />;
  }

  return (
    <section className="rounded-3xl border border-[#E7DFD4] bg-white p-8">
      <h1 className="font-serif text-5xl text-[#1E1810]">Come funziona</h1>
      <p className="mt-4 text-[#5C5048]">
        Scegli il prodotto, ricevi la bozza grafica via WhatsApp, conferma la personalizzazione e
        ricevi la consegna in circa 7 giorni lavorativi.
      </p>
    </section>
  );
}
