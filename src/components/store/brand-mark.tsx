import { Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/catalog";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`} aria-label={`${BRAND} home`}>
      <svg viewBox="0 0 24 32" className="h-7 w-5 text-primary transition-transform group-hover:-translate-y-0.5" aria-hidden>
        <path d="M12 1C12 1 2 13.5 2 20.5a10 10 0 0 0 20 0C22 13.5 12 1 12 1Z" fill="currentColor" opacity="0.9" />
        <path d="M8 21.5a4.5 4.5 0 0 0 4 4" stroke="var(--primary-foreground)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-medium tracking-tight">{BRAND}</span>
    </Link>
  );
}
