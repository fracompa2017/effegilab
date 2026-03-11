"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/cart-store";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type ProductDetailClientProps = {
  product: Product;
};

const formatOptions = ["10x15 cm", "12x18 cm", "15x21 cm"];
const paperOptions = ["Tintoretto Avorio", "Fedrigoni Texture", "Perlata Premium"];

function normalizeGallery(images: string[]): string[] {
  const sanitized = images.filter(Boolean);

  if (sanitized.length >= 5) {
    return sanitized.slice(0, 5);
  }

  if (sanitized.length === 0) {
    return Array.from({ length: 5 }, () => "");
  }

  const gallery = [...sanitized];
  while (gallery.length < 5) {
    gallery.push(sanitized[gallery.length % sanitized.length]);
  }
  return gallery;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useCartStore((state) => state.toggleCart);

  const [selectedFormat, setSelectedFormat] = useState(formatOptions[0]);
  const [selectedPaper, setSelectedPaper] = useState(paperOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const gallery = useMemo(() => normalizeGallery(product.images ?? []), [product.images]);

  const unitPrice = product.price ?? product.price_min ?? 0;
  const fullPrice = product.price_max && product.price_max > unitPrice ? product.price_max : null;
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    addItem({
      product,
      quantity,
      selected_options: {
        formato: selectedFormat,
        carta: selectedPaper,
      },
    });
    toggleCart(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#E7DFD4] bg-white">
          {gallery[selectedImageIndex] ? (
            <Image
              src={gallery[selectedImageIndex]}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="aspect-square object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-sm text-[#5C5048]">
              Anteprima prodotto
            </div>
          )}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-white",
                selectedImageIndex === index
                  ? "border-[#D4918F] ring-2 ring-[#D4918F]/30"
                  : "border-[#E7DFD4]",
              )}
            >
              {image ? (
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  width={160}
                  height={160}
                  loader={cloudinaryLoader}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-xs text-[#5C5048]">
                  Img {index + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-[#E7DFD4] bg-white p-6 sm:p-8">
        {product.collection ? (
          <span className="inline-flex rounded-full border border-[#D4918F] bg-[#FDF4F3] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#5C5048]">
            {product.collection}
          </span>
        ) : null}

        <div className="space-y-3">
          <h1 className="font-serif text-5xl leading-tight text-[#1E1810]">{product.name}</h1>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-semibold text-[#1E1810]">{formatPrice(unitPrice)}</p>
            {fullPrice ? (
              <p className="text-lg text-[#8E837A] line-through">{formatPrice(fullPrice)}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={15} className="fill-[#D4918F] text-[#D4918F]" />
            ))}
            <span className="ml-2 text-sm text-[#5C5048]">4.9 · 84 recensioni</span>
          </div>
          <p className="text-[#5C5048]">
            {product.description ??
              "Prodotto artigianale personalizzabile. Dopo l'ordine riceverai la bozza grafica via WhatsApp prima della produzione."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[#1E1810]">Formato</p>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedFormat(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    selectedFormat === option
                      ? "border-[#D4918F] bg-[#FDF4F3] text-[#1E1810]"
                      : "border-[#E7DFD4] bg-white text-[#5C5048]",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#1E1810]">Tipo carta</p>
            <div className="flex flex-wrap gap-2">
              {paperOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedPaper(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    selectedPaper === option
                      ? "border-[#A8C4B0] bg-[#F2F8F4] text-[#1E1810]"
                      : "border-[#E7DFD4] bg-white text-[#5C5048]",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#1E1810]">Quantità</p>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[#D7CEC1] bg-[#F8F6F2]">
                <button
                  type="button"
                  className="p-2 text-[#5C5048] hover:text-[#1E1810]"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  aria-label="Riduci quantità"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-10 text-center text-sm font-medium text-[#1E1810]">{quantity}</span>
                <button
                  type="button"
                  className="p-2 text-[#5C5048] hover:text-[#1E1810]"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  aria-label="Aumenta quantità"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-sm text-[#5C5048]">Totale: {formatPrice(totalPrice)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full rounded-full bg-[#D4918F] py-3 text-base text-white hover:bg-[#c47f7d]"
            onClick={handleAddToCart}
          >
            Personalizza e Aggiungi al Carrello
          </Button>
          <Button variant="outline" className="w-full rounded-full py-3 text-base">
            <Heart size={16} className="mr-2" />
            Aggiungi alla Wishlist
          </Button>
        </div>

        <div className="space-y-2 rounded-2xl bg-[#F8F6F2] p-4 text-sm text-[#5C5048]">
          <p>
            Dopo l&apos;ordine ti contattiamo su WhatsApp con il numero ordine per definire la
            personalizzazione e inviare la bozza grafica.
          </p>
          <Link
            href={`https://wa.me/393333333333?text=Ciao%20Effegi%20Lab,%20vorrei%20personalizzare%20${encodeURIComponent(product.name)}`}
            className="font-medium text-[#1E1810] underline"
          >
            Contattaci su WhatsApp
          </Link>
        </div>

        <div className="space-y-1 rounded-2xl border border-[#E7DFD4] p-4 text-sm text-[#5C5048]">
          <p>Spedizione gratuita per ordini superiori a 150€.</p>
          <p>Consegna stimata: 7 giorni lavorativi.</p>
          <p>Coupon attivo: LAB15 (15% di sconto).</p>
        </div>
      </section>
    </div>
  );
}
