-- =============================================================================
-- V15: Date cost tiers + weekly budget
--
-- cost_tier: 1=barato, 2=médio, 3=caro. Drives weekly budget grouping.
-- estimated_cost: previsão de gasto pro rolê (define enquanto planeja).
-- actual_cost: gasto real (preenche depois de marcar como done).
--
-- date_tier_limits: teto R$ por tier (jsonb com chaves "1"/"2"/"3")
-- date_weekly_quota: quantos rolês de cada tier permitidos por semana
--
-- Slot consumido SOMENTE quando status='done' (confirmação explícita).
-- Idempotente.
-- =============================================================================

alter table public.date_ideas
  add column if not exists cost_tier smallint check (cost_tier is null or cost_tier between 1 and 3),
  add column if not exists estimated_cost numeric(10, 2),
  add column if not exists actual_cost numeric(10, 2);

alter table public.couples
  add column if not exists date_tier_limits jsonb not null default '{"1": 120, "2": 250, "3": 400}'::jsonb,
  add column if not exists date_weekly_quota jsonb not null default '{"1": 1, "2": 2, "3": 1}'::jsonb;
