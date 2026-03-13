"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/shop/ProductCard";
import {
  type CollectionEntry,
  type ProductsQueryResult,
  type ShopFilters,
  getProductsClient,
  parseShopFilters,
} from "@/lib/queries";
import type { Category, Product } from "@/types";

type ShopClientProps = {
  initialFilters: ShopFilters;
  initialResult: ProductsQueryResult;
  categories: Category[];
  collections: CollectionEntry[];
};

function filtersKey(filters: ShopFilters) {
  return JSON.stringify({
    categoria: filters.categoria ?? "",
    collezione: filters.collezione ?? "",
    min: filters.min ?? "",
    max: filters.max ?? "",
    sort: filters.sort ?? "recenti",
    q: filters.q ?? "",
    page: filters.page ?? 1,
  });
}

function productsKey(filters: ShopFilters) {
  return [
    "shop-products",
    filters.categoria ?? "",
    filters.collezione ?? "",
    filters.min ?? "",
    filters.max ?? "",
    filters.sort ?? "recenti",
    filters.q ?? "",
    filters.page ?? 1,
  ] as const;
}

export function ShopClient({
  initialFilters,
  initialResult,
  categories,
  collections,
}: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const currentFilters = useMemo(
    () =>
      parseShopFilters({
        categoria: searchParams.get("categoria") ?? undefined,
        collezione: searchParams.get("collezione") ?? undefined,
        min: searchParams.get("min") ?? undefined,
        max: searchParams.get("max") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        q: searchParams.get("q") ?? undefined,
        page: searchParams.get("page") ?? undefined,
      }),
    [searchParams],
  );

  const initialKey = useMemo(() => filtersKey(initialFilters), [initialFilters]);
  const currentKey = useMemo(() => filtersKey(currentFilters), [currentFilters]);

  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");
  const [mobileProducts, setMobileProducts] = useState<Product[]>(initialResult.products);
  const [mobilePage, setMobilePage] = useState(initialFilters.page ?? 1);
  const [mobileHasMore, setMobileHasMore] = useState(initialResult.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: productsKey(currentFilters),
    queryFn: () => getProductsClient(currentFilters),
    initialData: currentKey === initialKey ? initialResult : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
  });

  const result = productsQuery.data ?? initialResult;
  const currentPage = currentFilters.page ?? 1;

  useEffect(() => {
    setSearchValue(currentFilters.q ?? "");
  }, [currentFilters.q]);

  useEffect(() => {
    const queryProducts = productsQuery.data?.products ?? [];
    setMobileProducts(queryProducts);
    setMobilePage(currentPage);
    setMobileHasMore(productsQuery.data?.hasMore ?? false);
    setLoadMoreError(null);
  }, [currentKey, currentPage, productsQuery.data]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
          continue;
        }

        params.set(key, value);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const normalizedSearch = searchValue.trim();
    const currentSearch = currentFilters.q ?? "";

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateUrl({
        q: normalizedSearch || null,
        page: "1",
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchValue, currentFilters.q, updateUrl]);

  const paginationNumbers = useMemo(() => {
    const maxPages = result.totalPages;
    if (maxPages <= 7) {
      return Array.from({ length: maxPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, maxPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages).filter((value) => value >= 1 && value <= maxPages).sort((a, b) => a - b);
  }, [currentPage, result.totalPages]);

  async function handleLoadMore() {
    if (isLoadingMore || !mobileHasMore) {
      return;
    }

    const nextPage = mobilePage + 1;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextResult = await queryClient.fetchQuery({
        queryKey: productsKey({ ...currentFilters, page: nextPage }),
        queryFn: () => getProductsClient({ ...currentFilters, page: nextPage }),
        staleTime: 20_000,
      });

      setMobileProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        const nextItems = nextResult.products.filter((product) => !seen.has(product.id));
        return [...current, ...nextItems];
      });
      setMobilePage(nextPage);
      setMobileHasMore(nextResult.hasMore);
    } catch {
      setLoadMoreError("Errore durante il caricamento. Riprova.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-serif text-5xl text-[#1E1810]">Shop</h1>
        <p className="text-sm text-[#5C5048]">Scopri partecipazioni e coordinati artigianali personalizzabili.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-4 sm:p-5">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9C9088]" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Cerca un prodotto"
            className="h-12 w-full rounded-full border border-[#E8DED2] bg-[#FCFAF8] pl-11 pr-4 text-[16px] text-[#1E1810] outline-none focus:border-[#D4918F]"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8A7F74]">Categoria</span>
            <select
              value={currentFilters.categoria ?? ""}
              onChange={(event) =>
                updateUrl({
                  categoria: event.target.value || null,
                  page: "1",
                })
              }
              className="h-11 w-full rounded-full border border-[#E8DED2] bg-white px-4 text-[16px] outline-none focus:border-[#D4918F]"
            >
              <option value="">Tutte</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8A7F74]">Collezione</span>
            <select
              value={currentFilters.collezione ?? ""}
              onChange={(event) =>
                updateUrl({
                  collezione: event.target.value || null,
                  page: "1",
                })
              }
              className="h-11 w-full rounded-full border border-[#E8DED2] bg-white px-4 text-[16px] outline-none focus:border-[#D4918F]"
            >
              <option value="">Tutte</option>
              {collections.map((collection) => (
                <option key={collection.slug} value={collection.slug}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8A7F74]">Prezzo min</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={currentFilters.min ?? ""}
              onBlur={(event) =>
                updateUrl({
                  min: event.currentTarget.value || null,
                  page: "1",
                })
              }
              className="h-11 w-full rounded-full border border-[#E8DED2] bg-white px-4 text-[16px] outline-none focus:border-[#D4918F]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8A7F74]">Prezzo max</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={currentFilters.max ?? ""}
              onBlur={(event) =>
                updateUrl({
                  max: event.currentTarget.value || null,
                  page: "1",
                })
              }
              className="h-11 w-full rounded-full border border-[#E8DED2] bg-white px-4 text-[16px] outline-none focus:border-[#D4918F]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8A7F74]">Ordina</span>
            <select
              value={currentFilters.sort ?? "recenti"}
              onChange={(event) =>
                updateUrl({
                  sort: event.target.value,
                  page: "1",
                })
              }
              className="h-11 w-full rounded-full border border-[#E8DED2] bg-white px-4 text-[16px] outline-none focus:border-[#D4918F]"
            >
              <option value="recenti">Più recenti</option>
              <option value="prezzo-asc">Prezzo crescente</option>
              <option value="prezzo-desc">Prezzo decrescente</option>
              <option value="nome-asc">Nome A-Z</option>
              <option value="nome-desc">Nome Z-A</option>
            </select>
          </label>
        </div>
      </section>

      {productsQuery.isError ? (
        <div className="rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
          Non riesco a caricare il catalogo in questo momento.
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5C5048]">
            {result.total} prodotti trovati
          </p>
          {productsQuery.isFetching ? <p className="text-xs text-[#9C9088]">Aggiornamento...</p> : null}
        </div>

        {productsQuery.isLoading ? (
          <div className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-[4/5] animate-pulse rounded-xl bg-[#EDE7DD]" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#EDE7DD]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#EDE7DD]" />
                </div>
              ))}
            </div>
          </div>
        ) : result.products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-8 text-center">
            <p className="text-[#5C5048]">Nessun prodotto trovato con i filtri selezionati.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-7xl px-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(mobileProducts.length > result.products.length ? mobileProducts : result.products).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            <div className="space-y-2 md:hidden">
              {mobileHasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D9CEC1] bg-white px-4 text-sm font-medium text-[#1E1810] disabled:opacity-60"
                >
                  {isLoadingMore ? "Caricamento..." : "Carica altri"}
                </button>
              ) : null}
              {loadMoreError ? <p className="text-center text-xs text-[#A24D49]">{loadMoreError}</p> : null}
            </div>

            <div className="hidden items-center justify-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => updateUrl({ page: String(Math.max(1, currentPage - 1)) })}
                disabled={currentPage <= 1}
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white text-[#5C5048] disabled:opacity-40"
                aria-label="Pagina precedente"
              >
                <ChevronLeft size={16} />
              </button>

              {paginationNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => updateUrl({ page: String(pageNumber) })}
                  className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border text-sm ${
                    pageNumber === currentPage
                      ? "border-[#D4918F] bg-[#F8EDEC] text-[#1E1810]"
                      : "border-[#E8DED2] bg-white text-[#5C5048]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => updateUrl({ page: String(Math.min(result.totalPages, currentPage + 1)) })}
                disabled={currentPage >= result.totalPages}
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#E8DED2] bg-white text-[#5C5048] disabled:opacity-40"
                aria-label="Pagina successiva"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
