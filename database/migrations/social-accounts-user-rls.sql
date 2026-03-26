-- social-accounts-user-rls.sql
-- Run after automations/migrations/005_social_accounts.sql and companies-workspace-scope.sql.
--
-- The stock migration only allows service_role. The app (SocialIntelPage) uses the anon
-- key + user JWT to insert/update social_accounts; add member-scoped policies.

-- Keep service-role full access if that policy exists
-- (do not drop "service_role_all_social_accounts" here)

drop policy if exists "workspace_members_manage_social_accounts" on public.social_accounts;

create policy "workspace_members_manage_social_accounts"
  on public.social_accounts
  for all
  using (
    company_id in (
      select c.id
      from public.companies c
      where c.workspace_id in (
        select wm.workspace_id
        from public.workspace_members wm
        where wm.user_id = auth.uid()
      )
    )
  )
  with check (
    company_id in (
      select c.id
      from public.companies c
      where c.workspace_id in (
        select wm.workspace_id
        from public.workspace_members wm
        where wm.user_id = auth.uid()
      )
    )
  );
