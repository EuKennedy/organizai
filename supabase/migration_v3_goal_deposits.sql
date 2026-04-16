-- =============================================================================
-- GOAL DEPOSITS v3: track individual deposits per goal
-- Safe to run multiple times (idempotent).
-- =============================================================================

create table if not exists public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table public.goal_deposits enable row level security;

drop policy if exists "Users can view own goal_deposits"   on public.goal_deposits;
drop policy if exists "Users can insert own goal_deposits" on public.goal_deposits;
drop policy if exists "Users can update own goal_deposits" on public.goal_deposits;
drop policy if exists "Users can delete own goal_deposits" on public.goal_deposits;

create policy "Users can view own goal_deposits"
  on public.goal_deposits for select
  using (auth.uid() = user_id);

create policy "Users can insert own goal_deposits"
  on public.goal_deposits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goal_deposits"
  on public.goal_deposits for update
  using (auth.uid() = user_id);

create policy "Users can delete own goal_deposits"
  on public.goal_deposits for delete
  using (auth.uid() = user_id);

create index if not exists idx_goal_deposits_goal_created
  on public.goal_deposits(goal_id, created_at desc);

create index if not exists idx_goal_deposits_user
  on public.goal_deposits(user_id);
