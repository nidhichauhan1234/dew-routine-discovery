import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Dew Drop" },
      { name: "description", content: "Choose a new password for your Dew Drop account." },
      { property: "og:title", content: "Reset password — Dew Drop" },
      { property: "og:description", content: "Choose a new password for your Dew Drop account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/", replace: true });
  };
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-4xl">Set a new password</h1>
      <p className="mt-2 text-muted-foreground">Open this page from the link in your reset email.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
