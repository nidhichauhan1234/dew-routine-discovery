import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  head: () => ({
    meta: [
      { title: "My addresses — Dew Drop" },
      { name: "description", content: "My addresses at Dew Drop." },
      { property: "og:title", content: "My addresses — Dew Drop" },
      { property: "og:description", content: "My addresses at Dew Drop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-4xl">My addresses</h1>
      <p className="mt-3 text-muted-foreground">This page is being set up and will be ready soon.</p>
      <Link to="/shop" className="mt-6 inline-block text-primary underline underline-offset-4">Keep shopping</Link>
    </div>
  ),
});
