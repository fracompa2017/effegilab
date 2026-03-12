"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { cn } from "@/lib/utils";

type HeroSlide = {
  title: string;
  subtitle: string;
  image: string;
  ctaPrimaryHref: string;
  ctaSecondaryHref: string;
};

type HeroSectionProps = {
  slides?: HeroSlide[];
};

const defaultSlides: HeroSlide[] = [
  {
    title: "Il tuo matrimonio, unico come voi",
    subtitle: "Partecipazioni e coordinati artigianali personalizzati",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    ctaPrimaryHref: "/collezioni/amalfi-coast",
    ctaSecondaryHref: "/contatti",
  },
  {
    title: "Ogni dettaglio racconta la vostra storia",
    subtitle: "Dalla bozza grafica alla stampa, tutto su misura",
    image: "https://res.cloudinary.com/demo/image/upload/c_fill,g_face,h_900,w_900/sample.jpg",
    ctaPrimaryHref: "/shop?evento=wedding",
    ctaSecondaryHref: "https://effegi-lab2.reservio.com/booking",
  },
  {
    title: "Eleganza artigianale made in Napoli",
    subtitle: "Collezioni pastello premium per il vostro giorno speciale",
    image: "https://res.cloudinary.com/demo/image/upload/e_grayscale/sample.jpg",
    ctaPrimaryHref: "/shop",
    ctaSecondaryHref: "/chi-siamo",
  },
];

const trustItems = ["⭐ 500+ spose felici", "🚚 Spedizione gratuita", "✏️ Bozza gratis"];

export function HeroSection({ slides = defaultSlides }: HeroSectionProps) {
  const safeSlides = useMemo(() => (slides.length ? slides : defaultSlides), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (safeSlides.length <= 1 || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [paused, safeSlides.length]);

  const currentIndex = activeIndex % safeSlides.length;
  const activeSlide = safeSlides[currentIndex];

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-gradient-to-b from-[#F8F6F2] to-[#F0E8E6] px-4 pb-7 pt-4 md:min-h-[90vh] md:px-6 md:pt-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => {
        window.setTimeout(() => setPaused(false), 2400);
      }}
    >
      <div className="pointer-events-none absolute right-[-60px] top-[16%] hidden h-52 w-52 rounded-full border border-[#E8B4B4]/60 md:block" />
      <div className="pointer-events-none absolute bottom-[12%] right-[32%] hidden h-36 w-36 rounded-full border border-[#A8C4B0]/50 md:block" />

      <div className="mx-auto grid h-full w-full max-w-7xl items-center gap-6 md:grid-cols-2 md:gap-10">
        <div className="space-y-4 pt-2 md:space-y-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4918F]">Artigianato Napoletano</p>
          <h1 className="max-w-[22ch] font-serif text-[36px] italic leading-[1.1] text-[#1E1810] md:text-[56px]">
            {activeSlide.title}
          </h1>
          <p className="max-w-[44ch] text-[14px] text-[#5C5048] md:text-[17px]">{activeSlide.subtitle}</p>
        </div>

        <div className="space-y-4 pb-1 md:space-y-5">
          <div className="relative mx-auto h-[85vw] w-[85vw] max-h-[450px] max-w-[450px] overflow-hidden rounded-[12px] shadow-[0_30px_55px_rgba(36,27,18,0.18)]">
            {safeSlides.map((slide, index) => (
              <Image
                key={`${slide.image}-${index}`}
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                loader={cloudinaryLoader}
                sizes="(max-width: 768px) 85vw, 45vw"
                className={cn(
                  "absolute inset-0 object-cover transition-opacity duration-500",
                  currentIndex === index ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>

          <div className="space-y-3">
            <Link
              href={activeSlide.ctaPrimaryHref}
              className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#D4918F] px-6 text-[15px] font-medium text-white"
            >
              Scopri le Collezioni
            </Link>
            <Link
              href={activeSlide.ctaSecondaryHref}
              className="flex min-h-[52px] w-full items-center justify-center rounded-full border border-[#D4918F] bg-transparent px-6 text-[15px] font-medium text-[#D4918F]"
            >
              Richiedi Bozza Gratis
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {trustItems.map((item) => (
              <p key={item} className="text-[11px] text-[#6F645A]">
                {item}
              </p>
            ))}
          </div>

          {safeSlides.length > 1 ? (
            <div className="flex justify-center gap-2 py-1">
              {safeSlides.map((slide, index) => (
                <button
                  key={`${slide.title}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    currentIndex === index ? "w-5 bg-[#1E1810]" : "bg-[#1E1810]/25",
                  )}
                  aria-label={`Vai alla slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
