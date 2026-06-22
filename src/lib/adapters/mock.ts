import type { Category, ProductResult, Variant } from "@/lib/types";
import { siteMeta } from "@/lib/sites";
import type { SiteAdapter } from "./types";

// --- Deterministik sözde-rastgele (seed tabanlı) ---
// Aynı arama her zaman aynı sonucu verir; demo deneyimini tutarlı kılar.
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Kategori tahmini (arama kelimesinden) ---
const SHOE_WORDS = ["ayakkabı", "sneaker", "spor ayakkabı", "bot", "çizme", "sandalet", "topuklu", "air max", "superstar"];
const BAG_WORDS = ["çanta", "sırt çantası", "el çantası", "cüzdan", "bag", "clutch"];
const TECH_WORDS = ["telefon", "laptop", "kulaklık", "iphone", "samsung", "playstation", "tv", "monitör", "tablet"];

export function guessCategory(query: string): Category {
  const q = query.toLowerCase();
  if (SHOE_WORDS.some((w) => q.includes(w))) return "shoes";
  if (BAG_WORDS.some((w) => q.includes(w))) return "bag";
  if (TECH_WORDS.some((w) => q.includes(w))) return "tech";
  return "clothing";
}

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_NUMBERS = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const COLORS = ["Siyah", "Beyaz", "Lacivert", "Bej", "Bordo"];

function buildVariants(category: Category, rand: () => number, basePrice: number): Variant[] {
  if (category === "shoes") {
    return SHOE_NUMBERS.map((label) => {
      const inStock = rand() > 0.45;
      return {
        type: "number" as const,
        label,
        inStock,
        stockCount: inStock ? Math.floor(rand() * 8) + 1 : 0,
        price: basePrice,
      };
    });
  }
  if (category === "clothing") {
    return CLOTHING_SIZES.map((label) => {
      const inStock = rand() > 0.4;
      return {
        type: "size" as const,
        label,
        inStock,
        stockCount: inStock ? Math.floor(rand() * 10) + 1 : 0,
        price: basePrice,
      };
    });
  }
  if (category === "bag") {
    return COLORS.map((label) => {
      const inStock = rand() > 0.5;
      return {
        type: "color" as const,
        label,
        inStock,
        stockCount: inStock ? Math.floor(rand() * 5) + 1 : 0,
        price: basePrice,
      };
    });
  }
  // tech: tek varyant
  const inStock = rand() > 0.4;
  return [
    {
      type: "color" as const,
      label: "Standart",
      inStock,
      stockCount: inStock ? Math.floor(rand() * 15) + 1 : 0,
      price: basePrice,
    },
  ];
}

// Türkçe-uyumlu başlık: yalnızca her kelimenin ilk harfini büyütür.
function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0].toLocaleUpperCase("tr") + w.slice(1) : w))
    .join(" ");
}

const PICSUM = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

/**
 * Mock adapter fabrikası. Verilen site için, aramanın o sitede bulunup
 * bulunmadığını seed'e göre belirler; bulduysa varyantlı bir ürün döndürür.
 */
export function createMockAdapter(siteKey: string): SiteAdapter {
  const meta = siteMeta(siteKey);
  return {
    site: siteKey,
    match: (url: string) => url.toLowerCase().includes(siteKey),
    async search(query: string, code?: string): Promise<ProductResult[]> {
      const category = guessCategory(query);
      const seed = hashSeed(`${siteKey}|${query.toLowerCase().trim()}|${code ?? ""}`);
      const rand = mulberry32(seed);

      // Her site ürünü stoklamıyor: ~%65 olasılıkla listede yer alır.
      if (rand() > 0.65) return [];

      const basePrice = Math.round((500 + rand() * 4500) / 10) * 10; // 500–5000 TL, 10'a yuvarlı
      const variants = buildVariants(category, rand, basePrice);
      const title = titleCase(query.trim());

      return [
        {
          site: siteKey,
          title: code ? `${title} (${code})` : title,
          imageUrl: PICSUM(`${siteKey}-${query}`),
          productUrl: `https://www.${siteKey}.com/arama?q=${encodeURIComponent(query)}`,
          category,
          brand: meta.name,
          currency: "TRY",
          variants,
        },
      ];
    },
    async scrape(url: string): Promise<ProductResult | null> {
      const q = "Ürün";
      const results = await this.search(q);
      if (results.length === 0) return null;
      return { ...results[0], productUrl: url };
    },
  };
}
