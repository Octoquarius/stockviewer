// Çekirdek veri tipleri — mock ve gerçek scraping akışları aynı tipleri kullanır.

export type Category = "clothing" | "shoes" | "bag" | "tech";

export type VariantType = "size" | "number" | "color";

export interface Variant {
  type: VariantType;
  label: string; // "M", "42", "Siyah"
  inStock: boolean;
  stockCount?: number; // bilinmiyorsa undefined
  price: number;
}

export interface ProductResult {
  /** Adapter'ın site anahtarı: "trendyol", "hepsiburada"... */
  site: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  category: Category;
  brand?: string;
  currency: string; // "TRY"
  variants: Variant[];
}

export type StockStatus = "in" | "low" | "out";

export type TriggerType = "back_in_stock" | "price_drop";
export type NotifyChannel = "push" | "email" | "both";

export interface NotificationRule {
  id: string;
  productTitle: string;
  site: string;
  variantLabel?: string; // belirli beden/numara; yoksa tüm ürün
  triggerType: TriggerType;
  targetPrice?: number;
  channel: NotifyChannel;
  isActive: boolean;
  createdAt: string;
}

export interface TrackedProduct {
  id: string;
  result: ProductResult;
  addedAt: string;
}

/** Bir ürünün genel stok durumunu varyantlarından türetir. */
export function deriveStatus(variants: Variant[]): StockStatus {
  const inStockCount = variants.filter((v) => v.inStock).length;
  if (inStockCount === 0) return "out";
  const known = variants.filter((v) => v.stockCount != null);
  const lowCount = known.filter((v) => (v.stockCount ?? 0) > 0 && (v.stockCount ?? 0) <= 3).length;
  if (inStockCount <= Math.ceil(variants.length / 3) || (known.length > 0 && lowCount === inStockCount)) {
    return "low";
  }
  return "in";
}

/** Bir ürünün en düşük fiyatını döndürür (varyantlar arasında). */
export function minPrice(variants: Variant[]): number {
  return Math.min(...variants.map((v) => v.price));
}
