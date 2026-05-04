-- =============================================================================
-- V7: Couple sharing model + realtime
--
-- Transforms OrganizAI from "per-user" to "per-couple". Each user belongs to
-- one couple. All data (movies, mimos, wishlist, baby names, gallery,
-- letters, expenses, goals…) is scoped by `couple_id`, so both partners see
-- and edit the same content.
--
-- ALSO embeds V6 (wishlist + baby_names) idempotently — if you skipped v6,
-- this catches up automatically.
--
-- This migration is idempotent: safe to run multiple times.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- V6 CATCH-UP: wishlist + baby_names tables (in case they're missing)
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

alter table public.wishlist_categories enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.baby_names enable row level security;

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

insert into storage.buckets (id, name, public)
values ('wishlist-photos', 'wishlist-photos', true)
on conflict (id) do update set public = excluded.public;

-- -----------------------------------------------------------------------------
-- COUPLES
-- -----------------------------------------------------------------------------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nosso casal',
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couples enable row level security;

-- -----------------------------------------------------------------------------
-- COUPLE MEMBERS (junction)
-- A user belongs to at most one couple at a time. We don't enforce 1:1
-- because in the future we may support polycouples / family pods.
-- -----------------------------------------------------------------------------
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  avatar_color text,
  joined_at timestamptz not null default now(),
  primary key (user_id)
);

create index if not exists idx_couple_members_couple on public.couple_members(couple_id);
alter table public.couple_members enable row level security;

