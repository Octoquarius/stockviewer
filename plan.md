# StockViewer — Project Plan

> A web app that shows **stock status, price, and size/number-based availability** for products across different e-commerce sites on a single screen, and sends **browser push + email** notifications when stock arrives or the price drops.

---

## 0. Main Flow (Primary User Scenario)

The flow at the heart of the app: **search → see every site that has the product → see stock/size → turn on a notification.**

1. **Sign in** — The user signs in to the site with Supabase Auth.
2. **Search** — They type the **name** of the product they're looking for and its **code** (model / barcode / SKU).
3. **Multi-site search** — The system scans the search infrastructure of every supported site and finds matching products.
4. **Result list** — Every site that has the product is listed as **one row/card**:
   - Site name + logo/badge
   - Price
   - Stock status (🟢 In stock · 🟡 Low stock · 🔴 Out of stock)
   - A **size/number matrix**, if applicable (each size/number shown individually)
   - **Notify** button
5. **Notification screen** — The user sets up a back-in-stock or price-drop notification (push + email) for the product/size they chose.

```
Search: "Nike Air Max 90"   Code: DH8010-100        [ Search ]
──────────────────────────────────────────────────────────────
Trendyol      2,499 ₺   🟢 In stock     38 39 40 41 42 43 44 45   [🔔 Notify]
                                        🔴 🟢 🟢 🔴 🟢 🟢 🔴 🟢
Hepsiburada   2,599 ₺   🟡 Low stock    38 39 40 41 42 43 44 45   [🔔 Notify]
                                        🟢 🟢 🔴 🔴 🟢 🔴 🔴 🟢
FLO           2,449 ₺   🔴 Out of stock — no size info —           [🔔 Notify]
```

> **This is the primary flow.** The "paste a URL → add" method is kept as a secondary/alternative entry point.
>
> **Technical note:** Multi-site search by name + code requires programmatically using each site's own search infrastructure; it's harder than URL parsing, each site's search-result structure differs, and since the same product's code can vary by site, **fuzzy matching** (name + brand + image similarity) may be needed. That's why the `SiteAdapter` interface gets a `search(query, code)` method alongside `scrape(url)` (see Section 4).

---

## 1. Purpose and Scope

### Main goal
Let the user track, from **a single panel**, products they couldn't find in stock across different sites. In particular:

- 👕 **Clothing stock** — broken down by size (XS, S, M, L, XL...)
- 👟 **Shoe stock** — broken down by number (36, 37, 38... 45)
- 👜 **Bag stock** — broken down by color/variant
- 💻 **Tech products** — secondary goal (simple stock, no variants required)

### Sites to support
Targets Turkey's largest clothing/fashion shopping sites. A separate "adapter" (scraper module) is written for each site; development is split into priority tiers (see Section 4 and Phase 3).

**General marketplaces**
- Trendyol, Hepsiburada, Amazon TR, n11, Çiçeksepeti, PttAVM, MediaMarkt (tech)

**Multi-brand fashion / department stores**
- Boyner, Beymen, Vakko, Network, Brandroom, Lidyana, WConcept, Morhipo\*

**Turkish ready-to-wear brands**
- LC Waikiki, DeFacto, Koton, Mavi, Colin's, Twist, İpekyol, Machka, AdL, Kiğılı, Damat Tween, Sarar, Lufian, Penti (underwear), Madame Coco (home/textile)

**International fast fashion (TR sites)**
- Zara, Pull&Bear, Bershka, Stradivarius, Massimo Dutti, Oysho (Inditex group), H&M, Mango, Lacoste, Tommy Hilfiger, US Polo Assn TR

**Shoes & leather**
- FLO, Deichmann, Derimod, Hotiç, İnci Deri, Greyder, Desa, SuperStep, Sneaks Up, Korayspor, Nine West TR

**Modest fashion**
- Modanisa, Sefamerve, Tozlu, Modaselvim, Trendyol Modest

**Sportswear & shoes**
- Decathlon, Nike TR, Adidas TR, Puma TR, Intersport

> \* Some sites, like Morhipo, may have shut down or merged with another brand; this is verified before implementation. For brands sold only through a marketplace (e.g. Trendyol/Boyner), the relevant marketplace adapter is used instead of a dedicated one.

