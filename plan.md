# StockViewer — Proje Planı

> Farklı e-ticaret sitelerindeki ürünlerin **stok durumunu, fiyatını ve beden/numara bazlı uygunluğunu** tek ekranda gösteren; stok geldiğinde veya fiyat düştüğünde **tarayıcı push + e-posta** ile bildirim atan web uygulaması.

---

## 0. Ana Akış (Birincil Kullanıcı Senaryosu)

Uygulamanın merkezindeki akış: **ara → ürünün bulunduğu tüm siteleri gör → stok/beden gör → bildirim aç.**

1. **Giriş** — Kullanıcı Supabase Auth ile siteye giriş yapar.
2. **Arama** — Aradığı ürünün **adını** ve **kodunu** (model / barkod / stok kodu) yazar.
3. **Çoklu-site arama** — Sistem, desteklenen tüm sitelerin arama altyapısını tarar ve eşleşen ürünü bulur.
4. **Sonuç listesi** — Ürünün bulunduğu **her site bir satır/kart** olarak listelenir:
   - Site adı + logo/rozet
   - Fiyat
   - Stok durumu (🟢 Stokta · 🟡 Az kaldı · 🔴 Tükendi)
   - Varsa **beden/numara matrisi** (her beden/numara ayrı ayrı)
   - **Bildirim Aç** butonu
5. **Bildirim ekranı** — Kullanıcı seçtiği ürün/beden için stok-geldi veya fiyat-düştü bildirimini (push + e-posta) kurar.

```
Arama: "Nike Air Max 90"   Kod: DH8010-100        [ Ara ]
──────────────────────────────────────────────────────────
Trendyol      2.499 ₺   🟢 Stokta    38 39 40 41 42 43 44 45   [🔔 Bildirim]
                                     🔴 🟢 🟢 🔴 🟢 🟢 🔴 🟢
Hepsiburada   2.599 ₺   🟡 Az kaldı  38 39 40 41 42 43 44 45   [🔔 Bildirim]
                                     🟢 🟢 🔴 🔴 🟢 🔴 🔴 🟢
FLO           2.449 ₺   🔴 Tükendi   — beden bilgisi yok —      [🔔 Bildirim]
```

> **Birincil akış budur.** "URL yapıştır → ekle" yöntemi ikincil/alternatif giriş yolu olarak korunur.
>
> **Teknik not:** Ad + kod ile çoklu-site arama, her sitenin kendi arama altyapısını programatik kullanmayı gerektirir; URL parse'tan zordur, her sitenin arama sonucu yapısı farklıdır ve aynı ürünün kodu site bazında değişebildiği için **bulanık eşleştirme** (isim + marka + görsel benzerliği) gerekebilir. Bu yüzden `SiteAdapter` arayüzüne `scrape(url)` yanında bir `search(query, code)` metodu eklenir (bkz. Bölüm 4).

---

## 1. Amaç ve Kapsam

### Ana hedef
Kullanıcının farklı sitelerde stokta bulamadığı ürünleri **tek bir panelden** takip etmesi. Özellikle:

- 👕 **Kıyafet stokları** — beden bazında (XS, S, M, L, XL...) ayrı ayrı
- 👟 **Ayakkabı stokları** — numara bazında (36, 37, 38... 45) ayrı ayrı
- 👜 **Çanta stokları** — renk/varyant bazında
- 💻 **Teknolojik ürünler** — ikincil hedef (varyant gerektirmeyen basit stok)

### Desteklenecek siteler
Türkiye'nin en büyük kıyafet/moda alışveriş siteleri hedeflenir. Her site için ayrı bir "adapter" (scraper modülü) yazılır; geliştirme öncelik kademelerine bölünür (bkz. Bölüm 4 ve Faz 3).

**Genel pazaryerleri**
- Trendyol, Hepsiburada, Amazon TR, n11, Çiçeksepeti, PttAVM, MediaMarkt (teknoloji)

**Çok markalı moda / department store**
- Boyner, Beymen, Vakko, Network, Brandroom, Lidyana, WConcept, Morhipo\*

