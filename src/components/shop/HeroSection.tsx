"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type HeroSlide = {
  image: string;
  title: string;
  subtitle: string;
  primaryHref: string;
  secondaryHref: string;
};

type HeroSectionProps = {
  slides?: HeroSlide[];
};

const defaultSlides: HeroSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80",
    title: "Il tuo giorno più bello,\nraccontato con cura",
    subtitle:
      "Partecipazioni e coordinati artigianali completamente personalizzati",
    primaryHref: "/collezioni/amalfi-coast",
    secondaryHref: "/contatti",
  },
  {
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
    title: "Ogni dettaglio parla\ndi voi",
    subtitle:
      "Dalla prima bozza alla stampa finale, tutto disegnato su misura",
    primaryHref: "/shop",
    secondaryHref: "https://effegi-lab2.reservio.com/booking",
  },
  {
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80",
    title: "Eleganza artigianale\nper momenti irripetibili",
    subtitle:
      "Wedding stationery premium firmata Effegi Lab, fatta a Napoli",
    primaryHref: "/shop",
    secondaryHref: "/chi-siamo",
  },
];

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

  const currentSlide = safeSlides[activeIndex % safeSlides.length];

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden md:min-h-[90vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => window.setTimeout(() => setPaused(false), 2000)}
    >
      {safeSlides.map((slide, index) => (
        <div
          key={`${slide.image}-${index}`}
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-[800ms]",
            activeIndex === index ? "opacity-100" : "opacity-0",
          )}
          style={{ backgroundImage: `url(${slide.image})` }}
          aria-hidden={activeIndex !== index}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent md:from-black/30 md:via-black/15 md:to-black/20" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-4 pb-20 pt-24 md:min-h-[90vh] md:px-8 md:pb-16 md:pt-20">
        <div className="w-full text-center md:w-1/2 md:pl-[10%] md:text-left">
          <div className="mx-auto inline-flex max-w-max items-center rounded-full border border-white/30 bg-white/20 px-3 py-1 backdrop-blur-sm md:mx-0">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white">✨ Artigianato Napoletano</span>
          </div>

          <h1 className="mt-4 whitespace-pre-line font-serif text-[40px] italic leading-[1.1] text-white md:text-[64px]">
            {currentSlide.title}
          </h1>

          <p className="mx-auto mt-4 max-w-[34ch] text-[14px] text-white/80 md:mx-0 md:text-[16px]">
            {currentSlide.subtitle}
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 md:flex-row md:items-center">
            <Link
              href={currentSlide.primaryHref}
              className="inline-flex h-[52px] w-full max-w-xs items-center justify-center rounded-full bg-white px-6 text-[15px] font-medium text-[#D4918F]"
            >
              Scopri le Collezioni
            </Link>
            <Link
              href={currentSlide.secondaryHref}
              className="inline-flex h-[52px] w-full max-w-xs items-center justify-center rounded-full border border-white px-6 text-[15px] font-medium text-white"
            >
              Richiedi Bozza Gratis
            </Link>
          </div>
        </div>
      </div>

      {safeSlides.length > 1 ? (
        <div className="absolute bottom-7 left-0 right-0 z-20 flex items-center justify-center gap-2">
          {safeSlides.map((slide, index) => (
            <button
              key={`${slide.title}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-white/50 transition-all",
                activeIndex === index ? "w-6 bg-white" : "",
              )}
              aria-label={`Vai alla slide ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
