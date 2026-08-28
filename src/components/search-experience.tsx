"use client";

import { useState } from "react";
import type { ProductResult, Variant } from "@/lib/types";
import { ProductCard } from "./product-card";
import { NotifyDialog, type NotifyTarget } from "./notify-dialog";

const EXAMPLES = [
  "Nike Air Max 90",
  "Oversize sweatshirt",
  "Leather shoulder bag",
  "Mom jeans",
  "White sneakers",
];

export function SearchExperience() {
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [results, setResults] = useState<ProductResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState("");
  const [notify, setNotify] = useState<NotifyTarget | null>(null);

  async function runSearch(q: string, c: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(q);
    try {
      const params = new URLSearchParams({ q });
      if (c.trim()) params.set("code", c.trim());
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query, code);
  }

  function openNotify(product: ProductResult, variant?: Variant) {
    setNotify({ product, variant });
  }

  return (
    <div className="space-y-8">
      {/* Hero + search */}
      <section className="text-center pt-6 sm:pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Which site has{" "}
          <span className="text-primary">the product you want in stock?</span>
        </h1>
        <p className="mt-3 text-muted max-w-xl mx-auto">
          Clothing, shoes, and bags… Search once, and see the price and{" "}
          <b>stock by size/number</b> across every site that sells it, on one
          screen. If it&apos;s out of stock, turn on a notification and we&apos;ll let you know.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-w-2xl mx-auto bg-surface border border-border rounded-3xl shadow-sm p-2 flex flex-col sm:flex-row gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Product name — e.g. Nike Air Max 90"
            className="flex-1 rounded-2xl bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Product code (optional)"
            className="sm:w-44 rounded-2xl bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-primary text-white px-6 py-3 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {!results && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-sm">
            <span className="text-muted">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex, "");
                }}
                className="rounded-full border border-border bg-surface px-3 py-1 hover:border-primary hover:text-primary transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      {loading && <ResultsSkeleton />}

      {!loading && results && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              <span className="text-primary">{results.length} results</span>{" "}
              for &ldquo;{searched}&rdquo;
            </h2>
            {results.length > 0 && (
              <span className="text-sm text-muted">sorted by cheapest first</span>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyResults query={searched} />
          ) : (
            <div className="grid gap-4">
              {results.map((p) => (
                <ProductCard
                  key={`${p.site}-${p.title}`}
                  product={p}
                  onNotify={openNotify}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <NotifyDialog target={notify} onClose={() => setNotify(null)} />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-3xl bg-surface border border-border h-40 animate-pulse flex"
        >
          <div className="w-40 bg-background rounded-l-3xl" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-4 w-32 bg-background rounded-full" />
            <div className="h-4 w-48 bg-background rounded-full" />
            <div className="h-8 w-full bg-background rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-surface/60">
      <div className="text-5xl mb-3">🔎</div>
      <p className="font-semibold">&ldquo;{query}&rdquo; wasn&apos;t found on any site</p>
      <p className="text-sm text-muted mt-1">
        Try a different search term or product code.
      </p>
    </div>
  );
}
