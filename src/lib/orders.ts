import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_STEPS: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export const STATUS_TINT: Record<OrderStatus, string> = {
  placed: "bg-peach",
  confirmed: "bg-lavender",
  shipped: "bg-blush",
  delivered: "bg-sage",
  cancelled: "bg-muted",
};

export type Quote = { subtotal: number; discount: number; shipping: number; total: number; coupon_code: string | null; coupon_message: string | null };

export const quoteQuery = (userId: string | undefined, coupon: string | null, cartKey: string) =>
  queryOptions({
    queryKey: ["quote", userId, coupon, cartKey],
    enabled: !!userId,
    queryFn: async (): Promise<Quote> => {
      const { data, error } = await supabase.rpc("quote_cart", coupon ? { _coupon: coupon } : {});
      if (error) throw error;
      const row = data?.[0];
      if (!row) throw new Error("Could not price your bag");
      return row as Quote;
    },
  });

export const addressesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["addresses", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const myOrdersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
  });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as (Order & { items: OrderItem[] }) | null;
    },
  });
