-- database/migrations/workspace-context.sql
-- Run in Supabase Dashboard → SQL Editor
-- Stores onboarding / marketing context per workspace (replaces filesystem client_context/{userId}.md)

CREATE TABLE IF NOT EXISTS public.workspace_context (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company        TEXT NOT NULL DEFAULT '',
  website_url    TEXT NOT NULL DEFAULT '',
  industry       TEXT NOT NULL DEFAULT '',
  icp            TEXT NOT NULL DEFAULT '',
  competitors    TEXT NOT NULL DEFAULT '',
  primary_goal   TEXT NOT NULL DEFAULT '',
  goals          TEXT NOT NULL DEFAULT '',
  -- legacy columns kept for backward-compat with GeneralTab (campaigns, keywords)
  campaigns      TEXT NOT NULL DEFAULT '',
  keywords       TEXT NOT NULL DEFAULT '',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id)
);

-- Index for fast lookup by workspace
CREATE INDEX IF NOT EXISTS idx_workspace_context_workspace ON public.workspace_context(workspace_id);

-- RLS: workspace members can read/write their own context
ALTER TABLE public.workspace_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_context_select" ON public.workspace_context
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_context_upsert" ON public.workspace_context
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_workspace_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_context_updated_at
  BEFORE UPDATE ON public.workspace_context
  FOR EACH ROW EXECUTE FUNCTION update_workspace_context_updated_at();
