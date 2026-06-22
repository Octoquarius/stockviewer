import type { ProductResult } from "@/lib/types";
import { SITES } from "@/lib/sites";
import { createMockAdapter, guessCategory } from "./mock";
import type { SiteAdapter } from "./types";

/**
 * Adapter kaydı. Şu an tüm siteler mock adapter kullanır.
 * Gerçek adapter eklendikçe (Kademe 1→3) burada gerçek implementasyonla
 * değiştirilir; arayüz aynı kaldığı için UI değişmez.
 */
const ADAPTERS: SiteAdapter[] = SITES.map((s) => createMockAdapter(s.key));

/**
 * Ad + kod ile tüm sitelerde paralel arama yapar.
 * Sonuçlar fiyata göre (en ucuz önce) sıralanır.
 */
export async function searchAllSites(
  query: string,
  code?: string,
): Promise<ProductResult[]> {
  if (!query.trim()) return [];

  const settled = await Promise.allSettled(
    ADAPTERS.map((a) => a.search(query, code)),
  );

  const results: ProductResult[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(...s.value);
  }

  results.sort((a, b) => {
    const pa = Math.min(...a.variants.map((v) => v.price));
    const pb = Math.min(...b.variants.map((v) => v.price));
    return pa - pb;
  });

  return results;
}

/** URL'e göre doğru adapter'ı bulup tek ürün scrape eder (ikincil akış). */
export async function scrapeUrl(url: string): Promise<ProductResult | null> {
  const adapter = ADAPTERS.find((a) => a.match(url));
  if (!adapter) return null;
  return adapter.scrape(url);
}

/** Tek bir sitede arama (cron'da güncel stok/fiyat kontrolü için). */
export async function searchSite(
  siteKey: string,
  query: string,
  code?: string,
): Promise<ProductResult | null> {
  const adapter = ADAPTERS.find((a) => a.site === siteKey);
  if (!adapter) return null;
  const results = await adapter.search(query, code);
  return results[0] ?? null;
}

export { guessCategory };
