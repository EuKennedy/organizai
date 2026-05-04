-- =============================================================================
-- V11: Device-aware push notifications + UPDATE awareness
--
-- Permite mostrar "Júlia adicionou..." vs "Kennedy adicionou..." mesmo
-- quando vocês compartilham a MESMA conta auth. A diferenciação vem do
-- device de origem (iPhone vs Android) lido do header X-Device-Type que
-- o frontend manda em toda request, propagado via PostgREST -> trigger
-- -> edge function.
--
-- Também adiciona triggers AFTER UPDATE em tabelas onde mudanças de
-- status valem notif (movies, series, date_ideas, wishlist_items,
-- baby_names.favorite). O payload inclui OLD record para a edge function
-- detectar transições.
--
-- Idempotente.
-- =============================================================================

-- 1. Nomes de cada partner por device. Null = fallback pro display_name.
alter table public.couples
  add column if not exists iphone_partner_name text,
  add column if not exists android_partner_name text;

-- 2. Atualizar a função do trigger pra:
--    - Capturar OLD record em UPDATE
--    - Ler X-Device-Type header (vem do PostgREST)
--    - Encaminhar ambos pro edge function
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
  device_type text;
  old_record jsonb;
begin
  webhook_secret := public.get_push_webhook_secret();
  if webhook_secret is null then
    return coalesce(NEW, OLD);
  end if;

  -- Lê header X-Device-Type setado pelo frontend (iphone | android | desktop)
  begin
    device_type := nullif(
      current_setting('request.headers', true)::jsonb->>'x-device-type',
      ''
    );
  exception when others then
    device_type := null;
  end;

  -- Em UPDATE, queremos saber quais campos mudaram pra dar contexto
  if TG_OP = 'UPDATE' then
    old_record := to_jsonb(OLD);
  else
    old_record := null;
  end if;

  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', old_record,
    'event', TG_OP,
    'device_type', device_type
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

-- 3. UPDATE triggers — só dispara quando STATUS ou FAVORITE muda
--    (não enche o saco com edits triviais tipo virar notes)

-- movies: status muda
drop trigger if exists notify_push_movies_update on public.movies;
create trigger notify_push_movies_update
  after update of status on public.movies
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_couple_push();

-- series: status muda
drop trigger if exists notify_push_series_update on public.series;
create trigger notify_push_series_update
  after update of status on public.series
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_couple_push();

-- date_ideas: status muda
drop trigger if exists notify_push_date_ideas_update on public.date_ideas;
create trigger notify_push_date_ideas_update
  after update of status on public.date_ideas
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_couple_push();

-- wishlist_items: status muda
drop trigger if exists notify_push_wishlist_items_update on public.wishlist_items;
create trigger notify_push_wishlist_items_update
  after update of status on public.wishlist_items
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_couple_push();

-- baby_names: favorite muda
drop trigger if exists notify_push_baby_names_update on public.baby_names;
create trigger notify_push_baby_names_update
  after update of favorite on public.baby_names
  for each row
  when (OLD.favorite is distinct from NEW.favorite)
  execute function public.notify_couple_push();

-- mimos: owned ou finished muda (mais um case útil)
drop trigger if exists notify_push_mimos_update on public.mimos;
create trigger notify_push_mimos_update
  after update of owned, finished on public.mimos
  for each row
  when (OLD.owned is distinct from NEW.owned or OLD.finished is distinct from NEW.finished)
  execute function public.notify_couple_push();
