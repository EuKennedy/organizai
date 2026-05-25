-- =============================================================================
-- V13: Financial goal enhancements — deadline + emoji
--
-- deadline: data-alvo para concluir a meta. Habilita o breakdown inteligente
--           (por dia / semana / mês) e o checklist mensal gamificado.
-- emoji:    ícone customizado exibido no centro do progress ring.
--
-- Idempotente.
-- =============================================================================

alter table public.financial_goals
  add column if not exists deadline timestamptz,
  add column if not exists emoji text;
