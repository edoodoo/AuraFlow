-- =============================================================
-- AuraFlow — Portfolio Rebalancing Migration (idempotente)
-- =============================================================
--
-- PASSO 0: obter user_id (rodar separado antes de colar este arquivo)
--
--   SELECT id, email FROM auth.users
--   WHERE email = 'eduardo.ti.vix@gmail.com';
--
--   Copie o UUID retornado e substitua 'SEU_USER_ID_AQUI' abaixo.
--
-- PASSO 1: rodar este arquivo no SQL Editor do Supabase
--   (pode ser re-executado sem erros graças ao IF NOT EXISTS
--    e DROP POLICY IF EXISTS)
--
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. TABELA: portfolio_assets
--    Ativos do portfólio com percentual-alvo de alocação
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portfolio_assets (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker     TEXT        NOT NULL,
  label      TEXT,
  target_pct NUMERIC(5,2) NOT NULL
               CONSTRAINT chk_target_pct CHECK (target_pct >= 0 AND target_pct <= 100),
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_ticker UNIQUE (user_id, ticker)
);

-- Índice para leituras por usuário (filtragem frequente)
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_user_id
  ON portfolio_assets (user_id)
  WHERE is_active = TRUE;

-- -------------------------------------------------------------
-- 2. TABELA: portfolio_state
--    Valor total investido informado manualmente pelo usuário
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portfolio_state (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_invested NUMERIC(14,2) NOT NULL DEFAULT 0
                   CONSTRAINT chk_total_invested CHECK (total_invested >= 0),
  currency       TEXT         NOT NULL DEFAULT 'CAD',
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_portfolio_state_user UNIQUE (user_id)
);

-- -------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- -------------------------------------------------------------

ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_state  ENABLE ROW LEVEL SECURITY;

-- portfolio_assets — políticas
DROP POLICY IF EXISTS "own_assets_select" ON portfolio_assets;
CREATE POLICY "own_assets_select" ON portfolio_assets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_assets_insert" ON portfolio_assets;
CREATE POLICY "own_assets_insert" ON portfolio_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_assets_update" ON portfolio_assets;
CREATE POLICY "own_assets_update" ON portfolio_assets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_assets_delete" ON portfolio_assets;
CREATE POLICY "own_assets_delete" ON portfolio_assets
  FOR DELETE USING (auth.uid() = user_id);

-- portfolio_state — políticas
DROP POLICY IF EXISTS "own_state_select" ON portfolio_state;
CREATE POLICY "own_state_select" ON portfolio_state
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_state_insert" ON portfolio_state;
CREATE POLICY "own_state_insert" ON portfolio_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_state_update" ON portfolio_state;
CREATE POLICY "own_state_update" ON portfolio_state
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_state_delete" ON portfolio_state;
CREATE POLICY "own_state_delete" ON portfolio_state
  FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 4. SEED — 4 ativos iniciais
--    Substitua 'SEU_USER_ID_AQUI' pelo UUID do PASSO 0
--    ON CONFLICT garante idempotência (re-run seguro)
-- -------------------------------------------------------------

INSERT INTO portfolio_assets (user_id, ticker, label, target_pct, is_active)
VALUES
  ('SEU_USER_ID_AQUI', 'VFV',  'S&P 500 (CAD)',        65.00, TRUE),
  ('SEU_USER_ID_AQUI', 'XEF',  'Internacional Dev',     15.00, TRUE),
  ('SEU_USER_ID_AQUI', 'XEC',  'Mercados Emergentes',   10.00, TRUE),
  ('SEU_USER_ID_AQUI', 'FBTC', 'Bitcoin ETF',           10.00, TRUE)
ON CONFLICT (user_id, ticker) DO NOTHING;

-- -------------------------------------------------------------
-- 5. VERIFICAÇÃO FINAL (resultado visível no SQL Editor)
-- -------------------------------------------------------------

SELECT
  'portfolio_assets' AS tabela,
  COUNT(*)           AS registros
FROM portfolio_assets
WHERE user_id = 'SEU_USER_ID_AQUI'

UNION ALL

SELECT
  'portfolio_state',
  COUNT(*)
FROM portfolio_state
WHERE user_id = 'SEU_USER_ID_AQUI';

COMMIT;
