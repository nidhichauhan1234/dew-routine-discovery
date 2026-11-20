import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductWithCategory = Product & { category: Pick<Category, "slug" | "name"> | null };

export const BRAND = "Dew Drop";

export const SKIN_TYPES = [
  { value: "oily", label: "Oily", hint: "Shiny by midday, visible pores" },
  { value: "dry", label: "Dry", hint: "Feels tight, flaky patches" },
  { value: "combination", label: "Combination", hint: "Oily T-zone, drier cheeks" },
  { value: "normal", label: "Normal", hint: "Balanced, rarely reactive" },
  { value: "sensitive", label: "Sensitive", hint: "Easily red or irritated" },
] as const;

export const CONCERNS = [
  { value: "acne", label: "Acne" },
  { value: "pigmentation", label: "Pigmentation" },
  { value: "dark_spots", label: "Dark Spots" },
  { value: "dryness", label: "Dryness" },
  { value: "blackheads", label: "Blackheads" },
  { value: "aging", label: "Fine Lines" },
  { value: "redness", label: "Redness" },
  { value: "dullness", label: "Dullness" },
] as const;

export type SkinType = (typeof SKIN_TYPES)[number]["value"];
export type Concern = (typeof CONCERNS)[number]["value"];

export const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;
export type SortKey = (typeof SORTS)[number]["value"];

export function skinTypeLabel(v: string) {
  return SKIN_TYPES.find((s) => s.value === v)?.label ?? v;
}
export function concernLabel(v: string) {
  return CONCERNS.find((c) => c.value === v)?.label ?? v;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function formatINR(amount: number) {
  return inr.format(amount);
}

export function discountPercent(price: number, mrp: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/** Recommended routine steps, in order, for the skin finder. */
export const ROUTINE_ORDER = ["cleansers", "toners", "serums", "moisturizers", "sunscreens", "masks"] as const;

/**
 * Score how well a product suits a skin profile: a skin type match is required,
 * then each matching concern adds a point. Returns -1 when the skin type doesn't fit.
 */
export function matchScore(p: Pick<Product, "skin_types" | "concerns">, skinType: string, concerns: string[]) {
  if (skinType && !p.skin_types.includes(skinType)) return -1;
  return concerns.filter((c) => p.concerns.includes(c)).length;
}

/** Pick the best product per routine step for a skin profile. */
export function buildRoutine<T extends ProductWithCategory>(products: T[], skinType: string, concerns: string[]) {
  const steps: { step: string; product: T; score: number }[] = [];
  for (const step of ROUTINE_ORDER) {
    const ranked = products
      .filter((p) => p.category?.slug === step)
      .map((p) => ({ product: p, score: matchScore(p, skinType, concerns) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score || Number(b.product.rating) - Number(a.product.rating));
    const best = ranked[0];
    if (best) steps.push({ step, ...best });
  }
  return steps;
}
