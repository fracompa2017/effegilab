"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const WISHLIST_STORAGE_KEY = "effegi-wishlist";

type ProductCardProps = {
  product: Product;
  className?: string;
  showWishlistButton?: boolean;
};

type BadgeVariant = "NUOVO" | "BESTSELLER" | "-15%";

function readGuestWishlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
}

function normalizeWishlistIds(ids: string[]) {
  return Array.from(new Set(ids));
}

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

function wishlistQueryKey(userId: string | null) {
  return ["wishlist-ids", userId ?? "guest"] as const;
}

export function ProductCard({ product, className, showWishlistButton = true }: ProductCardProps) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const [showVariant, setShowVariant] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserId(user?.id ?? null);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      void queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  const idsQuery = useQuery({
    queryKey: wishlistQueryKey(userId),
    enabled: showWishlistButton,
    queryFn: async () => {
      if (!showWishlistButton) {
        return [];
      }

      if (!userId) {
        return readGuestWishlist();
      }

      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      return normalizeWishlistIds((data ?? []).map((entry) => String(entry.product_id)));
    },
    staleTime: 20_000,
    initialData: showWishlistButton ? readGuestWishlist() : [],
  });

  const wishlistIds = idsQuery.data ?? [];
  const isWishlisted = wishlistIds.includes(product.id);

  const toggleWishlistMutation = useMutation({
    mutationFn: async (nextState: boolean) => {
      const key = wishlistQueryKey(userId);
      const currentIds = (queryClient.getQueryData<string[]>(key) ?? []).slice();
      const nextIds = normalizeWishlistIds(
        nextState
          ? [...currentIds, product.id]
          : currentIds.filter((entry) => entry !== product.id),
      );

      if (!userId) {
        writeGuestWishlist(nextIds);
        return nextIds;
      }

      if (nextState) {
        const { error } = await supabase.from("wishlists").upsert(
          {
            user_id: userId,
            product_id: product.id,
          },
          { onConflict: "user_id,product_id" },
        );

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      return nextIds;
    },
    onMutate: async (nextState) => {
      const key = wishlistQueryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousIds = queryClient.getQueryData<string[]>(key) ?? [];
      const optimisticIds = normalizeWishlistIds(
        nextState
          ? [...previousIds, product.id]
          : previousIds.filter((entry) => entry !== product.id),
      );

      queryClient.setQueryData<string[]>(key, optimisticIds);

      return { previousIds };
    },
    onError: (_error, _nextState, context) => {
      const key = wishlistQueryKey(userId);
      queryClient.setQueryData<string[]>(key, context?.previousIds ?? []);
    },
    onSuccess: (nextIds) => {
      const key = wishlistQueryKey(userId);
      queryClient.setQueryData<string[]>(key, nextIds);
    },
  });

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

          {showWishlistButton ? (
            <button
              type="button"
              aria-label={isWishlisted ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"}
              onClick={(event) => {
                event.preventDefault();
                const nextState = !isWishlisted;
                toggleWishlistMutation.mutate(nextState);
              }}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#5C5048]"
            >
              <Heart size={16} className={cn(isWishlisted ? "fill-[#D4918F] text-[#D4918F]" : "")} />
            </button>
          ) : null}

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
