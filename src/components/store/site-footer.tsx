import { Link } from "@tanstack/react-router";
import { BrandMark } from "./brand-mark";
import { BRAND } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandMark />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Gentle, effective skincare made for Indian skin and climate. Dermatologist-tested, cruelty-free and fragrance-conscious.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em]">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" search={{ category: "serums" }} className="hover:text-foreground">Serums</Link></li>
            <li><Link to="/shop" search={{ category: "moisturizers" }} className="hover:text-foreground">Moisturizers</Link></li>
            <li><Link to="/shop" search={{ category: "sunscreens" }} className="hover:text-foreground">Sunscreens</Link></li>
            <li><Link to="/skin-finder" className="hover:text-foreground">Find your routine</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em]">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/account/orders" className="hover:text-foreground">Track your order</Link></li>
            <li><Link to="/about" className="hover:text-foreground">Our story</Link></li>
            <li>Cash on Delivery across India</li>
            <li>Free shipping above ₹999</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND}. Made with care in India.
      </div>
    </footer>
  );
}
