import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating } from "./rating";
import { discountPercent, formatINR, type Product } from "@/lib/catalog";
import { useAddToCart, useToggleWishlist, useWishlist } from "@/lib/shop";

const TINTS = ["bg-blush", "bg-peach", "bg-lavender", "bg-sage", "bg-cream"];

export function ProductCard({ product, index = 0 }: { product: Product & { category?: { name: string } | null }; index?: number }) {
  const add = useAddToCart();
  const toggle = useToggleWishlist();
  const { data: wishlist } = useWishlist();
  const saved = !!wishlist?.some((w) => w.product_id === product.id);
  const off = discountPercent(product.price, product.mrp);
  const soldOut = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-card transition-shadow hover:shadow-soft">
      <Link to="/products/$slug" params={{ slug: product.slug }} className={`relative block aspect-square overflow-hidden ${TINTS[index % TINTS.length]}`}>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_bestseller && <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">Bestseller</span>}
          {product.is_new && <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">New</span>}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle.mutate({ productId: product.id, saved })}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-primary transition hover:scale-110"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {product.category && <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{product.category.name}</p>}
        <Link to="/products/$slug" params={{ slug: product.slug }} className="font-display text-lg leading-snug hover:text-primary">
          {product.name}
        </Link>
        <Rating value={Number(product.rating)} count={product.review_count} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <span className="text-lg font-semibold">{formatINR(product.price)}</span>
            {off > 0 && (
              <>
                <span className="ml-2 text-sm text-muted-foreground line-through">{formatINR(product.mrp!)}</span>
                <span className="ml-1.5 text-xs font-medium text-success">{off}% off</span>
              </>
            )}
          </div>
          <Button
            size="icon"
            className="rounded-full"
            disabled={soldOut || add.isPending}
            onClick={() => add.mutate({ product })}
            aria-label={soldOut ? "Sold out" : `Add ${product.name} to bag`}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
        {soldOut && <p className="text-xs text-destructive">Sold out</p>}
      </div>
    </article>
  );
}
