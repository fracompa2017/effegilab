import Link from "next/link";

const columns = [
  {
    title: "Menu",
    items: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Carrello", href: "/carrello" },
    ],
  },
  {
    title: "Categorie",
    items: [
      { label: "Inviti", href: "/shop" },
      { label: "Table Setting", href: "/shop" },
      { label: "Bomboniere", href: "/shop" },
    ],
  },
  {
    title: "Contatti",
    items: [
      { label: "hello@effegilab.it", href: "mailto:hello@effegilab.it" },
      { label: "+39 000 000 0000", href: "tel:+390000000000" },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Instagram", href: "#" },
      { label: "Pinterest", href: "#" },
      { label: "Facebook", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#C9A96E]/40 bg-white/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C9A96E]">{column.title}</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {column.items.map((item) => (
                <li key={`${column.title}-${item.label}`}>
                  <Link href={item.href} className="hover:text-slate-900">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
