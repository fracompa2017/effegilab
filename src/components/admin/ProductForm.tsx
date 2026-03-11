"use client";

import Link from "next/link";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import type { Category, Product } from "@/types";

const collectionOptions = [
  "Amalfi Coast",
  "Bridgerton",
  "Dreamy Pink Rose",
  "Elegant Green",
  "Flora Edition",
  "Mouline Rouge",
  "Dust Lavender",
  "Sage & Pearl",
  "Classic Ivory",
  "Modern Script",
];

type ProductFormProps = {
  mode: "create" | "edit";
  product?: Product;
};

type ImageTileProps = {
  src: string;
  index: number;
  onRemove: (index: number) => void;
};

function SortableImageTile({ src, index, onRemove }: ImageTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `${index}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative overflow-hidden rounded-xl border border-black/10 bg-[#F8F6F2]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Immagine ${index + 1}`} className="h-24 w-24 object-cover" />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-[#A24D49]"
        aria-label="Rimuovi immagine"
      >
        <Trash2 size={12} />
      </button>
      <button
        type="button"
        className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
        {...attributes}
        {...listeners}
      >
        Drag
      </button>
    </div>
  );
}

async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const sensors = useSensors(useSensor(PointerSensor));

  const categoriesQuery = useQuery({
    queryKey: ["admin-product-form-categories"],
    queryFn: fetchCategories,
  });

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [priceMin, setPriceMin] = useState(product?.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(product?.price_max?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [collection, setCollection] = useState(product?.collection ?? "");
  const [isCustomizable, setIsCustomizable] = useState(product?.is_customizable ?? true);
  const [hasVariants, setHasVariants] = useState(product?.has_variants ?? false);
  const [stock, setStock] = useState(product?.stock?.toString() ?? "999");
  const [isActive, setIsActive] = useState(product?.is_active ?? false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "");

  const [slugTouched, setSlugTouched] = useState(false);
  const [seoTitleTouched, setSeoTitleTouched] = useState(false);
  const [seoDescriptionTouched, setSeoDescriptionTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateName(nextName: string) {
    setName(nextName);

    if (!slugTouched) {
      setSlug(slugify(nextName));
    }
    if (!seoTitleTouched) {
      setSeoTitle(nextName);
    }
    if (!seoDescriptionTouched) {
      setSeoDescription((prev) => prev || nextName);
    }
  }

  async function uploadFile(file: File) {
    const payload = new FormData();
    payload.append("file", file);

    const response = await fetch("/api/admin/cloudinary-upload", {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      throw new Error("Upload Cloudinary non riuscito.");
    }

    const data = (await response.json()) as { secureUrl?: string };
    if (!data.secureUrl) {
      throw new Error("URL immagine non disponibile.");
    }

    return data.secureUrl;
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }
    const files = Array.from(fileList).slice(0, Math.max(0, 10 - images.length));
    if (!files.length) {
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const uploaded = await Promise.all(files.map((file) => uploadFile(file)));
      setImages((prev) => [...prev, ...uploaded].slice(0, 10));
      setMessage("Immagini caricate correttamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore durante upload immagini.");
    } finally {
      setIsUploading(false);
    }
  }

  function onImageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    setImages((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  async function saveProduct(nextActive: boolean) {
    if (!name.trim()) {
      setMessage("Il nome prodotto è obbligatorio.");
      return;
    }
    if (!slug.trim()) {
      setMessage("Lo slug prodotto è obbligatorio.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description || null,
      price: price ? Number(price) : null,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : null,
      images,
      category_id: categoryId || null,
      collection: collection || null,
      is_customizable: isCustomizable,
      has_variants: hasVariants,
      stock: Number(stock || 0),
      is_active: nextActive,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
    };

    if (mode === "create") {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      setMessage(nextActive ? "Prodotto pubblicato." : "Bozza salvata.");
      setIsSaving(false);
      router.push(`/admin/prodotti/${data.id}`);
      router.refresh();
      return;
    }

    const { error } = await supabase.from("products").update(payload).eq("id", product?.id);

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setIsActive(nextActive);
    setMessage(nextActive ? "Prodotto aggiornato e pubblicato." : "Bozza aggiornata.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-5xl text-[#1E1810]">
            {mode === "create" ? "Nuovo prodotto" : "Modifica prodotto"}
          </h1>
          <p className="text-sm text-[#5C5048]">
            Compila i dati principali, carica immagini e configura SEO.
          </p>
        </div>
        <Link
          href={slug ? `/prodotto/${slug}` : "#"}
          target="_blank"
          className={cn(
            "inline-flex rounded-full border border-black/10 px-4 py-2 text-sm",
            slug ? "text-[#5C5048]" : "pointer-events-none text-[#9C9088]",
          )}
        >
          Anteprima
        </Link>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-5">
          <Input id="product-name" label="Nome prodotto" value={name} onChange={(event) => updateName(event.target.value)} />
          <Input
            id="product-slug"
            label="Slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
          <div className="space-y-1.5">
            <label htmlFor="product-description" className="text-sm font-medium text-[#1E1810]">
              Descrizione
            </label>
            <textarea
              id="product-description"
              rows={6}
              value={description}
              onChange={(event) => {
                const nextValue = event.target.value;
                setDescription(nextValue);
                if (!seoDescriptionTouched) {
                  setSeoDescription(nextValue.slice(0, 155));
                }
              }}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#D4918F]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input id="price" label="Prezzo base" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
            <Input id="price-min" label="Prezzo minimo" type="number" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} />
            <Input id="price-max" label="Prezzo massimo" type="number" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm text-[#1E1810]">
              Categoria
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 w-full rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
              >
                <option value="">Seleziona categoria</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm text-[#1E1810]">
              Collezione
              <select
                value={collection}
                onChange={(event) => setCollection(event.target.value)}
                className="h-10 w-full rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
              >
                <option value="">Seleziona collezione</option>
                {collectionOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-2 text-sm text-[#5C5048]">
              È personalizzabile?
              <input type="checkbox" checked={isCustomizable} onChange={(event) => setIsCustomizable(event.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-2 text-sm text-[#5C5048]">
              Ha varianti?
              <input type="checkbox" checked={hasVariants} onChange={(event) => setHasVariants(event.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-2 text-sm text-[#5C5048]">
              Attivo
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            </label>
            <Input id="stock" label="Stock" type="number" value={stock} onChange={(event) => setStock(event.target.value)} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1E1810]">Immagini prodotto (max 10)</p>
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-[#FBF9F6] px-4 py-6 text-center text-sm text-[#5C5048]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFiles(event.dataTransfer.files);
              }}
            >
              <ImagePlus size={18} />
              Trascina file o clicca per caricare su Cloudinary
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void handleFiles(event.target.files)}
              />
            </label>
            {isUploading ? <p className="text-xs text-[#5C5048]">Upload in corso...</p> : null}
          </div>

          {images.length ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onImageDragEnd}>
              <SortableContext items={images.map((_, index) => `${index}`)} strategy={horizontalListSortingStrategy}>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((src, index) => (
                    <SortableImageTile
                      key={`${src}-${index}`}
                      src={src}
                      index={index}
                      onRemove={(removeIndex) =>
                        setImages((prev) => prev.filter((_, idx) => idx !== removeIndex))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-xs text-[#9C9088]">Nessuna immagine caricata.</p>
          )}

          <Input
            id="seo-title"
            label="SEO title"
            value={seoTitle}
            onChange={(event) => {
              setSeoTitleTouched(true);
              setSeoTitle(event.target.value);
            }}
          />
          <div className="space-y-1.5">
            <label htmlFor="seo-description" className="text-sm font-medium text-[#1E1810]">
              SEO description
            </label>
            <textarea
              id="seo-description"
              rows={4}
              value={seoDescription}
              onChange={(event) => {
                setSeoDescriptionTouched(true);
                setSeoDescription(event.target.value);
              }}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#D4918F]"
            />
          </div>
        </section>
      </div>

      {message ? (
        <p className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#5C5048]">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void saveProduct(false)} disabled={isSaving}>
          Salva bozza
        </Button>
        <Button onClick={() => void saveProduct(true)} disabled={isSaving} className="bg-[#D4918F] text-white">
          Pubblica
        </Button>
      </div>
    </div>
  );
}
