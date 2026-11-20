import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { CONCERNS, SKIN_TYPES, buildRoutine, formatINR } from "@/lib/catalog";
import { productsQuery } from "@/lib/queries";
import { useAddToCart } from "@/lib/shop";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/skin-finder")({
  head: () => ({
    meta: [
      { title: "Skin finder quiz — Dew Drop" },
      { name: "description", content: "Answer two quick questions and get a personalised Dew Drop skincare routine for your skin type and concerns." },
      { property: "og:title", content: "Find your Dew Drop routine" },
      { property: "og:description", content: "A 60-second skin quiz that recommends products for your skin type and concerns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: SkinFinder,
});

const STEP_LABEL: Record<string, string> = {
  cleansers: "Cleanse",
  toners: "Tone",
  serums: "Treat",
  moisturizers: "Moisturise",
  sunscreens: "Protect",
  masks: "Weekly boost",
};

function SkinFinder() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [skin, setSkin] = useState<string>("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const { user } = useAuth();
  const add = useAddToCart();

  const routine = step === 2 ? buildRoutine(products, skin, concerns) : [];
  const total = routine.reduce((n, r) => n + r.product.price, 0);

  const finish = async () => {
    setStep(2);
    if (user) {
      await supabase.from("profiles").update({ skin_type: skin, concerns }).eq("id", user.id);
    }
  };

  const addAll = async () => {
    for (const r of routine) await add.mutateAsync({ product: r.product });
    if (user) toast.success("Your full routine is in your bag");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Skin finder</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Your skin, decoded.</h1>
        <div className="mx-auto mt-6 flex max-w-xs gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="mt-12">
          <h2 className="text-center text-2xl">How does your skin usually feel?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKIN_TYPES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSkin(s.value)}
                aria-pressed={skin === s.value}
                className={`rounded-3xl border-2 p-6 text-left transition ${skin === s.value ? "border-primary bg-secondary" : "border-transparent bg-card shadow-card hover:border-primary/40"}`}
              >
                <h3 className="text-xl">{s.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>
              </button>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" className="rounded-full px-8" disabled={!skin} onClick={() => setStep(1)}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="mt-12">
          <h2 className="text-center text-2xl">What would you like to work on?</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Pick up to three.</p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
            {CONCERNS.map((c) => {
              const on = concerns.includes(c.value);
              return (
                <button
                  key={c.value}
                  aria-pressed={on}
                  onClick={() =>
                    setConcerns((prev) => (on ? prev.filter((x) => x !== c.value) : prev.length < 3 ? [...prev, c.value] : prev))
                  }
                  className={`rounded-full border-2 px-5 py-2.5 transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center gap-3">
            <Button variant="outline" size="lg" className="rounded-full" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button size="lg" className="rounded-full px-8" disabled={concerns.length === 0} onClick={finish}>
              See my routine <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-12">
          <div className="rounded-[2rem] bg-hero p-8 text-center">
            <h2 className="text-3xl">Your personalised routine</h2>
            <p className="mt-2 text-foreground/75">
              {routine.length} steps for {SKIN_TYPES.find((s) => s.value === skin)?.label.toLowerCase()} skin, focused on{" "}
              {concerns.map((c) => CONCERNS.find((x) => x.value === c)?.label.toLowerCase()).join(", ")}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-full" onClick={addAll} disabled={add.isPending || routine.length === 0}>
                <ShoppingBag className="mr-1 h-4 w-4" /> Add full routine · {formatINR(total)}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full bg-background/60" onClick={() => { setStep(0); setSkin(""); setConcerns([]); }}>
                <RotateCcw className="mr-1 h-4 w-4" /> Retake
              </Button>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
            {routine.map((r, i) => (
              <div key={r.step}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Step {i + 1} · {STEP_LABEL[r.step]}
                </p>
                <ProductCard product={r.product} index={i} />
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Want to explore more? <Link to="/shop" search={{ skin }} className="text-primary underline underline-offset-4">See everything for your skin type</Link>
          </p>
        </section>
      )}
    </div>
  );
}