### Core features
1. **Search by name + code** → lists every site that has the product on a single screen (see Section 0)
2. Each result shows: site, price, stock status, **size/number matrix**
3. Add a product (paste URL → auto-parse) — alternative path
4. Periodic automatic stock/price checks (Vercel Cron)
5. Turn on notifications: when stock arrives / price drops → **browser push + email**
6. A clean, pleasant, and inviting UI (design that puts stock and price front and center)

---

## 2. Tech Stack

| Layer | Technology | Note |
|--------|-----------|-----|
| Framework | **Next.js (App Router)** | Server components + API routes |
| Language | TypeScript | |
| UI | Tailwind CSS + **shadcn/ui** | Clean, modern, fast |
| Database + Auth | **Supabase** (Postgres) | User, product, variant, notification subscription |
| Scraping | Cheerio (HTML parsing) + Playwright where needed | For bot-protected sites |
| Scheduled job | **Vercel Cron** | Periodic stock checks |
| Push notifications | Web Push API (VAPID) | Via Service Worker |
| Email | **Resend** | Stock/price notifications |
| Deployment | Vercel | |

---

## 3. Data Model (Supabase)

```
users                (via Supabase Auth)
  id, email, created_at

products             (tracked product)
  id, user_id, source_site, product_url, title,
  image_url, category (clothing|shoes|bag|tech),
  currency, created_at

variants             (row per size/number/color)
  id, product_id, variant_type (size|number|color),
  variant_label ("M", "42", "Black"),
  in_stock (bool), stock_count (nullable), price,
  last_checked_at

price_history        (for the price-history chart)
  id, variant_id, price, recorded_at

notifications         (notification rules)
  id, user_id, product_id, variant_id (nullable),
  trigger_type (back_in_stock|price_drop),
  target_price (nullable), channel (push|email|both),
  is_active

push_subscriptions   (browser push subscriptions)
  id, user_id, endpoint, keys_p256dh, keys_auth

notification_log     (sent notifications — dedup)
  id, notification_id, sent_at, status
```

---

## 4. Scraping Architecture (Adapter Pattern)

Each site gets an adapter that conforms to a shared interface:

```ts
interface ProductResult {
  title: string;
  imageUrl: string;
  productUrl: string;
  category: Category;
  variants: {
    type: 'size' | 'number' | 'color';
    label: string;          // "M", "42", "Black"
    inStock: boolean;
    stockCount?: number;
    price: number;
  }[];
  currency: string;
}

interface SiteAdapter {
  site: string;                                   // "trendyol", "hepsiburada"...
  match(url: string): boolean;                    // does this URL belong to this site?
  scrape(url: string): Promise<ProductResult>;    // detail from a single product URL (secondary flow)
  search(query: string, code?: string): Promise<ProductResult[]>; // search by name+code (primary flow)
}
```

- `adapters/trendyol.ts`, `adapters/hepsiburada.ts`, `adapters/lcwaikiki.ts`, ... one file per site.
- `adapters/index.ts` → holds all registered adapters; in the **search** flow all of them are called in parallel, in the **URL** flow the right adapter is chosen via `match()`.
- **Development note:** Each adapter is first written as a skeleton that returns `mock` data, so the UI and notification flow work end-to-end; the real HTML parsing / search logic is then added one site at a time.

#### Adapter Priority Tiers
Every site is a target; real scraper/search development happens in this order:
- **Tier 1 (first):** Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner — highest traffic + clothing/shoe focus.
- **Tier 2:** Mavi, Zara, H&M, Mango, FLO, Amazon TR.
- **Tier 3:** The remaining brands, based on demand.

- **Legal/technical warning:** Scraping may violate some sites' terms of use, and bot protections (Cloudflare, etc.) can break parsing. Rate-limiting + polite crawling + User-Agent management will be applied; each adapter requires its own maintenance. This is covered separately in the "Risks" section of this plan.md.

---

## 5. Periodic Check (Vercel Cron)

- `app/api/cron/check-stock/route.ts` — triggered by Vercel Cron, e.g. every 15–30 minutes.
- Flow:
  1. Fetch all `products` that have an active notification rule.
  2. Re-scrape them with the relevant adapter.
  3. Compare variant stock/price against the previous value.
  4. If the trigger condition is met (stock arrived / price dropped below target) → queue a notification.
  5. Use `notification_log` to prevent sending a notification for the same event twice.

---