**Türk hazır giyim markaları**
- LC Waikiki, DeFacto, Koton, Mavi, Colin's, Twist, İpekyol, Machka, AdL, Kiğılı, Damat Tween, Sarar, Lufian, Penti (iç giyim), Madame Coco (ev/tekstil)

**Uluslararası hızlı moda (TR siteleri)**
- Zara, Pull&Bear, Bershka, Stradivarius, Massimo Dutti, Oysho (Inditex grubu), H&M, Mango, Lacoste, Tommy Hilfiger, US Polo Assn TR

**Ayakkabı & deri**
- FLO, Deichmann, Derimod, Hotiç, İnci Deri, Greyder, Desa, SuperStep, Sneaks Up, Korayspor, Nine West TR

**Tesettür / modest moda**
- Modanisa, Sefamerve, Tozlu, Modaselvim, Trendyol Modest

**Spor giyim & ayakkabı**
- Decathlon, Nike TR, Adidas TR, Puma TR, Intersport

> \* Morhipo gibi bazı siteler kapanmış veya başka markayla birleşmiş olabilir; uygulamadan önce aktiflik doğrulanır. Yalnızca pazaryeri (örn. Trendyol/Boyner) üzerinden satılan markalar için ayrı adapter yerine ilgili pazaryeri adapteri kullanılır.

### Çekirdek özellikler
1. **Ad + kod ile arama** → ürünün bulunduğu tüm siteleri tek ekranda listeleme (bkz. Bölüm 0)
2. Her sonuçta: site, fiyat, stok durumu, **beden/numara matrisi**
3. Ürün ekleme (URL yapıştır → otomatik parse) — alternatif yol
4. Periyodik otomatik stok/fiyat kontrolü (Vercel Cron)
5. Bildirim açma: stok gelince / fiyat düşünce → **tarayıcı push + e-posta**
6. Sade, tatlı ve cezbedici arayüz (stok ve fiyatı öne çıkaran tasarım)

---

## 2. Teknik Yığın

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Framework | **Next.js (App Router)** | Sunucu bileşenleri + API rotaları |
| Dil | TypeScript | |
| UI | Tailwind CSS + **shadcn/ui** | Sade, modern, hızlı |
| Veritabanı + Auth | **Supabase** (Postgres) | Kullanıcı, ürün, varyant, bildirim aboneliği |
| Scraping | Cheerio (HTML parse) + gerektiğinde Playwright | Bot korumalı siteler için |
| Zamanlanmış görev | **Vercel Cron** | Periyodik stok kontrolü |
| Push bildirim | Web Push API (VAPID) | Service Worker ile |
| E-posta | **Resend** | Stok/fiyat bildirimi |
| Dağıtım | Vercel | |

---

## 3. Veri Modeli (Supabase)

```
users                (Supabase Auth ile)
  id, email, created_at

products             (takip edilen ürün)
  id, user_id, source_site, product_url, title,
  image_url, category (clothing|shoes|bag|tech),
  currency, created_at

variants             (beden/numara/renk bazlı satır)
  id, product_id, variant_type (size|number|color),
  variant_label ("M", "42", "Siyah"),
  in_stock (bool), stock_count (nullable), price,
  last_checked_at

price_history        (fiyat geçmişi grafiği için)
  id, variant_id, price, recorded_at

notifications        (bildirim kuralları)
  id, user_id, product_id, variant_id (nullable),
  trigger_type (back_in_stock|price_drop),
  target_price (nullable), channel (push|email|both),
  is_active

push_subscriptions   (tarayıcı push abonelikleri)
  id, user_id, endpoint, keys_p256dh, keys_auth

notification_log     (gönderilen bildirimler — tekrar engelleme)
  id, notification_id, sent_at, status
```

---

## 4. Scraping Mimarisi (Adapter Pattern)

Her site için ortak arayüze uyan bir adapter:

