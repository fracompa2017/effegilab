import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  priceMin: number;
  priceMax: number;
  categorySlug: string;
  collection: string;
  image: string;
};

const collections = [
  "Amalfi Coast",
  "Bridgerton",
  "Dreamy Pink Rose",
  "Elegant Green",
  "Flora Edition",
  "Mouline Rouge",
  "Dust Lavender",
  "Sage & Pearl",
  "Springtime",
  "Classic Boho",
];

const topCategory: SeedCategory = {
  name: "Wedding",
  slug: "wedding",
  description: "Coordinati matrimoniali artigianali personalizzati.",
  sortOrder: 1,
};

const weddingChildren: SeedCategory[] = [
  {
    name: "Partecipazioni",
    slug: "partecipazioni",
    description: "Inviti carta, carta Amalfi, plexiglass e box coordinati.",
    sortOrder: 10,
  },
  {
    name: "Cerimonia",
    slug: "cerimonia",
    description: "Wedding bag, libretto messa, portariso, lacrime di gioia e ventagli.",
    sortOrder: 20,
  },
  {
    name: "Ricevimento",
    slug: "ricevimento",
    description: "Tableau, segnatavolo, segnaposto, menu e cake topper.",
    sortOrder: 30,
  },
  {
    name: "Dettagli",
    slug: "dettagli",
    description: "Dettagli decorativi come fuoriporta e grucce personalizzate.",
    sortOrder: 40,
  },
  {
    name: "Sweet Table",
    slug: "sweet-table",
    description: "Segnagusto, portaconfetti e scatole morbide o rigide.",
    sortOrder: 50,
  },
  {
    name: "Coordinati",
    slug: "coordinati",
    description: "Kit cerimonia e kit location coordinati.",
    sortOrder: 60,
  },
  {
    name: "Gift Ideas",
    slug: "gift-ideas",
    description: "Idee regalo personalizzate per testimoni e sposi.",
    sortOrder: 70,
  },
];

const seedProducts: SeedProduct[] = [
  {
    name: "Partecipazione Amalfi Coast",
    slug: "partecipazione-amalfi-coast",
    description: "Partecipazione artigianale con finiture eleganti, personalizzabile su richiesta.",
    price: 6.9,
    priceMin: 6.9,
    priceMax: 6.9,
    categorySlug: "partecipazioni",
    collection: "Amalfi Coast",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Kit Wedding Bag Flora Edition",
    slug: "kit-wedding-bag-flora-edition",
    description: "Kit completo wedding bag coordinato per cerimonia e accoglienza ospiti.",
    price: 11.9,
    priceMin: 11.9,
    priceMax: 11.9,
    categorySlug: "coordinati",
    collection: "Flora Edition",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Ventaglio Plexiglass Amalfi",
    slug: "ventaglio-plexiglass-amalfi",
    description: "Ventaglio in plexiglass personalizzabile, ideale per cerimonie estive.",
    price: 5,
    priceMin: 5,
    priceMax: 5,
    categorySlug: "cerimonia",
    collection: "Amalfi Coast",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Libretto Messa Amalfi Coast",
    slug: "libretto-messa-amalfi-coast",
    description: "Libretto messa coordinato con grafica elegante e personalizzazione completa.",
    price: 2.2,
    priceMin: 2.2,
    priceMax: 2.2,
    categorySlug: "cerimonia",
    collection: "Amalfi Coast",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Segnaposto Bridgerton",
    slug: "segnaposto-bridgerton",
    description: "Segnaposto dal gusto romantico per ricevimento elegante.",
    price: 1.8,
    priceMin: 1.8,
    priceMax: 1.8,
    categorySlug: "ricevimento",
    collection: "Bridgerton",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
];

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const splitIndex = line.indexOf("=");
    if (splitIndex <= 0) {
      continue;
    }

    const key = line.slice(0, splitIndex).trim();
    const value = line.slice(splitIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Variabili Supabase mancanti. Controlla .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("Seed Effegi Lab: avvio inserimento categorie e prodotti...");

  const { data: rootCategory, error: rootError } = await supabase
    .from("categories")
    .upsert(
      {
        name: topCategory.name,
        slug: topCategory.slug,
        description: topCategory.description,
        sort_order: topCategory.sortOrder,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (rootError || !rootCategory?.id) {
    throw new Error(rootError?.message ?? "Impossibile creare categoria principale Wedding.");
  }

  const childPayload = weddingChildren.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    parent_id: rootCategory.id,
    sort_order: category.sortOrder,
  }));

  const { error: childrenError } = await supabase
    .from("categories")
    .upsert(childPayload, { onConflict: "slug" });

  if (childrenError) {
    throw new Error(childrenError.message);
  }

  const { data: categoryRows, error: categoryLookupError } = await supabase
    .from("categories")
    .select("id,slug")
    .in("slug", weddingChildren.map((category) => category.slug));

  if (categoryLookupError) {
    throw new Error(categoryLookupError.message);
  }

  const categoryIdBySlug = new Map(
    (categoryRows ?? []).map((row) => [String(row.slug), String(row.id)]),
  );

  const productPayload = seedProducts.map((product) => ({
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    price_min: product.priceMin,
    price_max: product.priceMax,
    images: [product.image],
    category_id: categoryIdBySlug.get(product.categorySlug) ?? null,
    collection: product.collection,
    is_customizable: true,
    has_variants: false,
    stock: 500,
    is_active: true,
    seo_title: product.name,
    seo_description: product.description,
  }));

  const { error: productsError } = await supabase
    .from("products")
    .upsert(productPayload, { onConflict: "slug" });

  if (productsError) {
    throw new Error(productsError.message);
  }

  console.log(`Categorie principali/figlie aggiornate: ${1 + weddingChildren.length}`);
  console.log(`Prodotti demo aggiornati: ${productPayload.length}`);
  console.log(`Collezioni supportate: ${collections.join(", ")}`);
  console.log("Seed completato con successo.");
}

run().catch((error) => {
  console.error("Errore seed:", error);
  process.exit(1);
});
