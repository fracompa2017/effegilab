"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, TicketPercent, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const FREE_SHIPPING_THRESHOLD = 150;

async function fetchUpsellProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export default function CartPage() {
  const {
    items,
    subtotal,
    discount,
    total,
    freeShipping,
    couponCode,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore((state) => state);

  const [couponInput, setCouponInput] = useState(couponCode ?? "LAB15");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);

  const progress = useMemo(
    () => Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100)),
    [total],
  );
  const missingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);

  const upsellQuery = useQuery({
    queryKey: ["cart-upsell-products"],
    queryFn: fetchUpsellProducts,
    staleTime: 60_000,
  });

  function handleApplyCoupon() {
    const valid = applyCoupon(couponInput);
    setCouponMessage(valid ? "Coupon LAB15 applicato." : "Coupon non valido.");
  }

  if (!items.length) {
    return (
      <section className="space-y-4 rounded-2xl border border-dashed border-[#D8CEC1] bg-white p-6 text-center">
        <h1 className="font-serif text-[38px] text-[#1E1810]">Il tuo Carrello (0)</h1>
        <p className="text-sm text-[#6F645A]">Nessun prodotto al momento. Inizia dalla vetrina shop.</p>
        <Link
          href="/shop"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-6 text-sm font-medium text-white"
        >
          Continua lo shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <Link href="/shop" className="inline-flex min-h-12 min-w-12 items-center justify-center text-[#5C5048]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif text-[34px] text-[#1E1810]">Il tuo Carrello ({items.length})</h1>
        <span className="inline-flex h-12 w-12" />
      </header>

      <section className="space-y-3">
        {items.map((item) => {
          const image = item.product.images?.[0];

          return (
            <article
              key={`${item.product.id}-${JSON.stringify(item.selected_options)}`}
              className="relative overflow-hidden rounded-2xl border border-[#E8DED2] bg-white p-3"
              onTouchStart={(event) => {
                setTouchStartX(event.changedTouches[0]?.clientX ?? null);
              }}
              onTouchEnd={(event) => {
                const endX = event.changedTouches[0]?.clientX ?? 0;
                if (touchStartX !== null && touchStartX - endX > 75) {
                  setSwipedItemId(item.product.id);
                }
                setTouchStartX(null);
              }}
            >
              <div className="flex gap-3">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#EFE7DB]">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.product.name}
                      fill
                      loader={cloudinaryLoader}
                      sizes="72px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-sm font-medium text-[#1E1810]">{item.product.name}</p>
                  {item.customizationNotes ? (
                    <p className="text-[11px] italic text-[#7A6F66]">
                      ✏️ Note:{" "}
                      {item.customizationNotes.length > 50
                        ? `${item.customizationNotes.slice(0, 50)}...`
                        : item.customizationNotes}
                    </p>
                  ) : null}
                  <p className="text-sm text-[#5C5048]">{formatPrice(item.product.price ?? 0)}</p>
                  <div className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-[#F8F6F2]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="inline-flex h-12 w-12 items-center justify-center text-[#5C5048]"
                      aria-label="Riduci quantità"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium text-[#1E1810]">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="inline-flex h-12 w-12 items-center justify-center text-[#5C5048]"
                      aria-label="Aumenta quantità"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.product.id)}
                className={cn(
                  "absolute bottom-3 right-3 inline-flex min-h-12 min-w-12 items-center gap-1 rounded-full border border-[#E9D3D0] px-3 text-xs text-[#A24D49] transition",
                  swipedItemId === item.product.id ? "opacity-100" : "opacity-0 md:opacity-100",
                )}
              >
                <Trash2 size={13} />
                Elimina
              </button>
            </article>
          );
        })}
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-[#5C5048]">
          <TicketPercent size={15} className="text-[#D4918F]" />
          <p>Coupon attivo consigliato: <strong>LAB15</strong></p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            className="h-12 flex-1 rounded-full border border-[#D7CEC1] px-4 text-base outline-none"
            placeholder="Inserisci coupon"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white"
          >
            Applica
          </button>
        </div>
        {couponCode ? (
          <button type="button" onClick={removeCoupon} className="text-xs text-[#5C5048] underline">
            Rimuovi coupon ({couponCode})
          </button>
        ) : null}
        {couponMessage ? <p className="text-xs text-[#6F645A]">{couponMessage}</p> : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
        <p className="text-sm text-[#5C5048]">
          {freeShipping
            ? "Spedizione gratuita attiva 🚚"
            : `Aggiungi ${formatPrice(missingForFreeShipping)} per la spedizione gratuita 🚚`}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-[#EFE5DA]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#D4918F] to-[#7EA890]" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-[#E8DED2] bg-white p-4">
        <div className="flex items-center justify-between text-sm text-[#5C5048]">
          <span>Subtotale</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#5C5048]">
          <span>Sconto</span>
          <span>- {formatPrice(discount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#EFE6DB] pt-2 text-lg font-semibold text-[#1E1810]">
          <span>Totale</span>
          <span>{formatPrice(total)}</span>
        </div>
      </section>

      <Link
        href="/checkout"
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-[#D4918F] px-6 text-base font-semibold text-white"
      >
        Vai al Checkout →
      </Link>

      <div className="text-center text-xs text-[#6F645A]">🔒 Pagamento sicuro · Visa · Mastercard · PayPal</div>
      <Link href="/shop" className="block text-center text-sm text-[#5C5048] underline">
        Continua lo shopping
      </Link>

      <section className="space-y-3">
        <h2 className="font-serif text-[30px] italic text-[#1E1810]">Completa il tuo set 💍</h2>
        {upsellQuery.isLoading ? (
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex w-max gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[280px] w-[190px] rounded-2xl bg-[#ECE4D9]" />
              ))}
            </div>
          </div>
        ) : (
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex w-max gap-3">
              {(upsellQuery.data ?? []).map((product) => (
                <ProductCard key={product.id} product={product} className="w-[190px]" />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
