import Link from "next/link";

const weddingLinks = [
  { label: "Partecipazioni", href: "/shop?categoria=partecipazioni" },
  { label: "Cerimonia", href: "/shop?categoria=cerimonia" },
  { label: "Ricevimento", href: "/shop?categoria=ricevimento" },
  { label: "Dettagli", href: "/shop?categoria=dettagli" },
];

const collectionLinks = [
  { label: "Amalfi Coast", href: "/collezioni/amalfi-coast" },
  { label: "Bridgerton", href: "/collezioni/bridgerton" },
  { label: "Dreamy Pink Rose", href: "/collezioni/dreamy-pink-rose" },
  { label: "Sage & Pearl", href: "/collezioni/sage-pearl" },
];

const infoLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Contatti", href: "/contatti" },
];

const paymentMethods = [
  "Visa",
  "Mastercard",
  "PayPal",
  "Contrassegno",
];

const footerColumns = [
  {
    title: "Wedding",
    items: weddingLinks,
  },
  {
    title: "Collezioni",
    items: collectionLinks,
  },
  {
    title: "Info",
    items: infoLinks,
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-[#18140E] text-[#F8F6F2]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_2fr]">
        <div className="space-y-4">
          <p className="font-serif text-4xl text-white">
            Effegi<span className="italic text-[#E8B4B4]">Lab</span>
          </p>
          <p className="max-w-md text-sm leading-relaxed text-[#D6CEC4]">
            Wedding stationery artigianale disegnata e prodotta a Napoli. Ogni ordine include
            consulenza personalizzata, bozza grafica e supporto WhatsApp prima della stampa.
          </p>
          <div className="space-y-1 text-sm text-[#D6CEC4]">
            <p>Napoli, Italia</p>
            <p>
              WhatsApp: <Link href="https://wa.me/393333333333" className="hover:text-white">+39 333 333 3333</Link>
            </p>
            <p>
              Email: <Link href="mailto:info@effegi-lab.it" className="hover:text-white">info@effegi-lab.it</Link>
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E8B4B4]">
                {column.title}
              </h3>
              <ul className="space-y-2 text-sm text-[#D6CEC4]">
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link href={item.href} className="hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 text-sm text-[#D6CEC4] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#E8B4B4]">Pagamenti:</span>
            {paymentMethods.map((method) => (
              <span key={method} className="rounded-full border border-white/20 px-3 py-1 text-xs">
                {method}
              </span>
            ))}
          </div>
          <p>P.IVA 047522000610 — Lama Giuseppina</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-[#B3A79A]">
          © {new Date().getFullYear()} Effegi Lab. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
