-- =============================================================================
-- V4: Gallery (albums + photos) and Letters (cartinhas)
-- Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- GALLERY ALBUMS
-- -----------------------------------------------------------------------------
create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  layout text not null default 'masonry'
    check (layout in ('masonry', 'mosaic', 'collage', 'grid')),
  cover_photo_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery_albums enable row level security;

drop policy if exists "Users view own albums"   on public.gallery_albums;
drop policy if exists "Users insert own albums" on public.gallery_albums;
drop policy if exists "Users update own albums" on public.gallery_albums;
drop policy if exists "Users delete own albums" on public.gallery_albums;

create policy "Users view own albums"   on public.gallery_albums for select using (auth.uid() = user_id);
create policy "Users insert own albums" on public.gallery_albums for insert with check (auth.uid() = user_id);
create policy "Users update own albums" on public.gallery_albums for update using (auth.uid() = user_id);
create policy "Users delete own albums" on public.gallery_albums for delete using (auth.uid() = user_id);

create index if not exists idx_albums_user_created
  on public.gallery_albums(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- GALLERY PHOTOS
-- -----------------------------------------------------------------------------
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  width integer not null default 0,
  height integer not null default 0,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery_photos enable row level security;

drop policy if exists "Users view own gallery photos"   on public.gallery_photos;
drop policy if exists "Users insert own gallery photos" on public.gallery_photos;
drop policy if exists "Users update own gallery photos" on public.gallery_photos;
drop policy if exists "Users delete own gallery photos" on public.gallery_photos;

create policy "Users view own gallery photos"   on public.gallery_photos for select using (auth.uid() = user_id);
create policy "Users insert own gallery photos" on public.gallery_photos for insert with check (auth.uid() = user_id);
create policy "Users update own gallery photos" on public.gallery_photos for update using (auth.uid() = user_id);
create policy "Users delete own gallery photos" on public.gallery_photos for delete using (auth.uid() = user_id);

create index if not exists idx_photos_album_sort
  on public.gallery_photos(album_id, sort_order, created_at);
create index if not exists idx_photos_user on public.gallery_photos(user_id);

create or replace function public.gallery_albums_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gallery_albums_set_updated_at on public.gallery_albums;
create trigger gallery_albums_set_updated_at
  before update on public.gallery_albums
  for each row execute function public.gallery_albums_touch_updated_at();

-- -----------------------------------------------------------------------------
-- LETTERS (cartinhas)
-- -----------------------------------------------------------------------------
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  author text,
  recipient text,
  mood text not null default 'amor'
    check (mood in ('amor', 'saudade', 'celebracao', 'desabafo', 'apoio', 'desculpas', 'outro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.letters enable row level security;

drop policy if exists "Users view own letters"   on public.letters;
drop policy if exists "Users insert own letters" on public.letters;
drop policy if exists "Users update own letters" on public.letters;
drop policy if exists "Users delete own letters" on public.letters;

create policy "Users view own letters"   on public.letters for select using (auth.uid() = user_id);
create policy "Users insert own letters" on public.letters for insert with check (auth.uid() = user_id);
create policy "Users update own letters" on public.letters for update using (auth.uid() = user_id);
create policy "Users delete own letters" on public.letters for delete using (auth.uid() = user_id);

create index if not exists idx_letters_user_created
  on public.letters(user_id, created_at desc);

create or replace function public.letters_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists letters_set_updated_at on public.letters;
create trigger letters_set_updated_at
  before update on public.letters
  for each row execute function public.letters_touch_updated_at();

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET: gallery-photos (public read, per-user write)
-- Path convention: {user_id}/{album_id}/{uuid}.jpg
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery-photos', 'gallery-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read gallery photos"       on storage.objects;
drop policy if exists "Users upload own gallery photos"  on storage.objects;
drop policy if exists "Users update own gallery photos"  on storage.objects;
drop policy if exists "Users delete own gallery photos"  on storage.objects;

create policy "Public read gallery photos"
  on storage.objects for select
  using (bucket_id = 'gallery-photos');

create policy "Users upload own gallery photos"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own gallery photos"
  on storage.objects for update
  using (
    bucket_id = 'gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own gallery photos"
  on storage.objects for delete
  using (
    bucket_id = 'gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
