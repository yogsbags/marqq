-- ============================================================================
-- OUTCOME LEDGER — PREDICTION VERIFICATION + CALIBRATION LOOP
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor after the Phase 1/5/6 migrations.

CREATE TABLE IF NOT EXISTS outcome_ledger (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           TEXT        NOT NULL,
  company_id       TEXT        NOT NULL,
  agent            TEXT        NOT NULL,
  outcome_metric   TEXT        NOT NULL,
  baseline_value   NUMERIC,
  predicted_value  NUMERIC,
  actual_value     NUMERIC,
  variance_pct     NUMERIC,
  verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outcome_ledger_company_verified
  ON outcome_ledger (company_id, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_outcome_ledger_agent_verified
  ON outcome_ledger (agent, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_outcome_ledger_run_metric
  ON outcome_ledger (run_id, outcome_metric);

ALTER TABLE outcome_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outcome_ledger_service_role"
  ON outcome_ledger
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
