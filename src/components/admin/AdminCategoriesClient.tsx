"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Pencil, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Category, Product } from "@/types";

type CategoryWithCount = Category & {
  productsCount: number;
  depth: number;
};

type EditableCategory = {
  id?: string;
  name: string;
  slug: string;
  parent_id: string;
  image_url: string;
};

function flattenWithDepth(categories: Category[]): CategoryWithCount[] {
  const byParent = new Map<string | null, Category[]>();

  for (const category of categories) {
    const key = category.parent_id;
    const group = byParent.get(key) ?? [];
    group.push(category);
    byParent.set(key, group);
  }

  const ordered: CategoryWithCount[] = [];

  const walk = (parentId: string | null, depth = 0) => {
    const children = [...(byParent.get(parentId) ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    for (const child of children) {
      ordered.push({
        ...child,
        depth,
        productsCount: 0,
      });
      walk(child.id, depth + 1);
    }
  };

  walk(null, 0);
  return ordered;
}

async function fetchCategoriesData() {
  const supabase = createClient();
  const [categoriesResponse, productsResponse] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("products").select("category_id"),
  ]);

  if (categoriesResponse.error) {
    throw new Error(categoriesResponse.error.message);
  }
  if (productsResponse.error) {
    throw new Error(productsResponse.error.message);
  }

  const categories = (categoriesResponse.data ?? []) as Category[];
  const products = (productsResponse.data ?? []) as Pick<Product, "category_id">[];

  const counter = new Map<string, number>();
  for (const product of products) {
    if (!product.category_id) continue;
    counter.set(product.category_id, (counter.get(product.category_id) ?? 0) + 1);
  }

  const flattened = flattenWithDepth(categories).map((category) => ({
    ...category,
    productsCount: counter.get(category.id) ?? 0,
  }));

  return { categories, flattened };
}

type CategoryRowProps = {
  category: CategoryWithCount;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
};

function SortableCategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid grid-cols-[26px_minmax(220px,1.3fr)_180px_130px_160px] items-center gap-3 rounded-xl border border-black/7 bg-white px-3 py-2"
    >
      <button type="button" className="text-[#9C9088]" {...attributes} {...listeners} aria-label="Riordina categoria">
        <GripVertical size={15} />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#9C9088]" style={{ marginLeft: `${category.depth * 16}px` }}>
          {category.depth > 0 ? "└─" : ""}
        </span>
        <div>
          <p className="font-medium text-[#1E1810]">{category.name}</p>
          <p className="text-xs text-[#9C9088]">{category.slug}</p>
        </div>
      </div>

      <p className="text-sm text-[#5C5048]">{category.parent_id ? "Sottocategoria" : "Categoria principale"}</p>
      <p className="text-sm text-[#5C5048]">{category.productsCount} prodotti</p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-xs text-[#5C5048]"
        >
          <Pencil size={12} />
          Modifica
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="inline-flex items-center gap-1 rounded-full border border-[#EDC6C3] px-2 py-1 text-xs text-[#A24D49]"
        >
          <Trash2 size={12} />
          Elimina
        </button>
      </div>
    </div>
  );
}

export function AdminCategoriesClient() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const sensors = useSensors(useSensor(PointerSensor));

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategoriesData,
  });

  const [orderedCategories, setOrderedCategories] = useState<CategoryWithCount[]>([]);
  const [form, setForm] = useState<EditableCategory>({
    name: "",
    slug: "",
    parent_id: "",
    image_url: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (categoriesQuery.data?.flattened) {
      setOrderedCategories(categoriesQuery.data.flattened);
    }
  }, [categoriesQuery.data?.flattened]);

  async function uploadImage(file: File) {
    const payload = new FormData();
    payload.append("file", file);

    const response = await fetch("/api/admin/cloudinary-upload", {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      throw new Error("Upload immagine non riuscito.");
    }
    const data = (await response.json()) as { secureUrl?: string };
    if (!data.secureUrl) {
      throw new Error("Immagine non disponibile.");
    }
    return data.secureUrl;
  }

  async function handleImageUpload(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadImage(fileList[0]);
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore upload immagine.");
    } finally {
      setIsUploading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", slug: "", parent_id: "", image_url: "" });
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setMessage("Il nome categoria è obbligatorio.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      parent_id: form.parent_id || null,
      image_url: form.image_url || null,
    };

    if (editingId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }
      setMessage("Categoria aggiornata.");
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ ...payload, sort_order: orderedCategories.length });
      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }
      setMessage("Categoria creata.");
    }

    setIsSaving(false);
    resetForm();
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  async function handleDelete(category: CategoryWithCount) {
    if (category.productsCount > 0) {
      setMessage("Impossibile eliminare: categoria associata a prodotti.");
      return;
    }

    const confirmed = window.confirm(`Eliminare la categoria "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Categoria eliminata.");
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedCategories.findIndex((item) => item.id === active.id);
    const newIndex = orderedCategories.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextOrder = arrayMove(orderedCategories, oldIndex, newIndex);
    setOrderedCategories(nextOrder);

    const updates = nextOrder.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("categories")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
      if (error) {
        setMessage("Errore durante salvataggio riordino.");
        break;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Categorie</h1>
        <p className="text-sm text-[#5C5048]">Gestisci gerarchia, parent category e ordinamento.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-5">
        <h2 className="font-serif text-3xl text-[#1E1810]">
          {editingId ? "Modifica categoria" : "Nuova categoria"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <input
            value={form.name}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({
                ...prev,
                name: value,
                slug: prev.slug || slugify(value),
              }));
            }}
            placeholder="Nome categoria"
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
            }
            placeholder="Slug"
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <select
            value={form.parent_id}
            onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="">Nessun parent</option>
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm text-[#5C5048]">
            <ImagePlus size={14} />
            {isUploading ? "Upload..." : "Immagine"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleImageUpload(event.target.files)}
            />
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <Save size={14} className="mr-1" />
              Salva
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetForm}>
                <X size={14} className="mr-1" />
                Annulla
              </Button>
            ) : null}
          </div>
        </div>
        {form.image_url ? (
          <p className="mt-2 text-xs text-[#5C5048]">Immagine selezionata: {form.image_url}</p>
        ) : null}
      </section>

      {message ? (
        <div className="rounded-xl border border-black/7 bg-white px-4 py-2 text-sm text-[#5C5048]">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="mb-3 grid grid-cols-[26px_minmax(220px,1.3fr)_180px_130px_160px] gap-3 px-3 text-[11px] uppercase tracking-[0.08em] text-[#9C9088]">
          <span />
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Prodotti</span>
          <span>Azioni</span>
        </div>

        {categoriesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-[#F3EFE8]" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
            Errore caricamento categorie.
          </div>
        ) : orderedCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF9F6] p-8 text-center">
            <p className="text-sm text-[#5C5048]">Nessuna categoria disponibile.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={orderedCategories.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {orderedCategories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={(item) => {
                      setForm({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        parent_id: item.parent_id ?? "",
                        image_url: item.image_url ?? "",
                      });
                      setEditingId(item.id);
                    }}
                    onDelete={(item) => void handleDelete(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}
