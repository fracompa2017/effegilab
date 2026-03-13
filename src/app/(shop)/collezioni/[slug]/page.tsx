import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/shop/ProductCard";
import { getCollectionsServer, getProductsServer } from "@/lib/queries";

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const collectionGradients = [
  "from-[#F8F6F2] via-[#F4EAE8] to-[#E8B4B4]/60",
  "from-[#F8F6F2] via-[#EAF2ED] to-[#A8C4B0]/55",
  "from-[#F8F6F2] via-[#EFEAF8] to-[#B8B0D4]/55",
  "from-[#F8F6F2] via-[#F8EFE1] to-[#EFCBA6]/55",
];

function capitalizeWords(value: string) {
  return value
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getCollectionGradient(name: string) {
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return collectionGradients[hash % collectionGradients.length] ?? collectionGradients[0];
}

async function getCollectionData(slug: string) {
  const collections = await getCollectionsServer();
  const currentCollection = collections.find((collection) => collection.slug === slug);

  if (!currentCollection) {
    return null;
  }

  const productsResult = await getProductsServer({
    collezione: slug,
    sort: "recenti",
    page: 1,
    pageSize: 60,
  });

  return {
    currentCollection,
    collections,
    products: productsResult.products,
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionData(slug);
  const collectionName = data?.currentCollection.name ?? capitalizeWords(slug);

  return {
    title: `Collezione ${collectionName} - Effegi Lab`,
    description: `Scopri tutti i prodotti della collezione ${collectionName} di Effegi Lab: wedding stationery artigianale personalizzabile.`,
  };
}

export async function generateStaticParams() {
  const collections = await getCollectionsServer();

  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const data = await getCollectionData(slug);

  if (!data) {
    notFound();
  }

  const { currentCollection, products, collections } = data;
  const otherCollections = collections.filter((collection) => collection.slug !== currentCollection.slug);

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-[#E7DED4] bg-gradient-to-br px-5 py-8 sm:px-8 sm:py-12 ${getCollectionGradient(
          currentCollection.name,
        )}`}
      >
        <nav className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#7E726A]">
          <Link href="/" className="hover:text-[#1E1810]">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#1E1810]">
            Collezioni
          </Link>
          <span>/</span>
          <span className="text-[#1E1810]">{currentCollection.name}</span>
        </nav>

        <p className="text-xs uppercase tracking-[0.2em] text-[#7EA890]">Collezione Effegi Lab</p>
        <h1 className="mt-2 font-serif text-[48px] italic leading-none text-[#1E1810] md:text-[72px]">
          {currentCollection.name}
        </h1>
        <p className="mt-2 text-sm text-[#5C5048]">{products.length} prodotti disponibili</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-4xl text-[#1E1810]">Prodotti della collezione</h2>

        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-8 text-center text-[#5C5048]">
            Nessun prodotto disponibile per questa collezione al momento.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-3xl text-[#1E1810]">Altre Collezioni</h3>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {otherCollections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collezioni/${collection.slug}`}
              className="min-w-[220px] rounded-2xl border border-[#E7DED4] bg-white p-4 hover:border-[#D4918F]"
            >
              <p className="font-serif text-2xl italic text-[#1E1810]">{collection.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#8B7E74]">{collection.count} prodotti</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