-- -----------------------------------------------------------------------------
-- COUPLE INVITES (one-shot codes to add a partner)
-- -----------------------------------------------------------------------------
create table if not exists public.couple_invites (
  code text primary key,
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_couple_invites_couple on public.couple_invites(couple_id);
alter table public.couple_invites enable row level security;

-- -----------------------------------------------------------------------------
-- HELPER: returns the current user's couple_id (single value)
-- SECURITY DEFINER so it can read couple_members without recursive RLS.
-- -----------------------------------------------------------------------------
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid() limit 1
$$;

grant execute on function public.current_couple_id() to authenticated;

-- -----------------------------------------------------------------------------
-- BACKFILL: every existing user without a couple gets a solo couple
-- -----------------------------------------------------------------------------
do $$
declare
  u record;
  new_couple_id uuid;
begin
  for u in
    select au.id, au.email
    from auth.users au
    left join public.couple_members cm on cm.user_id = au.id
    where cm.user_id is null
  loop
    insert into public.couples (name) values ('Nosso casal') returning id into new_couple_id;
    insert into public.couple_members (couple_id, user_id, display_name)
      values (new_couple_id, u.id, split_part(u.email, '@', 1));
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- COUPLES + MEMBERS RLS POLICIES
-- -----------------------------------------------------------------------------
drop policy if exists "Members view own couple"   on public.couples;
drop policy if exists "Members update own couple" on public.couples;
drop policy if exists "Authenticated create couple" on public.couples;

create policy "Members view own couple"
  on public.couples for select
  using (id = public.current_couple_id());

create policy "Members update own couple"
  on public.couples for update
  using (id = public.current_couple_id());

create policy "Authenticated create couple"
  on public.couples for insert
  with check (auth.uid() is not null);

drop policy if exists "Members view couple roster"   on public.couple_members;
drop policy if exists "Self insert couple membership" on public.couple_members;
drop policy if exists "Self update own membership"   on public.couple_members;
drop policy if exists "Self delete own membership"   on public.couple_members;

create policy "Members view couple roster"
  on public.couple_members for select
  using (couple_id = public.current_couple_id());

create policy "Self insert couple membership"
  on public.couple_members for insert
  with check (user_id = auth.uid());

create policy "Self update own membership"
  on public.couple_members for update
  using (user_id = auth.uid());

create policy "Self delete own membership"
  on public.couple_members for delete
  using (user_id = auth.uid());

-- INVITES: members of the inviting couple can view + create.
--   Redemption happens via the redeem_couple_invite() RPC (security definer),
--   so we only expose minimal direct access.
drop policy if exists "Members view own invites"   on public.couple_invites;
drop policy if exists "Members create own invites" on public.couple_invites;
drop policy if exists "Members delete own invites" on public.couple_invites;

create policy "Members view own invites"
  on public.couple_invites for select
  using (couple_id = public.current_couple_id());

create policy "Members create own invites"
  on public.couple_invites for insert
  with check (couple_id = public.current_couple_id() and created_by = auth.uid());

create policy "Members delete own invites"
  on public.couple_invites for delete
  using (couple_id = public.current_couple_id());

-- -----------------------------------------------------------------------------
-- ADD couple_id + created_by TO ALL DATA TABLES
-- -----------------------------------------------------------------------------
alter table public.movies            add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.movies            add column if not exists created_by uuid references auth.users(id);

alter table public.series            add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.series            add column if not exists created_by uuid references auth.users(id);

alter table public.date_ideas        add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.date_ideas        add column if not exists created_by uuid references auth.users(id);

alter table public.transactions      add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.transactions      add column if not exists created_by uuid references auth.users(id);

alter table public.financial_goals   add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.financial_goals   add column if not exists created_by uuid references auth.users(id);

alter table public.goal_deposits     add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.goal_deposits     add column if not exists created_by uuid references auth.users(id);

alter table public.mimos             add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.mimos             add column if not exists created_by uuid references auth.users(id);

alter table public.mimo_categories   add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.mimo_categories   add column if not exists created_by uuid references auth.users(id);

alter table public.gallery_albums    add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.gallery_albums    add column if not exists created_by uuid references auth.users(id);

alter table public.gallery_photos    add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.gallery_photos    add column if not exists created_by uuid references auth.users(id);

alter table public.letters           add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.letters           add column if not exists created_by uuid references auth.users(id);

alter table public.wishlist_items    add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.wishlist_items    add column if not exists created_by uuid references auth.users(id);

alter table public.wishlist_categories add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.wishlist_categories add column if not exists created_by uuid references auth.users(id);

alter table public.baby_names        add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.baby_names        add column if not exists created_by uuid references auth.users(id);

-- -----------------------------------------------------------------------------
-- BACKFILL couple_id from existing user_id via couple_members
-- -----------------------------------------------------------------------------
update public.movies            m set couple_id = cm.couple_id, created_by = coalesce(m.created_by, m.user_id) from public.couple_members cm where cm.user_id = m.user_id and m.couple_id is null;
update public.series            s set couple_id = cm.couple_id, created_by = coalesce(s.created_by, s.user_id) from public.couple_members cm where cm.user_id = s.user_id and s.couple_id is null;
update public.date_ideas        d set couple_id = cm.couple_id, created_by = coalesce(d.created_by, d.user_id) from public.couple_members cm where cm.user_id = d.user_id and d.couple_id is null;
update public.transactions      t set couple_id = cm.couple_id, created_by = coalesce(t.created_by, t.user_id) from public.couple_members cm where cm.user_id = t.user_id and t.couple_id is null;
update public.financial_goals   g set couple_id = cm.couple_id, created_by = coalesce(g.created_by, g.user_id) from public.couple_members cm where cm.user_id = g.user_id and g.couple_id is null;
update public.goal_deposits     d set couple_id = cm.couple_id, created_by = coalesce(d.created_by, d.user_id) from public.couple_members cm where cm.user_id = d.user_id and d.couple_id is null;
update public.mimos             m set couple_id = cm.couple_id, created_by = coalesce(m.created_by, m.user_id) from public.couple_members cm where cm.user_id = m.user_id and m.couple_id is null;
update public.mimo_categories   c set couple_id = cm.couple_id, created_by = coalesce(c.created_by, c.user_id) from public.couple_members cm where cm.user_id = c.user_id and c.couple_id is null;
update public.gallery_albums    a set couple_id = cm.couple_id, created_by = coalesce(a.created_by, a.user_id) from public.couple_members cm where cm.user_id = a.user_id and a.couple_id is null;
update public.gallery_photos    p set couple_id = cm.couple_id, created_by = coalesce(p.created_by, p.user_id) from public.couple_members cm where cm.user_id = p.user_id and p.couple_id is null;
update public.letters           l set couple_id = cm.couple_id, created_by = coalesce(l.created_by, l.user_id) from public.couple_members cm where cm.user_id = l.user_id and l.couple_id is null;
update public.wishlist_items    w set couple_id = cm.couple_id, created_by = coalesce(w.created_by, w.user_id) from public.couple_members cm where cm.user_id = w.user_id and w.couple_id is null;
update public.wishlist_categories c set couple_id = cm.couple_id, created_by = coalesce(c.created_by, c.user_id) from public.couple_members cm where cm.user_id = c.user_id and c.couple_id is null;
update public.baby_names        b set couple_id = cm.couple_id, created_by = coalesce(b.created_by, b.user_id) from public.couple_members cm where cm.user_id = b.user_id and b.couple_id is null;

-- -----------------------------------------------------------------------------
-- INDEXES on couple_id
-- -----------------------------------------------------------------------------
create index if not exists idx_movies_couple             on public.movies(couple_id);
create index if not exists idx_series_couple             on public.series(couple_id);
create index if not exists idx_date_ideas_couple         on public.date_ideas(couple_id);
create index if not exists idx_transactions_couple       on public.transactions(couple_id);
create index if not exists idx_financial_goals_couple    on public.financial_goals(couple_id);
create index if not exists idx_goal_deposits_couple      on public.goal_deposits(couple_id);
create index if not exists idx_mimos_couple              on public.mimos(couple_id);
create index if not exists idx_mimo_categories_couple    on public.mimo_categories(couple_id);
create index if not exists idx_gallery_albums_couple     on public.gallery_albums(couple_id);
create index if not exists idx_gallery_photos_couple     on public.gallery_photos(couple_id);
create index if not exists idx_letters_couple            on public.letters(couple_id);
create index if not exists idx_wishlist_items_couple     on public.wishlist_items(couple_id);
create index if not exists idx_wishlist_categories_couple on public.wishlist_categories(couple_id);
create index if not exists idx_baby_names_couple         on public.baby_names(couple_id);

-- -----------------------------------------------------------------------------
-- REPLACE RLS POLICIES on every data table
--   Old: where user_id = auth.uid()
--   New: where couple_id = current_couple_id()
-- -----------------------------------------------------------------------------

-- MOVIES
drop policy if exists "Users can view own movies"   on public.movies;
drop policy if exists "Users can insert own movies" on public.movies;
drop policy if exists "Users can update own movies" on public.movies;
drop policy if exists "Users can delete own movies" on public.movies;
drop policy if exists "Couple view movies"   on public.movies;
drop policy if exists "Couple insert movies" on public.movies;
drop policy if exists "Couple update movies" on public.movies;
drop policy if exists "Couple delete movies" on public.movies;
create policy "Couple view movies"   on public.movies for select using (couple_id = public.current_couple_id());
create policy "Couple insert movies" on public.movies for insert with check (couple_id = public.current_couple_id());
create policy "Couple update movies" on public.movies for update using (couple_id = public.current_couple_id());
create policy "Couple delete movies" on public.movies for delete using (couple_id = public.current_couple_id());

-- SERIES
drop policy if exists "Users can view own series"   on public.series;
drop policy if exists "Users can insert own series" on public.series;
drop policy if exists "Users can update own series" on public.series;
drop policy if exists "Users can delete own series" on public.series;
drop policy if exists "Couple view series"   on public.series;
drop policy if exists "Couple insert series" on public.series;
drop policy if exists "Couple update series" on public.series;
drop policy if exists "Couple delete series" on public.series;
create policy "Couple view series"   on public.series for select using (couple_id = public.current_couple_id());
create policy "Couple insert series" on public.series for insert with check (couple_id = public.current_couple_id());
create policy "Couple update series" on public.series for update using (couple_id = public.current_couple_id());
create policy "Couple delete series" on public.series for delete using (couple_id = public.current_couple_id());

-- DATE_IDEAS
drop policy if exists "Users can view own date ideas"   on public.date_ideas;
drop policy if exists "Users can insert own date ideas" on public.date_ideas;
drop policy if exists "Users can update own date ideas" on public.date_ideas;
drop policy if exists "Users can delete own date ideas" on public.date_ideas;
drop policy if exists "Couple view date_ideas"   on public.date_ideas;
drop policy if exists "Couple insert date_ideas" on public.date_ideas;
drop policy if exists "Couple update date_ideas" on public.date_ideas;
drop policy if exists "Couple delete date_ideas" on public.date_ideas;
create policy "Couple view date_ideas"   on public.date_ideas for select using (couple_id = public.current_couple_id());
create policy "Couple insert date_ideas" on public.date_ideas for insert with check (couple_id = public.current_couple_id());
create policy "Couple update date_ideas" on public.date_ideas for update using (couple_id = public.current_couple_id());
create policy "Couple delete date_ideas" on public.date_ideas for delete using (couple_id = public.current_couple_id());

-- TRANSACTIONS
drop policy if exists "Users can view own transactions"   on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
drop policy if exists "Couple view transactions"   on public.transactions;
drop policy if exists "Couple insert transactions" on public.transactions;
drop policy if exists "Couple update transactions" on public.transactions;
drop policy if exists "Couple delete transactions" on public.transactions;
create policy "Couple view transactions"   on public.transactions for select using (couple_id = public.current_couple_id());
create policy "Couple insert transactions" on public.transactions for insert with check (couple_id = public.current_couple_id());
create policy "Couple update transactions" on public.transactions for update using (couple_id = public.current_couple_id());
create policy "Couple delete transactions" on public.transactions for delete using (couple_id = public.current_couple_id());

-- FINANCIAL_GOALS
drop policy if exists "Users can view own financial goals"   on public.financial_goals;
drop policy if exists "Users can insert own financial goals" on public.financial_goals;
drop policy if exists "Users can update own financial goals" on public.financial_goals;
drop policy if exists "Users can delete own financial goals" on public.financial_goals;
drop policy if exists "Couple view financial_goals"   on public.financial_goals;
drop policy if exists "Couple insert financial_goals" on public.financial_goals;
drop policy if exists "Couple update financial_goals" on public.financial_goals;
drop policy if exists "Couple delete financial_goals" on public.financial_goals;
create policy "Couple view financial_goals"   on public.financial_goals for select using (couple_id = public.current_couple_id());
create policy "Couple insert financial_goals" on public.financial_goals for insert with check (couple_id = public.current_couple_id());
create policy "Couple update financial_goals" on public.financial_goals for update using (couple_id = public.current_couple_id());
create policy "Couple delete financial_goals" on public.financial_goals for delete using (couple_id = public.current_couple_id());

-- GOAL_DEPOSITS
drop policy if exists "Users can view own goal_deposits"   on public.goal_deposits;
drop policy if exists "Users can insert own goal_deposits" on public.goal_deposits;
drop policy if exists "Users can update own goal_deposits" on public.goal_deposits;
drop policy if exists "Users can delete own goal_deposits" on public.goal_deposits;
drop policy if exists "Couple view goal_deposits"   on public.goal_deposits;
drop policy if exists "Couple insert goal_deposits" on public.goal_deposits;
drop policy if exists "Couple update goal_deposits" on public.goal_deposits;
drop policy if exists "Couple delete goal_deposits" on public.goal_deposits;
create policy "Couple view goal_deposits"   on public.goal_deposits for select using (couple_id = public.current_couple_id());
create policy "Couple insert goal_deposits" on public.goal_deposits for insert with check (couple_id = public.current_couple_id());
create policy "Couple update goal_deposits" on public.goal_deposits for update using (couple_id = public.current_couple_id());
create policy "Couple delete goal_deposits" on public.goal_deposits for delete using (couple_id = public.current_couple_id());

-- MIMOS
drop policy if exists "Users can view own mimos"   on public.mimos;
drop policy if exists "Users can insert own mimos" on public.mimos;
drop policy if exists "Users can update own mimos" on public.mimos;
drop policy if exists "Users can delete own mimos" on public.mimos;
drop policy if exists "Couple view mimos"   on public.mimos;
drop policy if exists "Couple insert mimos" on public.mimos;
drop policy if exists "Couple update mimos" on public.mimos;
drop policy if exists "Couple delete mimos" on public.mimos;
create policy "Couple view mimos"   on public.mimos for select using (couple_id = public.current_couple_id());
create policy "Couple insert mimos" on public.mimos for insert with check (couple_id = public.current_couple_id());
create policy "Couple update mimos" on public.mimos for update using (couple_id = public.current_couple_id());
create policy "Couple delete mimos" on public.mimos for delete using (couple_id = public.current_couple_id());

-- MIMO_CATEGORIES
drop policy if exists "Users can view own mimo_categories"   on public.mimo_categories;
drop policy if exists "Users can insert own mimo_categories" on public.mimo_categories;
drop policy if exists "Users can update own mimo_categories" on public.mimo_categories;
drop policy if exists "Users can delete own mimo_categories" on public.mimo_categories;
drop policy if exists "Couple view mimo_categories"   on public.mimo_categories;
drop policy if exists "Couple insert mimo_categories" on public.mimo_categories;
drop policy if exists "Couple update mimo_categories" on public.mimo_categories;
drop policy if exists "Couple delete mimo_categories" on public.mimo_categories;
create policy "Couple view mimo_categories"   on public.mimo_categories for select using (couple_id = public.current_couple_id());
create policy "Couple insert mimo_categories" on public.mimo_categories for insert with check (couple_id = public.current_couple_id());
create policy "Couple update mimo_categories" on public.mimo_categories for update using (couple_id = public.current_couple_id());
create policy "Couple delete mimo_categories" on public.mimo_categories for delete using (couple_id = public.current_couple_id());

-- GALLERY_ALBUMS
drop policy if exists "Users view own albums"   on public.gallery_albums;
drop policy if exists "Users insert own albums" on public.gallery_albums;
drop policy if exists "Users update own albums" on public.gallery_albums;
drop policy if exists "Users delete own albums" on public.gallery_albums;
drop policy if exists "Couple view albums"   on public.gallery_albums;
drop policy if exists "Couple insert albums" on public.gallery_albums;
drop policy if exists "Couple update albums" on public.gallery_albums;
drop policy if exists "Couple delete albums" on public.gallery_albums;
create policy "Couple view albums"   on public.gallery_albums for select using (couple_id = public.current_couple_id());
create policy "Couple insert albums" on public.gallery_albums for insert with check (couple_id = public.current_couple_id());
create policy "Couple update albums" on public.gallery_albums for update using (couple_id = public.current_couple_id());
create policy "Couple delete albums" on public.gallery_albums for delete using (couple_id = public.current_couple_id());

-- GALLERY_PHOTOS
drop policy if exists "Users view own gallery photos"   on public.gallery_photos;
drop policy if exists "Users insert own gallery photos" on public.gallery_photos;
drop policy if exists "Users update own gallery photos" on public.gallery_photos;
drop policy if exists "Users delete own gallery photos" on public.gallery_photos;
drop policy if exists "Couple view gallery_photos"   on public.gallery_photos;
drop policy if exists "Couple insert gallery_photos" on public.gallery_photos;
drop policy if exists "Couple update gallery_photos" on public.gallery_photos;
drop policy if exists "Couple delete gallery_photos" on public.gallery_photos;
create policy "Couple view gallery_photos"   on public.gallery_photos for select using (couple_id = public.current_couple_id());
create policy "Couple insert gallery_photos" on public.gallery_photos for insert with check (couple_id = public.current_couple_id());
create policy "Couple update gallery_photos" on public.gallery_photos for update using (couple_id = public.current_couple_id());
create policy "Couple delete gallery_photos" on public.gallery_photos for delete using (couple_id = public.current_couple_id());

-- LETTERS
drop policy if exists "Users view own letters"   on public.letters;
drop policy if exists "Users insert own letters" on public.letters;
drop policy if exists "Users update own letters" on public.letters;
drop policy if exists "Users delete own letters" on public.letters;
drop policy if exists "Couple view letters"   on public.letters;
drop policy if exists "Couple insert letters" on public.letters;
drop policy if exists "Couple update letters" on public.letters;
drop policy if exists "Couple delete letters" on public.letters;
create policy "Couple view letters"   on public.letters for select using (couple_id = public.current_couple_id());
create policy "Couple insert letters" on public.letters for insert with check (couple_id = public.current_couple_id());
create policy "Couple update letters" on public.letters for update using (couple_id = public.current_couple_id());
create policy "Couple delete letters" on public.letters for delete using (couple_id = public.current_couple_id());

-- WISHLIST_ITEMS
drop policy if exists "Users view own wishlist_items"   on public.wishlist_items;
drop policy if exists "Users insert own wishlist_items" on public.wishlist_items;
drop policy if exists "Users update own wishlist_items" on public.wishlist_items;
drop policy if exists "Users delete own wishlist_items" on public.wishlist_items;
drop policy if exists "Couple view wishlist_items"   on public.wishlist_items;
drop policy if exists "Couple insert wishlist_items" on public.wishlist_items;
drop policy if exists "Couple update wishlist_items" on public.wishlist_items;
drop policy if exists "Couple delete wishlist_items" on public.wishlist_items;
create policy "Couple view wishlist_items"   on public.wishlist_items for select using (couple_id = public.current_couple_id());
create policy "Couple insert wishlist_items" on public.wishlist_items for insert with check (couple_id = public.current_couple_id());
create policy "Couple update wishlist_items" on public.wishlist_items for update using (couple_id = public.current_couple_id());
create policy "Couple delete wishlist_items" on public.wishlist_items for delete using (couple_id = public.current_couple_id());

-- WISHLIST_CATEGORIES
drop policy if exists "Users view own wishlist_categories"   on public.wishlist_categories;
drop policy if exists "Users insert own wishlist_categories" on public.wishlist_categories;
drop policy if exists "Users update own wishlist_categories" on public.wishlist_categories;
drop policy if exists "Users delete own wishlist_categories" on public.wishlist_categories;
drop policy if exists "Couple view wishlist_categories"   on public.wishlist_categories;
drop policy if exists "Couple insert wishlist_categories" on public.wishlist_categories;
drop policy if exists "Couple update wishlist_categories" on public.wishlist_categories;
drop policy if exists "Couple delete wishlist_categories" on public.wishlist_categories;
create policy "Couple view wishlist_categories"   on public.wishlist_categories for select using (couple_id = public.current_couple_id());
create policy "Couple insert wishlist_categories" on public.wishlist_categories for insert with check (couple_id = public.current_couple_id());
create policy "Couple update wishlist_categories" on public.wishlist_categories for update using (couple_id = public.current_couple_id());
create policy "Couple delete wishlist_categories" on public.wishlist_categories for delete using (couple_id = public.current_couple_id());

-- BABY_NAMES
drop policy if exists "Users view own baby_names"   on public.baby_names;
drop policy if exists "Users insert own baby_names" on public.baby_names;
drop policy if exists "Users update own baby_names" on public.baby_names;
drop policy if exists "Users delete own baby_names" on public.baby_names;
drop policy if exists "Couple view baby_names"   on public.baby_names;
drop policy if exists "Couple insert baby_names" on public.baby_names;
drop policy if exists "Couple update baby_names" on public.baby_names;
drop policy if exists "Couple delete baby_names" on public.baby_names;
create policy "Couple view baby_names"   on public.baby_names for select using (couple_id = public.current_couple_id());
create policy "Couple insert baby_names" on public.baby_names for insert with check (couple_id = public.current_couple_id());
create policy "Couple update baby_names" on public.baby_names for update using (couple_id = public.current_couple_id());
create policy "Couple delete baby_names" on public.baby_names for delete using (couple_id = public.current_couple_id());

-- -----------------------------------------------------------------------------
-- STORAGE: allow couple members to read/write photos in any member's folder.
-- Path is still {user_id}/...; we expand permission to anyone in the same couple.
-- -----------------------------------------------------------------------------
create or replace function public.path_user_couple(path text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.couple_members
   where user_id::text = (storage.foldername(path))[1]
   limit 1
$$;

grant execute on function public.path_user_couple(text) to authenticated;

-- mimos-photos
drop policy if exists "Users upload own mimos photos" on storage.objects;
drop policy if exists "Users update own mimos photos" on storage.objects;
drop policy if exists "Users delete own mimos photos" on storage.objects;
drop policy if exists "Couple write mimos photos"  on storage.objects;
drop policy if exists "Couple update mimos photos" on storage.objects;
drop policy if exists "Couple delete mimos photos" on storage.objects;
create policy "Couple write mimos photos"
  on storage.objects for insert
  with check (
    bucket_id = 'mimos-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple update mimos photos"
  on storage.objects for update
  using (
    bucket_id = 'mimos-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple delete mimos photos"
  on storage.objects for delete
  using (
    bucket_id = 'mimos-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );

-- gallery-photos
drop policy if exists "Users upload own gallery photos" on storage.objects;
drop policy if exists "Users update own gallery photos" on storage.objects;
drop policy if exists "Users delete own gallery photos" on storage.objects;
drop policy if exists "Couple write gallery photos"  on storage.objects;
drop policy if exists "Couple update gallery photos" on storage.objects;
drop policy if exists "Couple delete gallery photos" on storage.objects;
create policy "Couple write gallery photos"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple update gallery photos"
  on storage.objects for update
  using (
    bucket_id = 'gallery-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple delete gallery photos"
  on storage.objects for delete
  using (
    bucket_id = 'gallery-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );

-- wishlist-photos (replaces v6 per-user-only policies)
drop policy if exists "Public read wishlist photos"      on storage.objects;
drop policy if exists "Users upload own wishlist photos" on storage.objects;
drop policy if exists "Users update own wishlist photos" on storage.objects;
drop policy if exists "Users delete own wishlist photos" on storage.objects;
drop policy if exists "Couple write wishlist photos"  on storage.objects;
drop policy if exists "Couple update wishlist photos" on storage.objects;
drop policy if exists "Couple delete wishlist photos" on storage.objects;
create policy "Public read wishlist photos"
  on storage.objects for select
  using (bucket_id = 'wishlist-photos');
create policy "Couple write wishlist photos"
  on storage.objects for insert
  with check (
    bucket_id = 'wishlist-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple update wishlist photos"
  on storage.objects for update
  using (
    bucket_id = 'wishlist-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );
create policy "Couple delete wishlist photos"
  on storage.objects for delete
  using (
    bucket_id = 'wishlist-photos'
    and public.path_user_couple(name) = public.current_couple_id()
  );

-- -----------------------------------------------------------------------------
-- AUTO-CREATE A COUPLE ON SIGNUP
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user_couple()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_couple_id uuid;
begin
  if not exists (select 1 from public.couple_members where user_id = new.id) then
    insert into public.couples (name) values ('Nosso casal') returning id into new_couple_id;
    insert into public.couple_members (couple_id, user_id, display_name)
      values (new_couple_id, new.id, split_part(coalesce(new.email, ''), '@', 1));
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_couple on auth.users;
create trigger on_auth_user_created_couple
  after insert on auth.users
  for each row execute function public.handle_new_user_couple();

-- -----------------------------------------------------------------------------
-- INVITE RPCs
-- -----------------------------------------------------------------------------

-- Generate a fresh invite for the current couple.
create or replace function public.create_couple_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  new_code text;
begin
  cid := public.current_couple_id();
  if cid is null then raise exception 'Você ainda não tem um casal'; end if;

  -- 8-char base32-ish code
  new_code := upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=oO0lI', ''), 1, 8));

  insert into public.couple_invites (code, couple_id, created_by)
    values (new_code, cid, auth.uid());

  return new_code;
end;
$$;
grant execute on function public.create_couple_invite() to authenticated;

-- Redeem an invite. Merges current user's solo-couple data into the inviter's
-- couple, then re-points the user's membership.
create or replace function public.redeem_couple_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv          public.couple_invites%rowtype;
  current_cid  uuid;
  uid          uuid := auth.uid();
begin
  if uid is null then raise exception 'Não autenticado'; end if;

  select * into inv from public.couple_invites where code = upper(trim(invite_code));
  if not found then raise exception 'Convite inválido'; end if;
  if inv.used_at is not null then raise exception 'Convite já foi usado'; end if;
  if inv.expires_at < now() then raise exception 'Convite expirado'; end if;

  -- Already in target couple? noop.
  select couple_id into current_cid from public.couple_members where user_id = uid;
  if current_cid = inv.couple_id then return inv.couple_id; end if;

  if current_cid is not null then
    -- Move all of this user's data from solo couple to invite's couple.
    update public.movies            set couple_id = inv.couple_id where couple_id = current_cid;
    update public.series            set couple_id = inv.couple_id where couple_id = current_cid;
    update public.date_ideas        set couple_id = inv.couple_id where couple_id = current_cid;
    update public.transactions      set couple_id = inv.couple_id where couple_id = current_cid;
    update public.financial_goals   set couple_id = inv.couple_id where couple_id = current_cid;
    update public.goal_deposits     set couple_id = inv.couple_id where couple_id = current_cid;
    update public.mimos             set couple_id = inv.couple_id where couple_id = current_cid;
    update public.mimo_categories   set couple_id = inv.couple_id where couple_id = current_cid;
    update public.gallery_albums    set couple_id = inv.couple_id where couple_id = current_cid;
    update public.gallery_photos    set couple_id = inv.couple_id where couple_id = current_cid;
    update public.letters           set couple_id = inv.couple_id where couple_id = current_cid;
    update public.wishlist_items    set couple_id = inv.couple_id where couple_id = current_cid;
    update public.wishlist_categories set couple_id = inv.couple_id where couple_id = current_cid;
    update public.baby_names        set couple_id = inv.couple_id where couple_id = current_cid;

    -- Move membership.
    update public.couple_members set couple_id = inv.couple_id where user_id = uid;

    -- Drop old solo couple if no members remain.
    delete from public.couples
     where id = current_cid
       and not exists (select 1 from public.couple_members where couple_id = current_cid);
  else
    insert into public.couple_members (couple_id, user_id) values (inv.couple_id, uid);
  end if;

  update public.couple_invites set used_at = now(), used_by = uid where code = inv.code;
  return inv.couple_id;
end;
$$;
grant execute on function public.redeem_couple_invite(text) to authenticated;

-- -----------------------------------------------------------------------------
-- REALTIME: enable replication for shared tables
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'movies','series','date_ideas','transactions','financial_goals',
      'goal_deposits','mimos','mimo_categories','gallery_albums',
      'gallery_photos','letters','wishlist_items','wishlist_categories',
      'baby_names','couples','couple_members'
    ])
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      -- already in publication, fine
      null;
    when others then
      -- publication may not exist yet on fresh projects; ignore
      null;
    end;
  end loop;
end $$;
