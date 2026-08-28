-- StockViewer schema (plan.md Section 3) + Row Level Security
-- Run this in the Supabase SQL Editor or via `supabase db push`.

-- Tracked products ----------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site text not null,
  product_url text,
  title text not null,
  image_url text,
  category text not null check (category in ('clothing','shoes','bag','tech')),
  brand text,
  currency text not null default 'TRY',
  created_at timestamptz not null default now(),
  unique (user_id, site, title)
);

-- Variants (size/number/color) ---------------------------------------------
create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_type text not null check (variant_type in ('size','number','color')),
  variant_label text not null,
  in_stock boolean not null default false,
  stock_count integer,
  price numeric(12,2) not null,
  last_checked_at timestamptz not null default now()
);
create index if not exists variants_product_idx on public.variants (product_id);

-- Price history -------------------------------------------------------------
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.variants (id) on delete cascade,
  price numeric(12,2) not null,
  recorded_at timestamptz not null default now()
);
create index if not exists price_history_variant_idx on public.price_history (variant_id);

-- Notification rules --------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  product_title text not null,
  site text not null,
  variant_label text,
  trigger_type text not null check (trigger_type in ('back_in_stock','price_drop')),
  target_price numeric(12,2),
  channel text not null default 'both' check (channel in ('push','email','both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_active_idx on public.notifications (is_active);

-- Push subscriptions ---------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Sent-notification log (prevents duplicates) --------------------------------
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  event_key text not null,            -- e.g. "back_in_stock:M" — same event only once
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  unique (notification_id, event_key)
);

-- Row Level Security -----------------------------------------------------------
alter table public.products            enable row level security;
alter table public.variants            enable row level security;
alter table public.price_history       enable row level security;
alter table public.notifications       enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.notification_log    enable row level security;

-- A user can only access their own data
create policy "own products"     on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own push subs"    on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Variant/price/log: ownership is verified through the product/notification
create policy "own variants" on public.variants
  for all using (
    exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid())
  );

create policy "own price history" on public.price_history
  for all using (
    exists (
      select 1 from public.variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id and p.user_id = auth.uid()
    )
  );

create policy "own notif log" on public.notification_log
  for all using (
    exists (select 1 from public.notifications n where n.id = notification_id and n.user_id = auth.uid())
  );
