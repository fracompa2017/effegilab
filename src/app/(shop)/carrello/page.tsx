"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 150;

export default function CartPage() {
  const { items, subtotal, discount, total, freeShipping, updateQuantity, removeItem, clearCart } =
    useCartStore((state) => state);

  const missingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-serif text-5xl text-[#1E1810]">Il tuo carrello</h1>
        <p className="text-[#5C5048]">
          Rivedi i prodotti e procedi con la personalizzazione finale prima del checkout.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[#D7CEC1] bg-white p-10 text-center">
          <p className="text-[#5C5048]">Il tuo carrello è vuoto.</p>
          <Link href="/shop" className="mt-4 inline-flex rounded-full bg-[#D4918F] px-6 py-3 text-white">
            Vai allo shop
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {items.map((item) => {
              const image = item.product.images?.[0];
              return (
                <article
                  key={`${item.product.id}-${JSON.stringify(item.selected_options)}`}
                  className="rounded-2xl border border-[#E7DFD4] bg-white p-4"
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-[#E7DFD4] bg-[#F8F6F2]">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product.name}
                          fill
                          loader={cloudinaryLoader}
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#1E1810]">{item.product.name}</p>
                          <p className="text-sm text-[#5C5048]">{formatPrice(item.product.price ?? 0)}</p>
                        </div>
                        <button
                          type="button"
                          className="text-[#8A5E5A] hover:text-[#D4918F]"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-[#F8F6F2]">
                        <button
                          type="button"
                          className="p-2 text-[#5C5048]"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-10 text-center text-sm font-medium text-[#1E1810]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-2 text-[#5C5048]"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit space-y-4 rounded-2xl border border-[#E7DFD4] bg-white p-5">
            <h2 className="font-serif text-3xl text-[#1E1810]">Riepilogo</h2>
            <div className="space-y-2 text-sm text-[#5C5048]">
              <div className="flex items-center justify-between">
                <span>Subtotale</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sconto</span>
                <span>- {formatPrice(discount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E7DFD4] pt-2 text-base font-semibold text-[#1E1810]">
                <span>Totale</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F6F2] p-3 text-sm text-[#5C5048]">
              {freeShipping ? (
                <p>Spedizione gratuita attiva.</p>
              ) : (
                <p>Ti mancano {formatPrice(missingForFreeShipping)} per la spedizione gratuita.</p>
              )}
            </div>

            <div className="space-y-2">
              <Link href="/checkout">
                <Button className="w-full rounded-full bg-[#D4918F] py-3 text-white hover:bg-[#c47f7d]">
                  Vai al checkout
                </Button>
              </Link>
              <Button variant="outline" className="w-full rounded-full py-3" onClick={clearCart}>
                Svuota carrello
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

