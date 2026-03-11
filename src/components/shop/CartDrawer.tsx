"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, TicketPercent, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn, formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 150;

export function CartDrawer() {
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const {
    items,
    isOpen,
    couponCode,
    discount,
    subtotal,
    total,
    isLoading,
    freeShipping,
    totalItems,
    toggleCart,
    applyCoupon,
    removeCoupon,
    removeItem,
    updateQuantity,
  } = useCartStore((state) => state);

  const progress = useMemo(
    () => Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100)),
    [total],
  );
  const missingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);

  function handleApplyCoupon() {
    const isValid = applyCoupon(couponInput);
    setCouponMessage(isValid ? "Coupon LAB15 applicato con successo." : "Coupon non valido.");
  }

  return (
    <div className={cn("fixed inset-0 z-[60]", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={() => toggleCart(false)}
        role="presentation"
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#E7DFD4] px-5 py-4">
          <h2 className="font-serif text-3xl text-[#1E1810]">Carrello</h2>
          <Button variant="ghost" onClick={() => toggleCart(false)} aria-label="Chiudi carrello">
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-4 border-b border-[#E7DFD4] px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-[#5C5048]">
            <TicketPercent size={16} className="text-[#D4918F]" />
            <span>
              {freeShipping
                ? "Hai sbloccato la spedizione gratuita."
                : `Ti mancano ${formatPrice(missingForFreeShipping)} per la spedizione gratuita.`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EFE8DB]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4918F] to-[#A8C4B0] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-[#F8F6F2] p-6 text-center text-sm text-[#5C5048]">
              Il carrello è vuoto. Aggiungi un prodotto e personalizzalo.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const image = item.product.images?.[0];
                return (
                  <article key={`${item.product.id}-${JSON.stringify(item.selected_options)}`} className="rounded-2xl border border-[#E7DFD4] bg-[#FFFEFD] p-3">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#E7DFD4] bg-[#F8F6F2]">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product.name}
                            fill
                            loader={cloudinaryLoader}
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-[#5C5048]">
                            Foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-medium text-[#1E1810]">{item.product.name}</p>
                        <p className="text-xs text-[#5C5048]">{formatPrice(item.product.price ?? 0)}</p>
                        {Object.entries(item.selected_options).length ? (
                          <p className="text-xs text-[#7A6F66]">
                            {Object.entries(item.selected_options)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" · ")}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-white">
                            <button
                              type="button"
                              className="p-1.5 text-[#5C5048]"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-8 text-center text-xs font-medium text-[#1E1810]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="p-1.5 text-[#5C5048]"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-[#8A5E5A] hover:text-[#D4918F]"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 size={13} />
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-[#E7DFD4] px-5 py-4">
          <div className="rounded-xl border border-[#E7DFD4] bg-[#F8F6F2] p-3">
            <label htmlFor="coupon" className="block text-xs font-medium uppercase tracking-[0.1em] text-[#5C5048]">
              Coupon
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon"
                type="text"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="Inserisci codice (es. LAB15)"
                className="h-10 flex-1 rounded-full border border-[#D7CEC1] bg-white px-4 text-sm outline-none focus:border-[#D4918F]"
              />
              <Button onClick={handleApplyCoupon} className="rounded-full bg-[#D4918F] hover:bg-[#c47f7d]">
                Applica
              </Button>
            </div>
            {couponCode ? (
              <div className="mt-2 flex items-center justify-between text-xs text-[#5C5048]">
                <span>Coupon attivo: {couponCode}</span>
                <button type="button" className="underline" onClick={removeCoupon}>
                  Rimuovi
                </button>
              </div>
            ) : null}
            {couponMessage ? <p className="mt-2 text-xs text-[#5C5048]">{couponMessage}</p> : null}
          </div>

          <div className="space-y-1 text-sm text-[#5C5048]">
            <div className="flex items-center justify-between">
              <span>Articoli</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Subtotale</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sconto</span>
              <span>- {formatPrice(discount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#E7DFD4] pt-2 text-base font-semibold text-[#1E1810]">
              <span>Totale</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <Link href="/checkout" onClick={() => toggleCart(false)}>
            <Button className="w-full rounded-full bg-[#D4918F] py-3 text-base text-white hover:bg-[#c47f7d]" disabled={isLoading || items.length === 0}>
              Vai al Checkout
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}

