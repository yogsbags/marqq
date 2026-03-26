-- workspace-rls-policies.sql
-- Run in Supabase SQL Editor after workspace.sql + companies-workspace-scope.sql.
--
-- Why: public.companies policies use
--   workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
-- That subquery runs as the logged-in user. If workspace_members has RLS enabled but no
-- SELECT policy, the subquery sees zero rows and companies with a non-null workspace_id
-- disappear for browser clients (and any anon+JWT query).
--
-- This file does NOT grant INSERT/UPDATE/DELETE on workspace_members/workspaces for the
-- browser — workspace mutations stay on the API (service role).

-- ── workspace_members ───────────────────────────────────────────────────────

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_select_self" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_coworkers" ON public.workspace_members;

-- Only own membership rows. Do NOT add a second policy that selects from
-- workspace_members inside USING (same-table subquery) — Postgres RLS will
-- recurse and error: "infinite recursion detected in policy for relation workspace_members".
-- Roster / other members: use the API (service role) or a SECURITY DEFINER function.
CREATE POLICY "workspace_members_select_self"
  ON public.workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

-- ── workspaces ──────────────────────────────────────────────────────────────

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;

-- Aligns with assembleMarketingContext / any direct client read of workspaces.
CREATE POLICY "workspaces_select_member"
  ON public.workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT wm.workspace_id
      FROM public.workspace_members AS wm
      WHERE wm.user_id = auth.uid()
    )
  );
