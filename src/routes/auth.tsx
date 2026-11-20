import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

function safeRedirect(v: unknown) {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/auth") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = safeRedirect(s["redirect"]);
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Dew Drop" },
      { name: "description", content: "Sign in or create your Dew Drop account to save your bag, wishlist and orders." },
      { property: "og:title", content: "Sign in — Dew Drop" },
      { property: "og:description", content: "Your Dew Drop account: bag, wishlist and order tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) navigate({ to: redirect ?? "/", replace: true });
  }, [ready, user, redirect, navigate]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
      if (error) throw error;
      toast.success("Welcome back!");
    });
  };

  const onSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    run(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: String(f.get("password")),
        options: { emailRedirectTo: window.location.origin, data: { full_name: String(f.get("name")) } },
      });
      if (error) throw error;
      if (!data.session) setSent(email);
    });
  };

  const onForgot = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(String(f.get("email")), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your inbox for a reset link");
    });
  };

  const social = (provider: "google" | "lovable") =>
    run(async () => {
      if (redirect) sessionStorage.setItem("dd-redirect", redirect);
      const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (res.error) throw res.error;
    });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
      <div className="hidden overflow-hidden rounded-[2rem] md:block">
        <img src="/products/lavender-sleeping-mask.webp" alt="" className="aspect-[4/5] w-full object-cover" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl">Welcome to Dew Drop</h1>
        <p className="mt-2 text-muted-foreground">Save your bag, wishlist and skin profile — and track every order.</p>

        {sent ? (
          <div className="mt-8 rounded-3xl bg-sage p-8">
            <h2 className="text-2xl">Check your email</h2>
            <p className="mt-2 text-foreground/80">We sent a confirmation link to <strong>{sent}</strong>. Click it to activate your account, then sign in.</p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(null)}>Back to sign in</Button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-3">
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => social("google")} disabled={busy}>
                <GoogleIcon /> Continue with Google
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => social("lovable")} disabled={busy}>
                Continue with Lovable
              </Button>
            </div>
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or use email <div className="h-px flex-1 bg-border" />
            </div>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-3 rounded-full">
                <TabsTrigger value="signin" className="rounded-full">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full">Create account</TabsTrigger>
                <TabsTrigger value="forgot" className="rounded-full">Forgot?</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="mt-4 space-y-4">
                  <Field label="Email" name="email" type="email" autoComplete="email" />
                  <Field label="Password" name="password" type="password" autoComplete="current-password" />
                  <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>Sign in</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="mt-4 space-y-4">
                  <Field label="Full name" name="name" autoComplete="name" />
                  <Field label="Email" name="email" type="email" autoComplete="email" />
                  <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters" />
                  <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
              <TabsContent value="forgot">
                <form onSubmit={onForgot} className="mt-4 space-y-4">
                  <Field label="Email" name="email" type="email" autoComplete="email" />
                  <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>Send reset link</Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, hint, ...rest }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required className="h-11 rounded-xl" {...rest} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-1 h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}
