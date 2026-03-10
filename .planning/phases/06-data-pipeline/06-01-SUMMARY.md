---
phase: 06-data-pipeline
plan: "01"
subsystem: database
tags: [supabase, sql, rls, node-test, data-pipeline]
requires:
  - phase: 01-mkg-foundation
    provides: "Supabase migration style, service-role RLS pattern, and company-scoped backend persistence"
provides:
  - "Phase 6 Supabase schema for raw connector snapshots, daily KPI rows, and anomaly records"
  - "Append-only raw snapshot boundary enforced at the database layer"
  - "Backend service-role client surface and reusable Wave 0 pipeline test helpers"
affects: [06-02, 06-03, phase-06-data-pipeline, backend-server, kpi-aggregator, anomaly-detector]
tech-stack:
  added: []
  patterns: ["Append-only raw snapshot storage", "Service-role-only backend write surface", "Node built-in schema and client smoke tests"]
key-files:
  created:
    - /Users/yogs87/Documents/New project/marqq/database/migrations/data-pipeline.sql
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/data-pipeline-schema.test.js
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/data-pipeline-test-helpers.js
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/supabase.test.js
  modified:
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/supabase.js
key-decisions:
  - "Enforced connector_raw_snapshots append-only semantics with a trigger because service_role bypasses RLS"
  - "Kept company_kpi_daily as a real table rather than a PostgreSQL view so later aggregation plans can upsert facts safely"
  - "Added an explicit pipeline/admin client export instead of repurposing the anon supabase export used by legacy reads"
patterns-established:
  - "Phase 6 write paths must use pipelineSupabase or getPipelineWriteClient, never the anon supabase export"
  - "Wave 0 tests validate migration text contracts directly before any live Supabase verification"
requirements-completed: [PIPE-01]
duration: 12 min
completed: 2026-03-10
---

# Phase 6 Plan 01: Data Pipeline Foundation Summary

**Supabase pipeline schema with append-only raw snapshots, agent-safe KPI/anomaly tables, and an explicit backend service-role write boundary**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-10T11:27:30Z
- **Completed:** 2026-03-10T11:39:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added the Phase 6 migration creating `connector_raw_snapshots`, `company_kpi_daily`, and `company_anomalies` with indexes, uniqueness, SQL comments, RLS, and raw-data safety boundaries.
- Added Wave 0 migration contract coverage that verifies required tables, checks, uniqueness, RLS enablement, and the append-only raw snapshot boundary from migration text alone.
- Extended the backend Supabase module with a non-breaking service-role admin surface for future Phase 6 writes and added reusable fixture/mock helpers plus smoke coverage for that client boundary.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the Phase 6 Supabase migration for raw snapshots, KPI rows, and anomaly rows** - `7232fe6` (feat)
2. **Task 2: Update backend Supabase client support so service-only RLS can be used safely** - `63edbbd` (feat)

## Files Created/Modified
- `/Users/yogs87/Documents/New project/marqq/database/migrations/data-pipeline.sql` - Phase 6 schema foundation with append-only raw snapshot enforcement, KPI/anomaly tables, indexes, comments, and service-role RLS.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/data-pipeline-schema.test.js` - Node built-in migration contract coverage for Phase 6 schema guarantees.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/supabase.js` - Shared backend Supabase client module with explicit service-role pipeline client exports and non-fatal fallback logging.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/data-pipeline-test-helpers.js` - Shared Wave 0 fixture builders, client doubles, logger capture, and fixed-clock utilities for later Phase 6 tests.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/supabase.test.js` - Smoke coverage for anon/admin client creation, missing-service-key warnings, and the pipeline write client contract.

## Decisions Made

- Used a database trigger to block updates and deletes on `connector_raw_snapshots`, because RLS alone cannot guarantee append-only semantics against a service-role client.
- Kept `company_kpi_daily` as a table with nullable numeric metrics so later aggregation work can upsert incomplete or partial KPI sets without schema churn.
- Exposed `supabaseAdmin`, `pipelineSupabase`, and `getPipelineWriteClient()` while preserving the existing `supabase` export for legacy code paths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added trigger-based append-only enforcement for raw snapshots**
- **Found during:** Task 1 (Author the Phase 6 Supabase migration for raw snapshots, KPI rows, and anomaly rows)
- **Issue:** Service-role writes bypass RLS, so insert-only policies alone would not stop later code from mutating raw connector payload rows.
- **Fix:** Added `prevent_connector_raw_snapshot_mutation()` and a `BEFORE UPDATE OR DELETE` trigger to enforce append-only semantics in the database itself.
- **Files modified:** `database/migrations/data-pipeline.sql`, `platform/content-engine/data-pipeline-schema.test.js`
- **Verification:** `node --test platform/content-engine/data-pipeline-schema.test.js`
- **Committed in:** `7232fe6`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The deviation tightened the raw-data boundary required by the plan and prevented a service-role loophole. No scope creep.

## Issues Encountered

- `platform/content-engine/supabase.js` logs a missing-anon-key warning at module load in this workspace because no local Supabase env vars are configured. This is non-blocking and consistent with the existing fallback behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `06-02` can import `pipelineSupabase` or `getPipelineWriteClient()` for all KPI/anomaly writes without weakening RLS.
- `06-02` and `06-03` can reuse `buildSnapshotFixture`, `buildKpiFixture`, `buildAnomalyFixture`, `createSupabaseClientDouble`, and `createFixedClock` instead of rebuilding mocks.
- The migration is ready for manual application in Supabase SQL Editor before live pipeline verification.

## Self-Check: PASSED

- Found `.planning/phases/06-data-pipeline/06-01-SUMMARY.md`
- Found task commit `7232fe6`
- Found task commit `63edbbd`
