import { Star } from "lucide-react";

export function Rating({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${value} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${s} ${i <= Math.round(value) ? "fill-gold text-gold" : "text-border"}`} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {value.toFixed(1)}
        {count !== undefined && ` (${count.toLocaleString("en-IN")})`}
      </span>
    </div>
  );
}
