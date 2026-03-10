import { Heart } from "lucide-react";

import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    collection?: string;
    imageUrl?: string;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex aspect-[4/5] items-center justify-center bg-slate-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-slate-500">Immagine prodotto</span>
        )}
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:text-rose-500"
          aria-label="Aggiungi alla wishlist"
        >
          <Heart size={16} />
        </button>
        {product.collection ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#C9A96E] px-2.5 py-1 text-xs font-medium text-white">
            {product.collection}
          </span>
        ) : null}
      </div>

      <div className="space-y-1 p-4">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <p className="text-sm text-slate-600">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}
