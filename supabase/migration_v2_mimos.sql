-- =============================================================================
-- MIMOS v2: Custom categories + image uploads (Supabase Storage)
-- Run this in Supabase SQL Editor.
-- Safe to run multiple times (idempotent).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Drop the hard-coded category CHECK constraint on public.mimos
--    We want users to be able to create custom categories (free text).
--    Validation now lives in application code + the mimo_categories table.
-- -----------------------------------------------------------------------------
alter table public.mimos
  drop constraint if exists mimos_category_check;

-- -----------------------------------------------------------------------------
-- 2) New table: public.mimo_categories (user-defined categories)
--    Defaults (olhos, iluminador, etc.) stay in application code.
--    Custom categories (unique per user) are stored here.
-- -----------------------------------------------------------------------------
create table if not exists public.mimo_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value text not null,
  label text not null,
  emoji text not null default '✨',
  created_at timestamptz not null default now(),
  unique(user_id, value)
);

alter table public.mimo_categories enable row level security;

drop policy if exists "Users can view own mimo_categories" on public.mimo_categories;
drop policy if exists "Users can insert own mimo_categories" on public.mimo_categories;
drop policy if exists "Users can update own mimo_categories" on public.mimo_categories;
drop policy if exists "Users can delete own mimo_categories" on public.mimo_categories;

create policy "Users can view own mimo_categories"
  on public.mimo_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own mimo_categories"
  on public.mimo_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mimo_categories"
  on public.mimo_categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own mimo_categories"
  on public.mimo_categories for delete
  using (auth.uid() = user_id);

create index if not exists idx_mimo_categories_user on public.mimo_categories(user_id);

-- -----------------------------------------------------------------------------
-- 3) Storage bucket: mimos-photos (public read, authenticated write)
--    Path convention: {user_id}/{uuid}.{ext}
--    Public so <img src> works without signed URLs. Non-sensitive content.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('mimos-photos', 'mimos-photos', true)
on conflict (id) do update set public = excluded.public;

-- Clean slate on policies
drop policy if exists "Public read mimos photos"       on storage.objects;
drop policy if exists "Users upload own mimos photos"  on storage.objects;
drop policy if exists "Users update own mimos photos"  on storage.objects;
drop policy if exists "Users delete own mimos photos"  on storage.objects;

-- Anyone can read (bucket is public)
create policy "Public read mimos photos"
  on storage.objects for select
  using (bucket_id = 'mimos-photos');

-- Authenticated users can only write under their own folder: {user_id}/...
create policy "Users upload own mimos photos"
  on storage.objects for insert
  with check (
    bucket_id = 'mimos-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own mimos photos"
  on storage.objects for update
  using (
    bucket_id = 'mimos-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own mimos photos"
  on storage.objects for delete
  using (
    bucket_id = 'mimos-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
