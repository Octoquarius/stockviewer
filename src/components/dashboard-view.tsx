"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ProductResult, Variant } from "@/lib/types";
import { ProductCard } from "./product-card";
import { NotifyDialog, type NotifyTarget } from "./notify-dialog";

export function DashboardView() {
  const { tracked, track } = useStore();
  const [notify, setNotify] = useState<NotifyTarget | null>(null);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  function openNotify(product: ProductResult, variant?: Variant) {
    setNotify({ product, variant });
  }

  async function addByUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    setAddMsg(null);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        setAddMsg("Couldn't get a product from this URL.");
        return;
      }
      const data = await res.json();
      if (data.product) {
        track(data.product as ProductResult);
        setUrl("");
        setAddMsg("Added ✓");
      }
    } catch {
      setAddMsg("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">My Tracked List</h1>
        <p className="text-muted text-sm mt-1">
          Current stock and prices for the products you&apos;re tracking.
        </p>
      </div>

      <form
        onSubmit={addByUrl}
        className="rounded-2xl bg-surface border border-border p-2 flex flex-col sm:flex-row gap-2"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a product URL (alternative way to add)"
          className="flex-1 rounded-xl bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={adding || !url.trim()}
          className="rounded-xl bg-secondary text-white px-5 py-2.5 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add via URL"}
        </button>
      </form>
      {addMsg && <p className="text-sm text-muted -mt-3">{addMsg}</p>}

      {tracked.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-surface/60">
          <div className="text-5xl mb-3">🧺</div>
          <p className="font-semibold">You&apos;re not tracking any products yet</p>
          <p className="text-sm text-muted mt-1 mb-4">
            Search for products you like and add them here with ☆ Track.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
          >
            Search for products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tracked.map((t) => (
            <ProductCard key={t.id} product={t.result} onNotify={openNotify} />
          ))}
        </div>
      )}

      <NotifyDialog target={notify} onClose={() => setNotify(null)} />
    </div>
  );
}
