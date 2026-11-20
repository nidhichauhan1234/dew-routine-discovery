import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; ready: boolean };
const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      if (event === "SIGNED_IN") {
        const next = sessionStorage.getItem("dd-redirect");
        if (next) {
          sessionStorage.removeItem("dd-redirect");
          if (next.startsWith("/") && !next.startsWith("//")) router.navigate({ to: next });
        }
      }
    });
    supabase.auth.getSession().then(({ data }) => setState({ user: data.session?.user ?? null, ready: true }));
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Whether the signed-in user holds the admin role. The database enforces this on every admin read/write. */
export function useIsAdmin() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  return { isAdmin: q.data === true, loading: !!user && q.isLoading };
}

export async function signOut(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
