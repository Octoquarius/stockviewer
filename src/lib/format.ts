import type { StockStatus } from "@/lib/types";

const priceFmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return priceFmt.format(value);
}

export const STATUS_META: Record<
  StockStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  in: {
    label: "Stokta",
    dot: "bg-[var(--in-stock)]",
    text: "text-[var(--in-stock)]",
    bg: "bg-green-50",
  },
  low: {
    label: "Az kaldı",
    dot: "bg-[var(--low-stock)]",
    text: "text-[var(--low-stock)]",
    bg: "bg-amber-50",
  },
  out: {
    label: "Tükendi",
    dot: "bg-[var(--out-stock)]",
    text: "text-[var(--out-stock)]",
    bg: "bg-red-50",
  },
};
