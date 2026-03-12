"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";

type CollectionItem = {
  name: string;
  image: string;
  count: number;
};

type CollectionsCarouselProps = {
  title?: string;
  subtitle?: string;
};

const fallbackCollections = [
  "Amalfi Coast",
  "Bridgerton",
  "Dreamy Pink Rose",
  "Elegant Green",
  "Flora Edition",
  "Mouline Rouge",
  "Dust Lavender",
  "Sage & Pearl",
];

async function fetchCollections(): Promise<CollectionItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("collection,images")
    .eq("is_active", true)
    .not("collection", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, CollectionItem>();
  for (const row of data ?? []) {
    const name = String(row.collection ?? "").trim();
    if (!name) {
      continue;
    }

    const image = row.images?.[0] ?? "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    const existing = grouped.get(name);
    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(name, { name, count: 1, image });
  }

  return Array.from(grouped.values());
}

export function CollectionsCarousel({
  title = "Le Nostre Collezioni",
  subtitle = "Ogni collezione racconta una storia",
}: CollectionsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const collectionsQuery = useQuery({
    queryKey: ["collections-carousel"],
    queryFn: fetchCollections,
    staleTime: 60_000,
  });

  const collections = useMemo(() => {
    if (collectionsQuery.data?.length) {
      return collectionsQuery.data;
    }

    return fallbackCollections.map((name, index) => ({
      name,
      count: Math.max(5, 12 - index),
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    }));
  }, [collectionsQuery.data]);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) {
      return;
    }

    const updateProgress = () => {
      const max = Math.max(element.scrollWidth - element.clientWidth, 1);
      setProgress(Math.min(100, (element.scrollLeft / max) * 100));
    };

    updateProgress();
    element.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      element.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [collections.length]);

  function scrollByCards(direction: "prev" | "next") {
    const element = scrollerRef.current;
    if (!element) {
      return;
    }
    element.scrollBy({
      left: direction === "next" ? element.clientWidth * 0.72 : -element.clientWidth * 0.72,
      behavior: "smooth",
    });
  }

  return (
    <section className="space-y-3">
      <header className="space-y-1 px-4 md:px-0">
        <h2 className="font-serif text-[28px] italic leading-none text-[#1E1810] md:text-[42px]">{title}</h2>
        <p className="text-[13px] text-[#6E635A]">{subtitle}</p>
      </header>

      <div className="relative">
        <div ref={scrollerRef} className="no-scrollbar overflow-x-auto px-4 pb-2 md:px-0">
          <div className="flex w-max snap-x snap-mandatory gap-3 md:gap-4">
            {collectionsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "shrink-0 snap-start overflow-hidden rounded-[14px] bg-[#EDE7DE]",
                      index === 0 ? "h-[360px] w-[300px]" : "h-[320px] w-[260px]",
                    )}
                  />
                ))
              : collections.map((collection, index) => (
                  <Link
                    key={collection.name}
                    href={`/collezioni/${slugify(collection.name)}`}
                    className={cn(
                      "group relative shrink-0 snap-start overflow-hidden rounded-[14px]",
                      index === 0 ? "h-[360px] w-[300px]" : "h-[320px] w-[260px]",
                    )}
                  >
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      loader={cloudinaryLoader}
                      sizes={index === 0 ? "300px" : "260px"}
                      className="object-cover transition-transform duration-500 md:group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1810]/70 via-[#1E1810]/20 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 space-y-2">
                      <span className="inline-flex rounded-full bg-white/20 px-2 py-1 text-[11px] text-white backdrop-blur">
                        {collection.count} prodotti
                      </span>
                      <p className="font-serif text-[22px] italic text-white">{collection.name}</p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        <div className="px-4 pt-1 md:px-0">
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-[#E3DBCF]">
            <div
              className="h-full rounded-full bg-[#D4918F] transition-all duration-300"
              style={{ width: `${Math.max(18, progress)}%` }}
            />
          </div>
        </div>

        <div className="absolute -right-1 top-1/2 hidden -translate-y-1/2 gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCards("prev")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white text-[#5C5048] shadow-sm"
            aria-label="Collezioni precedenti"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards("next")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white text-[#5C5048] shadow-sm"
            aria-label="Collezioni successive"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
