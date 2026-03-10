import { ProductCard } from "@/components/shop/ProductCard";

const featuredProducts = [
  {
    id: "invito-1",
    name: "Invito Matrimonio Elegance",
    price: 4.9,
    collection: "Elegance",
    imageUrl: "",
  },
  {
    id: "menu-1",
    name: "Menu Ricevimento Gold",
    price: 3.5,
    collection: "Gold Collection",
    imageUrl: "",
  },
  {
    id: "segnaposto-1",
    name: "Segnaposto Minimal",
    price: 2.2,
    collection: "Minimal",
    imageUrl: "",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#C9A96E] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#C9A96E]">Effegi Lab</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Wedding stationery su misura</h1>
        <p className="mt-3 text-slate-600">
          Homepage ecommerce pronta come base. Le sezioni definitive sono in costruzione.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Prodotti in evidenza</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
