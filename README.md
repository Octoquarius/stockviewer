# StockViewer 🛍️

Kıyafet, ayakkabı ve çanta başta olmak üzere ürünleri **tüm sitelerde tek ekranda** ara;
fiyatı ve **beden/numara bazında stoğu** gör, tükendiyse **bildirim** aç (tarayıcı push + e-posta).

> Ana akış: **giriş → ürün adı + kod ile ara → ürünün satıldığı tüm siteler liste halinde → stok/beden → bildirim aç.**

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
```

Anahtar olmadan da çalışır: **demo modunda** takip listesi ve bildirim kuralları
tarayıcıda (localStorage) saklanır, push izni alınır.

## Ortam değişkenleri (`.env.local`)

| Değişken | Ne için | Durum |
|----------|---------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push | ✅ otomatik üretildi |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth + kalıcılık | ⏳ Supabase projesi gerekiyor |
| `RESEND_API_KEY`, `RESEND_FROM` | E-posta bildirimi | ⏳ Resend anahtarı gerekiyor |
| `CRON_SECRET` | Cron koruması | rastgele bir değer ver |

### Supabase kurulumu
1. https://supabase.com/dashboard → yeni proje.
2. `supabase/migrations/0001_init.sql` içeriğini SQL Editor'da çalıştır (tablolar + RLS).
3. Project Settings → API'den URL ve anahtarları `.env.local`'e yaz.

## Mimari

- **Arama**: `src/lib/adapters/` — her site bir `SiteAdapter` (`search` + `scrape`).
  Şu an tümü **mock** veri döndürür; gerçek scraping Kademe 1→3 sırasıyla eklenecek
  (Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner → ...).
- **UI**: `src/components/` — arama, sonuç kartı, beden/numara matrisi, bildirim modalı.
- **Kalıcılık**: `src/lib/store.tsx` — Supabase varsa Postgres, yoksa localStorage.
- **Bildirim**: `src/app/api/cron/check-stock` (Vercel Cron, 30 dk) + `src/lib/notify.ts`
  (web-push + Resend) + `public/sw.js` (service worker).

Ayrıntılı plan: [`plan.md`](./plan.md).

## Dağıtım (Vercel)
`vercel.json` cron'u tanımlar. Ortam değişkenlerini Vercel projesine ekleyip deploy et.
