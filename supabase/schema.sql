-- OrganizAI Database Schema
-- Run this in Supabase SQL Editor to set up all tables and RLS policies

-- =============================================================================
-- MOVIES
-- =============================================================================

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  original_title text not null default '',
  poster_path text,
  backdrop_path text,
  overview text not null default '',
  release_year integer not null default 0,
  genres text[] not null default '{}',
  tmdb_score numeric(3,1) not null default 0,
  director text,
  "cast" text[] not null default '{}',
  status text not null default 'want_to_watch' check (status in ('want_to_watch', 'watching', 'watched')),
  personal_rating integer check (personal_rating is null or (personal_rating >= 1 and personal_rating <= 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tmdb_id)
);

alter table public.movies enable row level security;

create policy "Users can view own movies"
  on public.movies for select
  using (auth.uid() = user_id);

create policy "Users can insert own movies"
  on public.movies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own movies"
  on public.movies for update
  using (auth.uid() = user_id);

create policy "Users can delete own movies"
  on public.movies for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- SERIES
-- =============================================================================

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  original_title text not null default '',
  poster_path text,
  backdrop_path text,
  overview text not null default '',
  first_air_year integer not null default 0,
  genres text[] not null default '{}',
  tmdb_score numeric(3,1) not null default 0,
  status text not null default 'want_to_watch' check (status in ('want_to_watch', 'watching', 'watched')),
  current_season integer,
  current_episode integer,
  personal_rating integer check (personal_rating is null or (personal_rating >= 1 and personal_rating <= 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tmdb_id)
);

alter table public.series enable row level security;

create policy "Users can view own series"
  on public.series for select
  using (auth.uid() = user_id);

create policy "Users can insert own series"
  on public.series for insert
  with check (auth.uid() = user_id);

create policy "Users can update own series"
  on public.series for update
  using (auth.uid() = user_id);

create policy "Users can delete own series"
  on public.series for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- DATE IDEAS
-- =============================================================================

create table if not exists public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  date_time timestamptz,
  expected_weather text check (expected_weather is null or expected_weather in ('sunny', 'rainy', 'snowy', 'cloudy')),
  maps_link text,
  place_name text,
  place_photos text[] not null default '{}',
  status text not null default 'idea' check (status in ('idea', 'scheduled', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.date_ideas enable row level security;

create policy "Users can view own date ideas"
  on public.date_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own date ideas"
  on public.date_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own date ideas"
  on public.date_ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete own date ideas"
  on public.date_ideas for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  category text not null,
  description text not null default '',
  date date not null default current_date,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- FINANCIAL GOALS
-- =============================================================================

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.financial_goals enable row level security;

create policy "Users can view own financial goals"
  on public.financial_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own financial goals"
  on public.financial_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own financial goals"
  on public.financial_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own financial goals"
  on public.financial_goals for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_movies_user_id on public.movies(user_id);
create index if not exists idx_movies_status on public.movies(user_id, status);
create index if not exists idx_series_user_id on public.series(user_id);
create index if not exists idx_series_status on public.series(user_id, status);
create index if not exists idx_date_ideas_user_id on public.date_ideas(user_id);
create index if not exists idx_date_ideas_status on public.date_ideas(user_id, status);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(user_id, date);
create index if not exists idx_transactions_type on public.transactions(user_id, type);
create index if not exists idx_financial_goals_user_id on public.financial_goals(user_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_movies_updated_at
  before update on public.movies
  for each row execute function public.handle_updated_at();

create trigger set_series_updated_at
  before update on public.series
  for each row execute function public.handle_updated_at();

create trigger set_date_ideas_updated_at
  before update on public.date_ideas
  for each row execute function public.handle_updated_at();

create trigger set_financial_goals_updated_at
  before update on public.financial_goals
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- MIMOS (Cosmetics / personal care wishlist)
-- =============================================================================

create table if not exists public.mimos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in (
    'olhos', 'iluminador', 'rosto', 'blush', 'boca',
    'skin_care', 'corpo', 'acessorios', 'piercings'
  )),
  brand text not null default '',
  name text not null,
  link text,
  image_url text,
  owned boolean not null default false,
  finished boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mimos enable row level security;

create policy "Users can view own mimos"
  on public.mimos for select
  using (auth.uid() = user_id);

create policy "Users can insert own mimos"
  on public.mimos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mimos"
  on public.mimos for update
  using (auth.uid() = user_id);

create policy "Users can delete own mimos"
  on public.mimos for delete
  using (auth.uid() = user_id);

create index if not exists idx_mimos_user_category on public.mimos(user_id, category);
create index if not exists idx_mimos_user_owned on public.mimos(user_id, owned);

create trigger set_mimos_updated_at
  before update on public.mimos
  for each row execute function public.handle_updated_at();
