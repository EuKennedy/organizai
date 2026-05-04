-- =============================================================================
-- V12: Activity Feed foundation + Sealed Letters
--
-- 1) `created_device` em todas as tabelas de dados — permite mostrar
--    "Julia adicionou um filme" no activity feed mesmo com conta única.
--    BEFORE INSERT trigger captura X-Device-Type do header (mesmo
--    mecanismo do push notification).
--
-- 2) `letters.unlock_at` — cartinhas com tempo. Frontend bloqueia o body
--    enquanto Date.now() < unlock_at. Quando libera, ping de notif.
--
-- Idempotente.
-- =============================================================================

-- 1. Coluna created_device em todas as tabelas de dados
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'movies','series','date_ideas','transactions','financial_goals',
      'goal_deposits','mimos','mimo_categories','gallery_albums',
      'gallery_photos','letters','wishlist_items','wishlist_categories',
      'baby_names'
    ])
  loop
    execute format(
      'alter table public.%I add column if not exists created_device text',
      t
    );
  end loop;
end $$;

-- 2. BEFORE INSERT trigger function — captura device do header
create or replace function public.set_created_device()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  device text;
begin
  begin
    device := nullif(
      current_setting('request.headers', true)::jsonb->>'x-device-type',
      ''
    );
  exception when others then
    device := null;
  end;
  -- Só seta se a row ainda não tiver valor (permite override manual)
  if NEW.created_device is null then
    NEW.created_device := device;
  end if;
  return NEW;
end;
$$;

-- 3. Aplica BEFORE INSERT trigger em todas as 14 tabelas
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'movies','series','date_ideas','transactions','financial_goals',
      'goal_deposits','mimos','mimo_categories','gallery_albums',
      'gallery_photos','letters','wishlist_items','wishlist_categories',
      'baby_names'
    ])
  loop
    execute format('drop trigger if exists set_device_%I on public.%I', t, t);
    execute format(
      'create trigger set_device_%I before insert on public.%I for each row execute function public.set_created_device()',
      t, t
    );
  end loop;
end $$;

-- 4. Sealed letters: campo unlock_at
alter table public.letters
  add column if not exists unlock_at timestamptz;

-- Index pra query rápida de "letters que liberaram desde X"
create index if not exists idx_letters_unlock_at
  on public.letters(unlock_at) where unlock_at is not null;
