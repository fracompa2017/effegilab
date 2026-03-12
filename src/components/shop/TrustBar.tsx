import { cn } from "@/lib/utils";

type TrustBarProps = {
  sticky?: boolean;
  className?: string;
};

const trustItems = [
  { icon: "🎨", label: "Personalizzazione gratuita" },
  { icon: "🚚", label: "Spedizione da 150€ gratis" },
  { icon: "✅", label: "Bozza inclusa nell'ordine" },
  { icon: "💬", label: "WhatsApp dedicato" },
];

export function TrustBar({ sticky = false, className }: TrustBarProps) {
  return (
    <section
      className={cn(
        "border-y border-[#E8E2D8] bg-[#F0EDE8]",
        sticky ? "sticky top-14 z-30 md:top-[72px]" : "",
        className,
      )}
      aria-label="Segnali di fiducia"
    >
      <div className="no-scrollbar overflow-x-auto px-4 md:px-6">
        <div className="mx-auto flex w-max min-w-full gap-3 py-3 md:grid md:max-w-7xl md:grid-cols-4 md:gap-2 md:py-4">
          {trustItems.map((item) => (
            <article
              key={item.label}
              className="inline-flex min-h-12 min-w-[220px] items-center gap-2 rounded-xl bg-white/70 px-3 md:min-w-0 md:justify-center"
            >
              <span className="text-xl" aria-hidden>
                {item.icon}
              </span>
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B5E52]">
                {item.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
