-- =============================================================================
-- V8: Web Push notifications
--
-- Subscriptions de Push (1 row por dispositivo) + triggers AFTER INSERT em
-- todas as tabelas de conteúdo. Cada trigger chama a Edge Function
-- `couple-push` via pg_net, que envia notificação pra todos os dispositivos
-- do casal — exceto pro autor da inserção.
--
-- Idempotente.
-- =============================================================================

-- pg_net + http extensions (Supabase já os disponibiliza, só ativa)
create extension if not exists pg_net;

-- -----------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS
--   Path: cada dispositivo (ex: "iPhone 15 da Júlia") = 1 row
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_label text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_couple on public.push_subscriptions(couple_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Self view subs"   on public.push_subscriptions;
drop policy if exists "Self insert subs" on public.push_subscriptions;
drop policy if exists "Self update subs" on public.push_subscriptions;
drop policy if exists "Self delete subs" on public.push_subscriptions;

create policy "Self view subs"   on public.push_subscriptions for select using (user_id = auth.uid());
create policy "Self insert subs" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "Self update subs" on public.push_subscriptions for update using (user_id = auth.uid());
create policy "Self delete subs" on public.push_subscriptions for delete using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- VAULT: webhook secret (para autenticar chamadas trigger -> edge function)
--   Não comitamos o valor; é setado via:
--     select vault.create_secret('SECRET_AQUI', 'organizai_push_webhook_secret');
--   Antes de aplicar essa migration, gera um secret e roda esse comando.
-- -----------------------------------------------------------------------------
create extension if not exists "supabase_vault" with schema vault;

-- Helper: tenta ler o secret. Se não existir ainda, retorna null
-- (e o trigger silenciosamente não dispara push — sistema fica safe by default).
create or replace function public.get_push_webhook_secret()
returns text
language sql
stable
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'organizai_push_webhook_secret' limit 1
$$;

-- -----------------------------------------------------------------------------
-- TRIGGER FUNCTION: fire-and-forget POST pra edge function
-- -----------------------------------------------------------------------------
create or replace function public.notify_couple_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  webhook_url text := 'https://dbyfyevuvavyfpyznkuy.supabase.co/functions/v1/couple-push';
  webhook_secret text;
  payload jsonb;
begin
  webhook_secret := public.get_push_webhook_secret();
  if webhook_secret is null then
    -- Sem secret configurado, não dispara (evita 401 na edge function)
    return NEW;
  end if;

  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'event', TG_OP
  );

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    ),
    body := payload,
    timeout_milliseconds := 5000
  );

  return NEW;
end;
$$;

-- -----------------------------------------------------------------------------
-- TRIGGERS em todas as tabelas de conteúdo
-- -----------------------------------------------------------------------------
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
    execute format('drop trigger if exists notify_push_%I on public.%I', t, t);
    execute format(
      'create trigger notify_push_%I after insert on public.%I for each row execute function public.notify_couple_push()',
      t, t
    );
  end loop;
end $$;
