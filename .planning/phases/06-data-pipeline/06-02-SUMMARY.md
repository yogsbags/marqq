---
phase: 06-data-pipeline
plan: "02"
subsystem: api
tags: [supabase, kpi, aggregation, node-test, data-pipeline]
requires:
  - phase: 06-data-pipeline
    provides: "Phase 6 schema, pipeline service-role client exports, and shared data-pipeline test helpers"
provides:
  - "KPI aggregation service that persists raw snapshot envelopes and upserts canonical daily KPI rows"
  - "Deterministic KPI math with null-safe denominator handling for CTR, CPC, CPL, CPA, and ROAS"
  - "Agent-safe KPI read helper rooted in company_kpi_daily with no raw payload exposure"
affects: [06-03, phase-06-data-pipeline, anomaly-detector, backend-server, kpi-api]
tech-stack:
  added: []
  patterns: ["Raw snapshot write plus blended KPI upsert", "Agent-safe reads from company_kpi_daily only", "node:test fixture coverage for null-safe KPI formulas and idempotency"]
key-files:
  created:
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/kpi-aggregator.js
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/kpi-aggregator.test.js
  modified: []
key-decisions:
  - "Aggregate each persisted snapshot into both source-scope and blended company_kpi_daily rows so downstream readers can stay on the KPI table."
  - "Deduplicate snapshots by id during aggregation so repeated ingestion runs remain idempotent at the KPI layer even if raw storage is append-only."
patterns-established:
  - "Later Phase 6 services should call listCompanyKpis or query company_kpi_daily directly, never connector_raw_snapshots."
  - "Mixed connector payloads stay opaque after extraction; only canonical KPI facts and source_snapshot_ids cross the service boundary."
requirements-completed: [PIPE-02]
duration: 4 min
completed: 2026-03-10
---

# Phase 6 Plan 02: KPI Aggregation Summary

**Raw snapshot ingestion with deterministic blended KPI upserts and a safe read surface on `company_kpi_daily`**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T11:42:00Z
- **Completed:** 2026-03-10T11:45:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added a dedicated KPI aggregation service that persists raw snapshot envelopes through the pipeline write client and upserts source-specific plus blended KPI rows.
- Implemented deterministic KPI math for spend, ROAS, CPL, CTR, CPC, and CPA with `NULL` outputs when denominators are impossible instead of fake zeroes.
- Added node-test fixture coverage for mixed-source aggregation, zero-denominator handling, idempotent repeated runs, and the safe KPI-only read contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement KPIAggregator raw snapshot ingestion and KPI upsert flow** - `3fb90d7` (feat)
2. **Task 2: Add deterministic fixture tests for KPI math, idempotency, and safe-read boundaries** - `84d7047` (test)

**Plan metadata:** pending

## Files Created/Modified
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/kpi-aggregator.js` - Phase 6 KPI aggregation service with raw snapshot persistence, mixed-source metric extraction, source/blended upsert logic, and safe KPI reads.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/kpi-aggregator.test.js` - Deterministic node-test coverage for blended KPI math, `NULL` denominators, idempotency, and KPI-only read surfaces.

## Decisions Made

- Kept connector payload extraction in JavaScript but pushed the canonical storage boundary to `company_kpi_daily`, matching the Phase 6 schema and keeping raw JSON opaque after extraction.
- Upserted both source-specific and blended rows on each aggregation run so later anomaly and API work can reuse the same table without recomputing daily blends.
- Returned only KPI-row-shaped objects from public helpers to keep raw connector payloads out of downstream agent and API surfaces.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The workspace has no local Supabase env vars, so `supabase.js` logs its existing non-fatal in-memory fallback warning during tests. Injected client doubles kept the aggregator verification deterministic and independent of live credentials.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `06-03` can consume `listCompanyKpis()` or query `company_kpi_daily` directly for anomaly baseline calculations without touching raw connector storage.
- The aggregation service already preserves `source_snapshot_ids`, which gives later anomaly or API code provenance without exposing payload JSON.

## Self-Check: PASSED

- Found `.planning/phases/06-data-pipeline/06-02-SUMMARY.md`
- Found task commit `84d7047`
- Found task commit `3fb90d7`
