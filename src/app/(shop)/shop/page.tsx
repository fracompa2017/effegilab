import { ShopClient } from "@/app/(shop)/shop/ShopClient";
import {
  getCategoriesServer,
  getCollectionsServer,
  getProductsServer,
  parseShopFilters,
  type ShopSearchParams,
} from "@/lib/queries";

type ShopPageProps = {
  searchParams: {
    categoria?: string;
    collezione?: string;
    min?: string;
    max?: string;
    sort?: string;
    q?: string;
    page?: string;
  };
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const filters = parseShopFilters(searchParams as ShopSearchParams);

  const [productsResult, categories, collections] = await Promise.all([
    getProductsServer(filters),
    getCategoriesServer(),
    getCollectionsServer(),
  ]);

  return (
    <ShopClient
      initialFilters={filters}
      initialResult={productsResult}
      categories={categories}
      collections={collections}
    />
  );
}
