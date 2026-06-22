"use client";

import { useState } from "react";
import type { ProductResult, Variant } from "@/lib/types";
import { ProductCard } from "./product-card";
import { NotifyDialog, type NotifyTarget } from "./notify-dialog";

const EXAMPLES = [
  "Nike Air Max 90",
  "Oversize sweatshirt",
  "Deri omuz çantası",
  "Mom jean",
  "Beyaz sneaker",
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
      {/* Hero + arama */}
      <section className="text-center pt-6 sm:pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Aradığın ürün{" "}
          <span className="text-primary">hangi sitede stokta?</span>
        </h1>
        <p className="mt-3 text-muted max-w-xl mx-auto">
          Kıyafet, ayakkabı ve çanta… Bir kez ara, ürünün satıldığı tüm sitelerde
          fiyatı ve <b>beden/numara bazında stoğu</b> tek ekranda gör. Tükendiyse
          bildirim aç, gelince haber verelim.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-w-2xl mx-auto bg-surface border border-border rounded-3xl shadow-sm p-2 flex flex-col sm:flex-row gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı — ör. Nike Air Max 90"
            className="flex-1 rounded-2xl bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ürün kodu (ops.)"
            className="sm:w-44 rounded-2xl bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-primary text-white px-6 py-3 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
          >
            {loading ? "Aranıyor…" : "Ara"}
          </button>
        </form>

        {!results && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-sm">
            <span className="text-muted">Deneyin:</span>
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

      {/* Sonuçlar */}
      {loading && <ResultsSkeleton />}

      {!loading && results && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              “{searched}” için{" "}
              <span className="text-primary">{results.length} sonuç</span>
            </h2>
            {results.length > 0 && (
              <span className="text-sm text-muted">en ucuzdan sıralı</span>
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
      <p className="font-semibold">“{query}” hiçbir sitede bulunamadı</p>
      <p className="text-sm text-muted mt-1">
        Farklı bir ifade veya ürün kodu deneyin.
      </p>
    </div>
  );
}
