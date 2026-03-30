-- Migração: Portfolio Rebalancing
-- Execução: Supabase Dashboard > SQL Editor

-- Tabela de ativos com alocação-alvo
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker     TEXT NOT NULL,
  label      TEXT,
  target_pct NUMERIC(5,2) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
  current_value_cad NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_value_cad >= 0),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, ticker)
);

ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_assets" ON portfolio_assets
  FOR ALL
  USING (auth.uid() = user_id);

-- Tabela de estado do portfólio (valor total informado manualmente)
CREATE TABLE IF NOT EXISTS portfolio_state (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_invested NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_invested >= 0),
  currency       TEXT DEFAULT 'CAD',
  last_contribution_amount NUMERIC(14,2),
  last_projected_total NUMERIC(14,2),
  last_remaining NUMERIC(14,2),
  last_orders JSONB,
  last_chart_data JSONB,
  last_calculated_at TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portfolio_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_state" ON portfolio_state
  FOR ALL
  USING (auth.uid() = user_id);

-- Seed inicial: VFV 65%, XEF 15%, XEC 10%, FBTC 10%
-- Executar após criar o usuário eduardo.ti.vix@gmail.com no Supabase Auth
-- Substituir '<USER_UUID>' pelo UUID real do usuário

-- INSERT INTO portfolio_assets (user_id, ticker, label, target_pct, current_value_cad) VALUES
--   ('<USER_UUID>', 'VFV',  'S&P 500 (CAD)',     65.00, 0),
--   ('<USER_UUID>', 'XEF',  'Internacional Dev',  15.00, 0),
--   ('<USER_UUID>', 'XEC',  'Mercados Emergentes',10.00, 0),
--   ('<USER_UUID>', 'FBTC', 'Bitcoin ETF',        10.00, 0)
-- ON CONFLICT DO NOTHING;
