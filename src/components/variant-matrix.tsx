"use client";

import type { Variant } from "@/lib/types";

const TYPE_LABEL: Record<Variant["type"], string> = {
  size: "Beden",
  number: "Numara",
  color: "Renk",
};

export function VariantMatrix({
  variants,
  onPick,
}: {
  variants: Variant[];
  /** Bir varyanta tıklanınca (özellikle tükenmişe → bildirim aç). */
  onPick?: (variant: Variant) => void;
}) {
  if (variants.length === 1 && variants[0].label === "Standart") {
    return null; // tek varyantlı (teknoloji) ürünlerde matris gösterme
  }

  const type = variants[0]?.type ?? "size";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted">{TYPE_LABEL[type]}</span>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const tip = v.inStock
            ? v.stockCount != null
              ? `${v.label} · ${v.stockCount} adet`
              : `${v.label} · stokta`
            : `${v.label} · tükendi — tıkla, bildirim aç`;
          return (
            <button
              key={v.label}
              type="button"
              title={tip}
              onClick={() => onPick?.(v)}
              className={`relative min-w-9 h-9 px-2 rounded-lg text-sm font-semibold border transition-all ${
                v.inStock
                  ? "border-[var(--in-stock)]/40 bg-green-50 text-[var(--in-stock)] hover:bg-green-100"
                  : "border-[var(--out-stock)]/30 bg-red-50 text-[var(--out-stock)]/70 line-through hover:bg-red-100"
              } ${onPick ? "cursor-pointer" : "cursor-default"}`}
            >
              {v.label}
              {v.inStock && v.stockCount != null && v.stockCount <= 3 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--low-stock)] ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
