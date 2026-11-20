import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "./brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useCart, useWishlist } from "@/lib/shop";

const NAV = [
  { to: "/shop", label: "Shop all" },
  { to: "/skin-finder", label: "Skin finder" },
  { to: "/about", label: "Our story" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const cartCount = cart?.reduce((n, l) => n + l.quantity, 0) ?? 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: q.trim() ? { q: q.trim() } : {} });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="bg-primary py-1.5 text-center text-xs tracking-wide text-primary-foreground">
        Free shipping on orders above ₹999 · Use <strong>WELCOME10</strong> for 10% off
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="mt-8 flex flex-col gap-4 text-lg">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="font-display">{n.label}</Link>
              ))}
              <Link to="/wishlist" className="font-display">Wishlist</Link>
              <Link to="/account" className="font-display">My account</Link>
            </nav>
          </SheetContent>
        </Sheet>

        <BrandMark />

        <nav className="ml-6 hidden items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden w-64 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search serums, sunscreens…" className="h-10 rounded-full bg-muted pl-9" aria-label="Search products" />
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {!!wishlist?.length && <Badge n={wishlist.length} />}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/cart" aria-label="Shopping bag">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <Badge n={cartCount} />}
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account">My profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/orders">My orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/addresses">Addresses</Link></DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/admin">Admin dashboard</Link></DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut(qc);
                    navigate({ to: "/", replace: true });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="outline" className="ml-1 rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {n}
    </span>
  );
}
