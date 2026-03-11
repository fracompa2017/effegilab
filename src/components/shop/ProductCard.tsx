"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useCartStore((state) => state.toggleCart);

  const displayPrice = product.price ?? product.price_min ?? 0;
  const productImage = product.images?.[0];

  function handlePersonalize() {
    addItem({
      product,
      quantity: 1,
      selected_options: {},
    });
    toggleCart(true);
  }

  return (
    <article className={cn("group overflow-hidden rounded-3xl border border-[#E6DFD4] bg-white", className)}>
      <Link href={`/prodotto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#F3EFE8]">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#5C5048]">
              Anteprima prodotto
            </div>
          )}
          {product.collection ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#5C5048]">
              {product.collection}
            </span>
          ) : null}
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-[#5C5048] shadow-sm transition-colors hover:text-[#D4918F]"
            aria-label="Aggiungi alla wishlist"
          >
            <Heart size={16} />
          </button>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link href={`/prodotto/${product.slug}`} className="font-medium text-[#1E1810] hover:text-[#D4918F]">
            {product.name}
          </Link>
          <p className="mt-1 text-sm text-[#5C5048]">{formatPrice(displayPrice)}</p>
        </div>
        <Button className="w-full bg-[#D4918F] text-white hover:bg-[#c88482]" onClick={handlePersonalize}>
          Personalizza
        </Button>
      </div>
    </article>
  );
}

