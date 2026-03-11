import type { PageBlock } from "@/types";

type BlockRendererProps = {
  block: PageBlock;
};

export function BlockRenderer({ block }: BlockRendererProps) {
  const props = block.props as {
    title?: string;
    text?: string;
    imageUrl?: string;
  };

  switch (block.type) {
    case "hero":
      return (
        <section className="rounded-xl bg-slate-900 p-8 text-white">
          <h3 className="text-2xl font-bold">{props.title ?? "Hero Block"}</h3>
          <p className="mt-2 text-slate-200">{props.text ?? "in costruzione"}</p>
        </section>
      );
    case "text":
      return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">{props.title ?? "Text Block"}</h3>
          <p className="mt-2 text-slate-600">{props.text ?? "in costruzione"}</p>
        </section>
      );
    case "image":
      return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {props.imageUrl ? "Anteprima immagine" : "Immagine in costruzione"}
          </div>
        </section>
      );
    default:
      return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Blocco non supportato.
        </section>
      );
  }
}
