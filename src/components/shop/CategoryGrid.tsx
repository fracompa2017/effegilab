import Image from "next/image";
import Link from "next/link";

import { cloudinaryLoader } from "@/lib/cloudinary-loader";

type CategoryGridProps = {
  title?: string;
};

const eventCategories = [
  {
    label: "Wedding",
    emoji: "💍",
    href: "/shop?evento=wedding",
    image: "https://res.cloudinary.com/demo/image/upload/c_fill,h_640,w_520/sample.jpg",
  },
  {
    label: "Promessa",
    emoji: "💑",
    href: "/shop?evento=promessa",
    image: "https://res.cloudinary.com/demo/image/upload/e_sepia/sample.jpg",
  },
  {
    label: "Nascita",
    emoji: "👶",
    href: "/shop?evento=nascita",
    image: "https://res.cloudinary.com/demo/image/upload/e_brightness:30/sample.jpg",
  },
  {
    label: "Comunione",
    emoji: "✝️",
    href: "/shop?evento=comunione",
    image: "https://res.cloudinary.com/demo/image/upload/e_saturation:30/sample.jpg",
  },
  {
    label: "Laurea",
    emoji: "🎓",
    href: "/shop?evento=laurea",
    image: "https://res.cloudinary.com/demo/image/upload/e_contrast:40/sample.jpg",
  },
  {
    label: "Compleanni",
    emoji: "🎂",
    href: "/shop?evento=compleanni",
    image: "https://res.cloudinary.com/demo/image/upload/e_vignette:40/sample.jpg",
  },
];

export function CategoryGrid({ title = "Cosa stai cercando?" }: CategoryGridProps) {
  return (
    <section className="space-y-4">
      <header className="px-4 md:px-0">
        <h2 className="font-serif text-[32px] italic leading-none text-[#1E1810]">{title}</h2>
      </header>

      <div className="no-scrollbar overflow-x-auto px-4 pb-1 md:px-0">
        <div className="flex w-max snap-x snap-mandatory gap-3 md:grid md:w-full md:grid-cols-3 lg:grid-cols-6 md:gap-4">
          {eventCategories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="group relative h-[160px] w-[140px] shrink-0 snap-start overflow-hidden rounded-xl md:h-[200px] md:w-full"
            >
              <Image
                src={category.image}
                alt={category.label}
                fill
                loader={cloudinaryLoader}
                sizes="(max-width: 768px) 140px, 180px"
                className="object-cover transition-transform duration-300 md:group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1810]/70 via-[#1E1810]/20 to-transparent" />
              <p className="absolute bottom-3 left-3 font-serif text-[16px] italic text-white">
                <span aria-hidden>{category.emoji} </span>
                {category.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