```ts
interface ProductResult {
  title: string;
  imageUrl: string;
  productUrl: string;
  category: Category;
  variants: {
    type: 'size' | 'number' | 'color';
    label: string;          // "M", "42", "Siyah"
    inStock: boolean;
    stockCount?: number;
    price: number;
  }[];
  currency: string;
}

interface SiteAdapter {
  site: string;                                   // "trendyol", "hepsiburada"...
  match(url: string): boolean;                    // bu URL bu siteye ait mi?
  scrape(url: string): Promise<ProductResult>;    // tek ürün URL'sinden detay (ikincil akış)
  search(query: string, code?: string): Promise<ProductResult[]>; // ad+kod ile arama (birincil akış)
}
```

- `adapters/trendyol.ts`, `adapters/hepsiburada.ts`, `adapters/lcwaikiki.ts`, ... her site için bir dosya.
- `adapters/index.ts` → kayıtlı tüm adapter'ları tutar; **arama** akışında hepsi paralel çağrılır, **URL** akışında `match()` ile doğru adapter seçilir.
- **Geliştirme notu:** Önce her adapter `mock` veri döndüren iskelet olarak yazılır, böylece UI ve bildirim akışı uçtan uca çalışır; ardından gerçek HTML parse / arama mantığı tek tek eklenir.

#### Adapter Öncelik Kademeleri
Tüm siteler hedeftir; gerçek scraper/arama geliştirmesi şu sırayla yapılır:
- **Kademe 1 (ilk):** Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner — en yüksek trafik + kıyafet/ayakkabı odağı.
- **Kademe 2:** Mavi, Zara, H&M, Mango, FLO, Amazon TR.
- **Kademe 3:** Geri kalan markalar, talebe göre.

- **Yasal/teknik uyarı:** Scraping bazı sitelerin kullanım şartlarına aykırı olabilir ve bot korumaları (Cloudflare vb.) parse'ı kırabilir. Rate-limit + nazik tarama + User-Agent yönetimi uygulanacak; her adapter ayrı bakım gerektirir. Bu plan.md içinde ayrı bir "Riskler" bölümünde işlenir.

---

## 5. Periyodik Kontrol (Vercel Cron)

- `app/api/cron/check-stock/route.ts` — Vercel Cron ile örn. her 15–30 dakikada bir tetiklenir.
- Akış:
  1. Aktif bildirim kuralı olan tüm `products` çekilir.
  2. İlgili adapter ile yeniden scrape edilir.
  3. Varyant stok/fiyat durumu eski değerle kıyaslanır.
  4. Tetikleme koşulu sağlandıysa (stok geldi / fiyat hedefin altına düştü) → bildirim kuyruğa alınır.
  5. `notification_log` ile aynı olay için tekrar bildirim gönderilmesi engellenir.

---

## 6. Bildirim Akışı

### Tarayıcı Push
- Service Worker (`public/sw.js`) + VAPID anahtarları.
- Kullanıcı "Bildirim Aç" → izin istenir → `push_subscriptions` kaydı.
- Cron tetiklenince `web-push` ile gönderilir.

### E-posta
- Resend ile şablon: "🎉 {ürün} {beden} bedeni tekrar stokta!" / "💸 {ürün} fiyatı {fiyat} oldu".

---

## 7. Arayüz (Sade + Tatlı + Cezbedici)

### Tasarım dili
- Açık, ferah, bol beyaz alan; yumuşak köşeler, hafif gölgeler.
- Sıcak/pastel vurgu rengi (örn. coral / soft purple) + nötr gri zemin.
- Stok durumu net renk kodları: 🟢 Stokta · 🟡 Az kaldı · 🔴 Tükendi.
- Fiyat büyük ve okunaklı; fiyat düşüşü yeşil rozetle vurgulanır.

### Ekranlar
1. **Arama (ana ekran)** — ürün adı + kod girişi → tüm sitelerden sonuç listesi (her site bir satır: fiyat, stok, beden/numara matrisi, bildirim aç). Bölüm 0'daki akış.
2. **Dashboard / Takip listem** — kart veya tablo görünümü. Her kart: görsel, başlık, site rozeti, fiyat, stok durumu, **beden/numara matrisi** (her beden için yeşil/kırmızı nokta).
3. **Ürün detay** — varyant tablosu, fiyat geçmişi grafiği, bildirim kuralı kurma.
4. **Ürün ekle (alternatif)** — URL yapıştır → önizleme → kaydet.
5. **Bildirimlerim** — aktif kurallar ve geçmiş.
6. **Giriş / Kayıt** — Supabase Auth.

