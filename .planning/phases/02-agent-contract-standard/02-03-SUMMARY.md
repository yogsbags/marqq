---
phase: 02-agent-contract-standard
plan: "03"
subsystem: api
tags: [supabase, agent-contract, persistence, sse, idempotency]

# Dependency graph
requires:
  - phase: 02-agent-contract-standard
    plan: "01"
    provides: "agent_run_outputs + agent_tasks DB schema, extractContract + validateContract functions"
  - phase: 02-agent-contract-standard
    plan: "02"
    provides: "stream-then-extract contract pattern, MKG patch block, fullText buffer in /api/agents/:name/run"
provides:
  - "saveAgentRunOutput() — inserts validated contract to agent_run_outputs with idempotent retry handling"
  - "createMissingDataTask() — auto-creates agent_tasks row when artifact.confidence < 0.5 (CONTRACT-03)"
  - "writeTasksCreated() — inserts agent_tasks rows from contract.tasks_created with triggered_by_run_id (CONTRACT-05)"
  - "Promise.allSettled persistence block in post-stream run endpoint (fires after MKG patch, before [DONE])"
affects:
  - phase: 03-outcome-ledger
  - phase: 04-agent-swarm

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-log: Supabase writes catch all errors, log them, never throw to SSE stream"
    - "Idempotent retry: 23505 unique_violation swallowed silently in saveAgentRunOutput"
    - "Promise.allSettled: all three Supabase writes fire in parallel; one failure does not abort others"
    - "Guard-and-return pattern: company_id=null or supabase=null guards at top of each helper"

key-files:
  created: []
  modified:
    - "platform/content-engine/backend-server.js"

key-decisions:
  - "Promise.allSettled used (not Promise.all) — one Supabase write failing must not abort the others"
  - "await on Promise.allSettled — writes complete before [DONE] is sent, so callers see fresh rows immediately"
  - "23505 unique_violation swallowed silently in saveAgentRunOutput — client retries are idempotent by design"
  - "All helpers skip silently when supabase=null or company_id=null — avoids FK errors, backward-compatible"

patterns-established:
  - "Agent contract persistence: save run output + auto-task + tasks_created in one Promise.allSettled block"
  - "Low-confidence auto-tasking: artifact.confidence < 0.5 threshold triggers missing_data task creation"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-03-10
---

# Phase 2 Plan 03: Agent Contract Persistence Summary

**Supabase persistence wired to agent run endpoint via three fire-and-log helpers: saveAgentRunOutput, createMissingDataTask (confidence < 0.5), and writeTasksCreated with triggered_by_run_id**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-10T09:37:30Z
- **Completed:** 2026-03-10T09:38:58Z
- **Tasks:** 2 complete (1 auto + 1 checkpoint:human-verify — approved)
- **Files modified:** 1

## Accomplishments

- Added `saveAgentRunOutput()` — inserts full contract to `agent_run_outputs`; 23505 unique violation swallowed for idempotent retries
- Added `createMissingDataTask()` — auto-creates `agent_tasks` row (task_type='missing_data', priority='high') when `artifact.confidence < 0.5`
- Added `writeTasksCreated()` — writes each item in `contract.tasks_created` as a separate `agent_tasks` row with `triggered_by_run_id` populated
- Wired `Promise.allSettled([saveAgentRunOutput, createMissingDataTask, writeTasksCreated])` in post-stream block, after MKG patch and before `[DONE]` event

## Task Commits

1. **Task 1: Add Supabase persistence helpers to backend-server.js** - `f6e1422` (feat)
2. **Task 2: Checkpoint — full Agent Contract Standard pipeline verification** - Approved by user (all 5 checks passed)

## Files Created/Modified

- `platform/content-engine/backend-server.js` — Three helper functions added before the `/api/agents/:name/run` route (~lines 2938-3030); `Promise.allSettled` persistence block added in post-stream section (~line 3225)

## Decisions Made

- `Promise.allSettled` chosen over `Promise.all` so one write failure does not abort the others
- `await` on `Promise.allSettled` ensures Supabase writes complete before `[DONE]` is sent (callers see fresh rows immediately after stream ends)
- `23505` unique_violation swallowed silently — client retries are safe by design (run_id UNIQUE constraint)
- All helpers use guard-and-return at top: `if (!supabase || !contract.company_id) return` — avoids FK errors on anonymous runs

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Supabase migration required (human step):**
Apply `database/migrations/agent-contract.sql` in Supabase SQL Editor before the persistence helpers can write rows. Until applied, Supabase writes fail silently (fire-and-log — does not break SSE stream).

The migration was planned in 02-01 and is documented in STATE.md pending todos.

## Phase 2 Success Criteria Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | POST /api/agents/:name/run returns response with all required AgentRunOutput fields | Implemented in 02-02 |
| 2 | Backend validator rejects malformed output (sends contractError event, not a crash) | Implemented in 02-01/02-02 |
| 3 | artifact.confidence < 0.5 auto-creates agent_tasks missing_data row with triggered_by_run_id | Implemented in 02-03 (this plan) |
| 4 | context_patch applied to MKG; GET /api/mkg/:companyId reflects update | Implemented in 02-02 |
| 5 | tasks_created items in Supabase agent_tasks with triggered_by_run_id populated | Implemented in 02-03 (this plan) |

**Checkpoint status:** Approved — all 5 verification checks passed (2026-03-10).

## Next Phase Readiness

- Agent Contract Standard pipeline is code-complete and verified across all three plans (02-01, 02-02, 02-03)
- Phase 2 checkpoint approved — all 5 success criteria confirmed by human verification
- Pending human step: apply `database/migrations/agent-contract.sql` in Supabase SQL Editor (non-blocking for stream; blocking for Supabase persistence to write rows)
- Phase 3 (Veena — Company Intelligence) is ready to begin

---
*Phase: 02-agent-contract-standard*
*Completed: 2026-03-10*
