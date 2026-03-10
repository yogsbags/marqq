-- ============================================================================
-- SWARM LAYER — COMPETITIVE INTELLIGENCE + WATCHDOG TELEMETRY
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor after the Hooks and MKG migrations.

CREATE TABLE IF NOT EXISTS swarm_watchdog_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            TEXT NOT NULL,
  company_id        TEXT NOT NULL,
  competitor_name   TEXT NOT NULL,
  connector_type    TEXT NOT NULL,
  delta_start       TIMESTAMPTZ,
  delta_end         TIMESTAMPTZ,
  fetched_count     INTEGER NOT NULL DEFAULT 0,
  processed_count   INTEGER NOT NULL DEFAULT 0,
  tokens_used       INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL
                   CHECK (status IN ('completed', 'skipped_no_delta', 'failed')),
  duration_ms       INTEGER NOT NULL DEFAULT 0,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swarm_watchdog_runs_run
  ON swarm_watchdog_runs (run_id);

CREATE INDEX IF NOT EXISTS idx_swarm_watchdog_runs_company_competitor
  ON swarm_watchdog_runs (company_id, competitor_name, created_at DESC);

ALTER TABLE swarm_watchdog_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swarm_watchdog_runs_service_role" ON swarm_watchdog_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS competitive_intelligence (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         TEXT NOT NULL,
  competitor_name    TEXT NOT NULL,
  week_of            DATE NOT NULL,
  summary            TEXT NOT NULL,
  themes             JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions            JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence         NUMERIC NOT NULL DEFAULT 0,
  haiku_count        INTEGER NOT NULL DEFAULT 0,
  filtered_count     INTEGER NOT NULL DEFAULT 0,
  sonnet_tokens      INTEGER NOT NULL DEFAULT 0,
  source_run_id      TEXT NOT NULL,
  source_agent       TEXT NOT NULL DEFAULT 'priya',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, competitor_name, week_of)
);

CREATE INDEX IF NOT EXISTS idx_competitive_intelligence_company_week
  ON competitive_intelligence (company_id, week_of DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_intelligence_run
  ON competitive_intelligence (source_run_id);

ALTER TABLE competitive_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitive_intelligence_service_role" ON competitive_intelligence
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
