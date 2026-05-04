-- =============================================================================
-- V10: Cor de destaque customizável do casal
--
-- Armazena só o "hue" (0-360 no espaço OKLCH). Os valores de luminosidade
-- e croma ficam fixos no frontend pra manter consistência visual entre as
-- cores. Null = coral padrão.
-- Idempotente.
-- =============================================================================

alter table public.couples
  add column if not exists accent_hue smallint
  check (accent_hue is null or (accent_hue >= 0 and accent_hue < 360));
