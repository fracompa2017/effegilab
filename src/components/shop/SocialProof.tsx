"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const statCards = [
  { value: "500+", label: "Spose Soddisfatte" },
  { value: "10+", label: "Anni di Esperienza" },
  { value: "4.9★", label: "Valutazione Media" },
];

const reviews = [
  {
    quote:
      "Partecipazioni bellissime! Giuseppina è stata disponibilissima, ha modificato il design 3 volte senza problemi. Consegna rapidissima!",
    author: "Maria G.",
    detail: "Sposa 2024",
  },
  {
    quote:
      "Qualità artigianale incredibile, si vede che ci mettono il cuore. Il set Amalfi Coast era esattamente come sognavo.",
    author: "Claudia R.",
    detail: "Sposa 2024",
  },
  {
    quote:
      "Servizio impeccabile dal primo contatto al pacco ricevuto. Tutto perfetto, grazie!",
    author: "Valentina M.",
    detail: "Sposa 2024",
  },
];

export function SocialProof() {
  const [activeReview, setActiveReview] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="space-y-5">
      <div className="no-scrollbar overflow-x-auto px-4 md:px-0">
        <div className="mx-auto flex w-max min-w-full snap-x snap-mandatory gap-3 md:grid md:max-w-5xl md:grid-cols-3">
          {statCards.map((stat) => (
            <article
              key={stat.label}
              className="min-w-[210px] snap-start rounded-xl bg-white p-4 text-center shadow-[0_12px_28px_rgba(30,24,16,0.07)]"
            >
              <p className="font-serif text-[48px] leading-none text-[#D4918F]">{stat.value}</p>
              <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#6D6258]">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#E8DED2] bg-white p-4 md:p-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => window.setTimeout(() => setPaused(false), 2000)}
      >
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${activeReview * 100}%)` }}>
          {reviews.map((review) => (
            <article key={review.author} className="w-full shrink-0 space-y-3">
              <p className="text-[16px] text-[#F4B740]">⭐⭐⭐⭐⭐</p>
              <p className="text-[14px] italic leading-relaxed text-[#4E433A]">“{review.quote}”</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8B4B4] text-sm font-semibold text-white">
                  {review.author.charAt(0)}
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-[#1E1810]">{review.author}</p>
                  <p className="text-[12px] text-[#7A6F66]">{review.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {reviews.map((review, index) => (
            <button
              key={review.author}
              type="button"
              onClick={() => setActiveReview(index)}
              className={cn(
                "h-2 w-2 rounded-full transition",
                activeReview === index ? "w-5 bg-[#D4918F]" : "bg-[#D4918F]/30",
              )}
              aria-label={`Mostra recensione ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
