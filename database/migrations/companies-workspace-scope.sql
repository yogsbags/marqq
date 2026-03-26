-- database/migrations/companies-workspace-scope.sql
-- Run in Supabase Dashboard → SQL Editor
-- Scopes companies (and their artifacts) to workspaces.
--
-- If companies vanish for logged-in users after enabling RLS, run
-- workspace-rls-policies.sql so workspace_members / workspaces are readable
-- in policy subqueries (auth.uid() context).

-- 1. Add workspace_id to companies (nullable = backward compat with existing rows)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 2. Add workspace_id to company_artifacts table
ALTER TABLE public.company_artifacts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 3. Indexes for fast per-workspace lookups
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_company_artifacts_workspace ON public.company_artifacts(workspace_id);

-- 4. Tighten RLS on companies: users only see companies in their workspaces
--    (existing NULL rows remain visible to everyone until migrated)
DROP POLICY IF EXISTS "Enable all operations for anon and authenticated users on companies" ON public.companies;

CREATE POLICY "workspace_members_select" ON public.companies
  FOR SELECT USING (
    workspace_id IS NULL  -- legacy rows: still visible
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_insert" ON public.companies
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_update" ON public.companies
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_delete" ON public.companies
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
