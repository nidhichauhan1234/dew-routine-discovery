import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — Dew Drop" },
      { name: "description", content: "Dew Drop makes gentle, effective skincare designed for Indian skin, humidity and sun." },
      { property: "og:title", content: "Our story — Dew Drop" },
      { property: "og:description", content: "Why we make gentle, effective skincare for Indian skin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Our story</p>
      <h1 className="mt-3 max-w-3xl text-5xl leading-tight md:text-6xl">Skincare that respects your skin — and your climate.</h1>
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <img src="/products/hero.webp" alt="Dew Drop products arranged on pastel stone" className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
        <div className="space-y-5 text-lg leading-relaxed text-foreground/80">
          <p>Dew Drop began with a simple frustration: most skincare isn't made for humid summers, harsh sun and the beautiful range of Indian skin tones.</p>
          <p>So we built a focused line of cleansers, serums, moisturisers and sunscreens with proven actives at honest concentrations — tested on Indian skin, free from harsh fragrance, and never tested on animals.</p>
          <p>Every formula is priced fairly in rupees, because good skin shouldn't be a luxury.</p>
          <Button asChild size="lg" className="rounded-full"><Link to="/skin-finder">Find your routine</Link></Button>
        </div>
      </div>
      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {[
          { t: "Proven actives", d: "Niacinamide, vitamin C, ceramides and retinol at effective, gentle levels.", c: "bg-blush" },
          { t: "Made for India", d: "Light textures for humidity, high SPF with zero white cast.", c: "bg-sage" },
          { t: "Kind by default", d: "Cruelty-free, vegan, and dermatologist tested.", c: "bg-lavender" },
        ].map((x) => (
          <div key={x.t} className={`rounded-3xl ${x.c} p-8`}>
            <h2 className="text-2xl">{x.t}</h2>
            <p className="mt-2 text-foreground/75">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
