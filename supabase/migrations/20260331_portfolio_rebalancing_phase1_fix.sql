-- =============================================================
-- AuraFlow — Rebalancing Phase 1 Fix
-- Adds real current position values per ETF and persists
-- the last calculation snapshot for route rehydration.
-- =============================================================

BEGIN;

ALTER TABLE portfolio_assets
  ADD COLUMN IF NOT EXISTS current_value_cad NUMERIC(14,2) NOT NULL DEFAULT 0
    CONSTRAINT chk_current_value_cad CHECK (current_value_cad >= 0);

ALTER TABLE portfolio_assets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE portfolio_state
  ADD COLUMN IF NOT EXISTS last_contribution_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS last_projected_total NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS last_remaining NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS last_orders JSONB,
  ADD COLUMN IF NOT EXISTS last_chart_data JSONB,
  ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMPTZ;

UPDATE portfolio_state ps
SET total_invested = COALESCE((
  SELECT SUM(pa.current_value_cad)
  FROM portfolio_assets pa
  WHERE pa.user_id = ps.user_id
    AND pa.is_active = TRUE
), 0);

COMMIT;
