import { queryOptions } from "@tanstack/react-query";
import { getProduct, listCategories, listProducts } from "./catalog.functions";

export type ShopFilters = { category?: string; skin?: string; concern?: string; q?: string; sort?: string };

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories(), staleTime: 5 * 60_000 });

export const productsQuery = (filters: ShopFilters = {}) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => listProducts({ data: filters }),
    staleTime: 60_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }), staleTime: 60_000 });
