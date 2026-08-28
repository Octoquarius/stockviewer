import type { ProductResult } from "@/lib/types";
import { SITES } from "@/lib/sites";
import { createMockAdapter, guessCategory } from "./mock";
import type { SiteAdapter } from "./types";

/**
 * Adapter registry. Every site currently uses the mock adapter.
 * As real adapters are added (Tier 1→3), they'll replace the mock
 * implementation here; since the interface stays the same, the UI won't change.
 */
const ADAPTERS: SiteAdapter[] = SITES.map((s) => createMockAdapter(s.key));

/**
 * Searches every site in parallel by name + code.
 * Results are sorted by price (cheapest first).
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

/** Finds the right adapter by URL and scrapes a single product (secondary flow). */
export async function scrapeUrl(url: string): Promise<ProductResult | null> {
  const adapter = ADAPTERS.find((a) => a.match(url));
  if (!adapter) return null;
  return adapter.scrape(url);
}

/** Search a single site (used by the cron for up-to-date stock/price checks). */
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
