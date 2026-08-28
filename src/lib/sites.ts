// Metadata for supported sites: visual identity (badge color) + category focus.
// Mirrors the full list in plan.md Section 1. Adapter development happens in tiers.

export interface SiteMeta {
  key: string;
  name: string;
  /** Badge background color (close to the brand color). */
  color: string;
  /** Adapter development priority: 1 = first. */
  tier: 1 | 2 | 3;
  group:
    | "marketplace"
    | "department"
    | "tr-brand"
    | "global-fashion"
    | "shoes"
    | "modest"
    | "sports";
}

export const SITES: SiteMeta[] = [
  // General marketplaces
  { key: "trendyol", name: "Trendyol", color: "#f27a1a", tier: 1, group: "marketplace" },
  { key: "hepsiburada", name: "Hepsiburada", color: "#ff6000", tier: 1, group: "marketplace" },
  { key: "amazon", name: "Amazon TR", color: "#232f3e", tier: 2, group: "marketplace" },
  { key: "n11", name: "n11", color: "#d4147a", tier: 3, group: "marketplace" },
  { key: "ciceksepeti", name: "Çiçeksepeti", color: "#48a800", tier: 3, group: "marketplace" },
  { key: "pttavm", name: "PttAVM", color: "#0066b3", tier: 3, group: "marketplace" },
  { key: "mediamarkt", name: "MediaMarkt", color: "#df0000", tier: 3, group: "marketplace" },

  // Multi-brand fashion / department stores
  { key: "boyner", name: "Boyner", color: "#1a1a1a", tier: 1, group: "department" },
  { key: "beymen", name: "Beymen", color: "#111111", tier: 3, group: "department" },
  { key: "vakko", name: "Vakko", color: "#0a0a0a", tier: 3, group: "department" },
  { key: "network", name: "Network", color: "#2b2b2b", tier: 3, group: "department" },
  { key: "brandroom", name: "Brandroom", color: "#444444", tier: 3, group: "department" },
  { key: "lidyana", name: "Lidyana", color: "#c9447a", tier: 3, group: "department" },
  { key: "wconcept", name: "WConcept", color: "#222222", tier: 3, group: "department" },

  // Turkish ready-to-wear brands
  { key: "lcwaikiki", name: "LC Waikiki", color: "#0b4ea2", tier: 1, group: "tr-brand" },
  { key: "defacto", name: "DeFacto", color: "#e4002b", tier: 1, group: "tr-brand" },
  { key: "koton", name: "Koton", color: "#111111", tier: 1, group: "tr-brand" },
  { key: "mavi", name: "Mavi", color: "#0a3d91", tier: 2, group: "tr-brand" },
  { key: "colins", name: "Colin's", color: "#1c1c1c", tier: 3, group: "tr-brand" },
  { key: "twist", name: "Twist", color: "#7a6a58", tier: 3, group: "tr-brand" },
  { key: "ipekyol", name: "İpekyol", color: "#9a1f2e", tier: 3, group: "tr-brand" },
  { key: "machka", name: "Machka", color: "#333333", tier: 3, group: "tr-brand" },
  { key: "adl", name: "AdL", color: "#444444", tier: 3, group: "tr-brand" },
  { key: "kigili", name: "Kiğılı", color: "#1b3a5b", tier: 3, group: "tr-brand" },
  { key: "damattween", name: "Damat Tween", color: "#23282d", tier: 3, group: "tr-brand" },
  { key: "sarar", name: "Sarar", color: "#2a2a2a", tier: 3, group: "tr-brand" },
  { key: "lufian", name: "Lufian", color: "#3a4a5a", tier: 3, group: "tr-brand" },
  { key: "penti", name: "Penti", color: "#e6007e", tier: 3, group: "tr-brand" },
  { key: "madamecoco", name: "Madame Coco", color: "#b08d57", tier: 3, group: "tr-brand" },

  // International fast fashion (TR)
  { key: "zara", name: "Zara", color: "#000000", tier: 2, group: "global-fashion" },
  { key: "pullbear", name: "Pull&Bear", color: "#1a1a1a", tier: 3, group: "global-fashion" },
  { key: "bershka", name: "Bershka", color: "#111111", tier: 3, group: "global-fashion" },
  { key: "stradivarius", name: "Stradivarius", color: "#222222", tier: 3, group: "global-fashion" },
  { key: "massimodutti", name: "Massimo Dutti", color: "#2b2b2b", tier: 3, group: "global-fashion" },
  { key: "oysho", name: "Oysho", color: "#333333", tier: 3, group: "global-fashion" },
  { key: "hm", name: "H&M", color: "#e50010", tier: 2, group: "global-fashion" },
  { key: "mango", name: "Mango", color: "#6f1d1b", tier: 2, group: "global-fashion" },
  { key: "lacoste", name: "Lacoste", color: "#0a6b3b", tier: 3, group: "global-fashion" },
  { key: "tommy", name: "Tommy Hilfiger", color: "#001b94", tier: 3, group: "global-fashion" },
  { key: "uspolo", name: "US Polo Assn", color: "#0a2240", tier: 3, group: "global-fashion" },

  // Shoes & leather
  { key: "flo", name: "FLO", color: "#e4002b", tier: 2, group: "shoes" },
  { key: "deichmann", name: "Deichmann", color: "#e2001a", tier: 3, group: "shoes" },
  { key: "derimod", name: "Derimod", color: "#3a2a1a", tier: 3, group: "shoes" },
  { key: "hotic", name: "Hotiç", color: "#2a1a12", tier: 3, group: "shoes" },
  { key: "inci", name: "İnci Deri", color: "#5a3a22", tier: 3, group: "shoes" },
  { key: "greyder", name: "Greyder", color: "#444444", tier: 3, group: "shoes" },
  { key: "desa", name: "Desa", color: "#1c1c1c", tier: 3, group: "shoes" },
  { key: "superstep", name: "SuperStep", color: "#111111", tier: 3, group: "shoes" },
  { key: "sneaksup", name: "Sneaks Up", color: "#222222", tier: 3, group: "shoes" },
  { key: "korayspor", name: "Korayspor", color: "#0a3d91", tier: 3, group: "shoes" },
  { key: "ninewest", name: "Nine West", color: "#1a1a1a", tier: 3, group: "shoes" },

  // Modest fashion
  { key: "modanisa", name: "Modanisa", color: "#00a3a3", tier: 2, group: "modest" },
  { key: "sefamerve", name: "Sefamerve", color: "#7a1f5c", tier: 3, group: "modest" },
  { key: "tozlu", name: "Tozlu", color: "#c2185b", tier: 3, group: "modest" },
  { key: "modaselvim", name: "Modaselvim", color: "#9c27b0", tier: 3, group: "modest" },

  // Sports
  { key: "decathlon", name: "Decathlon", color: "#0082c3", tier: 2, group: "sports" },
  { key: "nike", name: "Nike", color: "#111111", tier: 2, group: "sports" },
  { key: "adidas", name: "Adidas", color: "#000000", tier: 2, group: "sports" },
  { key: "puma", name: "Puma", color: "#1a1a1a", tier: 3, group: "sports" },
  { key: "intersport", name: "Intersport", color: "#003da5", tier: 3, group: "sports" },
];

export const SITE_MAP: Record<string, SiteMeta> = Object.fromEntries(
  SITES.map((s) => [s.key, s]),
);

export function siteMeta(key: string): SiteMeta {
  return (
    SITE_MAP[key] ?? {
      key,
      name: key,
      color: "#888888",
      tier: 3,
      group: "marketplace",
    }
  );
}

export const GROUP_LABELS: Record<SiteMeta["group"], string> = {
  marketplace: "General marketplaces",
  department: "Multi-brand fashion",
  "tr-brand": "Turkish apparel brands",
  "global-fashion": "International fashion",
  shoes: "Shoes & leather",
  modest: "Modest fashion",
  sports: "Sports",
};
