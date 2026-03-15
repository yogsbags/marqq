---
phase: quick-3
plan: 1
subsystem: agent-context
tags: [workspace, company-id, agent-run, settings, backend]
dependency_graph:
  requires: []
  provides: [workspace-as-company-id-fallback]
  affects: [AgentModuleShell, AccountsTab, agentContext, backend-agent-run]
tech_stack:
  added: []
  patterns: [workspace-context-hook, header-fallback]
key_files:
  created: []
  modified:
    - app/src/lib/agentContext.ts
    - app/src/components/agent/AgentModuleShell.tsx
    - app/src/components/settings/tabs/AccountsTab.tsx
    - platform/content-engine/backend-server.js
decisions:
  - "workspace.id is now the single source of truth for company_id when ACTIVE_COMPANY_KEY is absent"
  - "CompanySelector removed from AgentModuleShell — workspace badge shown instead"
  - "AccountsTab uses useWorkspace hook — all 3 API calls (load, connect, disconnect) scoped to activeWorkspace.id"
  - "Backend triple-fallback: body.company_id > x-workspace-id header > null"
metrics:
  duration: "~2 min"
  completed: "2026-03-16"
  tasks_completed: 4
  files_modified: 4
---

# Quick Task 3: Consolidate Workspace/Company — Make Works Summary

**One-liner:** workspace.id flows as company_id through every layer — context lib, agent shell, settings tab, and backend handler.

## What Was Done

Four targeted edits making workspace.id the single source of truth for company scope across the agent stack. Previously, agents could silently receive no company_id when a user had a workspace but no separate ACTIVE_COMPANY_KEY entry.

### Task 1 — agentContext.ts workspace fallback (commit: 096005e)

`getActiveAgentContext()` now returns workspace fallback values when `ACTIVE_COMPANY_KEY` is not set in localStorage:

- `companyId` falls back to `workspace.id`
- `companyName` falls back to `workspace.name`
- `websiteUrl` already had workspace fallback (unchanged)

`buildAgentRunPayload()` extended to triple-fallback for `company_id`:
```
payload.company_id → context.companyId → context.workspaceId → undefined
```

### Task 2 — AgentModuleShell.tsx workspace badge (commit: 8c34002)

- Removed `CompanySelector` import and dropdown UI
- Removed `getActiveAgentContext` import
- Added `useWorkspace` hook; `companyId` derived from `activeWorkspace?.id ?? ''`
- Replaced dropdown with read-only workspace badge: "Running for: [WorkspaceName]"
- Amber warning shown when no workspace is active
- `selectedOffer` reset via `useEffect` watching `activeWorkspace?.id`
- `CompanySelector.tsx` file untouched (still used in company-intelligence pages)

### Task 3 — AccountsTab.tsx useWorkspace hook (commit: b644e7c)

- Replaced `getActiveAgentContext` import with `useWorkspace`
- `load`, `connect`, `disconnect` all use `activeWorkspace?.id` as `companyId`
- `load` useCallback dependency updated to `[activeWorkspace]` so it re-fetches on workspace switch
- Amber guard shown before connector list when no workspace exists
- Error messages updated: "Create or select a workspace first" (more accurate than "Select a company first")

### Task 4 — backend-server.js header fallback (commit: f3c4a37)

In `POST /api/agents/:name/run`, `companyId` assignment updated:
```javascript
// Before
const companyId = (typeof company_id === "string" && company_id.trim())
  ? company_id.trim()
  : null;

// After
const companyId = (typeof company_id === "string" && company_id.trim())
  ? company_id.trim()
  : (typeof workspaceId === "string" && workspaceId.trim())
    ? workspaceId.trim()
    : null;
```

`workspaceId` was already extracted from `req.headers["x-workspace-id"]` above this block. The change simply promotes it as a fallback.

## Verification Results

- TypeScript build: exit 0 (no errors)
- Backend syntax: `node --check` passes
- `CompanySelector` not imported in AgentModuleShell: confirmed
- `getActiveAgentContext` not imported in AccountsTab: confirmed
- `app/src/components/agent/CompanySelector.tsx` unmodified: confirmed (115 lines diff = 0 content changes)

## Deviations from Plan

None — plan executed exactly as written.
