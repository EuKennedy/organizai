-- =============================================================================
-- V9: Logo customizada do casal
--
-- Adiciona `logo_url` em couples + bucket público pra hospedar a imagem.
-- Idempotente.
-- =============================================================================

-- 1. Coluna no couples
alter table public.couples
  add column if not exists logo_url text;

-- 2. Bucket público pra logos
insert into storage.buckets (id, name, public)
values ('couple-logos', 'couple-logos', true)
on conflict (id) do update set public = excluded.public;

-- 3. Storage policies — qualquer membro do casal pode r/w/d na pasta {couple_id}/...
drop policy if exists "Public read couple logos"     on storage.objects;
drop policy if exists "Couple write couple logos"    on storage.objects;
drop policy if exists "Couple update couple logos"   on storage.objects;
drop policy if exists "Couple delete couple logos"   on storage.objects;

create policy "Public read couple logos"
  on storage.objects for select
  using (bucket_id = 'couple-logos');

create policy "Couple write couple logos"
  on storage.objects for insert
  with check (
    bucket_id = 'couple-logos'
    and (storage.foldername(name))[1] = public.current_couple_id()::text
  );

create policy "Couple update couple logos"
  on storage.objects for update
  using (
    bucket_id = 'couple-logos'
    and (storage.foldername(name))[1] = public.current_couple_id()::text
  );

create policy "Couple delete couple logos"
  on storage.objects for delete
  using (
    bucket_id = 'couple-logos'
    and (storage.foldername(name))[1] = public.current_couple_id()::text
  );
