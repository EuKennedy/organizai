-- =============================================================================
-- V6: Wishlist (Coisas que queremos comprar) + Baby names (Nomes dos filhos)
-- Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- WISHLIST CATEGORIES (user-defined custom categories)
--   Defaults vivem no app: Casa, Eletrônicos, Roupas, Viagem, Hobbies, Outros.
-- -----------------------------------------------------------------------------
create table if not exists public.wishlist_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value text not null,
  label text not null,
  emoji text not null default '🛒',
  created_at timestamptz not null default now(),
  unique(user_id, value)
);

alter table public.wishlist_categories enable row level security;

drop policy if exists "Users view own wishlist_categories"   on public.wishlist_categories;
drop policy if exists "Users insert own wishlist_categories" on public.wishlist_categories;
drop policy if exists "Users update own wishlist_categories" on public.wishlist_categories;
drop policy if exists "Users delete own wishlist_categories" on public.wishlist_categories;

create policy "Users view own wishlist_categories"   on public.wishlist_categories for select using (auth.uid() = user_id);
create policy "Users insert own wishlist_categories" on public.wishlist_categories for insert with check (auth.uid() = user_id);
create policy "Users update own wishlist_categories" on public.wishlist_categories for update using (auth.uid() = user_id);
create policy "Users delete own wishlist_categories" on public.wishlist_categories for delete using (auth.uid() = user_id);

create index if not exists idx_wishlist_categories_user on public.wishlist_categories(user_id);

-- -----------------------------------------------------------------------------
-- WISHLIST ITEMS
-- -----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'outros',
  name text not null,
  brand text,
  link text,
  image_url text,
  price numeric(12,2),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
  status text not null default 'querendo' check (status in ('querendo', 'comprado', 'desistido')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Users view own wishlist_items"   on public.wishlist_items;
drop policy if exists "Users insert own wishlist_items" on public.wishlist_items;
drop policy if exists "Users update own wishlist_items" on public.wishlist_items;
drop policy if exists "Users delete own wishlist_items" on public.wishlist_items;

create policy "Users view own wishlist_items"   on public.wishlist_items for select using (auth.uid() = user_id);
create policy "Users insert own wishlist_items" on public.wishlist_items for insert with check (auth.uid() = user_id);
create policy "Users update own wishlist_items" on public.wishlist_items for update using (auth.uid() = user_id);
create policy "Users delete own wishlist_items" on public.wishlist_items for delete using (auth.uid() = user_id);

create index if not exists idx_wishlist_user_category on public.wishlist_items(user_id, category);
create index if not exists idx_wishlist_user_status on public.wishlist_items(user_id, status);

create or replace function public.wishlist_items_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists wishlist_items_set_updated_at on public.wishlist_items;
create trigger wishlist_items_set_updated_at
  before update on public.wishlist_items
  for each row execute function public.wishlist_items_touch_updated_at();

-- -----------------------------------------------------------------------------
-- BABY NAMES (Nomes que estamos pensando)
-- -----------------------------------------------------------------------------
create table if not exists public.baby_names (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  gender text not null default 'unissex' check (gender in ('menino', 'menina', 'unissex')),
  favorite boolean not null default false,
  origin text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.baby_names enable row level security;

drop policy if exists "Users view own baby_names"   on public.baby_names;
drop policy if exists "Users insert own baby_names" on public.baby_names;
drop policy if exists "Users update own baby_names" on public.baby_names;
drop policy if exists "Users delete own baby_names" on public.baby_names;

create policy "Users view own baby_names"   on public.baby_names for select using (auth.uid() = user_id);
create policy "Users insert own baby_names" on public.baby_names for insert with check (auth.uid() = user_id);
create policy "Users update own baby_names" on public.baby_names for update using (auth.uid() = user_id);
create policy "Users delete own baby_names" on public.baby_names for delete using (auth.uid() = user_id);

create index if not exists idx_baby_names_user_created on public.baby_names(user_id, created_at desc);
create index if not exists idx_baby_names_user_favorite on public.baby_names(user_id, favorite);

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET: wishlist-photos (public read, per-user write)
-- Path convention: {user_id}/{uuid}.jpg
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('wishlist-photos', 'wishlist-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read wishlist photos"      on storage.objects;
drop policy if exists "Users upload own wishlist photos" on storage.objects;
drop policy if exists "Users update own wishlist photos" on storage.objects;
drop policy if exists "Users delete own wishlist photos" on storage.objects;

create policy "Public read wishlist photos"
  on storage.objects for select
  using (bucket_id = 'wishlist-photos');

create policy "Users upload own wishlist photos"
  on storage.objects for insert
  with check (
    bucket_id = 'wishlist-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own wishlist photos"
  on storage.objects for update
  using (
    bucket_id = 'wishlist-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own wishlist photos"
  on storage.objects for delete
  using (
    bucket_id = 'wishlist-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
