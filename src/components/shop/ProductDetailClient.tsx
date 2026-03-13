"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type ProductDetailClientProps = {
  product: Product;
  relatedProducts: Product[];
};

const reviews = [
  {
    author: "Maria G.",
    text: "Partecipazioni bellissime e supporto WhatsApp velocissimo. Bozza approvata al primo colpo.",
  },
  {
    author: "Claudia R.",
    text: "Lavoro artigianale preciso e confezione curata. Il risultato finale era ancora più bello dal vivo.",
  },
  {
    author: "Valentina M.",
    text: "Servizio impeccabile e tempi rispettati. Consigliatissimo per chi vuole qualcosa di unico.",
  },
];

function normalizeImages(images: string[]) {
  if (!images.length) {
    return ["https://res.cloudinary.com/demo/image/upload/sample.jpg"];
  }

  return images;
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(9999, Math.round(value)));
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useCartStore((state) => state.toggleCart);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [openCustomize, setOpenCustomize] = useState(true);
  const [openDescription, setOpenDescription] = useState(false);
  const [hideStickyCta, setHideStickyCta] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ctaSectionRef = useRef<HTMLDivElement | null>(null);
  const gallery = useMemo(() => normalizeImages(product.images ?? []), [product.images]);
  const unitPrice = product.price_min ?? product.price ?? 0;
  const estimatedTotal = unitPrice * quantity;

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const target = ctaSectionRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideStickyCta(entry.isIntersecting);
      },
      { threshold: 0.32 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function handleAddToCart() {
    addItem({
      product,
      quantity,
      selected_options: {},
      customizationNotes: customizationNotes.trim() || undefined,
    });
    toggleCart(true);
    setToastMessage("✅ Aggiunto! Procedi al checkout per completare l'ordine");
  }

  return (
    <div className="space-y-8 pb-24 md:pb-6">
      {toastMessage ? (
        <div className="fixed left-1/2 top-20 z-[75] w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-[#CFE4D4] bg-[#EFF8F1] px-4 py-3 text-sm text-[#2F6A42] shadow-md">
          {toastMessage}
        </div>
      ) : null}

      <article className="grid gap-7 lg:grid-cols-[55%_45%]">
        <section className="-mx-4 space-y-3 sm:mx-0">
          <div className="relative aspect-square overflow-hidden bg-[#F3ECE3] sm:rounded-2xl">
            <Image
              src={gallery[selectedImageIndex]}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              style={{ touchAction: "manipulation" }}
            />
            {product.collection ? (
              <span className="absolute left-3 top-3 rounded-full bg-[#1E1810]/75 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-white">
                {product.collection}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setWishlist((current) => !current)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#5C5048]"
              aria-label={wishlist ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"}
            >
              <Heart size={18} className={wishlist ? "fill-[#D4918F] text-[#D4918F]" : ""} />
            </button>
          </div>

          <div className="no-scrollbar overflow-x-auto px-4 sm:px-0">
            <div className="flex w-max gap-2">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border",
                    selectedImageIndex === index ? "border-[#D4918F]" : "border-[#E7DED2]",
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    loader={cloudinaryLoader}
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5 px-4 sm:px-0">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#D4918F]">
              {product.collection ?? "Effegi Lab"}
            </p>
            <h1 className="font-serif text-[28px] leading-[1.1] text-[#1E1810]">{product.name}</h1>
            <button
              type="button"
              onClick={() => {
                const reviewsElement = document.getElementById("reviews-section");
                reviewsElement?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-1 text-[12px] text-[#6F645A]"
            >
              <Star size={12} className="fill-[#E8B4B4] text-[#E8B4B4]" />
              4.9 (23 recensioni)
            </button>
            <p className="text-[22px] font-bold text-[#1E1810]">da {formatPrice(unitPrice)}</p>
            <p className="text-[12px] text-[#7A6F66]">per pezzo</p>
          </div>

          <div className="border-t border-[#E8DED2] pt-4">
            <button
              type="button"
              onClick={() => setOpenCustomize((current) => !current)}
              className="flex w-full min-h-12 items-center justify-between rounded-xl bg-[#F8F6F2] px-4 text-left"
            >
              <span className="text-sm font-medium text-[#1E1810]">🎨 Come personalizzare</span>
              <ChevronDown size={18} className={cn("transition", openCustomize ? "rotate-180" : "")} />
            </button>

            {openCustomize ? (
              <div className="space-y-4 px-1 pb-1 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#1E1810]">Quantità</p>
                  <div className="flex items-center gap-0 overflow-hidden rounded-full border border-[#D7CEC1] bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => clampQuantity(current - 1))}
                      className="flex h-12 w-12 items-center justify-center text-[#5C5048] hover:bg-[#F8F6F2]"
                      aria-label="Riduci quantità"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      placeholder="es. 50"
                      value={quantity}
                      onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
                      className="w-16 border-x border-[#D7CEC1] bg-white py-2 text-center text-[16px] font-semibold text-[#1E1810] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => clampQuantity(current + 1))}
                      className="flex h-12 w-12 items-center justify-center text-[#5C5048] hover:bg-[#F8F6F2]"
                      aria-label="Aumenta quantità"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-[#6F645A]">Puoi ordinare qualsiasi quantità, nessun minimo</p>
                </div>

                <div className="space-y-1 text-[13px] text-[#5C5048]">
                  <p>Step 2: Dopo l&apos;ordine ti contatteremo su WhatsApp per concordare testi e grafica.</p>
                  <p>Bozza inclusa • Max 3 revisioni • Prova di stampa.</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#E8E0D8] bg-[#FBF8F5] p-4">
            <p className="text-[14px] font-semibold text-[#1E1810]">✏️ Personalizzazione</p>
            <p className="mt-1 text-[12px] text-[#6F645A]">
              Inserisci le tue preferenze — ti contatteremo per la bozza grafica
            </p>
            <textarea
              value={customizationNotes}
              onChange={(event) => setCustomizationNotes(event.target.value.slice(0, 1000))}
              rows={4}
              maxLength={1000}
              placeholder="Es: Nomi degli sposi, data e luogo del matrimonio, colore preferito, font, eventuali note speciali..."
              className="mt-3 w-full resize-none rounded-xl border border-[#E0D8D0] bg-white px-3 py-2 text-[16px] outline-none focus:border-[#D4918F]"
            />
            <p className="mt-1 text-right text-[11px] italic text-[#8A7E74]">{customizationNotes.length}/1000</p>
            <p className="mt-2 text-[12px] text-[#6F645A]">
              💡 Riceverai la bozza grafica entro 48h dalla conferma dell&apos;ordine. Incluse fino a 3 revisioni gratuite.
            </p>
          </div>

          <div ref={ctaSectionRef} className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4918F] px-6 text-sm font-medium text-white"
            >
              Aggiungi al Carrello
            </button>
            <p className="text-xs text-[#6F645A]">Totale stimato: {formatPrice(estimatedTotal)}</p>
            <div className="flex flex-col gap-1 text-xs text-[#5C5048]">
              <Link href="https://wa.me/393333333333" target="_blank" className="underline underline-offset-2">
                💬 Hai dubbi? Scrivici su WhatsApp
              </Link>
              <Link
                href="https://effegi-lab2.reservio.com/booking"
                target="_blank"
                className="underline underline-offset-2"
              >
                📅 Prenota consulenza gratuita
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8DED2]">
            <button
              type="button"
              onClick={() => setOpenDescription((current) => !current)}
              className="flex w-full min-h-12 items-center justify-between px-4 text-left text-sm font-medium text-[#1E1810]"
            >
              Descrizione prodotto
              <ChevronDown size={18} className={cn("transition", openDescription ? "rotate-180" : "")} />
            </button>
            {openDescription ? (
              <p className="px-4 pb-4 text-sm text-[#5C5048]">
                {product.description ??
                  "Prodotto artigianale personalizzabile. Ogni ordine include bozza grafica e supporto dedicato."}
              </p>
            ) : null}
          </div>
        </section>
      </article>

      <section className="space-y-3">
        <h2 className="font-serif text-[30px] italic text-[#1E1810]">Completa il tuo set</h2>
        {relatedProducts.length ? (
          <div className="no-scrollbar overflow-x-auto">
            <div className="grid w-max grid-flow-col gap-3">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} className="w-[200px]" />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6F645A]">Altri prodotti della collezione in arrivo.</p>
        )}
      </section>

      <section id="reviews-section" className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4 md:p-6">
        <h2 className="font-serif text-[30px] italic text-[#1E1810]">Recensioni</h2>
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.author} className="rounded-xl border border-[#EFE6DB] bg-[#FCFAF8] p-4">
              <p className="text-sm text-[#F4B740]">⭐⭐⭐⭐⭐</p>
              <p className="mt-2 text-sm italic text-[#5C5048]">“{review.text}”</p>
              <p className="mt-2 text-xs font-medium text-[#1E1810]">{review.author}</p>
            </article>
          ))}
        </div>
      </section>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DED2] bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] transition md:hidden",
          hideStickyCta ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#9A8E84]">Totale stimato</p>
            <p className="text-sm font-semibold text-[#1E1810]">~{formatPrice(estimatedTotal)} ({quantity} pz)</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white"
          >
            Aggiungi al Carrello
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#F8F6F2] p-4 text-sm text-[#5C5048]">
        <p>Hai dubbi? Scrivici su WhatsApp con il numero ordine per ricevere supporto immediato.</p>
        <Link
          href="https://wa.me/393333333333"
          target="_blank"
          className="mt-2 inline-flex text-sm font-medium text-[#1E1810] underline"
        >
          Apri chat WhatsApp
        </Link>
      </div>
    </div>
  );
}
