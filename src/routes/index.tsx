import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Droplets, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { CONCERNS, SKIN_TYPES } from "@/lib/catalog";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dew Drop — Premium skincare for every skin type" },
      { name: "description", content: "Shop Dew Drop cleansers, serums, moisturisers and sunscreens made for Indian skin. Free shipping above ₹999." },
      { property: "og:title", content: "Dew Drop — Premium skincare for every skin type" },
      { property: "og:description", content: "Gentle, effective skincare for Indian skin. Find your routine in 60 seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: Home,
});

const CATEGORY_TINTS: Record<string, string> = {
  cleansers: "bg-sage",
  toners: "bg-blush",
  serums: "bg-peach",
  moisturizers: "bg-lavender",
  sunscreens: "bg-cream",
  masks: "bg-accent",
};
const CATEGORY_IMG: Record<string, string> = {
  cleansers: "rice-water-foaming-cleanser",
  toners: "rose-hydrating-toner",
  serums: "vitamin-c-brightening-serum",
  moisturizers: "ceramide-barrier-cream",
  sunscreens: "invisible-gel-sunscreen",
  masks: "lavender-sleeping-mask",
};

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new).slice(0, 4);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src="/products/hero.webp" alt="Dew Drop serums, cream and toner on pastel stone" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-peach/95 via-peach/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-20 sm:px-6">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-background/70 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Made for Indian skin
            </p>
            <h1 className="text-5xl font-normal leading-[1.05] md:text-7xl">
              Skin that <em className="text-primary">glows</em>, like morning dew.
            </h1>
            <p className="mt-6 max-w-md text-lg text-foreground/75">
              Clean, clinically-backed formulas for oily, dry, sensitive and everything in between — from ₹499.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/shop">Shop the collection <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-foreground/20 bg-background/60 px-7">
                <Link to="/skin-finder">Find my routine</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-sm sm:px-6 md:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Dermatologist tested" },
            { icon: Leaf, t: "Cruelty-free & vegan" },
            { icon: Droplets, t: "Climate-smart formulas" },
            { icon: Sparkles, t: "Cash on Delivery" },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-3 text-muted-foreground">
              <Icon className="h-5 w-5 text-primary" /> {t}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHead eyebrow="Shop by step" title="Build your ritual" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className={`group overflow-hidden rounded-3xl ${CATEGORY_TINTS[c.slug] ?? "bg-muted"} transition-shadow hover:shadow-soft`}
            >
              <img src={`/products/${CATEGORY_IMG[c.slug]}.webp`} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="p-4">
                <h3 className="text-lg">{c.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductRow eyebrow="Loved by thousands" title="Bestsellers" products={bestsellers} />

      {/* Skin finder CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-hero p-10 md:grid-cols-2 md:p-16">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">60-second skin quiz</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Not sure where to start?</h2>
            <p className="mt-4 max-w-md text-foreground/75">
              Tell us your skin type and concerns, and we'll build a personalised Dew Drop routine — cleanser to SPF.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full px-7">
              <Link to="/skin-finder">Take the quiz <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Shop by skin type</p>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map((s) => (
                  <Link key={s.value} to="/shop" search={{ skin: s.value }} className="rounded-full bg-background/80 px-4 py-2 text-sm transition hover:bg-background">
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Shop by concern</p>
              <div className="flex flex-wrap gap-2">
                {CONCERNS.map((c) => (
                  <Link key={c.value} to="/shop" search={{ concern: c.value }} className="rounded-full border border-foreground/15 px-4 py-2 text-sm transition hover:bg-background/70">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductRow eyebrow="Just landed" title="New arrivals" products={newArrivals} />
      <ProductRow eyebrow="Editor's edit" title="Featured favourites" products={featured} />
    </div>
  );
}

function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: boolean }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-3xl md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link to="/shop" className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function ProductRow({ eyebrow, title, products }: { eyebrow: string; title: string; products: Parameters<typeof ProductCard>[0]["product"][] }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
      <SectionHead eyebrow={eyebrow} title={title} link />
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
