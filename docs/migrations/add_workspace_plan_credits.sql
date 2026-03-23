-- Migration: Add plan + credits to workspaces
-- Run once in Supabase SQL editor

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'growth',
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS credits_total INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month');

-- Index for fast credit lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON workspaces(plan);
