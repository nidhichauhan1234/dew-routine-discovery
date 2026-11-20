import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CONCERNS, SKIN_TYPES, SORTS, concernLabel, skinTypeLabel } from "@/lib/catalog";
import { categoriesQuery, productsQuery, type ShopFilters } from "@/lib/queries";

function str(v: unknown) {
  return typeof v === "string" && v.length > 0 && v.length <= 80 ? v : undefined;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopFilters => {
    const out: ShopFilters = {};
    for (const k of ["category", "skin", "concern", "q", "sort"] as const) {
      const v = str(s[k]);
      if (v) out[k] = v;
    }
    return out;
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(deps)),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  head: () => ({
    meta: [
      { title: "Shop skincare — Dew Drop" },
      { name: "description", content: "Browse Dew Drop cleansers, toners, serums, moisturisers, sunscreens and masks. Filter by skin type and concern." },
      { property: "og:title", content: "Shop skincare — Dew Drop" },
      { property: "og:description", content: "Filter Dew Drop skincare by skin type, concern and category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQuery(search));
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  const set = (key: keyof ShopFilters, value: string | undefined) =>
    navigate({
      search: (prev) => {
        const next: ShopFilters = { ...prev };
        if (value && prev[key] !== value) next[key] = value;
        else delete next[key];
        return next;
      },
      resetScroll: false,
    });

  const category = categories.find((c) => c.slug === search.category);
  const active = [
    search.category && { key: "category" as const, label: category?.name ?? search.category },
    search.skin && { key: "skin" as const, label: `${skinTypeLabel(search.skin)} skin` },
    search.concern && { key: "concern" as const, label: concernLabel(search.concern) },
    search.q && { key: "q" as const, label: `“${search.q}”` },
  ].filter(Boolean) as { key: keyof ShopFilters; label: string }[];

  const filters = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        {categories.map((c) => (
          <Chip key={c.id} active={search.category === c.slug} onClick={() => set("category", c.slug)}>{c.name}</Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Skin type">
        {SKIN_TYPES.map((s) => (
          <Chip key={s.value} active={search.skin === s.value} onClick={() => set("skin", s.value)}>{s.label}</Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Concern">
        {CONCERNS.map((c) => (
          <Chip key={c.value} active={search.concern === c.value} onClick={() => set("concern", c.value)}>{c.label}</Chip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 rounded-[2rem] bg-hero px-8 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">The collection</p>
        <h1 className="mt-2 text-4xl md:text-5xl">{category?.name ?? "Shop all skincare"}</h1>
        <p className="mt-3 max-w-lg text-foreground/75">{category?.description ?? "Every Dew Drop formula, in one place. Filter by your skin type and concerns."}</p>
      </div>

      <div className="flex gap-10">
        <aside className="hidden w-60 shrink-0 lg:block">{filters}</aside>
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full lg:hidden"><SlidersHorizontal className="mr-1 h-4 w-4" /> Filters</Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetTitle className="mb-6">Filters</SheetTitle>
                {filters}
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground">{products.length} {products.length === 1 ? "product" : "products"}</p>
            {active.map((a) => (
              <button key={a.key} onClick={() => set(a.key, undefined)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {a.label} <X className="h-3 w-3" />
              </button>
            ))}
            {active.length > 0 && (
              <Link to="/shop" className="text-xs text-muted-foreground underline underline-offset-4">Clear all</Link>
            )}
            <div className="ml-auto w-48">
              <Select value={search.sort ?? "popular"} onValueChange={(v) => set("sort", v === "popular" ? undefined : v)}>
                <SelectTrigger className="rounded-full" aria-label="Sort products"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center">
              <h2 className="text-2xl">No matches yet</h2>
              <p className="mt-2 text-muted-foreground">Try removing a filter — or let our skin finder suggest a routine.</p>
              <Button asChild className="mt-6 rounded-full"><Link to="/skin-finder">Take the skin quiz</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
    >
      {children}
    </button>
  );
}
