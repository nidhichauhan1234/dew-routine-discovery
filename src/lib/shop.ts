import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Product } from "./catalog";

export type CartLine = { id: string; quantity: number; product: Product };

export const cartQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(*)")
        .order("created_at");
      if (error) throw error;
      return (data as unknown as CartLine[]).filter((l) => l.product);
    },
  });

export const wishlistQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product_id, product:products(*, category:categories(slug, name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; product_id: string; product: Product & { category: { slug: string; name: string } | null } }[];
    },
  });

export function useCart() {
  const { user } = useAuth();
  return useQuery(cartQuery(user?.id));
}

export function useWishlist() {
  const { user } = useAuth();
  return useQuery(wishlistQuery(user?.id));
}

function useRequireSignIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return () => {
    if (user) return user;
    toast("Sign in to continue", { description: "Create a free account to save your cart and wishlist." });
    navigate({ to: "/auth", search: { redirect: window.location.pathname } });
    return null;
  };
}

export function useAddToCart() {
  const qc = useQueryClient();
  const requireUser = useRequireSignIn();
  return useMutation({
    mutationFn: async ({ product, quantity = 1 }: { product: Pick<Product, "id" | "name" | "stock">; quantity?: number }) => {
      const user = requireUser();
      if (!user) return null;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", product.id)
        .maybeSingle();
      const next = Math.min((existing?.quantity ?? 0) + quantity, Math.min(20, product.stock));
      if (next <= 0) throw new Error("This product is out of stock");
      const { error } = existing
        ? await supabase.from("cart_items").update({ quantity: next }).eq("id", existing.id)
        : await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: next });
      if (error) throw error;
      return product.name;
    },
    onSuccess: (name) => {
      if (!name) return;
      toast.success("Added to your bag", { description: name });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCartLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } =
        quantity <= 0
          ? await supabase.from("cart_items").delete().eq("id", id)
          : await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["quote"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const requireUser = useRequireSignIn();
  return useMutation({
    mutationFn: async ({ productId, saved }: { productId: string; saved: boolean }) => {
      const user = requireUser();
      if (!user) return null;
      const { error } = saved
        ? await supabase.from("wishlist_items").delete().eq("product_id", productId)
        : await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return !saved;
    },
    onSuccess: (added) => {
      if (added === null) return;
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
