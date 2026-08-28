# StockViewer 🛍️

Search clothing, shoes, and bags — among other products — **across every site on one screen**;
see the price and **stock by size/number**, and turn on a **notification** if it's out of stock (browser push + email).

> Main flow: **sign in → search by product name + code → every site that sells the product listed → stock/size → turn on notification.**

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

It also works without any keys: in **demo mode**, the tracking list and notification rules
are stored in the browser (localStorage), and push permission is requested locally.

## Environment variables (`.env.local`)

| Variable | What it's for | Status |
|----------|---------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push | ✅ auto-generated |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth + persistence | ⏳ requires a Supabase project |
| `RESEND_API_KEY`, `RESEND_FROM` | Email notifications | ⏳ requires a Resend key |
| `CRON_SECRET` | Cron protection | give it a random value |

### Supabase setup
1. https://supabase.com/dashboard → new project.
2. Run the contents of `supabase/migrations/0001_init.sql` in the SQL Editor (tables + RLS).
3. Copy the URL and keys from Project Settings → API into `.env.local`.

## Architecture

- **Search**: `src/lib/adapters/` — each site is a `SiteAdapter` (`search` + `scrape`).
  All of them currently return **mock** data; real scraping will be added in Tier 1→3 order
  (Trendyol, Hepsiburada, LC Waikiki, DeFacto, Koton, Boyner → ...).
- **UI**: `src/components/` — search, result card, size/number matrix, notification modal.
- **Persistence**: `src/lib/store.tsx` — Postgres if Supabase is configured, otherwise localStorage.
- **Notifications**: `src/app/api/cron/check-stock` (Vercel Cron, every 30 min) + `src/lib/notify.ts`
  (web-push + Resend) + `public/sw.js` (service worker).

Detailed plan: [`plan.md`](./plan.md).

## Deployment (Vercel)
`vercel.json` defines the cron job. Add the environment variables to the Vercel project and deploy.
