"use client";

/* eslint-disable @next/next/no-img-element */
import { useStore } from "@/lib/store";
import { deriveStatus, minPrice, type ProductResult, type Variant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { SiteBadge } from "./site-badge";
import { StockBadge } from "./stock-badge";
import { VariantMatrix } from "./variant-matrix";

export function ProductCard({
  product,
  onNotify,
}: {
  product: ProductResult;
  onNotify: (product: ProductResult, variant?: Variant) => void;
}) {
  const { track, untrack, tracked, isTracked } = useStore();
  const status = deriveStatus(product.variants);
  const price = minPrice(product.variants);
  const tracking = isTracked(product.site, product.title);

  function toggleTrack() {
    if (tracking) {
      const t = tracked.find(
        (x) => x.result.site === product.site && x.result.title === product.title,
      );
      if (t) untrack(t.id);
    } else {
      track(product);
    }
  }

  return (
    <article className="rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 shrink-0 bg-background">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-40 sm:h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback) return;
              img.dataset.fallback = "1";
              img.src = `https://picsum.photos/seed/${encodeURIComponent(
                product.site + product.title,
              )}/400/400`;
            }}
          />
        </div>

        <div className="flex-1 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <SiteBadge site={product.site} />
                <StockBadge status={status} />
              </div>
              <h3 className="font-semibold leading-tight">{product.title}</h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted">en düşük</div>
              <div className="text-xl font-bold text-primary-strong">
                {formatPrice(price)}
              </div>
            </div>
          </div>

          <VariantMatrix
            variants={product.variants}
            onPick={(v) => onNotify(product, v)}
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onNotify(product)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white px-3.5 py-2 text-sm font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
            >
              🔔 Bildirim Aç
            </button>
            <button
              onClick={toggleTrack}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium border transition-colors ${
                tracking
                  ? "border-secondary bg-secondary-soft text-secondary"
                  : "border-border hover:bg-background"
              }`}
            >
              {tracking ? "★ Takipte" : "☆ Takip Et"}
            </button>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm font-medium text-muted hover:text-foreground"
            >
              Siteye git ↗
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
