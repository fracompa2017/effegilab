"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  className?: string;
};

type BadgeVariant = "NUOVO" | "BESTSELLER" | "-15%";

function productHash(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getCardBadge(product: Product): BadgeVariant | null {
  const createdAt = new Date(product.created_at).getTime();
  const daysFromCreation = Math.floor((Date.now() - createdAt) / 86_400_000);
  if (daysFromCreation <= 40) {
    return "NUOVO";
  }

  if ((productHash(product.id) + (product.stock ?? 0)) % 3 === 0) {
    return "BESTSELLER";
  }

  if (product.is_active) {
    return "-15%";
  }

  return null;
}

function getBadgeClasses(badge: BadgeVariant) {
  if (badge === "NUOVO") {
    return "bg-[#7EA890] text-white";
  }
  if (badge === "BESTSELLER") {
    return "bg-[#D4918F] text-white";
  }
  return "bg-[#D94B4B] text-white";
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wishlist, setWishlist] = useState(false);
  const [showVariant, setShowVariant] = useState(false);

  const mainImage = product.images?.[0] ?? "";
  const secondaryImage = product.images?.[1] ?? mainImage;
  const displayImage = showVariant ? secondaryImage : mainImage;
  const badge = getCardBadge(product);

  const displayPrice = product.price ?? product.price_min ?? 0;
  const reviewsCount = useMemo(() => 12 + (productHash(product.id) % 24), [product.id]);
  const rating = useMemo(() => 4.7 + (productHash(product.slug) % 3) * 0.1, [product.slug]);

  return (
    <article className={cn("group rounded-lg bg-white", className)}>
      <div className="relative overflow-hidden rounded-lg border border-[#E7DED2]">
        <Link
          href={`/prodotto/${product.slug}`}
          className="relative block aspect-[4/5] bg-[#F3ECE3]"
          onClick={() => setShowVariant(false)}
          onTouchStart={() => {
            if (secondaryImage && secondaryImage !== mainImage) {
              setShowVariant((current) => !current);
            }
          }}
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
              className="object-cover transition-transform duration-300 md:group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#6F6359]">
              Anteprima prodotto
            </div>
          )}

          {badge ? (
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                getBadgeClasses(badge),
              )}
            >
              {badge}
            </span>
          ) : null}

          <button
            type="button"
            aria-label={wishlist ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"}
            onClick={(event) => {
              event.preventDefault();
              setWishlist((current) => !current);
            }}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#5C5048]"
          >
            <Heart size={16} className={cn(wishlist ? "fill-[#D4918F] text-[#D4918F]" : "")} />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-center p-4 md:flex">
            <span className="translate-y-4 rounded-full bg-white/92 px-4 py-2 text-xs font-medium text-[#1E1810] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              Quick view
            </span>
          </div>
        </Link>
      </div>

      <div className="space-y-2 px-1 pb-1 pt-3">
        <Link
          href={`/prodotto/${product.slug}`}
          className="line-clamp-2 min-h-[42px] text-[14px] font-medium leading-[1.35] text-[#1E1810]"
        >
          {product.name}
        </Link>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#D4918F]">{product.collection ?? "Effegi Lab"}</p>
        <p className="text-[16px] font-semibold text-[#1E1810]">
          {product.price_min ? `da ${formatPrice(product.price_min)}` : formatPrice(displayPrice)}
        </p>

        <div className="flex items-center gap-1 text-[11px] text-[#7A6E64]">
          <Star size={12} className="fill-[#E8B4B4] text-[#E8B4B4]" />
          <span>{rating.toFixed(1)}</span>
          <span>({reviewsCount})</span>
        </div>

        <Link
          href={`/prodotto/${product.slug}`}
          className="flex min-h-10 w-full items-center justify-center rounded-full bg-[#D4918F] px-3 text-[13px] font-medium text-white"
        >
          Personalizza
        </Link>
      </div>
    </article>
  );
}
