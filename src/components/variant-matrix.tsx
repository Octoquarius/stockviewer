"use client";

import type { Variant } from "@/lib/types";

const TYPE_LABEL: Record<Variant["type"], string> = {
  size: "Size",
  number: "Number",
  color: "Color",
};

export function VariantMatrix({
  variants,
  onPick,
}: {
  variants: Variant[];
  /** Called when a variant is clicked (especially an out-of-stock one → open notify). */
  onPick?: (variant: Variant) => void;
}) {
  if (variants.length === 1 && variants[0].label === "Standard") {
    return null; // don't show the matrix for single-variant (tech) products
  }

  const type = variants[0]?.type ?? "size";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted">{TYPE_LABEL[type]}</span>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const tip = v.inStock
            ? v.stockCount != null
              ? `${v.label} · ${v.stockCount} left`
              : `${v.label} · in stock`
            : `${v.label} · out of stock — click to turn on a notification`;
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
