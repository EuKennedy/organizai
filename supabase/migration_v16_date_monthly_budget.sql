-- =============================================================================
-- V16: Orçamento mensal de dates
--
-- date_monthly_budget: teto total R$ que o casal gasta com rolês por mês.
-- A quota por tier (date_weekly_quota) passa a ser interpretada como MENSAL
-- — o período do orçamento mudou de semanal pra mensal.
--
-- Idempotente.
-- =============================================================================

alter table public.couples
  add column if not exists date_monthly_budget numeric(10, 2) default 2000;
