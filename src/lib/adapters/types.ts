import type { ProductResult } from "@/lib/types";

/**
 * Her e-ticaret sitesi bu arayüze uyan bir adapter ile temsil edilir.
 * - `search`: birincil akış — ürün adı + (opsiyonel) kod ile site içinde arama.
 * - `scrape`: ikincil akış — tek ürün URL'sinden detay çıkarımı.
 *
 * Mock fazında her ikisi de sahte veri döndürür; gerçek fazda Cheerio/Playwright
 * ile sitenin arama sonucu / ürün sayfası parse edilir.
 */
export interface SiteAdapter {
  site: string;
  /** Bu URL bu siteye mi ait? (scrape yönlendirmesi için) */
  match(url: string): boolean;
  search(query: string, code?: string): Promise<ProductResult[]>;
  scrape(url: string): Promise<ProductResult | null>;
}
