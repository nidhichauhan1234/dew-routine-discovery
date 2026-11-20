import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/store/product-card";
import { Rating } from "@/components/store/rating";
import { concernLabel, discountPercent, formatINR, skinTypeLabel } from "@/lib/catalog";
import { productQuery } from "@/lib/queries";
import { useAddToCart, useToggleWishlist, useWishlist } from "@/lib/shop";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!data.product) throw notFound();
    return { name: data.product.name, tagline: data.product.tagline, price: data.product.price };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — Dew Drop` : "Product unavailable — Dew Drop";
    const desc = loaderData ? `${loaderData.tagline ?? ""}. ${formatINR(loaderData.price)} at Dew Drop.` : "This product is not available.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl">We couldn't find that product</h1>
      <p className="mt-3 text-muted-foreground">It may have sold out or been retired.</p>
      <Button asChild className="mt-6 rounded-full"><Link to="/shop">Browse the collection</Link></Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const product = data.product!;
  const [qty, setQty] = useState(1);
  const add = useAddToCart();
  const toggle = useToggleWishlist();
  const { data: wishlist } = useWishlist();
  const saved = !!wishlist?.some((w) => w.product_id === product.id);
  const off = discountPercent(product.price, product.mrp);
  const soldOut = product.stock <= 0;
  const maxQty = Math.min(product.stock, 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
        <Link to="/shop" className="hover:text-foreground">Shop</Link> /{" "}
        {product.category && (
          <>
            <Link to="/shop" search={{ category: product.category.slug }} className="hover:text-foreground">{product.category.name}</Link> /{" "}
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-[2rem] bg-blush">
          {product.image_url && <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />}
        </div>

        <div className="lg:py-6">
          <div className="flex gap-2">
            {product.is_bestseller && <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Bestseller</span>}
            {product.is_new && <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">New</span>}
          </div>
          <h1 className="mt-4 text-4xl leading-tight md:text-5xl">{product.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{product.tagline}</p>
          <div className="mt-4"><Rating value={Number(product.rating)} count={product.review_count} size="md" /></div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">MRP {formatINR(product.mrp!)}</span>
                <span className="rounded-full bg-sage px-2.5 py-0.5 text-sm font-medium text-success">{off}% off</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · {product.size}</p>

          <p className="mt-6 leading-relaxed text-foreground/80">{product.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Best for</p>
              <div className="flex flex-wrap gap-1.5">
                {product.skin_types.map((s) => (
                  <Link key={s} to="/shop" search={{ skin: s }} className="rounded-full bg-lavender px-3 py-1 text-xs">{skinTypeLabel(s)}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Targets</p>
              <div className="flex flex-wrap gap-1.5">
                {product.concerns.map((c) => (
                  <Link key={c} to="/shop" search={{ concern: c }} className="rounded-full bg-peach px-3 py-1 text-xs">{concernLabel(c)}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={soldOut}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity" disabled={soldOut || qty >= maxQty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1 rounded-full" disabled={soldOut || add.isPending} onClick={() => add.mutate({ product, quantity: qty })}>
              <ShoppingBag className="mr-1 h-4 w-4" /> {soldOut ? "Sold out" : "Add to bag"}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => toggle.mutate({ productId: product.id, saved })} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
              <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {soldOut ? "Currently out of stock" : product.stock < 15 ? `Hurry — only ${product.stock} left` : "In stock"}
          </p>

          <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-muted p-4 text-sm">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free delivery on orders above ₹999</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cash on Delivery available</span>
          </div>

          <Accordion type="single" collapsible defaultValue="ingredients" className="mt-6">
            <AccordionItem value="ingredients">
              <AccordionTrigger>Key ingredients</AccordionTrigger>
              <AccordionContent>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {product.key_ingredients.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="how">
              <AccordionTrigger>How to use</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{product.how_to_use}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl">Pairs beautifully with</h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {data.related.map((p, i) => <ProductCard key={p.id} product={p} index={i + 1} />)}
          </div>
        </section>
      )}
    </div>
  );
}
