-- =============================================================================
-- V5: User-controlled album ordering
-- Adds sort_order to gallery_albums. Seeds existing rows keeping current order
-- (most recent first) and then lets the app persist drag-reorders.
-- Idempotent.
-- =============================================================================

alter table public.gallery_albums
  add column if not exists sort_order integer not null default 0;

-- Seed: on first run, number rows by created_at DESC (newest = lowest sort_order
-- so it appears first). Only touches rows where sort_order is still 0 on all
-- rows for a user (meaning: never seeded).
do $$
begin
  if not exists (
    select 1 from public.gallery_albums where sort_order <> 0
  ) then
    with ranked as (
      select id,
             row_number() over (partition by user_id order by created_at desc) as rn
      from public.gallery_albums
    )
    update public.gallery_albums a
    set sort_order = r.rn
    from ranked r
    where a.id = r.id;
  end if;
end
$$;

create index if not exists idx_albums_user_sort
  on public.gallery_albums(user_id, sort_order, created_at desc);