### Beden/Numara Matrisi (kilit bileşen)
```
Nike Air Max 90        Trendyol      2.499 ₺   🟢 Stokta
┌──────────────────────────────────────────────┐
│ 38  39  40  41  42  43  44  45                 │
│ 🔴  🟢  🟢  🔴  🟢  🟢  🔴  🟢                 │
└──────────────────────────────────────────────┘
   → tükenmiş bedene tıkla = o beden için bildirim aç
```

---

## 8. Yapılacaklar (Aşamalı Yol Haritası)

### Faz 0 — İskelet
- [ ] Next.js + TypeScript + Tailwind + shadcn/ui kurulumu
- [ ] Supabase projesi + tabloların migration'ı
- [ ] Temel layout, tema, navigasyon

### Faz 1 — Çekirdek UI (mock veri ile)
- [ ] **Arama ekranı** (ad + kod) → çoklu-site sonuç listesi (mock)
- [ ] Ürün listesi + kart/tablo + beden-numara matrisi bileşeni
- [ ] Ürün ekle akışı (URL, mock parse — alternatif yol)
- [ ] Ürün detay + fiyat geçmişi grafiği

### Faz 2 — Auth & Kalıcılık
- [ ] Supabase Auth (e-posta ile giriş)
- [ ] Ürün/varyant CRUD, kullanıcıya bağlı veriler

### Faz 3 — Scraping (kademeli)
- [ ] Adapter altyapısı + `search()`/`scrape()` + URL yönlendirme + paralel arama orkestrasyonu
- [ ] **Kademe 1:** Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner
- [ ] **Kademe 2:** Mavi, Zara, H&M, Mango, FLO, Amazon TR
- [ ] **Kademe 3:** Geri kalan markalar (talebe göre)
- [ ] Bulanık eşleştirme (isim+marka+kod) ile siteler arası ürün eşleme
- [ ] Rate-limit, hata yönetimi, retry, bot-koruma fallback (Playwright)

### Faz 4 — Otomasyon & Bildirim
- [ ] Vercel Cron ile periyodik kontrol
- [ ] Web Push (Service Worker + VAPID)
- [ ] Resend ile e-posta bildirimi
- [ ] Tekrar bildirim engelleme (notification_log)

### Faz 5 — Cila
- [ ] Boş durumlar, yüklenme iskeletleri, hata ekranları
- [ ] Mobil uyum
- [ ] Vercel'e dağıtım

---

## 9. Gerekli Ortam Değişkenleri

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

## 10. Riskler ve Notlar

- **Scraping kırılganlığı:** Siteler HTML yapısını değiştirince adapter bozulur → bakım gerekir.
- **Bot korumaları:** Cloudflare/JS-render gerektiren sitelerde Cheerio yetmeyebilir → Playwright gerekebilir (Vercel'de ek yapılandırma).
- **Yasal:** Scraping bazı sitelerin ToS'una aykırı olabilir; ticari kullanımda dikkat. Mümkünse resmi/affiliate API'ler tercih edilmeli.
- **Cron sıklığı vs. kaynak:** Çok sık tarama IP engeli getirebilir; makul aralık (15–30 dk) seçilecek.
- **Çok sayıda site = yüksek bakım yükü:** ~40 sitenin her birinin HTML/arama yapısı ve bot koruması farklı. Kademeli yaklaşım (Kademe 1→3) bu yükü yönetilebilir kılar.
- **Çoklu-site eşleştirme zorluğu:** Aynı ürün her sitede farklı isim/kod ile listelenebilir; güvenilir eşleştirme bulanık eşleme + kullanıcı onayı gerektirebilir.
- **Sadece pazaryerinde satılan markalar:** Kendi sitesi olmayan/yalnızca Trendyol-Boyner üzerinden satan markalar için ayrı adapter yazılmaz; ilgili pazaryeri adapteri kullanılır.

