"use client";

import Link from "next/link";
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
import { Eye, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Category, Order, Product } from "@/types";

type ProductWithSales = Product & {
  sales: number;
  categoryName: string;
};

type ProductRowProps = {
  product: ProductWithSales;
  onToggleActive: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
};

function SortableProductRow({ product, onToggleActive, onDelete }: ProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: product.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid grid-cols-[26px_64px_minmax(220px,1.6fr)_1fr_120px_120px_220px] items-center gap-3 rounded-xl border border-black/7 bg-white px-3 py-2"
    >
      <button
        type="button"
        className="text-[#9C9088] hover:text-[#5C5048]"
        {...attributes}
        {...listeners}
        aria-label="Riordina prodotto"
      >
        <GripVertical size={15} />
      </button>

      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-black/7 bg-[#F3ECE3] text-[10px] text-[#5C5048]">
        IMG
      </div>

      <div>
        <p className="font-medium text-[#1E1810]">{product.name}</p>
        <p className="text-xs text-[#9C9088]">{product.slug}</p>
      </div>

      <div className="text-sm text-[#5C5048]">
        <p>{product.collection ?? "Senza collezione"}</p>
        <p className="text-xs text-[#9C9088]">{product.categoryName || "Senza categoria"}</p>
      </div>

      <div className="text-sm text-[#5C5048]">{formatPrice(product.price ?? 0)}</div>

      <div>
        <button
          type="button"
          onClick={() => onToggleActive(product.id, !product.is_active)}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            product.is_active
              ? "bg-[#E9F8EE] text-[#2F7B45]"
              : "bg-[#F3EFE8] text-[#7A6E66]"
          }`}
        >
          {product.is_active ? "Attivo" : "Disattivo"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[#5C5048]">{product.sales}</span>
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/prodotti/${product.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-xs text-[#5C5048]"
          >
            <Pencil size={12} />
            Modifica
          </Link>
          <Link
            href={`/prodotto/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-xs text-[#5C5048]"
          >
            <Eye size={12} />
            Anteprima
          </Link>
          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="inline-flex items-center gap-1 rounded-full border border-[#EDC6C3] px-2 py-1 text-xs text-[#A24D49]"
          >
            <Trash2 size={12} />
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeStatus(status: string): "pending" | "processing" | "shipped" | "delivered" | "cancelled" {
  if (
    status === "pending" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "pending";
}

async function fetchProductsData() {
  const supabase = createClient();

  const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("orders").select("items,status"),
  ]);

  if (productsResponse.error) {
    throw new Error(productsResponse.error.message);
  }
  if (categoriesResponse.error) {
    throw new Error(categoriesResponse.error.message);
  }
  if (ordersResponse.error) {
    throw new Error(ordersResponse.error.message);
  }

  const categories = (categoriesResponse.data ?? []) as Category[];
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  const salesMap = new Map<string, number>();
  for (const order of (ordersResponse.data ?? []) as Pick<Order, "items" | "status">[]) {
    if (normalizeStatus(order.status) === "cancelled") {
      continue;
    }
    const orderItems = (order.items ?? []) as Array<{ product_id: string; quantity: number }>;
    for (const item of orderItems) {
      salesMap.set(item.product_id, (salesMap.get(item.product_id) ?? 0) + Number(item.quantity ?? 0));
    }
  }

  const products = ((productsResponse.data ?? []) as Product[]).map((product) => ({
    ...product,
    sales: salesMap.get(product.id) ?? 0,
    categoryName: product.category_id ? categoryMap.get(product.category_id) ?? "" : "",
  }));

  return { products, categories };
}

export function AdminProductsListClient() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const sensors = useSensors(useSensor(PointerSensor));

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: fetchProductsData,
    refetchInterval: 30_000,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (payload: { id: string; nextValue: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: payload.nextValue })
        .eq("id", payload.id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products-list"] });
      const previous = queryClient.getQueryData<{ products: ProductWithSales[]; categories: Category[] }>([
        "admin-products-list",
      ]);

      if (previous) {
        queryClient.setQueryData(["admin-products-list"], {
          ...previous,
          products: previous.products.map((item) =>
            item.id === payload.id ? { ...item, is_active: payload.nextValue } : item,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-products-list"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products-list"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products-list"] });
    },
  });

  const collections = useMemo(() => {
    const products = productsQuery.data?.products ?? [];
    const values = Array.from(new Set(products.map((product) => product.collection).filter(Boolean)));
    return values as string[];
  }, [productsQuery.data?.products]);

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data?.products ?? [];

    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.slug.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesCollection =
        collectionFilter === "all" || product.collection === collectionFilter;
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? product.is_active : !product.is_active);

      return matchesSearch && matchesCategory && matchesCollection && matchesActive;
    });

    if (!orderedIds.length) {
      return filtered;
    }

    const position = new Map(orderedIds.map((id, index) => [id, index]));
    return [...filtered].sort((a, b) => {
      const posA = position.get(a.id);
      const posB = position.get(b.id);

      if (posA === undefined && posB === undefined) return 0;
      if (posA === undefined) return 1;
      if (posB === undefined) return -1;
      return posA - posB;
    });
  }, [
    productsQuery.data?.products,
    search,
    categoryFilter,
    collectionFilter,
    activeFilter,
    orderedIds,
  ]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setOrderedIds((prev) => {
      const baseIds = prev.length ? prev : filteredProducts.map((product) => product.id);
      const oldIndex = baseIds.indexOf(String(active.id));
      const newIndex = baseIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return baseIds;
      }
      return arrayMove(baseIds, oldIndex, newIndex);
    });
  }

  function handleDelete(productId: string) {
    const confirmed = window.confirm("Vuoi davvero eliminare questo prodotto?");
    if (!confirmed) {
      return;
    }
    deleteProductMutation.mutate(productId);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Prodotti</h1>
        <p className="text-sm text-[#5C5048]">Gestisci catalogo, stato e riordino card prodotto.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_170px_auto]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9088]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca prodotto..."
              className="h-10 w-full rounded-full border border-black/10 pl-9 pr-4 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="all">Tutte le categorie</option>
            {(productsQuery.data?.categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={collectionFilter}
            onChange={(event) => setCollectionFilter(event.target.value)}
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="all">Tutte le collezioni</option>
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as "all" | "active" | "inactive")}
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="all">Tutti</option>
            <option value="active">Solo attivi</option>
            <option value="inactive">Solo inattivi</option>
          </select>

          <Link
            href="/admin/prodotti/nuovo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white"
          >
            <Plus size={14} />
            Nuovo Prodotto
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="mb-3 grid grid-cols-[26px_64px_minmax(220px,1.6fr)_1fr_120px_120px_220px] gap-3 px-3 text-[11px] uppercase tracking-[0.08em] text-[#9C9088]">
          <span />
          <span>Immagine</span>
          <span>Nome</span>
          <span>Collezione / Categoria</span>
          <span>Prezzo</span>
          <span>Stato</span>
          <span>Vendite / Azioni</span>
        </div>

        {productsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-[#F3EFE8]" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
            Errore durante il caricamento prodotti.
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF9F6] p-8 text-center">
            <p className="text-sm text-[#5C5048]">Nessun prodotto trovato con i filtri selezionati.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filteredProducts.map((product) => product.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <SortableProductRow
                    key={product.id}
                    product={product}
                    onToggleActive={(id, nextValue) =>
                      toggleActiveMutation.mutate({ id, nextValue })
                    }
                    onDelete={handleDelete}
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

