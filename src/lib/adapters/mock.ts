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

// Kategoriye uygun, deterministik ürün görseli. Küratörlü Unsplash CDN
// görselleri (kalıcı, hızlı, anahtar gerektirmez); seed'e göre seçilir.
const CATEGORY_IMAGES: Record<Category, string[]> = {
  clothing: [
    "photo-1521572163474-6864f9cf17ab",
    "photo-1576566588028-4147f3842f27",
    "photo-1620799140408-edc6dcb6d633",
    "photo-1556905055-8f358a7a47b2",
    "photo-1503342217505-b0a15ec3261c",
  ],
  shoes: [
    "photo-1542291026-7eec264c27ff",
    "photo-1595950653106-6c9ebd614d3a",
    "photo-1460353581641-37baddab0fa2",
    "photo-1551107696-a4b0c5a0d9a2",
    "photo-1491553895911-0055eca6402d",
  ],
  bag: [
    "photo-1584917865442-de89df76afd3",
    "photo-1548036328-c9fa89d128fa",
    "photo-1591561954557-26941169b49e",
    "photo-1566150905458-1bf1fc113f0d",
  ],
  tech: [
    "photo-1511707171634-5f897ff02aa9",
    "photo-1517336714731-489689fd1ca8",
    "photo-1496181133206-80ce9b88a853",
  ],
};

function productImage(category: Category, seed: number): string {
  const pool = CATEGORY_IMAGES[category];
  const id = pool[seed % pool.length];
  return `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`;
}

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
          imageUrl: productImage(category, seed),
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
