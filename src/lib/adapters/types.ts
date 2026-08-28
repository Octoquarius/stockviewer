import type { ProductResult } from "@/lib/types";

/**
 * Each e-commerce site is represented by an adapter conforming to this interface.
 * - `search`: primary flow — search within the site by product name + (optional) code.
 * - `scrape`: secondary flow — extract details from a single product URL.
 *
 * In the mock phase both return fake data; in the real phase, Cheerio/Playwright
 * parses the site's search results / product page.
 */
export interface SiteAdapter {
  site: string;
  /** Does this URL belong to this site? (used for scrape routing) */
  match(url: string): boolean;
  search(query: string, code?: string): Promise<ProductResult[]>;
  scrape(url: string): Promise<ProductResult | null>;
}
