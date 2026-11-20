import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { ProductWithCategory } from "./catalog";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Store is not connected to the backend");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const SELECT = "*, category:categories(slug, name)";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

const listInput = z.object({
  category: z.string().optional(),
  skin: z.string().optional(),
  concern: z.string().optional(),
  q: z.string().max(80).optional(),
  sort: z.string().optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data: f }) => {
    const sb = publicClient();
    let query = sb.from("products").select(f.category ? "*, category:categories!inner(slug, name)" : SELECT).eq("is_active", true);
    if (f.category) query = query.eq("category.slug", f.category);
    if (f.skin) query = query.contains("skin_types", [f.skin]);
    if (f.concern) query = query.contains("concerns", [f.concern]);
    if (f.q) query = query.ilike("name", `%${f.q.replace(/[%_,()]/g, " ")}%`);
    switch (f.sort) {
      case "price-asc": query = query.order("price", { ascending: true }); break;
      case "price-desc": query = query.order("price", { ascending: false }); break;
      case "new": query = query.order("is_new", { ascending: false }).order("created_at", { ascending: false }); break;
      case "rating": query = query.order("rating", { ascending: false }); break;
      default: query = query.order("review_count", { ascending: false });
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as unknown as ProductWithCategory[];
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb.from("products").select(SELECT).eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return { product: null, related: [] as ProductWithCategory[] };
    const p = product as unknown as ProductWithCategory;
    const { data: related } = await sb
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .neq("id", p.id)
      .overlaps("concerns", p.concerns)
      .order("review_count", { ascending: false })
      .limit(4);
    return { product: p, related: (related ?? []) as unknown as ProductWithCategory[] };
  });
