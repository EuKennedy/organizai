-- =============================================================================
-- V14: Priority + monthly savings capacity
--
-- priority: 1=baixa, 2=média (default), 3=alta. Drives smart allocation
--           algorithm — high priority + urgent deadlines get funded first.
-- monthly_capacity: quanto o casal pode guardar por mês. Habilita o
--                   alocador que distribui o orçamento entre metas.
--
-- Idempotente.
-- =============================================================================

alter table public.financial_goals
  add column if not exists priority smallint default 2 check (priority between 1 and 3);

alter table public.couples
  add column if not exists monthly_capacity numeric(12, 2);