## 6. Notification Flow

### Browser Push
- Service Worker (`public/sw.js`) + VAPID keys.
- User clicks "Notify" → permission is requested → a `push_subscriptions` record is saved.
- Sent via `web-push` when the cron job fires.

### Email
- Template via Resend: "🎉 {product} is back in stock in size {size}!" / "💸 {product} price dropped to {price}".

---

## 7. UI (Clean + Pleasant + Inviting)

### Design language
- Bright, airy, generous white space; soft corners, subtle shadows.
- A warm/pastel accent color (e.g. coral / soft purple) + a neutral gray background.
- Clear color codes for stock status: 🟢 In stock · 🟡 Low stock · 🔴 Out of stock.
- Price shown large and legible; a price drop is highlighted with a green badge.

### Screens
1. **Search (home screen)** — product name + code input → result list from every site (each site a row: price, stock, size/number matrix, notify button). The flow from Section 0.
2. **Dashboard / My tracked list** — card or table view. Each card: image, title, site badge, price, stock status, **size/number matrix** (a green/red dot per size).
3. **Product detail** — variant table, price-history chart, set up a notification rule.
4. **Add product (alternative)** — paste URL → preview → save.
5. **My notifications** — active rules and history.
6. **Sign in / Sign up** — Supabase Auth.

### Size/Number Matrix (key component)
```
Nike Air Max 90        Trendyol      2,499 ₺   🟢 In stock
┌──────────────────────────────────────────────┐
│ 38  39  40  41  42  43  44  45                 │
│ 🔴  🟢  🟢  🔴  🟢  🟢  🔴  🟢                 │
└──────────────────────────────────────────────┘
   → click an out-of-stock size to turn on a notification for it
```

---

## 8. Roadmap (Phased)

### Phase 0 — Skeleton
- [ ] Set up Next.js + TypeScript + Tailwind + shadcn/ui
- [ ] Supabase project + table migrations
- [ ] Base layout, theme, navigation

### Phase 1 — Core UI (with mock data)
- [ ] **Search screen** (name + code) → multi-site result list (mock)
- [ ] Product list + card/table + size-number matrix component
- [ ] Add-product flow (URL, mock parse — alternative path)
- [ ] Product detail + price-history chart

### Phase 2 — Auth & Persistence
- [ ] Supabase Auth (email sign-in)
- [ ] Product/variant CRUD, data scoped to the user

### Phase 3 — Scraping (tiered)
- [ ] Adapter infrastructure + `search()`/`scrape()` + URL routing + parallel search orchestration
- [ ] **Tier 1:** Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner
- [ ] **Tier 2:** Mavi, Zara, H&M, Mango, FLO, Amazon TR
- [ ] **Tier 3:** Remaining brands (based on demand)
- [ ] Fuzzy matching (name+brand+code) to match products across sites
- [ ] Rate-limiting, error handling, retries, bot-protection fallback (Playwright)

### Phase 4 — Automation & Notifications
- [ ] Periodic checks via Vercel Cron
- [ ] Web Push (Service Worker + VAPID)
- [ ] Email notifications via Resend
- [ ] Duplicate-notification prevention (notification_log)

### Phase 5 — Polish
- [ ] Empty states, loading skeletons, error screens
- [ ] Mobile responsiveness
- [ ] Deploy to Vercel

---

## 9. Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
```

---

## 10. Risks and Notes

- **Scraping fragility:** When a site changes its HTML structure, the adapter breaks → needs maintenance.
- **Bot protections:** Cheerio may not be enough on sites requiring Cloudflare/JS rendering → Playwright may be needed (extra configuration on Vercel).
- **Legal:** Scraping may violate some sites' ToS; caution needed for commercial use. Official/affiliate APIs should be preferred where possible.
- **Cron frequency vs. resources:** Crawling too often can trigger an IP ban; a reasonable interval (15–30 min) will be chosen.
- **Many sites = high maintenance load:** ~40 sites, each with a different HTML/search structure and bot protection. The tiered approach (Tier 1→3) keeps this load manageable.
- **Multi-site matching difficulty:** The same product may be listed under a different name/code on each site; reliable matching may require fuzzy matching + user confirmation.
- **Marketplace-only brands:** For brands without their own site that sell only through Trendyol-Boyner, no separate adapter is written; the relevant marketplace adapter is used instead.
